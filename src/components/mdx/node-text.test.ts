import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { firstLineOf, tableHeaderText } from './node-text';

// The MDX components map turns <th> into a component of its own.
const Th = ({ children }: { children?: ReactNode }) => createElement('th', null, children);

describe('MDX table region name (A11Y3-04)', () => {
  it('reads the header row, skipping the whitespace MDX leaves between tags', () => {
    const table = [
      '\n',
      createElement('thead', { key: 'h' }, '\n', createElement('tr', null,
        createElement(Th, { key: 1 }, 'Chave'),
        createElement(Th, { key: 2 }, 'O que ', createElement('strong', null, 'guarda')),
        createElement(Th, { key: 3 }, 'Onde'))),
      createElement('tbody', { key: 'b' }, createElement('tr', null, createElement('td', null, 'x'))),
    ];
    expect(tableHeaderText(table)).toBe('Chave, O que guarda, Onde');
  });

  it('gives nothing for a table without a header row', () => {
    expect(tableHeaderText(createElement('tbody', null, createElement('tr', null, createElement('td', null, 'x'))))).toBe('');
  });

  it('names a code block by its first line', () => {
    expect(firstLineOf(createElement('code', null, "\nk(t, t') = σ² × exp(-|t-t'|² / (2ℓ²))\nsecond line\n"))).toBe("k(t, t') = σ² × exp(-|t-t'|² / (2ℓ²))");
  });
});
