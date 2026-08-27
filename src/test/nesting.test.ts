// @vitest-environment jsdom
//
// Regressions for the CSS-scoping fixes. All four were measured against real
// Home Assistant before being fixed; the notes name what went wrong so a
// future reader doesn't "simplify" the behaviour back.
import { describe, it, expect } from 'vitest';
import '../stack-in-card';
import '../editor';
import { isStackInCardConfig } from '../helpers';

const CSS = 'ha-card{color:red}';

function childWithShadow(): HTMLElement {
  const el = document.createElement('div');
  const root = el.attachShadow({ mode: 'open' });
  root.appendChild(document.createElement('ha-card'));
  return el;
}

function ownStyleTags(node: ParentNode, id: string): Element[] {
  return Array.from(node.children).filter((c) => c.tagName === 'STYLE' && c.id === id);
}

describe('per-child CSS stays out of the sibling scope', () => {
  // A <style> in the child element's own light DOM lives in the tree scope of
  // the OUTER stack's shadow root — the scope every sibling card shares. A
  // rule like `hui-card { outline: … }` then styled siblings too, while the
  // editor promised it wouldn't.
  it('writes into shadow roots, not into the child element itself', () => {
    const el = document.createElement('stack-in-card') as any;
    const child = childWithShadow();

    el._applyChildCss(child, CSS, 0);

    expect(ownStyleTags(child, el._childStyleTagId)).toHaveLength(0);
    expect(child.shadowRoot!.querySelector('#' + el._childStyleTagId)).toBeTruthy();
  });

  it('still reaches an ha-card that lives in the shared light-DOM scope', () => {
    const el = document.createElement('stack-in-card') as any;
    const child = document.createElement('div');
    const card = document.createElement('ha-card');
    // In the real frontend `ha-card` is a registered Lit element, so it owns a
    // shadow root the moment it exists — jsdom leaves it bare. Attach one by
    // hand, or this test proves nothing: keying the decision on "is there any
    // shadow root in the subtree" looks correct under jsdom and silently
    // stops styling these cards in a browser.
    card.attachShadow({ mode: 'open' });
    child.appendChild(card);

    el._applyChildCss(child, CSS, 0);

    // The card sits in the scope the child shares with its siblings. Nothing
    // private can reach it, so the shared-scope write has to happen.
    expect(ownStyleTags(child, el._childStyleTagId)).toHaveLength(1);
  });

  it('writes nothing for a card with neither a shadow root nor an ha-card', () => {
    const el = document.createElement('stack-in-card') as any;
    const child = document.createElement('div');
    child.appendChild(document.createElement('div')); // a card that renders plain markup

    el._applyChildCss(child, CSS, 0);

    // Deliberate: there is no way to know what such a card wants styled, and
    // the old catch-all put the rules in the shared scope, where they hit
    // every sibling. Documented as a behaviour change; recognising specific
    // card types is the fix if one ever shows up.
    expect(ownStyleTags(child, el._childStyleTagId)).toHaveLength(0);
    expect(child.querySelector('style')).toBeNull();
  });
});

describe('a nested stack-in-card owns its own stack_in_card_styles', () => {
  it('isStackInCardConfig accepts both the prefixed and the bare type', () => {
    expect(isStackInCardConfig({ type: 'custom:stack-in-card' })).toBe(true);
    expect(isStackInCardConfig({ type: 'stack-in-card' })).toBe(true);
    expect(isStackInCardConfig({ type: 'markdown' })).toBe(false);
    expect(isStackInCardConfig(undefined)).toBe(false);
  });

  it('hands the field through to a nested child but strips it from a normal one', async () => {
    const seen: any[] = [];
    (window as any).loadCardHelpers = async () => ({
      createCardElement: (cfg: any) => {
        seen.push(JSON.parse(JSON.stringify(cfg)));
        const card: any = document.createElement('div');
        card.attachShadow({ mode: 'open' });
        const root = document.createElement('div');
        root.id = 'root';
        card.shadowRoot.appendChild(root);
        card.setConfig = () => {};
        card.getCardSize = () => 1;
        return card;
      },
    });

    const el = document.createElement('stack-in-card') as any;
    el.setConfig({
      type: 'custom:stack-in-card',
      mode: 'vertical',
      cards: [
        { type: 'custom:stack-in-card', stack_in_card_styles: CSS, cards: [] },
        { type: 'markdown', content: 'x', stack_in_card_styles: CSS },
      ],
    });
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 60));

    const passed = seen[0].cards;
    // The nested card needs the field: it is that card's own mother CSS, and
    // stripping it left the inner card unable to style itself.
    expect(passed[0].stack_in_card_styles).toBe(CSS);
    // A normal child must not see it — HA's strict validators reject unknown
    // properties on some card types.
    expect('stack_in_card_styles' in passed[1]).toBe(false);
    el.remove();
  });

  it('does not brute-force inject into a nested stack-in-card subtree', () => {
    const el = document.createElement('stack-in-card') as any;
    el._config = {
      type: 'custom:stack-in-card',
      cards: [{ type: 'custom:stack-in-card', stack_in_card_styles: CSS, cards: [] }],
    };

    const stack: any = document.createElement('div');
    stack.attachShadow({ mode: 'open' });
    const root = document.createElement('div');
    root.id = 'root';
    stack.shadowRoot.appendChild(root);
    const nested = childWithShadow();
    root.appendChild(nested);
    el._card = stack;

    el._injectChildStyles();

    // The nested card injects this CSS itself, scoped to its own shadow root.
    // Doing it from here as well reached its children — cards nobody styled.
    expect(nested.shadowRoot!.querySelector('#' + el._childStyleTagId)).toBeNull();
  });
});

describe('mother CSS does not depend on the inner stack existing', () => {
  it('applies to an empty stack-in-card', async () => {
    const el = document.createElement('stack-in-card') as any;
    el.setConfig({ type: 'custom:stack-in-card', cards: [], stack_in_card_styles: CSS });
    el.hass = { states: {} };
    document.body.appendChild(el);
    await el.updateComplete;

    // `cards: []` leaves `_card` undefined, and every style path bails on that.
    // The mother CSS lives in our own shadow root though, so it has to be
    // written anyway — otherwise styling a stack before adding any children
    // silently does nothing and only starts working once a child appears.
    const tag = el.shadowRoot.getElementById('stack-in-card-mother-style');
    expect(tag).toBeTruthy();
    expect(tag.textContent).toBe(CSS);

    el.remove();
  });
});

describe('editor labels the stack-CSS panel by nesting', () => {
  function editor(cfg: any) {
    const ed = document.createElement('stack-in-card-editor') as any;
    ed.hass = { localize: () => '' };
    ed.setConfig({ type: 'custom:stack-in-card', cards: [], ...cfg });
    return ed;
  }

  it('a top-level editor is not nested', () => {
    const ed = editor({});
    document.body.appendChild(ed);
    expect(ed._isNested).toBe(false);
    ed.remove();
  });

  it('an editor rendered inside another one is', () => {
    const outer = editor({});
    document.body.appendChild(outer);
    const inner = editor({});
    // What HA does for real: the nested editor ends up inside the outer
    // editor's shadow tree (via <hui-card-element-editor>).
    outer.shadowRoot.appendChild(inner);

    expect(inner._isNested).toBe(true);
    outer.remove();
  });

  it('the two editors render different headings', async () => {
    const outer = editor({ cards: [{ type: 'custom:stack-in-card', cards: [] }] });
    document.body.appendChild(outer);
    outer._selectedChild = 0;
    await outer.updateComplete;

    const inner = editor({});
    outer.shadowRoot.appendChild(inner);
    await inner.updateComplete;

    const heading = (ed: any) =>
      [...ed.shadowRoot.querySelectorAll('[slot="header"]')]
        .map((n: any) => n.textContent.replace(/\s+/g, ' ').trim())
        .find((t: string) => t.startsWith('Custom CSS'));

    // Assert on each editor's OWN heading. Reading the outer editor's whole
    // text would pass even with a broken `_isNested`, because the pointer it
    // renders mentions the nested heading by name.
    expect(heading(outer)).toBe('Custom CSS — Stack card');
    expect(heading(inner)).toBe('Custom CSS — Nested stack card');

    // The pointer names its target, so the two must not drift apart.
    const pointer = outer.shadowRoot.textContent.replace(/\s+/g, ' ');
    expect(pointer).toContain('Custom CSS — Nested stack card');

    outer.remove();
  });
});

describe('editor: the re-attach must not swallow a nested card edit', () => {
  function makeEditor(child: any) {
    const ed = document.createElement('stack-in-card-editor') as any;
    ed.hass = { localize: () => '' };
    ed.setConfig({ type: 'custom:stack-in-card', cards: [child] });
    const fired: any[] = [];
    ed.addEventListener('config-changed', (e: any) => fired.push(e.detail.config));
    ed._selectedChild = 0;
    return { ed, fired };
  }

  function changed(config: any) {
    return { detail: { config }, stopPropagation() {} } as unknown as CustomEvent;
  }

  it('keeps the value a nested stack-in-card editor sends', () => {
    const { ed, fired } = makeEditor({
      type: 'custom:stack-in-card',
      stack_in_card_styles: 'ha-card{color:blue}',
      cards: [{ type: 'markdown', content: 'x' }],
    });

    ed._childCardConfigChanged(
      changed({
        type: 'custom:stack-in-card',
        stack_in_card_styles: CSS,
        cards: [{ type: 'markdown', content: 'x' }],
      }),
    );

    // Bug: the unconditional re-attach restored the old value, after which the
    // no-op filter concluded "nothing changed" and dropped the edit silently —
    // no event at all, no error, the typed CSS just gone.
    expect(fired).toHaveLength(1);
    expect(fired[0].cards[0].stack_in_card_styles).toBe(CSS);
  });

  it('still re-attaches for a normal child whose editor drops unknown keys', () => {
    const { ed, fired } = makeEditor({
      type: 'markdown',
      content: 'x',
      stack_in_card_styles: CSS,
    });

    // HA's form-based editors rebuild the config from their schema, so our
    // field comes back missing.
    ed._childCardConfigChanged(changed({ type: 'markdown', content: 'changed' }));

    expect(fired).toHaveLength(1);
    expect(fired[0].cards[0].stack_in_card_styles).toBe(CSS);
  });

  it('hands a nested child to the card editor with the field intact', async () => {
    // Stripping it on the way down was the other half of the swallow: the
    // nested editor's CSS box rendered empty, so the value looked unset while
    // one was stored — and every keystroke got the empty string fed back.
    const ed = document.createElement('stack-in-card-editor') as any;
    ed.hass = { localize: () => '' };
    ed.setConfig({
      type: 'custom:stack-in-card',
      cards: [
        { type: 'custom:stack-in-card', stack_in_card_styles: CSS, cards: [] },
        { type: 'markdown', content: 'x', stack_in_card_styles: CSS },
      ],
    });
    document.body.appendChild(ed);

    const valueFor = async (index: number) => {
      ed._selectedChild = index;
      await ed.updateComplete;
      const host = ed.shadowRoot.querySelector('hui-card-element-editor') as any;
      return host?.value;
    };

    expect((await valueFor(0))?.stack_in_card_styles).toBe(CSS);
    // An ordinary child must still be handed a stripped copy — HA's built-in
    // editors warn on unknown keys.
    expect((await valueFor(1))?.stack_in_card_styles).toBeUndefined();

    ed.remove();
  });
});

describe('the stack is seamless: gaps between cards are removed', () => {
  function stackWithRoot(el: any) {
    // Mimics HA's vertical stack: a flex `#root` inside the card's shadow
    // root, holding one wrapper per child card.
    const stack: any = document.createElement('div');
    stack.attachShadow({ mode: 'open' });
    const root = document.createElement('div');
    root.id = 'root';
    root.style.gap = '8px';
    stack.shadowRoot.appendChild(root);
    root.appendChild(childWithShadow());
    el._card = stack;
    return root;
  }

  it('zeroes the row gap, not just the margin', () => {
    const el = document.createElement('stack-in-card') as any;
    el._config = { type: 'custom:stack-in-card', cards: [], keep: {} };
    const root = stackWithRoot(el);

    el._walkChildren(el._card, false);

    // Margin alone is not enough: HA spaces stacked cards with `row-gap` on
    // `#root` these days, so zeroing the margin left the 8px gap the card is
    // supposed to remove.
    expect(root.style.margin).toBe('0px');
    expect(root.style.gap).toBe('0px');
  });

  it('leaves both alone when keep.margin is set', () => {
    const el = document.createElement('stack-in-card') as any;
    el._config = { type: 'custom:stack-in-card', cards: [], keep: { margin: true } };
    const root = stackWithRoot(el);

    el._walkChildren(el._card, false);

    expect(root.style.margin).toBe('');
    expect(root.style.gap).toBe('8px');
  });
});
