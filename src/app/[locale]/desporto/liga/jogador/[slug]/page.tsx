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
import { formatDecimal, formatShortDate } from "@/lib/football-format";
import { setRequestLocale } from '@/i18n/request-locale';

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
  setRequestLocale(locale);
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
  // Under 160 characters, the metric first (SP-17).
  const description = !goalsSarIsMeaningful(player.position)
    ? pt
      ? `${player.player} (${teamDisplayName(player.team)}): minutos, jogos e cada época, com a métrica da posição; o ranking de finalização não se aplica.`
      : `${player.player} (${teamDisplayName(player.team)}): minutes, matches and every season, with the metric for the position; the finishing ranking does not apply.`
    // The snippet carries the data cut-off the page shows beside every SAR
    // figure (audit FA3-12).
    : (() => {
        const day = formatShortDate(data.appearances_through, locale);
        const through = day ? `${day} ${String(data.appearances_through).slice(0, 4)}` : "";
        return pt
          ? `${player.player} (${teamDisplayName(player.team)}): ${formatDecimal(sar, locale, 2)} golos/90 acima do substituto, n.º ${player.rank} de ${data.n_players} em finalização${through ? ` (dados até ${through})` : ""}. Intervalo, minutos e épocas.`
          : `${player.player} (${teamDisplayName(player.team)}): ${formatDecimal(sar, locale, 2)} goals/90 above replacement, number ${player.rank} of ${data.n_players} for finishing${through ? ` (data to ${through})` : ""}. Interval, minutes and seasons.`;
      })();

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
  setRequestLocale(locale);
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
            measure="wide"
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
        measure="wide"
        compact
        back={{ href: "/desporto/liga/jogadores", label: pt ? "Jogadores" : "Players", locale }}
        eyebrow={`Liga Portugal · ${pt ? "Jogadores" : "Players"}`}
        title={player.player}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10"><div className="max-w-4xl">
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
            href={pt
              ? "/desporto/liga/metodologia#como-medimos-os-jogadores"
              : "/desporto/liga/metodologia#how-do-we-measure-players"}
            locale={locale}
            className="inline-flex min-h-11 items-center text-ink underline underline-offset-4"
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
