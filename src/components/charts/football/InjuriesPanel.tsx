"use client";

import { teamDisplayName, teamLogoSrc, ligaTeamShortNames } from "@/lib/config/football";
import { injuryReasonLabel, positionLabel } from "@/lib/i18n/football-labels";
import { Stethoscope } from "lucide-react";

export interface InjuryPlayer {
  player: string;
  team: string;
  kind: string;
  position: string | null;
  reason: string | null;
  expected_return: string | null;
  market_value_eur: number | null;
}

export interface InjuryTeam {
  team: string;
  n_out: number;
  value_out_eur: number;
  squad_value_eur: number | null;
  share_of_squad: number | null;
}

export interface InjuriesData {
  season: string;
  snapshot_date: string | null;
  source: string;
  n_out: number;
  n_injuries: number;
  n_suspensions: number;
  teams: InjuryTeam[];
  players: InjuryPlayer[];
}

interface InjuriesPanelProps {
  data: InjuriesData;
  locale?: string;
  /** Optional model-ranking context: player name → rank in the skill table. */
  skillRanks?: Record<string, number>;
}

function formatValue(v: number | null, pt: boolean): string {
  if (!v) return "—";
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m.toLocaleString(pt ? "pt-PT" : "en-GB", {
      maximumFractionDigits: m < 10 ? 1 : 0,
    })} M€`;
  }
  return `${Math.round(v / 1000)} mil €`;
}

function formatDate(iso: string | null, pt: boolean): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(pt ? "pt-PT" : "en-GB", {
    day: "numeric",
    month: "long",
  });
}

export function InjuriesPanel({ data, locale = "pt", skillRanks }: InjuriesPanelProps) {
  const pt = locale !== "en";
  if (!data?.players?.length) return null;

  const t = {
    title: pt ? "Quem está de fora" : "Who is unavailable",
    intro: pt
      ? `${data.n_out} jogadores indisponíveis em ${data.teams.length} clubes. A barra mostra a fatia do plantel — em valor de mercado — que cada treinador não pode utilizar. É isso, e não o número de lesionados, que diz o tamanho real do problema.`
      : `${data.n_out} players unavailable across ${data.teams.length} clubs. The bar shows the share of the squad — by market value — that each coach cannot pick. That, not the headcount, is the size of the problem.`,
    snapshot: (d: string) =>
      pt ? `Dados de ${d} · Transfermarkt` : `As of ${d} · Transfermarkt`,
    outOfSquad: pt ? "do plantel indisponível" : "of squad unavailable",
    back: pt ? "Regresso previsto" : "Expected back",
    noSuspensions: pt
      ? "Sem suspensões por castigo em toda a Liga."
      : "No suspensions anywhere in the league.",
    modelRank: (r: number) =>
      pt ? `${r}.º no ranking do modelo` : `#${r} in the model's ranking`,
    valueNote: pt
      ? "Valores de mercado do Transfermarkt; a percentagem compara com o valor total do plantel."
      : "Transfermarkt market values; the percentage is against total squad value.",
  };

  const byTeam = new Map<string, InjuryPlayer[]>();
  for (const p of data.players) {
    const list = byTeam.get(p.team) ?? [];
    list.push(p);
    byTeam.set(p.team, list);
  }

  const ordered = [...data.teams].sort(
    (a, b) => (b.share_of_squad ?? 0) - (a.share_of_squad ?? 0)
  );
  const maxShare = Math.max(...ordered.map((t2) => t2.share_of_squad ?? 0), 0.05);
  const snapshot = formatDate(data.snapshot_date, pt);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Stethoscope className="w-4 h-4 text-stone-400" />
        <h2 className="text-xl font-bold tracking-tight">{t.title}</h2>
      </div>
      <p className="text-sm text-stone-500 mb-1 max-w-3xl leading-relaxed">{t.intro}</p>
      {snapshot && (
        <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-6">
          {t.snapshot(snapshot)}
        </p>
      )}

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        {ordered.map((team) => {
          const players = byTeam.get(team.team) ?? [];
          const sharePct = (team.share_of_squad ?? 0) * 100;
          const barPct = ((team.share_of_squad ?? 0) / maxShare) * 100;

          return (
            <div key={team.team} className="border-t border-stone-200 pt-3">
              <div className="flex items-baseline gap-2 mb-1">
                {teamLogoSrc(team.team) && (
                  <img
                    src={teamLogoSrc(team.team)}
                    alt=""
                    className="w-4 h-4 object-contain self-center flex-shrink-0"
                  />
                )}
                <span className="text-sm font-bold text-stone-900 truncate">
                  <span className="sm:hidden">
                    {ligaTeamShortNames[team.team] || team.team}
                  </span>
                  <span className="hidden sm:inline">{teamDisplayName(team.team)}</span>
                </span>
                <span className="ml-auto text-lg font-black tabular-nums text-stone-900">
                  {sharePct.toLocaleString(pt ? "pt-PT" : "en-GB", {
                    maximumFractionDigits: sharePct < 10 ? 1 : 0,
                  })}
                  <span className="text-xs font-bold text-stone-400">%</span>
                </span>
              </div>

              <div className="h-1.5 relative bg-stone-100 mb-1">
                <div
                  className="absolute inset-y-0 left-0 rounded-r-[3px]"
                  style={{ width: `${barPct}%`, backgroundColor: "#dc2626", opacity: 0.75 }}
                />
              </div>
              <div className="text-[10px] text-stone-400 mb-2 tabular-nums">
                {t.outOfSquad} · {formatValue(team.value_out_eur, pt)}
              </div>

              <ul className="space-y-1.5">
                {players
                  .slice()
                  .sort(
                    (a, b) => (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0)
                  )
                  .map((p) => {
                    const rank = skillRanks?.[p.player];
                    const back = formatDate(p.expected_return, pt);
                    return (
                      <li key={p.player} className="flex items-start gap-2 text-xs">
                        <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-semibold text-stone-800">{p.player}</span>
                            {rank !== undefined && (
                              <span className="text-[9px] uppercase tracking-wide bg-stone-800 text-white px-1 py-px">
                                {t.modelRank(rank)}
                              </span>
                            )}
                          </div>
                          <div className="text-stone-500">
                            {injuryReasonLabel(p.reason, locale)}
                            {p.position && (
                              <span className="text-stone-400">
                                {" · "}
                                {positionLabel(p.position, locale)}
                              </span>
                            )}
                          </div>
                          {back && (
                            <div className="text-[10px] text-stone-400">
                              {t.back}: {back}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] tabular-nums text-stone-400 flex-shrink-0">
                          {formatValue(p.market_value_eur, pt)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-stone-400 mt-6 max-w-3xl">
        {t.valueNote}
        {data.n_suspensions === 0 && ` ${t.noSuspensions}`}
      </p>
    </div>
  );
}
