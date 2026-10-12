import type { ReactNode } from 'react';
import type { MDXComponents } from 'mdx/types';
import type { Locale } from '@/lib/population/labels';
import type { PopulationMeta, PopulationReleaseInfo } from '@/types/population';
import {
  FigureCandidates, FigureChoose, FigureCollective, FigureLearn, FigurePublish, FigureTilt, MethodOverview, STEP_IDS, TierGrid,
} from './MethodFigures';

/** "1. Aprender …" → 1; any other heading → null. */
function stepNumber(children: ReactNode): number | null {
  const text = typeof children === 'string' ? children : Array.isArray(children) ? children.filter(c => typeof c === 'string').join('') : '';
  const match = /^([1-5])\.\s/.exec(text);
  return match ? Number(match[1]) : null;
}

/**
 * The methodology's drawings as MDX components, and the step headings they
 * sit under: "### 1. …" to "### 5. …" get the ids the overview links to
 * (passo-1 … passo-5, the same in both locales).
 */
export function methodFigureBlocks({ locale, meta, release }: { locale: Locale; meta: PopulationMeta; release: PopulationReleaseInfo }): MDXComponents {
  return {
    h3: ({ children }: { children?: ReactNode }) => {
      const n = stepNumber(children);
      return (
        <h3 id={n ? STEP_IDS[n - 1] : undefined} className="mb-2 mt-12 text-[21px] leading-7 text-ink">
          {children}
        </h3>
      );
    },
    MethodOverview: () => <MethodOverview locale={locale} />,
    FigureLearn: () => <FigureLearn locale={locale} />,
    FigureCandidates: () => <FigureCandidates locale={locale} />,
    FigureTilt: () => <FigureTilt locale={locale} />,
    FigureChoose: () => <FigureChoose locale={locale} />,
    FigureCollective: () => <FigureCollective locale={locale} />,
    FigurePublish: () => <FigurePublish locale={locale} release={release} />,
    TierGrid: () => <TierGrid locale={locale} release={release} counts={meta.counts.tiers} />,
  };
}
