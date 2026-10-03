// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { KEEP_FIELDS } from '../editor';
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

describe('Keep options render as their own panel, one ha-form per toggle', () => {
  // One form per toggle in our own grid replaces HA's 24px grid row gap with
  // ours. Each form still gets — and reports back — the complete form data.
  async function rendered(config: Partial<StackInCardConfig>) {
    const made = makeEditor(config);
    document.body.appendChild(made.ed);
    await made.ed.updateComplete;
    const panel = [...made.ed.shadowRoot.querySelectorAll('ha-expansion-panel')].find(
      (p: any) => p.querySelector('[slot="header"]')?.textContent.trim() === 'Keep options',
    ) as any;
    const forms = [...panel.querySelectorAll('.keep-grid > ha-form')] as any[];
    return { ...made, panel, forms };
  }

  it('one form per Keep field, in order, each with the complete data', async () => {
    const { ed, forms } = await rendered({ keep: { margin: true } });
    expect(forms.map((f) => f.schema.map((s: any) => s.name))).toEqual(
      KEEP_FIELDS.map((f) => [f.name]),
    );
    for (const f of forms) expect(f.data).toEqual(ed._buildFormData());
    // The mother form keeps only title and mode — no Keep field twice.
    const mother = ed.shadowRoot.querySelector('.card-config > ha-form') as any;
    expect(mother.schema.map((s: any) => s.name)).toEqual(['title', 'mode']);
    ed.remove();
  });

  it('a toggle in one form keeps the Keep flags set elsewhere', async () => {
    const { ed, fired, forms } = await rendered({ keep: { margin: true } });
    const data = { ...ed._buildFormData(), 'keep.background': true };
    forms[0].dispatchEvent(new CustomEvent('value-changed', { detail: { value: data } }));
    expect(fired.at(-1)!.keep).toEqual({ background: true, margin: true });
    ed.remove();
  });
});

describe('keep.outer_padding is only written when its own toggle changed', () => {
  // README: outer_padding defaults to `margin`. The form always shows a value
  // for it, so writing that value back on every change froze the default.
  function change(config: Partial<StackInCardConfig>, patch: Record<string, unknown>) {
    const { ed, fired } = makeEditor(config);
    ed._valueChanged({ detail: { value: { ...ed._buildFormData(), ...patch } } });
    return fired[0];
  }

  it('a title change adds no keep block', () => {
    expect('keep' in change({}, { title: 'Hallo' })).toBe(false);
  });

  it('switching margin on leaves outer_padding to follow it', () => {
    expect(change({}, { 'keep.margin': true }).keep).toEqual({ margin: true });
  });

  it('switching margin off again does not leave an explicit outer_padding behind', () => {
    expect('keep' in change({ keep: { margin: true } }, { 'keep.margin': false })).toBe(false);
  });

  it('outer_padding can still be switched off while margin is kept (explicit false)', () => {
    expect(change({ keep: { margin: true } }, { 'keep.outer_padding': false }).keep).toEqual({
      margin: true,
      outer_padding: false,
    });
  });

  it('an explicit value survives unrelated changes', () => {
    const cfg = { keep: { margin: true, outer_padding: false } };
    expect(change(cfg, { title: 'x' }).keep).toEqual({ margin: true, outer_padding: false });
  });

  it('switching it back to the default drops the key', () => {
    const cfg = { keep: { margin: true, outer_padding: false } };
    expect(change(cfg, { 'keep.outer_padding': true }).keep).toEqual({ margin: true });
  });

  it('outer_padding on without margin is saved explicitly', () => {
    expect(change({}, { 'keep.outer_padding': true }).keep).toEqual({ outer_padding: true });
  });
});
