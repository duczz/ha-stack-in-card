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

// Builds an inner stack the way HA does: #root > hui-card (light DOM) > child.
// A child either keeps its ha-card in a shadow root (usual) or in its light DOM.
function stackOf(kinds: ('shadow' | 'light')[]) {
  const stack = document.createElement('div');
  const sr = stack.attachShadow({ mode: 'open' });
  const root = document.createElement('div');
  root.id = 'root';
  sr.appendChild(root);
  const haCards = kinds.map((kind) => {
    const huiCard = document.createElement('hui-card');
    const child = document.createElement('x-child');
    const haCard = document.createElement('ha-card');
    if (kind === 'shadow') child.attachShadow({ mode: 'open' }).appendChild(haCard);
    else child.appendChild(haCard);
    huiCard.appendChild(child);
    root.appendChild(huiCard);
    return haCard;
  });
  return { stack, root, haCards };
}

describe('_walkChildren — a light-DOM ha-card in one child must not hide the others', () => {
  const walk = (kinds: ('shadow' | 'light')[]) => {
    const el = document.createElement('stack-in-card') as any;
    el._config = { keep: {} };
    const s = stackOf(kinds);
    el._walkChildren(s.stack, false);
    el._walkChildren(s.stack, true);
    return s;
  };

  it.each([
    [['shadow', 'light', 'shadow']],
    [['light', 'shadow', 'shadow']],
    [['shadow', 'shadow', 'light']],
    [['light', 'light']],
  ] as const)('strips every child for %j', (kinds) => {
    const { haCards, root } = walk([...kinds]);
    expect(haCards.map((c) => c.style.borderRadius)).toEqual(kinds.map(() => '0px'));
    expect(root.style.margin).toBe('0px');
  });
});

describe('preview — passed on to the inner stack', () => {
  it('forwards a later change to an existing stack', () => {
    const el = document.createElement('stack-in-card') as any;
    el._card = makeCardWithShadow();
    el.preview = true;
    expect(el._card.preview).toBe(true);
    el.preview = false;
    expect(el._card.preview).toBe(false);
  });

  it('sets preview on a stack that is built after it was announced', async () => {
    (window as any).loadCardHelpers = async () => ({
      createCardElement: () => {
        const card: any = document.createElement('div');
        card.setConfig = () => {};
        card.getCardSize = () => 1;
        return card;
      },
    });
    const el = document.createElement('stack-in-card') as any;
    el.preview = true;
    el.setConfig({ type: 'custom:stack-in-card', cards: [{ type: 'markdown' }] });
    await new Promise((r) => setTimeout(r, 20));
    expect(el._card.preview).toBe(true);
  });
});

describe('child shadow roots — an ha-card mounted after the pass gets styled', () => {
  afterEach(() => vi.restoreAllMocks());

  const tick = () => new Promise((r) => setTimeout(r, 0));

  // #root > hui-card > x-child (shadow root holds a warning, later the card)
  function lateStack() {
    const { stack, root } = stackOf([]);
    const huiCard = document.createElement('hui-card');
    const child = document.createElement('x-child');
    const sr = child.attachShadow({ mode: 'open' });
    sr.appendChild(document.createElement('hui-warning'));
    huiCard.appendChild(child);
    root.appendChild(huiCard);
    return { stack, sr };
  }

  it('collects the child shadow roots, and the roots under a nested stack', () => {
    const el = document.createElement('stack-in-card') as any;
    const { stack, sr } = lateStack();

    const nested = document.createElement('hui-vertical-stack-card');
    const nestedSr = nested.attachShadow({ mode: 'open' });
    const nestedRoot = document.createElement('div');
    nestedRoot.id = 'root';
    nestedSr.appendChild(nestedRoot);
    const inner = document.createElement('x-inner');
    const innerSr = inner.attachShadow({ mode: 'open' });
    nestedRoot.appendChild(inner);
    stack.shadowRoot!.getElementById('root')!.appendChild(nested);

    const roots = el._collectChildRoots(stack.shadowRoot!.getElementById('root'));
    expect(roots).toContain(sr);
    expect(roots).toContain(nestedSr);
    expect(roots).toContain(innerSr);
  });

  it('schedules a pass when a child mounts an ha-card in its own shadow root', async () => {
    const el = document.createElement('stack-in-card') as any;
    const { stack, sr } = lateStack();
    el._card = stack;
    const spy = vi.spyOn(el, '_scheduleStyleApplication').mockImplementation(() => {});

    el._observeChildRoots();
    sr.appendChild(document.createElement('ha-card'));
    await tick();

    expect(spy).toHaveBeenCalledWith(true);
    el._innerObserver.disconnect();
  });

  it('also reacts to a wrapper that holds an ha-card', async () => {
    const el = document.createElement('stack-in-card') as any;
    const { stack, sr } = lateStack();
    el._card = stack;
    const spy = vi.spyOn(el, '_scheduleStyleApplication').mockImplementation(() => {});

    el._observeChildRoots();
    const wrapper = document.createElement('div');
    wrapper.appendChild(document.createElement('ha-card'));
    sr.appendChild(wrapper);
    await tick();

    expect(spy).toHaveBeenCalledWith(true);
    el._innerObserver.disconnect();
  });

  it('ignores anything without an ha-card: rows, SVG, a <style> tag', () => {
    const el = document.createElement('stack-in-card') as any;
    const style = document.createElement('style');
    style.id = el._childStyleTagId;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const row = document.createElement('div');
    row.appendChild(document.createElement('hui-generic-entity-row'));

    expect(el._mutationsAddHaCard(batch([style]))).toBe(false);
    expect(el._mutationsAddHaCard(batch([svg]))).toBe(false);
    expect(el._mutationsAddHaCard(batch([row]))).toBe(false);
    expect(el._mutationsAddHaCard(batch([document.createTextNode('x')]))).toBe(false);
    expect(el._mutationsAddHaCard(batch([document.createElement('ha-card')]))).toBe(true);
  });

  it('is torn down with the element', () => {
    const el = document.createElement('stack-in-card') as any;
    const { stack } = lateStack();
    el._card = stack;
    el._observeChildRoots();
    expect(el._innerObserver).toBeTruthy();
    el.disconnectedCallback();
    expect(el._innerObserver).toBeUndefined();
  });
});

describe('_walkChildren — a nested stack is always descended into', () => {
  it('styles children of a nested *-stack-card, including a light-DOM ha-card', () => {
    const el = document.createElement('stack-in-card') as any;
    el._config = { keep: {} };
    const outer = stackOf(['shadow']);

    // A nested hui-vertical-stack-card whose child keeps its ha-card in light DOM.
    const nested = document.createElement('hui-vertical-stack-card');
    const nestedSr = nested.attachShadow({ mode: 'open' });
    const nestedRoot = document.createElement('div');
    nestedRoot.id = 'root';
    nestedSr.appendChild(nestedRoot);
    const huiCard = document.createElement('hui-card');
    const child = document.createElement('x-child');
    const lightCard = document.createElement('ha-card');
    child.appendChild(lightCard);
    huiCard.appendChild(child);
    nestedRoot.appendChild(huiCard);
    const nestedHui = document.createElement('hui-card');
    nestedHui.appendChild(nested);
    outer.root.appendChild(nestedHui);

    el._walkChildren(outer.stack, false);
    el._walkChildren(outer.stack, true);

    expect(outer.haCards[0].style.borderRadius).toBe('0px');
    expect(lightCard.style.borderRadius).toBe('0px');
    expect(nestedRoot.style.margin).toBe('0px');
  });
});

describe('observers — teardown and abandoned passes', () => {
  it('_createStack drops the child-root observer', async () => {
    const el = document.createElement('stack-in-card') as any;
    el._config = { type: 'custom:stack-in-card', mode: 'vertical', cards: [], keep: {} };
    const disconnect = vi.fn();
    el._innerObserver = { disconnect };

    await el._createStack();

    expect(disconnect).toHaveBeenCalled();
    expect(el._innerObserver).toBeUndefined();
  });

  it('a pass on a detached element leaves no observers behind', async () => {
    const el = document.createElement('stack-in-card') as any;
    el._config = { type: 'custom:stack-in-card', mode: 'vertical', cards: [{ type: 'markdown' }], keep: {} };
    const { stack } = stackOf(['shadow']);
    el._card = stack;
    expect(el.isConnected).toBe(false);

    await el._applyAllStyles();

    expect(el._childObserver).toBeUndefined();
    expect(el._innerObserver).toBeUndefined();
  });
});

describe('end to end — an ha-card mounted late in a child shadow root', () => {
  afterEach(() => vi.restoreAllMocks());
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  it('gets styled, and the stack then settles without further passes', async () => {
    // #root > hui-card > x-child; the child's shadow root shows a warning first.
    const { stack, root } = stackOf([]);
    const huiCard = document.createElement('hui-card');
    const child = document.createElement('x-child');
    const childRoot = child.attachShadow({ mode: 'open' });
    childRoot.appendChild(document.createElement('hui-warning'));
    huiCard.appendChild(child);
    root.appendChild(huiCard);

    const el = document.createElement('stack-in-card') as any;
    el._config = { type: 'custom:stack-in-card', mode: 'vertical', cards: [{ type: 'markdown' }], keep: {} };
    el.hass = {};
    document.body.appendChild(el);
    const passes = vi.spyOn(el, '_applyAllStyles');
    el._card = stack;                       // reactive: schedules the first pass
    await wait(600);

    const late = document.createElement('ha-card');
    childRoot.appendChild(late);
    await wait(1200);                       // debounce (150 ms) + two frames

    expect(late.style.borderRadius).toBe('0px');

    const settled = passes.mock.calls.length;
    await wait(1500);
    expect(passes.mock.calls.length).toBe(settled);   // no loop
    el.remove();
  });
});

describe('_walkChildren — the stack\'s own ha-card', () => {
  // Children as in HA: #root > hui-card > x-child (shadow root with an ha-card).
  const addChild = (root: Element) => {
    const huiCard = document.createElement('hui-card');
    const child = document.createElement('x-child');
    const haCard = document.createElement('ha-card');
    child.attachShadow({ mode: 'open' }).appendChild(haCard);
    huiCard.appendChild(child);
    root.appendChild(huiCard);
    return haCard;
  };
  const walk = (stack: Element) => {
    const el = document.createElement('stack-in-card') as any;
    el._config = { keep: {} };
    el._walkChildren(stack, false);
    el._walkChildren(stack, true);
  };

  it('styles an ha-card outside #root and still walks the children', () => {
    const stack = document.createElement('div');
    const sr = stack.attachShadow({ mode: 'open' });
    const own = document.createElement('ha-card');
    const root = document.createElement('div');
    root.id = 'root';
    sr.append(own, root);
    const childCard = addChild(root);

    walk(stack);

    expect(own.style.borderRadius).toBe('0px');
    expect(childCard.style.borderRadius).toBe('0px');
  });

  it('styles an ha-card that wraps #root and still walks the children', () => {
    const stack = document.createElement('div');
    const sr = stack.attachShadow({ mode: 'open' });
    const own = document.createElement('ha-card');
    const root = document.createElement('div');
    root.id = 'root';
    own.appendChild(root);
    sr.appendChild(own);
    const childCard = addChild(root);

    walk(stack);

    expect(own.style.borderRadius).toBe('0px');
    expect(childCard.style.borderRadius).toBe('0px');
  });

  it('styles an <ha-card id="root"> as the stack\'s own card, and its children', () => {
    const stack = document.createElement('div');
    const sr = stack.attachShadow({ mode: 'open' });
    const root = document.createElement('ha-card');
    root.id = 'root';
    sr.appendChild(root);
    const childCard = addChild(root);

    walk(stack);

    expect(root.style.borderRadius).toBe('0px');
    expect(childCard.style.borderRadius).toBe('0px');
  });
});

describe('child-root filter and abandoned passes — gaps the first tests left', () => {
  it('ignores an SVG element even when it holds an ha-card', () => {
    const el = document.createElement('stack-in-card') as any;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(document.createElement('ha-card'));
    expect(svg.querySelector('ha-card')).not.toBeNull();   // the filter, not emptiness, must decide
    expect(el._mutationsAddHaCard(batch([svg]))).toBe(false);
  });

  it('a pass abandons itself when the stack is swapped while it waits', async () => {
    const el = document.createElement('stack-in-card') as any;
    el._config = { type: 'custom:stack-in-card', mode: 'vertical', cards: [{ type: 'markdown' }], keep: {} };
    vi.spyOn(el, '_scheduleStyleApplication').mockImplementation(() => {});
    document.body.appendChild(el);

    let release!: () => void;
    const first = stackOf(['shadow']).stack as any;
    first.updateComplete = new Promise<void>((r) => (release = r));
    el._card = first;
    const pass = el._applyAllStyles();      // waits on first.updateComplete

    el._card = stackOf(['shadow']).stack;   // a rebuild swaps the stack meanwhile
    release();
    await pass;

    expect(el._childObserver).toBeUndefined();
    expect(el._innerObserver).toBeUndefined();
    el.remove();
  });
});
