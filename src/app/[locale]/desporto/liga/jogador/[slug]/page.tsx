import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/Header";
import { Link } from "@/i18n/routing";
import {
  loadLigaInjuries,
  loadLigaPlayersDetail,
  loadPlayerBySlug,
  NO_PLAYERS_SLUG,
} from "@/lib/utils/football-data-loader";
import { PlayerProfile } from "@/components/charts/football/PlayerProfile";
import type { PlayerInjury } from "@/components/charts/football/PlayerProfile";
import { injuryReasonLabel } from "@/lib/i18n/football-labels";
import { teamDisplayName } from "@/lib/config/football";

const SITE = "https://estimador.pt";

/* ------------------------------------------------------------- static params */

export async function generateStaticParams() {
  const data = await loadLigaPlayersDetail();
  // Static export rejects a dynamic route with zero params, so a placeholder
  // page stands in whenever no player detail is published.
  if (!data?.players?.length) return [{ slug: NO_PLAYERS_SLUG }];
  return data.players.map(p => ({ slug: p.slug }));
}

/* ------------------------------------------------------------------ metadata */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pt = locale !== "en";
  const found = await loadPlayerBySlug(slug);

  if (!found) {
    return {
      title: pt ? "Jogador não encontrado" : "Player not found",
      robots: { index: false, follow: true },
    };
  }

  const { player } = found;
  const sar = player.sar ?? 0;
  const title = pt
    ? `${player.player}: o que o modelo sabe`
    : `${player.player}: what the model knows`;
  const description = pt
    ? `${player.player} (${teamDisplayName(player.team)}) é o número ${player.rank} da Liga Portugal segundo o modelo de jogadores: ${sar.toFixed(
        2,
      )} golos por 90 minutos acima de um jogador de nível de substituição, com intervalo de credibilidade, minutos, golos e histórico época a época.`
    : `${player.player} (${teamDisplayName(player.team)}) ranks number ${player.rank} in Liga Portugal on the player model: ${sar.toFixed(
        2,
      )} goals per 90 minutes above a replacement-level player, with credible interval, minutes, goals and season-by-season history.`;
  const url = `${SITE}/${locale}/desporto/liga/jogador/${slug}`;

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
      type: "profile",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/* -------------------------------------------------------------------- page */

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pt = locale !== "en";

  const [found, injuries] = await Promise.all([
    loadPlayerBySlug(slug),
    loadLigaInjuries(),
  ]);

  if (!found) {
    if (slug !== NO_PLAYERS_SLUG) notFound();
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20">
          <p className="text-stone-500 mb-4">
            {pt
              ? "Não há jogadores publicados de momento."
              : "There are no published players right now."}
          </p>
          <Link
            href="/desporto/liga"
            locale={locale}
            className="text-sm text-stone-700 hover:text-stone-900 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Liga Portugal
          </Link>
        </div>
      </div>
    );
  }

  const { player, data } = found;

  // Exact name + club match, the same convention the liga page uses. A miss
  // simply means no injury banner.
  const entry =
    injuries?.players?.find(p => p.player === player.player && p.team === player.team) ??
    null;
  const injury: PlayerInjury | null = entry
    ? {
        kind: entry.kind,
        reason: entry.reason ?? null,
        expected_return: entry.expected_return ?? null,
        position: entry.position ?? null,
      }
    : null;

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
            {pt ? "Liga Portugal" : "Liga Portugal"}
          </Link>
        </div>

        <PlayerProfile
          player={player}
          data={data}
          locale={locale}
          injury={injury}
          injuryReason={injuryReasonLabel(injury?.reason ?? null, locale)}
        />

        <div className="mt-10 pt-5 border-t border-stone-200 text-xs">
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
