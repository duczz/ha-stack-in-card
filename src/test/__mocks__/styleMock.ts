// Test stand-in for `import styles from './styles.css'`.
//
// In the real build, rollup-plugin-postcss-lit turns the .css file into a Lit
// `CSSResult`. That rollup plugin isn't active under vitest, and letting vite's
// own CSS pipeline process the file hangs on this repo's setup. The editor's
// `static get styles` is never evaluated in our tests (we only construct the
// runtime <stack-in-card>, not the editor), so an empty CSSResult is enough to
// satisfy the module-level import.
import { css } from 'lit';

export default css``;
