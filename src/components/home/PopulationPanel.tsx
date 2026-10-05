import { getTranslations } from 'next-intl/server';
import { Action } from '@/components/brand/Action';
import { Link } from '@/i18n/routing';
import { ParishSearch } from '@/components/population/ParishSearch';
import { HONESTY } from '@/lib/population/labels';
import { POPULATION_ROUTES } from '@/lib/config/population';
import type { PopulationMeta } from '@/types/population';
import { HomeArt } from './HomeArt';
import { HomePanel, Kicker, Status } from './HomePanel';

/**
 * The synthetic population, v1.0.0. Lead in standard mode, secondary in
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
  const Heading = lead ? 'h1' : 'h2';
  const number = new Intl.NumberFormat(lang === 'pt' ? 'pt-PT' : 'en-GB');

  const figures = meta && (
    <>
      <p className={lead ? 'mt-3 max-w-lg text-base leading-relaxed text-stone-600 md:text-[17px]' : 'mt-2 text-[15px] leading-relaxed text-stone-600'}>
        {t('populationText', {
          persons: number.format(meta.counts.persons),
          households: number.format(meta.counts.households),
          parishes: number.format(meta.counts.parishes),
        })}
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
      {meta && <Status>{t('populationStatus', { version: meta.release_version })}</Status>}
    </>
  );

  if (!lead) {
    return (
      <HomePanel labelledBy="home-population-title" className="!overflow-visible flex flex-col md:flex-row md:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Kicker>{t('populationKicker')}</Kicker>
              <Heading id="home-population-title" className="mt-2 text-2xl md:text-[1.75rem] md:leading-[1.15]">{t('populationTitle')}</Heading>
            </div>
            <HomeArt name="population" shape="square" sizes="72px" className="h-[72px] w-[72px] shrink-0 rounded-xl md:hidden" />
          </div>
          {figures}
          {actions}
        </div>
        <HomeArt name="population" shape="square" sizes="200px" className="hidden h-auto w-[200px] shrink-0 self-stretch rounded-r-2xl md:block" />
      </HomePanel>
    );
  }

  return (
    <HomePanel labelledBy="home-population-title" className="!overflow-visible md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(220px,.9fr)] min-[1100px]:grid-cols-[minmax(0,1.25fr)_minmax(270px,1fr)]">
      <div className="min-w-0 px-5 pb-5 pt-5 md:flex md:flex-col md:justify-center md:px-6 md:py-6 min-[1100px]:px-7">
        <Kicker>{t('populationKicker')}</Kicker>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_90px] items-center gap-3 md:block">
          <Heading id="home-population-title" className="max-w-xl text-[1.75rem] leading-[1.1] md:text-[2.4rem]">{t('populationTitle')}</Heading>
          <HomeArt name="population" shape="lead" priority sizes="90px" className="h-[90px] w-[90px] rounded-xl md:hidden" />
        </div>
        {figures}
        {actions}
      </div>
      <HomeArt name="population" shape="lead" priority sizes="(min-width: 1100px) 40vw, (min-width: 768px) 42vw, 100vw" className="hidden md:block md:col-start-2 md:!m-0 md:h-full md:max-h-[430px] md:self-center md:w-full md:rounded-r-2xl md:py-4 md:[&_img]:object-center" />
    </HomePanel>
  );
}
