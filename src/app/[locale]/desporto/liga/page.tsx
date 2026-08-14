import {
  loadLigaWithDeltas,
  loadLigaHistorical,
  loadLigaSamples,
  loadUpcomingFixtures,
} from "@/lib/utils/football-data-loader";
import { ligaTeamColors, teamLogoSrc } from "@/lib/config/football";
import { Header } from "@/components/Header";
import { LeagueTable } from "@/components/charts/football/LeagueTable";
import type { PointsInterval } from "@/components/charts/football/LeagueTable";
import { MatchdayPredictions } from "@/components/charts/football/MatchdayPredictions";
import { TitleRaceChart } from "@/components/charts/football/TitleRaceChart";
import { RelegationChart } from "@/components/charts/football/RelegationChart";
import { TeamStrengthRatings } from "@/components/charts/football/TeamStrengthRatings";
import { LuckIndex } from "@/components/charts/football/LuckIndex";
import type { LuckEntry } from "@/components/charts/football/LuckIndex";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ligaTeamSlugs } from "@/lib/config/football";
import {
  Trophy,
  ArrowRight,
  SlidersHorizontal,
  Scale,
  History,
  Layers,
  Users,
  Gamepad2,
} from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("meta.ligaTitle"),
    description: t("meta.ligaDescription"),
    openGraph: {
      title: t("meta.ligaTitle"),
      description: t("meta.ligaDescription"),
      type: "website",
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/desporto/liga`,
    },
  };
}

export default async function LigaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // seasonSamples stays for the table's final-points intervals; the
  // draw-a-season widget that also read it was cut in the 2026-08 trim.
  const [{ prediction, scenarios, deltas }, historical, seasonSamples, upcomingFixtures] =
    await Promise.all([
      loadLigaWithDeltas(),
      loadLigaHistorical(),
      loadLigaSamples(),
      loadUpcomingFixtures(),
    ]);

  // Fixture row → match page. Rows without a generated page stay unlinked.
  const matchHrefs: Record<string, string> = Object.fromEntries(
    upcomingFixtures.map(f => [
      `${f.home}|${f.away}`,
      `/desporto/liga/jogo/${f.slug}`,
    ]),
  );

  // Fixtures with published 1X2, for the in-progress-matchday list
  const upcomingWithProbs = upcomingFixtures
    .filter(f => f.p_home != null && f.p_draw != null && f.p_away != null)
    .map(f => ({
      home: f.home,
      away: f.away,
      p_home: f.p_home as number,
      p_draw: f.p_draw as number,
      p_away: f.p_away as number,
    }));

  if (!prediction) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-stone-500">
          <p>Liga Portugal data not available.</p>
        </div>
      </div>
    );
  }

  // Final-points intervals for the league table. samples.json carries the
  // quantiles index-aligned with its own teams array; a feed without the
  // quartiles simply leaves the table as it was.
  const pointsIntervals: Record<string, PointsInterval> = {};
  if (
    seasonSamples?.teams &&
    seasonSamples.points_q25 &&
    seasonSamples.points_q75
  ) {
    seasonSamples.teams.forEach((team, i) => {
      const q05 = seasonSamples.points_q05?.[i];
      const q25 = seasonSamples.points_q25?.[i];
      const q50 = seasonSamples.points_q50?.[i];
      const q75 = seasonSamples.points_q75?.[i];
      const q95 = seasonSamples.points_q95?.[i];
      if (
        q05 == null || q25 == null || q50 == null || q75 == null || q95 == null
      ) {
        return;
      }
      pointsIntervals[team] = { q05, q25, q50, q75, q95 };
    });
  }

  const leader = prediction.table[0];
  const second = prediction.table[1];
  const third = prediction.table[2];
  const matchdayComplete = !prediction.matches_remaining?.length;
  const updatedDate = new Date(prediction.timestamp).toLocaleDateString(
    locale === "pt" ? "pt-PT" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero section */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t("football.title")} — {t("football.season")} {prediction.season}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {t("football.subtitle")}
          </h1>
          <p className="text-stone-400 text-sm">
            {t("football.matchday")} {prediction.matchday} · {t("football.updated")} {updatedDate}
          </p>
        </div>
      </section>

      {/* Key stats — top 3 championship probabilities */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-4">
            {t("football.championshipProbability")}
          </div>
          <div className="grid grid-cols-3 gap-6 md:gap-8">
            {[leader, second, third].map((team) => {
              const teamColor = ligaTeamColors[team.team] || "#78716c";
              const teamSlug = ligaTeamSlugs[team.team];
              const delta = deltas?.[team.team]?.p_champion_delta;
              const showDelta = delta !== undefined && Math.abs(delta) >= 1;
              return (
                <div key={team.team} className="border-t-2 pt-3" style={{ borderColor: teamColor }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {teamLogoSrc(team.team) && (
                      <img src={teamLogoSrc(team.team)} alt="" className="w-4 h-4 object-contain" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {team.team}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl md:text-5xl font-black tabular-nums text-stone-900">
                      {Math.round(team.p_champion * 100)}
                      <span className="text-xl md:text-2xl font-bold text-stone-400">%</span>
                    </div>
                    {showDelta && (
                      <span className={`text-sm font-semibold tabular-nums ${delta! > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {delta! > 0 ? "\u25B2" : "\u25BC"}{Math.abs(Math.round(delta!))}
                      </span>
                    )}
                  </div>
                  {teamSlug && (
                    <Link
                      href={`/desporto/liga/${teamSlug}`}
                      locale={locale}
                      className="text-xs text-stone-400 hover:text-blue-700 inline-flex items-center gap-1 mt-2 transition-colors"
                    >
                      {t("football.viewScenarios")}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MatchdayLive section removed — deltas shown inline on cards + table */}

      {/* League Table */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            {t("football.predictedStandings")}
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            {t("football.standingsDescription", {
              count: prediction.n_sims.toLocaleString(),
            })}
          </p>
          <LeagueTable
            data={prediction.table}
            actualStandings={prediction.actual_standings}
            deltas={prediction.matchday_results?.length ? deltas : undefined}
            intervals={
              Object.keys(pointsIntervals).length ? pointsIntervals : undefined
            }
            labels={{
              team: t("football.team"),
              meanPoints: t("football.meanPoints"),
              goalDifference: t("football.goalDifference"),
              championship: t("football.championship"),
              top3: t("football.top3"),
              relegation: t("football.relegation"),
              teamClickHint: t("football.teamClickHint"),
              played: t("football.played"),
              actualPoints: t("football.actualPoints"),
            }}
          />

          {/* xPts — expected points from match-level xG */}
          {prediction.xpts_table && prediction.xpts_table.length > 0 && prediction.actual_standings && (() => {
            const actualMap = new Map(prediction.actual_standings!.map(s => [s.team, s]));
            const luckEntries: LuckEntry[] = prediction.xpts_table!
              .map(xp => {
                const actual = actualMap.get(xp.team);
                if (!actual) return null;
                return {
                  team: xp.team,
                  actualPts: actual.points,
                  expectedPts: xp.xpts,
                  delta: actual.points - xp.xpts,
                };
              })
              .filter((e): e is LuckEntry => e !== null)
              .sort((a, b) => b.delta - a.delta);
            if (luckEntries.length === 0) return null;
            return (
              <div className="mt-10">
                <h3 className="text-base font-bold text-stone-900 mb-1">
                  {t("football.luckIndex")}
                </h3>
                <p className="text-sm text-stone-500 mb-4">
                  {t("football.luckIndexDescription")}
                </p>
                <LuckIndex
                  entries={luckEntries}
                  locale={locale}
                  labels={{
                    overperforming: t("football.overperforming"),
                    underperforming: t("football.underperforming"),
                    pointsShort: t("football.luckRealPtsShort"),
                    expectedShort: t("football.luckExpectedShort"),
                  }}
                />
                <p className="text-[10px] text-stone-400 mt-2 text-right">
                  {t("football.xgAttribution")}
                </p>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Simulator CTA — only when current matchday is complete */}
      {matchdayComplete && scenarios?.next_matchday_scenarios && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Link
              href="/desporto/liga/simulador"
              locale={locale}
              className="block border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors p-4 md:p-5 group"
            >
              <div className="flex items-start gap-3">
                <SlidersHorizontal className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-bold text-stone-900">
                      {t("football.simulator")}
                    </h3>
                    <span className="text-xs text-stone-400">
                      {t("football.matchday")} {prediction.next_matchday.matchday}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {t("football.simulatorCta")}
                  </p>
                </div>
                <span className="text-sm font-medium text-stone-500 group-hover:text-stone-900 inline-flex items-center gap-1 flex-shrink-0 mt-0.5 transition-colors">
                  {t("football.trySimulator")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Contra o Modelo — the season-long game. Before the 2026-08 trim
          this page never linked it at all. */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/desporto/liga/jogo-previsoes"
            locale={locale}
            className="block border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <Gamepad2 className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900">
                  {locale === "en" ? "Beat the model" : "Contra o Modelo"}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {locale === "en"
                    ? "Call the next matchday before it kicks off and get scored against the model, all season long."
                    : "Preveja a próxima jornada antes de começar e compare-se com o modelo, época inteira."}
                </p>
              </div>
              <span className="text-sm font-medium text-stone-500 group-hover:text-stone-900 inline-flex items-center gap-1 flex-shrink-0 mt-0.5 transition-colors">
                {locale === "en" ? "Play" : "Jogar"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Title Race */}
      {historical.length > 1 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.titleRace")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.titleRaceDescription")}
            </p>
            <TitleRaceChart historical={historical} yAxisLabel={t("football.championPercent")} />
          </div>
        </section>
      )}

      {/* Fixtures still to play — shown while the matchday is in progress, so
          there is always a way into the match pages */}
      {!matchdayComplete && upcomingWithProbs.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {locale === "en" ? "Fixtures to come" : "Jogos por disputar"}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {locale === "en"
                ? "What is left of this matchday, then the next one. Open a fixture for the full preview."
                : "O que falta desta jornada e a jornada seguinte. Abra um jogo para a análise completa."}
            </p>
            <MatchdayPredictions
              matches={upcomingWithProbs}
              matchday={prediction.matchday}
              labels={{
                home: t("football.home"),
                draw: t("football.draw"),
                away: t("football.away"),
                titleImpact: t("football.titleImpact"),
                relegationImpact: t("football.relegationImpact"),
                matchPage: locale === "en" ? "Match preview" : "Análise do jogo",
              }}
              decisiveMatches={scenarios?.decisive_matches}
              matchHrefs={matchHrefs}
              locale={locale}
            />
          </div>
        </section>
      )}

      {/* Next Matchday — only when current matchday is complete */}
      {matchdayComplete && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.nextMatchday")} — {t("football.matchday")}{" "}
              {prediction.next_matchday.matchday}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.nextMatchdayDescription", {
                matchday: prediction.next_matchday.matchday,
              })}
            </p>
            <MatchdayPredictions
              matches={prediction.next_matchday.matches}
              matchday={prediction.next_matchday.matchday}
              labels={{
                home: t("football.home"),
                draw: t("football.draw"),
                away: t("football.away"),
                titleImpact: t("football.titleImpact"),
                relegationImpact: t("football.relegationImpact"),
                matchOfTheWeek: t("football.matchOfTheWeek"),
                matchPage: locale === "en" ? "Match preview" : "Análise do jogo",
              }}
              decisiveMatches={scenarios?.decisive_matches?.filter(
                (m) => m.matchday === prediction.next_matchday.matchday
              )}
              matchHrefs={matchHrefs}
              locale={locale}
            />
          </div>
        </section>
      )}

      {/* Relegation Battle */}
      {historical.length > 1 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.relegationBattle")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.relegationBattleDescription")}
            </p>
            <RelegationChart historical={historical} yAxisLabel={t("football.relegationPercent")} />
          </div>
        </section>
      )}

      {/* Team Strength Ratings */}
      {prediction.team_strengths && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.teamStrengths")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.teamStrengthsDescription")}
            </p>
            <TeamStrengthRatings
              strengths={prediction.team_strengths}
              labels={{
                attack: t("football.attack"),
                defense: t("football.defense"),
                worse: t("football.worse"),
                better: t("football.better"),
              }}
            />
          </div>
        </section>
      )}

      {/* Model Info */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold tracking-tight mb-3">
            {t("football.modelInfo")}
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
            {t("football.modelDescription", {
              count: prediction.n_sims.toLocaleString(),
            })}
          </p>

          {/* Model vs Market — evaluation against the closing line */}
          <Link
            href="/desporto/liga/modelo"
            locale={locale}
            className="mt-6 block border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900">
                  {locale === "en" ? "Model vs Market" : "Modelo vs Mercado"}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {locale === "en"
                    ? "We tested the model against Pinnacle's closing line over 504 matches and eight seasons. From matchday 14 it matches the market — the whole deficit is early season."
                    : "Testámos o modelo contra a linha de fecho da Pinnacle em 504 jogos e oito épocas. A partir da jornada 14 iguala o mercado — toda a desvantagem está no início da época."}
                </p>
              </div>
              <span className="text-sm font-medium text-stone-500 group-hover:text-stone-900 inline-flex items-center gap-1 flex-shrink-0 mt-0.5 transition-colors">
                {locale === "en" ? "See the scorecard" : "Ver a avaliação"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          {/* 2025-26 season review — the finished season, with xG hindsight */}
          <Link
            href="/desporto/liga/2025-26"
            locale={locale}
            className="mt-4 block border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <History className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900">
                  {locale === "en"
                    ? "The 2025-26 season, reviewed"
                    : "A época 2025-26 em revista"}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {locale === "en"
                    ? "Porto took the title on 88 points while Sporting scored 89 goals and finished second, and Benfica went unbeaten into third. What the xG says about who deserved it — and how our own forecasts held up."
                    : "O Porto foi campeão com 88 pontos, o Sporting marcou 89 golos e ficou em segundo, e o Benfica acabou invicto em terceiro. O que o xG diz sobre quem mereceu — e como se portaram as nossas previsões."}
                </p>
              </div>
              <span className="text-sm font-medium text-stone-500 group-hover:text-stone-900 inline-flex items-center gap-1 flex-shrink-0 mt-0.5 transition-colors">
                {locale === "en" ? "Read the review" : "Ver a revisão"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Players — the per-position ratings hub */}
          <Link
            href="/desporto/liga/jogadores"
            locale={locale}
            className="mt-4 block border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900">
                  {locale === "en" ? "The players, measured honestly" : "Os jogadores, medidos com honestidade"}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {locale === "en"
                    ? "Finishing, attacking contribution, contested possession, goalkeeping — one metric per dimension, each with its own scale and its own uncertainty, and no fake overall score."
                    : "Finalização, contribuição ofensiva, posse disputada, guarda-redes — uma métrica por dimensão, cada uma com a sua escala e a sua incerteza, sem nota global inventada."}
                </p>
              </div>
              <span className="text-sm font-medium text-stone-500 group-hover:text-stone-900 inline-flex items-center gap-1 flex-shrink-0 mt-0.5 transition-colors">
                {locale === "en" ? "See the players" : "Ver os jogadores"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Liga 2 — the second tier, on the lighter goals-only model */}
          <Link
            href="/desporto/liga2"
            locale={locale}
            className="mt-4 block border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900">
                  {locale === "en" ? "Liga 2 in probabilities" : "A Liga 2 em probabilidades"}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {locale === "en"
                    ? "Promotion and relegation probabilities for the second tier, from 1,836 matches over six seasons. A deliberately lighter model: goals only, no xG and no squad values."
                    : "Probabilidades de subida e de descida no segundo escalão, a partir de 1836 jogos em seis épocas. Um modelo assumidamente mais leve: só golos, sem xG nem valores de plantel."}
                </p>
              </div>
              <span className="text-sm font-medium text-stone-500 group-hover:text-stone-900 inline-flex items-center gap-1 flex-shrink-0 mt-0.5 transition-colors">
                {locale === "en" ? "See Liga 2" : "Ver a Liga 2"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/desporto/liga/metodologia"
              locale={locale}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {t("football.methodology")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/desporto/liga/dados"
              locale={locale}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {locale === "en" ? "Open forecast data" : "Dados abertos das previsões"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
