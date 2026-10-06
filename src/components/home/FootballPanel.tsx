import { loadLigaData } from '@/lib/utils/football-data-loader';
import { getTranslations } from 'next-intl/server';
import { Action } from '@/components/brand/Action';
import { buildClubOutlooks } from '@/components/football/club-outlook';
import { loadGameFixtures } from '@/components/football/load-game-fixtures';
import { SectionIllustration } from '@/components/brand/SectionIllustration';
import type { TeamDelta } from '@/types/football';
import { HomePanel, Kicker } from './HomePanel';
import { FootballClubPicker } from './FootballClubPicker';
import { TitleProbabilities } from '@/components/football/TitleProbabilities';
import { forecastStatusLine, forecastStatusLinePlayed, roundPlayedAt } from '@/lib/football-status';
import { ClockSwitch } from '@/components/football/ClockSwitch';
import { splitForecastRound } from './football-status-pill';

export interface FootballSnapshot {
  matchday: number;
  timestamp?: string;
  top3: Array<{ team: string; p_champion: number }>;
}

/**
 * The Liga module: a labelled general outlook (dated title race) until a
 * visitor picks a club, after which every figure, label and link follows
 * that club — its relevant objective, dated baseline and its own supported
 * fixture's three-outcome stakes (diagnosis §4/§12). The per-club payload is
 * computed once here, server-side, for all 18 clubs; FootballClubPicker only
 * switches between precomputed answers. The stadium comes after the answer,
 * as the band that fills the rest of the panel (`.home-band`), never a
 * banner ahead of it.
 */
export async function FootballPanel({ locale, variant, snapshot, deltas }: { locale: string; variant: 'secondary' | 'support'; snapshot: FootballSnapshot | null; deltas?: Record<string, TeamDelta> }) {
  const [t, latest, gameFixtures] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    snapshot ? loadLigaData() : Promise.resolve({ prediction: null, scenarios: null }),
    snapshot ? loadGameFixtures() : Promise.resolve(null),
  ]);
  const rail = variant === 'secondary';
  // "Depois da jornada 7 · atualizado a 25 set. · próxima atualização após a
  // jornada 8 (9–12 out.)": the same dated line as the Liga page, so the
  // forecast date never reads like a match date (audit CL-M4).
  const prediction = latest.prediction;
  const inProgress = Boolean(prediction?.matches_remaining?.length);
  const nextRound = prediction ? (inProgress ? prediction.matchday : (prediction.next_matchday?.matchday ?? null)) : null;
  const statusInput = snapshot?.timestamp
    ? {
        matchday: snapshot.matchday,
        timestamp: snapshot.timestamp,
        inProgress,
        nextRound,
        nextRoundKickoffs: (gameFixtures?.matchdays ?? [])
          .filter((md) => md.matchday === nextRound)
          .flatMap((md) => md.fixtures.filter((f) => f.home_goals == null).map((f) => f.kickoff)),
      }
    : null;
  // After the round the next update waits for, the rail says a new forecast
  // is in preparation rather than promising it (audit FRESH-01). The round
  // the forecast follows is the kicker's pill, like "Arquivo" on the
  // elections panel (CL2-05), so the line under the heading starts at the
  // date instead of repeating it.
  const initial = statusInput ? splitForecastRound(forecastStatusLine(statusInput, locale), locale) : null;
  const pill = initial?.round;
  const statusLine = statusInput && initial ? (
    <ClockSwitch
      initial={initial.rest}
      steps={[{ at: roundPlayedAt(statusInput.nextRoundKickoffs), value: splitForecastRound(forecastStatusLinePlayed(statusInput, locale), locale).rest }]}
    />
  ) : '';
  const outlooks = latest.prediction
    ? buildClubOutlooks(locale === 'pt' ? 'pt' : 'en', latest.prediction, latest.scenarios, gameFixtures)
    : [];
  // The deltas compare with the previous published matchday; say so in
  // words a sighted reader sees, not only in an sr-only span.
  const hasDeltas = Boolean(deltas && Object.keys(deltas).length && snapshot && snapshot.matchday > 1);
  const generalLabels = {
    champion: t('footballChampionLabel'),
    change: hasDeltas && snapshot ? t('footballChangeCaption', { matchday: snapshot.matchday - 1 }) : null,
    link: t('footballLink'),
  };
  // The three clubs likeliest to finish 17th or 18th in the same forecast,
  // the bottom of "como pode acabar" beside the title race (CL3-02).
  const relegation = latest.prediction
    ? {
        label: t('footballRelegationLabel'),
        teams: [...latest.prediction.table]
          .sort((a, b) => b.p_relegation - a.p_relegation)
          .slice(0, 3)
          .map(({ team, p_relegation }) => ({ team, p_relegation })),
      }
    : undefined;

  const copy = (
    <>
      <div>
        <div className="min-w-0">
          <Kicker pill={pill}>{t('footballKicker')}</Kicker>
          <h2 id="home-football-title" className={`mt-1 ${rail ? 'text-xl md:text-[1.5rem] md:leading-[1.15]' : 'text-lg md:text-[1.35rem] md:leading-[1.2]'}`}>
            {t('footballTitle')}
          </h2>
          {snapshot ? (
            <p className="mt-1 text-[13px] font-semibold text-stone-600">{statusLine}</p>
          ) : (
            <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{t('footballUnavailable')}</p>
          )}
        </div>
      </div>
      {snapshot && outlooks.length ? (
        <FootballClubPicker locale={locale} outlooks={outlooks} top3={snapshot.top3} deltas={deltas} generalLabels={generalLabels} relegation={relegation} />
      ) : snapshot ? (
        // A forecast without per-club outlooks (no scenarios published):
        // the general title race, labelled, and the way into the Liga page.
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {generalLabels.champion}{generalLabels.change ? ` · ${generalLabels.change}` : ''}
          </p>
          <div className="mt-2">
            <TitleProbabilities teams={snapshot.top3} deltas={hasDeltas ? deltas : undefined} locale={locale} compact />
          </div>
          <div className="mt-4">
            <Action href="/desporto/liga" locale={locale} variant="secondary" arrow>{generalLabels.link}</Action>
          </div>
        </div>
      ) : !snapshot ? (
        <div className="mt-4">
          <Action href="/desporto/liga/metodologia" locale={locale} variant="secondary" arrow>{t('footballMethod')}</Action>
        </div>
      ) : null}
    </>
  );

  if (rail) {
    return (
      <HomePanel labelledBy="home-football-title" className="flex flex-col">
        <div className="p-4 md:p-5">{copy}</div>
        <SectionIllustration scene="football" sizes="(min-width: 1100px) 32vw, 100vw" className="home-band home-band--football" />
      </HomePanel>
    );
  }
  return (
    <HomePanel labelledBy="home-football-title" className="flex flex-col">
      <div className="min-w-0 p-5 md:p-6">{copy}</div>
      <SectionIllustration scene="football" sizes="(min-width: 900px) 50vw, 100vw" className="home-band home-band--football" />
    </HomePanel>
  );
}
