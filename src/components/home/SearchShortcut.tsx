'use client';

import type { MouseEvent, ReactNode } from 'react';

/**
 * The phone shortcut to the parish search that is already on the homepage
 * (audit PUB2-20): an in-page anchor to the population panel, which, with
 * JavaScript, also puts the cursor in the search field. Without JavaScript
 * the anchor still scrolls to the panel.
 */
export function SearchShortcut({ targetId, className, children }: { targetId: string; className?: string; children: ReactNode }) {
  function focusSearch(event: MouseEvent<HTMLAnchorElement>) {
    const panel = document.getElementById(targetId)?.closest('section');
    const input = panel?.querySelector<HTMLInputElement>('input[type="search"], input[type="text"], input:not([type])');
    if (!input) return;
    event.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The heading first, so the question stays in view above the field.
    document.getElementById(targetId)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    input.focus({ preventScroll: true });
    history.replaceState(null, '', `#${targetId}`);
  }
  return (
    <a href={`#${targetId}`} onClick={focusSearch} className={className}>
      {children}
    </a>
  );
}
