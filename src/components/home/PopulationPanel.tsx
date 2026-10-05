import { getTranslations } from 'next-intl/server';
import { Action } from '@/components/brand/Action';
import { HomeArt } from './HomeArt';
import { HomePanel, Kicker, Status } from './HomePanel';

/**
 * The population atlas: a synthetic population as a base for research and
 * future microsimulation. Lead in standard mode, secondary in election mode.
 *
 * Compact by design: one concrete human-scale example (with its demonstration
 * status stated in the same breath), one separate sentence for research
 * availability, and a single principal action — the guided older/alone
 * question, not the bare atlas entrance. The illustration is a companion to
 * that copy, never a tall block a phone has to scroll past first.
 */
export async function PopulationPanel({ locale, variant }: { locale: string; variant: 'lead' | 'secondary' }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const lead = variant === 'lead';
  const Heading = lead ? 'h1' : 'h2';
  const principalAction = <Action href="/populacao?question=older" locale={locale} arrow>{t('populationAction')}</Action>;
  const researchNote = (
    <p className="mt-3 text-[13px] leading-relaxed text-stone-500">
      {t('populationResearchNote')}{' '}
      <Action href="/populacao/dados" locale={locale} variant="text" className="min-h-0 text-[13px]">{t('populationMethods')}</Action>
    </p>
  );

  if (!lead) {
    return (
      <HomePanel labelledBy="home-population-title" className="flex flex-col md:flex-row md:items-stretch">
        <div className="flex flex-1 flex-col p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Kicker>{t('populationKicker')}</Kicker>
              <Heading id="home-population-title" className="mt-2 text-2xl md:text-[1.75rem] md:leading-[1.15]">{t('populationTitle')}</Heading>
            </div>
            <HomeArt name="population" shape="square" sizes="72px" className="h-[72px] w-[72px] shrink-0 rounded-xl md:hidden" />
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{t('populationText')}</p>
          <div className="mt-4">{principalAction}</div>
          {researchNote}
          <Status>{t('populationStatus')}</Status>
        </div>
        <HomeArt name="population" shape="square" sizes="200px" className="hidden h-auto w-[200px] shrink-0 self-stretch md:block" />
      </HomePanel>
    );
  }

  return (
    <HomePanel labelledBy="home-population-title" className="md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(220px,.9fr)] min-[1100px]:grid-cols-[minmax(0,1.25fr)_minmax(270px,1fr)]">
      <div className="min-w-0 px-5 pb-5 pt-5 md:flex md:flex-col md:justify-center md:px-6 md:py-6 min-[1100px]:px-7">
        <Kicker>{t('populationKicker')}</Kicker>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_90px] items-center gap-3 md:block">
          <Heading id="home-population-title" className="max-w-xl text-[1.75rem] leading-[1.1] md:text-[2.4rem]">{t('populationTitle')}</Heading>
          <HomeArt name="population" shape="lead" priority sizes="90px" className="h-[90px] w-[90px] md:hidden" />
        </div>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-stone-600 md:text-[17px]">{t('populationText')}</p>
        <div className="mt-5">{principalAction}</div>
        {researchNote}
        <Status>{t('populationStatus')}</Status>
      </div>
      <HomeArt name="population" shape="lead" priority sizes="(min-width: 1100px) 40vw, (min-width: 768px) 42vw, 100vw" className="hidden md:block md:col-start-2 md:!m-0 md:h-full md:max-h-[430px] md:self-center md:w-full md:rounded-none md:py-4 md:[&_img]:object-center" />
    </HomePanel>
  );
}
