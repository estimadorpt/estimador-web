"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  ligaTeamColors,
  ligaTeamShortNames,
  teamDisplayName,
  teamLogoSrc,
} from "@/lib/config/football";
import { positionCodeEn, positionCodePt } from "@/lib/i18n/football-labels";

export interface PlayerSkillEntry {
  rank: number;
  player: string;
  team: string;
  position: string;
  minutes: number;
  matches: number;
  goals: number;
  goals_per_90: number;
  sar: number;
  skill_lo: number;
  skill_hi: number;
  xg_skill_per_90?: number;
  p_above_replacement?: number;
  last_season?: string;
}

export interface PlayerSkillMover {
  player: string;
  team: string;
  from_season: string;
  to_season: string;
  delta: number;
  delta_ref_sd: number;
  sar_from: number;
  sar_to: number;
  goals_from: number;
  goals_to: number;
}

export interface PlayerSkillData {
  season: string;
  model: string;
  metric: string;
  metric_label: string;
  /** Posterior interval mass as a fraction (0.9). Older feeds omit it. */
  interval_mass?: number;
  generated_from: {
    n_players: number;
    n_observations: number;
    min_minutes: number;
    seasons: string[];
    max_rhat?: number;
    divergences?: number;
  };
  movers_note?: string;
  movers?: PlayerSkillMover[];
  players: PlayerSkillEntry[];
}

interface PlayerSkillRankingProps {
  data: PlayerSkillData;
  locale?: string;
  /** Clubs playing in the current season — used to flag stale club labels. */
  currentTeams?: string[];
  /** Player names currently unavailable (injury/suspension). */
  unavailable?: Record<string, string>;
  /** Player name → player-page slug. Rows without a slug stay unlinked. */
  playerSlugs?: Record<string, string>;
}

// Single-hue magnitude ramp — identity is carried by the logo + club chip,
// so the bar stays one colour and lengths stay comparable across rows.
const BAR = "#1c1917"; // stone-900
const BAR_SOFT = "#a8a29e"; // stone-400 — interval, over the light surface
const BAR_INSIDE = "#d6d3d1"; // stone-300 — interval, over the dark bar

export function PlayerSkillRanking({
  data,
  locale = "pt",
  currentTeams,
  unavailable,
  playerSlugs,
}: PlayerSkillRankingProps) {
  const pt = locale !== "en";
  const [showAll, setShowAll] = useState(false);
  const [openRank, setOpenRank] = useState<number | null>(null);

  if (!data?.players?.length) return null;

  const teamSet = currentTeams && currentTeams.length ? new Set(currentTeams) : null;
  const players = data.players;
  const hasUnavailable = players.some((p) => unavailable?.[p.player]);
  const hasPages = players.some((p) => playerSlugs?.[p.player]);
  const visible = showAll ? players : players.slice(0, 15);
  const maxHi = Math.max(...players.map((p) => p.skill_hi), 0.1);

  const nf = (v: number, d = 2) =>
    v.toLocaleString(pt ? "pt-PT" : "en-GB", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  const int = (v: number) => v.toLocaleString(pt ? "pt-PT" : "en-GB");

  // Read the interval mass from the feed. This was hardcoded to 94% while the
  // model published 90%, so never reintroduce a literal here.
  const ivPct = Math.round((data.interval_mass ?? 0.9) * 100);

  const t = {
    title: pt
      ? "Os melhores finalizadores da Liga, segundo o modelo"
      : "The league's best finishers, according to the model",
    intro: pt
      ? `Um modelo bayesiano de jogadores estimado sobre ${int(
          data.generated_from.n_observations
        )} atuações individuais desde ${data.generated_from.seasons[0]}. Para cada jogador mede o talento a marcar depois de descontar os minutos jogados, o adversário, o fator casa e a posição — golos a mais por 90 minutos face a um jogador de nível de substituição. Mede apenas finalização: guarda-redes e defesas ficam todos no mesmo mínimo, por isso esta é na prática uma lista de avançados.`
      : `A Bayesian player model fitted on ${int(
          data.generated_from.n_observations
        )} individual appearances since ${data.generated_from.seasons[0]}. For each player it estimates scoring skill after adjusting for minutes played, opponent, home advantage and position — extra goals per 90 minutes over a replacement-level player. It measures finishing only: goalkeepers and defenders all sit at the same floor, so this is in practice a list of forwards.`,
    metric: pt ? "Golos por 90' acima do substituto" : "Goals per 90 above replacement",
    rangeHint: pt
      ? `A barra é a estimativa central; a linha fina é o intervalo de ${ivPct}% de credibilidade. Quantos menos minutos, mais larga é a linha.`
      : `The bar is the central estimate; the thin line is the ${ivPct}% credible interval. Fewer minutes, wider line.`,
    showAll: pt
      ? `Ver a lista completa (${players.length})`
      : `Show the full list (${players.length})`,
    showLess: pt ? "Mostrar apenas o top 15" : "Show only the top 15",
    minutes: pt ? "minutos" : "minutes",
    goals: pt ? "golos" : "goals",
    matches: pt ? "jogos" : "matches",
    perNinety: pt ? "golos/90 reais" : "actual goals/90",
    interval: pt ? `intervalo ${ivPct}%` : `${ivPct}% interval`,
    playerPage: pt ? "Página do jogador" : "Player page",
    legendPage: pt
      ? "Seta à direita: página do jogador, com o intervalo e o histórico época a época"
      : "Arrow on the right: the player's page, with the interval and season-by-season history",
    openPlayer: (name: string) =>
      pt ? `Abrir a página de ${name}` : `Open ${name}'s page`,
    notInLeague: pt ? "fora da Liga 26/27" : "not in Liga 26/27",
    out: pt ? "lesionado" : "injured",
    legendOut: pt
      ? "Indisponível neste momento — toque no jogador para saber porquê"
      : "Currently unavailable — tap the player to see why",
    footnote: pt
      ? `Clube = último clube onde o jogador atuou nos dados (épocas ${data.generated_from.seasons[0]} a ${
          data.generated_from.seasons[data.generated_from.seasons.length - 1]
        }); transferências recentes podem não estar refletidas. Mínimo ${int(
          data.generated_from.min_minutes
        )} minutos para entrar no ranking (${int(data.generated_from.n_players)} jogadores elegíveis).`
      : `Club = the player's most recent club in the data (seasons ${data.generated_from.seasons[0]} to ${
          data.generated_from.seasons[data.generated_from.seasons.length - 1]
        }); recent transfers may not be reflected. Minimum ${int(
          data.generated_from.min_minutes
        )} minutes to qualify (${int(data.generated_from.n_players)} eligible players).`,
    hubLink: pt
      ? "Guarda-redes, defesas e criadores: as outras métricas"
      : "Goalkeepers, defenders and creators: the other metrics",
    hubHint: pt
      ? "Esta lista mede finalização e mais nada. Cada posição tem a sua própria métrica, na sua própria escala."
      : "This list measures finishing and nothing else. Each position has its own metric, on its own scale.",
    moversTitle: pt ? "Ninguém melhorou (nem piorou)" : "Nobody improved (or got worse)",
    moversBody: pt
      ? "O modelo também mediu quanto o talento de cada jogador mudou de época para época. A maior variação encontrada é cerca de cinco vezes menor do que a própria margem de erro: em três épocas de Liga Portugal não há sinal de que alguém tenha mesmo melhorado a finalizar. As boas fases existem — mas são sobretudo sorte na quantidade de golos, não talento novo."
      : "The model also measured how much each player's skill moved season to season. The largest change found is about five times smaller than its own margin of error: across three Liga Portugal seasons there is no evidence that anyone genuinely got better at finishing. Hot streaks are real — but they are mostly goal-count noise, not new skill.",
    biggest: pt ? "Maior variação medida" : "Largest measured change",
    vsError: pt ? "margem de erro" : "margin of error",
  };

  const posLabel = (p: string) => (pt ? positionCodePt[p] : positionCodeEn[p]) ?? p;
  const topMover = data.movers?.[0];

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-1">{t.title}</h2>
      <p className="text-sm text-stone-500 mb-3 max-w-3xl leading-relaxed">{t.intro}</p>

      {/* One number cannot rank a keeper against a striker; the hub carries
          the position-specific metrics and the reason there are several. */}
      <div className="mb-6 max-w-3xl">
        <Link
          href="/desporto/liga/jogadores"
          locale={locale}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
        >
          {t.hubLink}
          <ChevronRight className="w-3 h-3" />
        </Link>
        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">{t.hubHint}</p>
      </div>

      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-200">
        <div className="w-6 flex-shrink-0" />
        <div className="w-32 sm:w-52 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {pt ? "Jogador" : "Player"}
        </div>
        <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {t.metric}
        </div>
        <div className="w-12 sm:w-16 flex-shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-stone-400">
          SAR
        </div>
        {/* Keeps the header aligned with the per-row link column */}
        <div className="w-6 flex-shrink-0" />
      </div>

      {hasUnavailable && (
        <div className="flex items-center gap-1.5 mb-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-[10px] text-stone-400">{t.legendOut}</span>
        </div>
      )}

      {hasPages && (
        <div className="flex items-center gap-1.5 mb-1 mt-1">
          <ChevronRight className="w-3 h-3 text-stone-300 flex-shrink-0" />
          <span className="text-[10px] text-stone-400">{t.legendPage}</span>
        </div>
      )}

      <div className="divide-y divide-stone-100">
        {visible.map((p) => {
          const barPct = (p.sar / maxHi) * 100;
          const loPct = (p.skill_lo / maxHi) * 100;
          const hiPct = (p.skill_hi / maxHi) * 100;
          const stale = teamSet ? !teamSet.has(p.team) : false;
          const outReason = unavailable?.[p.player];
          const isOpen = openRank === p.rank;
          const chip = ligaTeamColors[p.team] || "#78716c";
          const slug = playerSlugs?.[p.player];

          return (
            <div key={p.rank}>
              {/* The row expands on click; the trailing chevron is a separate
                  link, so no anchor is ever nested inside the button. */}
              <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => setOpenRank(isOpen ? null : p.rank)}
                aria-expanded={isOpen}
                className="flex-1 min-w-0 flex items-center gap-2 py-1.5 text-left hover:bg-stone-50 transition-colors"
              >
                {/* Rank */}
                <div className="w-6 flex-shrink-0 text-right text-xs font-bold tabular-nums text-stone-400">
                  {p.rank}
                </div>

                {/* Player + club */}
                <div className="w-32 sm:w-52 flex-shrink-0 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        stale ? "text-stone-400" : "text-stone-900"
                      }`}
                    >
                      {p.player}
                    </span>
                    {outReason && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"
                        title={outReason}
                        aria-label={t.out}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {teamLogoSrc(p.team) ? (
                      <img
                        src={teamLogoSrc(p.team)}
                        alt=""
                        className={`w-3 h-3 object-contain flex-shrink-0 ${stale ? "opacity-40" : ""}`}
                      />
                    ) : (
                      <span
                        className="w-1 h-3 flex-shrink-0"
                        style={{ backgroundColor: chip }}
                      />
                    )}
                    <span className="text-[10px] text-stone-400 truncate sm:hidden">
                      {ligaTeamShortNames[p.team] || p.team}
                    </span>
                    <span className="text-[10px] text-stone-400 truncate hidden sm:inline">
                      {teamDisplayName(p.team)}
                    </span>
                    <span className="text-[10px] text-stone-300 hidden sm:inline">
                      · {posLabel(p.position)} · {int(p.minutes)} min
                    </span>
                    <span className="text-[10px] text-stone-300 sm:hidden">
                      · {int(p.minutes)}&apos;
                    </span>
                    {stale && (
                      <span className="text-[9px] uppercase tracking-wide text-amber-600 bg-amber-50 px-1 py-px flex-shrink-0">
                        {t.notInLeague}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bar + credible interval. The bar is painted first; the
                    interval sits on top in two segments so the half that
                    overlaps the bar stays legible against the dark fill. */}
                <div className="flex-1 h-6 relative">
                  <div className="absolute inset-y-0 left-0 right-0 bg-stone-50" />
                  {/* Point estimate */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded-r-[3px]"
                    style={{
                      left: 0,
                      width: `${barPct}%`,
                      backgroundColor: BAR,
                      opacity: stale ? 0.3 : 0.85,
                    }}
                  />
                  {/* 94% credible interval — lower half, over the bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-px"
                    style={{
                      left: `${loPct}%`,
                      width: `${Math.max(barPct - loPct, 0.3)}%`,
                      backgroundColor: BAR_INSIDE,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-2"
                    style={{ left: `${loPct}%`, backgroundColor: BAR_INSIDE }}
                  />
                  {/* upper half, over the surface */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-px"
                    style={{
                      left: `${barPct}%`,
                      width: `${Math.max(hiPct - barPct, 0.3)}%`,
                      backgroundColor: BAR_SOFT,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-2"
                    style={{ left: `${hiPct}%`, backgroundColor: BAR_SOFT }}
                  />
                </div>

                {/* Value */}
                <div className="w-12 sm:w-16 flex-shrink-0 text-right">
                  <span className="text-xs sm:text-sm font-bold tabular-nums text-stone-900">
                    {nf(p.sar)}
                  </span>
                </div>
              </button>
                {slug ? (
                  <Link
                    href={`/desporto/liga/jogador/${slug}`}
                    locale={locale}
                    aria-label={t.openPlayer(p.player)}
                    className="w-6 flex-shrink-0 flex items-center justify-center text-stone-300 hover:text-stone-800 hover:bg-stone-50 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="w-6 flex-shrink-0" />
                )}
              </div>

              {isOpen && (
                <div className="pl-8 pr-2 pb-3 pt-1 bg-stone-50/60">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-stone-400">
                        {t.minutes}
                      </div>
                      <div className="font-semibold tabular-nums text-stone-800">
                        {int(p.minutes)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-stone-400">
                        {t.goals} / {t.matches}
                      </div>
                      <div className="font-semibold tabular-nums text-stone-800">
                        {p.goals} / {p.matches}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-stone-400">
                        {t.perNinety}
                      </div>
                      <div className="font-semibold tabular-nums text-stone-800">
                        {nf(p.goals_per_90)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-stone-400">
                        {t.interval}
                      </div>
                      <div className="font-semibold tabular-nums text-stone-800">
                        {nf(p.skill_lo)} – {nf(p.skill_hi)}
                      </div>
                    </div>
                  </div>
                  {outReason && (
                    <div className="mt-2 text-[11px] text-red-600">{outReason}</div>
                  )}
                  {slug && (
                    <Link
                      href={`/desporto/liga/jogador/${slug}`}
                      locale={locale}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-800"
                    >
                      {t.playerPage}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {players.length > 15 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs font-medium text-blue-700 hover:text-blue-800"
        >
          {showAll ? t.showLess : t.showAll}
        </button>
      )}

      <p className="text-[10px] text-stone-400 mt-4 leading-relaxed max-w-3xl">
        {t.rangeHint} {t.footnote}
      </p>

      {/* The null result, shipped as content */}
      {topMover && (
        <div className="mt-8 border-l-2 border-stone-300 pl-4 py-1 max-w-3xl">
          <h3 className="text-sm font-bold text-stone-900 mb-1">{t.moversTitle}</h3>
          <p className="text-sm text-stone-600 leading-relaxed">{t.moversBody}</p>
          <p className="text-xs text-stone-500 mt-2 tabular-nums">
            {t.biggest}: <span className="font-semibold">{topMover.player}</span>{" "}
            {topMover.from_season} → {topMover.to_season}{" "}
            <span className="font-semibold">
              {topMover.delta > 0 ? "+" : ""}
              {nf(topMover.delta, 3)}
            </span>{" "}
            <span className="text-stone-400">
              ({t.vsError} ±{nf(topMover.delta_ref_sd, 3)})
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
