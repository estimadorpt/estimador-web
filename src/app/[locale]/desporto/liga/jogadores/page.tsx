import { createPageMetadata } from '@/lib/metadata';
import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import { PlayerRatingsHub } from "@/components/charts/football/PlayerRatingsHub";
import {
  loadContestedRatings,
  loadContribRatings,
  loadDefRatings,
  loadGkChannels,
  loadGkRatings,
  loadLigaPlayers,
  loadLigaPlayersDetail,
  loadPlayerSlugs,
} from "@/lib/utils/football-data-loader";
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== "en";

  const title = pt
    ? "Jogadores da Liga Portugal: uma métrica por dimensão"
    : "Liga Portugal players: one metric per dimension";
  // Finishing, contribution, contested possession and goalkeepers, each
  // with its own scale and interval; the description no longer opens on the
  // argument against a single ranking (audit CL-M2).
  const description = pt
    ? "Os jogadores da Liga Portugal em métricas separadas: finalização, contribuição ofensiva, posse disputada e guarda-redes, cada uma com a sua escala, o seu intervalo de credibilidade e a data dos dados."
    : "Liga Portugal players on separate metrics: finishing, attacking contribution, contested possession and goalkeeping, each with its own scale, credible interval and data date.";

  return createPageMetadata({
    locale,
    path: `/desporto/liga/jogadores`,
    title: title,
    description: description,
  });
}

export default async function PlayerRatingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== "en";

  // Every feed is optional and loaded independently: three of these are
  // written by separate models in the model repo and any of them can be
  // absent on any given build. A missing feed renders no section.
  const [finishers, contrib, gk, def, contested, gkChannels, playerSlugs, detail] =
    await Promise.all([
      loadLigaPlayers(),
      loadContribRatings(),
      loadGkRatings(),
      loadDefRatings(),
      loadContestedRatings(),
      loadGkChannels(),
      loadPlayerSlugs(),
      loadLigaPlayersDetail(),
    ]);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="wide"
        compact
        back={{ href: "/desporto/liga", label: "Liga Portugal", locale }}
        eyebrow={pt ? "Liga Portugal · Jogadores" : "Liga Portugal · Players"}
        title={pt ? "Jogadores da Liga Portugal" : "Liga Portugal players"}
        lede={pt
          ? "Métricas separadas — finalização, contribuição ofensiva, posse disputada e guarda-redes —, cada uma com o seu intervalo. Não há um ranking geral: um número só não chega para comparar um guarda-redes com um ponta de lança."
          : "Separate metrics — finishing, attacking contribution, contested possession and goalkeeping — each with its own interval. There is no overall ranking: one number cannot compare a goalkeeper with a centre-forward."}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10"><div className="max-w-4xl">
        <PlayerRatingsHub
          showHeading={false}
          finishers={finishers}
          contrib={contrib}
          gk={gk}
          def={def}
          contested={contested}
          gkChannels={gkChannels}
          playerSlugs={playerSlugs}
          dataThrough={detail?.appearances_through ?? null}
          locale={locale}
        />

        <div className="mt-10 pt-3 border-t border-stone-200 text-xs flex flex-wrap items-center gap-x-6 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center">
          <Link
            href="/desporto/liga/dados"
            locale={locale}
            className="text-ink underline underline-offset-4"
          >
            {pt ? "Dados abertos" : "Open data"}
          </Link>
          <Link
            href={pt
              ? "/desporto/liga/metodologia#como-medimos-os-jogadores"
              : "/desporto/liga/metodologia#how-do-we-measure-players"}
            locale={locale}
            className="text-ink underline underline-offset-4"
          >
            {pt ? "Como medimos os jogadores" : "How we measure players"}
          </Link>
        </div>
      </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
