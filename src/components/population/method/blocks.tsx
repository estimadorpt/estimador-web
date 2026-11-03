import type { ReactNode } from 'react';
import type { MDXComponents } from 'mdx/types';
import { Disclosure } from '@/components/viz/Disclosure';
import type { Locale } from '@/lib/population/labels';
import type { PopulationMeta, PopulationReleaseInfo } from '@/types/population';
import {
  FigureAnswer, FigureCandidates, FigureChoose, FigureCollective, FigureLearn, FigurePublish, FigureSample, FigureTilt, FigureWhy, TierGrid,
} from './MethodFigures';
import { STEP_IDS } from './rules';
import { Beat, MethodStory } from './story/MethodStory';
import type { BeatId } from './story/data';

/** "1. Aprender …" → 1; any other heading → null. */
function stepNumber(children: ReactNode): number | null {
  const text = typeof children === 'string' ? children : Array.isArray(children) ? children.filter(c => typeof c === 'string').join('') : '';
  const match = /^([1-5])\.\s/.exec(text);
  return match ? Number(match[1]) : null;
}

/**
 * The methodology's drawings as MDX components: the scroll story (`<MethodStory>`
 * around `<Beat at="…">` blocks of the page's text), the same steps as fixed
 * drawings with their tables (`<MethodDrawings />`), and the step headings the
 * story's ruler links to: "### 1. …" to "### 5. …" get passo-1 … passo-5, the
 * same in both locales.
 */
export function methodFigureBlocks({ locale, meta, release }: { locale: Locale; meta: PopulationMeta; release: PopulationReleaseInfo }): MDXComponents {
  const pt = locale === 'pt';
  return {
    h3: ({ children }: { children?: ReactNode }) => {
      const n = stepNumber(children);
      return (
        <h3 id={n ? STEP_IDS[n - 1] : undefined} className="mb-2 mt-12 text-[21px] leading-7 text-ink">
          {children}
        </h3>
      );
    },
    MethodStory: ({ children }: { children?: ReactNode }) => <MethodStory locale={locale} release={release} meta={meta}>{children}</MethodStory>,
    Beat: ({ at, children }: { at: BeatId; children?: ReactNode }) => <Beat at={at}>{children}</Beat>,
    // The story's twin: the why and every step as fixed drawings, with the weights and sums as tables.
    MethodDrawings: () => (
      <Disclosure summary={pt ? 'Ver a história em desenhos fixos, com as tabelas' : 'View the story as fixed drawings, with the tables'} className="not-prose my-8 border-y border-rule py-1 font-sans">
        <div className="pb-4">
          <FigureWhy locale={locale} />
          <FigureSample locale={locale} />
          <FigureLearn locale={locale} />
          <FigureCandidates locale={locale} />
          <FigureTilt locale={locale} />
          <FigureChoose locale={locale} />
          <FigureAnswer locale={locale} />
          <FigureCollective locale={locale} />
          <FigurePublish locale={locale} release={release} />
        </div>
      </Disclosure>
    ),
    TierGrid: () => <TierGrid locale={locale} release={release} counts={meta.counts.tiers} />,
  };
}
