import { HASS, LovelaceCard, LovelaceCardConfig, StackChildCardConfig } from './types';

let helpersPromise: Promise<any> | undefined;

export function loadCardHelpers(): Promise<any> {
  if (!helpersPromise) {
    const win = window as any;
    helpersPromise = typeof win.loadCardHelpers === 'function'
      ? win.loadCardHelpers()
      : Promise.reject(new Error('loadCardHelpers is not available'));
  }
  return helpersPromise as Promise<any>;
}

export async function createCardElement(
  config: LovelaceCardConfig,
  hass?: HASS,
): Promise<LovelaceCard> {
  const helpers = await loadCardHelpers();
  const element: LovelaceCard = helpers.createCardElement(config);
  if (hass) element.hass = hass;
  return element;
}

export function computeCardSize(card: LovelaceCard): number | Promise<number> {
  if (typeof card.getCardSize === 'function') {
    return card.getCardSize();
  }
  if (customElements.get(card.localName)) {
    return 1;
  }
  return customElements
    .whenDefined(card.localName)
    .then(() => computeCardSize(card));
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Stack-in-card-only fields that must not leak into child configs handed
 * off to HA's `createCardElement` or its built-in card editors. */
const STACK_IN_CARD_ONLY_FIELDS = ['styles'] as const;

/** Strip stack-in-card-only fields from a child config. Used both by the
 * runtime (before handing children to HA's stack constructor) and by the
 * editor (before handing the active child to <hui-card-element-editor>). */
export function stripStackInCardFields(config: StackChildCardConfig): LovelaceCardConfig {
  const copy: any = { ...config };
  for (const f of STACK_IN_CARD_ONLY_FIELDS) delete copy[f];
  return copy as LovelaceCardConfig;
}

/** Walk a DOM subtree visiting every element in both the light DOM and any
 * nested shadow roots. The visitor is called with each element node.
 * Used for both injection ("write a <style> into every shadow root") and
 * cleanup ("remove that <style> again"). */
export function walkShadowAndLight(
  element: HTMLElement,
  visitor: (node: HTMLElement | ShadowRoot) => void,
): void {
  const visit = (el: any): void => {
    if (!el) return;
    if (el.shadowRoot) {
      visitor(el.shadowRoot);
      el.shadowRoot.querySelectorAll('*').forEach((c: any) => visit(c));
    }
    if (el.children) {
      Array.from(el.children).forEach((c) => visit(c as HTMLElement));
    }
  };
  visitor(element);
  visit(element);
}
