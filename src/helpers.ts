import { HASS, LovelaceCard, LovelaceCardConfig, StackChildCardConfig } from './types';

let helpersPromise: Promise<any> | undefined;

export function loadCardHelpers(): Promise<any> {
  // Return the cached promise only once we know it resolved (or is pending).
  if (helpersPromise) return helpersPromise;

  const win = window as any;
  if (typeof win.loadCardHelpers !== 'function') {
    // Don't cache this rejection: HA may register `loadCardHelpers` a moment
    // after our first call (frontend still booting). Caching the rejection
    // would poison the card until a full page reload. Returning a fresh
    // rejection each time lets the next setConfig/_createStack retry.
    return Promise.reject(new Error('loadCardHelpers is not available'));
  }

  const p = win.loadCardHelpers();
  helpersPromise = p;
  // If the helpers promise itself rejects, drop it from the cache so a later
  // call can retry instead of being stuck on the rejected promise forever.
  p.catch(() => {
    if (helpersPromise === p) helpersPromise = undefined;
  });
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
 * off to HA's `createCardElement` or its built-in card editors. The field
 * is namespaced (`stack_in_card_*`) to avoid clashing with cards like
 * bubble-card / button-card that use their own `styles:` field. */
const STACK_IN_CARD_ONLY_FIELDS = ['stack_in_card_styles'] as const;

/** Is this child config another stack-in-card?
 *
 * Such a child owns `stack_in_card_styles` itself — the field is its *own*
 * mother CSS, not per-child CSS belonging to us. We therefore hand the field
 * through untouched instead of stripping it and brute-force injecting it into
 * the child's whole subtree (which reached its grandchildren, styling cards
 * nobody configured). Its own editor preserves the field too, so the
 * re-attach in `_childCardConfigChanged` must skip it as well.
 *
 * The bare name is accepted alongside the `custom:` prefix because that's the
 * name the element is registered under; YAML always carries the prefix. */
export function isStackInCardConfig(config: { type?: string } | undefined): boolean {
  const type = config?.type;
  return type === 'custom:stack-in-card' || type === 'stack-in-card';
}

/** Strip stack-in-card-only fields from a child config. Used both by the
 * runtime (before handing children to HA's stack constructor) and by the
 * editor (before handing the active child to <hui-card-element-editor>).
 *
 * Callers must skip nested stack-in-card children — see
 * `isStackInCardConfig`. */
export function stripStackInCardFields(config: StackChildCardConfig): LovelaceCardConfig {
  const copy: any = { ...config };
  for (const f of STACK_IN_CARD_ONLY_FIELDS) delete copy[f];
  return copy as LovelaceCardConfig;
}

/** Walk a DOM subtree visiting every element in both the light DOM and any
 * nested shadow roots. The visitor is called with each element node.
 * Used for both injection ("write a <style> into every shadow root") and
 * cleanup ("remove that <style> again").
 *
 * Each node is visited exactly once (O(N)). The previous implementation
 * mixed `querySelectorAll('*')` (all descendants) with recursive
 * `el.children` traversal, which caused every element inside a shadow root
 * to be revisited N times (once per ancestor level) — a quadratic blowup
 * on deeply nested custom cards like Mushroom or Bubble-Card. */
export function walkShadowAndLight(
  element: HTMLElement,
  visitor: (node: HTMLElement | ShadowRoot) => void,
): void {
  // Guard against cycles (e.g. open shadow roots that reference parents).
  const visited = new Set<Element | ShadowRoot>();

  const visit = (el: any): void => {
    if (!el || visited.has(el)) return;
    visited.add(el);

    if (el.shadowRoot && !visited.has(el.shadowRoot)) {
      visited.add(el.shadowRoot);
      visitor(el.shadowRoot);
      // Traverse only the *direct* children of the shadow root — the
      // recursion takes care of deeper levels, one level at a time.
      Array.from(el.shadowRoot.children).forEach((c) => visit(c as HTMLElement));
    }

    if (el.children) {
      Array.from(el.children).forEach((c) => visit(c as HTMLElement));
    }
  };

  visitor(element);
  visit(element);
}
