import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Action } from '@/components/brand/Action';
import { HomeArt } from './HomeArt';
import { HomePanel, Kicker, Status } from './HomePanel';

/**
 * The population atlas: a synthetic population as a base for research and
 * future microsimulation. Lead in standard mode, secondary in election mode.
 * "Dados e métodos" is an inline disclosure because there is no population
 * methods page yet; it links the atlas's own note and the general methodology.
 */
export async function PopulationPanel({ locale, variant }: { locale: string; variant: 'lead' | 'secondary' }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const lead = variant === 'lead';
  const Heading = lead ? 'h1' : 'h2';
  const methods = (
    <details className="group mt-4 max-w-xl">
      <summary className="inline-flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-[10px] border border-line bg-cream px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-parchment [&::-webkit-details-marker]:hidden">
        {t('populationMethods')}
        <span aria-hidden="true" className="text-stone-500 transition-transform duration-150 group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 space-y-2 rounded-xl border border-line bg-paper p-4 text-sm leading-relaxed text-stone-700">
        <p>{t('populationScope')}</p>
        <p>{t('populationIntent')}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[13px] font-semibold">
          <Link href="/populacao#metodo" locale={locale} className="text-ink underline-offset-4 hover:underline">{t('populationAtlasNote')}</Link>
          <Link href="/metodologia" locale={locale} className="text-ink underline-offset-4 hover:underline">{t('populationMethodology')}</Link>
        </p>
      </div>
    </details>
  );

  if (!lead) {
    return (
      <HomePanel labelledBy="home-population-title" className="flex flex-col p-5 md:p-6">
        <HomeArt name="population" sizes="(min-width: 1100px) 30vw, (min-width: 768px) 50vw, 100vw" className="mx-auto h-[150px] w-full max-w-[260px]" />
        <Kicker>{t('populationKicker')}</Kicker>
        <Heading id="home-population-title" className="mt-2 text-xl md:text-2xl">{t('populationTitle')}</Heading>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{t('populationText')}</p>
        <div className="mt-4"><Action href="/populacao" locale={locale} arrow>{t('populationAction')}</Action></div>
        {methods}
        <Status>{t('populationStatus')}</Status>
      </HomePanel>
    );
  }

  return (
    <HomePanel labelledBy="home-population-title" className="grid gap-5 p-5 md:p-7 min-[1100px]:grid-cols-[52fr_48fr] min-[1100px]:grid-rows-[auto_auto] min-[1100px]:gap-x-8 min-[1100px]:gap-y-0">
      <div className="min-w-0 min-[1100px]:col-start-1 min-[1100px]:self-end">
        <Kicker>{t('populationKicker')}</Kicker>
        <Heading id="home-population-title" className="mt-3 max-w-xl text-3xl leading-[1.08] md:text-4xl">{t('populationTitle')}</Heading>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-stone-600 md:text-[17px]">{t('populationText')}</p>
      </div>
      <HomeArt name="population" priority sizes="(min-width: 1100px) 40vw, (min-width: 768px) 60vw, 100vw" className="mx-auto h-[170px] w-full max-w-[300px] min-[1100px]:col-start-2 min-[1100px]:row-start-1 min-[1100px]:row-span-2 min-[1100px]:h-auto min-[1100px]:max-h-[460px] min-[1100px]:max-w-none min-[1100px]:self-center" />
      <div className="min-w-0 min-[1100px]:col-start-1 min-[1100px]:self-start">
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3 min-[1100px]:mt-6">
          <Action href="/populacao" locale={locale} arrow>{t('populationAction')}</Action>
        </div>
        {methods}
        <Status>{t('populationStatus')}</Status>
      </div>
    </HomePanel>
  );
}
