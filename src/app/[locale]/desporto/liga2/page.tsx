import { Header } from "@/components/Header";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, TriangleAlert } from "lucide-react";
import { loadLiga2 } from "@/lib/utils/football-data-loader";
import {
  Liga2Caveats,
  Liga2FinalTable,
  Liga2ProbabilityTable,
  Liga2PromotionRace,
  Liga2Strengths,
} from "@/components/charts/football/Liga2Table";
import { liga2DisplayName } from "@/lib/config/football";
import type { Metadata } from "next";

const copy = {
  pt: {
    kicker: "Liga Portugal 2",
    title: "A Liga 2 em probabilidades",
    description:
      "Uma tabela probabilística da Liga Portugal 2: probabilidades de subida, de descida e de posição final, a partir de um modelo Poisson hierárquico ajustado a seis épocas do segundo escalão. Modelo mais leve do que o da Primeira Liga — só golos, sem xG nem valores de mercado.",
    back: "Liga Portugal",
    unavailable: "Dados da Liga 2 indisponíveis de momento.",
    lighterLabel: "Modelo ligeiro",
    lighterBlurb:
      "Este não é o modelo da Primeira Liga. A Liga 2 dá-nos golos e mais nada — sem remates à baliza, sem xG, sem valores de plantel — por isso corre aqui a versão base: um Poisson hierárquico ajustado só a resultados.",
    tableTitle: "Classificação final",
    strengthsTitle: "Quem era realmente bom",
    strengthsIntro:
      "Ataque e defesa estimados a partir dos 306 jogos da época, já descontado o adversário e o fator casa. É a leitura do modelo sobre a época inteira, não sobre a forma final.",
    raceTitle: "A corrida à subida, vista de dentro",
    caveatsTitle: "O que este modelo não tem",
    caveatsIntro:
      "A parte que interessa antes de acreditar num número. Escrito pelo próprio exportador de dados, não à mão.",
    checkpointTitle: "A tabela probabilística, jornada a jornada",
    checkpointIntro:
      "Cada bloco é um ajuste independente que só viu os jogos disputados até essa jornada, seguido de 50 mil simulações do resto da época. A última coluna mostra onde cada clube acabou por ficar.",
    matchdayLabel: (md: number) => `Jornada ${md}`,
    liveTitle: "A época em curso",
    methodology: "Como funciona o modelo",
    primeira: "Ver a Primeira Liga",
    footnote: "Notas técnicas",
  },
  en: {
    kicker: "Liga Portugal 2",
    title: "Liga 2 in probabilities",
    description:
      "A probabilistic table for Liga Portugal 2: promotion, relegation and final-position probabilities from a hierarchical Poisson model fitted to six seasons of the second tier. A lighter model than the Primeira Liga one — goals only, no xG and no squad values.",
    back: "Liga Portugal",
    unavailable: "Liga 2 data unavailable right now.",
    lighterLabel: "Lighter model",
    lighterBlurb:
      "This is not the Primeira Liga model. Liga 2 gives us goals and nothing else — no shots on target, no xG, no squad values — so what runs here is the base version: a hierarchical Poisson fitted to results alone.",
    tableTitle: "Final table",
    strengthsTitle: "Who was actually good",
    strengthsIntro:
      "Attack and defence estimated from the season's 306 matches, with opponent and home advantage already taken out. It is the model's read on the whole season, not on end-of-season form.",
    raceTitle: "The promotion race, from the inside",
    caveatsTitle: "What this model does not have",
    caveatsIntro:
      "The part worth reading before trusting a number. Written by the data exporter itself, not by hand.",
    checkpointTitle: "The probabilistic table, matchday by matchday",
    checkpointIntro:
      "Each block is an independent refit that saw only the matches played up to that matchday, followed by 50,000 simulations of the rest of the season. The last column shows where each club actually finished.",
    matchdayLabel: (md: number) => `Matchday ${md}`,
    liveTitle: "The season in progress",
    methodology: "How the model works",
    primeira: "See the Primeira Liga",
    footnote: "Technical notes",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = locale === "en" ? copy.en : copy.pt;
  return {
    title: `${c.title} | Estimador`,
    description: c.description,
    openGraph: { title: c.title, description: c.description, type: "article" },
    alternates: { canonical: `https://estimador.pt/${locale}/desporto/liga2` },
  };
}

export default async function Liga2Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pt = locale !== "en";
  const c = pt ? copy.pt : copy.en;
  const data = await loadLiga2();

  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-stone-500">
          <p>{c.unavailable}</p>
        </div>
      </div>
    );
  }

  const review = data.review;
  const live = data.live;
  const nSims = data.n_sims.toLocaleString(pt ? "pt-PT" : "en-GB");
  const totalMatches = data.history.reduce(
    (acc, h) => acc + h.final_table.reduce((a, r) => a + r.played, 0) / 2,
    0
  );

  // Everything the standfirst asserts is read off the payload, so the prose
  // cannot drift from the numbers when next season's file lands.
  const champion = review?.final_table[0];
  const runnerUp = review?.final_table[1];
  const third = review?.final_table[2];
  const firstCp = review?.checkpoints[0];
  const lastCp = review?.checkpoints[review.checkpoints.length - 1];
  const probAt = (cp: typeof firstCp, team: string | undefined) =>
    team === undefined
      ? null
      : (cp?.teams.find(t => t.team === team)?.p_promotion ?? null);
  const asPct = (v: number | null) =>
    v === null ? "—" : `${Math.round(v * 100)}%`;
  const missedOnGd =
    !!runnerUp && !!third && runnerUp.points === third.points;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href="/desporto/liga"
          locale={locale}
          className="text-sm text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {c.back}
        </Link>

        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
          {c.kicker}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {c.title}
        </h1>

        {/* Lighter-model label, stated before any number is shown */}
        <div className="border border-amber-200 bg-amber-50 p-4 mb-8 max-w-3xl">
          <div className="flex items-start gap-3">
            <TriangleAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-stone-900 mb-1">
                {c.lighterLabel} — {pt ? data.model_label.pt : data.model_label.en}
              </p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {c.lighterBlurb}
              </p>
            </div>
          </div>
        </div>

        {/* Status: review vs live, said plainly */}
        {data.status === "review" && review && (
          <div className="max-w-3xl space-y-4 mb-10">
            <p className="text-lg text-stone-600 leading-relaxed">
              {pt ? (
                <>
                  A época {data.target_season} da Liga 2 ainda não tem jogos nos
                  nossos dados, por isso esta página mostra a época{" "}
                  {review.season}, que terminou — e o que este modelo teria dito
                  enquanto ela decorria. Assim que as primeiras jornadas
                  entrarem, a tabela ao vivo aparece aqui, no mesmo formato.
                </>
              ) : (
                <>
                  The {data.target_season} Liga 2 season has no matches in our
                  data yet, so this page shows {review.season}, which is
                  finished — and what this model would have been saying while it
                  ran. As soon as the first matchdays land, the live table
                  appears here in the same format.
                </>
              )}
            </p>
            {champion && runnerUp && third && (
              <p className="text-lg text-stone-800 leading-relaxed font-medium">
                {pt ? (
                  <>
                    O {liga2DisplayName(champion.team)} subiu como campeão com{" "}
                    {champion.points} pontos.{" "}
                    {missedOnGd ? (
                      <>
                        A segunda vaga foi decidida na diferença de golos: o{" "}
                        {liga2DisplayName(runnerUp.team)} e o{" "}
                        {liga2DisplayName(third.team)} fecharam ambos com{" "}
                        {runnerUp.points} pontos, e a subida ficou para quem
                        tinha {runnerUp.gd > 0 ? "+" : ""}
                        {runnerUp.gd} contra {third.gd > 0 ? "+" : ""}
                        {third.gd}.
                      </>
                    ) : (
                      <>
                        Atrás dele subiu o {liga2DisplayName(runnerUp.team)},
                        com {runnerUp.points}.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {liga2DisplayName(champion.team)} went up as champions on{" "}
                    {champion.points} points.{" "}
                    {missedOnGd ? (
                      <>
                        The second slot came down to goal difference:{" "}
                        {liga2DisplayName(runnerUp.team)} and{" "}
                        {liga2DisplayName(third.team)} both finished on{" "}
                        {runnerUp.points} points, and promotion went to the one
                        with {runnerUp.gd > 0 ? "+" : ""}
                        {runnerUp.gd} against {third.gd > 0 ? "+" : ""}
                        {third.gd}.
                      </>
                    ) : (
                      <>
                        {liga2DisplayName(runnerUp.team)} came up behind them on{" "}
                        {runnerUp.points}.
                      </>
                    )}
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {/* Headline numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-200 border border-stone-200 mb-12">
          {[
            {
              value: totalMatches.toLocaleString(pt ? "pt-PT" : "en-GB"),
              label: pt
                ? `jogos da Liga 2 no modelo, em ${data.history.length} épocas`
                : `Liga 2 matches in the model, across ${data.history.length} seasons`,
            },
            {
              value: nSims,
              label: pt
                ? "épocas simuladas por cada previsão"
                : "seasons simulated for each forecast",
            },
            {
              value: `${data.rules.promotion_slots}`,
              label: pt
                ? "vagas de subida à Primeira Liga"
                : "promotion slots to the Primeira",
            },
            {
              value: `${data.rules.relegation_slots}`,
              label: pt ? "descidas à Liga 3" : "clubs relegated to Liga 3",
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white p-4">
              <div className="text-3xl font-black text-stone-900 tabular-nums">
                {kpi.value}
              </div>
              <div className="text-xs text-stone-500 mt-1 leading-snug">
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        {/* Live season, when the data has one */}
        {live && (
          <section className="mb-14">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {c.liveTitle} — {live.season}
            </h2>
            <p className="text-sm text-stone-500 mb-6 max-w-3xl">
              {pt
                ? `Jornada ${live.matchday}, com ${live.matches_remaining} jogos por disputar. Ajuste em ${live.training_matches} jogos das épocas ${live.seasons_fitted.join(", ")}.`
                : `Matchday ${live.matchday}, with ${live.matches_remaining} matches left. Fitted on ${live.training_matches} matches from ${live.seasons_fitted.join(", ")}.`}
            </p>
            <Liga2ProbabilityTable rows={live.teams} locale={locale} />
            <h3 className="text-lg font-bold tracking-tight mt-10 mb-4">
              {c.strengthsTitle}
            </h3>
            <Liga2Strengths rows={live.team_strengths} locale={locale} />
          </section>
        )}

        {review && (
          <>
            {/* Final table */}
            <section className="mb-14">
              <h2 className="text-xl font-bold tracking-tight mb-1">
                {c.tableTitle} — {review.season}
              </h2>
              <p className="text-sm text-stone-500 mb-6 max-w-3xl">
                {pt
                  ? `Os ${review.matches} jogos das ${review.matchdays} jornadas. Duas subidas, duas descidas.`
                  : `All ${review.matches} matches over ${review.matchdays} matchdays. Two up, two down.`}
              </p>
              <Liga2FinalTable
                rows={review.final_table}
                locale={locale}
                promotionSlots={data.rules.promotion_slots}
                relegationSlots={data.rules.relegation_slots}
              />
            </section>

            {/* Promotion race across checkpoints */}
            {review.checkpoints.length > 1 && (
              <section className="mb-14">
                <h2 className="text-xl font-bold tracking-tight mb-1">
                  {c.raceTitle}
                </h2>
                <p className="text-sm text-stone-500 mb-6 max-w-3xl">
                  {pt ? (
                    <>
                      À jornada {firstCp?.matchday} o modelo dava{" "}
                      {asPct(probAt(firstCp, champion?.team))} de subida ao{" "}
                      {liga2DisplayName(champion?.team ?? "")} e{" "}
                      {asPct(probAt(firstCp, runnerUp?.team))} ao{" "}
                      {liga2DisplayName(runnerUp?.team ?? "")}. À jornada{" "}
                      {lastCp?.matchday} já eram{" "}
                      {asPct(probAt(lastCp, champion?.team))} e{" "}
                      {asPct(probAt(lastCp, runnerUp?.team))}. É assim que uma
                      corrida se fecha — devagar, e depois de repente.
                    </>
                  ) : (
                    <>
                      At matchday {firstCp?.matchday} the model gave{" "}
                      {liga2DisplayName(champion?.team ?? "")}{" "}
                      {asPct(probAt(firstCp, champion?.team))} and{" "}
                      {liga2DisplayName(runnerUp?.team ?? "")}{" "}
                      {asPct(probAt(firstCp, runnerUp?.team))}. By matchday{" "}
                      {lastCp?.matchday} those were{" "}
                      {asPct(probAt(lastCp, champion?.team))} and{" "}
                      {asPct(probAt(lastCp, runnerUp?.team))}. That is how a
                      race closes — slowly, and then all at once.
                    </>
                  )}
                </p>
                <Liga2PromotionRace
                  checkpoints={review.checkpoints}
                  locale={locale}
                />
              </section>
            )}

            {/* Checkpoint tables */}
            <section className="mb-14">
              <h2 className="text-xl font-bold tracking-tight mb-1">
                {c.checkpointTitle}
              </h2>
              <p className="text-sm text-stone-500 mb-6 max-w-3xl">
                {c.checkpointIntro}
              </p>
              <div className="space-y-10">
                {review.checkpoints.map(cp => (
                  <div key={cp.matchday}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                      <h3 className="text-base font-bold text-stone-900">
                        {c.matchdayLabel(cp.matchday)}
                      </h3>
                      <span className="text-xs text-stone-400 tabular-nums">
                        {pt
                          ? `${cp.matches_played} jogos vistos, ${cp.matches_remaining} simulados`
                          : `${cp.matches_played} matches seen, ${cp.matches_remaining} simulated`}
                      </span>
                    </div>
                    <Liga2ProbabilityTable
                      rows={cp.teams}
                      locale={locale}
                      showFinalRank
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Team strengths */}
            <section className="mb-14">
              <h2 className="text-xl font-bold tracking-tight mb-1">
                {c.strengthsTitle}
              </h2>
              <p className="text-sm text-stone-500 mb-6 max-w-3xl">
                {c.strengthsIntro}
              </p>
              <Liga2Strengths rows={review.team_strengths} locale={locale} />
            </section>
          </>
        )}

        {/* Caveats */}
        <section className="mb-14">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            {c.caveatsTitle}
          </h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">
            {c.caveatsIntro}
          </p>
          <Liga2Caveats items={data.caveats} locale={locale} />
        </section>

        {/* Small print */}
        <section className="border-t border-stone-200 pt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
            {c.footnote}
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed max-w-3xl">
            {pt ? (
              <>
                Modelo Poisson hierárquico (Baio &amp; Blangiardo, 2010) com
                ataque e defesa por clube, vantagem caseira comum e restrição de
                soma zero, ajustado por MCMC. A subida é definida como acabar
                nos dois primeiros lugares; a descida, nos dois últimos. As
                equipas B jogam mas não podem subir, e a passagem da vaga ao
                clube seguinte não está simulada.{" "}
                {review &&
                  `Diagnóstico do ajuste da época: r̂ máximo ${review.strengths_convergence.max_rhat}, ESS mínimo ${review.strengths_convergence.min_ess_bulk}.`}
              </>
            ) : (
              <>
                Hierarchical Poisson model (Baio &amp; Blangiardo, 2010) with
                per-club attack and defence, a shared home advantage and a
                sum-to-zero constraint, fitted by MCMC. Promotion is defined as
                finishing in the top two, relegation as the bottom two. B teams
                play but cannot go up, and the slot passing to the next eligible
                club is not simulated.{" "}
                {review &&
                  `Season fit diagnostics: max r̂ ${review.strengths_convergence.max_rhat}, min ESS ${review.strengths_convergence.min_ess_bulk}.`}
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/desporto/liga"
              locale={locale}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {c.primeira}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/desporto/liga/metodologia"
              locale={locale}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {c.methodology}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
