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
 * carry a `styles` string. The CSS in that string is injected into the
 * child card's shadow DOM only — it does not leak to sibling cards.
 */
export interface StackChildCardConfig extends LovelaceCardConfig {
  styles?: string;
}

export interface StackInCardConfig extends LovelaceCardConfig {
  type: 'custom:stack-in-card' | string;
  mode?: 'horizontal' | 'vertical';
  cards: StackChildCardConfig[];
  title?: string;
  keep?: KeepConfig;
  /** CSS applied to the outer stack-in-card itself (the "mother" card). */
  styles?: string;
}
