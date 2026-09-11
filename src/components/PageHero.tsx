import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

const widths = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
} as const;

interface PageHeroProps {
  /** Small uppercase label above the title: the section and, if useful, the edition. */
  eyebrow?: ReactNode;
  /** Icon rendered before the eyebrow. */
  icon?: ReactNode;
  title: ReactNode;
  /** One or two sentences under the title. */
  lede?: ReactNode;
  /** A link back to the parent surface, rendered above the eyebrow. */
  back?: { href: string; label: ReactNode; locale?: string };
  /** The meta line: update date, methodology link, next release. */
  meta?: ReactNode;
  /** Decorative mosaic or illustration, placed on the right on wide screens. Never over data. */
  art?: ReactNode;
  /** One soft field per page at most: the entrance colour of a section. */
  field?: 'mint' | 'periwinkle' | 'coral' | 'mustard';
  /** One main action and, at most, one secondary. */
  actions?: ReactNode;
  /** Matches the page's own container width so the hero lines up with the content below. */
  width?: keyof typeof widths;
  /** Dashboards and listings: a shallower header, so the data arrives sooner. Large art stays on entrances and explainers. */
  compact?: boolean;
  className?: string;
}

/**
 * The opening of every forecast and dashboard page: kicker, serif title and
 * lede on the paper ground, closed by a hairline. It replaces the charcoal
 * bands the sections used to open with, so a page now starts the way the
 * atlas does.
 */
export function PageHero({ eyebrow, icon, title, lede, back, meta, art, field, actions, width = '7xl', compact = false, className = '' }: PageHeroProps) {
  return (
    <section className={`relative overflow-hidden border-b border-line ${field ? `field-${field}` : 'bg-paper'} ${className}`}>
      {art && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] max-w-[520px] lg:block">
          {art}
        </div>
      )}
      <div className={`relative ${widths[width]} mx-auto px-4 ${compact ? 'pt-6 pb-6 md:pt-7 md:pb-7' : 'pt-8 pb-8 md:pt-10 md:pb-10'}`}>
        {back && (
          <Link
            href={back.href}
            locale={back.locale}
            className="mb-5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            {back.label}
          </Link>
        )}
        {eyebrow && (
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            {icon}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className={`max-w-3xl leading-[1.08] text-ink ${compact ? 'text-2xl md:text-4xl' : 'text-3xl md:text-[2.75rem]'}`}>{title}</h1>
        {lede && <p className={`max-w-2xl leading-relaxed text-stone-600 ${compact ? 'mt-2 text-base' : 'mt-3 text-base md:text-lg'}`}>{lede}</p>}
        {actions && <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${compact ? 'mt-5' : 'mt-6'}`}>{actions}</div>}
        {meta && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-stone-600">{meta}</div>}
      </div>
    </section>
  );
}
