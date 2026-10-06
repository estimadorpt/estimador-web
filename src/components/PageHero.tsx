import type { ReactNode } from 'react';
import { SectionIllustration, type IllustrationScene } from '@/components/brand/SectionIllustration';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { containerClass, MEASURES, type ContainerWidth, type Measure } from '@/components/brand/Container';
import { kickerWithoutBack } from '@/components/brand/hero-kicker';

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
  /**
   * Brand art on the right on wide screens: only /marca uses it. Section pages
   * take `illustration`, data pages a `field`, reference pages neither
   * (CLAUDE.md, header table). Never over data.
   */
  art?: ReactNode;
  /** Recognisable section scene, in its own column rather than behind text. */
  illustration?: IllustrationScene;
  /** One soft field per page at most: the entrance colour of a section. */
  field?: 'mint' | 'periwinkle' | 'coral' | 'mustard';
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
 * The opening of every forecast and dashboard page: kicker, title and
 * lede on the paper ground, closed by a hairline. It replaces the charcoal
 * bands the sections used to open with, so a page now starts the way the
 * atlas does.
 */
export function PageHero({ eyebrow: givenEyebrow, icon, title, lede, back, meta, art, illustration, field, actions, width = '7xl', measure = 'full', compact = false, className = '' }: PageHeroProps) {
  // Under a back link, the kicker does not say the section's name again (CL3-07).
  const eyebrow = back ? kickerWithoutBack(givenEyebrow, back.label) : givenEyebrow;
  return (
    <section className={`relative overflow-hidden border-b border-line ${field && !illustration ? `field-${field}` : 'bg-paper'} ${className}`}>
      {art && !illustration && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] max-w-[520px] lg:block">
          {art}
        </div>
      )}
      <div className={`relative ${containerClass(width)} ${illustration ? 'illustrated-hero' : ''} ${compact ? 'pt-6 pb-6 md:pt-7 md:pb-7' : 'pt-8 pb-8 md:pt-10 md:pb-10'}`}>
        <div className={`min-w-0 ${MEASURES[measure]}`}>
        {back && (
          <Link
            href={back.href}
            locale={back.locale}
            // 44px tall for a thumb; the negative margin keeps the visual rhythm.
            className="-mt-3 mb-2 inline-flex min-h-11 items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 transition-colors hover:text-ink"
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
        {/* The hero scene is the largest paint on the forecast pages: fetch it first. */}
        {illustration && <SectionIllustration scene={illustration} priority />}
      </div>
    </section>
  );
}
