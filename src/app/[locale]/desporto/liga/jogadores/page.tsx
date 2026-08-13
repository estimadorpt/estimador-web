import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/Header";
import { Link } from "@/i18n/routing";
import { PlayerRatingsHub } from "@/components/charts/football/PlayerRatingsHub";
import {
  loadContestedRatings,
  loadContribRatings,
  loadDefRatings,
  loadGkChannels,
  loadGkRatings,
  loadLigaPlayers,
  loadPlayerSlugs,
} from "@/lib/utils/football-data-loader";

const SITE = "https://estimador.pt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pt = locale !== "en";

  const title = pt
    ? "Jogadores da Liga Portugal: uma métrica por dimensão"
    : "Liga Portugal players: one metric per dimension";
  const description = pt
    ? "Não há forma honesta de pôr um guarda-redes e um ponta de lança na mesma tabela. Finalização, contribuição ofensiva, posse disputada, intervenção em cruzamentos — cada métrica com a sua escala, o seu intervalo de credibilidade e a sua amostra."
    : "There is no honest way to put a goalkeeper and a centre-forward in the same table. Finishing, attacking contribution, contested possession, cross intervention — each metric with its own scale, credible interval and sample.";
  const url = `${SITE}/${locale}/desporto/liga/jogadores`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "estimador.pt",
      locale,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PlayerRatingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pt = locale !== "en";

  // Every feed is optional and loaded independently: three of these are
  // written by separate models in the model repo and any of them can be
  // absent on any given build. A missing feed renders no section.
  const [finishers, contrib, gk, def, contested, gkChannels, playerSlugs] =
    await Promise.all([
      loadLigaPlayers(),
      loadContribRatings(),
      loadGkRatings(),
      loadDefRatings(),
      loadContestedRatings(),
      loadGkChannels(),
      loadPlayerSlugs(),
    ]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-10">
        <div className="mb-6">
          <Link
            href="/desporto/liga"
            locale={locale}
            className="text-stone-400 hover:text-stone-700 text-xs font-medium uppercase tracking-wider inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Liga Portugal
          </Link>
        </div>

        <PlayerRatingsHub
          finishers={finishers}
          contrib={contrib}
          gk={gk}
          def={def}
          contested={contested}
          gkChannels={gkChannels}
          playerSlugs={playerSlugs}
          locale={locale}
        />

        <div className="mt-10 pt-5 border-t border-stone-200 text-xs flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/desporto/liga/dados"
            locale={locale}
            className="text-stone-500 hover:text-stone-900 underline underline-offset-2"
          >
            {pt ? "Dados abertos" : "Open data"}
          </Link>
          <Link
            href="/desporto/liga/metodologia"
            locale={locale}
            className="text-stone-500 hover:text-stone-900 underline underline-offset-2"
          >
            {pt ? "Como funciona o modelo" : "How the model works"}
          </Link>
        </div>
      </div>
    </div>
  );
}
