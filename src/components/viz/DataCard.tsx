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
}

/**
 * The frame every chart and table sits in: a cream panel with the title, the
 * scoping controls, the plot, and a footer that names the source, the date and
 * where the method is explained. A chart without these three is an assertion.
 */
export function DataCard({ title, subtitle, badge, controls, children, source, updated, methodologyHref, methodologyLabel = 'Metodologia', locale, className = '' }: DataCardProps) {
  const hasFooter = source || updated || methodologyHref;
  return (
    <section className={`rounded-2xl border border-line bg-cream p-5 md:p-6 ${className}`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-[-0.02em] text-ink md:text-xl">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
        </div>
        {badge && <span className="inline-block rounded-md bg-parchment px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-600">{badge}</span>}
      </header>
      {controls && <div className="mb-4 flex flex-wrap items-center gap-3">{controls}</div>}
      <div className="min-w-0">{children}</div>
      {hasFooter && (
        <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-stone-500">
          {source && <span>{source}</span>}
          {updated && <span>{updated}</span>}
          {methodologyHref && <Link href={methodologyHref} locale={locale} className="font-semibold text-ink underline-offset-4 hover:underline">{methodologyLabel}</Link>}
        </footer>
      )}
    </section>
  );
}
