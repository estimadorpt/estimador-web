import { createPageMetadata } from '@/lib/metadata';
import { loadLigaData, loadLigaHistorical, loadLigaSamples, loadUpcomingFixtures } from "@/lib/utils/football-data-loader";
import {
  ligaTeamSlugs,
  ligaSlugToTeam,
  teamColorOnPaper,
  teamDisplayName,
  teamWithArticle,
} from "@/lib/config/football";
import { Link } from "@/i18n/routing";
import { DataCard } from "@/components/viz/DataCard";
import { ClubFixtures, clubFixtureRows } from "@/components/football/ClubFixtures";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { TeamTimeline } from "@/components/charts/football/TeamTimeline";
import { PathBuilder } from "@/components/charts/football/PathBuilder";
import { DueloFinal } from "@/components/charts/football/DueloFinal";
import { PositionDistribution } from "@/components/charts/football/PositionDistribution";
import { getTranslations } from "next-intl/server";
import { formatInteger, formatLongDate, formatOrdinal, formatPercent } from "@/lib/football-format";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildClubOutlooks, positionSpread } from "@/components/football/club-outlook";
import { loadGameFixtures } from "@/components/football/load-game-fixtures";
import { FixtureStakes } from "@/components/football/FixtureStakes";
import { ClockSwitch } from "@/components/football/ClockSwitch";
import { ShareLink } from "@/components/football/ShareLink";
import { LigaSectionNav } from "@/components/football/LigaSectionNav";
import { RivalGames, type RivalGameRow } from "@/components/football/RivalGames";
import { forecastStatus, nextRoundTiming } from "@/lib/football-status";
import { clubFrame, duelRival, frameMetric, rivalGames } from "@/lib/football-scenarios";
import { byKickoff } from "@/lib/football-fixtures";
import { previousModelMatchdays, publicationLabel } from "@/components/charts/football/probability-history-table";
import { setRequestLocale } from '@/i18n/request-locale';
import { Register } from '@/components/instrument';

const ordinal = formatOrdinal;

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
  // The race the page is about, the page's own frame (audit FA2-09): a
  // relegation club is not described by "cenários de título".
  const frame = clubFrame(prediction?.table.find((r) => r.team === teamName));

  return createPageMetadata({
    locale,
    path: `/desporto/liga/${slug}`,
    title: t("football.teamPageTitle", { team: teamDisplayName(teamName) }),
    description: t("football.teamPageDescription", {
      race: frame ?? "other",
      team: teamDisplayName(teamName),
      teamFor: teamWithArticle(teamName, "para"),
      teamOf: teamWithArticle(teamName, "de"),
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
          <LigaSectionNav current="previsoes" locale={locale} />
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

  const pt = locale !== "en";
  // The club colour as drawn on paper: contrast-checked, never used for text.
  const teamColor = teamColorOnPaper(teamName);
  const standing = prediction.table.find((t) => t.team === teamName);
  const forecastDate = formatLongDate(prediction.timestamp, locale);

  // The page's one frame: the title from 1% of title chance, else relegation
  // from 1%, else none (clubFrame). Every what-if below reads it, so the page
  // never says "despromoção" in one block and "permanência" in the next.
  const frame = clubFrame(standing);
  const metric = frame ? frameMetric(frame) : null;

  // The page is exported once per forecast. Once the round the next forecast
  // waits for has been played, every "agora" on it is the forecast of its
  // date, and the page says so (audit FR3-01): the hub's instant.
  const timing = nextRoundTiming(prediction, upcomingFixtures);
  const staleAt = timing.playedAt;
  const status = forecastStatus(prediction, upcomingFixtures, locale);

  // Which of the three fixed figures (title / top 3 / relegation) carry
  // information worth their own figure — below 1% they fold into one line
  // instead of three confident-looking 0% headlines (diagnosis §5).
  const pChampion = standing ? standing.p_champion * 100 : 0;
  const pRelegation = standing ? standing.p_relegation * 100 : 0;
  const metricCards = [
    { key: "championship", label: t("football.championship"), value: pChampion },
    { key: "top3", label: t("football.top3"), value: standing ? standing.p_top3 * 100 : 0 },
    { key: "relegation", label: t("football.relegation"), value: pRelegation },
  ];
  const shownMetrics = standing ? metricCards.filter((m) => m.value >= 1) : [];
  const foldedMetrics = standing ? metricCards.filter((m) => m.value < 1) : [];
  // "Campeão, top 3 e despromoção: abaixo de 1%": a sentence, not a
  // lowercase fragment, and a list with one "e" (audit CL3-V03, FA3-13).
  const foldedLabels = foldedMetrics.map((m, i) => (i === 0 ? m.label : m.label.toLowerCase()));
  const foldedList = foldedLabels.length > 1
    ? `${foldedLabels.slice(0, -1).join(", ")} ${pt ? "e" : "and"} ${foldedLabels[foldedLabels.length - 1]}`
    : foldedLabels[0] ?? "";
  const relegationFolded = foldedMetrics.some((m) => m.key === "relegation");
  // What "despromoção" counts, said once beside the club's own figure (M-07).
  const relegationDefinition = pt
    ? "17.º ou 18.º lugar; o 16.º joga o play-off e não conta"
    : "17th or 18th; 16th plays off and is not counted";

  // This club's next game and what each result does to its frame.
  const clubOutlook = buildClubOutlooks(pt ? "pt" : "en", prediction, scenarios, gameFixtures)
    .find((entry) => entry.team === teamName) ?? null;
  const clubNextMatchday = clubOutlook?.matchHref
    ? (upcomingFixtures.find((f) => `/desporto/liga/jogo/${f.slug}` === clubOutlook.matchHref)?.matchday ?? null)
    : null;

  // Timeline: the frame's chance, jornada by jornada. No band: the published
  // lo/hi fields are not the uncertainty of the probability (audit F-H1,
  // owner decision). A club in neither race has no line worth drawing.
  // Each point is a dated publication, as on the hub ("J2 · 14 ago."), and
  // the pre-season one from the previous model says so (FA3-05, VFA-M4).
  const previousModel = new Set(previousModelMatchdays(historical));
  const timelineData = metric
    ? historical.flatMap((md) => {
        const row = md.table.find((t) => t.team === teamName);
        return row
          ? [{
              matchday: md.matchday,
              value: row[metric] * 100,
              label: publicationLabel(md, locale, previousModel.has(md.matchday)),
            }]
          : [];
      })
    : [];
  const timelineLabel = metric === "p_champion" ? t("football.championPercent") : t("football.relegationPercent");
  const timelineTarget = metric === "p_champion"
    ? (pt ? "ser campeão" : "winning the title")
    : (pt ? "despromoção" : "relegation");

  // The scenario builder, when the published paths count this page's race
  // (a title path for a title club, a survival path, read as relegation, for
  // a relegation club).
  const criticalPath = scenarios?.critical_paths?.[teamName];
  const builderPath = criticalPath && frame
    && (criticalPath.target === "champion") === (frame === "title")
    ? criticalPath
    : null;

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
      ? { lo: samples.points_q05[sampleIndex], hi: samples.points_q95[sampleIndex] }
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

  // The builder's games with a confirmed kickoff, so a game already played
  // is marked and can no longer be picked (audit FR3-01).
  const builderKickoffs: Record<number, string> = {};
  for (const row of fixtureRows) {
    if (row.kickoff && row.kickoffConfirmed) builderKickoffs[row.matchday] = row.kickoff;
  }

  // "Outros jogos que pesam": the other clubs' games in the published round
  // that move this club's frame chance by 3 pp or more (the simulator's list,
  // moved here), in kickoff order with their match pages.
  const nms = scenarios?.next_matchday_scenarios;
  const rivalRows: RivalGameRow[] = frame
    ? byKickoff(rivalGames(teamName, frame, nms).map((g) => {
        const f = nextRoundByKey.get(`${g.matchday}|${g.home}|${g.away}`);
        return {
          ...g,
          kickoff: f?.kickoff ?? null,
          kickoffConfirmed: f?.kickoffConfirmed ?? false,
          postponed: f?.postponed === true,
          href: f ? `/desporto/liga/jogo/${f.slug}` : null,
        };
      }))
    : [];
  const frameBaseline = metric ? (nms?.baseline[teamName]?.[metric] ?? standing?.[metric] ?? 0) : 0;

  // The final duel: this club against the closest club in the same race.
  const rival = duelRival(teamName, frame, prediction.table);

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

  const sourceLine = (perForecast = false) => pt
    ? `Fonte: modelo estimador.pt, ${formatInteger(prediction.n_sims, locale)} simulações${perForecast ? " por previsão" : ""}`
    : `Source: estimador.pt model, ${formatInteger(prediction.n_sims, locale)} simulations${perForecast ? " per forecast" : ""}`;
  const updatedLine = pt ? `Atualizado a ${forecastDate}` : `Updated ${forecastDate}`;
  const methodLabel = pt ? "Como funciona o modelo" : "How the model works";

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
      <LigaSectionNav current="previsoes" locale={locale} />
      {/* Hero: the club colour is a swatch beside the name, never the
          background — a readable neutral surface works for all 18 clubs,
          including a bright yellow one like Arouca (diagnosis §10). No crest:
          a hero carries no icon. The meta line is the hub's dated status,
          from the same helper, so the two say the same thing (review,
          October 2026). */}
      <PageHero
        compact
        back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
        eyebrow={pt ? `Época ${prediction.season}` : `${prediction.season} season`}
        title={
          <span className="flex items-center gap-3">
            <span aria-hidden="true" className="h-9 w-1.5 shrink-0 md:h-11" style={{ backgroundColor: teamColor }} />
            <span>{teamDisplayName(teamName)}</span>
          </span>
        }
        lede={t("football.clubPageIntro", {
          team: teamDisplayName(teamName),
          teamFor: teamWithArticle(teamName, "para"),
        })}
        // A link to this club's page, not the hub's card, for a group chat
        // (audit PRO3-15).
        actions={
          <ShareLink
            title={t("football.teamPageTitle", { team: teamDisplayName(teamName) })}
            locale={pt ? "pt" : "en"}
          />
        }
        meta={<span><ClockSwitch initial={status.initial} steps={status.steps} /></span>}
      />

      {/* Key stats + season projection */}
      {standing && (
        <section className="border-b border-rule">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {shownMetrics.length > 0 && (
              <div className="grid gap-6 md:gap-8" style={{ gridTemplateColumns: `repeat(${shownMetrics.length}, minmax(0, 1fr))` }}>
                {shownMetrics.map((m, index) => (
                  <div
                    key={m.key}
                    className="border-t-2 pt-3"
                    style={{ borderColor: index === 0 ? teamColor : "var(--color-line)" }}
                  >
                    <div className="text-[12px] font-semibold text-graphite mb-1">
                      {m.label}
                    </div>
                    <div className="text-3xl md:text-4xl font-display font-extrabold tabular-nums text-ink">
                      {formatPercent(m.value / 100, locale)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Two 0% headline cards waste prime space and can overstate a
                narrow distinction (diagnosis §5) — fold anything below 1%
                into one factual line instead of three confident zeros. */}
            {foldedMetrics.length > 0 && (
              <p className={`text-sm text-stone-600 ${shownMetrics.length > 0 ? "mt-4" : ""}`}>
                {t("football.belowOnePercentFold", { labels: foldedList })}
                {/* The definition goes with the figure when relegation is
                    folded here, so the word is not said twice (CL3-V03). */}
                {relegationFolded && (
                  <span className="text-stone-500">
                    {" "}({foldedMetrics.length > 1 ? `${pt ? "despromoção" : "relegation"}: ` : ""}{relegationDefinition}).
                  </span>
                )}
              </p>
            )}
            {/* What "despromoção" counts, wherever the club's own figure is (M-07). */}
            {!relegationFolded && (
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
                {pt ? "Despromoção" : "Relegation"}: {relegationDefinition}.
              </p>
            )}
            {/* Season projection summary */}
            <div className="mt-4 pt-4 border-t border-grid flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-500">
              <span>
                {t("football.expectedPoints")}:{" "}
                <strong className="text-ink">{formatInteger(Math.round(standing.mean_pts), locale)}</strong>
                {pointsRange && (
                  <>
                    {" "}
                    {pt
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
              {/* The model's strength as a rank with its scale in words, not
                  an unlabelled club-coloured bar (audit PUB3-12). */}
              {teamStrength && totalTeams > 0 && (
                <span>
                  {t("football.attack")}: <strong className="text-ink">{ordinal(attackRank, locale)}</strong>
                  {" · "}
                  {t("football.defense")}: <strong className="text-ink">{ordinal(defenseRank, locale)}</strong>
                  {" "}
                  <span className="text-stone-500">
                    ({pt
                      ? `força estimada pelo modelo entre os ${totalTeams} clubes, 1.º = melhor; `
                      : `strength estimated by the model among the ${totalTeams} clubs, 1st = best; `}
                    <Link href="/desporto/liga#forca-das-equipas" locale={locale} className="font-medium text-ink underline underline-offset-4">
                      {pt ? "todos os clubes" : "every club"}
                    </Link>)
                  </span>
                </span>
              )}
            </div>

            {/* Magic numbers: one ruled row per objective, the fact in the
                value column (a word for clinched, out of reach or depends on
                others; else the points still needed), no chips. */}
            {magicNumbers.length > 0 && (
              <Register
                className="mt-6 max-w-2xl"
                title={<>
                  {t("football.magicNumbers")}
                  <span className="mt-0.5 block text-[12px] font-normal text-graphite">{t("football.magicNumbersDescription")}</span>
                </>}
                items={magicNumbers.map(mn => {
                  const impossible = mn.pointsNeeded > mn.maxRemaining;
                  return {
                    label: t(`football.${mn.label}`),
                    value: mn.clinched ? (
                      <span className="text-emerald-700">{t("football.magicClinched")}</span>
                    ) : mn.eliminated ? (
                      <span className="text-red-700">{t("football.magicEliminated")}</span>
                    ) : impossible ? (
                      <span className="text-amber-800">{t("football.magicDependsOnOthers")}</span>
                    ) : (
                      <>
                        {mn.pointsNeeded} {t("football.magicPtsAbbr")}{" "}
                        <span className="font-normal text-graphite">
                          {/* When the number equals everything still on
                              offer, say so — "96 of 96 available" is a
                              riddle where "win every match" is a fact. */}
                          {mn.pointsNeeded >= mn.maxRemaining
                            ? t("football.magicWinEverything")
                            : t("football.magicNeedsOf", { available: mn.maxRemaining })}
                        </span>
                      </>
                    ),
                  };
                })}
              />
            )}
          </div>
        </section>
      )}

      {/* Position distribution */}
      {positionProbs && positionProbs.length > 0 && (
        <section className="border-b border-rule">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-2xl md:text-[28px] mb-1">
              {t("football.positionDistribution")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.positionDistributionDescription")}
            </p>
            {/* Framed like every other chart: title, source, date, method (UXD2-07). */}
            <DataCard
              title={pt ? `Onde ${teamWithArticle(teamName)} pode acabar` : `Where ${teamDisplayName(teamName)} can finish`}
              subtitle={pt ? "Parte das simulações em que termina em cada posição, numa escala de 0 a 100%." : "Share of simulations finishing in each position, on a 0–100% scale."}
              source={sourceLine()}
              updated={updatedLine}
              methodologyHref="/desporto/liga/metodologia"
              methodologyLabel={methodLabel}
              locale={locale}
            >
              <PositionDistribution
                probs={positionProbs}
                teamColor={teamColor}
                locale={locale}
              />
            </DataCard>
            {/* "6th is most likely, at 12%" can overstate a narrow distinction
                in a broad finish distribution (diagnosis §5) — say so when
                neighbouring positions carry comparable support. */}
            {spread?.broad && (
              <p className="mt-4 text-sm text-stone-600">
                {t("football.positionSpreadSentence", {
                  position: ordinal(spread.modalPosition, locale),
                  probability: formatPercent(spread.modalProb, locale),
                  range:
                    pt
                      ? `${ordinal(spread.rangeStart, locale)} e o ${ordinal(spread.rangeEnd, locale)}`
                      : `${ordinal(spread.rangeStart, locale)} and ${ordinal(spread.rangeEnd, locale)}`,
                  share: formatPercent(spread.rangeProb, locale),
                })}
              </p>
            )}
          </div>
        </section>
      )}

      {/* This club's next game: what each result does to its frame, from
          its own side (diagnosis §5's club page, second step). */}
      {clubOutlook && (
        <section className="border-b border-rule">
          <div className="max-w-7xl mx-auto px-4 py-10">
            {/* "Próximo jogo" until the club's game kicks off; then the block
                is what the model gave before it, dated (FR3-01, FA3-07). */}
            <p className="text-[12px] font-semibold text-graphite mb-1">
              <ClockSwitch
                initial={t("football.fixtureStakesSectionTitle")}
                steps={clubOutlook.fixtureKickoff && clubNextMatchday != null
                  ? [{
                      at: clubOutlook.fixtureKickoff,
                      value: pt
                        ? `Jornada ${clubNextMatchday} · o que o modelo dava antes do jogo`
                        : `Matchday ${clubNextMatchday} · what the model gave before the match`,
                    }]
                  : []}
              />
            </p>
            <h2 className="text-2xl md:text-[28px] mb-6">
              {clubOutlook.opponentLabel && clubOutlook.opponent ? (
                <ClockSwitch
                  initial={t("football.fixtureStakesHeading", {
                    team: clubOutlook.label,
                    teamFor: teamWithArticle(teamName, "para"),
                    opponent: clubOutlook.opponentLabel,
                    opponentAgainst: teamWithArticle(clubOutlook.opponent, "contra"),
                  })}
                  steps={clubOutlook.fixtureKickoff
                    ? [{
                        at: clubOutlook.fixtureKickoff,
                        value: pt
                          ? `O que estava em jogo ${teamWithArticle(teamName, "para")} ${teamWithArticle(clubOutlook.opponent, "contra")}`
                          : `What was at stake for ${clubOutlook.label} against ${clubOutlook.opponentLabel}`,
                      }]
                    : []}
                />
              ) : clubOutlook.opponentLabel
                ? t("football.fixtureStakesHeading", {
                    team: clubOutlook.label,
                    teamFor: teamWithArticle(teamName, "para"),
                    opponent: clubOutlook.opponentLabel,
                    opponentAgainst: `${pt ? "contra" : "against"} ${clubOutlook.opponentLabel}`,
                  })
                : t("football.fixtureStakesHeadingNoOpponent", { team: clubOutlook.label, teamFor: teamWithArticle(teamName, "para") })}
            </h2>
            <FixtureStakes locale={pt ? "pt" : "en"} entry={clubOutlook} matchLink />
          </div>
        </section>
      )}

      {/* The frame's chance over the season, once there is a line to read:
          two points are a segment, not a trend. */}
      {timelineData.length >= 5 && (
        <section className="border-b border-rule">
          <div className="max-w-7xl mx-auto px-4 py-10">
            {/* One title level per chart (UXD3-11); the card says what each
                point is, as on the hub (FA3-05, VFA-M4). */}
            <h2 className="text-2xl md:text-[28px] mb-6">
              {t("football.probabilityOverTime")}
            </h2>
            <DataCard
              title={pt ? `Probabilidade de ${timelineTarget}, jornada a jornada` : `Chance of ${timelineTarget}, matchday by matchday`}
              subtitle={`${pt
                ? "Cada ponto é uma previsão publicada, com os jogos disputados até então; a data de cada uma está na dica e na tabela."
                : "Each dot is a published forecast, with the matches played up to then; each one's date is in the tip and the table."}${
                previousModel.size > 0
                  ? pt ? " O ponto da pré-época (J0) vem do modelo anterior." : " The pre-season point (MD0) comes from the previous model."
                  : ""}`}
              source={sourceLine(true)}
              updated={updatedLine}
              methodologyHref="/desporto/liga/metodologia"
              methodologyLabel={methodLabel}
              locale={locale}
            >
              <TeamTimeline
                data={timelineData}
                teamColor={teamColor}
                yAxisLabel={timelineLabel}
                xAxisLabel={t("football.matchday")}
                pointLabel={pt ? "Previsão" : "Forecast"}
              />
            </DataCard>
          </div>
        </section>
      )}

      {/* "Cria o teu cenário": the one what-if over the season, in the
          page's frame, with the decisive games marked in it (the separate
          decisive list and the "Caminhos" cards were cut, review October
          2026). */}
      {builderPath && frame && builderPath.matches.length > 0 && (
        <section className="border-b border-rule" aria-labelledby="cria-o-teu-cenario">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 id="cria-o-teu-cenario" className="text-2xl md:text-[28px] mb-1">
              {t("football.buildYourPath")}
            </h2>
            <p className="text-sm text-stone-500 mb-6 max-w-3xl">
              {pt
                ? `Escolhe resultados nos jogos que faltam ${teamWithArticle(teamName, "a")} e vê como muda a probabilidade de ${frame === "title" ? "ser campeão" : "despromoção"}, jogo a jogo.`
                : `Pick results in ${teamDisplayName(teamName)}'s remaining games and see how the chance of ${frame === "title" ? "winning the title" : "relegation"} moves, game by game.`}{" "}
              <Link
                href={pt ? "/desporto/liga/metodologia#cria-o-teu-cenario" : "/desporto/liga/metodologia#build-your-own-scenario"}
                locale={locale}
                className="font-medium text-ink underline underline-offset-4"
              >
                {pt ? "Como funciona" : "How it works"}
              </Link>
            </p>
            <PathBuilder
              team={teamName}
              matches={builderPath.matches}
              pCurrent={builderPath.p_current}
              target={builderPath.target}
              frame={frame}
              locale={locale}
              nSims={prediction.n_sims}
              staleAt={staleAt}
              forecastTimestamp={prediction.timestamp}
              kickoffs={builderKickoffs}
            />
          </div>
        </section>
      )}

      {/* Other clubs' games that weigh on this one, from the published
          round: the simulator's list, static, with the figures. */}
      {frame && nms && (
        <section className="border-b border-rule" aria-labelledby="outros-jogos">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 id="outros-jogos" className="text-2xl md:text-[28px] mb-1">
              {pt ? "Outros jogos que pesam" : "Other games that weigh"}
            </h2>
            <RivalGames
              team={teamName}
              frame={frame}
              baseline={frameBaseline}
              games={rivalRows}
              locale={locale}
              forecastTimestamp={prediction.timestamp}
            />
          </div>
        </section>
      )}

      {/* The final duel: who finishes ahead, this club or the closest club in
          its race (or any other, from the select). */}
      {frame && rival && samples && samples.teams.includes(teamName) && (
        <section className="border-b border-rule" aria-labelledby="duelo-final">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 id="duelo-final" className="text-2xl md:text-[28px] mb-6">
              {pt ? "Duelo final" : "Final duel"}
            </h2>
            <DueloFinal
              samples={samples}
              team={teamName}
              rival={rival}
              frame={frame}
              locale={locale}
              forecastTimestamp={prediction.timestamp}
            />
          </div>
        </section>
      )}

      {/* A club without a scenario builder still gets its calendar: every
          game left, from the fixture manifest, postponed ones included
          (audit F14). */}
      {!builderPath && fixtureRows.length > 0 && (
        <section className="border-b border-rule" aria-labelledby="club-fixtures">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 id="club-fixtures" className="text-2xl md:text-[28px] mb-1">
              {pt ? `Os jogos que faltam ${teamWithArticle(teamName, "a")}` : `The games ${teamDisplayName(teamName)} has left`}
            </h2>
            <p className="text-sm text-stone-500 mb-6 max-w-3xl">
              {pt
                ? "Por ordem de data, hora de Lisboa. O modelo dá probabilidades para a próxima jornada; as datas mais distantes ainda podem mudar."
                : "In date order, Lisbon time. The model prices the next round; later dates can still change."}
            </p>
            <ClubFixtures rows={fixtureRows} locale={locale} forecastTimestamp={prediction.timestamp} />
          </div>
        </section>
      )}

      {/* Where every number on this page comes from (audit pro-PP-14). */}
      <section>
        <div className="max-w-7xl mx-auto px-4 py-8 text-xs leading-relaxed text-stone-500">
          {pt
            ? `Fonte: modelo bayesiano de Poisson bivariado do estimador.pt, ajustado aos golos e aos remates à baliza; ${formatInteger(prediction.n_sims, locale)} simulações do resto da época (previsão de ${forecastDate}). `
            : `Source: estimador.pt's bivariate Poisson Bayesian model, fitted to goals and shots on target; ${formatInteger(prediction.n_sims, locale)} simulations of the rest of the season (forecast of ${forecastDate}). `}
          <Link href="/desporto/liga/metodologia" locale={locale} className="font-semibold text-ink underline underline-offset-4">
            {methodLabel}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/desporto/liga/dados" locale={locale} className="font-semibold text-ink underline underline-offset-4">
            {pt ? "Dados abertos" : "Open data"}
          </Link>
        </div>
      </section>

      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
