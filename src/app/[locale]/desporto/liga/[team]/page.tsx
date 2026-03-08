import { loadLigaData, loadLigaHistorical } from "@/lib/utils/football-data-loader";
import {
  ligaTeamColors,
  ligaTeamSlugs,
  ligaSlugToTeam,
  teamLogoSrc,
  teamDisplayName,
} from "@/lib/config/football";
import { Header } from "@/components/Header";
import { NarrativeScenarios } from "@/components/charts/football/NarrativeScenarios";
import { DecisiveMatches } from "@/components/charts/football/DecisiveMatches";
import { TeamTimeline } from "@/components/charts/football/TeamTimeline";
import { RemainingSchedule } from "@/components/charts/football/RemainingSchedule";
import { PathBuilder } from "@/components/charts/football/PathBuilder";
import { PositionDistribution } from "@/components/charts/football/PositionDistribution";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

function ordinal(n: number, locale: string): string {
  if (locale === "pt") return `${n}º`;
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

export function generateStaticParams() {
  return Object.values(ligaTeamSlugs).map((slug) => ({ team: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; team: string }>;
}): Promise<Metadata> {
  const { locale, team: slug } = await params;
  const teamName = ligaSlugToTeam[slug];
  if (!teamName) return {};

  const t = await getTranslations({ locale });
  const { prediction } = await loadLigaData();

  return {
    title: t("football.teamPageTitle", { team: teamDisplayName(teamName) }),
    description: t("football.teamPageDescription", {
      team: teamDisplayName(teamName),
      season: prediction?.season ?? "",
    }),
    alternates: {
      canonical: `https://estimador.pt/${locale}/desporto/liga/${slug}`,
    },
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ locale: string; team: string }>;
}) {
  const { locale, team: slug } = await params;
  const teamName = ligaSlugToTeam[slug];
  if (!teamName) notFound();

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
          <p>Data not available.</p>
        </div>
      </div>
    );
  }

  const teamColor = ligaTeamColors[teamName] || "#78716c";
  const standing = prediction.table.find((t) => t.team === teamName);
  const narrativeData = scenarios?.narrative_scenarios?.[teamName];
  const isSurvival = narrativeData?.target === "survival";

  // Determine team archetype: title contender, relegation candidate, or mid-table
  const pChampion = standing ? standing.p_champion * 100 : 0;
  const pRelegation = standing ? standing.p_relegation * 100 : 0;
  const isTitleContender = pChampion >= 1;
  const isRelegationCandidate = pRelegation >= 1;
  const isMidTable = !isTitleContender && !isRelegationCandidate;

  // Timeline data: show champion, relegation, or hide for mid-table
  let timelineData: { matchday: number; value: number; lo: number; hi: number }[] = [];
  let timelineLabel = "";
  let timelineTarget = "";

  if (isTitleContender) {
    timelineData = historical.map((md) => {
      const row = md.table.find((t) => t.team === teamName);
      if (!row) return null;
      return {
        matchday: md.matchday,
        value: row.p_champion * 100,
        lo: (row.p_champion_lo ?? row.p_champion) * 100,
        hi: (row.p_champion_hi ?? row.p_champion) * 100,
      };
    }).filter(Boolean) as typeof timelineData;
    timelineLabel = t("football.championPercent");
    timelineTarget = t("football.championship").toLowerCase();
  } else if (isRelegationCandidate) {
    timelineData = historical.map((md) => {
      const row = md.table.find((t) => t.team === teamName);
      if (!row) return null;
      return {
        matchday: md.matchday,
        value: row.p_relegation * 100,
        lo: (row.p_relegation_lo ?? row.p_relegation) * 100,
        hi: (row.p_relegation_hi ?? row.p_relegation) * 100,
      };
    }).filter(Boolean) as typeof timelineData;
    timelineLabel = t("football.relegationPercent");
    timelineTarget = t("football.relegation").toLowerCase();
  }
  // Mid-table: no timeline (flat line at 0% is useless)

  // Remaining schedule from critical paths
  const remainingMatches = scenarios?.critical_paths?.[teamName]?.matches;

  // Position distribution
  const positionProbs = prediction.position_probs?.[teamName];

  // Projected finish: modal position from position_probs
  let projectedPosition = 0;
  let projectedPositionProb = 0;
  if (positionProbs) {
    positionProbs.forEach((p, i) => {
      if (p > projectedPositionProb) {
        projectedPositionProb = p;
        projectedPosition = i + 1;
      }
    });
  }

  // Team strength KPI — convert to qualitative league rank
  const teamStrength = prediction.team_strengths?.[teamName];
  let attackRank = 0;
  let defenseRank = 0;
  let totalTeams = 0;
  if (prediction.team_strengths) {
    const allTeams = Object.entries(prediction.team_strengths);
    totalTeams = allTeams.length;
    const attackSorted = [...allTeams].sort(([, a], [, b]) => b.attack - a.attack);
    const defenseSorted = [...allTeams].sort(([, a], [, b]) => a.defense - b.defense); // lower = better
    attackRank = attackSorted.findIndex(([t]) => t === teamName) + 1;
    defenseRank = defenseSorted.findIndex(([t]) => t === teamName) + 1;
  }

  const actualStanding = prediction.actual_standings?.find(s => s.team === teamName);

  // Magic numbers: compute for this team
  const TOTAL_MATCHES = 34;
  let magicNumbers: { label: string; pointsNeeded: number; maxRemaining: number; clinched: boolean; eliminated: boolean }[] = [];
  if (actualStanding && prediction.actual_standings) {
    const allTeams = prediction.actual_standings.map(s => ({
      team: s.team,
      currentPoints: s.points,
      maxPossible: s.points + (TOTAL_MATCHES - s.played) * 3,
    }));
    const others = allTeams.filter(o => o.team !== teamName);
    const rivalsByMax = [...others].sort((a, b) => b.maxPossible - a.maxPossible);
    const teamsAbove = others.filter(o => o.currentPoints > (actualStanding.points + (TOTAL_MATCHES - actualStanding.played) * 3)).length;
    const maxRemaining = (TOTAL_MATCHES - actualStanding.played) * 3;
    const myPoints = actualStanding.points;

    const zones: { label: string; threatIdx: number; eliminatedThreshold: number }[] = [
      { label: "magicTitleRace", threatIdx: 0, eliminatedThreshold: 1 },
      { label: "magicChampionsLeague", threatIdx: 1, eliminatedThreshold: 2 },
      { label: "magicEuropaLeague", threatIdx: 2, eliminatedThreshold: 3 },
      { label: "magicSafety", threatIdx: 15, eliminatedThreshold: 16 },
    ];

    magicNumbers = zones
      .filter(z => rivalsByMax.length > z.threatIdx)
      .map(z => {
        const threat = rivalsByMax[z.threatIdx].maxPossible;
        const needed = threat + 1 - myPoints;
        return {
          label: z.label,
          pointsNeeded: needed,
          maxRemaining,
          clinched: needed <= 0,
          eliminated: teamsAbove >= z.eliminatedThreshold,
        };
      });
  }

  // Decisive matches: direct impact on this team
  const teamDecisiveMatches = scenarios?.decisive_matches?.filter((m) => {
    if (isSurvival) return m.most_affected_relegation_team === teamName;
    return m.most_affected_team === teamName;
  });

  // Featured matches: matches involving this team that affect OTHER teams' races (for mid-table)
  const hasDirectDecisive = teamDecisiveMatches && teamDecisiveMatches.length > 0;
  const teamFeaturedMatches = !hasDirectDecisive
    ? scenarios?.decisive_matches?.filter(
        (m) => m.home_team === teamName || m.away_team === teamName
      )
    : undefined;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section style={{ backgroundColor: teamColor }}>
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <Link
            href="/desporto/liga"
            locale={locale}
            className="text-white/60 hover:text-white/90 text-xs font-medium uppercase tracking-wider inline-flex items-center gap-1 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("football.backToLeague")}
          </Link>
          <div className="flex items-center gap-4 mb-2">
            {teamLogoSrc(teamName) && (
              <img
                src={teamLogoSrc(teamName)}
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg"
              />
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {teamDisplayName(teamName)}
            </h1>
          </div>
          <p className="text-white/60 text-sm">
            {t("football.season")} {prediction.season} ·{" "}
            {t("football.matchday")} {prediction.matchday}
          </p>
        </div>
      </section>

      {/* Key stats + season projection */}
      {standing && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-3 gap-6 md:gap-8">
              <div className="border-t-2 pt-3" style={{ borderColor: teamColor }}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  {t("football.championship")}
                </div>
                <div className="text-3xl md:text-4xl font-black tabular-nums text-stone-900">
                  {Math.round(pChampion)}
                  <span className="text-lg md:text-xl font-bold text-stone-400">%</span>
                </div>
              </div>
              <div className="border-t-2 border-stone-200 pt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  {t("football.top3")}
                </div>
                <div className="text-3xl md:text-4xl font-black tabular-nums text-stone-900">
                  {Math.round(standing.p_top3 * 100)}
                  <span className="text-lg md:text-xl font-bold text-stone-400">%</span>
                </div>
              </div>
              <div className="border-t-2 border-stone-200 pt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  {t("football.relegation")}
                </div>
                <div className="text-3xl md:text-4xl font-black tabular-nums text-stone-900">
                  {Math.round(pRelegation)}
                  <span className="text-lg md:text-xl font-bold text-stone-400">%</span>
                </div>
              </div>
            </div>
            {/* Season projection summary */}
            <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-500">
              <span>
                {t("football.expectedPoints")}:{" "}
                <strong className="text-stone-800">
                  {Math.round(standing.mean_pts)} ± {Math.round(standing.std_pts)}
                </strong>
              </span>
              {projectedPosition > 0 && (
                <span>
                  {t("football.projectedFinish")}:{" "}
                  <strong className="text-stone-800">
                    {ordinal(projectedPosition, locale)}{" "}
                    ({Math.round(projectedPositionProb * 100)}%)
                  </strong>
                </span>
              )}
              {teamStrength && totalTeams > 0 && (
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    {t("football.attack")}:
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${((totalTeams - attackRank + 1) / totalTeams) * 100}%`,
                            backgroundColor: teamColor,
                          }}
                        />
                      </span>
                      <strong className="text-stone-800 text-xs">{ordinal(attackRank, locale)}</strong>
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    {t("football.defense")}:
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${((totalTeams - defenseRank + 1) / totalTeams) * 100}%`,
                            backgroundColor: teamColor,
                          }}
                        />
                      </span>
                      <strong className="text-stone-800 text-xs">{ordinal(defenseRank, locale)}</strong>
                    </span>
                  </span>
                </span>
              )}
            </div>

            {/* Magic Numbers */}
            {magicNumbers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  {t("football.magicNumbers")}
                </div>
                <div className="text-[11px] text-stone-400 mb-2">
                  {t("football.magicNumbersDescription")}
                </div>
                <div className="flex flex-wrap gap-3">
                  {magicNumbers.map(mn => {
                    const impossible = mn.pointsNeeded > mn.maxRemaining;
                    return (
                      <div key={mn.label} className="bg-stone-50 border border-stone-200 px-3 py-2 min-w-[120px]">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                          {t(`football.${mn.label}`)}
                        </div>
                        {mn.clinched ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5">
                            {t("football.magicClinched")}
                          </span>
                        ) : mn.eliminated ? (
                          <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5">
                            {t("football.magicEliminated")}
                          </span>
                        ) : impossible ? (
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5">
                            {t("football.magicDependsOnOthers")}
                          </span>
                        ) : (
                          <div>
                            <span className="text-lg font-black tabular-nums" style={{ color: teamColor }}>
                              {mn.pointsNeeded}
                              <span className="text-xs text-stone-400 font-normal ml-0.5">
                                {t("football.magicPtsAbbr")}
                              </span>
                            </span>
                            <div className="text-[10px] text-stone-400 mt-0.5">
                              {t("football.magicNeedsOf", { needed: mn.pointsNeeded, available: mn.maxRemaining })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Position distribution */}
      {positionProbs && positionProbs.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.positionDistribution")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.positionDistributionDescription")}
            </p>
            <PositionDistribution
              probs={positionProbs}
              teamColor={teamColor}
              locale={locale}
            />
          </div>
        </section>
      )}

      {/* Probability timeline — only for title/relegation contenders */}
      {timelineData.length > 1 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.probabilityOverTime")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.probabilityOverTimeDescription", { target: timelineTarget })}
            </p>
            <TeamTimeline
              data={timelineData}
              teamColor={teamColor}
              yAxisLabel={timelineLabel}
            />
          </div>
        </section>
      )}

      {/* Narrative Scenarios */}
      {narrativeData && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {isSurvival
                ? t("football.survivalScenariosTitle")
                : t("football.scenariosTitle")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {isSurvival
                ? t("football.survivalScenariosDescription")
                : t("football.scenariosDescription")}
            </p>
            <NarrativeScenarios
              data={narrativeData}
              labels={{
                scenarioComfortable: t("football.scenarioComfortable"),
                scenarioRealistic: t("football.scenarioRealistic"),
                scenarioUnlikely: t("football.scenarioUnlikely"),
                ofChampionSims: t("football.ofChampionSims"),
                ofSurvivalSims: t("football.ofSurvivalSims"),
                thisWorksBecause: t("football.thisWorksBecause"),
                dropsPointsVs: t("football.dropsPointsVs"),
                resultWin: t("football.resultWin"),
                resultDraw: t("football.resultDraw"),
                resultLoss: t("football.resultLoss"),
                matchdayPrefix: t("football.matchdayPrefix"),
                home: t("football.homeAbbr"),
                away: t("football.awayAbbr"),
                winAbbr: t("football.winAbbr"),
                winAbbrPlural: t("football.winAbbrPlural"),
                drawAbbr: t("football.drawAbbr"),
                drawAbbrPlural: t("football.drawAbbrPlural"),
                lossAbbr: t("football.lossAbbr"),
                lossAbbrPlural: t("football.lossAbbrPlural"),
              }}
            />
          </div>
        </section>
      )}

      {/* Build Your Path / Remaining schedule */}
      {remainingMatches && remainingMatches.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            {scenarios?.critical_paths?.[teamName] ? (
              <>
                <h2 className="text-xl font-bold tracking-tight mb-1">
                  {t("football.buildYourPath")}
                </h2>
                <p className="text-sm text-stone-500 mb-6">
                  {t("football.buildYourPathDescription")}
                </p>
                <PathBuilder
                  matches={remainingMatches}
                  pCurrent={scenarios.critical_paths[teamName].p_current}
                  target={scenarios.critical_paths[teamName].target}
                  teamColor={teamColor}
                  pointsLookup={scenarios.points_lookup?.[teamName]?.lookup}
                  labels={{
                    matchdayAbbr: t("football.matchdayAbbr"),
                    win: t("football.win"),
                    draw: t("football.draw"),
                    loss: t("football.loss"),
                    home: t("football.homeAbbr"),
                    away: t("football.awayAbbr"),
                    resetAll: t("football.resetAll"),
                    pointsFromPicks: t("football.pointsFromPicks"),
                    expectedPoints: t("football.expectedPointsFromPicks"),
                    yourScenario: t("football.yourScenario"),
                    championship: t("football.championship"),
                    survival: t("football.survival"),
                  }}
                />
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold tracking-tight mb-1">
                  {t("football.remainingSchedule")}
                </h2>
                <p className="text-sm text-stone-500 mb-6">
                  {t("football.remainingScheduleDescription")}
                </p>
                <RemainingSchedule
                  matches={remainingMatches}
                  teamColor={teamColor}
                  labels={{
                    matchdayAbbr: t("football.matchdayAbbr"),
                    win: t("football.win"),
                    draw: t("football.draw"),
                    loss: t("football.loss"),
                    home: t("football.homeAbbr"),
                    away: t("football.awayAbbr"),
                  }}
                />
              </>
            )}
          </div>
        </section>
      )}

      {/* Decisive Matches — direct impact on this team */}
      {hasDirectDecisive && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.decisiveMatchesFor", { team: teamName })}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {isSurvival
                ? t("football.decisiveMatchesForDescriptionSurvival", { team: teamName })
                : t("football.decisiveMatchesForDescription", { team: teamName })}
            </p>
            <DecisiveMatches
              matches={teamDecisiveMatches!}
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
              maxItemsPerTeam={10}
            />
          </div>
        </section>
      )}

      {/* Featured Matches — for mid-table teams, show how their results affect the race */}
      {teamFeaturedMatches && teamFeaturedMatches.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("football.featuredMatchesFor", { team: teamName })}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.featuredMatchesForDescription", { team: teamName })}
            </p>
            <DecisiveMatches
              matches={teamFeaturedMatches}
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
              maxItemsPerTeam={10}
            />
          </div>
        </section>
      )}

    </div>
  );
}
