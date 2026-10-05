import { createPageMetadata, siteTitle } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { loadLigaData, loadLigaMarketScorecard } from "@/lib/utils/football-data-loader";
import { MarketScorecard } from "@/components/charts/football/MarketScorecard";
import type { MarketScorecardData } from "@/components/charts/football/MarketScorecard";
import {
  describeModel,
  evaluatesCurrentModel,
  marketSourcesPhrase,
  scorecardSeasonRange,
  verdictSentence,
} from "@/lib/football-scorecard";
import { formatDecimal, formatInteger, formatLongDate, formatSigned } from "@/lib/football-format";
import type { Metadata } from "next";
import { setRequestLocale } from '@/i18n/request-locale';

// Every count, range and verdict on this page is read from
// market_scorecard.json, and the evaluated model is named from its `model`
// field, so the page cannot describe a different model from the one it
// evaluated (site review FB-05, 5 October 2026).

function summary(
  sc: MarketScorecardData,
  forecastModel: string | null,
  locale: string,
) {
  const pt = locale !== "en";
  const range = scorecardSeasonRange(sc, locale);
  const sources = marketSourcesPhrase(sc.market_sources, locale);
  const shin = /shin/i.test(sc.market);
  const cps = sc.checkpoints.map((c) => c.checkpoint);
  const same = evaluatesCurrentModel(sc.model, forecastModel);
  const evaluated = describeModel(sc.model, locale);
  const current = forecastModel ? describeModel(forecastModel, locale) : null;
  const o = sc.overall;
  const overallLine = pt
    ? `No conjunto, a diferença é de ${formatSigned(o.delta, locale, 4)} com um erro padrão de ${formatDecimal(o.se, locale, 4)}. ${verdictSentence(o, locale, formatDecimal(o.t, locale, 2))}`
    : `Overall the gap is ${formatSigned(o.delta, locale, 4)} with a standard error of ${formatDecimal(o.se, locale, 4)}. ${verdictSentence(o, locale, formatDecimal(o.t, locale, 2))}`;
  const early = sc.phases.early;
  const late = sc.phases.mid_late;
  const phaseLine = pt
    ? `${early.label_pt}: ${verdictSentence(early, locale, formatDecimal(early.t, locale, 2))} ${late.label_pt}: ${verdictSentence(late, locale, formatDecimal(late.t, locale, 2))}`
    : `${early.label_en}: ${verdictSentence(early, locale, formatDecimal(early.t, locale, 2))} ${late.label_en}: ${verdictSentence(late, locale, formatDecimal(late.t, locale, 2))}`;

  const which = same
    ? pt
      ? `O modelo avaliado (${evaluated}) é o que produz as previsões publicadas neste site.`
      : `The evaluated model (${evaluated}) is the one producing the forecasts published on this site.`
    : pt
      ? `Esta avaliação é do modelo anterior (${evaluated}). As previsões publicadas vêm de ${current ?? "outro modelo"}, que ainda não passou por esta comparação com o mercado.`
      : `This evaluation is of the previous model (${evaluated}). The published forecasts come from ${current ?? "another model"}, which has not been through this comparison with the market yet.`;

  return {
    same,
    which,
    description: pt
      ? `Um modelo da Liga Portugal testado contra a linha de fecho do mercado em ${formatInteger(sc.n, locale)} jogos e ${sc.n_seasons} épocas (${range}). Modelo avaliado: ${sc.model}.`
      : `A Liga Portugal model tested against the market's closing line over ${formatInteger(sc.n, locale)} matches and ${sc.n_seasons} seasons (${range}). Model evaluated: ${sc.model}.`,
    verdict: pt
      ? `O resultado, em ${formatInteger(sc.n, locale)} jogos ao longo de ${sc.n_seasons} épocas (${range}). ${phaseLine} ${overallLine}`
      : `The result, over ${formatInteger(sc.n, locale)} matches across ${sc.n_seasons} seasons (${range}). ${phaseLine} ${overallLine}`,
    footnote: pt
      ? `Avaliação em ${formatInteger(sc.n, locale)} jogos: ${sc.n_seasons} épocas (${range}) × ${cps.length} jornadas de referência (${cps.join(", ")}). Em cada ponto o modelo é ajustado apenas com os jogos disputados até essa jornada e prevê a jornada seguinte, sem ver o futuro. As probabilidades do mercado derivam das cotações de fecho publicadas pela football-data.co.uk${sources ? ` (${sources})` : ""}${shin ? ", com a margem retirada pelo método de Shin" : ""}. Avaliação gerada a ${formatLongDate(sc.generated_at, locale)}.`
      : `Evaluated on ${formatInteger(sc.n, locale)} matches: ${sc.n_seasons} seasons (${range}) × ${cps.length} reference matchdays (${cps.join(", ")}). At each point the model is fitted only on matches played up to that matchday and forecasts the next one, without seeing the future. Market probabilities are derived from closing odds published by football-data.co.uk${sources ? ` (${sources})` : ""}${shin ? ", with the margin removed using Shin's method" : ""}. Evaluation generated on ${formatLongDate(sc.generated_at, locale)}.`,
  };
}

const copy = {
  pt: {
    title: "Modelo vs mercado",
    fallbackDescription: "O modelo da Liga Portugal comparado com a linha de fecho do mercado.",
    back: "Liga Portugal",
    kicker: "Avaliação do modelo",
    standfirstA:
      "Há uma pergunta a que qualquer modelo de futebol tem de responder antes de merecer atenção: é melhor do que a previsão implícita no mercado? A linha de fecho, o consenso do mercado imediatamente antes do apito inicial, é o padrão de referência em previsão desportiva, e fomos medir-nos contra ela. Não publicamos cotações nem sugestões de aposta: o mercado aparece aqui apenas como termo de comparação.",
    caveat:
      "Escrevemos isto com as barras de erro à vista: uma diferença menor do que duas vezes o seu erro padrão é compatível com um empate técnico, e lemo-la como tal.",
    unavailable: "Dados de avaliação indisponíveis.",
    evaluated: "Modelo avaliado",
    footnoteTitle: "A letra pequena",
    methodology: "Como funciona o modelo",
  },
  en: {
    title: "Model vs market",
    fallbackDescription: "The Liga Portugal model compared with the market's closing line.",
    back: "Liga Portugal",
    kicker: "Model evaluation",
    standfirstA:
      "There is one question any football model has to answer before it deserves attention: is it better than the forecast implied by the market? The closing line, the market consensus immediately before kick-off, is the reference standard in sports forecasting, and we measured ourselves against it. We publish no odds and no betting advice: the market appears here purely as a yardstick.",
    caveat:
      "We write this with the error bars in plain sight: a gap smaller than twice its standard error is consistent with a tie, and we read it as one.",
    unavailable: "Evaluation data unavailable.",
    evaluated: "Model evaluated",
    footnoteTitle: "The small print",
    methodology: "How the model works",
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
  const [scorecard, { prediction }] = await Promise.all([loadLigaMarketScorecard(), loadLigaData()]);
  return createPageMetadata({
    locale,
    path: `/desporto/liga/modelo`,
    title: siteTitle(`${c.title} · Liga Portugal`),
    description: scorecard
      ? summary(scorecard, prediction?.model ?? null, locale).description
      : c.fallbackDescription,
  });
}

export default async function LigaModelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = locale === "en" ? copy.en : copy.pt;
  const [scorecard, { prediction }] = await Promise.all([loadLigaMarketScorecard(), loadLigaData()]);
  const s = scorecard ? summary(scorecard, prediction?.model ?? null, locale) : null;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <PageHero
          width="5xl"
          compact
          back={{ href: "/desporto/liga", label: c.back, locale }}
          eyebrow={c.kicker}
          title={c.title}
          lede={c.standfirstA}
          meta={scorecard ? (
            <span>
              {c.evaluated}: <strong className="font-semibold text-ink">{describeModel(scorecard.model, locale)}</strong>
            </span>
          ) : undefined}
        />

        <div className="max-w-5xl mx-auto px-4 py-10">
          {s && (
            <div className="max-w-3xl space-y-4 mb-10">
              {!s.same && (
                <p className="text-base text-stone-800 leading-relaxed border-l-2 border-amber-400 pl-4">
                  {s.which}
                </p>
              )}
              <p className="text-lg text-stone-800 leading-relaxed font-medium">{s.verdict}</p>
              <p className="text-sm text-stone-500 leading-relaxed border-l-2 border-stone-200 pl-4">
                {c.caveat}
              </p>
            </div>
          )}

          {scorecard ? (
            <MarketScorecard data={scorecard} locale={locale} />
          ) : (
            <p className="text-stone-500 py-10">{c.unavailable}</p>
          )}

          <section className="mt-12 pt-8 border-t border-stone-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
              {c.footnoteTitle}
            </h2>
            {s && (
              <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
                {s.footnote} {s.which}
              </p>
            )}
            <div className="mt-5">
              <Link
                href="/desporto/liga/metodologia"
                locale={locale}
                className="text-sm font-medium text-ink underline underline-offset-4 inline-flex items-center gap-1"
              >
                {c.methodology}
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
