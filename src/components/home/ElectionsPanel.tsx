import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Action } from '@/components/brand/Action';
import { ELECTION_ROUTES } from '@/lib/config/homepage';
import type { ElectionConfig } from '@/types';
import { HomeArt } from './HomeArt';
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
  const past = (e: ElectionConfig) => new Date(e.date).getTime() < Date.now();
  const pct = (v: number) => `${(v * 100).toLocaleString(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 1 })}%`;

  if (variant === 'lead' && current) {
    const { election, snapshot } = current;
    const href = ELECTION_ROUTES[election.id];
    return (
      <HomePanel labelledBy="home-elections-title" className="relative min-[1100px]:pr-[45%]">
        <div className="min-w-0 px-5 pt-5 md:px-7 md:pt-6">
          <Kicker pill={past(election) ? t('electionsArchived') : t('electionsForecast')}>{t('electionsKicker')}</Kicker>
          <h1 id="home-elections-title" className="mt-3 max-w-xl text-[2rem] leading-[1.06] md:text-[2.4rem]">{election.name}</h1>
          <p className="mt-3 text-[13px] font-semibold text-stone-600">
            {longDate(election.date)}{snapshot.updatedAt ? ` · ${t('electionsUpdated', { date: longDate(snapshot.updatedAt) })}` : ''}
          </p>
        </div>
        <HomeArt name="elections" shape="lead" priority sizes="(min-width: 1100px) 40vw, 100vw" className="mx-5 mt-5 h-[240px] rounded-xl md:mx-7 min-[1100px]:absolute min-[1100px]:inset-y-0 min-[1100px]:right-0 min-[1100px]:m-0 min-[1100px]:h-auto min-[1100px]:w-[43%] min-[1100px]:rounded-none" />
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

  return (
    <HomePanel labelledBy="home-elections-title" className="grid md:grid-cols-[minmax(200px,42%)_1fr]">
      <HomeArt name="elections" shape="square" sizes="(min-width: 1100px) 22vw, (min-width: 768px) 40vw, 100vw" className="h-[200px] w-full md:h-full md:min-h-[260px]" />
      <div className="min-w-0 p-5 md:p-6">
        <Kicker pill={tSections('archiveSection')}>{t('electionsKicker')}</Kicker>
        <h2 id="home-elections-title" className="mt-2 text-xl md:text-[1.5rem] md:leading-[1.2]">{t('electionsTitle')}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{t('electionsText')}</p>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {elections.filter(e => ELECTION_ROUTES[e.id]).map(e => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-2">
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{e.name}</span>
                <span className="block text-[13px] text-stone-600">{past(e) ? t('electionsArchived') : t('electionsForecast')} · {longDate(e.date)}</span>
              </div>
              <Link href={ELECTION_ROUTES[e.id]} locale={locale} className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-[15px] font-semibold text-ink underline-offset-4 hover:underline">{t('electionsOpen')} →</Link>
            </li>
          ))}
        </ul>
      </div>
    </HomePanel>
  );
}
