import { createPageMetadata } from '@/lib/metadata';
import { loadLigaData, loadLigaHistorical, loadLigaSamples, loadUpcomingFixtures } from "@/lib/utils/football-data-loader";
import {
  ligaTeamSlugs,
  ligaSlugToTeam,
  teamColorOnPaper,
  teamLogoSrc,
  teamDisplayName,
} from "@/lib/config/football";
import { Link } from "@/i18n/routing";
import { DataCard } from "@/components/viz/DataCard";
import { ClubFixtures, clubFixtureRows } from "@/components/football/ClubFixtures";
import { titleDecisive, relegationDecisive } from "@/components/charts/football/DecisiveMatches";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { NarrativeScenarios } from "@/components/charts/football/NarrativeScenarios";
import { DecisiveMatches, type DecisiveRace } from "@/components/charts/football/DecisiveMatches";
import { TeamTimeline } from "@/components/charts/football/TeamTimeline";
import { RemainingSchedule } from "@/components/charts/football/RemainingSchedule";
import { PathBuilder } from "@/components/charts/football/PathBuilder";
import { PositionDistribution } from "@/components/charts/football/PositionDistribution";
import { getTranslations } from "next-intl/server";
import { formatInteger, formatLongDate, formatPercent } from "@/lib/football-format";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildClubOutlooks, positionSpread } from "@/components/football/club-outlook";
import { loadGameFixtures } from "@/components/football/load-game-fixtures";
import { FixtureStakes } from "@/components/football/FixtureStakes";
import { setRequestLocale } from '@/i18n/request-locale';

function ordinal(n: number, locale: string): string {
  if (locale === "pt") return `${n}.º`;
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

// Any other slug is a 404, in development as in the export.
export const dynamicParams = false;

// Only the clubs in the current forecast table get a page. ligaTeamSlugs
// stays whole (logos and the 2025-26 archive use it), but a club that left
// the league would otherwise get an indexed page with nothing on it, and
// notFound() cannot remove a URL from a static export.
export async function generateStaticParams() {
  const { prediction } = await loadLigaData();
  const slugs = (prediction?.table ?? [])
    .map((row) => ligaTeamSlugs[row.team])
    .filter((slug): slug is string => Boolean(slug));
  // Static export rejects a dynamic route with no params; without a forecast
  // every current-season club still resolves to its fallback page.
  return (slugs.length ? slugs : Object.values(ligaTeamSlugs)).map((slug) => ({ team: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; team: string }>;
}): Promise<Metadata> {
  const { locale, team: slug } = await params;
  setRequestLocale(locale);
  const teamName = ligaSlugToTeam[slug];
  if (!teamName) return {};

  const t = await getTranslations({ locale });
  const { prediction } = await loadLigaData();

  return createPageMetadata({
    locale,
    path: `/desporto/liga/${slug}`,
    title: t("football.teamPageTitle", { team: teamDisplayName(teamName) }),
    description: t("football.teamPageDescription", {
      team: teamDisplayName(teamName),
      season: prediction?.season ?? "",
    }),
  });
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ locale: string; team: string }>;
}) {
  const { locale, team: slug } = await params;
  setRequestLocale(locale);
  const teamName = ligaSlugToTeam[slug];
  if (!teamName) notFound();

  const t = await getTranslations({ locale });
  const [{ prediction, scenarios }, historical, gameFixtures, samples, upcomingFixtures] = await Promise.all([
    loadLigaData(),
    loadLigaHistorical(),
    loadGameFixtures(),
    loadLigaSamples(),
    loadUpcomingFixtures(),
  ]);

  if (!prediction) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
          <PageHero
            compact
            back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
            eyebrow="Liga Portugal"
            title={teamDisplayName(teamName)}
            lede={locale === "pt"
              ? "A previsão da Liga não está disponível de momento."
              : "The Liga forecast is not available right now."}
          />
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  // The club colour as drawn on paper: contrast-checked, never used for text.
  const teamColor = teamColorOnPaper(teamName);
  const standing = prediction.table.find((t) => t.team === teamName);
  const narrativeData = scenarios?.narrative_scenarios?.[teamName];
  const isSurvival = narrativeData?.target === "survival";

  // Determine team archetype: title contender, relegation candidate, or mid-table
  const pChampion = standing ? standing.p_champion * 100 : 0;
  const pRelegation = standing ? standing.p_relegation * 100 : 0;
  const isTitleContender = pChampion >= 1;
  const isRelegationCandidate = pRelegation >= 1;

  const forecastDate = formatLongDate(prediction.timestamp, locale);

  // Which of the three fixed cards (title / top 3 / relegation) carry
  // information worth their own card — below 1% they fold into one line
  // instead of three confident-looking 0% headlines (diagnosis §5).
  const metricCards = [
    { key: "championship", label: t("football.championship"), value: pChampion },
    { key: "top3", label: t("football.top3"), value: standing ? standing.p_top3 * 100 : 0 },
    { key: "relegation", label: t("football.relegation"), value: pRelegation },
  ];
  const shownMetrics = standing ? metricCards.filter((m) => m.value >= 1) : [];
  const foldedMetrics = standing ? metricCards.filter((m) => m.value < 1) : [];

  // This club's own supported fixture and three-outcome stakes, from the
  // same helper the homepage module uses (diagnosis §5's "a stronger answer
  // format exists in the product and should be promoted/reused").
  const clubOutlook = buildClubOutlooks(locale === "pt" ? "pt" : "en", prediction, scenarios, gameFixtures)
    .find((entry) => entry.team === teamName) ?? null;

  // Timeline: the club's own race — the title, else the top three when it is
  // a real prospect (Sp. Braga at 8%, audit F14), else relegation. No band:
  // the published lo/hi fields are not the uncertainty of the probability
  // (audit F-H1, owner decision). A mid-table club with nothing above 1% has
  // no line worth drawing.
  const pTop3 = standing ? standing.p_top3 * 100 : 0;
  const timelineMetric: "p_champion" | "p_top3" | "p_relegation" | null = isTitleContender
    ? "p_champion"
    : pTop3 >= 1
      ? "p_top3"
      : isRelegationCandidate
        ? "p_relegation"
        : null;
  const timelineData = timelineMetric
    ? historical.flatMap((md) => {
        const row = md.table.find((t) => t.team === teamName);
        return row ? [{ matchday: md.matchday, value: row[timelineMetric] * 100 }] : [];
      })
    : [];
  const timelineLabel = timelineMetric === "p_champion"
    ? t("football.championPercent")
    : timelineMetric === "p_top3"
      ? (locale === "pt" ? "Top 3 (%)" : "Top 3 (%)")
      : t("football.relegationPercent");
  const timelineTarget = timelineMetric === "p_champion"
    ? (locale === "pt" ? "ser campeão" : "winning the title")
    : timelineMetric === "p_top3"
      ? (locale === "pt" ? "acabar nos três primeiros" : "finishing in the top three")
      : (locale === "pt" ? "despromoção" : "relegation");

  // Remaining schedule from critical paths
  const remainingMatches = scenarios?.critical_paths?.[teamName]?.matches;

  // Position distribution
  const positionProbs = prediction.position_probs?.[teamName];
  const spread = positionProbs ? positionSpread(positionProbs) : null;

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

  // Final points as the same 90% range the league table shows (q05–q95 of
  // the simulated seasons), not "77 ± 6", a standard deviation the hub
  // never uses (audit pro-PP-14, pub-PP-22).
  const sampleIndex = samples?.teams?.indexOf(teamName) ?? -1;
  const pointsRange =
    sampleIndex >= 0 && samples?.points_q05?.[sampleIndex] != null && samples?.points_q95?.[sampleIndex] != null
      ? { lo: samples.points_q05[sampleIndex], hi: samples.points_q95[sampleIndex], median: samples.points_q50?.[sampleIndex] ?? null }
      : null;

  // Remaining games from the fixture manifest, postponed ones included, for
  // a club without a scenario builder (audit F14). The next round's games
  // carry the model's 1X2 from the club's side and a match page.
  const nextRoundByKey = new Map(upcomingFixtures.map((f) => [`${f.matchday}|${f.home}|${f.away}`, f]));
  const fixtureRows = clubFixtureRows(teamName, gameFixtures, prediction.next_matchday?.matchday ?? prediction.matchday + 1).map((row) => {
    const home = row.venue === "H" ? teamName : row.opponent;
    const away = row.venue === "H" ? row.opponent : teamName;
    const f = nextRoundByKey.get(`${row.matchday}|${home}|${away}`);
    if (!f) return row;
    const priced = f.p_home != null && f.p_draw != null && f.p_away != null;
    return {
      ...row,
      href: `/desporto/liga/jogo/${f.slug}`,
      probs: priced
        ? row.venue === "H"
          ? { win: f.p_home as number, draw: f.p_draw as number, loss: f.p_away as number }
          : { win: f.p_away as number, draw: f.p_draw as number, loss: f.p_home as number }
        : undefined,
    };
  });

  // Magic numbers: compute for this team, from the run-in only.
  //
  // A magic number is the points that *mathematically guarantee* a zone
  // whatever anyone else does. While rivals can still reach nearly every
  // remaining point, that answer is "win essentially all of them" — the same
  // number for every team, carrying no information (at matchday 2 it read
  // "99 of 99 available"). It becomes a real device once rivals have dropped
  // enough points for the target to be reachable without a perfect run,
  // which is also when clinching and elimination first become possible.
  const TOTAL_MATCHES = 34;
  const MAGIC_FROM_MATCHDAY = 23; // the final 12 matchdays
  let magicNumbers: { label: string; pointsNeeded: number; maxRemaining: number; clinched: boolean; eliminated: boolean }[] = [];
  if (
    actualStanding
    && actualStanding.played >= MAGIC_FROM_MATCHDAY
    && prediction.actual_standings
  ) {
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

  // Decisive matches: the club's own race only, with the threshold applied
  // before deciding there is anything to show. Benfica's eleven rows all
  // swing its title chance by under 3 pp, so the old filter let them through
  // and the list then rendered other clubs' relegation games under "Jogos
  // decisivos para Benfica" (audit F-H5).
  const ownRace: Exclude<DecisiveRace, "both"> | null = isSurvival || (!isTitleContender && isRelegationCandidate)
    ? "relegation"
    : isTitleContender
      ? "title"
      : null;
  const teamDecisiveMatches = ownRace === "title"
    ? titleDecisive(scenarios?.decisive_matches, teamName)
    : ownRace === "relegation"
      ? relegationDecisive(scenarios?.decisive_matches, teamName)
      : [];
  const hasDirectDecisive = teamDecisiveMatches.length > 0;

  // Otherwise: this club's own games that swing another club's race. Every
  // row names that club ("Se o Nacional vencer").
  const teamFeaturedMatches = !hasDirectDecisive
    ? (scenarios?.decisive_matches ?? []).filter(
        (m) =>
          (m.home_team === teamName || m.away_team === teamName) &&
          (titleDecisive([m]).length > 0 || relegationDecisive([m]).length > 0),
      )
    : [];
  const decisiveLabels = {
    current: t("football.current"),
    ifTeamWins: t("football.ifWinsTemplate"),
    ifTeamLoses: t("football.ifLosesTemplate"),
    titleRaceSection: t("football.titleRaceSection"),
    relegationSection: t("football.relegationSection"),
    matchdayPrefix: t("football.matchdayPrefix"),
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
      {/* Hero: the club colour is an accent (stripe + crest), never the
          background — a readable neutral surface works for all 18 clubs,
          including a bright yellow one like Arouca (diagnosis §10). The intro
          recognises a deep arrival: the club, the forecast date and what the
          page answers. */}
      <PageHero
        compact
        back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
        eyebrow={`Liga Portugal · ${t("football.season")} ${prediction.season} · ${t("football.matchday")} ${prediction.matchday}`}
        title={
          <span className="flex items-center gap-3">
            <span aria-hidden="true" className="h-9 w-1.5 shrink-0 rounded-full md:h-11" style={{ backgroundColor: teamColor }} />
            {teamLogoSrc(teamName) && (
              <img src={teamLogoSrc(teamName)} alt="" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            )}
            <span>{teamDisplayName(teamName)}</span>
          </span>
        }
        lede={t("football.clubPageIntro", { team: teamDisplayName(teamName), date: forecastDate })}
      />

      {/* Key stats + season projection */}
      {standing && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {shownMetrics.length > 0 && (
              <div className="grid gap-6 md:gap-8" style={{ gridTemplateColumns: `repeat(${shownMetrics.length}, minmax(0, 1fr))` }}>
                {shownMetrics.map((metric, index) => (
                  <div
                    key={metric.key}
                    className="border-t-2 pt-3"
                    style={{ borderColor: index === 0 ? teamColor : "var(--color-line)" }}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      {metric.label}
                    </div>
                    <div className="text-3xl md:text-4xl font-display font-extrabold tabular-nums text-ink">
                      {formatPercent(metric.value / 100, locale)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Two 0% headline cards waste prime space and can overstate a
                narrow distinction (diagnosis §5) — fold anything below 1%
                into one factual line instead of three confident zeros. */}
            {foldedMetrics.length > 0 && (
              <p className={`text-sm text-stone-500 ${shownMetrics.length > 0 ? "mt-4" : ""}`}>
                {t("football.belowOnePercentFold", {
                  labels: foldedMetrics.map((m) => m.label.toLowerCase()).join(locale === "pt" ? " e " : " and "),
                })}
              </p>
            )}
            {/* Season projection summary */}
            <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-500">
              <span>
                {t("football.expectedPoints")}:{" "}
                <strong className="text-ink">{formatInteger(Math.round(standing.mean_pts), locale)}</strong>
                {pointsRange && (
                  <>
                    {" "}
                    {locale === "pt"
                      ? `(90% das simulações entre ${formatInteger(pointsRange.lo, locale)} e ${formatInteger(pointsRange.hi, locale)})`
                      : `(90% of simulations between ${formatInteger(pointsRange.lo, locale)} and ${formatInteger(pointsRange.hi, locale)})`}
                  </>
                )}
              </span>
              {projectedPosition > 0 && (
                <span>
                  {t("football.projectedFinish")}:{" "}
                  <strong className="text-ink">
                    {ordinal(projectedPosition, locale)}{" "}
                    ({formatPercent(projectedPositionProb, locale)})
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
                      <strong className="text-ink text-xs">{ordinal(attackRank, locale)}</strong>
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
                      <strong className="text-ink text-xs">{ordinal(defenseRank, locale)}</strong>
                    </span>
                  </span>
                </span>
              )}
            </div>

            {/* Magic Numbers */}
            {magicNumbers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  {t("football.magicNumbers")}
                </div>
                <div className="text-[11px] text-stone-400 mb-2">
                  {t("football.magicNumbersDescription")}
                </div>
                <div className="flex flex-wrap gap-3">
                  {magicNumbers.map(mn => {
                    const impossible = mn.pointsNeeded > mn.maxRemaining;
                    return (
                      <div key={mn.label} className="rounded-xl bg-cream border border-line px-3 py-2 min-w-[120px]">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                          {t(`football.${mn.label}`)}
                        </div>
                        {mn.clinched ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {t("football.magicClinched")}
                          </span>
                        ) : mn.eliminated ? (
                          <span className="text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                            {t("football.magicEliminated")}
                          </span>
                        ) : impossible ? (
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5">
                            {t("football.magicDependsOnOthers")}
                          </span>
                        ) : (
                          <div>
                            <span className="text-lg font-display font-extrabold tabular-nums text-ink">
                              {mn.pointsNeeded}
                              <span className="text-xs text-stone-400 font-normal ml-0.5">
                                {t("football.magicPtsAbbr")}
                              </span>
                            </span>
                            <div className="text-[11px] text-stone-400 mt-0.5">
                              {/* When the number equals everything still on
                                  offer, say so — "96 of 96 available" is a
                                  riddle where "win every match" is a fact. */}
                              {mn.pointsNeeded >= mn.maxRemaining
                                ? t("football.magicWinEverything")
                                : t("football.magicNeedsOf", { available: mn.maxRemaining })}
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
            <h2 className="text-2xl tracking-tight mb-1">
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
            {/* "6th is most likely, at 12%" can overstate a narrow distinction
                in a broad finish distribution (diagnosis §5) — say so when
                neighbouring positions carry comparable support. */}
            {spread?.broad && (
              <p className="mt-4 text-sm text-stone-600">
                {t("football.positionSpreadSentence", {
                  position: ordinal(spread.modalPosition, locale),
                  probability: formatPercent(spread.modalProb, locale),
                  range:
                    locale === "pt"
                      ? `${ordinal(spread.rangeStart, locale)} e o ${ordinal(spread.rangeEnd, locale)}`
                      : `${ordinal(spread.rangeStart, locale)} and ${ordinal(spread.rangeEnd, locale)}`,
                  share: formatPercent(spread.rangeProb, locale),
                })}
              </p>
            )}
          </div>
        </section>
      )}

      {/* This club's own supported fixture: its relevant objective, dated
          baseline and the three-outcome stakes, oriented from its own
          perspective (diagnosis §5's club page, second step). */}
      {clubOutlook && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              {t("football.fixtureStakesSectionTitle")}
            </p>
            <h2 className="text-2xl tracking-tight mb-6">
              {clubOutlook.opponentLabel
                ? t("football.fixtureStakesHeading", { team: clubOutlook.label, opponent: clubOutlook.opponentLabel })
                : t("football.fixtureStakesHeadingNoOpponent", { team: clubOutlook.label })}
            </h2>
            <FixtureStakes locale={locale === "pt" ? "pt" : "en"} entry={clubOutlook} />
          </div>
        </section>
      )}

      {/* Probability timeline — title/relegation contenders, once there is
          actually a line to read. Two points are a segment, not a trend, and
          the axis has nothing to say about a season two matchdays old. */}
      {timelineData.length >= 5 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-2xl tracking-tight mb-1">
              {t("football.probabilityOverTime")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.probabilityOverTimeDescription", { target: timelineTarget })}
            </p>
            <DataCard
              title={locale === "pt" ? `Probabilidade de ${timelineTarget}, jornada a jornada` : `Chance of ${timelineTarget}, matchday by matchday`}
              source={locale === "pt"
                ? `Fonte: modelo estimador.pt, ${formatInteger(prediction.n_sims, locale)} simulações por previsão`
                : `Source: estimador.pt model, ${formatInteger(prediction.n_sims, locale)} simulations per forecast`}
              updated={locale === "pt" ? `Atualizado a ${forecastDate}` : `Updated ${forecastDate}`}
              methodologyHref="/desporto/liga/metodologia"
              methodologyLabel={locale === "pt" ? "Como funciona o modelo" : "How the model works"}
              locale={locale}
            >
              <TeamTimeline
                data={timelineData}
                teamColor={teamColor}
                yAxisLabel={timelineLabel}
                xAxisLabel={t("football.matchday")}
              />
            </DataCard>
          </div>
        </section>
      )}

      {/* Narrative Scenarios */}
      {narrativeData && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-2xl tracking-tight mb-1">
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
              locale={locale}
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
                <h2 className="text-2xl tracking-tight mb-1">
                  {t("football.buildYourPath")}
                </h2>
                <p className="text-sm text-stone-500 mb-6">
                  {t("football.buildYourPathDescription")}
                </p>
                <PathBuilder
                  matches={remainingMatches}
                  pCurrent={scenarios.critical_paths[teamName].p_current}
                  target={scenarios.critical_paths[teamName].target}
                  locale={locale}
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
                <h2 className="text-2xl tracking-tight mb-1">
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
            <h2 className="text-2xl tracking-tight mb-1">
              {t("football.decisiveMatchesFor", { team: teamDisplayName(teamName) })}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {ownRace === "relegation"
                ? t("football.decisiveMatchesForDescriptionSurvival", { team: teamDisplayName(teamName) })
                : t("football.decisiveMatchesForDescription", { team: teamDisplayName(teamName) })}
            </p>
            <DecisiveMatches
              matches={teamDecisiveMatches}
              race={ownRace ?? "both"}
              locale={locale}
              labels={decisiveLabels}
              maxItemsPerTeam={10}
            />
          </div>
        </section>
      )}

      {/* Featured matches — this club has no direct stake of its own in these
          (hasDirectDecisive is false), so every probability shown belongs to
          the OTHER, named club, not this page's team. The heading and
          description say so explicitly: a reader must never have to infer
          whose number is on screen (diagnosis §5/§9, the Casa Pia panel on
          Arouca's page). Each row's own team badge/name (in DecisiveMatches)
          still names that club again. */}
      {teamFeaturedMatches.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-2xl tracking-tight mb-1">
              {t("football.otherClubsImpactFor", { team: teamDisplayName(teamName) })}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.otherClubsImpactForDescription", { team: teamDisplayName(teamName) })}
            </p>
            <DecisiveMatches
              matches={teamFeaturedMatches}
              locale={locale}
              labels={decisiveLabels}
              maxItemsPerTeam={10}
            />
          </div>
        </section>
      )}

      {/* A club without a scenario builder still gets its calendar: every
          game left, from the fixture manifest, postponed ones included
          (audit F14). */}
      {!scenarios?.critical_paths?.[teamName] && fixtureRows.length > 0 && (
        <section className="border-b border-stone-200" aria-labelledby="club-fixtures">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 id="club-fixtures" className="text-2xl tracking-tight mb-1">
              {locale === "pt" ? `Que jogos faltam ao ${teamDisplayName(teamName)}?` : `Which games does ${teamDisplayName(teamName)} have left?`}
            </h2>
            <p className="text-sm text-stone-500 mb-6 max-w-3xl">
              {locale === "pt"
                ? "Por ordem de data, hora de Lisboa. O modelo dá probabilidades para a próxima jornada; as datas mais distantes ainda podem mudar."
                : "In date order, Lisbon time. The model prices the next round; later dates can still change."}
            </p>
            <ClubFixtures rows={fixtureRows} locale={locale} />
          </div>
        </section>
      )}

      {/* Where every number on this page comes from (audit pro-PP-14). */}
      <section>
        <div className="max-w-7xl mx-auto px-4 py-8 text-xs leading-relaxed text-stone-500">
          {locale === "pt"
            ? `Fonte: modelo bayesiano de Poisson bivariado do estimador.pt, ajustado aos golos e aos remates à baliza; ${formatInteger(prediction.n_sims, locale)} simulações do resto da época, depois da jornada ${prediction.matchday} (previsão de ${forecastDate}). `
            : `Source: estimador.pt's bivariate Poisson Bayesian model, fitted to goals and shots on target; ${formatInteger(prediction.n_sims, locale)} simulations of the rest of the season, after matchday ${prediction.matchday} (forecast of ${forecastDate}). `}
          <Link href="/desporto/liga/metodologia" locale={locale} className="font-semibold text-ink underline underline-offset-4">
            {locale === "pt" ? "Como funciona o modelo" : "How the model works"}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/desporto/liga/dados" locale={locale} className="font-semibold text-ink underline underline-offset-4">
            {locale === "pt" ? "Dados abertos" : "Open data"}
          </Link>
        </div>
      </section>

      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
