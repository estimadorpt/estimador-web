import { Header } from "@/components/Header";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { loadSeasonReview } from "@/lib/utils/football-data-loader";
import {
  FinalTable,
  ReportCard,
  TitleRaceEvolution,
} from "@/components/charts/football/SeasonReview";
import { LuckIndex } from "@/components/charts/football/LuckIndex";
import type { LuckEntry } from "@/components/charts/football/LuckIndex";
import { teamDisplayName } from "@/lib/config/football";
import type { Metadata } from "next";

const SEASON = "2025-26";

const copy = {
  pt: {
    title: "Liga Portugal 2025-26: a época em revista",
    shortTitle: "Época 2025-26",
    description:
      "O FC Porto foi campeão com 88 pontos. O Sporting marcou 89 golos e teve a melhor diferença de golos da liga — e ficou em segundo. O Benfica não perdeu um jogo e ficou em terceiro. A época 2025-26 revista com os pontos esperados a partir do xG e com as previsões que o nosso modelo publicou ao longo do ano.",
    back: "Liga Portugal",
    kicker: "Revisão da época",
    unavailable: "Dados da época 2025-26 indisponíveis.",
    standfirstA:
      "O FC Porto foi campeão da Liga Portugal 2025-26 com 88 pontos: 28 vitórias, quatro empates, duas derrotas. Atrás dele ficaram duas equipas com histórias estranhas. O Sporting marcou 89 golos — mais 23 do que o campeão — e fechou a época com a melhor diferença de golos da liga, +65, para terminar a seis pontos. O Benfica atravessou 34 jornadas sem perder um único jogo e ficou em terceiro, com 11 empates a pesar mais do que qualquer derrota.",
    standfirstB:
      "Em baixo, o Tondela e o AVS desceram. Esta página junta três coisas: a classificação final, o que o xG diz sobre quem mereceu o que teve, e o que o nosso modelo foi dizendo enquanto a época decorria — incluindo o que disse mal.",
    tableTitle: "Classificação final",
    tableIntro:
      "Os 306 jogos da época, com os pontos esperados (xPts) calculados a partir do xG de cada jogo. A coluna «Sorte» é a diferença entre os pontos reais e os esperados.",
    luckTitle: "Quem teve sorte",
    luckIntro:
      "Para cada jogo, o xG das duas equipas é convertido em probabilidades de vitória, empate e derrota, e daí em pontos esperados. Somando a época inteira, fica claro quem converteu melhor do que as suas oportunidades sugeriam — e quem foi castigado.",
    luckNote:
      "O xG é uma medida da qualidade das oportunidades, não um veredicto moral. Finalizar bem é uma competência; a questão é quanto dela se repete no ano seguinte.",
    raceTitle: "A corrida ao título, jornada a jornada",
    raceIntro:
      "A probabilidade de título que o modelo atribuiu em cada previsão publicada. Cada ponto é uma simulação de 50 mil épocas feita nessa altura, sem conhecimento do futuro.",
    reportTitle: "O boletim do modelo",
    reportIntro:
      "A parte que interessa: o modelo acertou no quê, e falhou no quê. Foram 19 previsões publicadas entre a jornada 4 e a 31.",
    wrongTitle: "Onde falhámos",
    creditsTitle: "A letra pequena",
    methodology: "Como funciona o modelo",
    current: "Ver a época atual",
    data: "Dados abertos",
  },
  en: {
    title: "Liga Portugal 2025-26: the season reviewed",
    shortTitle: "2025-26 season",
    description:
      "FC Porto won the title with 88 points. Sporting scored 89 goals and had the best goal difference in the league — and finished second. Benfica did not lose a match and finished third. The 2025-26 season reviewed with expected points from xG and with the forecasts our model published as it happened.",
    back: "Liga Portugal",
    kicker: "Season review",
    unavailable: "2025-26 season data unavailable.",
    standfirstA:
      "FC Porto won Liga Portugal 2025-26 with 88 points: 28 wins, four draws, two defeats. Behind them sat two teams with strange seasons. Sporting scored 89 goals — 23 more than the champions — and finished with the best goal difference in the league, +65, six points back. Benfica went all 34 matchdays without losing once and finished third, 11 draws costing them more than any defeat could have.",
    standfirstB:
      "At the bottom, Tondela and AVS went down. This page puts together three things: the final table, what xG says about who deserved what they got, and what our model was saying while the season ran — including what it got wrong.",
    tableTitle: "Final table",
    tableIntro:
      "All 306 matches, with expected points (xPts) computed from each match's xG. The “Luck” column is the gap between real and expected points.",
    luckTitle: "Who got lucky",
    luckIntro:
      "For every match, both teams' xG is turned into win, draw and loss probabilities, and from there into expected points. Summed over the season, it shows who converted better than their chances suggested — and who was punished.",
    luckNote:
      "xG measures chance quality, not moral desert. Finishing well is a skill; the open question is how much of it repeats next year.",
    raceTitle: "The title race, matchday by matchday",
    raceIntro:
      "The championship probability the model assigned at each published forecast. Every point is a 50,000-season simulation run at that moment, with no knowledge of the future.",
    reportTitle: "The model's report card",
    reportIntro:
      "The part that matters: what the model got right, and what it got wrong. Nineteen forecasts were published between matchday 4 and matchday 31.",
    wrongTitle: "Where we were wrong",
    creditsTitle: "The small print",
    methodology: "How the model works",
    current: "See the current season",
    data: "Open data",
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
    openGraph: {
      title: c.title,
      description: c.description,
      type: "article",
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/desporto/liga/${SEASON}`,
    },
  };
}

export default async function SeasonReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pt = locale !== "en";
  const c = pt ? copy.pt : copy.en;
  const review = await loadSeasonReview(SEASON);

  if (!review) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-stone-500">
          <p>{c.unavailable}</p>
        </div>
      </div>
    );
  }

  const luckEntries: LuckEntry[] = review.luck.map((r) => ({
    team: r.team,
    actualPts: r.points,
    expectedPts: r.xpts,
    delta: r.delta,
  }));

  const luckiest = review.overperformers[0];
  const unluckiest = review.underperformers[0];
  const bestFinishing = [...review.luck].sort((a, b) => b.finishing - a.finishing)[0];
  const rc = review.report_card;
  const lastForecast = review.forecast_matchdays[review.forecast_matchdays.length - 1];
  const firstForecast = review.forecast_matchdays[0];

  // Biggest final-points miss at the last published forecast, computed from
  // the same numbers the report card uses — no hand-written claims.
  const nf = (v: number, d = 1) =>
    v.toLocaleString(pt ? "pt-PT" : "en-GB", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });

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
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{c.title}</h1>
        <div className="max-w-3xl space-y-4 mb-10">
          <p className="text-lg text-stone-600 leading-relaxed">{c.standfirstA}</p>
          <p className="text-lg text-stone-800 leading-relaxed font-medium">
            {c.standfirstB}
          </p>
        </div>

        {/* Headline numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-200 border border-stone-200 mb-12">
          {[
            {
              value: `${review.table[0].points}`,
              label: pt
                ? `pontos do ${teamDisplayName(review.champion)}, campeão`
                : `points for champions ${teamDisplayName(review.champion)}`,
            },
            {
              value: `${review.table[1].gf}`,
              label: pt
                ? `golos do ${teamDisplayName(review.table[1].team)}, o melhor ataque — em segundo`
                : `goals for ${teamDisplayName(review.table[1].team)}, the best attack — in second`,
            },
            {
              value: `${review.table[2].drawn}`,
              label: pt
                ? `empates do ${teamDisplayName(review.table[2].team)}, que não perdeu um jogo`
                : `draws for ${teamDisplayName(review.table[2].team)}, who never lost a match`,
            },
            {
              value: `${nf(Math.abs(unluckiest.delta))}`,
              label: pt
                ? `pontos abaixo do esperado para o ${teamDisplayName(unluckiest.team)}, despromovido`
                : `points below expectation for relegated ${teamDisplayName(unluckiest.team)}`,
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white p-4">
              <div className="text-3xl font-black text-stone-900 tabular-nums">
                {kpi.value}
              </div>
              <div className="text-xs text-stone-500 mt-1 leading-snug">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Final table */}
        <section className="mb-14">
          <h2 className="text-xl font-bold tracking-tight mb-1">{c.tableTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.tableIntro}</p>
          <FinalTable data={review} locale={locale} />
        </section>

        {/* Luck index */}
        <section className="mb-14">
          <h2 className="text-xl font-bold tracking-tight mb-1">{c.luckTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.luckIntro}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="border-t-2 border-emerald-700 pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                {pt ? "O mais afortunado" : "The luckiest"}
              </div>
              <p className="text-sm text-stone-700 leading-relaxed">
                {pt ? (
                  <>
                    O <strong>{teamDisplayName(luckiest.team)}</strong> fez{" "}
                    {luckiest.points} pontos com um xG que valia{" "}
                    {nf(luckiest.xpts)} — <strong>{nf(luckiest.delta)}</strong> acima do
                    esperado, a maior diferença da liga. A tabela do xG punha o Sporting
                    em primeiro.
                  </>
                ) : (
                  <>
                    <strong>{teamDisplayName(luckiest.team)}</strong> took{" "}
                    {luckiest.points} points from an xG worth {nf(luckiest.xpts)} —{" "}
                    <strong>{nf(luckiest.delta)}</strong> above expectation, the largest
                    gap in the league. The xG table had Sporting first.
                  </>
                )}
              </p>
            </div>
            <div className="border-t-2 border-red-600 pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                {pt ? "O mais castigado" : "The unluckiest"}
              </div>
              <p className="text-sm text-stone-700 leading-relaxed">
                {pt ? (
                  <>
                    O <strong>{teamDisplayName(unluckiest.team)}</strong> desceu com{" "}
                    {unluckiest.points} pontos. O xG dava-lhe {nf(unluckiest.xpts)} —{" "}
                    {unluckiest.xpts_pos}.º lugar. Marcou {unluckiest.gf} golos a partir
                    de oportunidades que valiam {nf(unluckiest.xgf)}: a pior finalização
                    da liga, e a diferença entre a manutenção e a descida.
                  </>
                ) : (
                  <>
                    <strong>{teamDisplayName(unluckiest.team)}</strong> went down on{" "}
                    {unluckiest.points} points. xG gave them {nf(unluckiest.xpts)} —{" "}
                    {unluckiest.xpts_pos}th place. They scored {unluckiest.gf} goals from
                    chances worth {nf(unluckiest.xgf)}: the worst finishing in the league,
                    and the difference between staying up and going down.
                  </>
                )}
              </p>
            </div>
            <div className="border-t-2 border-stone-400 pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                {pt ? "A melhor finalização" : "The best finishing"}
              </div>
              <p className="text-sm text-stone-700 leading-relaxed">
                {pt ? (
                  <>
                    O <strong>{teamDisplayName(bestFinishing.team)}</strong> marcou{" "}
                    {bestFinishing.gf} golos a partir de {nf(bestFinishing.xgf)} de xG —{" "}
                    <strong>{bestFinishing.finishing > 0 ? "+" : ""}
                    {nf(bestFinishing.finishing)}</strong> golos acima do esperado. Não
                    chegou: o título decidiu-se em vitórias, e o Porto ganhou mais três.
                  </>
                ) : (
                  <>
                    <strong>{teamDisplayName(bestFinishing.team)}</strong> scored{" "}
                    {bestFinishing.gf} goals from {nf(bestFinishing.xgf)} xG —{" "}
                    <strong>{bestFinishing.finishing > 0 ? "+" : ""}
                    {nf(bestFinishing.finishing)}</strong> goals above expectation. It was
                    not enough: the title turned on wins, and Porto took three more.
                  </>
                )}
              </p>
            </div>
          </div>

          <LuckIndex
            entries={luckEntries}
            labels={{
              overperforming: pt ? "Acima do esperado" : "Above expectation",
              underperforming: pt ? "Abaixo do esperado" : "Below expectation",
            }}
          />
          <p className="text-xs text-stone-500 mt-4 max-w-3xl border-l-2 border-stone-200 pl-4">
            {c.luckNote}
          </p>
        </section>

        {/* Title race evolution */}
        <section className="mb-14">
          <h2 className="text-xl font-bold tracking-tight mb-1">{c.raceTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.raceIntro}</p>
          <TitleRaceEvolution
            race={review.title_race}
            totalMatchdays={review.matchdays}
            locale={locale}
            outcomeLabel={
              pt
                ? `As previsões publicadas param na jornada ${lastForecast} — as últimas três jornadas nunca foram simuladas. O ${teamDisplayName(review.champion)} foi campeão.`
                : `Published forecasts stop at matchday ${lastForecast} — the last three rounds were never simulated. ${teamDisplayName(review.champion)} won the title.`
            }
          />
        </section>

        {/* Report card */}
        {rc && (
          <section className="mb-14">
            <h2 className="text-xl font-bold tracking-tight mb-1">{c.reportTitle}</h2>
            <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.reportIntro}</p>
            <ReportCard data={review} locale={locale} />

            <div className="mt-8 border-l-2 border-stone-300 pl-4 max-w-3xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">
                {c.wrongTitle}
              </h3>
              <div className="text-sm text-stone-600 leading-relaxed space-y-3">
                {pt ? (
                  <>
                    <p>
                      O erro mais consistente foi o Arouca. Na jornada 16 o modelo
                      projetava-o para 29,6 pontos finais e dava-lhe 33% de probabilidade
                      de descer; acabou com 42 pontos, em nono. Doze pontos de erro numa
                      única equipa — o maior da época — e um alarme de descida que nunca
                      se justificou.
                    </p>
                    <p>
                      O modelo também foi sistematicamente pessimista com o AVS: mesmo na
                      última previsão dava-lhe 15,6 pontos, e o AVS fez 21. Descer, desceu
                      — mas o modelo tinha-o como praticamente certo desde a jornada 8,
                      uma confiança que uma só época não chega para justificar.
                    </p>
                    <p>
                      E há a tensão que esta página não resolve: o modelo lê resultados, e
                      os resultados diziam que o Porto era a melhor equipa. O xG diz que a
                      melhor equipa foi o Sporting. Ambos podem estar certos — só não ao
                      mesmo tempo.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      The most persistent error was Arouca. At matchday 16 the model
                      projected them to finish on 29.6 points and gave them a 33% chance
                      of relegation; they finished on 42, in ninth. Twelve points of error
                      on a single club — the largest of the season — and a relegation
                      alarm that never had grounds.
                    </p>
                    <p>
                      The model was also steadily too harsh on AVS: even in the final
                      forecast it had them on 15.6 points, and they made 21. Down they
                      went — but the model had treated it as settled since matchday 8, a
                      confidence one season is not enough to justify.
                    </p>
                    <p>
                      And there is a tension this page does not resolve: the model reads
                      results, and the results said Porto were the best team. xG says the
                      best team was Sporting. Both can be right — just not at once.
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Small print */}
        <section className="pt-8 border-t border-stone-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
            {c.creditsTitle}
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed max-w-3xl">
            {pt
              ? `Classificação final a partir dos ${review.matches_played} jogos da época. Os xPts são calculados jogo a jogo com o método de Poisson agregado sobre o xG de cada equipa (${review.xg_matches_per_team} jogos por equipa, cobertura total), e não usam os parâmetros do modelo bayesiano — é uma leitura independente. As probabilidades vêm dos ficheiros que publicámos entre as jornadas ${firstForecast} e ${lastForecast}, tal como estavam nessa altura, sem qualquer recálculo posterior. xG da SofaScore.`
              : `Final standings from the season's ${review.matches_played} matches. xPts are computed match by match with the aggregate Poisson method over each team's xG (${review.xg_matches_per_team} matches per team, full coverage), and do not use the Bayesian model's parameters — it is an independent read. The probabilities come from the files we published between matchdays ${firstForecast} and ${lastForecast}, exactly as they stood then, with no later recalculation. xG from SofaScore.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/desporto/liga"
              locale={locale}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {c.current}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/desporto/liga/dados"
              locale={locale}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {c.data}
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
