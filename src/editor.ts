import { LitElement, html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import {
  mdiBookOpenVariant,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClose,
  mdiCodeBraces,
  mdiContentCopy,
  mdiContentCut,
  mdiContentPaste,
  mdiDelete,
  mdiListBoxOutline,
  mdiPlus,
  mdiTune,
} from '@mdi/js';

import styles from './styles.css';
import fireEvent from './fireEvent';
import { deepClone, stripStackInCardFields } from './helpers';
import { version } from '../package.json';
import {
  HASS,
  LovelaceCardConfig,
  LovelaceCardEditor,
  StackChildCardConfig,
  StackInCardConfig,
} from './types';

// HA's own clipboard key — used by hui-stack-card-editor (write) and
// hui-card-picker (read). Writing to this key means HA's native picker
// will automatically offer our copied/cut card as a paste option at the
// top of the "Add card" list.
const HA_CLIPBOARD_KEY = 'dashboardCardClipboard';

declare const process: { env: { BUILD_TIME: string } };
const BUILD_TIME = process.env.BUILD_TIME;

const GITHUB_README = 'https://github.com/duczz/ha-stack-in-card/blob/master/README.md';

/* -------------------------------------------------------------------------- */
/*  Top-level (mother) ha-form schema                                          */
/* -------------------------------------------------------------------------- */

const SCHEMA = [
  { name: 'title', selector: { text: {} } },
  {
    name: 'mode',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'vertical', label: 'Vertical' },
          { value: 'horizontal', label: 'Horizontal' },
        ],
      },
    },
  },
  {
    type: 'expandable',
    title: 'Keep options',
    iconPath: mdiTune,
    schema: [
      {
        type: 'grid',
        column_min_width: '160px',
        schema: [
          { name: 'keep.background', selector: { boolean: {} } },
          { name: 'keep.box_shadow', selector: { boolean: {} } },
          { name: 'keep.border_radius', selector: { boolean: {} } },
          { name: 'keep.margin', selector: { boolean: {} } },
          { name: 'keep.outer_padding', selector: { boolean: {} } },
        ],
      },
    ],
  },
];

const LABELS: Record<string, string> = {
  title: 'Title (optional header)',
  mode: 'Stack mode',
  'keep.background': 'Keep background',
  'keep.box_shadow': 'Keep box-shadow',
  'keep.border_radius': 'Keep border-radius',
  'keep.margin': 'Keep margin between cards',
  'keep.outer_padding': 'Keep outer padding (8px) when margin is kept',
};

/* -------------------------------------------------------------------------- */
/*  Small path helpers used by the keep flags                                  */
/* -------------------------------------------------------------------------- */

function setNested(obj: any, path: string, value: any) {
  const parts = path.split('.');
  let o = obj;
  while (parts.length - 1) {
    const p = parts.shift()!;
    if (!Object.prototype.hasOwnProperty.call(o, p) || typeof o[p] !== 'object' || o[p] === null) {
      o[p] = {};
    }
    o = o[p];
  }
  o[parts[0]] = value;
}

function deleteNested(obj: any, path: string) {
  const parts = path.split('.');
  let o = obj;
  while (parts.length > 1) {
    const p = parts.shift()!;
    if (!o[p]) return;
    o = o[p];
  }
  delete o[parts[0]];
}

/* -------------------------------------------------------------------------- */
/*  The editor                                                                  */
/* -------------------------------------------------------------------------- */

export default class StackInCardEditor extends LitElement implements LovelaceCardEditor {
  @state() private _config?: StackInCardConfig;
  @state() public hass?: HASS;
  // The `lovelace` property is set by HA on the editor instance so embedded
  // pickers can resolve types correctly.
  @state() public lovelace?: any;
  // Which child card is currently selected in the tab bar. `null` means
  // "no children yet" — the user then sees an embedded card picker.
  @state() private _selectedChild: number | null = 0;
  // Toggles between the YAML config editor and the GUI editor for the child
  // card. HA itself exposes the same toggle in nested editors.
  @state() private _childGuiMode = true;
  // When the user clicks "+", we swap the embedded picker into view in place
  // of the child editor.
  @state() private _showPicker = false;
  // Snapshot of the clipboard at the moment the picker is opened. We read
  // sessionStorage["dashboardCardClipboard"] directly here because HA's own
  // <hui-card-picker> uses an @storage decorator whose in-memory cache is
  // never updated by raw sessionStorage writes from outside its own
  // setValue() flow. So we render our own paste-entry above the picker.
  @state() private _clipboardCard?: StackChildCardConfig;

  // Keyed identity map for the nested <hui-card-element-editor>. Lit's
  // `keyed()` directive uses these strings to decide whether to reuse the
  // existing editor instance or destroy + recreate it. We MUST clear this
  // after every reorder/insert/delete; otherwise the inner editor keeps
  // its stale internal config and fires `config-changed` with the old
  // card, silently undoing our reorder. This is the exact mechanism
  // hui-stack-card-editor uses.
  private _keys = new Map<string, string>();
  private _getKey(cards: StackChildCardConfig[], index: number): string {
    const key = `${index}-${cards.length}`;
    if (!this._keys.has(key)) {
      this._keys.set(key, Math.random().toString());
    }
    return this._keys.get(key)!;
  }

  static get styles() {
    return styles;
  }

  public setConfig(config: StackInCardConfig): void {
    this._config = config || ({} as StackInCardConfig);
    // IMPORTANT: do NOT reset `_selectedChild` here on every round-trip.
    // HA's lovelace dashboard editor re-feeds our editor via setConfig
    // after every config-changed event, and resetting the selected index
    // would clobber our optimistic local update — making move-after look
    // like "the card never moved". Only clamp to a valid range.
    const cards = this._config.cards ?? [];
    if (cards.length === 0) {
      this._selectedChild = null;
      // Refresh the clipboard snapshot so the inline picker (empty state)
      // shows a paste banner if a card is stashed.
      this._clipboardCard = this._readClipboard();
    } else if (this._selectedChild === null) {
      this._selectedChild = 0;
    } else if (this._selectedChild >= cards.length) {
      this._selectedChild = cards.length - 1;
    }
  }

  /* ------------------------------- form data -------------------------------- */

  private _buildFormData() {
    const c = this._config ?? ({} as StackInCardConfig);
    return {
      title: c.title ?? '',
      mode: c.mode ?? 'vertical',
      'keep.background': !!c.keep?.background,
      'keep.box_shadow': !!c.keep?.box_shadow,
      'keep.border_radius': !!c.keep?.border_radius,
      'keep.margin': !!c.keep?.margin,
      'keep.outer_padding': c.keep?.outer_padding ?? !!c.keep?.margin,
    };
  }

  private _applyFormChange(updated: any): StackInCardConfig {
    const copy = deepClone(this._config) as StackInCardConfig;

    if (updated.title) copy.title = updated.title;
    else delete (copy as any).title;

    if (updated.mode && updated.mode !== 'vertical') copy.mode = updated.mode;
    else delete (copy as any).mode;

    const keepPaths = [
      'keep.background',
      'keep.box_shadow',
      'keep.border_radius',
      'keep.margin',
      'keep.outer_padding',
    ];
    for (const path of keepPaths) {
      if (updated[path] === true) {
        setNested(copy, path, true);
      } else if (path === 'keep.outer_padding' && updated[path] === false) {
        // We must explicitly save false so the backwards-compat default doesn't kick in
        setNested(copy, path, false);
      } else {
        deleteNested(copy, path);
      }
    }
    if (copy.keep && Object.keys(copy.keep).length === 0) delete copy.keep;

    return copy;
  }

  private _valueChanged = (ev: CustomEvent) => {
    if (!this._config) return;
    const updated = ev.detail.value;
    const copy = this._applyFormChange(updated);
    this._fireConfigChanged(copy);
  };

  private _computeLabel = (schema: any) => LABELS[schema.name] ?? schema.name;

  /* ------------------------------- styles ----------------------------------- */

  // Mother CSS lives directly on `_config.stack_in_card_styles` as a plain string.
  private _motherStyleChanged = (ev: CustomEvent) => {
    if (!this._config) return;
    ev.stopPropagation();
    const value = (((ev.detail as any)?.value ?? '') as string).trim();
    const copy = deepClone(this._config) as StackInCardConfig;
    if (value) copy.stack_in_card_styles = value;
    else delete (copy as any).stack_in_card_styles;
    this._fireConfigChanged(copy);
  };

  // Per-child CSS lives at `cards[i].stack_in_card_styles`. The CSS travels
  // with the child card itself, so reorder/copy/paste preserves it
  // automatically.
  private _selectedChildStyleChanged = (ev: CustomEvent) => {
    if (!this._config || this._selectedChild === null) return;
    ev.stopPropagation();
    const value = (((ev.detail as any)?.value ?? '') as string).trim();
    const idx = this._selectedChild;
    const cards = (this._config.cards ?? []).slice();
    if (!cards[idx]) return;
    const child: StackChildCardConfig = { ...cards[idx] };
    if (value) child.stack_in_card_styles = value;
    else delete child.stack_in_card_styles;
    cards[idx] = child;
    const copy = deepClone(this._config) as StackInCardConfig;
    copy.cards = cards;
    this._fireConfigChanged(copy);
  };

  /* --------------------------- child card actions --------------------------- */

  private _selectChild(index: number) {
    this._selectedChild = index;
  }

  // Handler for HA's native <ha-tab-group> `wa-tab-show` event. The active
  // tab's `name` attribute carries the child index as a string.
  private _onTabShow = (ev: CustomEvent) => {
    const name = (ev.detail as any)?.name;
    if (name == null) return;
    const idx = parseInt(name, 10);
    if (!Number.isNaN(idx)) this._selectedChild = idx;
  };

  // True when HA's native tab control is registered in this frontend. We
  // gate the native render on this so that older or future HA versions that
  // don't ship <ha-tab-group> still get a working (button-based) tab bar.
  private get _hasNativeTabs(): boolean {
    return !!customElements.get('ha-tab-group') && !!customElements.get('ha-tab-group-tab');
  }

  // True when HA's RTL-aware arrow buttons are registered. These are
  // HA-internal wrappers (`<ha-icon-button-arrow-prev/next>`) that auto-
  // flip in right-to-left locales. If missing, we render plain
  // <ha-icon-button> with literal chevron SVG paths.
  private get _hasArrowButtons(): boolean {
    return (
      !!customElements.get('ha-icon-button-arrow-prev') &&
      !!customElements.get('ha-icon-button-arrow-next')
    );
  }

  /** Shared move handler — exact pattern from HA's hui-stack-card-editor:
   * direction (-1 / +1) is set as a `.move` property on the button, then
   * read here via `ev.currentTarget.move`. */
  private _handleMove = (ev: Event) => {
    if (!this._config || this._selectedChild === null) return;
    const move = (ev.currentTarget as any).move as number;
    const source = this._selectedChild;
    const target = source + move;
    const cards = [...(this._config.cards ?? [])];
    if (target < 0 || target >= cards.length) return;
    const card = cards.splice(source, 1)[0];
    cards.splice(target, 0, card);
    // Per-child styles live on `cards[i].stack_in_card_styles`, so they move
    // along with the card automatically.
    this._config = { ...this._config, cards };
    this._selectedChild = target;
    // Critical: invalidate the keyed() identity for the nested editor.
    // Without this Lit reuses the existing <hui-card-element-editor> with
    // its stale internal config, which would silently revert our reorder.
    this._keys.clear();
    this._fireConfigChanged(this._config);
  };

  private _deleteChild(index: number) {
    if (!this._config) return;
    const cards = [...(this._config.cards ?? [])];
    if (index < 0 || index >= cards.length) return;
    cards.splice(index, 1);
    this._config = { ...this._config, cards };
    // When the last card is removed, fall back to the picker — same behaviour
    // as the initial add. Otherwise clamp to the nearest remaining index.
    this._selectedChild = cards.length === 0 ? null : Math.min(index, cards.length - 1);
    this._keys.clear();
    this._fireConfigChanged(this._config);
  }

  /** Bound click handler — avoids per-render closure that would capture a
   * stale selected index. */
  private _handleDelete = () => {
    if (this._selectedChild === null) return;
    this._deleteChild(this._selectedChild);
  };

  /** Copy the selected child to HA's shared clipboard (sessionStorage at
   * `dashboardCardClipboard`). After this, opening any card picker — ours
   * or HA's own — surfaces a "paste from clipboard" entry at the top. */
  private _copyChild = () => {
    if (!this._config || this._selectedChild === null) return;
    const card = this._config.cards?.[this._selectedChild];
    if (!card) return;
    try {
      sessionStorage.setItem(HA_CLIPBOARD_KEY, JSON.stringify(card));
    } catch {
      // sessionStorage might be unavailable (private mode etc.); ignore.
    }
  };

  /** Cut = copy + delete. */
  private _cutChild = () => {
    if (!this._config || this._selectedChild === null) return;
    this._copyChild();
    this._deleteChild(this._selectedChild);
  };

  // Pattern used by HA's own hui-stack-card-editor: embed <hui-card-picker>
  // directly instead of opening the show-create-card-dialog. The picker emits
  // `config-changed` with the chosen card's config in `detail.config`.
  private _addChild = () => {
    // Refresh the clipboard snapshot every time we open the picker so the
    // paste-entry reflects the latest copy/cut from anywhere in HA.
    this._clipboardCard = this._readClipboard();
    this._showPicker = true;
  };

  private _cancelAddChild = () => {
    this._showPicker = false;
  };

  private _readClipboard(): StackChildCardConfig | undefined {
    try {
      const raw = sessionStorage.getItem(HA_CLIPBOARD_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      // Basic sanity check: must be an object with a `type` string
      if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
        return parsed as StackChildCardConfig;
      }
    } catch {
      // ignore malformed JSON / sessionStorage errors
    }
    return undefined;
  }

  /** Append a card to the end and select it. Shared by the picker click
   * handler and the paste-from-clipboard banner. */
  private _appendCard(card: LovelaceCardConfig): void {
    if (!this._config) return;
    const cards = [...(this._config.cards ?? []), card];
    this._config = { ...this._config, cards };
    this._selectedChild = cards.length - 1;
    this._keys.clear();
    this._fireConfigChanged(this._config);
    // Defer hiding the picker until after the current Lit update cycle
    // finishes. Synchronously toggling `_showPicker = false` here unmounts
    // <hui-card-picker> while its own `updated()` pass is still running —
    // the picker then dereferences a now-null shadowRoot at
    // hui-card-picker.ts:286 and the whole event handler aborts.
    requestAnimationFrame(() => {
      this._showPicker = false;
    });
  }

  private _handlePasteClipboard = () => {
    const card = this._readClipboard();
    if (card) this._appendCard(card);
  };

  private _handleCardPicked = (ev: CustomEvent) => {
    ev.stopPropagation();
    const cardConfig = (ev.detail as any)?.config as LovelaceCardConfig | undefined;
    if (cardConfig) this._appendCard(cardConfig);
  };

  private _childCardConfigChanged = (ev: CustomEvent) => {
    if (!this._config || this._selectedChild === null) return;
    ev.stopPropagation();
    const newCardConfig = ev.detail?.config as LovelaceCardConfig | undefined;
    if (!newCardConfig) return;
    const idx = this._selectedChild;
    const previousChild = this._config.cards?.[idx];
    // Preserve our `stack_in_card_styles` field — HA's nested card editor
    // strips unknown keys when it re-emits the child config, so we re-attach
    // it ourselves.
    const merged: StackChildCardConfig = { ...newCardConfig };
    if (previousChild?.stack_in_card_styles) {
      merged.stack_in_card_styles = previousChild.stack_in_card_styles;
    }
    // Skip the round-trip when nothing changed. HA's nested editor sometimes
    // re-fires config-changed on focus/blur with an identical config, and
    // each fire would otherwise force a full inner-stack rebuild via the
    // parent dashboard → setConfig → _createStack chain.
    if (
      previousChild &&
      JSON.stringify(previousChild) === JSON.stringify(merged)
    ) {
      return;
    }
    const cards = (this._config.cards ?? []).slice();
    cards[idx] = merged;
    const copy = deepClone(this._config) as StackInCardConfig;
    copy.cards = cards;
    this._fireConfigChanged(copy);
  };

  private _toggleChildEditorMode() {
    this._childGuiMode = !this._childGuiMode;
  }

  /* ------------------------------- plumbing --------------------------------- */

  private _fireConfigChanged(config: StackInCardConfig) {
    fireEvent(this, 'config-changed', { config });
  }

  private _openLink() {
    window.open(GITHUB_README, '_blank', 'noopener');
  }

  /** Render the embedded card picker, optionally with a header (with a
   * cancel button) when triggered by the user clicking "+". The clipboard
   * paste banner is always shown above the picker if a card is stashed. */
  private _renderCardPicker(showHeader: boolean) {
    return html`
      <div class="picker-wrapper">
        ${showHeader
          ? html`
              <div class="picker-header">
                <span>Pick a card to add</span>
                <ha-icon-button
                  .label=${'Cancel'}
                  .path=${mdiClose}
                  @click=${this._cancelAddChild}
                ></ha-icon-button>
              </div>
            `
          : nothing}
        ${this._clipboardCard
          ? html`
              <button
                class="paste-entry"
                @click=${this._handlePasteClipboard}
                type="button"
              >
                <ha-svg-icon
                  class="paste-entry__icon"
                  .path=${mdiContentPaste}
                ></ha-svg-icon>
                <div class="paste-entry__text">
                  <div class="paste-entry__title">
                    ${this.hass!.localize?.(
                      'ui.panel.lovelace.editor.card.generic.paste',
                    ) ?? 'Paste from clipboard'}
                  </div>
                  <div class="paste-entry__sub">
                    ${this.hass!.localize?.(
                      'ui.panel.lovelace.editor.card.generic.paste_description',
                      { type: this._clipboardCard.type },
                    ) ?? this._clipboardCard.type}
                  </div>
                </div>
              </button>
            `
          : nothing}
        <hui-card-picker
          .hass=${this.hass}
          .lovelace=${this.lovelace}
          @config-changed=${this._handleCardPicked}
        ></hui-card-picker>
      </div>
    `;
  }

  /* -------------------------------- render ---------------------------------- */

  render() {
    if (!this.hass || !this._config) return html``;

    const data = this._buildFormData();
    const motherCss = this._config.stack_in_card_styles ?? '';
    const cards = this._config.cards ?? [];
    const selected = this._selectedChild;
    const selectedCard =
      selected !== null && selected >= 0 && selected < cards.length ? cards[selected] : undefined;
    const selectedChildCss = selectedCard?.stack_in_card_styles ?? '';
    // HA's <hui-card-element-editor> doesn't know about our
    // `stack_in_card_styles` field and would warn / strip it. Hand it a
    // stripped copy.
    const selectedCardForEditor = selectedCard ? stripStackInCardFields(selectedCard) : undefined;

    return html`
      <div class="card-config">
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${SCHEMA}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>

        <ha-expansion-panel outlined>
          <div slot="header" style="display: flex; align-items: center; gap: 8px;">
            <ha-svg-icon .path=${mdiCodeBraces}></ha-svg-icon>
            Custom CSS — Stack card
          </div>
          <div class="panel-content">
            <p class="styles-hint">
              CSS applied to the outer stack card itself. Target the wrapper with
              <code>ha-card</code>.
            </p>
            <div class="styles-editor">
              <ha-code-editor
                mode="yaml"
                autocomplete-entities
                autocomplete-icons
                .hass=${this.hass}
                .value=${motherCss}
                @value-changed=${this._motherStyleChanged}
              ></ha-code-editor>
            </div>
          </div>
        </ha-expansion-panel>

        <div class="section-label">Cards</div>

        <div class="tabs-row">
          ${this._hasNativeTabs
            ? html`
                <ha-tab-group class="tabs" @wa-tab-show=${this._onTabShow}>
                  ${cards.map(
                    (_c, i) => html`
                      <ha-tab-group-tab
                        slot="nav"
                        .panel=${i}
                        .active=${i === selected}
                      >
                        ${i + 1}
                      </ha-tab-group-tab>
                    `,
                  )}
                </ha-tab-group>
              `
            : html`
                <!-- Fallback for HA versions without ha-tab-group -->
                <div class="tab-bar tab-bar--fallback" role="tablist">
                  ${cards.map(
                    (_c, i) => html`
                      <button
                        class=${'tab ' + (selected === i ? 'tab--active' : '')}
                        role="tab"
                        aria-selected=${selected === i ? 'true' : 'false'}
                        @click=${() => this._selectChild(i)}
                      >
                        ${i + 1}
                      </button>
                    `,
                  )}
                </div>
              `}
          <ha-icon-button
            class="tabs__add"
            .label=${'Add card'}
            .path=${mdiPlus}
            @click=${this._addChild}
          ></ha-icon-button>
        </div>

        ${this._showPicker
          ? this._renderCardPicker(true)
          : selectedCard
            ? html`
                <div id="card-options" class="child-actions">
                  <!-- GUI/YAML toggle (HA's order: this comes first) -->
                  <ha-icon-button
                    .label=${this._childGuiMode
                      ? this.hass!.localize?.('ui.panel.lovelace.editor.edit_card.show_code_editor') ?? 'Show code editor'
                      : this.hass!.localize?.('ui.panel.lovelace.editor.edit_card.show_visual_editor') ?? 'Show visual editor'}
                    .path=${this._childGuiMode ? mdiCodeBraces : mdiListBoxOutline}
                    @click=${this._toggleChildEditorMode}
                  ></ha-icon-button>

                  <!-- Move before (RTL-aware native arrow) -->
                  ${this._hasArrowButtons
                    ? html`<ha-icon-button-arrow-prev
                        .hass=${this.hass}
                        .label=${this.hass!.localize?.('ui.panel.lovelace.editor.edit_card.move_before') ?? 'Move before'}
                        .disabled=${selected === 0}
                        .move=${-1}
                        @click=${this._handleMove}
                      ></ha-icon-button-arrow-prev>`
                    : html`<ha-icon-button
                        .label=${'Move before'}
                        .path=${mdiChevronLeft}
                        .disabled=${selected === 0}
                        .move=${-1}
                        @click=${this._handleMove}
                      ></ha-icon-button>`}

                  <!-- Move after -->
                  ${this._hasArrowButtons
                    ? html`<ha-icon-button-arrow-next
                        .hass=${this.hass}
                        .label=${this.hass!.localize?.('ui.panel.lovelace.editor.edit_card.move_after') ?? 'Move after'}
                        .disabled=${selected === cards.length - 1}
                        .move=${1}
                        @click=${this._handleMove}
                      ></ha-icon-button-arrow-next>`
                    : html`<ha-icon-button
                        .label=${'Move after'}
                        .path=${mdiChevronRight}
                        .disabled=${selected === cards.length - 1}
                        .move=${1}
                        @click=${this._handleMove}
                      ></ha-icon-button>`}

                  <!-- Copy -->
                  <ha-icon-button
                    .label=${this.hass!.localize?.('ui.panel.lovelace.editor.edit_card.copy') ?? 'Copy'}
                    .path=${mdiContentCopy}
                    @click=${this._copyChild}
                  ></ha-icon-button>

                  <!-- Cut -->
                  <ha-icon-button
                    .label=${this.hass!.localize?.('ui.panel.lovelace.editor.edit_card.cut') ?? 'Cut'}
                    .path=${mdiContentCut}
                    @click=${this._cutChild}
                  ></ha-icon-button>

                  <!-- Delete -->
                  <ha-icon-button
                    .label=${this.hass!.localize?.('ui.panel.lovelace.editor.edit_card.delete') ?? 'Delete'}
                    .path=${mdiDelete}
                    @click=${this._handleDelete}
                  ></ha-icon-button>
                </div>

                <div class="child-editor">
                  ${keyed(
                    this._getKey(cards, selected!),
                    html`<hui-card-element-editor
                      .hass=${this.hass}
                      .value=${selectedCardForEditor}
                      .lovelace=${this.lovelace}
                      .GUImode=${this._childGuiMode}
                      @config-changed=${this._childCardConfigChanged}
                      @GUImode-changed=${(ev: CustomEvent) => {
                        this._childGuiMode = !!ev.detail?.guiMode;
                      }}
                    ></hui-card-element-editor>`,
                  )}
                </div>

                <div class="section-label">Custom CSS — Card ${selected! + 1}</div>
                <p class="styles-hint">
                  CSS injected into this child card's shadow DOM. Doesn't affect sibling cards.
                </p>
                <div class="styles-editor">
                  <ha-code-editor
                    mode="yaml"
                    autocomplete-entities
                    autocomplete-icons
                    .hass=${this.hass}
                    .value=${selectedChildCss}
                    @value-changed=${this._selectedChildStyleChanged}
                  ></ha-code-editor>
                </div>
              `
            : this._renderCardPicker(false)}

        <div class="editor-footer">
          <ha-button @click=${this._openLink}>
            <ha-svg-icon .path=${mdiBookOpenVariant} slot="icon"></ha-svg-icon>
            Documentation
          </ha-button>
          <span class="editor-footer__version">v${version} · ${BUILD_TIME}</span>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('stack-in-card-editor')) {
  customElements.define('stack-in-card-editor', StackInCardEditor);
}
