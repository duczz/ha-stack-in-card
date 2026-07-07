// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// helpers.ts reads the global `window.loadCardHelpers`. Each test gets a fresh
// module instance (module-level cache) via vi.resetModules() + dynamic import.

describe('loadCardHelpers — rejection is not cached (Bug 4)', () => {
  const w = globalThis as any;
  let original: unknown;

  beforeEach(() => {
    original = w.window.loadCardHelpers;
    vi.resetModules();
  });
  afterEach(() => {
    w.window.loadCardHelpers = original;
  });

  it('retries successfully after loadCardHelpers becomes available', async () => {
    delete w.window.loadCardHelpers;
    const { loadCardHelpers } = await import('../helpers');

    // First call: not available yet → rejects.
    await expect(loadCardHelpers()).rejects.toThrow(/not available/);

    // HA registers it a moment later.
    const helpers = { createCardElement: () => ({}) };
    w.window.loadCardHelpers = () => Promise.resolve(helpers);

    // Must NOT be stuck on the cached rejection.
    await expect(loadCardHelpers()).resolves.toBe(helpers);
  });

  it('caches a successful helpers promise (only calls window.loadCardHelpers once)', async () => {
    const helpers = { createCardElement: () => ({}) };
    const spy = vi.fn(() => Promise.resolve(helpers));
    w.window.loadCardHelpers = spy;
    const { loadCardHelpers } = await import('../helpers');

    await loadCardHelpers();
    await loadCardHelpers();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('clears the cache when the helpers promise itself rejects', async () => {
    const spy = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ createCardElement: () => ({}) });
    w.window.loadCardHelpers = spy;
    const { loadCardHelpers } = await import('../helpers');

    await expect(loadCardHelpers()).rejects.toThrow(/boom/);
    await expect(loadCardHelpers()).resolves.toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
