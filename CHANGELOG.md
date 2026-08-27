# Changelog

## [2.0.4] — 2026-08-27

### ⚠️ Behaviour change — custom CSS is scoped more tightly

Two cases where custom CSS reached cards it was never meant to reach are fixed.
Both change how existing dashboards render **without any config change**, so
check yours if either applies:

- **Per-child CSS no longer reaches sibling cards** — for every child card that
  has a shadow DOM, which is nearly all of them. A rule that matches a host
  element — `hui-card`, `#root`, a card type tag like `hui-entities-card` —
  used to style *every* card in the stack, not just the one it was set on.
  Rules targeting `ha-card` were unaffected, which is why the leak went
  unnoticed for so long. The exception is a child that keeps its `ha-card`
  outside a shadow DOM: it can still only be styled in the scope it shares
  with its siblings, so its CSS may reach them whatever the selector.

  Such host-level rules now match nothing, and there is no drop-in
  replacement — the stack card's own **Custom CSS — Stack card** box cannot
  reach those elements either, because they live in a different shadow root.
  Express the intent on `ha-card` instead: `ha-card { margin: 4px }` in a
  child's own CSS box does what `hui-card { margin: 4px }` used to do, and
  only for that child. If you had a case that genuinely needs the old
  behaviour, please open an issue.
- **CSS set on a nested `stack-in-card` now applies to that card only.** It
  used to be injected into the nested card's entire subtree, so the cards
  *inside* it were styled too. To style those, set their CSS in the nested
  card's own per-child boxes. A stack card sitting behind a `conditional` or
  another stack was never affected by this and is unchanged — it always
  received its own CSS.
- **A child card that renders neither a shadow DOM nor an `ha-card` no longer
  receives per-child CSS at all.** There is no way to tell which element such
  a card wants styled, and the old catch-all placed the rules in the shared
  scope, where they hit every sibling. If you have a card like this, please
  open an issue with the card type — the fix is to recognise it explicitly
  rather than to style the whole stack by accident.

### 🐛 Bug Fixes

- **Runtime:** Per-child CSS is no longer written into the child element's own
  light DOM by default. That `<style>` lived in the tree scope of the outer
  stack's shadow root — the same scope every sibling card shares — so it styled
  siblings, contradicting the editor's own promise that per-child CSS "doesn't
  affect sibling cards". CSS now goes into the child's shadow roots, and into
  the shared scope only when the child keeps its `ha-card` there, because
  nothing else can reach such a card.
- **Runtime:** A directly nested `stack-in-card` keeps its own
  `stack_in_card_styles`. It was stripped before the child config reached HA's
  stack, so the nested card could never apply its own CSS — the field looked
  live in its editor but had no effect — while the outer card injected the same
  CSS across the nested card's whole subtree.
- **Editor:** Custom CSS typed into a nested `stack-in-card`'s editor is no
  longer silently discarded. The outer editor re-attached the previous value
  unconditionally, after which the no-op filter concluded nothing had changed
  and dropped the edit without an event or an error. The re-attach still runs
  for ordinary child cards, whose form-based HA editors do drop unknown keys.
- **Editor:** A nested `stack-in-card` no longer shows two identically labelled
  "Custom CSS — Card N" sections, one of which silently did nothing. The outer
  editor now points to the nested card's own CSS box instead of offering a
  second one for the same field.
- **Editor:** The stack card's own CSS box is labelled "Custom CSS — Nested
  stack card" when its editor is rendered inside another one. Both boxes used
  to be called "Custom CSS — Stack card", so in a nested card all four CSS
  fields carried just two labels between them and there was no way to tell
  which card you were styling.

## [2.0.3] — 2026-07-07

### 🐛 Bug Fixes

- **Runtime:** The child `MutationObserver` is no longer a one-shot. It was
  disconnected around each style pass but never re-observed afterwards (an
  existence guard skipped reconnection), so any card that mounts its inner
  `ha-card` *after* the first mutation — button-card templates, conditional
  cards, `ll-rebuild` swaps — was silently left with borders/shadows/margins.
  The observer now reconnects after every pass, and its callback ignores our
  own injected `<style>` tags so the reconnect can't trigger an endless
  re-style loop.
- **Runtime:** Nested `stack-in-card`s no longer clobber each other's custom
  CSS. Both used the same `<style>` tag id, so the outer card's cleanup pass
  deleted the inner card's injected per-child styles. Each card instance now
  uses a unique tag id.
- **Runtime:** `getCardSize()` no longer rejects when the inner stack failed to
  build. The rejected build promise is now caught and a default size is
  returned, so Home Assistant's layout code can't hit an unhandled rejection.
- **Runtime:** A failed `loadCardHelpers()` (e.g. called before the HA frontend
  finished booting) is no longer cached forever. The rejection is dropped so
  the next `setConfig` retries instead of the card staying broken until reload.
- **Runtime:** The style pass and child observer are now re-established when the
  card is detached and reattached to the DOM (e.g. a drag reorder in the
  dashboard editor). Previously a reattach left the observer torn down, so
  late-mounting children were no longer stripped.
- **Runtime:** A late-arriving `hass` now repaints the card. If `hass` was set
  after the first render — most visibly for an empty stack, which has no later
  `_card` change to force a repaint — the card could stay blank; it now
  requests a single update on the first `hass`.
- **Runtime:** The mutation debounce now has a 1s max-wait ceiling, so a child
  that mutates faster than the 150ms debounce interval (a perpetually animating
  card) can no longer starve the style pass indefinitely.
- **Editor:** The custom-CSS editors no longer trim the value on every change.
  Trimming and feeding the result back caused `ha-code-editor` to replace its
  document mid-edit and jump the cursor. The raw value is stored (the runtime
  trims before injecting, so rendered output is unchanged).
- **Editor:** The embedded card picker could stay permanently, silently empty
  when editing an *existing* stack-in-card in a fresh browser session. Root
  cause (verified in the HA frontend source back to 2025.1): HA only registers
  its internal `<hui-card-picker>` when one of its own modules that imports it
  happens to load — the add-card dialog or a native stack/conditional card
  editor. The edit-card dialog, where this editor lives, does **not** import
  it, so our embedded tag stayed a dead, never-upgraded element until some
  other flow loaded the picker. The editor now deterministically preloads HA's
  stack-card editor module via the `loadCardHelpers()` API (which registers
  every embedded HA-internal: picker, element editor, tab group, arrow
  buttons). As a safety net, if the picker still isn't registered after 6
  seconds, a warning banner is shown instead of a silently empty area; it
  clears itself automatically if the picker registers late — the browser
  auto-upgrades any already-present tag once its class is defined.

### 🧪 Internal

- `dist/stack-in-card.js` is no longer committed to the repository — it is
  gitignored, and distribution happens exclusively via GitHub release assets:
  the release workflow builds and uploads the file when a release is
  published, and HACS installs from the latest release instead of `master`.
  Push/PR CI no longer builds at all.
- Added a `vitest` + `jsdom` test setup (matching the sibling cards) with
  regression tests covering all the runtime/editor fixes above (`npm test`,
  25 tests). CI now runs typecheck + tests on push/PR.
- Removed dead CSS rules (`.child-actions__spacer`, `.styles-editor--loading`,
  `.editor-footer__hint`, the unused `--sic-default-gap` custom property) and
  the unused `DEBUG` build-time injection.
- Empty-state placeholder icon is now an inline `<svg>` (path via the named
  `mdiPlusThick` import) instead of `<ha-svg-icon>`, removing the runtime
  render path's only dependency on an HA-internal component. Same icon, same
  size/colour.
- CI workflows now use `npm ci` instead of `npm install` for reproducible
  installs.

## [2.0.2] — 2026-06-27

### ✨ Features

- **Editor:** Added Material Design icons (`mdiTune`, `mdiCodeBraces`) to the "Keep options" and "Custom CSS" expandable sections in the visual editor, matching standard Home Assistant UI patterns.

### 🐛 Bug Fixes

- **Editor:** Fixed a bug where `keep.outer_padding` could not be disabled when `keep.margin` was active. The editor now explicitly saves `false` for this property instead of deleting the key, preventing the runtime backwards-compatibility fallback from incorrectly forcing it back to `true`.

## [2.0.1] — 2026-05-31

### 🚀 Performance fixes

- **SVG-namespace filter on `MutationObserver`** (`main.ts`) — graphing
  cards such as `mini-graph-card` (with `animate: true`), `apexcharts-card`
  and `history-graph` mutate SVG children (`<path>`, `<animate>`, `<g>`, …)
  on every animation frame. These elements are `ELEMENT_NODE`s and therefore
  previously slipped past the observer's node-type filter, triggering a
  full style re-walk up to ~7 times per second even when no real card
  structure had changed. The observer now skips any added node whose
  `namespaceURI` is `http://www.w3.org/2000/svg`. SVG elements can never
  carry an `ha-card` that needs style-stripping, so skipping them is always
  safe.

- **Linear O(N) tree-walker in `walkShadowAndLight`** (`helpers.ts`) — the
  previous implementation combined `querySelectorAll('*')` (which returns
  *all* descendants) with a recursive `el.children` traversal. Each element
  inside a shadow root was therefore visited once for every ancestor level
  above it (quadratic growth). On deeply nested cards like Mushroom,
  Bubble-Card or multiple-entity-row, this produced hundreds of redundant
  DOM accesses per style pass. The function now uses only direct `.children`
  at each level with a `Set`-based visited guard; every node is visited
  exactly once.

- **`getComputedStyle` fast-path** (`main.ts`) — the per-child-card
  background opt-out check now first tests `haCard.dataset.keepBackground ===
  'true'` (O(1) attribute lookup) before falling back to the existing
  `getComputedStyle(haCard).getPropertyValue('--keep-background')` call.
  The CSS-custom-property path is kept for full backwards compatibility; the
  new `data-keep-background="true"` attribute is the preferred zero-cost
  alternative for card authors.

- **CSS-injection retry cancellation** (`main.ts`) — pending `_applyChildCss`
  retry timeouts are now tracked in a `Set<ReturnType<typeof setTimeout>>`
  (`_retryTimeouts`) on the class. All outstanding retries are cancelled in
  both `disconnectedCallback` and at the start of `_createStack`, preventing
  stale CSS injection into newly rebuilt or removed card structures when
  the user edits YAML quickly in the Lovelace editor.

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
[2.0.1]: https://github.com/duczz/ha-stack-in-card/releases/tag/v2.0.1
[2.0.0]: https://github.com/duczz/ha-stack-in-card/releases/tag/v2.0.0
[0.2.0]: https://github.com/custom-cards/stack-in-card/releases/tag/v0.2.0
