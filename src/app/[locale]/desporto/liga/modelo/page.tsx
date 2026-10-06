import { createPageMetadata, siteTitle } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { loadLigaData, loadLigaMarketScorecard } from "@/lib/utils/football-data-loader";
import { MarketScorecard } from "@/components/charts/football/MarketScorecard";
import type { MarketScorecardData } from "@/components/charts/football/MarketScorecard";
import {
  evaluatesCurrentModel,
  marketSourcesPhrase,
  scorecardSeasonRange,
} from "@/lib/football-scorecard";
import {
  gamesOfMatchdays,
  leadVerdictSentence,
  modelPlainName,
  pointsCalibrationSentence,
  predictedMatchday,
  selectionCaveat,
  titleCalibrationParagraphs,
} from "@/lib/football-model-evaluation";
import { CURRENT_LIGA_SEASON } from "@/lib/config/football";
import { formatInteger, formatLongDate } from "@/lib/football-format";
import type { Metadata } from "next";
import { setRequestLocale } from '@/i18n/request-locale';

// Every count, range and verdict on this page is read from
// market_scorecard.json, and the evaluated model is named from its `model`
// field, so the page cannot describe a different model from the one it
// evaluated (site review FB-05, 5 October 2026). Reader copy names the model
// in plain words; the codename stays on /dados (audit M-10, SP-16).

function summary(
  sc: MarketScorecardData,
  forecastModel: string | null,
  locale: string,
) {
  const pt = locale !== "en";
  const range = scorecardSeasonRange(sc, locale);
  const sources = marketSourcesPhrase(sc.market_sources, locale);
  const shin = /shin/i.test(sc.market);
  const mds = sc.checkpoints.map(predictedMatchday);
  const same = evaluatesCurrentModel(sc.model, forecastModel);
  const evaluated = modelPlainName(sc.model, locale);
  const current = forecastModel ? modelPlainName(forecastModel, locale) : null;
  // One sentence, from the same verdicts as the three cards below: the
  // cards are the one full statement of the result (audit MR2-18, UXD2-17).
  const lead = leadVerdictSentence(sc, locale);

  const which = same
    ? pt
      ? `O modelo avaliado é ${evaluated}, o que produz as previsões publicadas neste site.`
      : `The model evaluated is ${evaluated}, the one producing the forecasts published on this site.`
    : pt
      ? `Esta avaliação é de ${evaluated}. As previsões publicadas vêm de ${current ?? "outro modelo"}, que ainda não passou por esta comparação com o mercado.`
      : `This evaluation is of ${evaluated}. The published forecasts come from ${current ?? "another model"}, which has not been through this comparison with the market yet.`;

  return {
    same,
    which,
    lead,
    intro: pt
      ? `Em ${formatInteger(sc.n, locale)} jogos ao longo de ${sc.n_seasons} épocas (${range}): ${lead.charAt(0).toLowerCase()}${lead.slice(1)}`
      : `Over ${formatInteger(sc.n, locale)} matches across ${sc.n_seasons} seasons (${range}): ${lead.charAt(0).toLowerCase()}${lead.slice(1)}`,
    // What the page finds, not a claim the model is "à frente" anywhere
    // (audit FA2-09): the verdicts come from the file.
    description: pt
      ? `Modelo vs linha de fecho do mercado, ${formatInteger(sc.n, locale)} jogos: ${lead.charAt(0).toLowerCase()}${lead.slice(1)}`
      : `Model vs the market's closing line, ${formatInteger(sc.n, locale)} matches: ${lead.charAt(0).toLowerCase()}${lead.slice(1)}`,
    footnote: pt
      ? `Avaliação em ${formatInteger(sc.n, locale)} jogos: ${sc.n_seasons} épocas (${range}) × ${mds.length} jornadas (${gamesOfMatchdays(mds, locale)}). Para prever cada jornada, o modelo é ajustado apenas com os jogos disputados até à jornada anterior, sem ver o futuro. As probabilidades do mercado derivam das cotações de fecho publicadas pela football-data.co.uk${sources ? ` (${sources})` : ""}${shin ? ", com a margem retirada pelo método de Shin" : ""}. Avaliação gerada a ${formatLongDate(sc.generated_at, locale)}.`
      : `Evaluated on ${formatInteger(sc.n, locale)} matches: ${sc.n_seasons} seasons (${range}) × ${mds.length} matchdays (${gamesOfMatchdays(mds, locale)}). To forecast each matchday, the model is fitted only on the matches played up to the one before, without seeing the future. Market probabilities are derived from closing odds published by football-data.co.uk${sources ? ` (${sources})` : ""}${shin ? ", with the margin removed using Shin's method" : ""}. Evaluation generated on ${formatLongDate(sc.generated_at, locale)}.`,
    // The evaluation is retrospective and not independent of the model's
    // choice (audit MR2-V01, FRESH-V1).
    selection: selectionCaveat(CURRENT_LIGA_SEASON, locale),
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
    calibrationTitle: "As probabilidades de título estão calibradas?",
    calibrationScope:
      "Esta página avalia uma coisa: a previsão de vitória, empate ou derrota de cada jogo da jornada seguinte. As probabilidades de título e de despromoção são outra pergunta, e verificamo-las à parte.",
    pointsTitle: "E os intervalos de pontos?",
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
    calibrationTitle: "Are the title probabilities calibrated?",
    calibrationScope:
      "This page evaluates one thing: the win, draw or loss forecast for each game of the next matchday. Title and relegation probabilities are a different question, and we check them separately.",
    pointsTitle: "And the points ranges?",
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
  const t = await getTranslations({ locale });
  const c = locale === "en" ? copy.en : copy.pt;
  const [scorecard, { prediction }] = await Promise.all([loadLigaMarketScorecard(), loadLigaData()]);
  const s = scorecard ? summary(scorecard, prediction?.model ?? null, locale) : null;
  const points = pointsCalibrationSentence(scorecard?.calibration ?? null, locale);

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
          meta={scorecard ? (
            <span>
              {c.evaluated}: <strong className="font-semibold text-ink">{modelPlainName(scorecard.model, locale)}</strong>
            </span>
          ) : undefined}
        />

        <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-5xl">
          {s && (
            <div className="max-w-3xl space-y-4 mb-10">
              {!s.same && (
                <p className="text-base text-stone-800 leading-relaxed border-l-2 border-amber-400 pl-4">
                  {s.which}
                </p>
              )}
              <p className="text-lg text-stone-800 leading-relaxed font-medium">{s.intro}</p>
              <p className="text-sm text-stone-500 leading-relaxed border-l-2 border-stone-200 pl-4">
                {c.caveat} {s.selection}
              </p>
            </div>
          )}

          {scorecard ? (
            <MarketScorecard data={scorecard} locale={locale} />
          ) : (
            <p className="text-stone-500 py-10">{c.unavailable}</p>
          )}

          {/* What this page does not evaluate (audit F-H2, X-01). */}
          <section className="mt-12 max-w-3xl" aria-labelledby="calibracao-titulo">
            <h2 id="calibracao-titulo" className="text-2xl tracking-tight mb-3">{c.calibrationTitle}</h2>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">{c.calibrationScope}</p>
            <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-stone-800">
              {t("football.titleCalibrationCaveat")}
            </p>
            <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
              {titleCalibrationParagraphs(locale).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            </div>
            {points && (
              <>
                <h3 className="text-lg text-stone-900 mt-8 mb-2">{c.pointsTitle}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{points}</p>
              </>
            )}
          </section>

          <section className="mt-12 pt-8 border-t border-stone-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
              {c.footnoteTitle}
            </h2>
            {s && (
              <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
                {s.footnote} {s.which} {s.selection}
              </p>
            )}
            <div className="mt-5">
              <Link
                href="/desporto/liga/metodologia"
                locale={locale}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink underline underline-offset-4"
              >
                {c.methodology}
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
