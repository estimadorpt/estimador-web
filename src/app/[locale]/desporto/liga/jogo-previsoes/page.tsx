import { createPageMetadata } from '@/lib/metadata';
import { loadPredictionGameData } from "@/lib/utils/football-data-loader";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { ContraOModelo } from "@/components/charts/football/ContraOModelo";
import { GameAuthProvider } from "@/components/GameAuthProvider";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Swords } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pt = locale !== "en";
  return createPageMetadata({
    locale,
    path: `/desporto/liga/jogo-previsoes`,
    title: pt
      ? "Contra o Modelo — Liga Portugal - estimador.pt"
      : "Beat the Model — Liga Portugal - estimador.pt",
    description: pt
      ? "Faz as tuas previsões para a próxima jornada da Liga Portugal e vê se bates o modelo. Avaliação por Ranked Probability Score, a mesma medida com que avaliamos o modelo."
      : "Forecast the next Liga Portugal matchday and see if you can beat the model. Scored with the Ranked Probability Score, the same measure we grade the model with.",
  });
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
    <div className="min-h-screen bg-paper">
      <Header />

      <PageHero
        width="3xl"
        back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
        icon={<Swords aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t("football.title")}
        title={pt ? "Contra o Modelo" : "Beat the Model"}
        lede={pt
          ? "Consegues prever melhor do que o modelo? Escolhe as tuas probabilidades antes da jornada e compara-te com ele, semana após semana."
          : "Can you forecast better than the model? Set your own probabilities before the matchday and go head to head, week after week."}
      />

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
      <SiteFooter locale={locale} />
    </div>
  );
}
