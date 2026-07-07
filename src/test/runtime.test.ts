// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { mdiPlusThick } from '@mdi/js';
// Import the entry so `customElements.define('stack-in-card', …)` runs and
// createElement yields an upgraded instance with the class methods.
import '../stack-in-card';

function makeCardWithShadow(): HTMLElement {
  const el = document.createElement('div');
  el.attachShadow({ mode: 'open' });
  return el;
}

// Fake MutationRecord batch: our reactor only reads `type` + `addedNodes`
// (indexed with `.length`), so a plain array stands in for a NodeList.
function batch(nodes: Node[]): MutationRecord[] {
  return [{ type: 'childList', addedNodes: nodes as unknown as NodeList }] as MutationRecord[];
}

describe('Bug 1 — child MutationObserver stays alive across style passes', () => {
  afterEach(() => vi.restoreAllMocks());

  it('re-observes the stack after each disconnect', () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe');
    const el = document.createElement('stack-in-card') as any;
    el._card = makeCardWithShadow();

    el._ensureChildObserver();
    expect(observeSpy).toHaveBeenCalledTimes(1);

    // _applyAllStyles disconnects around its own writes, then re-ensures.
    el._childObserver.disconnect();
    el._ensureChildObserver();

    // Bug: the existence-guard used to skip observe() here → dead observer.
    expect(observeSpy).toHaveBeenCalledTimes(2);
  });

  it('reacts to a real added card but ignores SVG, text and our own <style> tags', () => {
    const el = document.createElement('stack-in-card') as any;

    const ownStyle = document.createElement('style');
    ownStyle.id = el._childStyleTagId ?? 'stack-in-card-child-style-1';
    const motherStyle = document.createElement('style');
    motherStyle.id = 'stack-in-card-mother-style';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const text = document.createTextNode('live value');
    const card = document.createElement('ha-card');

    expect(el._mutationsWarrantRestyle(batch([ownStyle]))).toBe(false);
    expect(el._mutationsWarrantRestyle(batch([motherStyle]))).toBe(false);
    expect(el._mutationsWarrantRestyle(batch([svg]))).toBe(false);
    expect(el._mutationsWarrantRestyle(batch([text]))).toBe(false);
    expect(el._mutationsWarrantRestyle(batch([card]))).toBe(true);
  });
});

describe('Bug 3 — nested stack-in-card CSS is not clobbered', () => {
  it('two instances use distinct per-child style tag ids', () => {
    const a = document.createElement('stack-in-card') as any;
    const b = document.createElement('stack-in-card') as any;
    expect(a._childStyleTagId).toBeTruthy();
    expect(a._childStyleTagId).not.toBe(b._childStyleTagId);
  });

  it("an outer cleanup pass leaves an inner instance's injected style intact", () => {
    const outer = document.createElement('stack-in-card') as any;
    const inner = document.createElement('stack-in-card') as any;

    // Shared subtree conceptually owned by `inner`.
    const child = document.createElement('div');
    const shadow = child.attachShadow({ mode: 'open' });
    shadow.appendChild(document.createElement('ha-card'));

    // inner injects its per-child CSS somewhere in the subtree.
    inner._applyChildCss(child, 'ha-card{color:red}', 0);
    const innerId = inner._childStyleTagId as string;
    expect(shadow.querySelector('#' + innerId)).toBeTruthy();

    // outer runs a cleanup pass over the same subtree (it has no CSS itself).
    outer._applyChildCss(child, undefined, 0);

    // Bug: with a shared id, outer's cleanup deleted inner's tag.
    expect(shadow.querySelector('#' + innerId)).toBeTruthy();
  });
});

describe('Bug 4 — getCardSize survives a rejected stack promise', () => {
  it('resolves to 1 instead of throwing', async () => {
    const el = document.createElement('stack-in-card') as any;
    el._cardPromise = Promise.reject(new Error('stack build failed'));
    await expect(el.getCardSize()).resolves.toBe(1);
  });
});

describe('Bug 6 — style pass is re-established after a DOM reattach', () => {
  afterEach(() => vi.restoreAllMocks());

  it('schedules a style pass on reconnect when a card exists', () => {
    const el = document.createElement('stack-in-card') as any;
    el._card = makeCardWithShadow();
    const spy = vi.spyOn(el, '_scheduleStyleApplication').mockImplementation(() => {});
    el.connectedCallback();
    expect(spy).toHaveBeenCalled();
  });

  it('does not schedule on connect when there is no card yet', () => {
    const el = document.createElement('stack-in-card') as any;
    const spy = vi.spyOn(el, '_scheduleStyleApplication').mockImplementation(() => {});
    el.connectedCallback();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('Bug 7 — debounced style pass has a max-wait ceiling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('runs the pass under continuous sub-debounce mutations', () => {
    vi.useFakeTimers();
    const el = document.createElement('stack-in-card') as any;
    const runSpy = vi.spyOn(el, '_runStylePass').mockImplementation(() => {});
    // Hammer a mutation-triggered schedule every 50ms (< 150ms debounce) for
    // 1.5s. Without a max-wait ceiling, each call resets the timer and the
    // pass never fires.
    for (let i = 0; i < 30; i++) {
      el._scheduleStyleApplication(true);
      vi.advanceTimersByTime(50);
    }
    expect(runSpy).toHaveBeenCalled();
  });

  it('still debounces a normal short burst (does not fire early)', () => {
    vi.useFakeTimers();
    const el = document.createElement('stack-in-card') as any;
    const runSpy = vi.spyOn(el, '_runStylePass').mockImplementation(() => {});
    el._scheduleStyleApplication(true);
    vi.advanceTimersByTime(100); // still within the 150ms debounce
    el._scheduleStyleApplication(true);
    vi.advanceTimersByTime(100);
    expect(runSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60); // now past the debounce of the 2nd call
    expect(runSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Bug 8 — a late-arriving hass triggers exactly one render', () => {
  afterEach(() => vi.restoreAllMocks());

  it('requests an update the first time hass is set', () => {
    const el = document.createElement('stack-in-card') as any;
    const spy = vi.spyOn(el, 'requestUpdate');
    el.hass = { states: {} };
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not request an update on subsequent hass updates', () => {
    const el = document.createElement('stack-in-card') as any;
    el.hass = { states: {} };
    const spy = vi.spyOn(el, 'requestUpdate');
    el.hass = { states: { 'sensor.x': 1 } };
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('Empty-state icon is an inline <svg>, not ha-svg-icon', () => {
  it('renders an <svg> with the mdiPlusThick path and no ha-svg-icon', async () => {
    const el = document.createElement('stack-in-card') as any;
    el.setConfig({ type: 'custom:stack-in-card', cards: [] });
    el.hass = { states: {} };
    document.body.appendChild(el);
    await el.updateComplete;

    const icon = el.shadowRoot.querySelector('.stack-in-card-empty__icon');
    expect(icon).toBeTruthy();
    expect(icon.tagName.toLowerCase()).toBe('svg');
    expect(icon.querySelector('path')?.getAttribute('d')).toBe(mdiPlusThick);
    // No dependency on HA's internal ha-svg-icon in the runtime render path.
    expect(el.shadowRoot.querySelector('ha-svg-icon')).toBeNull();

    el.remove();
  });
});
