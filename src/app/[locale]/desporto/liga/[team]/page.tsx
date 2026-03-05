import { loadLigaData, loadLigaHistorical } from "@/lib/utils/football-data-loader";
import {
  ligaTeamColors,
  ligaTeamSlugs,
  ligaSlugToTeam,
  teamLogoSrc,
} from "@/lib/config/football";
import { Header } from "@/components/Header";
import { NarrativeScenarios } from "@/components/charts/football/NarrativeScenarios";
import { DecisiveMatches } from "@/components/charts/football/DecisiveMatches";
import { TeamTimeline } from "@/components/charts/football/TeamTimeline";
import { RemainingSchedule } from "@/components/charts/football/RemainingSchedule";
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
    title: t("football.teamPageTitle", { team: teamName }),
    description: t("football.teamPageDescription", {
      team: teamName,
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
              {teamName}
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
            </div>
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
                inThisScenario: t("football.inThisScenario"),
                normally: t("football.normally"),
              }}
            />
          </div>
        </section>
      )}

      {/* Remaining schedule */}
      {remainingMatches && remainingMatches.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
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
