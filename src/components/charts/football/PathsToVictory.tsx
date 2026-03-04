"use client";

import { ligaTeamColors } from "@/lib/config/football";
import type { VictoryPath, RivalCondition } from "@/types/football";

interface PathsToVictoryProps {
  paths: Record<string, VictoryPath>;
  labels: {
    freqFrame: string; // "Campeão em __COUNT__ de __NSIMS__ simulações"
    subtitleOwn: string; // "Controla o seu destino"
    subtitleHelp: string; // "Precisa de ajuda"
    subtitleMiracle: string; // "Precisa de um milagre"
    gateKeepWinning: string; // "Continuar a ganhar"
    gateKeepWinningDetail: string; // "Não depende de outros resultados"
    gateWinKeyMatches: string; // "Vencer os jogos decisivos"
    gateWinEverything: string; // "Vencer tudo"
    gateMustStumble: string; // "__RIVAL__ tem de tropeçar"
    and: string; // "e"
  };
}

function formatNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatPct(value: number): string {
  const pct = value * 100;
  if (pct > 99 && pct < 100) return ">99%";
  if (pct < 1 && pct > 0) return "<1%";
  return `${Math.round(pct)}%`;
}

/** Group rival conditions by rival team name */
function groupByRival(conditions: RivalCondition[]): Record<string, RivalCondition[]> {
  const groups: Record<string, RivalCondition[]> = {};
  for (const rc of conditions) {
    if (!groups[rc.rival]) groups[rc.rival] = [];
    groups[rc.rival].push(rc);
  }
  return groups;
}

/** Determine the subtitle based on path characteristics */
function getSubtitle(path: VictoryPath, labels: PathsToVictoryProps["labels"]): string {
  const isSurvival = path.target === "survival";
  if (isSurvival) {
    // For survival: 95%+ = safe, 20-95% = at risk, <20% = in danger
    if (path.p_current > 0.95) return labels.subtitleOwn;
    if (path.p_current > 0.20) return labels.subtitleHelp;
    return labels.subtitleMiracle;
  }
  // For championship: 50%+ = controls destiny, 5-50% = needs help, <5% = miracle
  if (path.p_current > 0.5) return labels.subtitleOwn;
  if (path.p_current > 0.05) return labels.subtitleHelp;
  return labels.subtitleMiracle;
}

/** Is this team a clear leader/safe? */
function isComfortable(path: VictoryPath): boolean {
  if (path.target === "survival") return path.p_current > 0.95;
  return path.p_current > 0.5;
}

/** Determine own-results gate label */
function getOwnGateLabel(path: VictoryPath, labels: PathsToVictoryProps["labels"]): string {
  const mustWinCount = (path.funnel || []).filter(s => s.win_uplift >= 0.20).length;
  if (mustWinCount >= 4) return labels.gateWinEverything;
  // Teams that aren't comfortable need to win key matches
  if (!isComfortable(path)) return labels.gateWinKeyMatches;
  return labels.gateKeepWinning;
}

/** Get key matches to show inside the own-results gate */
function getKeyMatches(path: VictoryPath): { opponent: string; venue: string; matchday: number }[] {
  // For comfortable teams, no matches needed (gate says "keep winning")
  if (isComfortable(path)) return [];
  // For at-risk teams, show all significant matches (uplift >= 0.06)
  const isSurvival = path.target === "survival";
  const threshold = isSurvival
    ? (path.p_current <= 0.20 ? 0.15 : 0.04)
    : (path.p_current <= 0.05 ? 0.20 : 0.06);
  return (path.funnel || [])
    .filter(s => s.win_uplift >= threshold)
    .sort((a, b) => a.matchday - b.matchday)
    .map(s => ({
      opponent: s.opponent,
      venue: s.venue === "H" ? "C" : "F",
      matchday: s.matchday,
    }));
}

function Gate({
  label,
  detail,
  accentColor,
  matches,
  isUrgent,
}: {
  label: string;
  detail?: string;
  accentColor: string;
  matches?: { opponent: string; venue: string; matchday: number }[];
  isUrgent?: boolean;
}) {
  return (
    <div
      className="flex-1 min-w-0 border-t-[3px] bg-stone-50 px-3 py-3"
      style={{ borderTopColor: accentColor }}
    >
      <div
        className={`text-xs font-bold uppercase tracking-wide mb-1 ${isUrgent ? "text-red-700" : "text-stone-700"}`}
      >
        {label}
      </div>
      {detail && (
        <p className="text-[11px] text-stone-500 leading-snug">{detail}</p>
      )}
      {matches && matches.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {matches.map((m, i) => (
            <div key={i} className="text-[11px] text-stone-600">
              <span className="text-stone-400">J{m.matchday}</span>{" "}
              {m.opponent}{m.venue ? ` (${m.venue})` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PathsToVictory({ paths, labels }: PathsToVictoryProps) {
  if (!paths || Object.keys(paths).length === 0) return null;

  const teams = Object.entries(paths).sort(
    ([, a], [, b]) => b.p_current - a.p_current
  );

  return (
    <div className="space-y-10">
      {teams.map(([team, path]) => {
        const teamColor = ligaTeamColors[team] || "#78716c";
        const keyMatches = getKeyMatches(path);
        const mustWinCount = (path.funnel || []).filter(s => s.win_uplift >= 0.20).length;
        // If no key matches found, treat as comfortable even if threshold says otherwise
        const effectivelyComfortable = isComfortable(path) || (!isComfortable(path) && keyMatches.length === 0 && mustWinCount < 4);
        const subtitle = effectivelyComfortable ? labels.subtitleOwn : (getSubtitle(path, labels));
        const ownGateLabel = effectivelyComfortable ? labels.gateKeepWinning : getOwnGateLabel(path, labels);
        const isLeader = effectivelyComfortable;

        // Group rival conditions by rival — only show for non-leaders
        const rivalGroups = isLeader
          ? {}
          : groupByRival(path.rival_conditions || []);
        const rivalNames = Object.keys(rivalGroups);

        return (
          <div key={team}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-1 h-12 shrink-0"
                style={{ backgroundColor: teamColor }}
              />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-stone-900 text-lg">
                    {team}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    {subtitle}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-3xl font-black tabular-nums"
                    style={{ color: teamColor }}
                  >
                    {formatPct(path.p_current)}
                  </span>
                  <span className="text-xs text-stone-400">
                    {labels.freqFrame
                      .replace("__COUNT__", formatNum(path.n_target))
                      .replace("__NSIMS__", formatNum(path.n_sims))}
                  </span>
                </div>
              </div>
            </div>

            {/* Gates */}
            <div className="flex gap-2 mt-3">
              {/* Gate 1: Own results */}
              <Gate
                label={ownGateLabel}
                detail={
                  isLeader
                    ? labels.gateKeepWinningDetail
                    : undefined
                }
                accentColor={teamColor}
                matches={keyMatches.length > 0 ? keyMatches : undefined}
                isUrgent={mustWinCount >= 4}
              />

              {/* Rival gates — one per rival */}
              {rivalNames.map((rival, i) => {
                const rivalColor = ligaTeamColors[rival] || "#78716c";
                const rivalMatches = rivalGroups[rival].map(rc => ({
                  opponent: rc.opponent,
                  venue: "",
                  matchday: rc.matchday,
                }));

                return (
                  <div key={rival} className="flex items-stretch gap-2">
                    {/* "+" connector */}
                    <div className="flex items-center text-stone-300 font-bold text-sm">
                      +
                    </div>
                    <Gate
                      label={labels.gateMustStumble.replace("__RIVAL__", rival)}
                      accentColor={rivalColor}
                      matches={rivalMatches}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
