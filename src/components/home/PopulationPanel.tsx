import { getTranslations } from 'next-intl/server';
import { Action } from '@/components/brand/Action';
import { Link } from '@/i18n/routing';
import { ParishSearch } from '@/components/population/ParishSearch';
import { ChannelHead, NoMargin } from '@/components/instrument';
import { HONESTY } from '@/lib/population/labels';
import { formatCount } from '@/lib/population/format';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { formatDay } from '@/components/population/quality/copy';
import type { PopulationMeta } from '@/types/population';

/**
 * The synthetic population (the release in POPULATION_RELEASE) as an
 * instrument: its name, version and date over a rule; what it is, in one
 * statement with the release's own counts (meta.json, never typed in); the
 * counter-sign of a single model run and the synthetic caveat before any
 * figure; then the one thing to do, find your parish, with today's Freguesia
 * misteriosa and the open data as text links.
 *
 * The section lets its content overflow (the search's list of matches must
 * not be clipped).
 */
export async function PopulationPanel({ locale, meta }: { locale: string; meta: PopulationMeta | null }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const lang = locale === 'en' ? 'en' : 'pt';
  const released = meta?.data_status === 'release';
  // formatCount is the one population count formatter: "3 092" in Portuguese,
  // where Intl's pt-PT would leave a four-digit count ungrouped.
  const parishes = meta ? formatCount(meta.counts.parishes, lang) : '3 092';

  return (
    <section aria-labelledby="home-population" className="min-w-0">
      <ChannelHead
        id="home-population"
        title={t('populationKicker')}
        href={POPULATION_ROUTES.hub}
        locale={locale}
        serial={released ? `v${meta.release_version}` : undefined}
        aside={released ? t('populationStatus', { date: formatDay(meta.published, lang) }) : undefined}
      />
      <p className="disp mt-4 text-balance text-[30px] leading-[1.02] md:text-[34px]">{t('populationTitle', { parishes })}</p>
      {meta && (
        <p className="mt-3 text-[15.5px] leading-[22px]">
          {t.rich('populationText', {
            persons: formatCount(meta.counts.persons, lang),
            households: formatCount(meta.counts.households, lang),
            b: chunks => <b className="tnum">{chunks}</b>,
          })}
        </p>
      )}
      {/* One model run, so no margin: the counter-sign and the caveat come
          before anything a reader could take for a measurement. */}
      <p className="mt-3 flex flex-col gap-1">
        <NoMargin locale={locale} />
        <span className="text-[12.5px] leading-[17px] text-graphite">{HONESTY.synthetic[lang]}</span>
      </p>
      <ParishSearch locale={lang} label={t('populationSearchLabel')} withLocation className="mt-5" />
      <div className="mt-2 flex flex-wrap items-center gap-x-6">
        <Action href={POPULATION_ROUTES.game} locale={locale} variant="text" arrow>{t('populationGame')}</Action>
        <Link href={POPULATION_ROUTES.data} locale={locale} className="inline-flex min-h-11 items-center text-[14px] text-ink underline decoration-scale underline-offset-4 hover:decoration-ink">{t('populationData')}</Link>
      </div>
    </section>
  );
}
