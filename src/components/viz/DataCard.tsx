import type { ReactNode } from 'react';
import { Link } from '@/i18n/routing';

interface DataCardProps {
  title: string;
  subtitle?: string;
  /** A short label at the top right, in graphite: a status, a register, or "Exemplo ilustrativo". */
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
 * The frame every chart and table sits in: the title over an ink rule (no
 * box, no fill), the scoping controls, the plot, and a footer that names the
 * source, the date and where the method is explained. A chart without these three is an assertion.
 * One frame for every section (CLAUDE.md, "Chart frame"): a chart is not
 * given a bespoke card, an icon header or a loose legend instead.
 */
export function DataCard({ title, subtitle, badge, controls, children, source, updated, methodologyHref, methodologyLabel = 'Metodologia', locale, className = '', titleId }: DataCardProps) {
  const hasFooter = source || updated || methodologyHref;
  return (
    <section className={`min-w-0 border-t border-ink pt-3 ${className}`}>
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h3 id={titleId} tabIndex={titleId ? -1 : undefined} className="text-[19px] leading-6 text-ink">{title}</h3>
          {subtitle && <p className="mt-1 max-w-[72ch] text-[14px] leading-[20px] text-graphite">{subtitle}</p>}
        </div>
        {badge && <span className="text-[12px] text-graphite">{badge}</span>}
      </header>
      {controls && <div className="mb-4 flex flex-wrap items-center gap-3">{controls}</div>}
      <div className="min-w-0">{children}</div>
      {hasFooter && (
        <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-grid pt-1.5 text-[12.5px] text-graphite">
          {source && <span>{source}</span>}
          {updated && <span>{updated}</span>}
          {/* A standalone link: a 44px target, the text's own size (UXM2-09). */}
          {methodologyHref && <Link href={methodologyHref} locale={locale} className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">{methodologyLabel}</Link>}
        </footer>
      )}
    </section>
  );
}
