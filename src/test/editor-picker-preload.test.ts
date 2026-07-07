// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import '../editor';

// Verifies the deterministic fix for the "dead picker" bug: HA only registers
// <hui-card-picker> when one of ITS OWN modules that imports it loads (the
// add-card dialog, or a native stack/conditional card editor). The edit-card
// dialog does NOT import it, so editing an existing card in a fresh browser
// session left our embedded picker a dead, never-upgraded tag. The editor now
// preloads HA's stack-card editor module via loadCardHelpers(), which
// registers every HA-internal we embed.
//
// NOTE on ordering: both tests share this file's jsdom registry and the
// module-level loadCardHelpers cache. The "preloads" test MUST run first
// (it defines hui-card-picker as a side effect); the "skips" test then
// asserts no second preload happens against the same cached helpers object.

class StackMock extends HTMLElement {
  static getConfigElement = vi.fn(async () => {
    if (!customElements.get('hui-card-picker')) {
      customElements.define('hui-card-picker', class extends HTMLElement {});
    }
    return document.createElement('div');
  });
}

const helpers = {
  createCardElement: vi.fn(() => {
    // Simulates HA's lazy card-module load: creating the element causes the
    // class to be defined.
    if (!customElements.get('hui-vertical-stack-card')) {
      customElements.define('hui-vertical-stack-card', StackMock);
    }
    return document.createElement('hui-vertical-stack-card');
  }),
};

function makeEditor() {
  const ed = document.createElement('stack-in-card-editor') as any;
  ed.hass = { localize: () => '' };
  ed.setConfig({ type: 'custom:stack-in-card', cards: [] });
  document.body.appendChild(ed);
  return ed;
}

describe('hui-card-picker preload', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('preloads the stack editor deps so the picker registers (no banner)', async () => {
    vi.useFakeTimers();
    (window as any).loadCardHelpers = vi.fn(async () => helpers);

    expect(customElements.get('hui-card-picker')).toBeUndefined();
    const ed = makeEditor();
    await vi.runAllTimersAsync();

    expect(helpers.createCardElement).toHaveBeenCalledWith({
      type: 'vertical-stack',
      cards: [],
    });
    expect(StackMock.getConfigElement).toHaveBeenCalled();
    expect(customElements.get('hui-card-picker')).toBeTruthy();
    // Watchdog is satisfied — the 6s timeout fired during runAllTimersAsync.
    expect(ed._cardPickerLoadFailed).toBe(false);

    ed.remove();
  });

  it('skips the preload when hui-card-picker is already registered', async () => {
    vi.useFakeTimers();
    const callsBefore = helpers.createCardElement.mock.calls.length;

    const ed = makeEditor();
    await vi.runAllTimersAsync();

    expect(helpers.createCardElement.mock.calls.length).toBe(callsBefore);
    expect(ed._cardPickerLoadFailed).toBe(false);

    ed.remove();
  });
});
