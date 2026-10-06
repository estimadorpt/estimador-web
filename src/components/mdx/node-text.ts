import { Children, isValidElement, type ReactNode } from 'react';

/**
 * Plain text out of MDX-rendered React nodes, to name a scroll region by what
 * it holds (ScrollBlocks.tsx). Pure, so it has its own test.
 */

/** The text of a node and everything under it. */
export function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** "Chave, O que guarda, Onde": the cells of a table's header row, or '' without one. */
export function tableHeaderText(children: ReactNode): string {
  const head = Children.toArray(children).find(child => isValidElement(child) && child.type === 'thead');
  if (!isValidElement<{ children?: ReactNode }>(head)) return '';
  // Skip the whitespace MDX leaves between tags.
  const row = Children.toArray(head.props.children).find(child => isValidElement(child));
  if (!isValidElement<{ children?: ReactNode }>(row)) return '';
  return Children.toArray(row.props.children)
    .map(cell => textOf(cell).trim())
    .filter(Boolean)
    .join(', ');
}

/** The first line of a code block, cut to `max` characters. */
export function firstLineOf(node: ReactNode, max = 60): string {
  return (textOf(node).trim().split('\n')[0] ?? '').slice(0, max);
}
