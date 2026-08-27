export type LooseObject = Record<string, any>;

export interface HASS {
  states?: Record<string, any>;
  callService?: (domain: string, service: string, data?: LooseObject) => Promise<any>;
  performAction?: (args: { action: string; data?: LooseObject }) => Promise<any>;
  [key: string]: any;
}

export interface LovelaceCardConfig {
  type: string;
  [key: string]: any;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HASS;
  isPanel?: boolean;
  editMode?: boolean;
  setConfig(config: LovelaceCardConfig): void;
  getCardSize(): number | Promise<number>;
  style: CSSStyleDeclaration;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HASS;
  setConfig(config: LovelaceCardConfig): void;
}

export interface KeepConfig {
  margin?: boolean;
  background?: boolean;
  box_shadow?: boolean;
  border_radius?: boolean;
  outer_padding?: boolean;
}

/**
 * Child card config: a regular Lovelace card config that may additionally
 * carry a `stack_in_card_styles` string. The CSS in that string is injected
 * into every shadow root inside that child card, and stays there — the shadow
 * boundary does the isolating, not the selector.
 *
 * A card that keeps its `ha-card` in the light DOM is the exception: there is
 * nowhere private to put the CSS, so it goes into the scope the child shares
 * with its siblings and can reach them, whatever the selector — `ha-card { }`
 * included, since a sibling's light-DOM `ha-card` sits in that same scope. A
 * card that renders neither a shadow DOM nor an `ha-card` receives nothing:
 * there is no way to know what it wants styled, and the old catch-all styled
 * the whole stack.
 *
 * On a child that is itself a stack-in-card the field means something else:
 * it is that card's own stack CSS, handed through untouched.
 *
 * The field is namespaced (`stack_in_card_*`) to avoid clashing with cards
 * like bubble-card or button-card that use their own `styles:` field.
 */
export interface StackChildCardConfig extends LovelaceCardConfig {
  stack_in_card_styles?: string;
}

export interface StackInCardConfig extends LovelaceCardConfig {
  type: 'custom:stack-in-card' | string;
  mode?: 'horizontal' | 'vertical';
  cards: StackChildCardConfig[];
  title?: string;
  keep?: KeepConfig;
  /** CSS applied to the outer stack-in-card itself (the "mother" card). */
  stack_in_card_styles?: string;
}
