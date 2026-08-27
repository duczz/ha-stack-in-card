import { LitElement, html, css, nothing, PropertyValues, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { mdiPlusThick } from '@mdi/js';

import {
  HASS,
  LovelaceCard,
  LovelaceCardEditor,
  StackInCardConfig,
} from './types';
import {
  createCardElement,
  computeCardSize,
  isStackInCardConfig,
  stripStackInCardFields,
  walkShadowAndLight,
} from './helpers';
import './editor';

// Shared prefix for every <style> tag we inject (mother + per-child). The
// mutation observer uses it to recognise our own writes and skip them, so our
// CSS injection can't feed back into an endless reschedule loop.
const STYLE_TAG_ID_PREFIX = 'stack-in-card-';
const MOTHER_STYLE_TAG_ID = 'stack-in-card-mother-style';

// Monotonic instance counter → each StackInCard gets a unique per-child style
// tag id. Two *nested* stack-in-cards would otherwise share the constant id
// 'stack-in-card-child-style': the outer card's cleanup pass walks into the
// inner card's subtree and would delete the inner card's injected <style>
// tags (and vice-versa). A per-instance id keeps each card's cleanup scoped
// to its own tags.
let instanceCounter = 0;

export default class StackInCard extends LitElement implements LovelaceCard {
  @state() private _card?: LovelaceCard;
  @state() private _config?: StackInCardConfig;

  private _hass?: HASS;
  private _cardPromise?: Promise<LovelaceCard>;
  private _styleApplyRafHandle: ReturnType<typeof requestAnimationFrame> | null = null;
  private _styleApplyTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private _childObserver?: MutationObserver;
  // Tracks pending _applyChildCss retry timeouts so they can be cancelled
  // when the stack is rebuilt or the element is disconnected, preventing
  // stale CSS injection into new or removed card structures.
  private _retryTimeouts = new Set<ReturnType<typeof setTimeout>>();
  // Monotonic counter so out-of-order async createStack() calls cannot
  // overwrite a newer _card with an older one (rapid setConfig from the editor).
  private _stackGeneration = 0;
  // Per-instance id for this card's injected per-child <style> tags. Unique so
  // nested stack-in-cards don't clobber each other's styles (see comment on
  // instanceCounter above).
  private readonly _childStyleTagId = `stack-in-card-child-style-${++instanceCounter}`;

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
        width: 36px;
        height: 36px;
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
    const hadHass = this._hass !== undefined;
    this._hass = hass;
    if (this._card) this._card.hass = hass;
    // `_hass` is deliberately not a reactive @state (we don't want a full
    // mother re-render on every state tick). But the *first* hass arrival
    // matters: the initial render() bailed on the `!this._hass` guard, and if
    // the stack is empty there's no later `_card` change to trigger a repaint,
    // so the card would stay blank. Request a single update on that transition.
    if (!hadHass) this.requestUpdate();
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

  connectedCallback(): void {
    super.connectedCallback();
    // Re-establish the style pass + child observer after a detach/reattach
    // (e.g. the dashboard editor moves our element in the DOM during a drag
    // reorder). disconnectedCallback tears the observer down; a plain reattach
    // changes neither _card nor _config, so updated() bails and nothing else
    // rebuilds it. Kick a pass when we already have a card to re-strip.
    if (this._card) this._scheduleStyleApplication();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._styleApplyRafHandle !== null) {
      cancelAnimationFrame(this._styleApplyRafHandle);
      this._styleApplyRafHandle = null;
    }
    if (this._styleApplyTimeoutHandle !== null) {
      clearTimeout(this._styleApplyTimeoutHandle);
      this._styleApplyTimeoutHandle = null;
    }
    this._firstPendingMutationTs = null;
    // Cancel any pending _applyChildCss retries — the element is gone.
    this._retryTimeouts.forEach((id) => clearTimeout(id));
    this._retryTimeouts.clear();
    this._childObserver?.disconnect();
    this._childObserver = undefined;
    this._cardPromise = undefined;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    // Gate: only re-walk styles when something relevant changed. Without
    // this gate, any future @state addition would silently trigger a full
    // style pass on every Lit update.
    if (!changedProperties.has('_card') && !changedProperties.has('_config')) return;

    // Mother CSS goes into our OWN shadow root and doesn't depend on the inner
    // stack existing. An empty stack-in-card (`cards: []`) renders a
    // placeholder that is just as much ours to style — but `_card` stays
    // undefined, and every other style path bails on that, so the CSS silently
    // did nothing until the first child was added. Cheap to run twice: the
    // style pass calls this again, and it only writes when the text differs.
    this._injectMotherStyle();

    if (!this._card) return;
    this._scheduleStyleApplication();
  }

  // Bursty mutations (live-updating children like history-graph / mini-graph-card)
  // get coalesced via a setTimeout debounce; "real" updates (new _card or
  // _config) go through rAF only for a snappy first paint.
  private static readonly _MUTATION_DEBOUNCE_MS = 150;
  // Upper bound on how long a stream of back-to-back mutations may keep pushing
  // the debounced style pass out. Without it, a child mutating faster than the
  // debounce interval (a perpetually animating card) would reset the timer
  // forever and the pass would never run.
  private static readonly _MUTATION_MAX_WAIT_MS = 1000;
  // Timestamp of the first mutation in the current pending burst; null when no
  // mutation-triggered pass is pending. Used to enforce the max-wait ceiling.
  private _firstPendingMutationTs: number | null = null;

  private _runStylePass(): void {
    this._styleApplyRafHandle = requestAnimationFrame(() => {
      this._styleApplyRafHandle = null;
      this._applyAllStyles();
    });
  }

  private _scheduleStyleApplication(fromMutation = false): void {
    if (this._styleApplyRafHandle !== null) {
      cancelAnimationFrame(this._styleApplyRafHandle);
      this._styleApplyRafHandle = null;
    }
    if (this._styleApplyTimeoutHandle !== null) {
      clearTimeout(this._styleApplyTimeoutHandle);
      this._styleApplyTimeoutHandle = null;
    }
    if (!fromMutation) {
      // A "real" update (new _card / _config / reconnect) flushes any pending
      // mutation burst and paints immediately.
      this._firstPendingMutationTs = null;
      this._runStylePass();
      return;
    }
    const now = Date.now();
    if (this._firstPendingMutationTs === null) this._firstPendingMutationTs = now;
    // Shrink the debounce as we approach the ceiling so the pass is guaranteed
    // to run within _MUTATION_MAX_WAIT_MS of the first pending mutation, even
    // if mutations keep arriving faster than the debounce interval.
    const remaining =
      StackInCard._MUTATION_MAX_WAIT_MS - (now - this._firstPendingMutationTs);
    const wait = Math.max(0, Math.min(StackInCard._MUTATION_DEBOUNCE_MS, remaining));
    this._styleApplyTimeoutHandle = setTimeout(() => {
      this._styleApplyTimeoutHandle = null;
      this._firstPendingMutationTs = null;
      this._runStylePass();
    }, wait);
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
    if (!this._card) return;
    const root = this._card.shadowRoot ?? this._card;
    // Reuse the existing observer instance across style passes. _applyAllStyles
    // disconnects it around its own DOM writes and then calls us again to
    // reconnect — so this MUST (re-)observe even when _childObserver already
    // exists. The previous `if (this._childObserver) return` guard turned the
    // observer into a one-shot: after the first disconnect it never observed
    // again, so late-mounting children (button-card templates, conditional
    // cards, ll-rebuild swaps) were silently left unstyled.
    if (!this._childObserver) {
      this._childObserver = new MutationObserver((mutations) => {
        if (this._mutationsWarrantRestyle(mutations)) {
          this._scheduleStyleApplication(true);
        }
      });
    }
    this._childObserver.observe(root, { childList: true, subtree: true });
  }

  /**
   * Decide whether a batch of mutations could have introduced a new ha-card
   * that needs style-stripping. Filters out the noise that can't:
   *   - non-childList mutations (attributes / character data)
   *   - non-element nodes (text, comments)
   *   - SVG-namespace elements — graphing cards (mini-graph-card, apexcharts,
   *     history-graph) mutate <path>/<animate>/<g> every animation frame; these
   *     can never carry an ha-card, so reacting to them is pure overhead
   *   - our OWN injected <style> tags — otherwise _applyChildCss's writes
   *     (and its async retries, which run after the observer reconnects) would
   *     each trigger a fresh pass, i.e. an endless reschedule loop
   */
  private _mutationsWarrantRestyle(mutations: MutationRecord[]): boolean {
    for (const m of mutations) {
      if (m.type !== 'childList') continue;
      for (let i = 0; i < m.addedNodes.length; i++) {
        const node = m.addedNodes[i];
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = node as Element;
        if (el.namespaceURI === 'http://www.w3.org/2000/svg') continue;
        if (el.tagName === 'STYLE' && el.id.startsWith(STYLE_TAG_ID_PREFIX)) continue;
        return true;
      }
    }
    return false;
  }

  private async _createStack(): Promise<void> {
    const generation = ++this._stackGeneration;

    // Tear down a previous observer before we swap the inner card out
    this._childObserver?.disconnect();
    this._childObserver = undefined;
    // Cancel stale _applyChildCss retries from the previous stack — otherwise
    // they would inject old CSS into the freshly rebuilt card structure.
    this._retryTimeouts.forEach((id) => clearTimeout(id));
    this._retryTimeouts.clear();

    // Empty cards: nothing to build. render() will draw the placeholder
    // synchronously. We still clear `_card` so a transition from "had
    // children" → "now empty" (e.g. via YAML edit) flips to the placeholder.
    if (!this._config!.cards || this._config!.cards.length === 0) {
      this._card = undefined;
      this._cardPromise = undefined;
      return;
    }

    const stackType = `${this._config!.mode}-stack`;
    // Strip our own `stack_in_card_styles` field from each child config
    // before handing it to HA's stack — HA's strict config validators
    // would otherwise reject the unknown property on some card types.
    //
    // Exception: a child that is itself a stack-in-card keeps the field. For
    // that child the field is its *own* mother CSS, and it knows what to do
    // with it — no validator to appease, and stripping it left the inner card
    // silently unable to style itself (its editor field looked live but had
    // no effect).
    const childConfigs = this._config!.cards.map((c) =>
      isStackInCardConfig(c) ? c : stripStackInCardFields(c),
    );
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
            <svg
              class="stack-in-card-empty__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d=${mdiPlusThick} fill="currentColor"></path>
            </svg>
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
    if (!el.style) return;
    el.style.margin = '0px';
    // HA's vertical stack no longer spaces its children with margins — its
    // `#root` is a flex container with `row-gap: 8px`. Zeroing the margin
    // alone therefore left a visible gap between every pair of cards, which
    // is precisely what this card exists to remove. Horizontal stacks already
    // compute to `column-gap: 0`, so this is a no-op there.
    el.style.gap = '0px';
  }

  private _applyCardStyle(haCard: HTMLElement, withBackground: boolean): void {
    if (!haCard) return;
    const keep = this._config?.keep ?? {};
    if (!keep.box_shadow) haCard.style.boxShadow = 'none';
    if (!keep.background && withBackground) {
      // Opt-out check: a child card can signal that it wants to keep its
      // background either via:
      //   (a) data-keep-background="true"  — fast O(1) attribute lookup
      //   (b) CSS custom property --keep-background: true  — requires
      //       getComputedStyle (slower, but needed for cross-shadow-DOM CSS)
      //       kept for backwards compatibility.
      const keepBg =
        haCard.dataset['keepBackground'] === 'true' ||
        getComputedStyle(haCard).getPropertyValue('--keep-background').trim() === 'true';
      if (!keepBg) haCard.style.background = 'transparent';
    }
    if (!keep.border_radius) haCard.style.borderRadius = '0';
  }

  /**
   * Apply user-defined CSS for the "mother" card (the stack-in-card itself).
   * Injected into our own shadowRoot.
   */
  private _injectMotherStyle(): void {
    if (!this.shadowRoot) return;

    const css = this._config?.stack_in_card_styles?.trim();

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

    // Per-child styles live on each child's config: `cards[i].stack_in_card_styles`.
    // This means the CSS travels with the card itself — reorder/copy/paste of
    // a child preserves its styling without needing a parallel index array.
    const childConfigs = this._config?.cards ?? [];

    // The inner stack renders its children inside <div id="root">
    const root = stackRoot.getElementById('root');
    if (!root) return;

    const children = Array.from(root.children) as HTMLElement[];
    children.forEach((child, index) => {
      const childConfig = childConfigs[index];
      // A nested stack-in-card injects its own `stack_in_card_styles` as
      // mother CSS, scoped to its own shadow root. Injecting it from here as
      // well would walk its entire subtree and style its children too. Pass
      // `undefined` rather than skipping the call — that still runs the
      // cleanup walk, so styles left over from a config change disappear.
      const cssText = isStackInCardConfig(childConfig)
        ? undefined
        : childConfig?.stack_in_card_styles?.trim();
      this._applyChildCss(child, cssText, 0);
    });
  }

  private _applyChildCss(child: HTMLElement, cssText: string | undefined, attempt: number): void {
    // Always clear stale injected tags first so an empty cssText actually
    // removes the previous CSS. We query by *this instance's* tag id so a
    // nested stack-in-card's tags (same prefix, different id) survive.
    walkShadowAndLight(child, (node) => {
      const tag = (node as any).querySelector?.(`#${this._childStyleTagId}`);
      tag?.remove();
    });
    if (!cssText) return;

    // Collect the targets first, then decide where to actually write.
    // `walkShadowAndLight` visits the child *element* itself plus every shadow
    // root beneath it — nothing else.
    const targets: (HTMLElement | ShadowRoot)[] = [];
    walkShadowAndLight(child, (node) => targets.push(node));
    const shadowRoots = targets.filter((n): n is ShadowRoot => n instanceof ShadowRoot);

    // Shadow roots are private to this child — always safe to write into.
    shadowRoots.forEach((node) => this._writeStyleTag(node, cssText));

    // The child's own light DOM is a different matter: it is the scope the
    // child SHARES with every sibling card (it belongs to the outer stack's
    // shadow root), so a rule matching a host element — `hui-card`, `#root`, a
    // card type tag — styles the siblings too. That leak went unnoticed for
    // years because `ha-card { }`, the documented target, matches nothing at
    // that level.
    //
    // So write there only when an `ha-card` actually lives in that shared
    // scope: for such a card there is nowhere private to put the CSS, and
    // reaching it wins. `querySelector` does not cross shadow boundaries, so
    // this asks exactly that question.
    //
    // Do NOT reduce this to "did the subtree contain any shadow root": an
    // `ha-card` is itself a shadow-DOM element, so a light-DOM `ha-card` would
    // switch the condition off and the CSS would land only inside that card's
    // shadow root — where `ha-card { }` matches nothing and the styling
    // silently disappears.
    const lightDomCard = child.matches?.('ha-card') || child.querySelector?.('ha-card');
    if (lightDomCard) this._writeStyleTag(child, cssText);

    // Retry while there was nowhere to write at all — the card hasn't mounted
    // yet (mushroom/button-card build their internal ha-card asynchronously).
    // The gate follows the write decision above rather than "did we see a
    // shadow root": a card whose only target is a light-DOM `ha-card` has been
    // reached, and re-walking it three more times would achieve nothing.
    // Capped tight: 3× 200 ms (= 600 ms) covers every card I've tested. The old
    // 10× 500 ms (= 5 s) loop kept spamming `walkShadowAndLight` long after a
    // stuck card had given up, masking real perf issues.
    const wroteSomewhere = shadowRoots.length > 0 || !!lightDomCard;
    if (!wroteSomewhere && attempt < 3) {
      const id = setTimeout(() => {
        this._retryTimeouts.delete(id);
        if (!this.isConnected) return;
        this._applyChildCss(child, cssText, attempt + 1);
      }, 200);
      this._retryTimeouts.add(id);
    }
  }

  private _writeStyleTag(root: ShadowRoot | HTMLElement, cssText: string): void {
    let tag = (root as any).querySelector?.(`#${this._childStyleTagId}`) as
      | HTMLStyleElement
      | null
      | undefined;
    if (!tag) {
      tag = document.createElement('style');
      tag.id = this._childStyleTagId;
      (root as any).appendChild(tag);
    }
    if (tag.textContent !== cssText) tag.textContent = cssText;
  }

  public async getCardSize(): Promise<number> {
    // _createStack already logs and swallows build failures, but the rejected
    // promise lingers on _cardPromise. Guard the await so HA's layout code
    // (which calls getCardSize) doesn't get an unhandled rejection — fall back
    // to a sane default size instead.
    if (this._cardPromise) {
      try {
        await this._cardPromise;
      } catch {
        return 1;
      }
    }
    if (!this._card) return 1;
    return computeCardSize(this._card);
  }
}
