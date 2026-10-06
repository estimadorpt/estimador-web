import { Link } from '@/i18n/routing';
import { teamWithArticle } from '@/lib/config/football';
import { kickoffSteps, matchPlayedLine, matchStartedLine } from '@/lib/football-status';
import { ClockSwitch } from './ClockSwitch';
import { formatClubPercent, type ClubOutlookEntry, type Locale } from './club-outlook';

/**
 * The three-outcome stakes card: one club's relevant season objective, its
 * dated baseline and what each result of its supported fixture would change
 * it to. Shared verbatim between the homepage football module and the club
 * page (diagnosis §4/§5 — "a stronger answer format exists in the product
 * and should be promoted/reused, not rebuilt"). Callers render their own
 * headline ("X: o que muda contra o Y?") above this; this component owns only
 * the objective/status line, the four figures and the conditional-vs-match
 * disclaimer. With `matchLink`, it ends with the way to the match page (the
 * club page, audit PUB2-04; the homepage has its own action).
 */
export function FixtureStakes({
  locale,
  entry,
  matchLink = false,
  simulatorLink = false,
}: {
  locale: Locale;
  entry: ClubOutlookEntry;
  matchLink?: boolean;
  /** Also link to the simulator, set to this club and its objective (audit FA3-03). */
  simulatorLink?: boolean;
}) {
  const pt = locale === 'pt';
  const clubFor = pt ? teamWithArticle(entry.team, 'para') : entry.label;
  const clubOf = pt ? teamWithArticle(entry.team, 'de') : entry.label;

  // After kickoff the status line stops calling the game "próximo" and dates
  // the forecast instead (audit FRESH-01), and two hours on it says the game
  // was played, not that it is under way (FR3-04).
  const statusLine = entry.fixtureStatusLabel ? (
    <ClockSwitch
      initial={entry.fixtureStatusLabel}
      steps={kickoffSteps(
        entry.fixtureKickoff,
        Boolean(entry.fixtureKickoff),
        matchStartedLine(entry.forecastTimestamp, locale),
        matchPlayedLine(entry.forecastTimestamp, locale),
      )}
    />
  ) : null;

  const linkClass = 'inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4';
  const link = (matchLink && entry.matchHref) || simulatorLink ? (
    <p className="flex flex-wrap gap-x-6">
      {matchLink && entry.matchHref && (
        <Link href={entry.matchHref} locale={locale} className={linkClass}>
          {pt ? 'Análise do jogo' : 'Match analysis'} <span aria-hidden="true">→</span>
        </Link>
      )}
      {simulatorLink && (
        <Link href={entry.simulatorHref} locale={locale} className={linkClass}>
          {pt ? 'Ver no simulador' : 'See it in the simulator'} <span aria-hidden="true">→</span>
        </Link>
      )}
    </p>
  ) : null;

  if (!entry.objective || entry.baseline == null) {
    // No season figure reaches 1% (Santa Clara): the next game's own 1X2 is
    // still worth showing (audit FA2-14).
    return (
      <div className="space-y-3">
        {statusLine && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{statusLine}</p>
        )}
        {entry.matchOutcome && (
          <dl className="grid grid-cols-3 gap-x-4 gap-y-3 sm:max-w-md">
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Vitória' : 'Win'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.matchOutcome.win, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Empate' : 'Draw'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.matchOutcome.draw, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Derrota' : 'Loss'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.matchOutcome.loss, locale)}</dd>
            </div>
          </dl>
        )}
        <p className="text-sm leading-relaxed text-stone-600">
          {entry.matchOutcome
            ? pt
              ? `Probabilidades deste jogo, do lado ${clubOf}. Nenhuma das probabilidades de época (título, top 3, despromoção) chega a 1% ${clubFor} nesta previsão.`
              : `This match's probabilities, from ${entry.label}'s side. None of the season probabilities (title, top 3, relegation) reach 1% for ${entry.label} in this forecast.`
            : pt
              ? `Nenhuma das probabilidades de época (título, top 3, despromoção) chega a 1% ${clubFor} nesta previsão.`
              : `None of the season probabilities (title, top 3, relegation) reach 1% for ${entry.label} in this forecast.`}
        </p>
        {link}
      </div>
    );
  }

  const stakesReady = entry.hasFixture && entry.win != null && entry.draw != null && entry.loss != null;

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
        <span>{entry.objectiveLabel}</span>
        {statusLine && (
          <span className="font-medium normal-case tracking-normal text-stone-500">· {statusLine}</span>
        )}
      </p>
      {entry.postponedLabel && (
        <p className="text-xs text-stone-500">{entry.postponedLabel}</p>
      )}

      {stakesReady ? (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-stone-500">
                <ClockSwitch
                  initial={pt ? 'Agora' : 'Now'}
                  steps={entry.fixtureKickoff ? [{ at: entry.fixtureKickoff, value: pt ? 'Antes do jogo' : 'Before the match' }] : []}
                />
              </dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.baseline, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Se ganhar' : 'If it wins'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.win as number, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Se empatar' : 'If it draws'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.draw as number, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Se perder' : 'If it loses'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.loss as number, locale)}</dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-stone-500">
            {pt
              ? 'Hipóteses de fim de época condicionadas ao resultado deste jogo — não é a probabilidade desse resultado.'
              : "End-of-season chances conditional on this match's result — not the chance of that result itself."}
            {entry.matchWinProbability != null && (
              <>
                {' '}
                {pt
                  ? `Probabilidade de vitória ${clubOf} neste jogo`
                  : `Probability of ${entry.label} winning this match`}
                : <strong className="font-semibold text-stone-600">{formatClubPercent(entry.matchWinProbability, locale)}</strong>.
              </>
            )}
          </p>
        </>
      ) : entry.hasFixture ? (
        <p className="text-sm leading-relaxed text-stone-600">
          {pt
            ? `Agora ${formatClubPercent(entry.baseline, locale)}. Este conjunto não publica o efeito deste jogo em ${entry.objectiveLabel}.`
            : `Now ${formatClubPercent(entry.baseline, locale)}. This bundle does not publish this match's effect on ${entry.objectiveLabel}.`}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-stone-600">
          {pt
            ? `Agora ${formatClubPercent(entry.baseline, locale)}. O conjunto publicado não inclui um jogo em aberto ${clubFor}.`
            : `Now ${formatClubPercent(entry.baseline, locale)}. The published bundle includes no outstanding match for ${entry.label}.`}
        </p>
      )}
      {link}
    </div>
  );
}
