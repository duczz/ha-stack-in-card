// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import '../editor';
import type { StackInCardConfig } from '../types';

// Minimal fake of the ha-code-editor `value-changed` event.
function styleEvent(value: string) {
  return { detail: { value }, stopPropagation() {} } as unknown as CustomEvent;
}

function makeEditor(config: Partial<StackInCardConfig>) {
  const ed = document.createElement('stack-in-card-editor') as any;
  ed.hass = { localize: () => '' };
  ed.setConfig({ type: 'custom:stack-in-card', cards: [], ...config });
  const fired: StackInCardConfig[] = [];
  ed.addEventListener('config-changed', (e: any) => fired.push(e.detail.config));
  return { ed, fired };
}

describe('Bug 5 — CSS editors store the raw value (no trim) so the cursor stays put', () => {
  it('mother CSS keeps trailing whitespace/newlines instead of trimming them away', () => {
    const { ed, fired } = makeEditor({});
    ed._motherStyleChanged(styleEvent('ha-card {\n  color: red;\n}\n\n'));
    expect(fired).toHaveLength(1);
    expect(fired[0].stack_in_card_styles).toBe('ha-card {\n  color: red;\n}\n\n');
  });

  it('mother CSS is deleted when the value is only whitespace', () => {
    const { ed, fired } = makeEditor({ stack_in_card_styles: 'ha-card{}' });
    ed._motherStyleChanged(styleEvent('   \n  '));
    expect(fired).toHaveLength(1);
    expect('stack_in_card_styles' in fired[0]).toBe(false);
  });

  it('per-child CSS keeps the raw value on the selected child', () => {
    const { ed, fired } = makeEditor({
      cards: [{ type: 'markdown', content: 'x' }],
    });
    ed._selectedChild = 0;
    ed._selectedChildStyleChanged(styleEvent('ha-card {\n  padding: 0;\n}\n'));
    expect(fired).toHaveLength(1);
    expect(fired[0].cards[0].stack_in_card_styles).toBe('ha-card {\n  padding: 0;\n}\n');
  });
});
