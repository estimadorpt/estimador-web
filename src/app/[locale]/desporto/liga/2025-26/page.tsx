import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createPageMetadata, siteTitle } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { loadSeasonReview } from "@/lib/utils/football-data-loader";
import {
  FinalTable,
  ReportCard,
  TitleRaceEvolution,
} from "@/components/charts/football/SeasonReview";
import { LuckIndex } from "@/components/charts/football/LuckIndex";
import type { LuckEntry } from "@/components/charts/football/LuckIndex";
import { teamDisplayName } from "@/lib/config/football";
import { formatLongDate } from "@/lib/football-format";
import { matchdayListPhrase, modelPlainName } from "@/lib/football-model-evaluation";
import { forecastProvenance, type ForecastStamp } from "@/lib/season-review-provenance";
import type { Metadata } from "next";
import { setRequestLocale } from '@/i18n/request-locale';

const SEASON = "2025-26";

/** Each archived forecast file's matchday, timestamp and model. */
async function loadForecastStamps(season: string): Promise<ForecastStamp[]> {
  try {
    const dir = path.join(process.cwd(), "public", "data", "football", `liga-${season}`);
    const files = (await readdir(dir)).filter((f) => /^md\d+\.json$/.test(f));
    return await Promise.all(
      files.map(async (f) => {
        const d = JSON.parse(await readFile(path.join(dir, f), "utf8"));
        return {
          matchday: typeof d.matchday === "number" ? d.matchday : Number(f.slice(2, -5)),
          timestamp: typeof d.timestamp === "string" ? d.timestamp : null,
          model: typeof d.model === "string" ? d.model : null,
        };
      }),
    );
  } catch {
    return [];
  }
}

const copy = {
  pt: {
    title: "Liga Portugal 2025-26: a época em revista",
    shortTitle: "Época 2025-26",
    description:
      "O FC Porto foi campeão com 88 pontos, o Sporting marcou 89 golos e o Benfica não perdeu. A época 2025-26 revista com o xG e as previsões do modelo.",
    back: "Liga Portugal",
    kicker: "Revisão da época",
    unavailable: "Dados da época 2025-26 indisponíveis.",
    standfirstA:
      "O FC Porto foi campeão da Liga Portugal 2025-26 com 88 pontos: 28 vitórias, quatro empates, duas derrotas. Atrás dele ficaram duas equipas com histórias estranhas. O Sporting marcou 89 golos — mais 23 do que o campeão — e fechou a época com a melhor diferença de golos da liga, +65, para terminar a seis pontos. O Benfica atravessou 34 jornadas sem perder um único jogo e ficou em terceiro, com 11 empates a pesar mais do que qualquer derrota.",
    standfirstB:
      "Em baixo, o Tondela e o AVS desceram. Esta página junta três coisas: a classificação final, o que o xG diz sobre quem mereceu o que teve, e o que o modelo anterior dizia ao longo da época — incluindo o que disse mal.",
    tableTitle: "Classificação final",
    tableIntro:
      "Os 306 jogos da época, com os pontos esperados (xPts) calculados a partir do xG de cada jogo. A última coluna é a diferença entre os pontos reais e os esperados.",
    luckTitle: "Quem fez mais pontos do que o xG dizia?",
    luckIntro:
      "Para cada jogo, o xG das duas equipas é convertido em probabilidades de vitória, empate e derrota, e daí em pontos esperados. Somando a época inteira, fica claro quem converteu melhor do que as suas oportunidades sugeriam — e quem foi castigado.",
    luckNote:
      "Pts − xPts não é uma separação limpa entre sorte e talento: mistura a eficácia de quem remata, as defesas do guarda-redes e o acaso. Finalizar bem é uma competência; a questão é quanto dela se repete no ano seguinte.",
    raceTitle: "A corrida ao título, jornada a jornada",
    raceIntro:
      "A probabilidade de título que o modelo anterior atribuiu em cada previsão, cada uma com 50 mil épocas simuladas.",
    reportTitle: "O boletim do modelo",
    reportIntro: "A parte que interessa: o modelo acertou no quê, e falhou no quê.",
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
      "FC Porto won with 88 points, Sporting scored 89 goals and Benfica never lost. The 2025-26 season reviewed with xG and the model's forecasts.",
    back: "Liga Portugal",
    kicker: "Season review",
    unavailable: "2025-26 season data unavailable.",
    standfirstA:
      "FC Porto won Liga Portugal 2025-26 with 88 points: 28 wins, four draws, two defeats. Behind them sat two teams with strange seasons. Sporting scored 89 goals — 23 more than the champions — and finished with the best goal difference in the league, +65, six points back. Benfica went all 34 matchdays without losing once and finished third, 11 draws costing them more than any defeat could have.",
    standfirstB:
      "At the bottom, Tondela and AVS went down. This page puts together three things: the final table, what xG says about who deserved what they got, and what the previous model was saying through the season — including what it got wrong.",
    tableTitle: "Final table",
    tableIntro:
      "All 306 matches, with expected points (xPts) computed from each match's xG. The last column is the gap between real and expected points.",
    luckTitle: "Who took more points than their xG said?",
    luckIntro:
      "For every match, both teams' xG is turned into win, draw and loss probabilities, and from there into expected points. Summed over the season, it shows who converted better than their chances suggested — and who was punished.",
    luckNote:
      "Pts − xPts is not a clean split between luck and skill: it mixes finishing, goalkeeping and chance. Finishing well is a skill; the open question is how much of it repeats next year.",
    raceTitle: "The title race, matchday by matchday",
    raceIntro:
      "The championship probability the previous model assigned at each forecast, each one 50,000 simulated seasons.",
    reportTitle: "The model's report card",
    reportIntro: "The part that matters: what the model got right, and what it got wrong.",
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
  setRequestLocale(locale);
  const c = locale === "en" ? copy.en : copy.pt;
  return createPageMetadata({
    locale,
    path: `/desporto/liga/2025-26`,
    title: siteTitle(c.title),
    description: c.description,
  });
}

export default async function SeasonReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== "en";
  const c = pt ? copy.pt : copy.en;
  const [review, stamps] = await Promise.all([loadSeasonReview(SEASON), loadForecastStamps(SEASON)]);
  const prov = forecastProvenance(stamps);

  if (!review) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
          <PageHero
            measure="wide"
            compact
            back={{ href: "/desporto/liga", label: c.back, locale }}
            eyebrow={c.kicker}
            title={c.title}
            lede={c.unavailable}
          />
        </main>
        <SiteFooter locale={locale} />
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
  // Which forecasts were published at the time and which were generated
  // afterwards in one batch, read from the files' own timestamps (F-H3).
  const inReview = new Set(review.forecast_matchdays);
  const published = prov.published.filter((md) => inReview.has(md));
  const reconstructed = prov.reconstructed.filter((md) => inReview.has(md));
  const batchDate = prov.reconstructedOn ? formatLongDate(prov.reconstructedOn, locale) : null;
  const model = prov.models.length === 1 ? modelPlainName(prov.models[0], locale) : null;
  const mdPhrase = (mds: number[]) =>
    pt
      ? `${mds.length === 1 ? "jornada" : "jornadas"} ${matchdayListPhrase(mds, locale)}`
      : `matchday${mds.length === 1 ? "" : "s"} ${matchdayListPhrase(mds, locale)}`;
  const provenance = pt
    ? [
        `Foram ${review.forecast_matchdays.length} previsões, todas d${model ?? "o modelo anterior"}.`,
        published.length
          ? `As ${published.length} das ${mdPhrase(published)} foram publicadas na altura, depois de cada jornada.`
          : "",
        reconstructed.length
          ? `As ${reconstructed.length} das ${mdPhrase(reconstructed)} nunca foram publicadas na altura: foram geradas depois, num só lote${batchDate ? `, a ${batchDate}` : ""}. Os ficheiros não registam com que jogos cada uma foi ajustada, por isso lê-as como reconstituições, não como previsões feitas na altura.`
          : "",
      ].filter(Boolean)
    : [
        `There were ${review.forecast_matchdays.length} forecasts, all from ${model ?? "the previous model"}.`,
        published.length
          ? `The ${published.length} for ${mdPhrase(published)} were published at the time, after each matchday.`
          : "",
        reconstructed.length
          ? `The ${reconstructed.length} for ${mdPhrase(reconstructed)} were never published at the time: they were generated afterwards, in one batch${batchDate ? `, on ${batchDate}` : ""}. The files do not record which matches each one was fitted on, so read them as reconstructions, not as forecasts made at the time.`
          : "",
      ].filter(Boolean);

  // Biggest final-points miss at the last published forecast, computed from
  // the same numbers the report card uses — no hand-written claims.
  const nf = (v: number, d = 1) =>
    v.toLocaleString(pt ? "pt-PT" : "en-GB", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="wide"
        compact
        back={{ href: "/desporto/liga", label: c.back, locale }}
        eyebrow={c.kicker}
        title={c.title}
        lede={c.standfirstA}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-5xl">
        <p className="max-w-3xl mb-10 text-lg text-stone-800 leading-relaxed font-medium">
          {c.standfirstB}
        </p>

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
            <div key={kpi.label} className="bg-cream p-4">
              <div className="text-3xl font-display font-extrabold text-stone-900 tabular-nums">
                {kpi.value}
              </div>
              <div className="text-xs text-stone-500 mt-1 leading-snug">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Final table */}
        <section className="mb-14">
          <h2 className="text-2xl tracking-tight mb-1">{c.tableTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.tableIntro}</p>
          <FinalTable data={review} locale={locale} />
        </section>

        {/* Luck index */}
        <section className="mb-14">
          <h2 className="text-2xl tracking-tight mb-1">{c.luckTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.luckIntro}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="border-t-2 border-emerald-700 pt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                {pt ? "Mais acima do xG" : "Furthest above xG"}
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
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                {pt ? "Mais abaixo do xG" : "Furthest below xG"}
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
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
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
            locale={pt ? "pt" : "en"}
            labels={{
              overperforming: pt ? "Acima do esperado" : "Above expectation",
              underperforming: pt ? "Abaixo do esperado" : "Below expectation",
              pointsShort: pt ? "pts reais" : "real pts",
              expectedShort: pt ? "esperados" : "expected",
            }}
          />
          <p className="text-xs text-stone-500 mt-4 max-w-3xl border-l-2 border-stone-200 pl-4">
            {c.luckNote}
          </p>
        </section>

        {/* Title race evolution */}
        <section className="mb-14">
          <h2 className="text-2xl tracking-tight mb-1">{c.raceTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.raceIntro}</p>
          <TitleRaceEvolution
            race={review.title_race}
            totalMatchdays={review.matchdays}
            locale={locale}
            reconstructed={reconstructed}
            outcomeLabel={
              pt
                ? `As previsões param na jornada ${lastForecast}: as últimas ${review.matchdays - lastForecast} jornadas nunca foram simuladas. O ${teamDisplayName(review.champion)} foi campeão.`
                : `The forecasts stop at matchday ${lastForecast}: the last ${review.matchdays - lastForecast} rounds were never simulated. ${teamDisplayName(review.champion)} won the title.`
            }
          />
        </section>

        {/* Report card */}
        {rc && (
          <section className="mb-14">
            <h2 className="text-2xl tracking-tight mb-1">{c.reportTitle}</h2>
            <p className="text-sm text-stone-500 mb-3 max-w-3xl">{c.reportIntro}</p>
            <div className="mb-6 max-w-3xl space-y-2 rounded-2xl border border-line bg-cream px-4 py-3 text-sm leading-relaxed text-stone-700">
              {provenance.map((line) => <p key={line.slice(0, 32)}>{line}</p>)}
              <p>
                {pt ? "O modelo que publica as previsões de 2026-27 é outro, e é avaliado em " : "The model publishing the 2026-27 forecasts is a different one, evaluated on "}
                <Link href="/desporto/liga/modelo" locale={locale} className="text-ink underline underline-offset-4">
                  {pt ? "modelo vs mercado" : "model vs market"}
                </Link>
                .
              </p>
            </div>
            <ReportCard data={review} locale={locale} reconstructed={reconstructed} />

            <div className="mt-8 border-l-2 border-stone-300 pl-4 max-w-3xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">
                {c.wrongTitle}
              </h3>
              <div className="text-sm text-stone-600 leading-relaxed space-y-3">
                {pt ? (
                  <>
                    <p>
                      O erro mais consistente foi o Arouca. Na previsão reconstituída
                      da jornada 16, o modelo projetava-o para 29,6 pontos finais e dava-lhe 33% de probabilidade
                      de descer; acabou com 42 pontos, em nono. Doze pontos de erro numa
                      única equipa — o maior da época — e um alarme de descida que nunca
                      se justificou.
                    </p>
                    <p>
                      O modelo também foi sistematicamente pessimista com o AVS: mesmo na
                      última previsão dava-lhe 15,6 pontos, e o AVS fez 21. Descer, desceu
                      — mas o modelo tinha-o como praticamente certo desde a previsão
                      reconstituída da jornada 8, uma confiança que uma só época não chega para justificar.
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
                      The most persistent error was Arouca. In the reconstructed
                      matchday 16 forecast, the model projected them to finish on 29.6 points and gave them a 33% chance
                      of relegation; they finished on 42, in ninth. Twelve points of error
                      on a single club — the largest of the season — and a relegation
                      alarm that never had grounds.
                    </p>
                    <p>
                      The model was also steadily too harsh on AVS: even in the final
                      forecast it had them on 15.6 points, and they made 21. Down they
                      went — but the model had treated it as settled since the
                      reconstructed matchday 8 forecast, a confidence one season is not enough to justify.
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
              ? `Classificação final a partir dos ${review.matches_played} jogos da época. Os xPts são calculados jogo a jogo com o método de Poisson agregado sobre o xG de cada equipa (${review.xg_matches_per_team} jogos por equipa, cobertura total), e não usam os parâmetros do modelo bayesiano — é uma leitura independente. ${published.length ? `As probabilidades das ${mdPhrase(published)} vêm dos ficheiros publicados na altura, tal como estavam, sem recálculo posterior.` : ""} ${reconstructed.length ? `As das ${mdPhrase(reconstructed)} foram geradas depois${batchDate ? `, a ${batchDate}` : ""}.` : ""} Todas vêm do modelo anterior. xG da SofaScore.`
              : `Final standings from the season's ${review.matches_played} matches. xPts are computed match by match with the aggregate Poisson method over each team's xG (${review.xg_matches_per_team} matches per team, full coverage), and do not use the Bayesian model's parameters — it is an independent read. ${published.length ? `The probabilities for ${mdPhrase(published)} come from the files published at the time, exactly as they stood, with no later recalculation.` : ""} ${reconstructed.length ? `Those for ${mdPhrase(reconstructed)} were generated afterwards${batchDate ? `, on ${batchDate}` : ""}.` : ""} All come from the previous model. xG from SofaScore.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/desporto/liga"
              locale={locale}
              className="text-sm font-medium text-ink underline underline-offset-4 inline-flex items-center gap-1 group"
            >
              {c.current}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/desporto/liga/dados"
              locale={locale}
              className="text-sm font-medium text-ink underline underline-offset-4 inline-flex items-center gap-1 group"
            >
              {c.data}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/desporto/liga/metodologia"
              locale={locale}
              className="text-sm font-medium text-ink underline underline-offset-4 inline-flex items-center gap-1 group"
            >
              {c.methodology}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
