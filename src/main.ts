import { LitElement, html, css, nothing, PropertyValues, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import {
  HASS,
  LovelaceCard,
  LovelaceCardEditor,
  StackInCardConfig,
} from './types';
import {
  createCardElement,
  computeCardSize,
  stripStackInCardFields,
  walkShadowAndLight,
} from './helpers';
import './editor';

const CHILD_STYLE_TAG_ID = 'stack-in-card-child-style';
const MOTHER_STYLE_TAG_ID = 'stack-in-card-mother-style';

export default class StackInCard extends LitElement implements LovelaceCard {
  @state() private _card?: LovelaceCard;
  @state() private _config?: StackInCardConfig;

  private _hass?: HASS;
  private _cardPromise?: Promise<LovelaceCard>;
  private _styleApplyHandle: ReturnType<typeof requestAnimationFrame> | null = null;
  private _childObserver?: MutationObserver;
  // Monotonic counter so out-of-order async createStack() calls cannot
  // overwrite a newer _card with an older one (rapid setConfig from the editor).
  private _stackGeneration = 0;

  static get styles() {
    return css`
      :host {
        display: block;
      }
      ha-card {
        overflow: hidden;
      }
      .stack-in-card-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 28px 16px;
        color: var(--secondary-text-color);
        text-align: center;
      }
      .stack-in-card-empty__icon {
        --mdc-icon-size: 36px;
        color: var(--secondary-text-color);
        opacity: 0.7;
      }
      .stack-in-card-empty__title {
        font-weight: 500;
        color: var(--primary-text-color);
        font-size: var(--ha-font-size-l, 16px);
      }
      .stack-in-card-empty__sub {
        font-size: var(--ha-font-size-s, 13px);
      }
    `;
  }

  static getConfigElement(): LovelaceCardEditor {
    return document.createElement('stack-in-card-editor') as LovelaceCardEditor;
  }

  static getStubConfig(): Partial<StackInCardConfig> {
    // Empty stub — matches HA's own vertical/horizontal stack. When the user
    // adds the card the editor opens directly into the card picker, no
    // placeholder children to delete first. The picker preview tile shows
    // our empty-state placeholder (see `render`), which resolves synchronously
    // so there's no perma-spinner.
    return { mode: 'vertical', cards: [] };
  }

  set hass(hass: HASS) {
    this._hass = hass;
    if (this._card) this._card.hass = hass;
  }

  get hass(): HASS | undefined {
    return this._hass;
  }

  public setConfig(config: StackInCardConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    // `cards` must be an array but is allowed to be empty — same as HA's own
    // vertical/horizontal stack. When empty, render() returns a synchronous
    // empty-state placeholder; the editor opens directly into the card picker.
    if (!Array.isArray(config.cards)) {
      throw new Error('stack-in-card: "cards" must be an array.');
    }
    if (config.mode && config.mode !== 'vertical' && config.mode !== 'horizontal') {
      throw new Error(`Unsupported mode "${config.mode}" (must be "vertical" or "horizontal")`);
    }

    this._config = {
      mode: 'vertical',
      ...config,
      keep: {
        background: false,
        margin: false,
        box_shadow: false,
        border_radius: false,
        ...(config.keep ?? {}),
      },
    };

    // Backwards-compat default: outer_padding defaults to true when margin is kept
    if (this._config.keep?.margin && this._config.keep?.outer_padding === undefined) {
      this._config.keep!.outer_padding = true;
    }

    this._createStack();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this._styleApplyHandle ?? 0);
    this._styleApplyHandle = null;
    this._childObserver?.disconnect();
    this._childObserver = undefined;
    this._cardPromise = undefined;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (!this._card) return;
    // Gate: only re-walk styles when something relevant changed. Without
    // this gate, any future @state addition would silently trigger a full
    // style pass on every Lit update.
    if (!changedProperties.has('_card') && !changedProperties.has('_config')) return;
    this._scheduleStyleApplication();
  }

  private _scheduleStyleApplication(): void {
    if (this._styleApplyHandle !== null) {
      cancelAnimationFrame(this._styleApplyHandle);
    }
    this._styleApplyHandle = requestAnimationFrame(() => {
      this._styleApplyHandle = null;
      this._applyAllStyles();
    });
  }

  private async _applyAllStyles(): Promise<void> {
    if (!this._card) return;

    // Pause mutation observation around our own DOM writes — otherwise our
    // injected <style> tags trigger childList mutations that loop us back
    // into _scheduleStyleApplication. We reconnect after pass 2.
    this._childObserver?.disconnect();

    // Wait for the stack to render its children
    const stack = this._card as unknown as LitElement;
    if (stack.updateComplete) {
      await stack.updateComplete;
    }

    // Pass 1: strip borders/backgrounds/margins on child cards
    this._walkChildren(this._card, false);
    this._injectChildStyles();
    this._injectMotherStyle();

    // Pass 2: re-walk after a microtask + frame to catch late-mounted shadow
    // roots, this time applying the background override too.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    this._walkChildren(this._card, true);
    if (this._config?.keep?.outer_padding && this._card?.shadowRoot) {
      const stackRoot = this._card.shadowRoot.getElementById('root');
      if (stackRoot) stackRoot.style.padding = '8px';
    }

    // (Re-)observe future async mutations from children (e.g. mushroom /
    // button-card mounting their inner ha-card later).
    this._ensureChildObserver();
  }

  private _ensureChildObserver(): void {
    if (this._childObserver || !this._card) return;
    const root = this._card.shadowRoot ?? this._card;
    this._childObserver = new MutationObserver(() => {
      // Coalesce bursts of mutations
      this._scheduleStyleApplication();
    });
    this._childObserver.observe(root, { childList: true, subtree: true });
  }

  private async _createStack(): Promise<void> {
    const generation = ++this._stackGeneration;

    // Tear down a previous observer before we swap the inner card out
    this._childObserver?.disconnect();
    this._childObserver = undefined;

    // Empty cards: nothing to build. render() will draw the placeholder
    // synchronously. We still clear `_card` so a transition from "had
    // children" → "now empty" (e.g. via YAML edit) flips to the placeholder.
    if (!this._config!.cards || this._config!.cards.length === 0) {
      this._card = undefined;
      this._cardPromise = undefined;
      return;
    }

    const stackType = `${this._config!.mode}-stack`;
    // Strip our own `styles` field from each child config before handing it
    // to HA's stack — HA's strict config validators would otherwise reject
    // the unknown property on some card types.
    const childConfigs = this._config!.cards.map(stripStackInCardFields);
    const promise = createCardElement(
      { type: stackType, cards: childConfigs },
      this._hass,
    );
    this._cardPromise = promise;

    let element: LovelaceCard;
    try {
      element = await promise;
    } catch (err) {
      console.error('stack-in-card: failed to create stack', err);
      return;
    }

    // Drop the result if a newer setConfig() has already kicked off another
    // createStack() while we were awaiting.
    if (generation !== this._stackGeneration) return;

    // Ensure the freshest hass is on the element (the value may have changed
    // between scheduling and resolution).
    if (this._hass) element.hass = this._hass;

    this._card = element;

    // Handle the "ll-rebuild" event the same way HA's built-in cards do
    element.addEventListener(
      'll-rebuild',
      (ev) => {
        ev.stopPropagation();
        this._createStack();
      },
      { once: true },
    );
  }

  protected render(): TemplateResult | typeof nothing {
    // Bail out synchronously when hass isn't ready yet — this is what
    // well-behaved cards (mushroom, button-card) do. It also keeps the
    // picker preview from getting stuck on an empty ha-card frame.
    if (!this._hass || !this._config) return nothing;

    const cards = this._config.cards ?? [];
    if (cards.length === 0) {
      // Empty-state placeholder — matches HA's own vertical/horizontal stack
      // showing an "Empty card" warning in preview. Renders synchronously so
      // the Lovelace picker preview tile resolves immediately.
      return html`
        <ha-card header=${ifDefined(this._config.title)}>
          <div class="stack-in-card-empty">
            <ha-svg-icon
              class="stack-in-card-empty__icon"
              .path=${'M20 14H14V20H10V14H4V10H10V4H14V10H20V14Z'}
            ></ha-svg-icon>
            <div class="stack-in-card-empty__title">Stack In Card</div>
            <div class="stack-in-card-empty__sub">
              Add child cards from the editor.
            </div>
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card header=${ifDefined(this._config.title)}>
        <div class="stack-in-card-content">${this._card ?? ''}</div>
      </ha-card>
    `;
  }

  /**
   * Recursively walk into the child stack to strip background / margin / shadow
   * / border-radius from inner ha-card elements according to the `keep` config.
   */
  private _walkChildren(element: LovelaceCard | undefined, withBackground: boolean): void {
    if (!element) return;

    const visit = (el: any): void => {
      if (!el) return;
      // Don't recurse into nested stack-in-card – it manages its own children
      if (el.tagName === 'STACK-IN-CARD') return;

      // If this element has a shadowRoot with an ha-card directly, style it
      if (el.shadowRoot) {
        const haCard = el.shadowRoot.querySelector('ha-card');
        if (haCard) {
          this._applyCardStyle(haCard, withBackground);
        } else {
          // Otherwise look for stack roots and recurse
          const root =
            el.shadowRoot.getElementById('root') || el.shadowRoot.getElementById('card');
          if (root) {
            this._stripMargin(root);
            root.childNodes.forEach((n: ChildNode) => visit(n));
          }
        }
      } else if (typeof el.querySelector === 'function') {
        const haCard = el.querySelector('ha-card');
        if (haCard) this._applyCardStyle(haCard, withBackground);
        el.childNodes?.forEach((n: ChildNode) => visit(n));
      }
    };

    visit(element);
  }

  private _stripMargin(el: any): void {
    if (!el || this._config?.keep?.margin) return;
    if (el.style) el.style.margin = '0px';
  }

  private _applyCardStyle(haCard: HTMLElement, withBackground: boolean): void {
    if (!haCard) return;
    const keep = this._config?.keep ?? {};
    if (!keep.box_shadow) haCard.style.boxShadow = 'none';
    if (
      !keep.background &&
      withBackground &&
      getComputedStyle(haCard).getPropertyValue('--keep-background').trim() !== 'true'
    ) {
      haCard.style.background = 'transparent';
    }
    if (!keep.border_radius) haCard.style.borderRadius = '0';
  }

  /**
   * Apply user-defined CSS for the "mother" card (the stack-in-card itself).
   * Injected into our own shadowRoot.
   */
  private _injectMotherStyle(): void {
    if (!this.shadowRoot) return;

    const css = this._config?.styles?.trim();

    let tag = this.shadowRoot.getElementById(MOTHER_STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!css) {
      if (tag) tag.remove();
      return;
    }
    if (!tag) {
      tag = document.createElement('style');
      tag.id = MOTHER_STYLE_TAG_ID;
      this.shadowRoot.appendChild(tag);
    }
    if (tag.textContent !== css) tag.textContent = css;
  }

  /**
   * Apply per-child user-defined CSS. The proven approach used by the
   * working ha-stack-in-card reference implementation is to brute-force
   * inject the <style> tag into every shadow root + every light-DOM
   * subtree of the target child card. That way, no matter where the
   * child's ha-card lives in the nested element hierarchy, our CSS
   * reaches it.
   *
   * We also retry up to 10 times with a 500ms delay because some custom
   * cards (mushroom, button-card) mount their internal ha-card
   * asynchronously after their first render.
   */
  private _injectChildStyles(): void {
    if (!this._card) return;
    const stackRoot = this._card.shadowRoot;
    if (!stackRoot) return;

    // Per-child styles live on each child's config: `cards[i].styles`. This
    // means the CSS travels with the card itself — reorder/copy/paste of a
    // child preserves its styling without needing a parallel index array.
    const childConfigs = this._config?.cards ?? [];

    // The inner stack renders its children inside <div id="root">
    const root = stackRoot.getElementById('root');
    if (!root) return;

    const children = Array.from(root.children) as HTMLElement[];
    children.forEach((child, index) => {
      const cssText = childConfigs[index]?.styles?.trim();
      this._applyChildCss(child, cssText, 0);
    });
  }

  private _applyChildCss(child: HTMLElement, cssText: string | undefined, attempt: number): void {
    // Always clear stale injected tags first so an empty cssText actually
    // removes the previous CSS.
    walkShadowAndLight(child, (node) => {
      const tag = (node as any).querySelector?.(`#${CHILD_STYLE_TAG_ID}`);
      tag?.remove();
    });
    if (!cssText) return;

    // Brute-force inject into every shadow root + light-DOM node.
    let foundShadow = false;
    walkShadowAndLight(child, (node) => {
      if (node instanceof ShadowRoot) foundShadow = true;
      this._writeStyleTag(node, cssText);
    });

    // Retry if no shadow root has mounted yet (mushroom/button-card mount
    // their internal ha-card asynchronously).
    if (!foundShadow && attempt < 10) {
      setTimeout(() => this._applyChildCss(child, cssText, attempt + 1), 500);
    }
  }

  private _writeStyleTag(root: ShadowRoot | HTMLElement, cssText: string): void {
    let tag = (root as any).querySelector?.(`#${CHILD_STYLE_TAG_ID}`) as
      | HTMLStyleElement
      | null
      | undefined;
    if (!tag) {
      tag = document.createElement('style');
      tag.id = CHILD_STYLE_TAG_ID;
      (root as any).appendChild(tag);
    }
    if (tag.textContent !== cssText) tag.textContent = cssText;
  }

  public async getCardSize(): Promise<number> {
    if (this._cardPromise) await this._cardPromise;
    if (!this._card) return 1;
    return computeCardSize(this._card);
  }
}
