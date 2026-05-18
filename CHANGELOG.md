# Changelog

All notable changes to this project are documented in this file.

## [2.0.0] — 2026-05-17

First stable release of the modernised Stack In Card — a complete rewrite
of the 2020-vintage `stack-in-card@0.2.0` on a current Home Assistant
frontend stack (HA 2025.1+), with a HA-native visual editor and per-card
custom CSS support.

> Existing YAML configurations from `0.2.x` continue to work unchanged.
> The only addition is the optional `stack_in_card_styles` field — either
> at the top level (for the outer "stack card") or on each child card.
> The field is namespaced to avoid clashing with cards like `bubble-card`
> and `button-card` that use a plain `styles:` key for their own styling
> system.

### ✨ Highlights

**Visual editor — matches HA's own stack-card editor 1:1**
- Native `<ha-tab-group>` tab strip for switching between child cards
  (falls back to styled buttons on HA versions without it)
- Action row with GUI/YAML toggle, RTL-aware move-before / move-after,
  copy, cut, delete — same icons + localizations as HA's built-in editor
- Embedded `<hui-card-picker>` for adding cards inline (no modal popup,
  no `show-create-card-dialog` round-trip)
- Inline **Paste-from-clipboard** entry above the picker — shares HA's
  `dashboardCardClipboard` sessionStorage key, so cards copied from any
  HA editor (built-in stack, this card) can be pasted here
- Embedded `<hui-card-element-editor>` per child, re-mounted on every
  reorder/insert/delete via Lit's `keyed()` directive — same mechanism
  HA itself uses; reorder actually persists in YAML
- **Empty stack starts in the picker** — adding the card drops the user
  straight into card selection, no placeholder children to delete first
- **Empty-state placeholder** — when the stack has no children, the card
  renders a "Stack In Card — Add child cards from the editor" placeholder
  synchronously, so the picker preview tile never spins

**Custom CSS support**
- `stack_in_card_styles` at the top level — CSS applied to the outer
  **stack card** (the `ha-card` wrapper itself)
- `stack_in_card_styles` on each child card config — CSS injected into
  that child's shadow DOM only, doesn't leak to sibling cards
- Namespaced field name avoids clashing with cards like `bubble-card` /
  `button-card` that use a plain `styles:` key for their own styling
- The visual editor exposes both via `<ha-code-editor mode="yaml">` with
  `autocomplete-entities` / `autocomplete-icons`
- When a child is reordered, copied, or pasted, its `stack_in_card_styles`
  field travels with it — no parallel index array to keep in sync

**Add-card flow**
- `+` button opens the embedded `<hui-card-picker>` inline (HA's own
  pattern)
- Full picker UX: built-in cards, custom cards, HACS cards — exactly
  what the main dashboard shows

### 🛠 Modernised stack

| Concern          | Before (0.2.0)                                       | Now (2.0.0)                              |
| ---------------- | ---------------------------------------------------- | ---------------------------------------- |
| Framework        | `lit-element@^2.4` + `lit-html@^1.3`                 | `lit@^3.2`                               |
| TypeScript       | `4.0.5`                                              | `5.7.x`                                  |
| Build target     | `ES2017`                                             | `ES2021` (lib `ES2022`)                  |
| Bundler          | `rollup@^2` + `rollup-plugin-typescript2`            | `rollup@^4` + `@rollup/plugin-typescript`|
| Minifier         | `rollup-plugin-terser` (deprecated)                  | `@rollup/plugin-terser`                  |
| Transpiler       | Babel + multiple plugins                             | Removed (TypeScript handles it)          |
| HA bindings      | `custom-card-helpers@^1.6` (unmaintained)            | Local minimal types                      |
| Linter           | ESLint 7 + airbnb + broken prettier plugin           | Prettier 3 only                          |
| Icons            | `<ha-icon icon="mdi:...">` (legacy)                  | `<ha-icon-button .path=${mdiX}>` with `@mdi/js` |
| CI               | `actions/checkout@v1`, yarn                          | `actions/checkout@v4`, Node 20, npm      |

Build output `dist/stack-in-card.js` is a single ES module (~48 KB
minified) — HACS install paths are unchanged.

### 🐛 Bug fixes carried in from the modernisation

- **Element double-registration guard** — loading the bundle twice
  (HACS + manual resource) no longer throws `NotSupportedError`
- **Style application via `MutationObserver`** — replaces the fragile
  `setTimeout(500)` of the original; late-mounted nested cards
  (`mushroom`, `button-card`) get their styles correctly
- **Race-condition guard** — monotonic generation counter on async stack
  creation; rapid config updates from the editor can no longer overwrite
  each other
- **Brute-force per-child CSS injection** — `walkShadowAndLight` writes
  into every shadow root + light-DOM node under a child, with retry, so
  cards that mount their internal `ha-card` asynchronously still get
  their CSS
- **No-op `config-changed` events filtered** — HA's nested
  `<hui-card-element-editor>` re-fires `config-changed` on focus/blur
  with an identical config. `_childCardConfigChanged` now short-circuits
  when nothing changed — eliminates a full inner-stack rebuild per
  keystroke
- **`updated()` gated** on `_card` / `_config` changes — future `@state`
  additions won't silently re-trigger full style passes
- **`MutationObserver` disconnected during DOM writes** — the
  observer is paused around our own style/CSS injections and reconnected
  afterwards. Replaces an earlier reentrancy boolean that could block
  legitimate style passes during a config swap
- **`cards: []` accepted** — empty stack is a valid config (renders the
  empty-state placeholder)
- **Delete last child** — falls back to the picker instead of throwing
- **Validation of `mode` and `cards` shape** in `setConfig`
- **`customCards.type` without `custom:` prefix** — HA's picker calls
  `document.createElement(type)` directly; the prefix would fail
  silently and hang the preview tile
- **Cleanup on disconnect** — animation frames, mutation observer, and
  card promise all torn down in `disconnectedCallback`
- **No-op no longer disabled** — Cut + Delete are no longer disabled
  when at one child, since `cards: []` is now valid
- **`outer_padding` tautology cleanup** — `outer_padding ?? (margin ?
  true : false)` → `outer_padding ?? !!margin`

### 🚀 Performance & stability

- **Mutation bursts debounced** — `MutationObserver` callbacks from
  live-updating children (`history-graph`, `mini-graph-card`,
  animations) used to schedule a full style re-walk per mutation,
  with only `requestAnimationFrame` debouncing. A history-graph
  card refreshing several times a second could pin the main thread
  re-walking the whole subtree. Bursts are now collapsed via an
  additional 150 ms `setTimeout` debounce; "real" updates from
  `_card` / `_config` changes still go through rAF only for snappy
  first paint.
- **Mutation filter on element nodes only** — observer callback now
  short-circuits on the first added element node and ignores text /
  comment / attribute mutations. Eliminates the long tail of "tens of
  mutations per second, none of them introduce a new `ha-card`" wakeups.
- **CSS-injection retry cap tightened** — the per-child CSS injection
  fallback used to retry up to 10 times at 500 ms (= 5 s of repeated
  `walkShadowAndLight` calls) when no shadow root had mounted yet.
  Capped to 3 × 200 ms and guarded with `isConnected`, so a stuck
  card can no longer spam `walkShadowAndLight` long after it gave up.
- **Picker null-deref fix** — `_appendCard` used to flip
  `_showPicker = false` synchronously inside the click handler, which
  unmounted `<hui-card-picker>` while its own `updated()` pass was
  still running, triggering a `Cannot read properties of null
  (getElementById)` deref at `hui-card-picker.ts:286`. The unmount
  is now deferred via `requestAnimationFrame` so the picker can
  finish its own update cycle first.

### 🏗 CI / packaging

- **HACS-compliant repo layout** — `dist/stack-in-card.js` is committed
  to master so HACS finds the built file when installing from the repo.
  No more "Repository structure for master is not compliant" error when
  adding the repo as a HACS custom plugin.
- **Auto-build workflow** — `.github/workflows/build.yml` runs on every
  push to master: typecheck → build → commit `dist/` back. No manual
  rebuild step needed.
- **Tagged-release workflow** — `.github/workflows/release.yml` runs on
  `v*` tag push, builds, and creates a GitHub Release with
  `stack-in-card.js` attached as an asset
  (`softprops/action-gh-release`).
- **HACS validation workflow** — `.github/workflows/hacs.yml` runs the
  official `hacs/action` on every push to verify the repo stays
  HACS-compliant.
- `package-lock.json` is committed (reproducible builds, npm best
  practice).

### 🔧 Code quality

- **Shared helpers** in `helpers.ts` — `stripStackInCardFields`,
  `walkShadowAndLight`, `deepClone`, `createCardElement`,
  `computeCardSize`. The same `walkShadowAndLight` walker drives both
  per-child CSS injection and cleanup, replacing two near-identical
  recursive closures.
- **`_appendCard` helper** — `_handleCardPicked` and
  `_handlePasteClipboard` were line-for-line identical after card
  extraction. Both route through a single helper now.
- Removed all dead code from the 2020 base (`.devcontainer/`,
  `.vscode/`, `.npmrc`, `docs/Example.png`, `rollup-plugin-typescript2`
  cache directory).

### 🔁 Backwards compatibility

All `0.2.x` YAML configurations remain valid. New optional fields:

- `stack_in_card_styles` at the top of the config (string) → CSS for the outer stack
- `stack_in_card_styles` on individual `cards[i]` (string) → CSS for that child card

The field name is namespaced (rather than plain `styles:`) to avoid
clashing with cards that use `styles:` as their own configuration key —
notably `bubble-card` (string-style CSS) and `button-card` (object-style
sections like `card:`, `name:`, `icon:`).

### 📁 File layout

```
src/
  stack-in-card.ts   Entry point — registers the element + customCards
  main.ts            The card class (rendering, stack creation, style application)
  editor.ts          Visual editor (ha-form + tab strip + hui-card-picker + hui-card-element-editor)
  helpers.ts         Shared utilities (createCardElement, deepClone, stripStackInCardFields, walkShadowAndLight)
  fireEvent.ts       Standard HA event dispatcher
  styles.css         Editor styles
  types.ts           Local HA/Lovelace type declarations
  typings/css.d.ts   '*.css' module declaration for TypeScript
```

### 🙏 Repository

- Maintained by [@duczz](https://github.com/duczz) at
  [duczz/ha-stack-in-card](https://github.com/duczz/ha-stack-in-card).
- Forked from the original
  [custom-cards/stack-in-card](https://github.com/custom-cards/stack-in-card)
  by [@RomRider], frozen at `0.2.0` (2020-11-09).

---

## [0.2.0] — 2020-11-09

Last release of the original implementation by [@RomRider]. See the
upstream
[custom-cards/stack-in-card](https://github.com/custom-cards/stack-in-card)
repository for the pre-2026 history.

[@RomRider]: https://github.com/RomRider
[2.0.0]: https://github.com/duczz/ha-stack-in-card/releases/tag/v2.0.0
[0.2.0]: https://github.com/custom-cards/stack-in-card/releases/tag/v0.2.0
