import { loadPredictionGameData } from "@/lib/utils/football-data-loader";
import { Header } from "@/components/Header";
import { ContraOModelo } from "@/components/charts/football/ContraOModelo";
import { GameAuthProvider } from "@/components/GameAuthProvider";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Swords } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pt = locale !== "en";
  return {
    title: pt
      ? "Contra o Modelo — Liga Portugal - estimador.pt"
      : "Beat the Model — Liga Portugal - estimador.pt",
    description: pt
      ? "Faz as tuas previsões para a próxima jornada da Liga Portugal e vê se bates o modelo. Avaliação por Ranked Probability Score, a mesma medida com que avaliamos o modelo."
      : "Forecast the next Liga Portugal matchday and see if you can beat the model. Scored with the Ranked Probability Score, the same measure we grade the model with.",
    alternates: {
      canonical: `https://estimador.pt/${locale}/desporto/liga/jogo-previsoes`,
    },
  };
}

export default async function JogoPrevisoesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pt = locale !== "en";
  const t = await getTranslations({ locale });

  const data = await loadPredictionGameData();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-stone-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <Link
            href="/desporto/liga"
            locale={locale}
            className="text-sm text-stone-400 hover:text-white inline-flex items-center gap-1 mb-4 group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {t("football.backToLeague")}
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Swords className="w-5 h-5 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t("football.title")}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {pt ? "Contra o Modelo" : "Beat the Model"}
          </h1>
          <p className="text-stone-400 text-sm">
            {pt
              ? "Consegues prever melhor do que o modelo? Escolhe as tuas probabilidades antes da jornada e compara-te com ele, semana após semana."
              : "Can you forecast better than the model? Set your own probabilities before the matchday and go head to head, week after week."}
          </p>
        </div>
      </section>

      <section>
        <div className="max-w-3xl mx-auto px-4 py-10">
          {data ? (
            // Auth wraps this page only: readers of forecast pages never
            // download an auth bundle they have no use for.
            <GameAuthProvider>
              <ContraOModelo data={data} locale={locale} />
            </GameAuthProvider>
          ) : (
            <p className="text-stone-500 text-sm">
              {pt
                ? "Dados do jogo não disponíveis de momento."
                : "Game data is not available right now."}
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-8 text-xs text-stone-500 space-y-2">
          {/* Where a season is stored depends on whether the season backend is
              configured, which only the browser can know — this page is
              rendered at build time. The component states the accurate version. */}
          <p>
            {pt
              ? "Jogar é anónimo: escolhes um nome e as previsões contam para a classificação da época. Nunca guardamos email nem perfil."
              : "Playing is anonymous: pick a name and your forecasts count towards the season standings. We never store an email or a profile."}
          </p>
          <p>
            {pt ? (
              <>
                Sobre o modelo e como é avaliado:{" "}
                <Link
                  href="/desporto/liga/modelo"
                  locale={locale}
                  className="text-emerald-700 hover:underline"
                >
                  ficha do modelo
                </Link>
                .
              </>
            ) : (
              <>
                About the model and how it is graded:{" "}
                <Link
                  href="/desporto/liga/modelo"
                  locale={locale}
                  className="text-emerald-700 hover:underline"
                >
                  model report card
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
