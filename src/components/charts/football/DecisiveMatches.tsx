"use client";

import { ligaTeamColors, teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { DecisiveMatch } from "@/types/football";

interface DecisiveMatchesProps {
  matches: DecisiveMatch[];
  labels: {
    matchday: string;
    championProb: string;
    baseline: string;
    draw: string;
    ifWins: string;
    ifWin?: string;
    ifLose?: string;
    current?: string;
    relegationProb?: string;
    titleRaceSection?: string;
    relegationSection?: string;
  };
  maxItemsPerTeam?: number;
}

function formatPct(value: number): string {
  const pct = value * 100;
  if (pct > 99 && pct < 100) return ">99%";
  if (pct < 1 && pct > 0) return "<1%";
  return `${Math.round(pct)}%`;
}

interface MatchRowProps {
  match: DecisiveMatch;
  affectedTeam: string;
  baseline: number;
  probs: { H: number; D: number; A: number };
  labels: DecisiveMatchesProps["labels"];
  isTitle: boolean;
}

function MatchRow({ match, affectedTeam, baseline, probs, labels, isTitle }: MatchRowProps) {
  const homeColor = ligaTeamColors[match.home_team] || "#78716c";
  const awayColor = ligaTeamColors[match.away_team] || "#78716c";

  const currentLabel = labels.current ?? "Current";
  const ifWinLabel = labels.ifWin ?? "If they win";
  const ifLoseLabel = labels.ifLose ?? "If they lose";

  const affectedIsHome = affectedTeam === match.home_team;
  const winProb = affectedIsHome ? probs.H : probs.A;
  const loseProb = affectedIsHome ? probs.A : probs.H;

  // For title: higher is better. For relegation: lower is better.
  const winIsGood = isTitle ? winProb > loseProb : winProb < loseProb;

  return (
    <div className="flex items-baseline gap-x-3 py-2 border-b border-stone-100 last:border-0 flex-wrap">
      {/* Match: home vs away · matchday */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-1 h-3.5" style={{ backgroundColor: homeColor }} />
        <span className="text-sm font-medium text-stone-800">{teamDisplayName(match.home_team)}</span>
        <span className="text-xs text-stone-400">vs</span>
        <span className="text-sm font-medium text-stone-800">{teamDisplayName(match.away_team)}</span>
        <div className="w-1 h-3.5" style={{ backgroundColor: awayColor }} />
        <span className="text-xs text-stone-400 ml-1">J{match.matchday}</span>
      </div>

      {/* Separator */}
      <span className="text-stone-300">—</span>

      {/* Current · if win · if lose */}
      <div className="flex items-baseline gap-x-3 text-xs flex-wrap">
        <span className="text-stone-500">
          {currentLabel}: <strong className="text-stone-700">{formatPct(baseline)}</strong>
        </span>
        <span className="text-stone-300">·</span>
        <span className={winIsGood ? "text-green-700" : "text-red-600"}>
          {ifWinLabel}: <strong className="font-bold">{formatPct(winProb)}</strong>
        </span>
        <span className="text-stone-300">·</span>
        <span className={!winIsGood ? "text-green-700" : "text-red-600"}>
          {ifLoseLabel}: <strong className="font-bold">{formatPct(loseProb)}</strong>
        </span>
      </div>
    </div>
  );
}

interface TeamSectionProps {
  team: string;
  baseline: number;
  teamMatches: DecisiveMatch[];
  labels: DecisiveMatchesProps["labels"];
  getProbs: (m: DecisiveMatch) => { H: number; D: number; A: number };
  getSwing: (m: DecisiveMatch) => number;
  isTitle: boolean;
}

function TeamSection({
  team,
  baseline,
  teamMatches,
  labels,
  getProbs,
  isTitle,
}: TeamSectionProps) {
  const teamColor = ligaTeamColors[team] || "#78716c";

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 border-b border-stone-200">
        {teamLogoSrc(team) ? (
          <img src={teamLogoSrc(team)} alt="" className="w-5 h-5 object-contain" />
        ) : (
          <div className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: teamColor }} />
        )}
        <span className="font-semibold text-stone-800 text-sm">{teamDisplayName(team)}</span>
      </div>
      {teamMatches.map((match, i) => (
        <MatchRow
          key={i}
          match={match}
          affectedTeam={team}
          baseline={baseline}
          probs={getProbs(match)}
          labels={labels}
          isTitle={isTitle}
        />
      ))}
    </div>
  );
}

function groupByTeam(
  matches: DecisiveMatch[],
  getTeam: (m: DecisiveMatch) => string,
  getBaseline: (m: DecisiveMatch) => number,
  getSwing: (m: DecisiveMatch) => number,
  maxItems: number,
) {
  const grouped = new Map<string, DecisiveMatch[]>();
  for (const match of matches) {
    const team = getTeam(match);
    if (!grouped.has(team)) grouped.set(team, []);
    grouped.get(team)!.push(match);
  }

  return Array.from(grouped.entries())
    .map(([team, teamMatches]) => ({
      team,
      baseline: getBaseline(teamMatches[0]),
      matches: teamMatches
        .sort((a, b) => getSwing(b) - getSwing(a))
        .slice(0, maxItems),
    }))
    .sort((a, b) => b.baseline - a.baseline);
}

export function DecisiveMatches({ matches, labels, maxItemsPerTeam = 3 }: DecisiveMatchesProps) {
  if (!matches || matches.length === 0) return null;

  const titleMatches = matches.filter(m => m.title_swing > 0.03);
  const relegMatches = matches.filter(m => (m.relegation_swing ?? 0) > 0.03);

  const titleGroups = groupByTeam(
    titleMatches, m => m.most_affected_team, m => m.p_champ_baseline, m => m.title_swing, maxItemsPerTeam,
  );

  const relegGroups = groupByTeam(
    relegMatches,
    m => m.most_affected_relegation_team ?? '',
    m => m.p_releg_baseline ?? 0,
    m => m.relegation_swing ?? 0,
    maxItemsPerTeam,
  ).filter(g => g.team);

  const hasTitle = titleGroups.length > 0;
  const hasReleg = relegGroups.length > 0;

  const titleColumn = hasTitle && (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
        {labels.titleRaceSection ?? "Title race"}
      </h3>
      <div className="space-y-5">
        {titleGroups.map(({ team, baseline, matches: teamMatches }) => (
          <TeamSection
            key={team}
            team={team}
            baseline={baseline}
            teamMatches={teamMatches}
            labels={labels}
            getProbs={(m) => ({ H: m.p_champ_if_H, D: m.p_champ_if_D, A: m.p_champ_if_A })}
            getSwing={(m) => m.title_swing}
            isTitle={true}
          />
        ))}
      </div>
    </div>
  );

  const relegColumn = hasReleg && (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
        {labels.relegationSection ?? "Relegation battle"}
      </h3>
      <div className="space-y-5">
        {relegGroups.map(({ team, baseline, matches: teamMatches }) => (
          <TeamSection
            key={team}
            team={team}
            baseline={baseline}
            teamMatches={teamMatches}
            labels={labels}
            getProbs={(m) => ({
              H: m.p_releg_if_H ?? 0,
              D: m.p_releg_if_D ?? 0,
              A: m.p_releg_if_A ?? 0,
            })}
            getSwing={(m) => m.relegation_swing ?? 0}
            isTitle={false}
          />
        ))}
      </div>
    </div>
  );

  // Two columns on desktop when both sections exist
  if (hasTitle && hasReleg) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
        {titleColumn}
        {relegColumn}
      </div>
    );
  }

  return (
    <div>
      {titleColumn}
      {relegColumn}
    </div>
  );
}
