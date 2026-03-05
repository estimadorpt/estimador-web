import { loadLigaData, loadLigaHistorical } from "@/lib/utils/football-data-loader";
import { ligaTeamColors, teamLogoSrc } from "@/lib/config/football";
import { Header } from "@/components/Header";
import { LeagueTable } from "@/components/charts/football/LeagueTable";
import { MatchdayPredictions } from "@/components/charts/football/MatchdayPredictions";
import { TitleRaceChart } from "@/components/charts/football/TitleRaceChart";
import { RelegationChart } from "@/components/charts/football/RelegationChart";
import { PositionHeatmap } from "@/components/charts/football/PositionHeatmap";
import { DecisiveMatches } from "@/components/charts/football/DecisiveMatches";
import { PathsToVictory } from "@/components/charts/football/PathsToVictory";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ligaTeamSlugs } from "@/lib/config/football";
import { Trophy, ArrowRight } from "lucide-react";
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

  const [{ prediction, scenarios }, historical] = await Promise.all([
    loadLigaData(),
    loadLigaHistorical(),
  ]);

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

  const leader = prediction.table[0];
  const second = prediction.table[1];
  const third = prediction.table[2];
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
                  <div className="text-4xl md:text-5xl font-black tabular-nums text-stone-900">
                    {Math.round(team.p_champion * 100)}
                    <span className="text-xl md:text-2xl font-bold text-stone-400">%</span>
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
            labels={{
              team: t("football.team"),
              meanPoints: t("football.meanPoints"),
              goalDifference: t("football.goalDifference"),
              championship: t("football.championship"),
              top3: t("football.top3"),
              relegation: t("football.relegation"),
            }}
          />
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

      {/* Next Matchday */}
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
            }}
            decisiveMatches={scenarios?.decisive_matches?.filter(
              (m) => m.matchday === prediction.next_matchday.matchday
            )}
          />
        </div>
      </section>

      {/* Paths to Victory */}
      {scenarios?.victory_paths && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.pathsToVictory")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.pathsToVictoryDescription")}
            </p>
            <PathsToVictory
              paths={scenarios.victory_paths}
              labels={{
                freqFrame: t("football.pathFreqFrame"),
                subtitleOwn: t("football.pathSubtitleOwn"),
                subtitleHelp: t("football.pathSubtitleHelp"),
                subtitleMiracle: t("football.pathSubtitleMiracle"),
                gateKeepWinning: t("football.pathGateKeepWinning"),
                gateKeepWinningDetail: t("football.pathGateKeepWinningDetail"),
                gateWinKeyMatches: t("football.pathGateWinKeyMatches"),
                gateWinEverything: t("football.pathGateWinEverything"),
                gateMustStumble: t("football.pathGateMustStumble"),
                and: t("football.pathAnd"),
              }}
            />
          </div>
        </section>
      )}

      {/* Survival Paths */}
      {scenarios?.survival_paths && (() => {
        // Only show teams with meaningful survival analysis
        // Filter out teams where the model finds no decisive matches (uplift too low)
        const atRiskPaths = Object.fromEntries(
          Object.entries(scenarios.survival_paths).filter(
            ([, p]) => {
              if (p.p_current <= 0.20) return true; // Always show danger teams
              const mustWins = (p.funnel || []).filter(s => s.win_uplift >= 0.20).length;
              if (mustWins >= 4) return true; // Must win everything
              const keyMatches = (p.funnel || []).filter(s => s.win_uplift >= 0.04).length;
              return keyMatches > 0; // Has decisive matches
            }
          )
        );
        if (Object.keys(atRiskPaths).length === 0) return null;
        return (
          <section className="border-b border-stone-200">
            <div className="max-w-7xl mx-auto px-4 py-10">
              <h2 className="text-xl font-bold tracking-tight mb-1">
                {t("football.survivalSection")}
              </h2>
              <p className="text-sm text-stone-500 mb-6">
                {t("football.survivalPathsDescription")}
              </p>
              <PathsToVictory
                paths={atRiskPaths}
                labels={{
                  freqFrame: t("football.survivalFreqFrame"),
                  subtitleOwn: t("football.survivalSubtitleSafe"),
                  subtitleHelp: t("football.survivalSubtitleRisk"),
                  subtitleMiracle: t("football.survivalSubtitleDanger"),
                  gateKeepWinning: t("football.pathGateKeepWinning"),
                  gateKeepWinningDetail: t("football.survivalGateDetail"),
                  gateWinKeyMatches: t("football.pathGateWinKeyMatches"),
                  gateWinEverything: t("football.pathGateWinEverything"),
                  gateMustStumble: t("football.pathGateMustStumble"),
                  and: t("football.pathAnd"),
                }}
              />
            </div>
          </section>
        );
      })()}

      {/* Season Outlook — all remaining decisive matches */}
      {scenarios && scenarios.decisive_matches.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.seasonOutlook")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.seasonOutlookDescription")}
            </p>
            <DecisiveMatches
              matches={scenarios.decisive_matches}
              labels={{
                matchday: t("football.matchday"),
                championProb: t("football.championProb"),
                baseline: t("football.baseline"),
                draw: t("football.draw"),
                ifWins: t("football.ifWinsTemplate"),
                ifWin: t("football.ifWin"),
                ifLose: t("football.ifLose"),
                current: t("football.current"),
                relegationProb: t("football.relegationProb"),
                titleRaceSection: t("football.titleRaceSection"),
                relegationSection: t("football.relegationSection"),
              }}
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

      {/* Position Heatmap */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            {t("football.positionProbabilities")}
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            {t("football.positionProbabilitiesDescription")}
          </p>
          <PositionHeatmap
            positionProbs={prediction.position_probs}
            table={prediction.table}
            labels={{
              team: t("football.team"),
              position: t("football.position"),
            }}
          />
        </div>
      </section>

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
          <div className="mt-4">
            <Link
              href="/desporto/liga/metodologia"
              locale={locale}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {t("football.methodology")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
