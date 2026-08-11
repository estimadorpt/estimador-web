import { Header } from "@/components/Header";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { loadLigaMarketScorecard } from "@/lib/utils/football-data-loader";
import { MarketScorecard } from "@/components/charts/football/MarketScorecard";
import type { Metadata } from "next";

const copy = {
  pt: {
    title: "Modelo vs Mercado",
    description:
      "O nosso modelo da Liga Portugal testado contra a linha de fecho do mercado em 504 jogos e oito épocas: iguala o mercado a partir da jornada 14, e toda a desvantagem está no início da época.",
    back: "Liga Portugal",
    kicker: "Avaliação do modelo",
    standfirstA:
      "Há uma pergunta a que qualquer modelo de futebol tem de responder antes de merecer atenção: é melhor do que a previsão implícita no mercado? A linha de fecho — o consenso do mercado imediatamente antes do apito inicial — é o padrão de referência em previsão desportiva, e nós fomos medir-nos contra ela. Não publicamos cotações nem sugestões de aposta: o mercado aparece aqui apenas como termo de comparação.",
    standfirstB:
      "O veredicto, em 504 jogos ao longo de oito épocas: a partir da jornada 14 o modelo iguala a linha de fecho, e chega a ficar ligeiramente à frente. Toda a desvantagem está concentrada no primeiro terço da época, quando ainda há poucos jogos para aprender com eles. No conjunto da época a diferença é de +0,0010 com um erro padrão de 0,0021 — ou seja, indistinguível de zero.",
    caveat:
      "Escrevemos isto com as barras de erro à vista de propósito. A única diferença nesta página que sobrevive ao seu próprio erro padrão é a do início da época; tudo o resto é compatível com um empate técnico, e seria desonesto vender de outra forma.",
    unavailable: "Dados de avaliação indisponíveis.",
    footnoteTitle: "A letra pequena",
    footnote:
      "Avaliação em 504 jogos: oito épocas (2017-18 a 2024-25) × sete jornadas de referência (6, 10, 14, 18, 22, 26, 30). Em cada ponto o modelo é ajustado apenas com os jogos disputados até essa jornada e prevê a jornada seguinte — nunca vê o futuro. As probabilidades do mercado derivam das cotações de fecho publicadas pela football-data.co.uk (Pinnacle), com a margem retirada pelo método de Shin, e cobrem 100% dos jogos avaliados. O modelo avaliado é o mesmo que produz as previsões publicadas neste site.",
    methodology: "Como funciona o modelo",
  },
  en: {
    title: "Model vs Market",
    description:
      "Our Liga Portugal model tested against the market's closing line over 504 matches and eight seasons: it matches the market from matchday 14, and the entire deficit sits in the early season.",
    back: "Liga Portugal",
    kicker: "Model evaluation",
    standfirstA:
      "There is one question any football model has to answer before it deserves attention: is it better than the forecast implied by the market? The closing line — the market consensus immediately before kick-off — is the reference standard in sports forecasting, and we measured ourselves against it. We publish no odds and no betting advice: the market appears here purely as a yardstick.",
    standfirstB:
      "The verdict, over 504 matches across eight seasons: from matchday 14 onward the model matches the closing line, and edges slightly ahead of it. The whole deficit is concentrated in the first third of the season, when there are still few matches to learn from. Across the season as a whole the gap is +0.0010 with a standard error of 0.0021 — indistinguishable from zero.",
    caveat:
      "We are writing this with the error bars in plain sight on purpose. The only difference on this page that survives its own standard error is the early-season one; everything else is consistent with a tie, and it would be dishonest to sell it any other way.",
    unavailable: "Evaluation data unavailable.",
    footnoteTitle: "The small print",
    footnote:
      "Evaluated on 504 matches: eight seasons (2017-18 to 2024-25) × seven reference matchdays (6, 10, 14, 18, 22, 26, 30). At each point the model is fitted only on matches played up to that matchday and forecasts the next one — it never sees the future. Market probabilities are derived from closing odds published by football-data.co.uk (Pinnacle), with the margin removed using Shin's method, and cover 100% of the evaluated matches. The evaluated model is the same one that produces the forecasts published on this site.",
    methodology: "How the model works",
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
    title: `${c.title} — Liga Portugal | Estimador`,
    description: c.description,
    openGraph: {
      title: c.title,
      description: c.description,
      type: "article",
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/desporto/liga/modelo`,
    },
  };
}

export default async function LigaModelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = locale === "en" ? copy.en : copy.pt;
  const scorecard = await loadLigaMarketScorecard();

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
        <div className="max-w-3xl space-y-4 mb-10">
          <p className="text-lg text-stone-600 leading-relaxed">{c.standfirstA}</p>
          <p className="text-lg text-stone-800 leading-relaxed font-medium">
            {c.standfirstB}
          </p>
          <p className="text-sm text-stone-500 leading-relaxed border-l-2 border-stone-200 pl-4">
            {c.caveat}
          </p>
        </div>

        {scorecard ? (
          <MarketScorecard data={scorecard} locale={locale} />
        ) : (
          <p className="text-stone-500 py-10">{c.unavailable}</p>
        )}

        <section className="mt-12 pt-8 border-t border-stone-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
            {c.footnoteTitle}
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed max-w-3xl">
            {c.footnote}
          </p>
          <div className="mt-5">
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
