import type { ReactNode } from 'react';

/** A module: a heavy ink rule on top, a hairline around, square corners, the page's own white. */
export function HomePanel({ children, labelledBy, className = '' }: { children: ReactNode; labelledBy: string; className?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={`overflow-hidden border border-line border-t-[3px] border-t-ink bg-paper ${className}`}>
      {children}
    </section>
  );
}

/** A panel's kicker: the section's name and, after it, its state as a plain word (no pill). */
export function Kicker({ children, status }: { children: ReactNode; status?: ReactNode }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] font-bold text-ink">
      <span>{children}</span>
      {status && <span className="font-normal text-graphite">{status}</span>}
    </p>
  );
}

/**
 * A small status line in words, never faint and never a coloured dot; the
 * paused state in the caveat colour, as text. In a panel laid out as a column
 * (`bottom`), it sits on the panel's last line, so cards that share a row end
 * on the same baseline.
 */
export function Status({ children, tone = 'neutral', bottom = false }: { children: ReactNode; tone?: 'neutral' | 'paused'; bottom?: boolean }) {
  return (
    <p className={`text-[13px] leading-snug ${tone === 'paused' ? 'text-amber-800' : 'text-graphite'} ${bottom ? 'mt-auto pt-4' : 'mt-4'}`}>
      {children}
    </p>
  );
}
