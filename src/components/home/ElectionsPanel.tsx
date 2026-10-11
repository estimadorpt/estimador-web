import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Action } from '@/components/brand/Action';
import { ELECTION_ROUTES } from '@/lib/config/homepage';
import { PARLIAMENTARY_2025_FORECAST_CUTOFF, PRESIDENTIAL_2026_SECOND_ROUND_DATE } from '@/lib/config/elections';
import { credibleIntervalLabel, formatElectionLongDate, formatElectionPercent, formatElectionProbability } from '@/lib/election-display';
import { loadForecastData, loadSecondRoundData } from '@/lib/utils/data-loader';
import { ChannelHead } from '@/components/instrument';
import { likeliestWinner, mostSeats, partyWithArticle } from '@/lib/election-findings';
import type { ElectionConfig } from '@/types';
import { HomePanel, Kicker } from './HomePanel';

/** What the lead needs from a configured election's published data. */
export interface ElectionSnapshot {
  id: string;
  updatedAt?: string;
  leader?: { name: string; mean: number; lo?: number; hi?: number };
}

/**
 * Elections. Standard mode: the archive as an instrument, one dated finding
 * per election read from its own files, labelled for what the destinations
 * hold (archived forecasts, not results).
 * Election mode: the selected election leads, with its real forecast date, its
 * state named carefully and one strong action; uncertainty stays visible.
 */
export async function ElectionsPanel({ locale, variant, elections, current }: { locale: string; variant: 'support' | 'lead'; elections: ElectionConfig[]; current?: { election: ElectionConfig; snapshot: ElectionSnapshot } | null }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tSections = await getTranslations({ locale, namespace: 'sections' });
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const electionName = (e: ElectionConfig) => locale === 'en'
    ? (({ 'presidential-2026': 'Presidential election 2026', 'parliamentary-2025': 'Parliamentary election 2025' } as Record<string, string>)[e.id] ?? e.name)
    : e.name;
  const past = (e: ElectionConfig) => new Date(e.date).getTime() < Date.now();

  if (variant === 'lead' && current) {
    const { election, snapshot } = current;
    const href = ELECTION_ROUTES[election.id];
    // The presidential lead reads the runoff, the round that decided the
    // election, from its own loader: the leader's share of the valid vote with
    // its 95% interval (P2.5–P97.5, checked against the simulations), with the
    // round and the forecast date named beside it. The first-round snapshot
    // the page passes in carries an interval whose level is not established,
    // so it is not printed.
    let leadLine: { name: string; share: string; range: string; label: string } | null = null;
    let updatedAt = snapshot.updatedAt;
    if (election.id === 'presidential-2026') {
      const runoff = await loadSecondRoundData();
      const leader = [...runoff.validVotes.candidates].sort((a, b) => b.mean - a.mean)[0];
      if (runoff.available && leader) {
        updatedAt = runoff.forecast.updated_at;
        leadLine = {
          name: leader.name,
          share: formatElectionPercent(leader.mean, locale),
          range: `${formatElectionPercent(leader.ci_lower, locale)}–${formatElectionPercent(leader.ci_upper, locale)}`,
          label: t('electionsLeadRunoffLabel', { date: longDate(PRESIDENTIAL_2026_SECOND_ROUND_DATE), interval: credibleIntervalLabel(.025, .975, locale) }),
        };
      }
    } else if (election.id === 'parliamentary-2025') {
      updatedAt = PARLIAMENTARY_2025_FORECAST_CUTOFF;
    }
    return (
      <HomePanel labelledBy="home-elections-title" className="relative">
        <div className="min-w-0 px-5 pt-5 md:px-7 md:pt-6">
          <Kicker status={past(election) ? t('electionsArchived') : t('electionsForecast')}>{t('electionsKicker')}</Kicker>
          <h2 id="home-elections-title" className="mt-3 max-w-xl text-[2rem] leading-[1.06] md:text-[2.4rem]">{electionName(election)}</h2>
          <p className="mt-3 text-[13px] font-semibold text-graphite">
            {longDate(election.date)}{updatedAt ? ` · ${t('electionsForecastAsOf', { date: longDate(updatedAt) })}` : ''}
          </p>
        </div>
        <div className="min-w-0 px-5 pb-5 pt-4 md:px-7 md:pb-6">
          {leadLine && (
            <>
              <p className="max-w-lg text-base leading-relaxed text-ink">
                <span className="font-semibold text-ink">{leadLine.name}</span> {leadLine.share}
                <span className="text-graphite"> ({leadLine.range})</span>
              </p>
              <p className="mt-1 text-[13px] text-graphite">{leadLine.label}</p>
            </>
          )}
          <p className="mt-2 text-[13px] text-graphite">{t('electionsUncertainty')}</p>
          <div className="mt-6">{href && <Action href={href} locale={locale} arrow>{t('electionsAction')}</Action>}</div>
        </div>
      </HomePanel>
    );
  }

  // The date each archived forecast was made. Presidential 2026 carries both
  // rounds, so the runoff forecast's updated_at (the later of the two) is the
  // meaningful one; the parliamentary files carry no run date, so its date is
  // the configured cutoff (PARLIAMENTARY_2025_FORECAST_CUTOFF).
  const forecastCutoffs: Record<string, string | undefined> = { 'parliamentary-2025': PARLIAMENTARY_2025_FORECAST_CUTOFF };
  // Each archive's finding, read from its own files: the runoff winner's
  // chance, and the party with most seats in the seat draws.
  const findings: Record<string, string | undefined> = {};
  if (elections.some(e => e.id === 'presidential-2026')) {
    const second = await loadSecondRoundData();
    forecastCutoffs['presidential-2026'] = second.forecast.updated_at || undefined;
    const leader = likeliestWinner(second.winProbability.candidates);
    if (leader) findings['presidential-2026'] = t('electionsFindingRunoff', { name: leader.name, p: formatElectionProbability(leader.win_probability, locale) });
  }
  if (elections.some(e => e.id === 'parliamentary-2025')) {
    const { seatData } = await loadForecastData();
    const top = mostSeats(seatData);
    if (top) findings['parliamentary-2025'] = t('electionsFindingSeats', { party: partyWithArticle(top.party, locale), p: formatElectionProbability(top.share, locale) });
  }
  // One date per row, the forecast's: the election and round dates are on the
  // archive page itself.
  const dateLine = (e: ElectionConfig, cutoff?: string) => {
    if (!cutoff) return longDate(e.date);
    const date = longDate(cutoff);
    return e.id === 'presidential-2026' ? t('electionsForecastRunoff', { date }) : t('electionsForecastAsOf', { date });
  };

  return (
    <section aria-labelledby="home-elections" className="min-w-0">
      <ChannelHead id="home-elections" title={t('electionsKicker')} href="/eleicoes/arquivo" locale={locale} serial={tSections('archiveSection').toLowerCase()} />
      <p className="mt-3 max-w-[70ch] text-[14px] leading-5 text-graphite">{t('electionsText')}</p>
      <ul className="mt-3 grid gap-x-8 md:grid-cols-2">
        {elections.filter(e => ELECTION_ROUTES[e.id]).map(e => (
          <li key={e.id} className="min-w-0 border-t border-rule py-3">
            <p className="text-[13px] text-graphite">
              <span className="font-semibold text-ink">{electionName(e)}</span>{' · '}{dateLine(e, forecastCutoffs[e.id])}
            </p>
            {findings[e.id] && <p className="disp mt-1 text-[22px] leading-[1.08] md:text-[24px]">{findings[e.id]}</p>}
            <Link href={ELECTION_ROUTES[e.id]} locale={locale} className="mt-1 inline-flex min-h-11 items-center text-[15px] font-semibold text-ink underline underline-offset-4">
              {t('electionsOpen')}<span className="sr-only">: {electionName(e)}</span>&nbsp;<span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
