import type { ReactNode } from 'react';

/** A module: a heavy ink rule on top, a hairline around, square corners, the page's own white. */
export function HomePanel({ children, labelledBy, className = '' }: { children: ReactNode; labelledBy: string; className?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={`overflow-hidden border border-line border-t-[3px] border-t-ink bg-paper ${className}`}>
      {children}
    </section>
  );
}

export function Kicker({ children, pill }: { children: ReactNode; pill?: ReactNode }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] font-bold uppercase tracking-wide text-ink">
      <span>{children}</span>
      {pill && <span className="font-medium normal-case tracking-normal text-stone-500">{pill}</span>}
    </p>
  );
}

/**
 * A small status line: a dot and a short sentence in the 600 step, never
 * faint. In a panel laid out as a column (`bottom`), it sits on the panel's
 * last line, so cards that share a row end on the same baseline.
 */
export function Status({ children, tone = 'neutral', bottom = false }: { children: ReactNode; tone?: 'neutral' | 'paused'; bottom?: boolean }) {
  return (
    <p className={`flex items-start gap-2 text-[13px] leading-snug text-stone-600 ${bottom ? 'mt-auto pt-4' : 'mt-4'}`}>
      <span aria-hidden="true" className={`mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'paused' ? 'bg-gold' : 'bg-tree'}`} />
      <span>{children}</span>
    </p>
  );
}
