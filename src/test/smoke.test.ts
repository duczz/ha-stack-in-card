// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

describe('test infra smoke', () => {
  it('has a jsdom document', () => {
    expect(typeof document).toBe('object');
    const el = document.createElement('div');
    expect(el.tagName).toBe('DIV');
  });

  it('has MutationObserver + attachShadow + rAF', () => {
    expect(typeof MutationObserver).toBe('function');
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    expect(root).toBeTruthy();
    expect(typeof requestAnimationFrame).toBe('function');
  });

  it('can import the runtime module (pulls editor + styles.css + package.json)', async () => {
    const mod = await import('../main');
    expect(mod.default).toBeTruthy();
  });
});
