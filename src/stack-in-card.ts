import { version } from '../package.json';
import StackInCard from './main';

// IMPORTANT: window.customCards uses the *bare* element name as `type`,
// NOT prefixed with "custom:". The picker treats this as the element tag
// and tries to instantiate it directly; with the "custom:" prefix it
// fails silently and the preview tile hangs on a spinner.
// (This matches what mushroom, button-card, and the working
// ha-stack-in-card reference all do.)
const CARD_NAME = 'stack-in-card';

(function earlyRegisterCustomCard() {
  const w = window as any;
  w.customCards = w.customCards || [];
  if (!w.customCards.find((c: any) => c.type === CARD_NAME)) {
    w.customCards.push({
      type: CARD_NAME,
      name: 'Stack In Card',
      preview: true,
      description:
        'Group multiple cards into a single seamless card — with a visual editor and per-card custom CSS.',
      documentationURL: 'https://github.com/duczz/ha-stack-in-card',
    });
  }
})();

// Guard against double-registration when the file is loaded multiple times
// (e.g. HACS + manual resource).
if (!customElements.get(CARD_NAME)) {
  customElements.define(CARD_NAME, StackInCard);

  console.info(
    `%c STACK-IN-CARD %c v${version} `,
    'color: white; background: #6f4cff; font-weight: 700; padding: 2px 6px; border-radius: 3px 0 0 3px;',
    'color: #6f4cff; background: #1f1f1f; font-weight: 700; padding: 2px 6px; border-radius: 0 3px 3px 0;',
  );
}

