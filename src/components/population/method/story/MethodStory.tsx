import type { ReactNode } from 'react';
import { methodExample } from '@/lib/population/method-example';
import type { Locale } from '@/lib/population/labels';
import type { PopulationMeta, PopulationReleaseInfo } from '@/types/population';
import { tierThresholds } from '../MethodFigures';
import { BEAT_STEP, SCRUBBED, type BeatId } from './data';
import type { StoryData } from './Stage';
import { StoryShell } from './StoryShell';

/**
 * What the stage draws, worked out on the server: the example's reweighting
 * and its choice of whole households (an exhaustive search the browser should
 * not repeat), and from the release, the published columns' provenance letters
 * and the tier policy and counts. Null when the release lacks any of them.
 */
export function storyData(release: PopulationReleaseInfo, meta: PopulationMeta): StoryData | null {
  const t = tierThresholds(release);
  const persons = release.column_dictionary?.persons ?? {};
  const households = release.column_dictionary?.households ?? {};
  const provenance = {
    synthetic_hh_id: persons.synthetic_hh_id?.provenance,
    hh_size: households.hh_size?.provenance,
    age: persons.age?.provenance,
    age_5y: persons.age_5y?.provenance,
    sex: persons.sex?.provenance,
    is_institutional: persons.is_institutional?.provenance,
  };
  if (!t || Object.values(provenance).some(v => typeof v !== 'string')) return null;
  const ex = methodExample();
  return {
    before: ex.before,
    after: ex.after,
    chosen: ex.chosen,
    provenance: provenance as StoryData['provenance'],
    tiers: {
      release: release.version,
      minB: t.B.min_population,
      minA: t.A.min_population,
      maxA: t.A.max_person_srmse_median,
      maxB: t.B.max_person_srmse_median,
      counts: meta.counts.tiers,
    },
  };
}

/** The five steps as a scroll story: the page's text in beats beside (or under) one drawing that changes with them. */
export function MethodStory({ locale, release, meta, children }: { locale: Locale; release: PopulationReleaseInfo; meta: PopulationMeta; children?: ReactNode }) {
  const data = storyData(release, meta);
  if (!data) return <div>{children}</div>;
  return <StoryShell locale={locale} data={data}>{children}</StoryShell>;
}

/** One scene of the story: the text the reader reads while the drawing shows `at`. */
export function Beat({ at, children }: { at: BeatId; children?: ReactNode }) {
  return (
    <div className="mstory-beat" data-beat={at} data-step={BEAT_STEP[at]} data-scrubbed={SCRUBBED.includes(at) ? 'on' : undefined}>
      {children}
    </div>
  );
}
