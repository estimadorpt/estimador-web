// "What changed since the last reading" — the block a live dashboard should
// lead with (product-usability-diagnosis-2026-09-17.md §8, P1 in
// product-audit-2026-09-17-elections-economy.md). It reads three existing
// payload fields and invents nothing:
//   - the GDP nowcast revision between vintages (contributions.revision_decomposition)
//   - the target quarter it applies to
//   - the next relevant release (stories.modules.release_calendar)
// When the vintages are identical (no prior comparable reading yet — the
// common case today, since the feed has not run twice), it says so plainly
// instead of claiming "no change".

import { getTranslations } from 'next-intl/server';
import { CalendarDays, RefreshCw } from 'lucide-react';
import type { ContributionsRevisionDecomposition } from '@/types/economy-dashboard';
import type { ReleaseCalendarModule } from '@/types/economy-stories';
import { pickText } from '@/types/economy-stories';
import { fmtSignedPpLoc, fmtQuarterLoc, fmtPeriodLoc } from '@/lib/utils/story-format';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export async function WhatChanged({
  revision,
  targetQuarter,
  nextRelease,
  locale,
}: {
  revision?: ContributionsRevisionDecomposition;
  targetQuarter?: string;
  nextRelease?: ReleaseCalendarModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });

  const hasComparison =
    !!revision &&
    isNum(revision.nowcast_old) &&
    isNum(revision.nowcast_new) &&
    !!revision.vintage_old &&
    !!revision.vintage_new &&
    revision.vintage_old !== revision.vintage_new;

  const quarterLabel = fmtQuarterLoc(targetQuarter ?? revision?.target_quarter, locale);
  const nextReleaseHeadline = pickText(locale, nextRelease?.headline);

  if (!hasComparison && !nextReleaseHeadline) return null;

  return (
    <section aria-labelledby="what-changed-heading" className="rounded-2xl border border-line bg-cream p-5 md:p-6">
      <div className="flex items-center gap-2">
        <RefreshCw aria-hidden="true" className="h-4 w-4 text-stone-500" />
        <h2 id="what-changed-heading" className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
          {t('whatChangedEyebrow')}
        </h2>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        {hasComparison
          ? t('whatChangedRevision', {
              quarter: quarterLabel,
              oldValue: fmtSignedPpLoc((revision!.nowcast_old ?? 0) * 100, locale, 2),
              newValue: fmtSignedPpLoc((revision!.nowcast_new ?? 0) * 100, locale, 2),
              delta: fmtSignedPpLoc((revision!.revision ?? 0) * 100, locale, 2),
              oldDate: fmtPeriodLoc(revision!.vintage_old, locale),
              newDate: fmtPeriodLoc(revision!.vintage_new, locale),
            })
          : t('whatChangedNoPrior', { quarter: quarterLabel })}
      </p>

      {nextReleaseHeadline && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-stone-500">
          <CalendarDays aria-hidden="true" className="mt-[1px] h-3.5 w-3.5 shrink-0" />
          <span>{nextReleaseHeadline}</span>
        </p>
      )}
    </section>
  );
}
