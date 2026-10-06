import { Check } from "lucide-react";
import { OUTCOME_TONES, teamColorOnPaper, teamDisplayName, teamLogoSrc, teamWithArticle } from "@/lib/config/football";
import { formatKickoff, formatKickoffShort, formatLongDate, formatPercent } from "@/lib/football-format";
import { kickoffSteps, matchPlayedLine, matchStartedLine } from "@/lib/football-status";
import { ClockSwitch } from "@/components/football/ClockSwitch";

interface MatchProbabilityHeroProps {
  home: string;
  away: string;
  homeColor: string;
  awayColor: string;
  pHome: number | null;
  pDraw: number | null;
  pAway: number | null;
  matchday: number;
  kickoff: string | null;
  /** False while the kickoff is a placeholder: the day is shown, not the hour. */
  kickoffConfirmed?: boolean;
  locale: string;
  /** Final score, when the fixture has already been played. */
  played?: { home_goals: number; away_goals: number } | null;
  /** For a played fixture: when the 1X2 shown was frozen, before kickoff. */
  probsPublishedAt?: string | null;
  /** For a played fixture with no forecast shown: when the odds came out, after kickoff. */
  probsLatePublishedAt?: string | null;
  /** For a played fixture: the previous round, when the odds were frozen before it ended. */
  probsFrozenDuringRound?: number | null;
  /** The forecast's timestamp, for "Jogo começou · previsão de 25 set." after kickoff. */
  forecastTimestamp?: string | null;
  /** For a postponed game still to play: the 1X2 frozen when its round
   * opened, which the game and the match record use (audit VFA-M2). */
  frozenProbs?: { p_home: number; p_draw: number; p_away: number; publishedAt: string } | null;
}

/** The number part of the one football percentage rule ("44", "8,4", ">99"). */
function pct(p: number, locale: string): string {
  return formatPercent(p, locale).replace(/%$/, "");
}

/** Kickoff in Lisbon time; a placeholder kickoff shows its day only. */
function kickoffLabel(iso: string | null, confirmed: boolean, locale: string): string | null {
  if (!iso) return null;
  if (!confirmed) {
    const day = formatLongDate(iso, locale, { year: false });
    if (!day) return null;
    return locale === "en" ? `${day} (kickoff to be confirmed)` : `${day} (horário por confirmar)`;
  }
  return formatKickoff(iso, locale) || null;
}

export function MatchProbabilityHero({
  home,
  away,
  homeColor,
  awayColor,
  pHome,
  pDraw,
  pAway,
  matchday,
  kickoff,
  kickoffConfirmed = true,
  locale,
  played,
  probsPublishedAt,
  probsLatePublishedAt,
  probsFrozenDuringRound,
  forecastTimestamp,
  frozenProbs = null,
}: MatchProbabilityHeroProps) {
  const pt = locale !== "en";
  const hasProbs = pHome != null && pDraw != null && pAway != null;
  const when = kickoffLabel(kickoff, kickoffConfirmed, locale);
  // The centre of the fixture line: the score of a played game, the kickoff
  // of one to come; never a lone dash that reads as a missing score (UXD2-V05).
  const centre = played
    ? null
    : formatKickoffShort(kickoff, locale, { confirmed: kickoffConfirmed });

  const labels = {
    matchday: pt ? `Jornada ${matchday}` : `Matchday ${matchday}`,
    // "Vitória em casa" read as a club name beside Vitória SC; name the
    // winner instead.
    homeWin: pt ? `Ganha o ${teamDisplayName(home)}` : `${teamDisplayName(home)} win`,
    draw: pt ? "Empate" : "Draw",
    awayWin: pt ? `Ganha o ${teamDisplayName(away)}` : `${teamDisplayName(away)} win`,
    venueHome: pt ? "em casa" : "at home",
    venueAway: pt ? "fora" : "away",
    noProbs: pt
      ? "Probabilidades ainda não publicadas para este jogo."
      : "Probabilities not published for this fixture yet.",
    favourite: pt ? "Resultado mais provável" : "Most likely outcome",
    notMajority: (name: string, p: number) =>
      pt
        ? `Favorito entre três resultados — não é o mesmo que ser mais provável do que todas as alternativas juntas: ${name} vence em ${formatPercent(p, locale)} dos cenários, mas não vence em ${formatPercent(1 - p, locale)}.`
        : `Favourite among three outcomes — not the same as being more likely than all alternatives combined: ${name} wins in ${formatPercent(p, locale)} of scenarios, but doesn't in ${formatPercent(1 - p, locale)}.`,
  };

  // Neutral home/draw/away tones in the split bar, as on the hub cards; the
  // club colour is the rule above each club's number (audit UXD2-V06).
  const outcomes = hasProbs
    ? ([
        { key: "H", p: pHome!, label: labels.homeWin, venue: labels.venueHome, team: home, rule: teamColorOnPaper(home) || homeColor, tone: OUTCOME_TONES.home },
        { key: "D", p: pDraw!, label: labels.draw, venue: "", team: null, rule: OUTCOME_TONES.draw, tone: OUTCOME_TONES.draw },
        { key: "A", p: pAway!, label: labels.awayWin, venue: labels.venueAway, team: away, rule: teamColorOnPaper(away) || awayColor, tone: OUTCOME_TONES.away },
      ] as const)
    : [];

  const top = outcomes.length
    ? [...outcomes].sort((a, b) => b.p - a.p)[0]
    : null;

  // A played game marks the outcome that happened, beside what the model
  // gave it before kickoff (audit UXD3-03).
  const happened: "H" | "D" | "A" | null = played
    ? played.home_goals > played.away_goals ? "H" : played.home_goals < played.away_goals ? "A" : "D"
    : null;
  const happenedOutcome = happened ? outcomes.find(o => o.key === happened) ?? null : null;
  const happenedSentence = happenedOutcome
    ? pt
      ? `${happenedOutcome.team ? `Ganhou ${teamWithArticle(happenedOutcome.team, "o")}` : "Empate"}. Antes do jogo, o modelo dava ${formatPercent(happenedOutcome.p, locale)} a este resultado.`
      : `${happenedOutcome.team ? `${teamDisplayName(happenedOutcome.team)} won` : "A draw"}. Before the match, the model gave this outcome ${formatPercent(happenedOutcome.p, locale)}.`
    : null;

  const publishedNote = probsPublishedAt
    ? pt
      ? ` (publicadas a ${formatLongDate(probsPublishedAt, locale)}${probsFrozenDuringRound ? `, quando a jornada ${probsFrozenDuringRound} ainda decorria` : ""})`
      : ` (published ${formatLongDate(probsPublishedAt, locale)}${probsFrozenDuringRound ? `, while matchday ${probsFrozenDuringRound} was still being played` : ""})`
    : "";

  return (
    <div>
      {/* Fixture line with the crests. The page's h1 is in its PageHero. */}
      <div className="flex items-center justify-between gap-3 mb-5 text-base font-normal tracking-normal">
        <div className="flex items-center gap-3 min-w-0">
          {teamLogoSrc(home) && (
            <img
              src={teamLogoSrc(home)}
              alt=""
              width={56}
              height={56}
              className="w-10 h-10 md:w-14 md:h-14 object-contain"
            />
          )}
          <span className="text-xl md:text-3xl font-display font-extrabold tracking-tight text-stone-900 truncate">
            {teamDisplayName(home)}
          </span>
        </div>
        {" "}
        {played ? (
          <span className="shrink-0 text-center text-2xl md:text-4xl font-display font-extrabold tabular-nums text-stone-900">
            <span className="sr-only">{pt ? "Resultado final: " : "Final score: "}</span>
            {played.home_goals}
            <span aria-hidden="true" className="mx-1.5 text-stone-500">–</span>
            <span className="sr-only">{pt ? " a " : " to "}</span>
            {played.away_goals}
          </span>
        ) : centre ? (
          // On a phone the names need the width; the kickoff is on the line below.
          <span className="hidden shrink-0 text-center text-[11px] font-bold uppercase tracking-wider tabular-nums text-stone-500 sm:inline md:text-xs">
            {centre}
          </span>
        ) : null}
        {" "}
        <div className="flex items-center gap-3 min-w-0 justify-end">
          <span className="text-xl md:text-3xl font-display font-extrabold tracking-tight text-stone-900 truncate text-right">
            {teamDisplayName(away)}
          </span>
          {teamLogoSrc(away) && (
            <img
              src={teamLogoSrc(away)}
              alt=""
              width={56}
              height={56}
              className="w-10 h-10 md:w-14 md:h-14 object-contain"
            />
          )}
        </div>
      </div>

      {/* The kickoff once: centred in the fixture line from `sm`, here on
          phones, where the names need the width; the matchday is the
          hero's kicker (audit UXD3-06). After kickoff the line dates what
          the page shows instead (FRESH-01), at every width, and says the
          game was played two hours on (FR3-04). */}
      {when && (() => {
        const steps = !played && forecastTimestamp
          ? kickoffSteps(kickoff, kickoffConfirmed, matchStartedLine(forecastTimestamp, locale), matchPlayedLine(forecastTimestamp, locale))
          : [];
        const shownFromSm = Boolean(centre) && !played && kickoffConfirmed;
        const line = "mb-4 text-[11px] font-bold uppercase tracking-wider text-stone-500";
        // The whole line is the switched node, so no empty margin is left
        // on wide screens before kickoff.
        const initial = <div className={shownFromSm ? `${line} sm:hidden` : line}>{when}</div>;
        if (steps.length === 0) return initial;
        return (
          <ClockSwitch
            initial={initial}
            steps={steps.map(s => ({ at: s.at, value: <div className={line}>{s.value}</div> }))}
          />
        );
      })()}
      {!when && <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-stone-500">{labels.matchday}</div>}

      {played && hasProbs && (
        <p className="mb-4 text-sm text-stone-600">
          {pt
            ? `Antes do jogo, o modelo dava estas probabilidades${publishedNote}:`
            : `Before the match, the model gave these probabilities${publishedNote}:`}
        </p>
      )}

      {/* No forecast for a game whose odds came out after it kicked off: say
          why, rather than promise one and show nothing (audit FRESH-03). */}
      {played && !hasProbs && (
        <p className="mb-4 max-w-2xl border-l-2 border-stone-200 pl-3 text-sm leading-relaxed text-stone-600">
          {probsLatePublishedAt
            ? pt
              ? `O modelo só publicou as probabilidades da jornada ${matchday} a ${formatLongDate(probsLatePublishedAt, locale)}, depois do início deste jogo; por isso não as mostramos como previsão.`
              : `The model only published matchday ${matchday}'s probabilities on ${formatLongDate(probsLatePublishedAt, locale)}, after this match had kicked off, so we do not show them as a forecast.`
            : pt
              ? "Não há probabilidades do modelo publicadas antes deste jogo."
              : "No model probabilities were published before this match."}
        </p>
      )}

      {!hasProbs && !played && (
        <p className="text-sm text-stone-500 border-l-2 border-stone-200 pl-3">
          {labels.noProbs}
        </p>
      )}

      {hasProbs && (
        <>
          {/* Three big numbers */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3">
            {outcomes.map(o => {
              const isHappened = happened === o.key;
              const dimmed = happened != null && !isHappened;
              return (
                <div
                  key={o.key}
                  className="border-t-4 pt-3"
                  // The outcome that happened carries the ink rule; the other
                  // two are muted, never below AA (UXD3-03).
                  style={{ borderColor: isHappened ? "var(--color-ink)" : dimmed ? "var(--color-line)" : o.rule }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 break-words">
                    <i aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm border border-line align-[-1px]" style={{ backgroundColor: o.tone }} />
                    {o.label}
                  </div>
                  <div className={`text-3xl md:text-6xl font-display font-extrabold tabular-nums leading-none ${dimmed ? "text-stone-500" : "text-stone-900"}`}>
                    {pct(o.p, locale)}
                    <span className="text-lg md:text-2xl font-bold text-stone-500">%</span>
                  </div>
                  {isHappened ? (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-ink px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-paper">
                      <Check aria-hidden="true" className="h-3 w-3" />
                      {pt ? "Aconteceu" : "Happened"}
                    </div>
                  ) : (
                    o.venue && <div className="text-[11px] text-stone-500 mt-1">{o.venue}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Split bar */}
          {/* The bar repeats the three numbers above; it carries no text, so
              no number ever sits in white on a club colour (audit S-H6). */}
          <div aria-hidden="true" className="flex h-4 w-full gap-[2px] overflow-hidden rounded-[4px]">
            {outcomes.map(o => (
              <div key={o.key} style={{ width: `${o.p * 100}%`, backgroundColor: o.tone }} />
            ))}
          </div>

          {happenedSentence ? (
            // One dated sentence on a played page, in place of the
            // favourite and its caveat (UXD3-03).
            <p className="mt-3 text-sm text-stone-700">{happenedSentence}</p>
          ) : top && (
            <div className="mt-3 text-sm text-stone-500">
              {labels.favourite}:{" "}
              <strong className="text-stone-800">
                {top.team ? teamDisplayName(top.team) : labels.draw}
              </strong>{" "}
              ({formatPercent(top.p, locale)})
            </div>
          )}

          {/* "Porto 42% is a favourite among three outcomes, not more likely
              to win than not" (diagnosis §5/12 "Match page"). Only needed
              when the top outcome is a plurality, not an outright majority. */}
          {!happened && top && top.p < 0.5 && (
            <p className="mt-1.5 text-xs text-stone-500 leading-relaxed max-w-xl">
              {labels.notMajority(top.team ? teamDisplayName(top.team) : labels.draw, top.p)}
            </p>
          )}

          {/* A postponed game is scored, in the game and in its record, on
              the odds frozen when its round opened (audit VFA-M2). */}
          {frozenProbs && !played && (
            <p className="mt-3 max-w-2xl border-l-2 border-line pl-3 text-xs leading-relaxed text-stone-600">
              {pt
                ? `No Contra o Modelo e no registo do jogo contam as probabilidades congeladas a ${formatLongDate(frozenProbs.publishedAt, locale, { year: false })}, quando a jornada ${matchday} abriu: ${teamDisplayName(home)} ${formatPercent(frozenProbs.p_home, locale)}, empate ${formatPercent(frozenProbs.p_draw, locale)}, ${teamDisplayName(away)} ${formatPercent(frozenProbs.p_away, locale)}.`
                : `Beat the Model and the match record use the probabilities frozen on ${formatLongDate(frozenProbs.publishedAt, locale, { year: false })}, when matchday ${matchday} opened: ${teamDisplayName(home)} ${formatPercent(frozenProbs.p_home, locale)}, draw ${formatPercent(frozenProbs.p_draw, locale)}, ${teamDisplayName(away)} ${formatPercent(frozenProbs.p_away, locale)}.`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
