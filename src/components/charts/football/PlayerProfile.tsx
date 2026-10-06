"use client";

import { Fragment } from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  ligaTeamColors,
  ligaTeamSlugs,
  teamDisplayName,
  teamLogoSrc,
} from "@/lib/config/football";
import { positionCodeEn, positionCodePt } from "@/lib/i18n/football-labels";
import { formatInteger, formatLongDate, formatPosterior, formatSigned } from "@/lib/football-format";
import { PLAYER_MARKS } from "@/components/charts/football/player-marks";
import {
  formatShortDate,
  playerDataCutoffLabel,
  playerDataCutoffSentence,
  sortAppearancesNewestFirst,
} from "@/lib/utils/player-pages";
import {
  goalsSarIsMeaningful,
  ratingDomain,
  ratingPct,
  type RatingEntry,
  type RatingKind,
  type RatingsMeta,
} from "@/lib/utils/player-ratings";

/**
 * The position-specific metric for this player, resolved by the page.
 *
 * `peers` is every published row on the same metric, so the bar can be drawn
 * on the metric's own scale rather than on the goals-only one.
 */
export interface PlayerPositionRating {
  kind: RatingKind;
  entry: RatingEntry;
  peers: RatingEntry[];
  meta: RatingsMeta;
}

export interface PlayerSeasonEntry {
  season: string;
  team: string;
  minutes: number;
  matches: number;
  goals: number;
  goals_per_90: number | null;
  sar_season: number | null;
  sar_season_sd: number | null;
}

export interface PlayerRecentEntry {
  season: string;
  matchday: number;
  date: string | null;
  opponent: string;
  is_home: boolean;
  started: boolean;
  minutes: number;
  goals: number;
  assists: number;
  rating: number | null;
}

export interface PlayerSkillChange {
  from_season: string;
  to_season: string;
  delta: number;
  delta_ref_sd: number;
  within_noise: boolean;
}

export interface PlayerDetailEntry {
  slug: string;
  rank: number;
  player: string;
  player_id: number;
  team: string;
  position: string;
  minutes: number;
  matches: number;
  goals: number;
  goals_per_90: number | null;
  sar: number | null;
  sar_sd: number | null;
  skill_lo: number | null;
  skill_hi: number | null;
  xg_skill_per_90: number | null;
  p_above_replacement: number | null;
  last_season: string;
  seasons: PlayerSeasonEntry[];
  skill_change: PlayerSkillChange | null;
  recent: PlayerRecentEntry[];
}

export interface PlayerDetailData {
  season: string;
  model: string;
  metric: string;
  metric_label: string;
  /** Posterior interval mass as a fraction (0.9). Older feeds omit it. */
  interval_mass?: number;
  generated_from: {
    n_players?: number;
    n_observations?: number;
    min_minutes?: number;
    seasons?: string[];
  };
  skill_change_note?: string;
  /** Last appearance date in the fit ("2026-05-16"); older feeds omit it. */
  appearances_through?: string;
  n_players: number;
  players: PlayerDetailEntry[];
}

export interface PlayerInjury {
  kind: string;
  reason: string | null;
  expected_return: string | null;
  position: string | null;
}

interface PlayerProfileProps {
  player: PlayerDetailEntry;
  data: PlayerDetailData;
  locale?: string;
  /** Injury/suspension entry for this player, when one is published. */
  injury?: PlayerInjury | null;
  /** Localised injury reason, resolved by the page (data value, not UI copy). */
  injuryReason?: string;
  /** False when the player's club is not in the current league: no club link. */
  clubInLeague?: boolean;
  /** False when the page's hero already carries the name as its h1. */
  showName?: boolean;
  /**
   * The metric that actually applies to this player's position, when one is
   * published. Goalkeepers and defenders get this instead of the goals-only
   * number, never as well as.
   */
  positionRating?: PlayerPositionRating | null;
}

// The interval line and caps carry the estimate's uncertainty, so they are
// the stone-400 token, 3:1 on every ground (audit A11Y3-10).
const TRACK = PLAYER_MARKS.peer;
const INK = PLAYER_MARKS.bar;
const SOFT = PLAYER_MARKS.whisker;

export function PlayerProfile({
  player,
  data,
  locale = "pt",
  injury,
  injuryReason,
  clubInLeague = true,
  showName = true,
  positionRating = null,
}: PlayerProfileProps) {
  const pt = locale !== "en";
  const nf = (v: number, d = 2) =>
    v.toLocaleString(pt ? "pt-PT" : "en-GB", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).replace(/^-/, "\u2212");
  // Grouped like every other count on the site ("3 677", audit FA2-12).
  const int = (v: number) => formatInteger(Math.round(v), pt ? "pt" : "en");
  // One signed formatter for every skill-above-replacement figure on the
  // page, headline, interval, axis ends and season rows alike, with U+2212
  // for a negative (audit VUXD-06): "+0,22", as on /jogadores.
  const sar = (v: number, d = 2) => formatSigned(v, pt ? "pt" : "en", d);
  // A missing value: a dash for the eye, words for a screen reader
  // (audit A11Y2-17), never stone-300 and never zero.
  const noData = (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{pt ? "sem dados" : "no data"}</span>
    </>
  );

  const color = ligaTeamColors[player.team] ?? "#5f7062";
  const teamSlug = ligaTeamSlugs[player.team];
  const posLabel =
    (pt ? positionCodePt[player.position] : positionCodeEn[player.position]) ??
    player.position;

  const ranked = [...data.players].sort((a, b) => a.rank - b.rank);
  const prev = ranked.find(p => p.rank === player.rank - 1) ?? null;
  const next = ranked.find(p => p.rank === player.rank + 1) ?? null;

  // Shared scale for the skill bars: 0 to the widest published upper bound.
  const maxHi = Math.max(...ranked.map(p => p.skill_hi ?? 0), 0.1);
  const pct = (v: number) => Math.max(0, Math.min(100, (v / maxHi) * 100));

  const sarValue = player.sar ?? 0;
  const lo = player.skill_lo ?? sarValue;
  const hi = player.skill_hi ?? sarValue;
  // From the feed. Hardcoding this stated 94% probability over a 90% interval.
  const goalsIvPct = Math.round((data.interval_mass ?? 0.9) * 100);

  const seasons = player.seasons;
  const withSkill = seasons.filter(s => s.sar_season !== null);
  const change = player.skill_change;
  // "Melhorou?" compares two seasons only when both had real minutes: a
  // one-minute season is all prior (audit FA2-15).
  const MIN_SEASON_MINUTES = 450;
  const thinSeason = change
    ? [change.from_season, change.to_season]
        .map(id => seasons.find(s => s.season === id))
        .find(s => s && s.minutes < MIN_SEASON_MINUTES)
    : undefined;
  const firstSeason = data.generated_from.seasons?.[0];
  const lastSeason =
    data.generated_from.seasons?.[data.generated_from.seasons.length - 1];
  // Every number from the player fit stops at the fit's last appearance; the
  // label sits next to each block, not only in the footer (audit F-H6).
  const cutoffLabel = playerDataCutoffLabel(
    data.appearances_through,
    data.generated_from.seasons,
    locale,
  );
  const cutoffSentence = playerDataCutoffSentence(
    data.appearances_through,
    data.generated_from.seasons,
    locale,
  );
  const recent = sortAppearancesNewestFirst(player.recent);
  const spansSeasons = new Set(recent.map(m => m.season)).size > 1;
  // "em duas épocas", from this player's own season rows, never a typed count.
  const nSeasons = seasons.length;
  const seasonWords = pt
    ? ["", "uma", "duas", "três", "quatro", "cinco"]
    : ["", "one", "two", "three", "four", "five"];
  const seasonCount = seasonWords[nSeasons] ?? String(nSeasons);

  /* ------------------------------------------------- position-aware metric */

  // ADR-019: goals-per-90 above replacement says nothing about a goalkeeper —
  // every keeper in the fit lands on the same floor value — and almost
  // nothing about a defender. Those pages suppress it rather than print a
  // number whose only content is the player's position.
  const showGoalsSar = goalsSarIsMeaningful(player.position);
  const pr = positionRating;
  const prEntry = pr?.entry ?? null;
  const prDomain = pr ? ratingDomain(pr.peers.length ? pr.peers : [pr.entry]) : null;
  const prPct = (v: number) => (prDomain ? ratingPct(v, prDomain) : 0);
  const prZero = prDomain ? ratingPct(0, prDomain) : 0;
  const isKeeper = (player.position ?? "").toUpperCase() === "G";

  const posCopy: Record<
    RatingKind,
    { title: string; unit: string; meaning: string; caveat: string }
  > = {
    gk: {
      title: pt ? "Golos evitados" : "Goals prevented",
      unit: pt
        ? "golos evitados por 90 minutos, face ao esperado"
        : "goals prevented per 90 minutes, against expectation",
      meaning: pt
        ? `Cada remate à baliza que ${player.player} enfrentou tem um xGOT: a probabilidade de acabar em golo, dado o sítio exato onde foi colocado. Somando os xGOT sofridos e subtraindo os golos sofridos fica o que ele poupou à equipa. Positivo é melhor do que o esperado; negativo é pior.`
        : `Every shot on target ${player.player} faced carries an xGOT: the probability it ends in a goal, given exactly where it was placed. Adding up the xGOT faced and subtracting the goals conceded leaves what he saved his team. Positive is better than expected; negative is worse.`,
      caveat: pt
        ? "Uma época de guarda-redes são poucas centenas de remates, e a soma bruta é ruidosa. O modelo puxa cada guarda-redes para a média na proporção da incerteza. Se o intervalo atravessa o zero, não sabemos se ele está acima ou abaixo da média."
        : "A keeper's season is a few hundred shots, and the raw sum is noisy. The model pulls each keeper toward the average in proportion to the uncertainty. If the interval crosses zero, we do not know whether he is above or below average.",
    },
    def: {
      title: pt ? "Golos evitados pela equipa" : "Goals prevented by the team",
      unit: pt
        ? "golos sofridos a menos por 90 minutos em campo"
        : "fewer goals conceded per 90 minutes on the pitch",
      meaning: pt
        ? `Quanto muda o que a equipa sofre consoante ${player.player} esteja ou não em campo, com encolhimento forte. Mede o contributo para o resultado, não desarmes contados.`
        : `How much what the team concedes changes depending on whether ${player.player} is on the pitch, heavily shrunk. It measures contribution to the outcome, not counted tackles.`,
      caveat: pt
        ? "Colegas que jogam sempre juntos são difíceis de separar, e o campeonato tem 34 jornadas. Lê o intervalo antes do valor: diferenças pequenas entre defesas não são diferenças."
        : "Team-mates who always play together are hard to tell apart, and the league is 34 matches long. Read the interval before the value: small differences between defenders are not differences.",
    },
    contrib: {
      title: pt ? "Contribuição ofensiva" : "Attacking contribution",
      unit: pt
        ? "golos e assistências por 90 minutos acima do substituto"
        : "goals and assists per 90 minutes above replacement",
      meaning: pt
        ? "A mesma estrutura da métrica de finalização, mas somando golos e assistências. Vê o que a métrica só de golos não conseguia ver: quem cria."
        : "The same structure as the finishing metric, but adding goals and assists together. It sees what the goals-only metric could not: who creates.",
      caveat: pt
        ? "Poucos minutos puxam a estimativa para o nível de substituição e alargam o intervalo."
        : "Few minutes pull the estimate toward replacement level and widen the interval.",
    },
  };

  const t = {
    // The /jogadores framing: a finishing rank among the players published,
    // never a league-wide rank (ADR-019).
    rank: pt ? `#${player.rank} em finalização` : `#${player.rank} for finishing`,
    ofN: pt
      ? `entre os ${int(data.n_players)} publicados`
      : `of the ${int(data.n_players)} published`,
    out: pt ? "Indisponível" : "Unavailable",
    metricTitle: pt ? "Talento a marcar" : "Scoring skill",
    metricName: pt
      ? "Golos por 90 minutos acima do substituto"
      : "Goals per 90 minutes above replacement",
    meaning: pt
      ? `O que o número diz: se ${player.player} jogar 90 minutos em campo neutro contra uma defesa média da Liga, o modelo espera ${nf(
          sarValue,
        )} golos a mais do que se aquele lugar fosse ocupado por um jogador de nível de substituição — o tipo de reforço que qualquer clube arranja sem custo. Os golos são limitados (winsorizados) antes da conta, para que uma tarde de quatro golos não seja tratada como talento permanente.`
      : `What the number means: if ${player.player} plays 90 minutes at a neutral venue against an average Liga defence, the model expects ${nf(
          sarValue,
        )} more goals than if that place were taken by a replacement-level player — the kind of signing any club can make for free. Goals are capped (winsorized) before the estimate, so one four-goal afternoon is not read as permanent skill.`,
    interval: pt
      ? `Intervalo de credibilidade ${goalsIvPct}%`
      : `${goalsIvPct}% credible interval`,
    intervalMeaning: pt
      ? `O modelo dá ${goalsIvPct}% de probabilidade a que o valor verdadeiro esteja entre ${nf(
          lo,
        )} e ${nf(hi)}. Quantos menos minutos, mais largo o intervalo.`
      : `The model puts ${goalsIvPct}% probability on the true value lying between ${nf(
          lo,
        )} and ${nf(hi)}. Fewer minutes, wider interval.`,
    // One caption for both strips, with the count (audit VUXD-06).
    others: (n: number) =>
      pt
        ? `os outros ${int(n)} jogadores publicados nesta métrica`
        : `the other ${int(n)} players published on this metric`,
    minutes: pt ? "Minutos" : "Minutes",
    matches: pt ? "Jogos" : "Matches",
    goals: pt ? "Golos" : "Goals",
    goalOne: pt ? "golo" : "goal",
    perNinety: pt ? "Golos/90 reais" : "Actual goals/90",
    xgSkill: pt ? "Talento em xG/90" : "xG skill per 90",
    pAbove: pt ? "Prob. acima do substituto" : "P(above replacement)",
    trajTitle: pt ? "Época a época" : "Season by season",
    trajBody: !showGoalsSar
      ? pt
        ? "Minutos e golos, época a época. A coluna de talento a marcar não aparece aqui: para esta posição não mede nada."
        : "Minutes and goals, season by season. The scoring-skill column is absent here: for this position it measures nothing."
      : nSeasons > 1
        ? pt
          ? `Os golos sobem e descem; a estimativa de talento quase não se mexe. É assim de propósito: o modelo só admite uma mudança de talento quando os dados a exigem, e nas ${seasonCount} épocas deste jogador na Liga Portugal nunca exigiram.`
          : `Goals go up and down; the skill estimate barely moves. That is by design: the model only admits a change in skill when the data demand one, and across this player's ${seasonCount} Liga Portugal seasons they never have.`
        : pt
          ? "Minutos, golos e a estimativa de talento na única época deste jogador nos dados. O modelo só admite uma mudança de talento quando os dados a exigem."
          : "Minutes, goals and the skill estimate for this player's only season in the data. The model only admits a change in skill when the data demand one.",
    nullTitle: pt ? "Melhorou? Não dá para dizer" : "Did he improve? Can't say",
    nullBody: (c: PlayerSkillChange) => {
      // Ratio of noise to signal. It can be enormous when the delta is ~0,
      // so past 20x the sentence stops quoting a number.
      const ratio = c.delta_ref_sd / Math.max(Math.abs(c.delta), 1e-9);
      const size = pt
        ? ratio >= 20
          ? "muitas vezes maior"
          : `${nf(ratio, ratio < 10 ? 1 : 0)} vezes maior`
        : ratio >= 20
          ? "many times larger"
          : `${nf(ratio, ratio < 10 ? 1 : 0)} times larger`;
      return pt
        ? `Entre ${c.from_season} e ${c.to_season} a estimativa mudou ${
            c.delta > 0 ? "+" : c.delta < 0 ? "−" : ""
          }${nf(Math.abs(c.delta), 3)} — mas a margem de erro dessa diferença é ±${nf(
            c.delta_ref_sd,
            3,
          )}, ${size}. Ou seja: indistinguível de zero. Uma boa época de golos costuma ser variação natural, não talento novo.`
        : `Between ${c.from_season} and ${c.to_season} the estimate moved ${
            c.delta > 0 ? "+" : c.delta < 0 ? "−" : ""
          }${nf(Math.abs(c.delta), 3)} — but the margin of error on that difference is ±${nf(
            c.delta_ref_sd,
            3,
          )}, ${size}. In other words: indistinguishable from zero. A big goal season is usually natural variation, not new skill.`;
    },
    nullSingle: pt
      ? "Só há uma época deste jogador no modelo, por isso não há variação a medir. Mesmo com mais épocas, a diferença medida costuma ser mais pequena do que a sua própria margem de erro."
      : "There is only one season of this player in the model, so there is no change to measure. Even with more seasons, the measured difference is usually smaller than its own margin of error.",
    season: pt ? "Época" : "Season",
    club: pt ? "Clube" : "Club",
    skillCol: pt ? "Talento (com margem)" : "Skill (with margin)",
    recentTitle: pt ? "Últimas partidas registadas" : "Latest recorded appearances",
    recentNote: pt
      ? "Dados de jogo a jogo (SofaScore). A nota é a do fornecedor, não do modelo — o modelo só usa golos, minutos e adversário."
      : "Match-by-match data (SofaScore). The rating is the provider's, not the model's — the model only uses goals, minutes and opponent.",
    home: pt ? "casa" : "home",
    away: pt ? "fora" : "away",
    rating: pt ? "nota" : "rating",
    assists: pt ? "assist." : "assists",
    starter: pt ? "titular" : "started",
    sub: pt ? "suplente" : "sub",
    ranking: pt ? "Ranking completo" : "Full ranking",
    hub: pt ? "Todas as métricas de jogadores" : "All player metrics",
    teamPage: pt ? "Página do clube" : "Club page",
    suppressedTitle: pt
      ? "Aqui não há número de finalização"
      : "There is no finishing number here",
    suppressedBody: isKeeper
      ? pt
        ? "O ranking de jogadores deste site mede golos por 90 minutos acima de um substituto. Aplicado a um guarda-redes, devolve exatamente o mesmo valor que devolve a todos os outros guarda-redes: o mínimo da escala. Não é uma avaliação baixa — é a ausência de avaliação, e mostrá-la aqui seria fingir que medimos alguma coisa."
        : "This site's player ranking measures goals per 90 minutes above a replacement player. Applied to a goalkeeper, it returns exactly the same value it returns for every other goalkeeper: the floor of the scale. That is not a low rating — it is the absence of a rating, and showing it here would be pretending we measured something."
      : pt
        ? "O ranking de jogadores deste site mede golos por 90 minutos acima de um substituto. Aplicado a um defesa, devolve um valor no fundo da escala que diz apenas isso: que é defesa. Não o mostramos por isso."
        : "This site's player ranking measures goals per 90 minutes above a replacement player. Applied to a defender, it returns a value at the bottom of the scale which says only that: that he is a defender. So we do not show it.",
    suppressedNoMetric: isKeeper
      ? pt
        ? "A métrica de guarda-redes — golos evitados face ao xGOT dos remates sofridos — ainda não está publicada para este jogador."
        : "The goalkeeper metric — goals prevented against the xGOT of the shots faced — is not published for this player yet."
      : pt
        ? "A métrica de defesas ainda não está publicada para este jogador. Pode nunca vir a estar: separar um central do seu parceiro habitual em 34 jornadas pode simplesmente não ser possível com estes dados."
        : "The defender metric is not published for this player yet. It may never be: telling a centre-back apart from his usual partner over 34 matches may simply not be possible with these data.",
    // Read from the feed: the position models publish a 90% interval where
    // the goals model publishes 94%.
    posInterval:
      pr?.meta.intervalPct == null
        ? pt
          ? "Intervalo de credibilidade"
          : "Credible interval"
        : pt
          ? `Intervalo de credibilidade ${nf(pr.meta.intervalPct, 0)}%`
          : `${nf(pr.meta.intervalPct, 0)}% credible interval`,
    posNoInterval: pt
      ? "Este valor foi publicado sem intervalo de credibilidade, por isso não sabemos quão firme é. Lê-o com desconfiança."
      : "This value was published without a credible interval, so we do not know how firm it is. Read it with suspicion.",
    posRank: (r: number, n: number) =>
      pt ? `#${r} de ${int(n)} publicados` : `#${r} of ${int(n)} published`,
    posRaw: pt ? "Soma bruta, sem modelo" : "Raw sum, unmodelled",
    posShots: pt ? "Remates enfrentados" : "Shots faced",
    posSample: pt ? "Amostra" : "Sample",
    prev: pt ? "Anterior" : "Previous",
    next: pt ? "Seguinte" : "Next",
    footnote: pt
      ? `Modelo bayesiano de jogadores ajustado a ${int(
          data.generated_from.n_observations ?? 0,
        )} atuações individuais${
          firstSeason ? ` desde ${firstSeason}` : ""
        }, com um mínimo de ${int(
          data.generated_from.min_minutes ?? 600,
        )} minutos para entrar no ranking. Clube = plantel atual (${data.season}); a tabela época a época mostra onde jogou em cada época.${
          cutoffSentence ? ` ${cutoffSentence}` : ""
        }`
      : `Bayesian player model fitted on ${int(
          data.generated_from.n_observations ?? 0,
        )} individual appearances${
          firstSeason ? ` since ${firstSeason}` : ""
        }, with a ${int(
          data.generated_from.min_minutes ?? 600,
        )}-minute minimum to qualify. Club = current squad (${data.season}); the season-by-season table shows where he played each season.${
          cutoffSentence ? ` ${cutoffSentence}` : ""
        }`,
  };

  /**
   * The section that replaces (for keepers and defenders) or supplements
   * (for everyone else) the goals-only number. Renders the published metric
   * when there is one, and the honest explanation when there is not.
   */
  const positionSection =
    pr && prEntry ? (
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
          {posCopy[pr.kind].title}
        </h2>
        {pr.meta.seasons.length > 0 && (
          <p className="text-[11px] text-stone-500 mb-2">
            {pt
              ? `Épocas ${pr.meta.seasons[0]} a ${pr.meta.seasons[pr.meta.seasons.length - 1]}`
              : `Seasons ${pr.meta.seasons[0]} to ${pr.meta.seasons[pr.meta.seasons.length - 1]}`}
          </p>
        )}
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-4xl font-bold tabular-nums text-stone-900">
            {prEntry.value === null ? noData : sar(prEntry.value)}
          </span>
          <span className="text-sm text-stone-500">{posCopy[pr.kind].unit}</span>
        </div>
        {prEntry.rank !== null && pr.peers.length > 0 && (
          <p className="text-[11px] uppercase tracking-wider text-stone-500">
            {t.posRank(prEntry.rank, pr.peers.length)}
          </p>
        )}

        {/* Point estimate and interval, on this metric's own scale, with the
            other published players as faint ticks. */}
        {prEntry.value !== null && prDomain && (
          <div className="mt-4 mb-2">
            <div className="relative h-10">
              <div
                className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-6"
                style={{ backgroundColor: "#fcfbf5" }}
              />
              {pr.peers.map((p, i) =>
                p.value !== null && p.key !== prEntry.key ? (
                  <div
                    key={`${p.key}-${i}`}
                    className="absolute top-1/2 -translate-y-1/2 w-px h-6"
                    style={{ left: `${prPct(p.value)}%`, backgroundColor: TRACK }}
                  />
                ) : null,
              )}
              {/* Zero: the reference level this metric is measured against */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-px h-8"
                style={{ left: `${prZero}%`, backgroundColor: "#cbccbb" }}
              />
              {prEntry.lo !== null && prEntry.hi !== null && (
                <>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-px"
                    style={{
                      left: `${prPct(prEntry.lo)}%`,
                      width: `${Math.max(
                        prPct(prEntry.hi) - prPct(prEntry.lo),
                        0.4,
                      )}%`,
                      backgroundColor: SOFT,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-4"
                    style={{ left: `${prPct(prEntry.lo)}%`, backgroundColor: SOFT }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-4"
                    style={{ left: `${prPct(prEntry.hi)}%`, backgroundColor: SOFT }}
                  />
                </>
              )}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-1 h-8"
                style={{ left: `${prPct(prEntry.value)}%`, backgroundColor: color }}
              />
            </div>
            <div className="flex justify-between text-[11px] tabular-nums text-stone-500">
              <span>{sar(prDomain.min)}</span>
              <span>
                {prEntry.lo !== null && prEntry.hi !== null
                  ? `${sar(prEntry.lo)} ${pt ? "a" : "to"} ${sar(prEntry.hi)} · ${t.posInterval}`
                  : t.posInterval}
              </span>
              <span>{sar(prDomain.max)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-px h-3" style={{ backgroundColor: TRACK }} />
              <span className="text-[11px] text-stone-500">
                {t.others(pr.peers.filter((p) => p.value !== null && p.key !== prEntry.key).length)}
              </span>
            </div>
          </div>
        )}

        <p className="text-sm text-stone-600 leading-relaxed max-w-2xl mt-4">
          {posCopy[pr.kind].meaning}
        </p>
        <p className="text-xs text-stone-500 leading-relaxed max-w-2xl mt-2">
          {prEntry.lo === null || prEntry.hi === null
            ? `${t.posNoInterval} ${posCopy[pr.kind].caveat}`
            : posCopy[pr.kind].caveat}
          {pr.meta.note ? ` ${pr.meta.note}` : ""}
        </p>

        {(prEntry.shots !== null || prEntry.raw !== null) && (
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            {prEntry.shots !== null && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-stone-500">
                  {t.posShots}
                </div>
                <div className="text-lg font-bold tabular-nums text-stone-900">
                  {int(prEntry.shots)}
                </div>
              </div>
            )}
            {prEntry.raw !== null && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-stone-500">
                  {t.posRaw}
                </div>
                <div className="text-lg font-bold tabular-nums text-stone-900">
                  {sar(prEntry.raw, 1)}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    ) : null;

  /** Shown to keepers and defenders when no position metric is published. */
  const suppressedSection = (
    <section className="mb-10">
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
        {t.suppressedTitle}
      </h2>
      <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">
        {t.suppressedBody}
      </p>
      <p className="text-sm text-stone-500 leading-relaxed max-w-2xl mt-2">
        {t.suppressedNoMetric}
      </p>
      <Link
        href="/desporto/liga/jogadores"
        locale={locale}
        className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs font-medium text-ink underline underline-offset-4 hover:text-ink-dark"
      >
        {t.hub}
        <ArrowRight aria-hidden="true" className="w-3 h-3" />
      </Link>
    </section>
  );

  return (
    <div>
      {/* Identity */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-1.5 self-stretch min-h-[3.5rem]" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* The headline rank is a goals rank. For a keeper or a defender
                it ranks them on something they are not paid to do, so it is
                suppressed along with the number itself. */}
            {showGoalsSar && (
              <>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-1.5 py-0.5">
                  {t.rank}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-stone-500">
                  {t.ofN}
                </span>
              </>
            )}
            {injury && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5">
                {t.out}
              </span>
            )}
          </div>
          {showName && (
            <h1 className="text-2xl sm:text-3xl tracking-tight text-stone-900">
              {player.player}
            </h1>
          )}
          <div className="flex items-center gap-1.5 mt-1 text-sm text-stone-500">
            {teamLogoSrc(player.team) && (
              <img
                src={teamLogoSrc(player.team)}
                alt=""
                width={16}
                height={16}
                loading="lazy"
                decoding="async"
                className="w-4 h-4 object-contain"
              />
            )}
            <span>{teamDisplayName(player.team)}</span>
            <span className="text-stone-500">·</span>
            <span>{posLabel}</span>
          </div>
        </div>
      </div>

      {injury && (
        <div className="border-l-2 border-red-400 pl-3 py-1 mb-6 text-sm">
          <span className="font-semibold text-red-700">{t.out}</span>
          {injuryReason ? <span className="text-stone-600"> — {injuryReason}</span> : null}
          {injury.expected_return ? (
            <span className="text-stone-500">
              {" "}
              ({pt ? "regresso previsto a" : "expected back"} {formatLongDate(injury.expected_return, locale)})
            </span>
          ) : null}
        </div>
      )}

      {/* The metric that applies to this position. For keepers and defenders
          it stands alone; for everyone else it sits under the goals number. */}
      {!showGoalsSar && (positionSection ?? suppressedSection)}

      {/* The goals-only metric — suppressed where it is degenerate */}
      {showGoalsSar && (
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
          {t.metricTitle}
        </h2>
        {cutoffLabel && (
          <p className="text-[11px] text-stone-500 mb-2">{cutoffLabel}</p>
        )}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold tabular-nums text-stone-900">
            {sar(sarValue)}
          </span>
          <span className="text-sm text-stone-500">{t.metricName}</span>
        </div>

        {/* Point estimate + interval, on the same scale as every other
            published player (faint ticks). */}
        <div className="mt-4 mb-2">
          <div className="relative h-10">
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-6"
              style={{ backgroundColor: "#fcfbf5" }}
            />
            {ranked.map(p =>
              p.sar !== null && p.slug !== player.slug ? (
                <div
                  key={p.slug}
                  className="absolute top-1/2 -translate-y-1/2 w-px h-6"
                  style={{ left: `${pct(p.sar)}%`, backgroundColor: TRACK }}
                />
              ) : null,
            )}
            {/* The credible interval (its mass is read from the feed) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-px"
              style={{
                left: `${pct(lo)}%`,
                width: `${Math.max(pct(hi) - pct(lo), 0.4)}%`,
                backgroundColor: SOFT,
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-px h-4"
              style={{ left: `${pct(lo)}%`, backgroundColor: SOFT }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-px h-4"
              style={{ left: `${pct(hi)}%`, backgroundColor: SOFT }}
            />
            {/* Point estimate */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1 h-8"
              style={{ left: `${pct(sarValue)}%`, backgroundColor: color }}
            />
          </div>
          <div className="flex justify-between text-[11px] tabular-nums text-stone-500">
            <span>{sar(0)}</span>
            <span>
              {sar(lo)} {pt ? "a" : "to"} {sar(hi)} · {t.interval}
            </span>
            <span>{sar(maxHi)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-px h-3" style={{ backgroundColor: TRACK }} />
            <span className="text-[11px] text-stone-500">
              {t.others(ranked.filter(p => p.sar !== null && p.slug !== player.slug).length)}
            </span>
          </div>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed max-w-2xl mt-4">
          {t.meaning}
        </p>
        <p className="text-xs text-stone-500 leading-relaxed max-w-2xl mt-2">
          {t.intervalMeaning}
        </p>
      </section>
      )}

      {/* A published position metric, alongside the goals number when both
          apply (a midfielder's contribution, for instance). */}
      {showGoalsSar && positionSection}

      {/* Raw record. The two derived columns are goals-model outputs, so they
          go with it when it is suppressed. */}
      <section className="mb-10 border-t border-stone-200 pt-5">
      {cutoffLabel && (
        <p className="mb-3 text-[11px] text-stone-500">
          {pt
            ? `Minutos, jogos e golos${firstSeason && lastSeason ? ` de ${firstSeason} a ${lastSeason}` : ""} · ${cutoffLabel}`
            : `Minutes, matches and goals${firstSeason && lastSeason ? ` from ${firstSeason} to ${lastSeason}` : ""} · ${cutoffLabel}`}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-4">
        {[
          { label: t.minutes, value: int(player.minutes) },
          { label: t.matches, value: int(player.matches) },
          { label: t.goals, value: int(player.goals) },
          {
            label: t.perNinety,
            value: player.goals_per_90 === null ? noData : nf(player.goals_per_90),
          },
          ...(showGoalsSar
            ? [
                {
                  label: t.xgSkill,
                  value:
                    player.xg_skill_per_90 === null
                      ? noData
                      : nf(player.xg_skill_per_90),
                },
                {
                  label: t.pAbove,
                  value:
                    player.p_above_replacement === null
                      ? noData
                      : formatPosterior(player.p_above_replacement, pt ? "pt" : "en"),
                },
              ]
            : []),
        ].map(cell => (
          <div key={cell.label}>
            <div className="text-[11px] uppercase tracking-wider text-stone-500">
              {cell.label}
            </div>
            <div className="text-lg font-bold tabular-nums text-stone-900">
              {cell.value}
            </div>
          </div>
        ))}
      </div>
      </section>

      {/* Trajectory — the flat skill line next to the noisy goal counts */}
      {seasons.length > 0 && (
        <section className="mb-10 border-t border-stone-200 pt-5">
          <h2 className="text-2xl tracking-tight mb-1">{t.trajTitle}</h2>
          <p className="text-sm text-stone-500 mb-4 max-w-2xl leading-relaxed">
            {t.trajBody}
          </p>

          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={t.trajTitle}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-300 text-left">
                  <th className="py-2 pr-3 font-medium text-[11px] uppercase tracking-wider text-stone-500">
                    {t.season}
                  </th>
                  <th className="py-2 pr-3 font-medium text-[11px] uppercase tracking-wider text-stone-500 hidden sm:table-cell">
                    {t.club}
                  </th>
                  <th className="py-2 px-2 text-right font-medium text-[11px] uppercase tracking-wider text-stone-500">
                    {t.minutes}
                  </th>
                  <th className="py-2 px-2 text-right font-medium text-[11px] uppercase tracking-wider text-stone-500">
                    {t.goals}
                  </th>
                  <th className="py-2 px-2 text-right font-medium text-[11px] uppercase tracking-wider text-stone-500 hidden sm:table-cell">
                    {t.perNinety}
                  </th>
                  {showGoalsSar && (
                    <th className="py-2 pl-2 font-medium text-[11px] uppercase tracking-wider text-stone-500 w-[38%]">
                      {t.skillCol}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {seasons.map(s => {
                  const v = s.sar_season;
                  const sd = s.sar_season_sd ?? 0;
                  return (
                    <tr key={s.season} className="border-b border-stone-100">
                      <td className="whitespace-nowrap py-2 pr-3 tabular-nums font-medium text-stone-800">
                        {s.season}
                      </td>
                      <td className="py-2 pr-3 text-stone-500 hidden sm:table-cell">
                        {teamDisplayName(s.team)}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-stone-600">
                        {int(s.minutes)}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums font-semibold text-stone-900">
                        {int(s.goals)}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-stone-500 hidden sm:table-cell">
                        {s.goals_per_90 === null ? noData : nf(s.goals_per_90)}
                      </td>
                      {showGoalsSar && (
                      <td className="py-2 pl-2">
                        {v === null ? (
                          <span className="text-stone-500">{noData}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="relative h-4 flex-1 min-w-[80px]">
                              <div
                                className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px"
                                style={{ backgroundColor: TRACK }}
                              />
                              <div
                                className="absolute top-1/2 -translate-y-1/2 h-px"
                                style={{
                                  left: `${pct(Math.max(v - sd, 0))}%`,
                                  width: `${Math.max(
                                    pct(v + sd) - pct(Math.max(v - sd, 0)),
                                    0.5,
                                  )}%`,
                                  backgroundColor: SOFT,
                                }}
                              />
                              <div
                                className="absolute top-1/2 -translate-y-1/2 w-1 h-3.5"
                                style={{ left: `${pct(v)}%`, backgroundColor: INK }}
                              />
                            </div>
                            <span className="tabular-nums text-xs text-stone-500 w-12 text-right">
                              {sar(v)}
                            </span>
                          </div>
                        )}
                      </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* The null result, shipped as content */}
          {showGoalsSar && (
            <div className="mt-5 border-l-2 border-stone-300 pl-4 py-1 max-w-2xl">
              <h3 className="text-sm text-stone-900 mb-1">{t.nullTitle}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {thinSeason
                  ? pt
                    ? `Minutos insuficientes para comparar épocas: em ${thinSeason.season} jogou ${int(thinSeason.minutes)} ${thinSeason.minutes === 1 ? "minuto" : "minutos"} (o mínimo para comparar é ${int(MIN_SEASON_MINUTES)}), e a estimativa dessa época é quase só o ponto de partida do modelo.`
                    : `Not enough minutes to compare seasons: in ${thinSeason.season} he played ${int(thinSeason.minutes)} ${thinSeason.minutes === 1 ? "minute" : "minutes"} (the minimum to compare is ${int(MIN_SEASON_MINUTES)}), so that season's estimate is almost all the model's starting point.`
                  : change && withSkill.length > 1 ? t.nullBody(change) : t.nullSingle}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Recent appearances */}
      {recent.length > 0 && (
        <section className="mb-10 border-t border-stone-200 pt-5">
          <h2 className="text-2xl tracking-tight mb-1">{t.recentTitle}</h2>
          {cutoffLabel && (
            <p className="text-xs text-stone-500 mb-3">{cutoffLabel}</p>
          )}
          {/* Headed columns, the venue as a badge outside the name's
              truncation, minutes on one line (audit UXD2-18, UXM2V-03). */}
          <div className="max-w-3xl">
            <div aria-hidden="true" className="flex items-center gap-3 border-b border-stone-200 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <span className="w-12 flex-shrink-0 sm:w-24">{pt ? "Data" : "Date"}</span>
              <span className="min-w-0 flex-1">{pt ? "Adversário" : "Opponent"}</span>
              <span className="w-[5.25rem] flex-shrink-0 text-right">{t.minutes}</span>
              <span className="w-10 flex-shrink-0 text-right">{t.goals}</span>
              <span className="hidden w-24 flex-shrink-0 text-right sm:inline">{pt ? "Nota (fonte)" : "Rating (source)"}</span>
            </div>
            <ul className="divide-y divide-stone-100">
              {recent.map((m, i) => (
                <Fragment key={`${m.season}-${m.matchday}-${i}`}>
                {/* A season row whenever the list crosses into another season,
                    so "17 mai." after "1 fev." does not read as unsorted on a
                    phone, where the year is dropped (audit UXM3-05). */}
                {spansSeasons && (i === 0 || recent[i - 1].season !== m.season) && (
                  <li className="pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    {pt ? `Época ${m.season}` : `${m.season} season`}
                  </li>
                )}
                <li
                  className="flex items-center gap-3 py-2 text-sm"
                >
                  <span className="w-12 flex-shrink-0 whitespace-nowrap text-[11px] tabular-nums text-stone-600 sm:w-24">
                    {/* Day and month on a phone; the season rows carry the year. */}
                    <span className="sm:hidden">{(formatShortDate(m.date, locale) ?? `J${m.matchday}`).replace(/\s\d{4}$/, "")}</span>
                    <span className="hidden sm:inline">{formatShortDate(m.date, locale) ?? `${m.season} J${m.matchday}`}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="min-w-0 truncate text-stone-800">{teamDisplayName(m.opponent)}</span>
                    <span
                      className="flex-shrink-0 rounded border border-line px-1 text-[11px] font-semibold text-stone-600"
                      title={m.is_home ? t.home : t.away}
                    >
                      <span aria-hidden="true">{m.is_home ? (pt ? "C" : "H") : (pt ? "F" : "A")}</span>
                      <span className="sr-only">{m.is_home ? t.home : t.away}</span>
                    </span>
                  </span>
                  <span className="w-[5.25rem] flex-shrink-0 whitespace-nowrap text-right text-[11px] tabular-nums text-stone-600">
                    {int(m.minutes)}&apos; · {m.started ? t.starter : t.sub}
                  </span>
                  <span className="w-10 flex-shrink-0 text-right tabular-nums">
                    {m.goals > 0 ? (
                      <span className="font-bold text-stone-900">{m.goals}</span>
                    ) : (
                      <span className="text-stone-500">
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">{pt ? "sem golos" : "no goals"}</span>
                      </span>
                    )}
                  </span>
                  <span className="hidden w-24 flex-shrink-0 text-right text-xs tabular-nums text-stone-600 sm:inline">
                    {m.rating === null ? "" : nf(m.rating, 1)}
                  </span>
                </li>
                </Fragment>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-stone-500 mt-3 max-w-2xl leading-relaxed">
            {t.recentNote}
          </p>
        </section>
      )}

      {/* Neighbours in the ranking + club page */}
      <section className="border-t border-stone-200 pt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <Link
          href="/desporto/liga/jogadores"
          locale={locale}
          className="text-stone-600 hover:text-stone-900 inline-flex min-h-11 items-center gap-1"
        >
          {t.hub}
          <ArrowRight className="w-3 h-3" />
        </Link>
        {prev && (
          <Link
            href={`/desporto/liga/jogador/${prev.slug}`}
            locale={locale}
            className="text-stone-600 hover:text-stone-900 inline-flex min-h-11 items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            {t.prev}: {prev.player} (#{prev.rank})
          </Link>
        )}
        {next && (
          <Link
            href={`/desporto/liga/jogador/${next.slug}`}
            locale={locale}
            className="text-stone-600 hover:text-stone-900 inline-flex min-h-11 items-center gap-1"
          >
            {t.next}: {next.player} (#{next.rank})
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
        {teamSlug && clubInLeague && (
          <Link
            href={`/desporto/liga/${teamSlug}`}
            locale={locale}
            className="text-stone-600 hover:text-stone-900 inline-flex min-h-11 items-center gap-1"
          >
            {t.teamPage}: {teamDisplayName(player.team)}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </section>

      <p className="text-[11px] text-stone-500 mt-6 leading-relaxed max-w-2xl">
        {t.footnote}
      </p>
    </div>
  );
}
