import { getTranslations } from 'next-intl/server';
import { Action } from '@/components/brand/Action';
import { Link } from '@/i18n/routing';
import { ParishSearch } from '@/components/population/ParishSearch';
import { HONESTY } from '@/lib/population/labels';
import { formatCount } from '@/lib/population/format';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { formatDay } from '@/components/population/quality/copy';
import type { PopulationMeta } from '@/types/population';
import { HomePanel, Kicker, Status } from './HomePanel';

/**
 * The synthetic population (the release in POPULATION_RELEASE). Lead in standard mode, secondary in
 * election mode.
 *
 * One question and one thing to do about it: find your parish. The search is
 * the main action and goes straight to the parish page; today's Freguesia
 * misteriosa is the second, as a text action; the open data are a quiet link.
 * The one line of figures is read from the release's own counts (meta.json,
 * through the loader), never typed in, and the synthetic caveat sits right
 * under it.
 *
 * The panel lets its content overflow (the search's list of matches must not
 * be clipped by the card), so the illustration carries its own corners.
 */
export async function PopulationPanel({ locale, variant, meta }: { locale: string; variant: 'lead' | 'secondary'; meta: PopulationMeta | null }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const lang = locale === 'en' ? 'en' : 'pt';
  const lead = variant === 'lead';
  // The homepage's h1 is the site line above the grid; every panel title is an h2.
  const Heading = 'h2';
  // The same status slot as the other three panels (CL2-05): the release's
  // state and version in the kicker's pill, its date in the status line, both
  // read from meta.json. The version keeps its lower-case "v" in the
  // upper-case kicker.
  const released = meta?.data_status === 'release';
  const pill = released
    ? t.rich('populationPill', { version: meta.release_version, v: chunks => <span className="normal-case">{chunks}</span> })
    : undefined;

  const figures = meta && (
    <>
      <p className={lead ? 'mt-3 max-w-lg text-base leading-relaxed text-stone-600 md:text-[17px]' : 'mt-2 text-[15px] leading-relaxed text-stone-600'}>
        {t('populationText')}
      </p>
      <p className="mt-1.5 text-[13px] leading-snug text-stone-500">{HONESTY.synthetic[lang]}</p>
    </>
  );

  const actions = (
    <>
      <ParishSearch
        locale={lang}
        label={t('populationSearchLabel')}
        withLocation={lead}
        className={lead ? 'mt-5 max-w-xl' : 'mt-4'}
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-6">
        <Action href={POPULATION_ROUTES.game} locale={locale} variant="text" arrow>{t('populationGame')}</Action>
        <Link href={POPULATION_ROUTES.data} locale={locale} className="inline-flex min-h-11 items-center text-[13px] font-medium text-stone-600 underline underline-offset-4 hover:text-ink">{t('populationData')}</Link>
      </div>
      {released && <Status>{t('populationStatus', { date: formatDay(meta.published, lang) })}</Status>}
    </>
  );

  // The release's own counts, as figures: the numbers lead, the words follow.
  // formatCount is the one population count formatter: "3 092" in Portuguese,
  // where Intl's pt-PT would leave a four-digit count ungrouped.
  const counts = meta && (
    <dl className={lead ? 'grid grid-cols-1 gap-y-1 md:gap-y-5' : 'mt-4 grid grid-cols-1 gap-y-1'}>
      {([
        [formatCount(meta.counts.persons, lang), lang === 'pt' ? 'pessoas' : 'people'],
        [formatCount(meta.counts.households, lang), lang === 'pt' ? 'agregados' : 'households'],
        [formatCount(meta.counts.parishes, lang), lang === 'pt' ? 'freguesias' : 'parishes'],
      ] as const).map(([value, label]) => (
        <div key={label} className={`flex min-w-0 flex-row-reverse items-baseline justify-end gap-2 ${lead ? 'md:flex-col-reverse md:items-start md:gap-0.5' : ''}`}>
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-stone-500">{label}</dt>
          <dd className={`font-black tabular-nums tracking-tight text-ink ${lead ? 'text-2xl md:text-5xl' : 'text-2xl'}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );

  if (!lead) {
    return (
      <HomePanel labelledBy="home-population-title" className="!overflow-visible">
        <div className="flex min-w-0 flex-col p-5 md:p-6">
          <Kicker pill={pill}>{t('populationKicker')}</Kicker>
          <Heading id="home-population-title" className="mt-2 text-2xl md:text-[1.75rem] md:leading-[1.15]">{t('populationTitle')}</Heading>
          {counts}
          {figures}
          {actions}
        </div>
      </HomePanel>
    );
  }

  return (
    <HomePanel labelledBy="home-population-title" className="!overflow-visible md:grid md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 px-5 pb-5 pt-5 md:px-6 md:py-6 min-[1100px]:px-7">
        <Kicker pill={pill}>{t('populationKicker')}</Kicker>
        <Heading id="home-population-title" className="mt-3 max-w-xl text-[1.75rem] leading-[1.1] md:text-[2.4rem]">{t('populationTitle')}</Heading>
        <div className="mt-5 md:hidden">{counts}</div>
        {figures}
        {actions}
      </div>
      <div className="hidden border-l border-line px-6 py-6 md:block min-[1100px]:px-8">{counts}</div>
    </HomePanel>
  );
}
