import type { ReactNode } from 'react';
import { Link } from '@/i18n/routing';

interface DataCardProps {
  title: string;
  subtitle?: string;
  /** A short label at the top right: a status, a register, or "Exemplo ilustrativo". */
  badge?: string;
  /** Controls that scope the chart: a segmented control, a select. One row, above the plot. */
  controls?: ReactNode;
  children: ReactNode;
  source?: string;
  updated?: string;
  methodologyHref?: string;
  methodologyLabel?: string;
  locale?: string;
  className?: string;
  /** Gives the title an id and makes it a focus target (tabIndex -1), for a card that opens after an action. */
  titleId?: string;
}

/**
 * The frame every chart and table sits in: a cream panel with the title, the
 * scoping controls, the plot, and a footer that names the source, the date and
 * where the method is explained. A chart without these three is an assertion.
 * One frame for every section (CLAUDE.md, "Chart frame"): a chart is not
 * given a bespoke card, an icon header or a loose legend instead.
 */
export function DataCard({ title, subtitle, badge, controls, children, source, updated, methodologyHref, methodologyLabel = 'Metodologia', locale, className = '', titleId }: DataCardProps) {
  const hasFooter = source || updated || methodologyHref;
  return (
    <section className={`rounded-2xl border border-line bg-cream p-5 md:p-6 ${className}`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 id={titleId} tabIndex={titleId ? -1 : undefined} className="text-lg font-bold tracking-[-0.02em] text-ink md:text-xl">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
        </div>
        {badge && <span className="inline-block rounded-md bg-parchment px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-600">{badge}</span>}
      </header>
      {controls && <div className="mb-4 flex flex-wrap items-center gap-3">{controls}</div>}
      <div className="min-w-0">{children}</div>
      {hasFooter && (
        <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-1.5 text-xs text-stone-500">
          {source && <span>{source}</span>}
          {updated && <span>{updated}</span>}
          {/* A standalone link: a 44px target, the text's own size (UXM2-09). */}
          {methodologyHref && <Link href={methodologyHref} locale={locale} className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">{methodologyLabel}</Link>}
        </footer>
      )}
    </section>
  );
}
