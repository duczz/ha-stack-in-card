<div align="center">

# Stack In Card

### A modern stack card for Home Assistant Lovelace UI

[![HACS][hacs-badge]][hacs-url]
[![Home Assistant][ha-badge]][ha-url]
[![Version][version-badge]][release-url]

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=duczz&repository=ha-stack-in-card&category=dashboard)

</div>

---

A modernised replacement for `vertical-stack-in-card` and
`horizontal-stack-in-card`. Group multiple Lovelace cards into a single
seamless card — without inner borders, shadows or padding gaps. Includes a
**HA-native visual editor** and **per-card custom CSS**.

---

<a id="about-this-fork"></a>
## 🛠️ About this fork

This project is a modernised complete rewrite of the 2020-era `custom-cards/stack-in-card`, rebuilt to support the latest Home Assistant frontend stack (HA 2025.1+).
For all new features, bug fixes, and improvements, please check the [CHANGELOG.md](CHANGELOG.md).

### Modernisation
- ⚡ **Lit 3 + TypeScript 5.7 + Rollup 4** — full migration from Lit-element 2 / TS 4 / Rollup 2
- 📦 **No `custom-card-helpers`** — local types, modern HA `loadCardHelpers()`-only path
- 👀 **Style-application via `MutationObserver`** — replaces the fragile `setTimeout(500)` of the original; late-mounted nested cards (e.g. `mushroom`, `button-card`) get their styles applied as they mount
- 🏁 **Race-condition guarded** — monotonic generation counter on async stack creation; rapid config updates from the editor can no longer overwrite each other

### Visual editor (new in v2)
Matches HA's own stack-card editor 1:1:
- 🗂️ **Native `<ha-tab-group>` tabs** for switching between child cards (falls back to styled buttons on HA versions without it)
- 🎛️ **Action row** — GUI/YAML toggle, RTL-aware move-before / move-after, copy, cut, delete (same icons + German translations as HA's built-in editor)
- ➕ **Embedded `<hui-card-picker>`** for adding cards — full picker UX with built-in, custom, and HACS cards. Used inline, no `show-create-card-dialog` round-trip
- 📋 **Paste-from-clipboard banner** — shares HA's `dashboardCardClipboard` sessionStorage key, so cards copied from any HA editor (built-in stack, this card, etc.) can be pasted here
- 🧩 **Embedded `<hui-card-element-editor>`** per child — the same nested editor HA uses; auto-detects per-type GUI editors, falls back to YAML for types that don't ship one. Re-mounted on every reorder via Lit's `keyed()` directive (same mechanism HA itself uses) so reorder actually persists in YAML
- 🚪 **Empty stack opens directly in the picker** — adding the card drops the user straight into card selection, no placeholder children to delete first
- 🪧 **Inline empty-state placeholder** — never a spinning preview in the picker

### Custom CSS
- 🎨 **Top-level `stack_in_card_styles`** — CSS applied to the outer **stack card** (`ha-card` wrapper)
- 🎯 **Per-child `cards[i].stack_in_card_styles`** — CSS injected into a single child's shadow DOM only (no leak to siblings)
- 🛡️ **Namespaced field name** — avoids clashing with cards like `bubble-card` / `button-card` that use their own `styles:` field
- ✏️ Both edited via `<ha-code-editor>` with entity / icon autocompletion in the visual editor
- 🧳 Per-child styles travel with the card across reorder / copy / paste

### Bug fixes carried over
- 🔁 **Element double-registration guard** — loading the bundle twice (HACS + manual resource) no longer throws `NotSupportedError`
- ✅ **Card validation in `setConfig`** — rejects unknown `mode` values and non-array `cards`
- 🧹 **Cleanup on disconnect** — animation frames, mutation observer, and card promise all torn down in `disconnectedCallback`
- 🔍 **`customCards.type` without `custom:` prefix** — HA's picker calls `document.createElement(type)` on this value; the prefix would fail silently and hang the preview tile

### Performance & stability
- 🚦 **Mutation-burst debounce** — live-updating children (`history-graph`, `mini-graph-card`, animations) no longer pin the main thread on repeated style re-walks; bursts are coalesced into a single pass every ~150 ms
- 🎯 **Mutation filter** — observer ignores text / attribute changes and only reacts to actual element insertions
- 🖼️ **SVG-namespace filter** — SVG child elements (`<path>`, `<animate>`, `<g>`, …) added by graphing cards (`mini-graph-card`, `apexcharts-card`) are excluded from the observer entirely; they can never introduce a new `ha-card` to strip, so reacting to them was pure overhead
- 🌳 **Linear O(N) DOM walker** — `walkShadowAndLight` previously mixed `querySelectorAll('*')` with recursive child traversal, visiting shadow-DOM descendants once per ancestor level (quadratic growth). Now uses only direct `.children` per level with a visited guard; every node is touched exactly once
- ⏱️ **CSS-injection retry cap tightened** — 3 × 200 ms instead of 10 × 500 ms; stuck children no longer spam `walkShadowAndLight` for 5 seconds
- 🧹 **CSS-injection retry cancellation** — pending retries are cancelled when the stack is rebuilt or disconnected, preventing stale CSS from leaking into new card structures
- 🪟 **Picker null-deref fix** — `<hui-card-picker>` is now unmounted on the next animation frame after a pick, so its own `updated()` pass finishes cleanly (no more `getElementById on null` at `hui-card-picker.ts:286`)

### CI / packaging

- 🤖 **Continuous Integration** — `.github/workflows/build.yml` typechecks and builds the project on push to catch errors early, without polluting git history
- 🏷️ **Tagged-release workflow** — `git tag v2.x.x && git push --tags` builds and creates a GitHub Release with the JS file as an asset
- ✔️ **HACS validation workflow** — verifies the repo stays HACS-compliant on every push



---

## Table of Contents

- [About this fork](#about-this-fork)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Visual Editor](#-visual-editor)
- [Configuration](#️-configuration)
  - [All options](#all-options)
  - [Keep object](#keep-object)
- [Custom CSS](#-custom-css)
  - [Stack-card CSS](#stack-card-css)
  - [Per-child CSS](#per-child-css)
  - [Tips](#tips)
- [Examples](#-examples)
- [Migration from the original `stack-in-card`](#-migration-from-the-original-stack-in-card)

---

## 📦 Requirements

- **Home Assistant 2025.1** or newer
  *(some editor features — `<ha-tab-group>`, `<hui-card-element-editor>`, `@mdi/js` icon paths — rely on frontend changes from late 2024 / early 2025. On HA 2025.10+ the editor uses the native tab control; on older versions it falls back to styled buttons.)*
- HACS (recommended) or manual install

---

## 🚀 Installation

### HACS (recommended)

1. Open **HACS** in Home Assistant
2. Go to **Frontend** → three-dot menu → **Custom repositories**
3. Add this repository URL, category: **Lovelace**
4. Search for **Stack In Card** and install
5. Reload the browser (hard refresh: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>)

### Manual

1. Download `stack-in-card.js` from the [latest release][release-url] (or from `dist/stack-in-card.js` on master) and place it in `config/www/`.
2. Add to your Lovelace resources:

```yaml
resources:
  - url: /local/stack-in-card.js?v=1
    type: module
```

---

## 🖱️ Visual Editor

The card has a built-in visual editor accessible from the HA card picker. Most settings can be configured without YAML.

### Sections

| Section | What it does |
|---|---|
| **Title** | Optional header text rendered at the top of the stack |
| **Mode** | `vertical` (default) or `horizontal` layout of the child cards |
| **Keep options** | Toggle which visual properties of child cards to preserve (background, box-shadow, border-radius, margin between cards, outer padding) |
| **Custom CSS — Stack card** | CSS code editor for the outer `<ha-card>` wrapper |
| **Cards** | Tab strip + add (`+`) button; click `+` to open the embedded card picker |
| **Per-card actions** | GUI/YAML toggle, move before, move after, copy, cut, delete — same as HA's own stack editor |
| **Custom CSS — Card N** | CSS code editor for the currently selected child card (scoped to that child only) |

> **Tip:** Cards copied or cut in any HA editor (this card, HA's built-in stack, etc.) appear as a **Paste from clipboard** entry at the top of the picker — they share the same `dashboardCardClipboard` sessionStorage slot.

---

## ⚙️ Configuration

### All options

| Name     | Type             | Required | Description                                                              | Default    |
| -------- | ---------------- | -------- | ------------------------------------------------------------------------ | ---------- |
| `type`   | string           | yes      | `custom:stack-in-card`                                                   |            |
| `title`  | string           | no       | Header of the wrapper card                                               |            |
| `mode`   | string           | no       | `vertical` or `horizontal`                                               | `vertical` |
| `cards`  | array            | yes      | Child card configs (each may carry its own `stack_in_card_styles` field) | `[]`       |
| `keep`   | object           | no       | See [keep object](#keep-object)                                          |            |
| `stack_in_card_styles` | string | no   | CSS applied to the outer stack card (the `ha-card` wrapper)              |            |

### Keep object

| Name            | Type    | Description                                                                                                                                | Default                                       |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `background`    | boolean | Keep the background on **all** child cards. To keep it only on specific ones, use `data-keep-background="true"` on that card's `ha-card` element (fast O(1) lookup), or set the CSS variable `--keep-background: 'true'` on that card (backwards-compatible, requires `getComputedStyle`). | `false`                                       |
| `box_shadow`    | boolean | Keep the `box-shadow` on **all** child cards.                                                                                              | `false`                                       |
| `margin`        | boolean | Keep the `margin` between **all** child cards.                                                                                             | `false`                                       |
| `outer_padding` | boolean | Add `8px` padding around the inner stack when margin is kept.                                                                              | `true` if `margin` is `true`, otherwise `false` |
| `border_radius` | boolean | Keep the `border-radius` on **all** child cards.                                                                                           | `false`                                       |

---

## 🎨 Custom CSS

Two levels:

### Stack-card CSS

Lives at the top level of the config as `stack_in_card_styles`. Applied to the outer `<ha-card>` wrapper itself.

```yaml
type: custom:stack-in-card
stack_in_card_styles: |
  ha-card {
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
cards:
  - type: entities
    entities: [sun.sun]
```

### Per-child CSS

Lives on each child's own config as `stack_in_card_styles`. Injected into that child's shadow DOM only — doesn't leak to siblings.

```yaml
type: custom:stack-in-card
cards:
  - type: button
    entity: sun.sun
    stack_in_card_styles: |
      ha-card {
        background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%) !important;
      }
  - type: button
    entity: sun.sun
    stack_in_card_styles: |
      ha-card {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
      }
```

Because per-child CSS lives on the child config, it travels with the card across reorder / copy / paste. No parallel index array to keep in sync.

> 💡 **Why the long name?** A plain `styles:` would clash with cards like `bubble-card` and `button-card` that use the same key for their own styling system. The namespaced `stack_in_card_styles:` is unmistakably ours and lets both systems coexist on the same child.

### Tips

- `background` needs `!important` to override HA's `--ha-card-background` theme variable. `border-radius`, `box-shadow`, and most other properties usually don't.
- The visual editor's CSS editors use `mode="yaml"` because HA's `<ha-code-editor>` doesn't ship a CSS mode. Highlighting won't perfectly match CSS, but everything works.
- Prefer HA's CSS variables (`--primary-color`, `--card-background-color`, etc.) so your stack respects the active theme.

#### Keep the background of one specific child

Useful for `button-card`, which colours its own `ha-card`:

```yaml
type: custom:stack-in-card
mode: vertical
cards:
  - type: custom:button-card
    entity: sun.sun
    color_type: card
    styles:
      card:
        - --keep-background: 'true'
```

The `--keep-background` CSS variable is read by the stack itself before deciding whether to strip the child's background. Alternatively, you can set `data-keep-background="true"` directly on the `ha-card` element — this is an O(1) attribute lookup and slightly faster than the CSS-variable path.

---

## ✨ Examples

### Sunset card

```yaml
type: custom:stack-in-card
mode: vertical
stack_in_card_styles: |
  ha-card {
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(255, 94, 98, 0.4);
  }
cards:
  - type: entities
    entities:
      - sun.sun
    stack_in_card_styles: |
      ha-card {
        background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%) !important;
        color: white !important;
      }
```

### Glassmorphism

```yaml
type: custom:stack-in-card
stack_in_card_styles: |
  ha-card {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 16px;
  }
cards:
  - type: entities
    entities:
      - sun.sun
```

---

## 🔄 Migration from the original `stack-in-card`

All `0.2.x` YAML configurations continue to work unchanged. The only addition is the optional `stack_in_card_styles` field — either on the top-level config (for the stack card) or on individual child configs.

Behavioural differences worth knowing:
- The editor is now visual by default — the **+** button opens HA's embedded card picker rather than requiring YAML edits.
- An empty `cards: []` is now a valid config (renders an empty-state placeholder); the original threw on this.
- Per-child styles live on each child's config (`cards[i].stack_in_card_styles`), not on a separate index-keyed array.

---

## 🧰 Development

```bash
npm install
npm run dev        # rollup watch
npm run build      # production build → dist/stack-in-card.js
npm run typecheck
```

Build output is a single ES module at `dist/stack-in-card.js` (~48 KB minified).

---

[hacs-badge]: https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge
[hacs-url]: https://github.com/custom-components/hacs
[ha-badge]: https://img.shields.io/badge/Home%20Assistant-2025.1%2B-blue?style=for-the-badge&logo=home-assistant
[ha-url]: https://www.home-assistant.io/
[version-badge]: https://img.shields.io/github/v/release/duczz/ha-stack-in-card.svg?style=for-the-badge
[release-url]: https://github.com/duczz/ha-stack-in-card/releases
[license-badge]: https://img.shields.io/github/license/duczz/ha-stack-in-card.svg?style=for-the-badge
