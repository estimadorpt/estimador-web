import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Action } from '@/components/brand/Action';
import { ELECTION_ROUTES } from '@/lib/config/homepage';
import { PRESIDENTIAL_2026_SECOND_ROUND_DATE } from '@/lib/config/elections';
import { loadSecondRoundData } from '@/lib/utils/data-loader';
import type { ElectionConfig } from '@/types';
import { SectionIllustration } from '@/components/brand/SectionIllustration';
import { HomePanel, Kicker } from './HomePanel';

/** What the lead needs from a configured election's published data. */
export interface ElectionSnapshot {
  id: string;
  updatedAt?: string;
  leader?: { name: string; mean: number; lo?: number; hi?: number };
}

/**
 * Elections. Standard mode: the configured elections as dated archive routes,
 * labelled for what the destinations hold (archived forecasts, not results).
 * Election mode: the selected election leads, with its real update time, its
 * state named carefully and one strong action; uncertainty stays visible.
 */
export async function ElectionsPanel({ locale, variant, elections, current }: { locale: string; variant: 'support' | 'lead'; elections: ElectionConfig[]; current?: { election: ElectionConfig; snapshot: ElectionSnapshot } | null }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tSections = await getTranslations({ locale, namespace: 'sections' });
  const longDate = (iso: string) => new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  const electionName = (e: ElectionConfig) => locale === 'en'
    ? (({ 'presidential-2026': 'Presidential election 2026', 'parliamentary-2025': 'Parliamentary election 2025' } as Record<string, string>)[e.id] ?? e.name)
    : e.name;
  const past = (e: ElectionConfig) => new Date(e.date).getTime() < Date.now();
  const pct = (v: number) => `${(v * 100).toLocaleString(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 1 })}%`;

  if (variant === 'lead' && current) {
    const { election, snapshot } = current;
    const href = ELECTION_ROUTES[election.id];
    return (
      <HomePanel labelledBy="home-elections-title" className="relative min-[1100px]:pr-[45%]">
        <div className="min-w-0 px-5 pt-5 md:px-7 md:pt-6">
          <Kicker pill={past(election) ? t('electionsArchived') : t('electionsForecast')}>{t('electionsKicker')}</Kicker>
          <h1 id="home-elections-title" className="mt-3 max-w-xl text-[2rem] leading-[1.06] md:text-[2.4rem]">{electionName(election)}</h1>
          <p className="mt-3 text-[13px] font-semibold text-stone-600">
            {longDate(election.date)}{snapshot.updatedAt ? ` · ${t('electionsUpdated', { date: longDate(snapshot.updatedAt) })}` : ''}
          </p>
        </div>
        <SectionIllustration scene="elections" className="mx-5 mt-5 md:mx-7 min-[1100px]:absolute min-[1100px]:right-0 min-[1100px]:top-8 min-[1100px]:w-[40%]" />
        <div className="min-w-0 px-5 pb-5 pt-4 md:px-7 md:pb-6">
          {snapshot.leader && (
            <p className="max-w-lg text-base leading-relaxed text-stone-700">
              <span className="font-semibold text-ink">{snapshot.leader.name}</span> {pct(snapshot.leader.mean)}
              {snapshot.leader.lo != null && snapshot.leader.hi != null && <span className="text-stone-600"> ({pct(snapshot.leader.lo)}–{pct(snapshot.leader.hi)})</span>}
            </p>
          )}
          <p className="mt-2 text-[13px] text-stone-600">{t('electionsUncertainty')}</p>
          <div className="mt-6">{href && <Action href={href} locale={locale} arrow>{t('electionsAction')}</Action>}</div>
        </div>
      </HomePanel>
    );
  }

  // Forecast cutoff, only where the published data exposes one. Presidential
  // 2026 carries both rounds, so the runoff forecast's updated_at (the later
  // of the two) is the meaningful cutoff. The parliamentary loaders expose no
  // equivalent timestamp, so that entry shows none.
  const forecastCutoffs: Record<string, string | undefined> = {};
  if (elections.some(e => e.id === 'presidential-2026')) {
    const second = await loadSecondRoundData();
    forecastCutoffs['presidential-2026'] = second.forecast?.updated_at;
  }
  const dateLine = (e: ElectionConfig) => e.id === 'presidential-2026'
    ? t('electionsRounds', { date1: longDate(e.date), date2: longDate(PRESIDENTIAL_2026_SECOND_ROUND_DATE) })
    : longDate(e.date);
  const questionLine = (e: ElectionConfig) => e.type === 'presidential' ? t('electionsQuestionRunoff') : t('electionsQuestionSeats');

  return (
    <HomePanel labelledBy="home-elections-title">
      <div className="min-w-0 p-5 md:p-6">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_138px] md:items-center md:gap-5">
          <div>
            <Kicker pill={tSections('archiveSection')}>{t('electionsKicker')}</Kicker>
            <h2 id="home-elections-title" className="mt-2 text-xl md:text-[1.5rem] md:leading-[1.2]">{t('electionsTitle')}</h2>
          </div>
          <SectionIllustration scene="elections" className="home-support-scene hidden md:block md:h-[108px] md:w-[138px] md:p-0 md:[&_img]:h-full" />
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{t('electionsText')}</p>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {elections.filter(e => ELECTION_ROUTES[e.id]).map(e => {
            const cutoff = forecastCutoffs[e.id];
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <div className="min-w-[170px] flex-1">
                  <span className="block text-[15px] font-semibold text-ink">{electionName(e)}</span>
                  <span className="block text-[13px] text-stone-600">
                    {past(e) ? t('electionsArchived') : t('electionsForecast')} · {dateLine(e)}
                    {cutoff ? ` · ${t('electionsForecastAsOf', { date: longDate(cutoff) })}` : ''}
                  </span>
                  <span className="block text-[12px] text-stone-500">{questionLine(e)}</span>
                </div>
                <Link href={ELECTION_ROUTES[e.id]} locale={locale} className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-[15px] font-semibold text-ink underline-offset-4 hover:underline">{t('electionsOpen')} →</Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-3"><Action href="/eleicoes/arquivo" locale={locale} variant="text" arrow>{locale === 'pt' ? 'Como ler o arquivo' : 'How to read the archive'}</Action></div>
      </div>
    </HomePanel>
  );
}
