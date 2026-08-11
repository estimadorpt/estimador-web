"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  ligaTeamColors,
  ligaTeamSlugs,
  teamDisplayName,
  teamLogoSrc,
} from "@/lib/config/football";
import { positionCodeEn, positionCodePt } from "@/lib/i18n/football-labels";

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
  generated_from: {
    n_players?: number;
    n_observations?: number;
    min_minutes?: number;
    seasons?: string[];
  };
  skill_change_note?: string;
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
}

const TRACK = "#e7e5e4"; // stone-200
const INK = "#1c1917"; // stone-900
const SOFT = "#a8a29e"; // stone-400

export function PlayerProfile({
  player,
  data,
  locale = "pt",
  injury,
  injuryReason,
}: PlayerProfileProps) {
  const pt = locale !== "en";
  const nf = (v: number, d = 2) =>
    v.toLocaleString(pt ? "pt-PT" : "en-GB", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  const int = (v: number) => v.toLocaleString(pt ? "pt-PT" : "en-GB");

  const color = ligaTeamColors[player.team] ?? "#78716c";
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

  const sar = player.sar ?? 0;
  const lo = player.skill_lo ?? sar;
  const hi = player.skill_hi ?? sar;

  const seasons = player.seasons;
  const withSkill = seasons.filter(s => s.sar_season !== null);
  const change = player.skill_change;
  const firstSeason = data.generated_from.seasons?.[0];
  const lastSeason =
    data.generated_from.seasons?.[data.generated_from.seasons.length - 1];

  const t = {
    rank: pt ? `#${player.rank} da Liga` : `#${player.rank} in the league`,
    ofN: pt
      ? `entre os ${int(data.n_players)} melhores`
      : `of the top ${int(data.n_players)}`,
    out: pt ? "Indisponível" : "Unavailable",
    metricTitle: pt ? "Talento a marcar" : "Scoring skill",
    metricName: pt
      ? "Golos por 90 minutos acima do substituto"
      : "Goals per 90 minutes above replacement",
    meaning: pt
      ? `O que o número diz: se ${player.player} jogar 90 minutos em campo neutro contra uma defesa média da Liga, o modelo espera ${nf(
          sar,
        )} golos a mais do que se aquele lugar fosse ocupado por um jogador de nível de substituição — o tipo de reforço que qualquer clube arranja sem custo. Os golos são limitados (winsorizados) antes da conta, para que uma tarde de quatro golos não seja tratada como talento permanente.`
      : `What the number means: if ${player.player} plays 90 minutes at a neutral venue against an average Liga defence, the model expects ${nf(
          sar,
        )} more goals than if that place were taken by a replacement-level player — the kind of signing any club can make for free. Goals are capped (winsorized) before the estimate, so one four-goal afternoon is not read as permanent skill.`,
    interval: pt ? "Intervalo de credibilidade 94%" : "94% credible interval",
    intervalMeaning: pt
      ? `O modelo dá 94% de probabilidade a que o valor verdadeiro esteja entre ${nf(
          lo,
        )} e ${nf(hi)}. Quantos menos minutos, mais largo o intervalo.`
      : `The model puts 94% probability on the true value lying between ${nf(
          lo,
        )} and ${nf(hi)}. Fewer minutes, wider interval.`,
    others: pt ? "outros do top 40" : "others in the top 40",
    minutes: pt ? "Minutos" : "Minutes",
    matches: pt ? "Jogos" : "Matches",
    goals: pt ? "Golos" : "Goals",
    goalOne: pt ? "golo" : "goal",
    perNinety: pt ? "Golos/90 reais" : "Actual goals/90",
    xgSkill: pt ? "Talento em xG/90" : "xG skill per 90",
    pAbove: pt ? "Prob. acima do substituto" : "P(above replacement)",
    trajTitle: pt ? "Época a época" : "Season by season",
    trajBody: pt
      ? "Os golos sobem e descem; a estimativa de talento quase não se mexe. É assim de propósito: o modelo só admite uma mudança de talento quando os dados a exigem, e em três épocas de Liga Portugal nunca exigiram."
      : "Goals go up and down; the skill estimate barely moves. That is by design: the model only admits a change in skill when the data demand one, and across three Liga Portugal seasons they never have.",
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
            c.delta > 0 ? "+" : ""
          }${nf(c.delta, 3)} — mas a margem de erro dessa diferença é ±${nf(
            c.delta_ref_sd,
            3,
          )}, ${size}. Ou seja: indistinguível de zero. Uma boa época de golos costuma ser variação natural, não talento novo.`
        : `Between ${c.from_season} and ${c.to_season} the estimate moved ${
            c.delta > 0 ? "+" : ""
          }${nf(c.delta, 3)} — but the margin of error on that difference is ±${nf(
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
    recentTitle: pt ? "Últimas partidas" : "Recent appearances",
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
    teamPage: pt ? "Página do clube" : "Club page",
    prev: pt ? "Anterior" : "Previous",
    next: pt ? "Seguinte" : "Next",
    footnote: pt
      ? `Modelo bayesiano de jogadores ajustado a ${int(
          data.generated_from.n_observations ?? 0,
        )} atuações individuais${
          firstSeason ? ` desde ${firstSeason}` : ""
        }, com um mínimo de ${int(
          data.generated_from.min_minutes ?? 600,
        )} minutos para entrar no ranking. Clube = o último clube do jogador nos dados (${firstSeason} a ${lastSeason}); transferências recentes podem não estar refletidas.`
      : `Bayesian player model fitted on ${int(
          data.generated_from.n_observations ?? 0,
        )} individual appearances${
          firstSeason ? ` since ${firstSeason}` : ""
        }, with a ${int(
          data.generated_from.min_minutes ?? 600,
        )}-minute minimum to qualify. Club = the player's most recent club in the data (${firstSeason} to ${lastSeason}); recent transfers may not be reflected.`,
  };

  return (
    <div>
      {/* Identity */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-1.5 self-stretch min-h-[3.5rem]" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-1.5 py-0.5">
              {t.rank}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400">
              {t.ofN}
            </span>
            {injury && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5">
                {t.out}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            {player.player}
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-stone-500">
            {teamLogoSrc(player.team) && (
              <img
                src={teamLogoSrc(player.team)}
                alt=""
                className="w-4 h-4 object-contain"
              />
            )}
            <span>{teamDisplayName(player.team)}</span>
            <span className="text-stone-300">·</span>
            <span>{posLabel}</span>
          </div>
        </div>
      </div>

      {injury && (
        <div className="border-l-2 border-red-400 pl-3 py-1 mb-6 text-sm">
          <span className="font-semibold text-red-700">{t.out}</span>
          {injuryReason ? <span className="text-stone-600"> — {injuryReason}</span> : null}
          {injury.expected_return ? (
            <span className="text-stone-400">
              {" "}
              ({pt ? "regresso previsto" : "expected back"} {injury.expected_return})
            </span>
          ) : null}
        </div>
      )}

      {/* The metric */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
          {t.metricTitle}
        </h2>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold tabular-nums text-stone-900">
            {nf(sar)}
          </span>
          <span className="text-sm text-stone-500">{t.metricName}</span>
        </div>

        {/* Point estimate + interval, on the same scale as every other
            published player (faint ticks). */}
        <div className="mt-4 mb-2">
          <div className="relative h-10">
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-6"
              style={{ backgroundColor: "#fafaf9" }}
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
            {/* 94% interval */}
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
              style={{ left: `${pct(sar)}%`, backgroundColor: color }}
            />
          </div>
          <div className="flex justify-between text-[10px] tabular-nums text-stone-400">
            <span>0</span>
            <span>
              {nf(lo)} – {nf(hi)} · {t.interval}
            </span>
            <span>{nf(maxHi)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-px h-3" style={{ backgroundColor: TRACK }} />
            <span className="text-[10px] text-stone-400">{t.others}</span>
          </div>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed max-w-2xl mt-4">
          {t.meaning}
        </p>
        <p className="text-xs text-stone-400 leading-relaxed max-w-2xl mt-2">
          {t.intervalMeaning}
        </p>
      </section>

      {/* Raw record */}
      <section className="mb-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-4 border-t border-stone-200 pt-5">
        {[
          { label: t.minutes, value: int(player.minutes) },
          { label: t.matches, value: int(player.matches) },
          { label: t.goals, value: int(player.goals) },
          {
            label: t.perNinety,
            value: player.goals_per_90 === null ? "—" : nf(player.goals_per_90),
          },
          {
            label: t.xgSkill,
            value:
              player.xg_skill_per_90 === null ? "—" : nf(player.xg_skill_per_90),
          },
          {
            label: t.pAbove,
            value:
              player.p_above_replacement === null
                ? "—"
                : `${Math.round(player.p_above_replacement * 100)}%`,
          },
        ].map(cell => (
          <div key={cell.label}>
            <div className="text-[10px] uppercase tracking-wider text-stone-400">
              {cell.label}
            </div>
            <div className="text-lg font-bold tabular-nums text-stone-900">
              {cell.value}
            </div>
          </div>
        ))}
      </section>

      {/* Trajectory — the flat skill line next to the noisy goal counts */}
      {seasons.length > 0 && (
        <section className="mb-10 border-t border-stone-200 pt-5">
          <h2 className="text-xl font-bold tracking-tight mb-1">{t.trajTitle}</h2>
          <p className="text-sm text-stone-500 mb-4 max-w-2xl leading-relaxed">
            {t.trajBody}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-300 text-left">
                  <th className="py-2 pr-3 font-medium text-[10px] uppercase tracking-wider text-stone-400">
                    {t.season}
                  </th>
                  <th className="py-2 pr-3 font-medium text-[10px] uppercase tracking-wider text-stone-400 hidden sm:table-cell">
                    {t.club}
                  </th>
                  <th className="py-2 px-2 text-right font-medium text-[10px] uppercase tracking-wider text-stone-400">
                    {t.minutes}
                  </th>
                  <th className="py-2 px-2 text-right font-medium text-[10px] uppercase tracking-wider text-stone-400">
                    {t.goals}
                  </th>
                  <th className="py-2 px-2 text-right font-medium text-[10px] uppercase tracking-wider text-stone-400 hidden sm:table-cell">
                    {t.perNinety}
                  </th>
                  <th className="py-2 pl-2 font-medium text-[10px] uppercase tracking-wider text-stone-400 w-[38%]">
                    {t.skillCol}
                  </th>
                </tr>
              </thead>
              <tbody>
                {seasons.map(s => {
                  const v = s.sar_season;
                  const sd = s.sar_season_sd ?? 0;
                  return (
                    <tr key={s.season} className="border-b border-stone-100">
                      <td className="py-2 pr-3 tabular-nums font-medium text-stone-800">
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
                        {s.goals_per_90 === null ? "—" : nf(s.goals_per_90)}
                      </td>
                      <td className="py-2 pl-2">
                        {v === null ? (
                          <span className="text-stone-300">—</span>
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
                            <span className="tabular-nums text-xs text-stone-500 w-10 text-right">
                              {nf(v)}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* The null result, shipped as content */}
          <div className="mt-5 border-l-2 border-stone-300 pl-4 py-1 max-w-2xl">
            <h3 className="text-sm font-bold text-stone-900 mb-1">{t.nullTitle}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {change && withSkill.length > 1 ? t.nullBody(change) : t.nullSingle}
            </p>
          </div>
        </section>
      )}

      {/* Recent appearances */}
      {player.recent.length > 0 && (
        <section className="mb-10 border-t border-stone-200 pt-5">
          <h2 className="text-xl font-bold tracking-tight mb-3">{t.recentTitle}</h2>
          <div className="divide-y divide-stone-100">
            {player.recent.map((m, i) => (
              <div
                key={`${m.season}-${m.matchday}-${i}`}
                className="flex items-center gap-3 py-2 text-sm"
              >
                <span className="w-16 text-[11px] tabular-nums text-stone-400 flex-shrink-0">
                  {m.date ?? `${m.season} J${m.matchday}`}
                </span>
                <span className="flex-1 min-w-0 truncate text-stone-800">
                  {teamDisplayName(m.opponent)}{" "}
                  <span className="text-stone-400 text-xs">
                    ({m.is_home ? t.home : t.away})
                  </span>
                </span>
                <span className="text-[11px] text-stone-400 tabular-nums w-16 text-right flex-shrink-0">
                  {int(m.minutes)}&apos; · {m.started ? t.starter : t.sub}
                </span>
                <span className="w-14 text-right tabular-nums flex-shrink-0">
                  {m.goals > 0 ? (
                    <span className="font-bold text-stone-900">
                      {m.goals} {m.goals === 1 ? t.goalOne : t.goals.toLowerCase()}
                    </span>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </span>
                <span className="w-14 text-right tabular-nums text-stone-500 text-xs flex-shrink-0 hidden sm:inline">
                  {m.rating === null ? "" : `${nf(m.rating, 1)} ${t.rating}`}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-stone-400 mt-3 max-w-2xl leading-relaxed">
            {t.recentNote}
          </p>
        </section>
      )}

      {/* Neighbours in the ranking + club page */}
      <section className="border-t border-stone-200 pt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        {prev && (
          <Link
            href={`/desporto/liga/jogador/${prev.slug}`}
            locale={locale}
            className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            {t.prev}: {prev.player} (#{prev.rank})
          </Link>
        )}
        {next && (
          <Link
            href={`/desporto/liga/jogador/${next.slug}`}
            locale={locale}
            className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
          >
            {t.next}: {next.player} (#{next.rank})
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
        {teamSlug && (
          <Link
            href={`/desporto/liga/${teamSlug}`}
            locale={locale}
            className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
          >
            {t.teamPage}: {teamDisplayName(player.team)}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </section>

      <p className="text-[10px] text-stone-400 mt-6 leading-relaxed max-w-2xl">
        {t.footnote}
      </p>
    </div>
  );
}
