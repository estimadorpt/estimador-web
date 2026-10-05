import { createPageMetadata } from '@/lib/metadata';
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import {
  loadContribRatings,
  loadDefRatings,
  loadGkRatings,
  loadLigaData,
  loadLigaInjuries,
  loadLigaPlayersDetail,
  loadPlayerBySlug,
  NO_PLAYERS_SLUG,
} from "@/lib/utils/football-data-loader";
import { findRating, goalsSarIsMeaningful } from "@/lib/utils/player-ratings";
import type { RatingsBlock, RatingKind } from "@/lib/utils/player-ratings";
import { PlayerProfile } from "@/components/charts/football/PlayerProfile";
import type {
  PlayerDetailEntry,
  PlayerInjury,
  PlayerPositionRating,
} from "@/components/charts/football/PlayerProfile";
import { injuryReasonLabel } from "@/lib/i18n/football-labels";
import { teamDisplayName } from "@/lib/config/football";
import { currentAbsences } from "@/lib/football-injuries";
import { formatDecimal } from "@/lib/football-format";

const SITE = "https://estimador.pt";

/* ------------------------------------------------------- position metric */

/**
 * Pick the metric that actually applies to this player.
 *
 * Goalkeepers get goals prevented, defenders get the plus-minus estimate and
 * everyone else gets attacking contribution alongside the goals number. Any
 * of the three feeds can be absent, and a player can be missing from a feed
 * that is present; both cases return null, and the profile then explains the
 * absence rather than printing a number that does not apply (ADR-019).
 */
function resolvePositionRating(
  player: PlayerDetailEntry,
  blocks: { gk: RatingsBlock | null; def: RatingsBlock | null; contrib: RatingsBlock | null },
): PlayerPositionRating | null {
  const position = (player.position ?? "").toUpperCase();
  const kind: RatingKind =
    position === "G" ? "gk" : position === "D" ? "def" : "contrib";
  const block = blocks[kind];
  const entry = findRating(block, player.player, player.team);
  if (!block || !entry) return null;
  return { kind, entry, peers: block.players, meta: block.meta };
}

/* ------------------------------------------------------------- static params */

export async function generateStaticParams() {
  // The reconciled set: players /jogadores ranks (current squads), from
  // clubs in the current table (see loadLigaPlayersDetail).
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

  const { player, data } = found;
  const sar = player.sar ?? 0;
  const title = pt
    ? `${player.player}: o que o modelo sabe`
    : `${player.player}: what the model knows`;
  // The goals-only claim is only made where it means something: a keeper or a
  // defender sits at the floor of that scale by construction (ADR-019).
  const description = !goalsSarIsMeaningful(player.position)
    ? pt
      ? `${player.player} (${teamDisplayName(player.team)}): minutos, jogos e histórico época a época, com a métrica que se aplica à posição — e a explicação de por que razão o ranking de finalização não diz nada sobre ele.`
      : `${player.player} (${teamDisplayName(player.team)}): minutes, matches and season-by-season history, with the metric that applies to the position — and why the finishing ranking says nothing about him.`
    : pt
      ? `${player.player} (${teamDisplayName(player.team)}) é o n.º ${player.rank} em finalização entre os ${data.n_players} jogadores publicados: ${formatDecimal(
          sar,
          locale,
          2,
        )} golos por 90 minutos acima de um jogador de nível de substituição, com intervalo de credibilidade, minutos, golos e histórico época a época.`
      : `${player.player} (${teamDisplayName(player.team)}) is number ${player.rank} for finishing among the ${data.n_players} players published: ${formatDecimal(
          sar,
          locale,
          2,
        )} goals per 90 minutes above a replacement-level player, with credible interval, minutes, goals and season-by-season history.`;
  const url = `${SITE}/${locale}/desporto/liga/jogador/${slug}`;

  return createPageMetadata({
    locale,
    path: `/desporto/liga/jogador/${slug}`,
    title: title,
    description: description,
  });
}

/* -------------------------------------------------------------------- page */

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pt = locale !== "en";

  const [found, injuries, { prediction }, gk, def, contrib] = await Promise.all([
    loadPlayerBySlug(slug),
    loadLigaInjuries(),
    loadLigaData(),
    loadGkRatings(),
    loadDefRatings(),
    loadContribRatings(),
  ]);

  if (!found) {
    if (slug !== NO_PLAYERS_SLUG) notFound();
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
          <PageHero
            width="4xl"
            compact
            back={{ href: "/desporto/liga/jogadores", label: pt ? "Jogadores" : "Players", locale }}
            eyebrow="Liga Portugal"
            title={pt ? "Sem jogadores publicados" : "No players published"}
            lede={pt
              ? "Não há jogadores publicados de momento."
              : "There are no published players right now."}
          />
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  const { player, data } = found;

  // Exact name + club match, the same convention the liga page uses. A miss
  // simply means no injury banner — and so does a list too old to be current
  // for this forecast, or an entry whose expected return has passed.
  const absences = currentAbsences(injuries, prediction?.timestamp);
  const entry =
    absences.players.find(p => p.player === player.player && p.team === player.team) ??
    null;
  const clubInLeague = (prediction?.table ?? []).some(row => row.team === player.team);
  const injury: PlayerInjury | null = entry
    ? {
        kind: entry.kind,
        reason: entry.reason ?? null,
        expected_return: entry.expected_return ?? null,
        position: entry.position ?? null,
      }
    : null;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        width="4xl"
        compact
        back={{ href: "/desporto/liga/jogadores", label: pt ? "Jogadores" : "Players", locale }}
        eyebrow={`Liga Portugal · ${pt ? "Jogadores" : "Players"}`}
        title={player.player}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-10">
        <PlayerProfile
          showName={false}
          clubInLeague={clubInLeague}
          player={player}
          data={data}
          locale={locale}
          injury={injury}
          injuryReason={injuryReasonLabel(injury?.reason ?? null, locale)}
          positionRating={resolvePositionRating(player, { gk, def, contrib })}
        />

        <div className="mt-10 pt-5 border-t border-stone-200 text-xs">
          <Link
            href="/desporto/liga/metodologia"
            locale={locale}
            className="text-ink underline underline-offset-4"
          >
            {pt ? "Como funciona o modelo" : "How the model works"}
          </Link>
        </div>
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
