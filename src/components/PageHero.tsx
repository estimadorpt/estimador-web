import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { containerClass, MEASURES, type ContainerWidth, type Measure } from '@/components/brand/Container';
import { kickerWithoutBack } from '@/components/brand/hero-kicker';

interface PageHeroProps {
  /** The section and, if useful, the edition, above the title ("Liga Portugal — época 2026-27"). */
  eyebrow?: ReactNode;
  /** Accepted for compatibility; heroes draw no icons. */
  icon?: ReactNode;
  title: ReactNode;
  /** One or two sentences under the title. */
  lede?: ReactNode;
  /** A link back to the parent surface, rendered above the eyebrow. */
  back?: { href: string; label: ReactNode; locale?: string };
  /** The meta line: update date, methodology link, next release. */
  meta?: ReactNode;
  /**
   * Brand art on the right on wide screens: only /marca uses it. Section pages
   * take `illustration`, data pages a `field`, reference pages neither
   * (CLAUDE.md, header table). Never over data.
   */
  art?: ReactNode;
  /** Accepted for compatibility; section scenes are no longer drawn. */
  illustration?: string;
  /** Accepted for compatibility; heroes are plain white. */
  field?: string;
  /** One main action and, at most, one secondary. */
  actions?: ReactNode;
  /**
   * Matches the page's own container width so the hero lines up with the
   * content below. Prefer the default (the header's container) with `measure`
   * for a narrow text column: the left edge then matches the header, the
   * section tabs and the body (see Container).
   */
  width?: ContainerWidth;
  /** A narrower text column inside the full container, aligned to its left edge. */
  measure?: Measure;
  /** Dashboards and listings: a shallower header, so the data arrives sooner. Large art stays on entrances and explainers. */
  compact?: boolean;
  className?: string;
}

/**
 * The opening of every page: the section's name, the title (a finding where
 * the page has one), a lede and the reading's facts, on white, closed by a
 * rule. No icon, no tinted field, no painting.
 */
export function PageHero({ eyebrow: givenEyebrow, title, lede, back, meta, art, actions, width = '7xl', measure = 'full', compact = false, className = '' }: PageHeroProps) {
  // Under a back link, the kicker does not say the section's name again (CL3-07).
  const eyebrow = back ? kickerWithoutBack(givenEyebrow, back.label) : givenEyebrow;
  return (
    <section className={`relative overflow-hidden border-b border-rule bg-paper ${className}`}>
      {art && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] max-w-[520px] lg:block">
          {art}
        </div>
      )}
      <div className={`relative ${containerClass(width)} ${compact ? 'pt-6 pb-6 md:pt-7 md:pb-7' : 'pt-8 pb-8 md:pt-10 md:pb-10'}`}>
        <div className={`min-w-0 ${MEASURES[measure]}`}>
        {back && (
          <Link
            href={back.href}
            locale={back.locale}
            // 44px tall for a thumb; the negative margin keeps the visual rhythm.
            className="-mt-3 mb-1 inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-ink underline decoration-scale underline-offset-4 hover:decoration-ink"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            {back.label}
          </Link>
        )}
        {eyebrow && (
          <p className="disp mb-2 text-[15px] leading-5">{eyebrow}</p>
        )}
        <h1 className={`max-w-4xl leading-[1.02] text-ink ${compact ? 'text-[2rem] md:text-[2.75rem]' : 'text-[2.25rem] md:text-[3.5rem]'}`}>{title}</h1>
        {lede && <p className={`max-w-2xl leading-relaxed text-ink ${compact ? 'mt-3 text-base' : 'mt-3 text-base md:text-[17px]'}`}>{lede}</p>}
        {actions && <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${compact ? 'mt-5' : 'mt-6'}`}>{actions}</div>}
        {meta && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-graphite">{meta}</div>}
        </div>
      </div>
    </section>
  );
}
