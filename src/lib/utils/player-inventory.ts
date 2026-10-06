import type { ContestedRatings, GkChannels } from '@/lib/utils/football-data-loader';
import type { RatingsBlock } from '@/lib/utils/player-ratings';
import { nextSeason, playerDataCutoffLabel } from '@/lib/utils/player-pages';

/**
 * What /desporto/liga/jogadores ranks, what it measures without ranking, and
 * what it does not measure yet, read from the feeds the page renders.
 *
 * Three states, not two: a ranking, a fit that came back inconclusive, and
 * nothing at all. Collapsing the middle one into either of the others would
 * be the dishonesty that page is about. Shared by the page's hero (the lede
 * states it once, audit UXD2-29) and the hub component.
 */
export interface PlayerInventory {
  ranked: string[];
  unranked: string[];
  missing: string[];
}

export interface PlayerInventoryFeeds {
  /** True when the finishing list (players.json) has rows. */
  finishers: boolean;
  contrib: RatingsBlock | null;
  gk: RatingsBlock | null;
  def: RatingsBlock | null;
  contested?: ContestedRatings | null;
  gkChannels?: GkChannels | null;
}

export function playerInventory(feeds: PlayerInventoryFeeds, locale: string): PlayerInventory {
  const pt = locale !== 'en';
  const out: PlayerInventory = { ranked: [], unranked: [], missing: [] };
  const bucket = (block: RatingsBlock | null, label: string) => {
    if (block?.players.length) out.ranked.push(label);
    else if (block) out.unranked.push(label);
    else out.missing.push(label);
  };
  if (feeds.finishers) out.ranked.push(pt ? 'finalização' : 'finishing');
  else out.missing.push(pt ? 'finalização' : 'finishing');
  bucket(feeds.contrib, pt ? 'contribuição ofensiva' : 'attacking contribution');
  if (feeds.contested?.cells.some(c => c.ships && c.ranking?.length)) {
    out.ranked.push(pt ? 'posse disputada' : 'contested possession');
  }
  const channels = feeds.gkChannels ?? null;
  if (channels?.channels.cross_intervention.ships) {
    out.ranked.push(pt ? 'intervenção em cruzamentos' : 'cross intervention');
  }
  if (channels && !channels.channels.shot_stopping.ships) {
    // "defesa de remates" beside "defesas" read as a repeat (audit CL3-12):
    // the goalkeeper axis is named as the goalkeepers', the defenders as
    // defenders.
    out.unranked.push(
      pt
        ? `guarda-redes (defesa de remates, ${channels.seasons.length} épocas)`
        : `goalkeepers (shot-stopping, ${channels.seasons.length} seasons)`,
    );
  }
  // The xGOT feed is superseded by the three-axis section when that feed
  // exists; listing an unrendered section as ranked would be a lie.
  if (!channels) bucket(feeds.gk, pt ? 'guarda-redes (xGOT)' : 'goalkeepers (xGOT)');
  bucket(feeds.def, pt ? 'defesas' : 'defenders');
  return out;
}

/** "a, b, c e d" / "a, b, c and d" (en-GB: no serial comma). */
export function listPhrase(items: string[], locale: string): string {
  return new Intl.ListFormat(locale === 'en' ? 'en-GB' : 'pt-PT', { style: 'long', type: 'conjunction' }).format(items);
}

/**
 * The inventory in two or three plain sentences, conclusion last (audit
 * CL3-12): "Com lista ordenada: finalização, contribuição ofensiva, posse
 * disputada e intervenção em cruzamentos. Sem lista ordenada, porque o modelo
 * ainda não separa os jogadores: guarda-redes (defesa de remates, 4 épocas) e
 * defesas."
 */
export function playerInventorySentence(inv: PlayerInventory, locale: string): string {
  const pt = locale !== 'en';
  const parts: string[] = [];
  parts.push(
    inv.ranked.length
      ? pt
        ? `Com lista ordenada: ${listPhrase(inv.ranked, locale)}.`
        : `Ranked lists: ${listPhrase(inv.ranked, locale)}.`
      : pt
        ? 'Ainda não há nenhuma lista ordenada.'
        : 'There is no ranked list yet.',
  );
  if (inv.unranked.length) {
    parts.push(
      pt
        ? `Sem lista ordenada, porque o modelo ainda não separa os jogadores: ${listPhrase(inv.unranked, locale)}.`
        : `No ranked list yet, because the model cannot tell the players apart: ${listPhrase(inv.unranked, locale)}.`,
    );
  }
  if (inv.missing.length) {
    parts.push(
      pt
        ? `Ainda sem métrica: ${listPhrase(inv.missing, locale)}, que não aparece aqui como espaço vazio nem como estimativa provisória.`
        : `No metric yet: ${listPhrase(inv.missing, locale)}, which appears here as neither an empty slot nor a provisional estimate.`,
    );
  }
  return parts.join(' ');
}

/**
 * The finishing and contribution fits' data cut-off, said once for the page
 * (audit UXD2-29): "Dados até 16 mai. 2026 (fim da época 2025-26) em
 * finalização e contribuição, ainda sem jogos de 2026-27; as outras métricas
 * dizem as épocas que cobrem."
 */
export function playerCutoffMeta(
  through: string | null | undefined,
  seasons: readonly string[] | null | undefined,
  locale: string,
): string | null {
  const label = playerDataCutoffLabel(through, seasons, locale);
  if (!label) return null;
  const last = seasons?.length ? seasons[seasons.length - 1] : null;
  const next = last ? nextSeason(last) : null;
  return locale === 'en'
    ? `${label} for finishing and contribution, with no ${next ?? 'current-season'} matches yet; the other metrics state the seasons they cover.`
    : `${label} em finalização e contribuição, ainda sem jogos de ${next ?? 'esta época'}; as outras métricas dizem as épocas que cobrem.`;
}
