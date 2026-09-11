import type { ReactNode } from 'react';

/** A cream panel: 16px corners, a hairline, no shadow. Labelled by its own heading. */
export function HomePanel({ children, labelledBy, className = '' }: { children: ReactNode; labelledBy: string; className?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={`rounded-2xl border border-line bg-cream ${className}`}>
      {children}
    </section>
  );
}

export function Kicker({ children, id }: { children: ReactNode; id?: string }) {
  return <p id={id} className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{children}</p>;
}

/** A small status line: a dot and a short sentence in the 600 step, never faint. */
export function Status({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'paused' }) {
  return (
    <p className="mt-4 flex items-start gap-2 text-[13px] leading-snug text-stone-600">
      <span aria-hidden="true" className={`mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'paused' ? 'bg-gold' : 'bg-tree'}`} />
      <span>{children}</span>
    </p>
  );
}
