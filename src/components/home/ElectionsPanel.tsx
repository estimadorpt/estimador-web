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
  const longDate = (iso: string) => new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  const past = (e: ElectionConfig) => new Date(e.date).getTime() < Date.now();
  const pct = (v: number) => `${(v * 100).toLocaleString(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 1 })}%`;

  if (variant === 'lead' && current) {
    const { election, snapshot } = current;
    const href = ELECTION_ROUTES[election.id];
    return (
      <HomePanel labelledBy="home-elections-title" className="grid gap-5 p-5 md:p-7 min-[1100px]:grid-cols-[52fr_48fr] min-[1100px]:grid-rows-[auto_auto] min-[1100px]:gap-x-8 min-[1100px]:gap-y-0">
        <div className="min-w-0 min-[1100px]:col-start-1 min-[1100px]:self-end">
          <Kicker>{t('electionsKicker')} · {past(election) ? t('electionsArchived') : t('electionsForecast')}</Kicker>
          <h1 id="home-elections-title" className="mt-3 max-w-xl text-3xl leading-[1.08] md:text-4xl">{election.name}</h1>
          <p className="mt-3 text-[13px] font-semibold text-stone-600">
            {longDate(election.date)}{snapshot.updatedAt ? ` · ${t('electionsUpdated', { date: longDate(snapshot.updatedAt) })}` : ''}
          </p>
        </div>
        <HomeArt name="elections" priority sizes="(min-width: 1100px) 40vw, (min-width: 768px) 60vw, 100vw" className="mx-auto h-[170px] w-full max-w-[300px] min-[1100px]:col-start-2 min-[1100px]:row-start-1 min-[1100px]:row-span-2 min-[1100px]:h-auto min-[1100px]:max-h-[420px] min-[1100px]:max-w-none min-[1100px]:self-center" />
        <div className="min-w-0 min-[1100px]:col-start-1 min-[1100px]:self-start">
          {snapshot.leader && (
            <p className="max-w-lg text-base leading-relaxed text-stone-700 min-[1100px]:mt-3">
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
    <HomePanel labelledBy="home-elections-title" className="grid gap-4 p-5 md:grid-cols-[minmax(120px,38%)_1fr] md:items-center md:gap-6 md:p-6">
      <HomeArt name="elections" sizes="(min-width: 768px) 22vw, 100vw" className="mx-auto h-[120px] w-full max-w-[220px] md:h-[150px]" />
      <div className="min-w-0">
        <Kicker>{t('electionsKicker')}</Kicker>
        <h2 id="home-elections-title" className="mt-2 text-xl md:text-2xl">{t('electionsTitle')}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{t('electionsText')}</p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {elections.filter(e => ELECTION_ROUTES[e.id]).map(e => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
              <div className="min-w-0">
                <span className="block text-[15px] font-semibold text-ink">{e.name}</span>
                <span className="block text-[13px] text-stone-600">{past(e) ? t('electionsArchived') : t('electionsForecast')} · {longDate(e.date)}</span>
              </div>
              <Link href={ELECTION_ROUTES[e.id]} locale={locale} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-ink underline-offset-4 hover:underline">{t('electionsOpen')} →</Link>
            </li>
          ))}
        </ul>
      </div>
    </HomePanel>
  );
}
