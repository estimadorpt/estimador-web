import { createPageMetadata } from '@/lib/metadata';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import {
  loadFixtureBySlug,
  loadLigaData,
  loadLigaHistorical,
  loadLigaInjuries,
  loadLigaPlayers,
  loadLigaPlayersDetail,
  loadPlayedFixtures,
  loadUpcomingFixtures,
  NO_FIXTURES_SLUG,
} from "@/lib/utils/football-data-loader";
import { teamColorOnPaper, teamDisplayName, ligaTeamSlugs } from "@/lib/config/football";
import { byKickoff } from "@/lib/football-fixtures";
import { MatchProbabilityHero } from "@/components/charts/football/MatchProbabilityHero";
import { MatchOutcomeImpact } from "@/components/charts/football/MatchOutcomeImpact";
import { MatchTeamCompare } from "@/components/charts/football/MatchTeamCompare";
import type { MatchTeamPanel } from "@/components/charts/football/MatchTeamCompare";
import { MatchSquadNews } from "@/components/charts/football/MatchSquadNews";
import type { MatchSquadSide } from "@/components/charts/football/MatchSquadNews";
import { formFor } from "@/lib/football-form";
import { currentAbsences } from "@/lib/football-injuries";
import { playerDataCutoffLabel } from "@/lib/utils/player-pages";
import { formatInteger, formatKickoffShort, formatLongDate, formatPercent, matchLabel } from "@/lib/football-format";
import { matchStartedLine } from "@/lib/football-status";
import { ClockSwitch } from "@/components/football/ClockSwitch";
import { setRequestLocale } from '@/i18n/request-locale';

/** A sentence's full stop, unless it already ends on one ("25 set."). */
function withStop(text: string): string {
  return text.endsWith(".") ? text : `${text}.`;
}

/* ------------------------------------------------------------- static params */

export async function generateStaticParams() {
  // The games to come, and this season's games already played: a match page
  // stays online after its round, with the result and the model's pre-match
  // odds, instead of disappearing the week it is played (audit SP-13).
  const [fixtures, played] = await Promise.all([loadUpcomingFixtures(), loadPlayedFixtures()]);
  const all = [...fixtures, ...played];
  // Static export rejects a dynamic route with zero params, so a placeholder
  // page stands in whenever the feed publishes no fixtures at all.
  if (all.length === 0) return [{ slug: NO_FIXTURES_SLUG }];
  return all.map(f => ({ slug: f.slug }));
}

/* ------------------------------------------------------------------ metadata */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const fixture = await loadFixtureBySlug(slug);
  if (!fixture) {
    const pt = locale !== "en";
    return {
      title: pt ? "Sem jogos publicados" : "No fixtures published",
      robots: { index: false, follow: true },
    };
  }

  const pt = locale !== "en";
  const home = teamDisplayName(fixture.home);
  const away = teamDisplayName(fixture.away);
  const hasProbs = fixture.p_home != null && fixture.p_draw != null && fixture.p_away != null;
  // A played game whose odds came out after kickoff has no forecast to
  // show, so its title promises only the result (audit SP2-04, FRESH-03).
  const title = fixture.played
    ? pt
      ? `${matchLabel(home, away)}, ${fixture.played.home_goals}–${fixture.played.away_goals}: resultado${hasProbs ? " e previsão" : ""}`
      : `${matchLabel(home, away)}, ${fixture.played.home_goals}–${fixture.played.away_goals}: result${hasProbs ? " and forecast" : ""}`
    : pt
      ? `${matchLabel(home, away)}: probabilidades e cenários`
      : `${matchLabel(home, away)}: probabilities and scenarios`;

  // The page's own percentage rule ("Marítimo 7,1%", not "7%"), audit FA2-09.
  const probLine = hasProbs
    ? pt
      ? `${home} ${formatPercent(fixture.p_home as number, locale)}, empate ${formatPercent(fixture.p_draw as number, locale)}, ${away} ${formatPercent(fixture.p_away as number, locale)}.`
      : `${home} ${formatPercent(fixture.p_home as number, locale)}, draw ${formatPercent(fixture.p_draw as number, locale)}, ${away} ${formatPercent(fixture.p_away as number, locale)}.`
    : "";

  const description = fixture.played
    ? pt
      ? `${matchLabel(home, away)}, jornada ${fixture.matchday} da Liga Portugal: ${fixture.played.home_goals}–${fixture.played.away_goals}. ${probLine ? `Antes do jogo, o modelo dava: ${probLine}` : ""}`.trim()
      : `${matchLabel(home, away)}, matchday ${fixture.matchday} of Liga Portugal: ${fixture.played.home_goals}–${fixture.played.away_goals}. ${probLine ? `Before the match the model gave: ${probLine}` : ""}`.trim()
    : pt
      ? `${matchLabel(home, away)}, jornada ${fixture.matchday} da Liga Portugal. Modelo: ${probLine} E o que muda com cada resultado.`.trim()
      : `${matchLabel(home, away)}, matchday ${fixture.matchday} of Liga Portugal. Model: ${probLine} And what each result changes.`.trim();

  return createPageMetadata({
    locale,
    path: `/desporto/liga/jogo/${slug}`,
    title: title,
    description: description,
  });
}


/* -------------------------------------------------------------------- page */

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const pt = locale !== "en";

  const [fixture, { prediction, scenarios }, historical, injuries, players, fixtures, playersDetail] =
    await Promise.all([
      loadFixtureBySlug(slug),
      loadLigaData(),
      loadLigaHistorical(),
      loadLigaInjuries(),
      loadLigaPlayers(),
      loadUpcomingFixtures(),
      loadLigaPlayersDetail(),
    ]);

  if (!fixture) {
    if (slug !== NO_FIXTURES_SLUG) notFound();
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
          <PageHero
            measure="wide"
            compact
            back={{ href: "/desporto/liga", label: "Liga Portugal", locale }}
            eyebrow="Liga Portugal"
            title={pt ? "Sem jogos publicados" : "No fixtures published"}
            lede={pt
              ? "Não há jogos publicados de momento. A previsão da época continua na página da Liga."
              : "There are no published fixtures right now. The season forecast is on the Liga page."}
          />
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  const { home, away } = fixture;
  // Club colours as drawn on paper (contrast-checked), for bars and swatches only.
  const homeColor = teamColorOnPaper(home);
  const awayColor = teamColorOnPaper(away);
  const isPlayed = !!fixture.played;

  const L = {
    back: pt ? "Liga Portugal" : "Liga Portugal",
    live: pt ? "Jornada em curso" : "Matchday in progress",
    otherMatches: pt ? "Outros jogos" : "Other fixtures",
    teamPage: pt ? "Página da equipa" : "Team page",
    noData: pt ? "Dados indisponíveis." : "Data not available.",
    method: (sims: string) =>
      pt
        ? `Probabilidades de um modelo bayesiano de Poisson bivariado, ajustado aos golos e aos remates à baliza das últimas quatro épocas da Primeira Liga e da Liga 2 (os jogos mais antigos pesam menos), com o valor de cada plantel como ponto de partida; ${sims} épocas simuladas.`
        : `Probabilities from a bivariate Poisson Bayesian model, fitted to goals and shots on target from the last four seasons of the Primeira Liga and Liga 2 (older games count for less), with each squad's value as the starting point; ${sims} simulated seasons.`,
    methodLink: pt ? "Como funciona o modelo" : "How the model works",
  };

  // Strength ranks across the league (attack high = better, defense low = better)
  const strengths = prediction?.team_strengths;
  const attackRank: Record<string, number> = {};
  const defenseRank: Record<string, number> = {};
  let totalTeams = 0;
  if (strengths) {
    const all = Object.entries(strengths);
    totalTeams = all.length;
    [...all]
      .sort(([, a], [, b]) => b.attack - a.attack)
      .forEach(([t], i) => (attackRank[t] = i + 1));
    [...all]
      .sort(([, a], [, b]) => a.defense - b.defense)
      .forEach(([t], i) => (defenseRank[t] = i + 1));
  }

  const panelFor = (team: string, venue: "H" | "A"): MatchTeamPanel => ({
    team,
    color: venue === "H" ? homeColor : awayColor,
    venue,
    standing: prediction?.actual_standings?.find(s => s.team === team),
    strength: strengths?.[team],
    attackRank: attackRank[team],
    defenseRank: defenseRank[team],
    totalTeams,
    xpts: prediction?.xpts_table?.find(x => x.team === team),
    form: formFor(team, historical, prediction),
  });

  // Absences only when the list is recent enough to be squad news for this
  // forecast; entries whose expected return has passed are dropped.
  const absences = currentAbsences(injuries, prediction?.timestamp);
  const injuriesFor = (team: string) =>
    absences.players
      .filter(p => p.team === team)
      .sort((a, b) => (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0));

  const playersFor = (team: string) =>
    (players?.players ?? [])
      .filter(p => p.team === team)
      .sort((a, b) => b.sar - a.sar)
      .slice(0, 4);

  const squadSide = (team: string, color: string): MatchSquadSide => ({
    team,
    color,
    injuries: injuriesFor(team),
    injurySummary: absences.teams.find(t => t.team === team),
    topPlayers: playersFor(team),
  });

  const unavailable = new Set(
    absences.players
      .filter(p => p.team === home || p.team === away)
      .map(p => p.player),
  );

  // The other games still to play, in kickoff order with their Lisbon
  // date and time (audit F-H4), not the feed's order.
  const otherFixtures = byKickoff(fixtures.filter(f => f.slug !== fixture.slug)).slice(0, 9);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="wide"
        compact
        back={{ href: "/desporto/liga", label: L.back, locale }}
        eyebrow={`Liga Portugal · ${pt ? "Jornada" : "Matchday"} ${fixture.matchday}${fixture.inProgressMatchday ? ` · ${L.live}` : ""}${fixture.postponed ? (pt ? " · jogo em atraso" : " · postponed") : ""}${isPlayed ? (pt ? " · jogo disputado" : " · played") : ""}`}
        title={matchLabel(teamDisplayName(home), teamDisplayName(away))}
        lede={isPlayed
          ? fixture.p_home != null
            ? pt
              ? "O resultado e o que o modelo dava antes do jogo. A previsão da época continua na página da Liga."
              : "The result and what the model gave before the match. The season forecast is on the Liga page."
            : pt
              ? "O resultado deste jogo. A previsão da época continua na página da Liga."
              : "This match's result. The season forecast is on the Liga page."
          : (
            // After kickoff the page stops previewing the game (audit FRESH-01).
            <ClockSwitch
              initial={pt
                ? "O que o modelo espera deste jogo e o que cada resultado muda para os dois clubes."
                : "What the model expects from this match, and what each result changes for both clubs."}
              steps={fixture.kickoffConfirmed && fixture.kickoff && prediction?.timestamp
                ? [{
                    at: fixture.kickoff,
                    value: pt
                      ? `${withStop(matchStartedLine(prediction.timestamp, locale))} O que o modelo dava antes do jogo e o que cada resultado mudava; a nova previsão sai depois da jornada.`
                      : `${withStop(matchStartedLine(prediction.timestamp, locale))} What the model gave before the match and what each result would change; the new forecast follows the matchday.`,
                  }]
                : []}
            />
          )}
      />

      {/* Probabilities */}
      <section className="border-b border-stone-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10"><div className="max-w-5xl">
          <MatchProbabilityHero
            home={home}
            away={away}
            homeColor={homeColor}
            awayColor={awayColor}
            pHome={fixture.p_home}
            pDraw={fixture.p_draw}
            pAway={fixture.p_away}
            matchday={fixture.matchday}
            kickoff={fixture.kickoff}
            kickoffConfirmed={fixture.kickoffConfirmed}
            locale={locale}
            played={fixture.played}
            probsPublishedAt={fixture.probsPublishedAt}
            probsLatePublishedAt={fixture.probsLatePublishedAt}
            probsFrozenDuringRound={fixture.probsFrozenDuringRound}
            forecastTimestamp={prediction?.timestamp ?? null}
          />
        </div></div>
      </section>

      {/* What each result would do — only before the match */}
      {!isPlayed && (
      <section className="border-b border-stone-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-5xl">
          <MatchOutcomeImpact
            home={home}
            away={away}
            homeColor={homeColor}
            awayColor={awayColor}
            locale={locale}
            scenario={fixture.scenario}
            baseline={scenarios?.next_matchday_scenarios?.baseline ?? null}
            homeStanding={prediction?.table?.find(t => t.team === home)}
            awayStanding={prediction?.table?.find(t => t.team === away)}
            decisive={fixture.decisive}
            kickoff={fixture.kickoffConfirmed ? fixture.kickoff : null}
            forecastTimestamp={prediction?.timestamp ?? null}
          />
        </div></div>
      </section>
      )}

      {/* Form, strength, xPts — today's, so only before the match */}
      {!isPlayed && (
      <section className="border-b border-stone-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-5xl">
          <MatchTeamCompare
            home={panelFor(home, "H")}
            away={panelFor(away, "A")}
            locale={locale}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {[home, away].map(team =>
              ligaTeamSlugs[team] ? (
                <Link
                  key={team}
                  href={`/desporto/liga/${ligaTeamSlugs[team]}`}
                  locale={locale}
                  className="text-xs font-medium text-ink underline underline-offset-4 inline-flex min-h-11 items-center gap-1"
                >
                  {L.teamPage}: {teamDisplayName(team)}
                  <ArrowRight aria-hidden="true" className="w-3 h-3" />
                </Link>
              ) : null,
            )}
          </div>
        </div></div>
      </section>
      )}

      {isPlayed && (
        <section className="border-b border-stone-200">
          <div className="mx-auto w-full max-w-7xl px-4 py-8"><div className="max-w-5xl flex flex-wrap gap-x-6 gap-y-2">
            {[home, away].map(team =>
              ligaTeamSlugs[team] ? (
                <Link
                  key={team}
                  href={`/desporto/liga/${ligaTeamSlugs[team]}`}
                  locale={locale}
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4"
                >
                  {pt ? `O que falta ao ${teamDisplayName(team)}` : `What ${teamDisplayName(team)} has left`}
                  <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                </Link>
              ) : null,
            )}
          </div></div>
        </section>
      )}

      {/* Squads */}
      {!isPlayed && (injuries || players) && (
        <section className="border-b border-stone-200">
          <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-5xl">
            <MatchSquadNews
              home={squadSide(home, homeColor)}
              away={squadSide(away, awayColor)}
              locale={locale}
              unavailable={unavailable}
              absencesStatus={absences.status}
              snapshotDate={absences.snapshotDate}
              sarCutoffLabel={playerDataCutoffLabel(
                playersDetail?.appearances_through,
                playersDetail?.generated_from?.seasons ?? players?.generated_from?.seasons ?? null,
                locale,
              )}
            />
          </div></div>
        </section>
      )}

      {/* Other fixtures */}
      {otherFixtures.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-5xl">
            <h2 className="text-2xl tracking-tight mb-1">{isPlayed ? (pt ? "Próximos jogos" : "Next fixtures") : L.otherMatches}</h2>
            <p className="mb-4 text-sm text-stone-500">{pt ? "Por ordem de início, hora de Lisboa." : "In kickoff order, Lisbon time."}</p>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {otherFixtures.map(f => {
                const when = formatKickoffShort(f.kickoff, locale, { confirmed: f.kickoffConfirmed });
                return (
                  <li key={f.slug}>
                    <Link
                      href={`/desporto/liga/jogo/${f.slug}`}
                      locale={locale}
                      className="block h-full rounded-2xl border border-line bg-cream px-3 py-2 transition-colors duration-150 hover:bg-parchment"
                    >
                      <span className="block text-[11px] font-semibold tabular-nums text-stone-500">
                        {when || (pt ? `Jornada ${f.matchday}` : `Matchday ${f.matchday}`)}
                      </span>
                      <span className="block text-sm font-medium text-ink">
                        {matchLabel(teamDisplayName(f.home), teamDisplayName(f.away))}
                      </span>
                      {f.p_home != null && f.p_draw != null && f.p_away != null && (
                        <span className="block text-[11px] tabular-nums text-stone-600">
                          {teamDisplayName(f.home)} {formatPercent(f.p_home, locale)} · {pt ? "empate" : "draw"} {formatPercent(f.p_draw, locale)} · {teamDisplayName(f.away)} {formatPercent(f.p_away, locale)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div></div>
        </section>
      )}

      {/* Method footnote */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-8"><div className="max-w-5xl text-xs text-stone-500">
          {L.method(formatInteger(prediction?.n_sims ?? 50000, locale))}{" "}
          <Link
            href="/desporto/liga/metodologia"
            locale={locale}
            className="text-ink underline underline-offset-4"
          >
            {L.methodLink}
          </Link>
          {/* On a played page the date belongs to the "Próximos jogos" list,
              not to the pre-match odds above (audit FA2-10). */}
          {prediction?.timestamp
            ? isPlayed
              ? ` · ${pt ? "Próximos jogos: previsão de" : "Next fixtures: forecast of"} ${formatLongDate(prediction.timestamp, locale)}`
              : ` · ${pt ? "previsão de" : "forecast of"} ${formatLongDate(prediction.timestamp, locale)}`
            : ""}
        </div></div>
      </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
