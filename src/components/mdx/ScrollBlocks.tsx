import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { firstLineOf, tableHeaderText } from './node-text';

/**
 * A prose table that is wider than a phone scrolls inside its own box. That
 * box is a named, focusable region, so a keyboard can scroll it too (A11Y3-04,
 * axe scrollable-region-focusable), named by its header row so two tables on
 * a page stay apart, with the `.scroll-cue` edge shadow on the page's paper
 * while there is more to see (UXM3-11).
 */
export function MdxTable({ children }: { children?: ReactNode }) {
  const pt = useLocale() !== 'en';
  const header = tableHeaderText(children);
  const label = `${pt ? 'Tabela' : 'Table'}${header ? `: ${header}` : ''}`;
  return (
    <div tabIndex={0} role="region" aria-label={label} className="scroll-cue my-8 overflow-x-auto [--scroll-cue-ground:var(--color-paper)]">
      <table className="min-w-full border-collapse font-sans text-sm tabular-nums">{children}</table>
    </div>
  );
}

/**
 * A code block: on a phone its lines wrap rather than run off the side; wider,
 * a long line scrolls, so the block is a focusable region named by its first
 * line, which keeps two blocks on a page apart (A11Y3-04).
 */
export function MdxPre({ children }: { children?: ReactNode }) {
  const pt = useLocale() !== 'en';
  const firstLine = firstLineOf(children);
  const label = `${pt ? 'Código' : 'Code'}${firstLine ? `: ${firstLine}` : ''}`;
  return (
    <pre tabIndex={0} role="region" aria-label={label} className="mb-6 overflow-x-auto bg-stone-800 p-4 font-mono text-sm text-stone-100 max-sm:whitespace-pre-wrap max-sm:[overflow-wrap:anywhere] [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">
      {children}
    </pre>
  );
}
