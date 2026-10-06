import { teamColorOnPaper, teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import { formatPercent, matchLabel } from "@/lib/football-format";
import type { DecisiveMatch } from "@/types/football";
import type { ReactNode } from "react";

/** Which race a list is about. A club page passes its own race only. */
export type DecisiveRace = "title" | "relegation" | "both";

/** Below this spread a match is not "decisive" for a race (3 percentage points). */
export const DECISIVE_THRESHOLD = 0.03;

interface DecisiveMatchesProps {
  matches: DecisiveMatch[];
  race?: DecisiveRace;
  locale: string;
  labels: {
    /** "Atual", or a ClockSwitch that dates it once the round is played. */
    current: ReactNode;
    /** "Se o __TEAM__ vencer" */
    ifTeamWins: string;
    /** "Se o __TEAM__ perder" */
    ifTeamLoses: string;
    titleRaceSection: string;
    relegationSection: string;
    matchdayPrefix: string;
  };
  maxItemsPerTeam?: number;
}

/** The title rows of a decisive list, filtered by the threshold. */
export function titleDecisive(matches: DecisiveMatch[] | undefined, team?: string): DecisiveMatch[] {
  return (matches ?? []).filter(m => m.title_swing > DECISIVE_THRESHOLD && (!team || m.most_affected_team === team));
}

/** The relegation rows of a decisive list, filtered by the threshold. */
export function relegationDecisive(matches: DecisiveMatch[] | undefined, team?: string): DecisiveMatch[] {
  return (matches ?? []).filter(
    m => (m.relegation_swing ?? 0) > DECISIVE_THRESHOLD && !!m.most_affected_relegation_team && (!team || m.most_affected_relegation_team === team),
  );
}

interface MatchRowProps {
  match: DecisiveMatch;
  affectedTeam: string;
  baseline: number;
  probs: { H: number; D: number; A: number };
  labels: DecisiveMatchesProps["labels"];
  isTitle: boolean;
  locale: string;
}

function MatchRow({ match, affectedTeam, baseline, probs, labels, isTitle, locale }: MatchRowProps) {
  const affectedIsHome = affectedTeam === match.home_team;
  const winProb = affectedIsHome ? probs.H : probs.A;
  const loseProb = affectedIsHome ? probs.A : probs.H;
  // For the title higher is better, for relegation lower is better. The
  // words carry the meaning; the colour only repeats it.
  const winIsGood = isTitle ? winProb > loseProb : winProb < loseProb;
  const name = teamDisplayName(affectedTeam);

  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line py-2 last:border-0">
      <span className="flex min-w-0 items-center gap-1.5">
        <i aria-hidden="true" className="h-3.5 w-1 shrink-0 rounded-full" style={{ backgroundColor: teamColorOnPaper(match.home_team) }} />
        <span className="text-sm font-medium text-ink">{matchLabel(teamDisplayName(match.home_team), teamDisplayName(match.away_team))}</span>
        <i aria-hidden="true" className="h-3.5 w-1 shrink-0 rounded-full" style={{ backgroundColor: teamColorOnPaper(match.away_team) }} />
        <span className="ml-1 text-xs text-stone-500">{labels.matchdayPrefix}{match.matchday}</span>
      </span>
      <span className="flex flex-wrap items-baseline gap-x-3 text-xs">
        <span className="text-stone-500">
          {labels.current}: <strong className="text-ink">{formatPercent(baseline, locale)}</strong>
        </span>
        <span aria-hidden="true" className="text-stone-500">·</span>
        <span className={winIsGood ? "text-emerald-700" : "text-red-700"}>
          {labels.ifTeamWins.replace("__TEAM__", name)}: <strong className="font-bold">{formatPercent(winProb, locale)}</strong>
        </span>
        <span aria-hidden="true" className="text-stone-500">·</span>
        <span className={!winIsGood ? "text-emerald-700" : "text-red-700"}>
          {labels.ifTeamLoses.replace("__TEAM__", name)}: <strong className="font-bold">{formatPercent(loseProb, locale)}</strong>
        </span>
      </span>
    </li>
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
    if (!team) continue;
    if (!grouped.has(team)) grouped.set(team, []);
    grouped.get(team)!.push(match);
  }
  return Array.from(grouped.entries())
    .map(([team, teamMatches]) => ({
      team,
      baseline: getBaseline(teamMatches[0]),
      matches: [...teamMatches].sort((a, b) => getSwing(b) - getSwing(a)).slice(0, maxItems),
    }))
    .sort((a, b) => b.baseline - a.baseline);
}

function TeamSection({
  team,
  baseline,
  teamMatches,
  labels,
  getProbs,
  isTitle,
  locale,
}: {
  team: string;
  baseline: number;
  teamMatches: DecisiveMatch[];
  labels: DecisiveMatchesProps["labels"];
  getProbs: (m: DecisiveMatch) => { H: number; D: number; A: number };
  isTitle: boolean;
  locale: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 border-b border-stone-200 py-1.5">
        {teamLogoSrc(team) ? (
          <img src={teamLogoSrc(team)} alt="" width={20} height={20} loading="lazy" decoding="async" className="h-5 w-5 object-contain" />
        ) : (
          <i aria-hidden="true" className="h-4 w-1 shrink-0" style={{ backgroundColor: teamColorOnPaper(team) }} />
        )}
        <span className="text-sm font-semibold text-ink">{teamDisplayName(team)}</span>
      </p>
      <ul>
        {teamMatches.map((match, i) => (
          <MatchRow
            key={`${match.matchday}-${match.home_team}-${i}`}
            match={match}
            affectedTeam={team}
            baseline={baseline}
            probs={getProbs(match)}
            labels={labels}
            isTitle={isTitle}
            locale={locale}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * Remaining fixtures grouped by the club whose race they swing most, with
 * that club named in every outcome ("Se o Nacional vencer"), so a number on
 * a club page can never be read as that page's club's own. `race` limits
 * the list to one race: a club page shows its own race only (audit F-H5).
 */
export function DecisiveMatches({ matches, race = "both", labels, maxItemsPerTeam = 3, locale }: DecisiveMatchesProps) {
  if (!matches || matches.length === 0) return null;

  const titleGroups = race === "relegation" ? [] : groupByTeam(
    titleDecisive(matches), m => m.most_affected_team, m => m.p_champ_baseline, m => m.title_swing, maxItemsPerTeam,
  );
  const relegGroups = race === "title" ? [] : groupByTeam(
    relegationDecisive(matches),
    m => m.most_affected_relegation_team ?? "",
    m => m.p_releg_baseline ?? 0,
    m => m.relegation_swing ?? 0,
    maxItemsPerTeam,
  );
  if (titleGroups.length === 0 && relegGroups.length === 0) return null;
  const both = titleGroups.length > 0 && relegGroups.length > 0;

  const column = (isTitle: boolean, groups: typeof titleGroups) => (
    <div>
      {both && (
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
          {isTitle ? labels.titleRaceSection : labels.relegationSection}
        </h3>
      )}
      <div className="space-y-5">
        {groups.map(({ team, baseline, matches: teamMatches }) => (
          <TeamSection
            key={team}
            team={team}
            baseline={baseline}
            teamMatches={teamMatches}
            labels={labels}
            getProbs={isTitle
              ? m => ({ H: m.p_champ_if_H, D: m.p_champ_if_D, A: m.p_champ_if_A })
              : m => ({ H: m.p_releg_if_H ?? 0, D: m.p_releg_if_D ?? 0, A: m.p_releg_if_A ?? 0 })}
            isTitle={isTitle}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={both ? "grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10" : ""}>
      {titleGroups.length > 0 && column(true, titleGroups)}
      {relegGroups.length > 0 && column(false, relegGroups)}
    </div>
  );
}
