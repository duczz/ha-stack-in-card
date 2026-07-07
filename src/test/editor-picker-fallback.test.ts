// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import '../editor';

// IMPORTANT: these two tests share jsdom's global `customElements` registry
// (one jsdom environment per test file in vitest) and `customElements.define`
// can only be called once per tag name. The "never registers" case MUST run
// before the "registers in time" case defines 'hui-card-picker' — hence the
// fixed order below (vitest runs tests within a file in declaration order).

function makeEditor() {
  const ed = document.createElement('stack-in-card-editor') as any;
  ed.hass = { localize: () => '' };
  ed.setConfig({ type: 'custom:stack-in-card', cards: [] });
  document.body.appendChild(ed);
  return ed;
}

describe('hui-card-picker load-failure fallback', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a warning banner if hui-card-picker never registers before the timeout', async () => {
    vi.useFakeTimers();
    const ed = makeEditor();
    await ed.updateComplete;

    vi.advanceTimersByTime(10_000);
    await ed.updateComplete;

    expect(ed._cardPickerLoadFailed).toBe(true);
    expect(ed.shadowRoot.querySelector('ha-alert[alert-type="warning"]')).toBeTruthy();

    ed.remove();
  });

  it('does not show the banner once hui-card-picker registers before the timeout', async () => {
    vi.useFakeTimers();
    customElements.define('hui-card-picker', class extends HTMLElement {});

    const ed = makeEditor();
    await ed.updateComplete;
    // customElements.whenDefined() resolves via a real microtask, independent
    // of fake timers — flush it before advancing the timeout timer.
    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(10_000);
    await ed.updateComplete;

    expect(ed._cardPickerLoadFailed).toBe(false);
    expect(ed.shadowRoot.querySelector('ha-alert[alert-type="warning"]')).toBeNull();

    ed.remove();
  });
});
