import { TitleProbabilities } from '@/components/football/TitleProbabilities';
import { createPageMetadata } from '@/lib/metadata';
import {
  loadLigaWithDeltas,
  loadLigaHistorical,
  probabilityHistory,
  loadLigaSamples,
  loadLigaMarketScorecard,
  loadUpcomingFixtures,
} from "@/lib/utils/football-data-loader";
import { teamDisplayName } from "@/lib/config/football";
import { formatDateSpan, formatInteger, formatLongDate, formatPp } from "@/lib/football-format";
import {
  forecastStatusLine,
  forecastStatusLinePlayed,
  roundPlayedAt,
  roundPlayedLine,
  roundStartsAt,
} from "@/lib/football-status";
import { ClockSwitch } from "@/components/football/ClockSwitch";
import { evaluatesCurrentModel } from "@/lib/football-scorecard";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { DataCard } from "@/components/viz/DataCard";
import { LeagueTable, ClubChooser } from "@/components/charts/football/LeagueTable";
import type { PointsInterval } from "@/components/charts/football/LeagueTable";
import { MatchdayPredictions, type MatchdayFixture } from "@/components/charts/football/MatchdayPredictions";
import { TitleRaceChart } from "@/components/charts/football/TitleRaceChart";
import { RelegationChart } from "@/components/charts/football/RelegationChart";
import { TeamStrengthRatings } from "@/components/charts/football/TeamStrengthRatings";
import { LuckIndex } from "@/components/charts/football/LuckIndex";
import type { LuckEntry } from "@/components/charts/football/LuckIndex";
import { SectionNotes } from "@/components/articles/SectionNotes";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Trophy, ArrowRight, SlidersHorizontal, Scale, History, Users, Gamepad2 } from "lucide-react";
import type { Metadata } from "next";
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return createPageMetadata({
    locale,
    path: `/desporto/liga`,
    title: t("meta.ligaTitle"),
    description: t("meta.ligaDescription"),
  });
}

export default async function LigaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  // seasonSamples stays for the table's final-points intervals; the
  // draw-a-season widget that also read it was cut in the 2026-08 trim.
  const [{ prediction, scenarios, deltas }, historical, seasonSamples, upcomingFixtures, scorecard] =
    await Promise.all([
      loadLigaWithDeltas(),
      loadLigaHistorical(),
      loadLigaSamples(),
      loadUpcomingFixtures(),
      loadLigaMarketScorecard(),
    ]);

  // The two probability charts get only what they draw (SP-08).
  const probabilities = probabilityHistory(historical);

  // Every fixture still to play that carries a published 1X2, with its own
  // kickoff (game_fixtures.json), conditionals and match page: the round in
  // progress and the next one alike (audit F-H4).
  const fixtureCards: MatchdayFixture[] = upcomingFixtures
    .filter(f => f.p_home != null && f.p_draw != null && f.p_away != null)
    .map(f => ({
      home: f.home,
      away: f.away,
      matchday: f.matchday,
      kickoff: f.kickoff,
      kickoffConfirmed: f.kickoffConfirmed,
      p_home: f.p_home as number,
      p_draw: f.p_draw as number,
      p_away: f.p_away as number,
      scenario: f.scenario,
      href: `/desporto/liga/jogo/${f.slug}`,
    }));
  const cardRounds = Array.from(new Set(fixtureCards.map(f => f.matchday))).sort((a, b) => a - b);
  const cardSpan = formatDateSpan(fixtureCards.map(f => f.kickoff), locale);

  if (!prediction) {
    return (
      <div className="football-page min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
          <PageHero
            compact
            icon={<Trophy aria-hidden="true" className="w-4 h-4" />}
            eyebrow={t("football.title")}
            title={t("football.subtitle")}
            lede={locale === "pt"
              ? "A previsão da Liga não está disponível de momento."
              : "The Liga forecast is not available right now."}
          />
        </main>
        <SiteFooter locale={locale} />
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
  const updatedDate = formatLongDate(prediction.timestamp, locale);
  const simsLabel = formatInteger(prediction.n_sims, locale);

  // A concise factual change beside the forecast date (diagnosis §5 "League
  // page" — "a concise factual change"): the club whose title probability
  // moved most since the previous published matchday.
  const biggestMover = prediction.matchday_results?.length && deltas
    ? Object.values(deltas).reduce<typeof deltas[string] | null>(
        (best, d) => (!best || Math.abs(d.p_champion_delta) > Math.abs(best.p_champion_delta) ? d : best),
        null,
      )
    : null;
  const factualChange =
    biggestMover && Math.abs(biggestMover.p_champion_delta) >= 1
      ? locale === "pt"
        ? `${teamDisplayName(biggestMover.team)} ${formatPp(biggestMover.p_champion_delta / 100, locale)} no título desde a jornada anterior`
        : `${teamDisplayName(biggestMover.team)} ${formatPp(biggestMover.p_champion_delta / 100, locale)} on the title since the previous matchday`
      : null;

  // "Depois da jornada 7 · atualizado a 25 set. · próxima atualização após a
  // jornada 8 (9–12 out.)", every part from the data (audit CL-11, CL-M4).
  const nextRound = matchdayComplete ? (prediction.next_matchday?.matchday ?? null) : prediction.matchday;
  const nextRoundKickoffs = upcomingFixtures.filter(f => f.matchday === nextRound).map(f => f.kickoff);
  const statusInput = {
    matchday: prediction.matchday,
    timestamp: prediction.timestamp,
    inProgress: !matchdayComplete,
    nextRound,
    nextRoundKickoffs,
  };
  const statusLine = forecastStatusLine(statusInput, locale);
  // Once the round the next update waits for is over, the line says the new
  // forecast is in preparation instead of promising it (audit FRESH-01).
  const nextRoundPlayedAt = roundPlayedAt(nextRoundKickoffs);
  const nextRoundStartsAt = roundStartsAt(nextRoundKickoffs);
  const sourceLine = locale === "pt"
    ? `Fonte: modelo estimador.pt, ${simsLabel} simulações do resto da época`
    : `Source: estimador.pt model, ${simsLabel} simulations of the rest of the season`;
  const updatedLine = locale === "pt" ? `Atualizado a ${updatedDate}` : `Updated ${updatedDate}`;
  const methodLabel = locale === "pt" ? "Como funciona o modelo" : "How the model works";

  const allTeams = prediction.table.map(t => t.team);

  // The scorecard card names the model it evaluated, read from the file: it
  // is not always the model behind this page's forecast (FB-05).
  const scorecardCard = scorecard
    ? evaluatesCurrentModel(scorecard.model, prediction.model)
      ? locale === "pt"
        ? `Testámos o modelo destas previsões contra a linha de fecho do mercado em ${formatInteger(scorecard.n, locale)} jogos e ${scorecard.n_seasons} épocas.`
        : `We tested the model behind these forecasts against the market's closing line over ${formatInteger(scorecard.n, locale)} matches and ${scorecard.n_seasons} seasons.`
      : locale === "pt"
        ? `Testámos o modelo anterior (${scorecard.model}) contra a linha de fecho do mercado em ${formatInteger(scorecard.n, locale)} jogos e ${scorecard.n_seasons} épocas. O modelo atual (${prediction.model}) ainda não foi avaliado contra o mercado.`
        : `We tested the previous model (${scorecard.model}) against the market's closing line over ${formatInteger(scorecard.n, locale)} matches and ${scorecard.n_seasons} seasons. The current model (${prediction.model}) has not been evaluated against the market yet.`
    : locale === "pt"
      ? "O modelo comparado com a linha de fecho do mercado."
      : "The model compared with the market's closing line.";

  return (
    <div className="football-page min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        illustration="football"
        field="periwinkle"
        compact
        icon={<Trophy aria-hidden="true" className="w-4 h-4" />}
        eyebrow={`${t("football.title")} — ${t("football.season")} ${prediction.season}`}
        title={t("football.subtitle")}
        lede={locale === "pt"
          ? `Quem fica com o título, quem acaba nos três primeiros e quem desce: as hipóteses de cada clube em ${simsLabel} simulações do resto da época, atualizadas depois de cada jornada.`
          : `Who takes the title, who finishes in the top three and who goes down: each club's chances across ${simsLabel} simulations of the rest of the season, updated after every matchday.`}
        actions={
          <ClubChooser
            teams={allTeams}
            label={locale === "pt" ? "A tua equipa" : "Your club"}
            placeholder={locale === "pt" ? "Escolhe um clube" : "Choose a club"}
          />
        }
        meta={
          <span>
            <ClockSwitch
              initial={statusLine}
              steps={[{ at: nextRoundPlayedAt, value: forecastStatusLinePlayed(statusInput, locale) }]}
            />
            {factualChange ? ` · ${factualChange}` : ""}
          </span>
        }
      />

      {/* Key stats — top 3 championship probabilities */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-4">
            {t("football.championshipProbability")}
          </div>
          <TitleProbabilities teams={[leader, second, third]} deltas={deltas} locale={locale} />
          <Link
            href="/desporto/liga/modelo"
            locale={locale}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink underline underline-offset-4"
          >
            {locale === "pt" ? "Como se compara o modelo com o mercado?" : "How does the model compare with the market?"}
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* The games to come, in kickoff order with Lisbon dates and times,
          ahead of the table (reading the outlook and finding what's next are
          the first tasks). Each card's stakes come from its own published
          conditionals (audit F-H4). */}
      {fixtureCards.length > 0 && (
        <section className="border-b border-stone-200" aria-labelledby="liga-next-round">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              <ClockSwitch
                initial={matchdayComplete ? t("football.nextMatchday") : (locale === "en" ? "Fixtures to come" : "Jogos por disputar")}
                steps={nextRound != null ? [
                  { at: nextRoundStartsAt, value: locale === "en" ? `Matchday ${nextRound} under way` : `Jornada ${nextRound} a decorrer` },
                  { at: nextRoundPlayedAt, value: roundPlayedLine(nextRound, locale) },
                ] : []}
              />
            </p>
            <h2 id="liga-next-round" className="text-2xl tracking-tight mb-1">
              {cardRounds.length === 1
                ? `${t("football.matchday")} ${cardRounds[0]}`
                : locale === "en"
                  ? `Matchdays ${cardRounds.slice(0, -1).join(", ")} and ${cardRounds[cardRounds.length - 1]}`
                  : `Jornadas ${cardRounds.slice(0, -1).join(", ")} e ${cardRounds[cardRounds.length - 1]}`}
              {cardSpan ? ` · ${cardSpan}` : ""}
            </h2>
            <p className="text-sm text-stone-500 mb-6 max-w-3xl">
              {locale === "en"
                ? "In kickoff order, Lisbon time. Under each match, the club whose title or relegation chances its result moves most, and the gap between that club's best and worst of the three results, in percentage points."
                : "Por ordem de início, hora de Lisboa. Em cada jogo, o clube cujas hipóteses de título ou de despromoção o resultado mais mexe, e a distância entre o melhor e o pior dos três resultados para esse clube, em pontos percentuais."}
            </p>
            <MatchdayPredictions fixtures={fixtureCards} locale={locale} forecastTimestamp={prediction.timestamp} />
          </div>
        </section>
      )}

      {/* League Table */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-2xl tracking-tight mb-1">
            {t("football.predictedStandings")}
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            {t("football.standingsDescription", {
              count: simsLabel,
            })}
          </p>
          <LeagueTable
            data={prediction.table}
            actualStandings={prediction.actual_standings}
            deltas={prediction.matchday_results?.length ? deltas : undefined}
            intervals={
              Object.keys(pointsIntervals).length ? pointsIntervals : undefined
            }
            nSims={prediction.n_sims}
            model={prediction.model}
            calibration={scorecard?.calibration ?? null}
            previousMatchday={prediction.matchday > 1 ? prediction.matchday - 1 : undefined}
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
              <DataCard
                className="mt-10"
                title={t("football.luckIndex")}
                subtitle={t("football.luckIndexDescription")}
                source={t("football.xgAttribution")}
                updated={updatedLine}
                methodologyHref="/desporto/liga/metodologia"
                methodologyLabel={methodLabel}
                locale={locale}
              >
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
              </DataCard>
            );
          })()}
        </div>
      </section>

      {/* Title Race */}
      {historical.length > 1 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-2xl tracking-tight mb-1">
              {t("football.titleRace")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.titleRaceDescription")}
            </p>
            <DataCard
              title={locale === "pt" ? "Probabilidade de ser campeão, jornada a jornada" : "Chance of the title, matchday by matchday"}
              subtitle={locale === "pt"
                ? "Uma linha por clube que já passou de 1%. Cada ponto é a previsão publicada depois dessa jornada."
                : "One line per club that has been above 1%. Each point is the forecast published after that matchday."}
              source={sourceLine}
              updated={updatedLine}
              methodologyHref="/desporto/liga/metodologia"
              methodologyLabel={methodLabel}
              locale={locale}
            >
              <TitleRaceChart
                historical={probabilities}
                yAxisLabel={t("football.championPercent")}
                caveat={<>
                  {t("football.titleCalibrationCaveat")}{" "}
                  <Link
                    href={locale === "pt"
                      ? "/desporto/liga/metodologia#as-probabilidades-de-titulo-estao-calibradas"
                      : "/desporto/liga/metodologia#are-the-title-probabilities-calibrated"}
                    locale={locale}
                    className="font-medium text-ink underline underline-offset-4"
                  >
                    {locale === "pt" ? "Como o verificámos" : "How we checked"}
                  </Link>
                </>}
              />
            </DataCard>
          </div>
        </section>
      )}

      {/* Relegation Battle — defaults to the highest-risk club plus a few
          comparisons; "todas as equipas" stays one click away. */}
      {historical.length > 1 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-2xl tracking-tight mb-1">
              {t("football.relegationBattle")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.relegationBattleDescription")}
            </p>
            <DataCard
              title={locale === "pt" ? "Probabilidade de despromoção, jornada a jornada" : "Chance of relegation, matchday by matchday"}
              subtitle={locale === "pt"
                ? "Despromoção é acabar em 17.º ou 18.º; o 16.º vai ao play-off e não conta aqui."
                : "Relegation means finishing 17th or 18th; 16th goes to a play-off and is not counted here."}
              source={sourceLine}
              updated={updatedLine}
              methodologyHref="/desporto/liga/metodologia"
              methodologyLabel={methodLabel}
              locale={locale}
            >
              <RelegationChart historical={probabilities} yAxisLabel={t("football.relegationPercent")} />
            </DataCard>
          </div>
        </section>
      )}

      {/* Team Strength Ratings */}
      {prediction.team_strengths && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-2xl tracking-tight mb-1">
              {t("football.teamStrengths")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("football.teamStrengthsDescription")}
            </p>
            <DataCard
              title={locale === "pt" ? "Ataque e defesa estimados" : "Estimated attack and defence"}
              source={sourceLine}
              updated={updatedLine}
              methodologyHref="/desporto/liga/metodologia"
              methodologyLabel={methodLabel}
              locale={locale}
            >
              <TeamStrengthRatings
                strengths={prediction.team_strengths}
                labels={{
                  attack: t("football.attack"),
                  defense: t("football.defense"),
                  worse: t("football.worse"),
                  better: t("football.better"),
                }}
              />
            </DataCard>
          </div>
        </section>
      )}

      {/* Specialist follow-ups — the simulator is a follow-up question, not
          the primary task (diagnosis §5/9/12: the hero's main action is the
          club chooser; reading the outlook comes first). */}
      {scenarios?.next_matchday_scenarios && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Link
              href="/desporto/liga/simulador"
              locale={locale}
              className="block rounded-2xl border border-line bg-cream hover:bg-parchment transition-colors duration-150 p-4 md:p-5 group"
            >
              <div className="flex items-start gap-3">
                <SlidersHorizontal aria-hidden="true" className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-stone-900">{t("football.simulator")}</h3>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {t("football.simulatorCta")}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink underline underline-offset-4 inline-flex items-center gap-1 flex-shrink-0 mt-0.5">
                  {t("football.trySimulator")}
                  <ArrowRight aria-hidden="true" className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/desporto/liga/jogo-previsoes"
            locale={locale}
            className="block rounded-2xl border border-line bg-cream hover:bg-parchment transition-colors duration-150 p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <Gamepad2 aria-hidden="true" className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-stone-900">
                  {locale === "en" ? "Beat the model" : "Contra o Modelo"}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {locale === "en"
                    ? "Call the next matchday before it kicks off and get scored against the model, all season long."
                    : "Prevê a próxima jornada antes de começar e compara-te com o modelo, a época inteira."}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink underline underline-offset-4 inline-flex items-center gap-1 flex-shrink-0 mt-0.5">
                {locale === "en" ? "Play" : "Jogar"}
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Written analysis about the league. Above the model block, which is this
          page's closing furniture — an about paragraph and five links out. */}
      <SectionNotes
        section="football"
        locale={locale}
        className="border-b border-stone-200"
        containerClassName="max-w-7xl mx-auto px-4 py-10"
      />

      {/* Model Info */}
      {/* The last section: the footer draws the rule (UXD-10). */}
      <section>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-2xl tracking-tight mb-3">
            {t("football.modelInfo")}
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
            {t("football.modelDescription", {
              count: simsLabel,
            })}
          </p>

          {/* Model vs Market — evaluation against the closing line */}
          <Link
            href="/desporto/liga/modelo"
            locale={locale}
            className="mt-6 block rounded-2xl border border-line bg-cream hover:bg-parchment transition-colors duration-150 p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <Scale aria-hidden="true" className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-stone-900">
                  {locale === "en" ? "Model vs market" : "Modelo vs mercado"}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {scorecardCard}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink underline underline-offset-4 inline-flex items-center gap-1 flex-shrink-0 mt-0.5">
                {locale === "en" ? "See the scorecard" : "Ver a avaliação"}
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* 2025-26 season review — the finished season, with xG hindsight */}
          <Link
            href="/desporto/liga/2025-26"
            locale={locale}
            className="mt-4 block rounded-2xl border border-line bg-cream hover:bg-parchment transition-colors duration-150 p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <History aria-hidden="true" className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-stone-900">
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
              <span className="text-sm font-semibold text-ink underline underline-offset-4 inline-flex items-center gap-1 flex-shrink-0 mt-0.5">
                {locale === "en" ? "Read the review" : "Ver a revisão"}
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Players — the per-position ratings hub */}
          <Link
            href="/desporto/liga/jogadores"
            locale={locale}
            className="mt-4 block rounded-2xl border border-line bg-cream hover:bg-parchment transition-colors duration-150 p-4 md:p-5 group"
          >
            <div className="flex items-start gap-3">
              <Users aria-hidden="true" className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-stone-900">
                  {locale === "en" ? "The players, measured honestly" : "Os jogadores, medidos com honestidade"}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">
                  {locale === "en"
                    ? "Finishing, attacking contribution, contested possession, goalkeeping — one metric per dimension, each with its own scale and its own uncertainty, and no fake overall score."
                    : "Finalização, contribuição ofensiva, posse disputada, guarda-redes — uma métrica por dimensão, cada uma com a sua escala e a sua incerteza, sem nota global inventada."}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink underline underline-offset-4 inline-flex items-center gap-1 flex-shrink-0 mt-0.5">
                {locale === "en" ? "See the players" : "Ver os jogadores"}
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </span>
            </div>
          </Link>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/desporto/liga/metodologia"
              locale={locale}
              className="text-sm font-medium text-ink underline underline-offset-4 inline-flex items-center gap-1 group"
            >
              {t("football.methodology")}
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </Link>
            <Link
              href="/desporto/liga/dados"
              locale={locale}
              className="text-sm font-medium text-ink underline underline-offset-4 inline-flex items-center gap-1 group"
            >
              {locale === "en" ? "Open forecast data" : "Dados abertos das previsões"}
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
