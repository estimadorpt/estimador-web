// Release calendar (from the stories feed): dates are ESTIMATED from each
// institution's usual calendar rules — never presented as confirmed. Two
// surfaces: a one-line "next release" strip for the page header, and a compact
// list card for the stories section.

import { getTranslations } from 'next-intl/server';
import { CalendarDays } from 'lucide-react';
import { HonestyNote } from '../dashboard/HonestyNote';
import { fmtPeriodLoc } from '@/lib/utils/story-format';
import { pickText, type ReleaseCalendarModule } from '@/types/economy-stories';

/** Hero strip: "Próxima divulgação relevante: … (data estimada)". */
export async function NextReleaseLine({
  data,
  locale,
}: {
  data: ReleaseCalendarModule;
  locale: string;
}) {
  const headline = pickText(locale, data?.headline);
  if (!headline) return null;
  return (
    <p
      className="flex items-start gap-1.5 text-stone-400 text-xs max-w-2xl"
      title={pickText(locale, data?.honesty_note_i18n)}
    >
      <CalendarDays className="w-3.5 h-3.5 mt-[1px] shrink-0" aria-hidden />
      <span>{headline}</span>
    </p>
  );
}

/** Compact list card for the stories section. */
export async function ReleaseCalendarCard({
  data,
  locale,
}: {
  data: ReleaseCalendarModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const entries = (data?.entries ?? []).filter((e) => e && e.date_estimated);
  if (entries.length === 0) return null;

  return (
    <section className="rounded-lg border border-stone-200 bg-stone-50/60 p-5 md:p-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-stone-400" aria-hidden />
        <h3 className="text-base font-bold tracking-tight text-stone-900">
          {pickText(locale, data?.title) ?? t('calendarTitle')}
        </h3>
      </div>

      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {entries.map((e, i) => (
          <li
            key={e.id ?? i}
            className="rounded border border-stone-200 bg-white px-3 py-2"
            title={e.rule}
          >
            <div className="text-xs font-semibold text-stone-800 leading-snug">
              {pickText(locale, e.name)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-500 tabular-nums">
              <span>{fmtPeriodLoc(e.date_estimated, locale)}</span>
              {e.estimated !== false && (
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-stone-100 text-stone-500">
                  {t('calendarEstimated')}
                </span>
              )}
            </div>
            {pickText(locale, e.updates) && (
              <div className="mt-0.5 text-[10px] text-stone-400">
                {t('calendarUpdates')}: {pickText(locale, e.updates)}
              </div>
            )}
          </li>
        ))}
      </ul>

      <HonestyNote note={pickText(locale, data?.honesty_note_i18n)} />
    </section>
  );
}
