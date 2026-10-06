import type { ReactNode } from 'react';

/** A cream panel: 16px corners, a hairline, no shadow, and it clips what bleeds to its edges. */
export function HomePanel({ children, labelledBy, className = '' }: { children: ReactNode; labelledBy: string; className?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={`overflow-hidden rounded-2xl border border-line bg-cream ${className}`}>
      {children}
    </section>
  );
}

export function Kicker({ children, pill }: { children: ReactNode; pill?: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
      <span>{children}</span>
      {pill && <span className="rounded-md bg-parchment px-2 py-0.5 tracking-wider text-stone-600">{pill}</span>}
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
