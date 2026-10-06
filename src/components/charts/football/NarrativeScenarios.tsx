import type {
  TeamNarrativeScenarios,
  NarrativeScenario,
  ScenarioStep,
  ScenarioRivalCondition,
} from "@/types/football";
import { teamColorOnPaper, teamDisplayName, teamPhoneName } from "@/lib/config/football";
import { formatPercent } from "@/lib/football-format";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Safe CSS percentage, clamped to the bar. */
function cssPct(v: number): string {
  return `${Math.min(Math.max(v * 100, 0), 100)}%`;
}

/** A one-line summary of the scenario from its steps ("3 vitórias, 1 derrota"). */
function scenarioSummary(
  scenario: NarrativeScenario,
  labels: { win: string; winPlural: string; draw: string; drawPlural: string; loss: string; lossPlural: string },
): string {
  const wins = scenario.steps.filter(s => s.result === "W").length;
  const draws = scenario.steps.filter(s => s.result === "D").length;
  const losses = scenario.steps.filter(s => s.result === "L").length;
  const parts: string[] = [];
  if (wins > 0) parts.push(`${wins} ${wins === 1 ? labels.win : labels.winPlural}`);
  if (draws > 0) parts.push(`${draws} ${draws === 1 ? labels.draw : labels.drawPlural}`);
  if (losses > 0) parts.push(`${losses} ${losses === 1 ? labels.loss : labels.lossPlural}`);
  return parts.join(", ");
}

/**
 * The rival results a scenario also needs, without the ones that only
 * restate one of the club's own steps: "Nacional perde pontos contra o
 * Moreirense (J32)" is the club's own win in J32 seen from the other side
 * (audit pub-PP-11).
 */
export function rivalConditionsWithoutOwnMatches(
  team: string,
  scenario: NarrativeScenario,
): ScenarioRivalCondition[] {
  const ownMatchdays = new Set(scenario.steps.map(s => s.matchday));
  return (scenario.rival_conditions ?? []).filter(rc => !(rc.opponent === team && ownMatchdays.has(rc.matchday)));
}

// ── Components ──────────────────────────────────────────────────────────────

interface StepLabels {
  resultWin: string;
  resultDraw: string;
  resultLoss: string;
  matchdayPrefix: string;
  home: string;
  away: string;
}

const RESULT_STYLE: Record<ScenarioStep["result"], string> = {
  W: "bg-emerald-50 text-emerald-700",
  D: "bg-parchment text-stone-700",
  L: "bg-red-50 text-red-700",
};

function StepRow({ step, teamColor, prevP, labels, locale }: { step: ScenarioStep; teamColor: string; prevP: number; labels: StepLabels; locale: string }) {
  const delta = step.p_target_after - prevP;
  const resultLabel = step.result === "W" ? labels.resultWin : step.result === "D" ? labels.resultDraw : labels.resultLoss;
  const venueLabel = step.venue === "H" ? labels.home : labels.away;

  return (
    <li className="flex items-center gap-2 border-b border-line py-2 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="w-7 shrink-0 text-xs font-bold tabular-nums text-stone-500">
            {labels.matchdayPrefix}{step.matchday}
          </span>
          <span className="truncate text-sm text-stone-700 sm:hidden">{teamPhoneName(step.opponent)}</span>
          <span className="hidden truncate text-sm text-stone-700 sm:inline">{teamDisplayName(step.opponent)}</span>
          <span className="shrink-0 text-[11px] text-stone-500">({venueLabel})</span>
          <span className={`shrink-0 rounded px-1 py-0.5 text-[11px] font-bold ${RESULT_STYLE[step.result]}`}>{resultLabel}</span>
        </div>
        <div aria-hidden="true" className="relative mt-1 h-3 w-full overflow-hidden rounded-sm bg-parchment">
          <div className="absolute inset-y-0 left-0" style={{ width: cssPct(Math.min(prevP, step.p_target_after)), backgroundColor: teamColor, opacity: 0.35 }} />
          {delta >= 0 ? (
            <div className="absolute inset-y-0" style={{ left: cssPct(prevP), width: cssPct(delta), backgroundColor: teamColor }} />
          ) : (
            <div className="absolute inset-y-0" style={{ left: cssPct(step.p_target_after), width: cssPct(-delta), backgroundColor: "#a3543a", opacity: 0.6 }} />
          )}
        </div>
      </div>
      <div className="w-24 shrink-0 text-right tabular-nums">
        <span className="text-xs text-stone-500">{formatPercent(prevP, locale)}</span>
        <span aria-hidden="true" className="mx-0.5 text-stone-500">→</span>
        <span className="sr-only">{locale === "en" ? " to " : " para "}</span>
        <span className="text-sm font-bold text-ink">{formatPercent(step.p_target_after, locale)}</span>
      </div>
    </li>
  );
}

function RivalConditions({ conditions, labels }: { conditions: ScenarioRivalCondition[]; labels: { thisWorksBecause: string; dropsPointsVs: string; matchdayPrefix: string } }) {
  if (conditions.length === 0) return null;
  return (
    <div className="border-t border-line bg-paper px-3 py-2 md:px-4">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{labels.thisWorksBecause}</p>
      <ul className="space-y-1">
        {conditions.map((rc, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-stone-600">
            <i aria-hidden="true" className="h-3 w-1 shrink-0 rounded-full" style={{ backgroundColor: teamColorOnPaper(rc.rival) }} />
            <span>
              <span className="font-semibold text-ink">{teamDisplayName(rc.rival)}</span> {labels.dropsPointsVs}{" "}
              <span className="sm:hidden">{teamPhoneName(rc.opponent)}</span>
              <span className="hidden sm:inline">{teamDisplayName(rc.opponent)}</span>
              <span className="text-stone-500"> ({labels.matchdayPrefix}{rc.matchday})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ScenarioCardLabels extends StepLabels {
  ofChampionSims: string;
  thisWorksBecause: string;
  dropsPointsVs: string;
}

function ScenarioCard({
  scenario,
  team,
  teamColor,
  pCurrent,
  labels,
  summary,
  locale,
}: {
  scenario: NarrativeScenario;
  team: string;
  teamColor: string;
  pCurrent: number;
  labels: ScenarioCardLabels;
  summary: string;
  locale: string;
}) {
  const pt = locale !== "en";
  const finalP = scenario.steps[scenario.steps.length - 1]?.p_target_after ?? pCurrent;
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-cream">
      <div className="h-1" style={{ backgroundColor: teamColor }} aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-3 md:p-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-ink">{summary}</h3>
          <p className="mt-0.5 text-[11px] text-stone-500">
            <span className="font-medium tabular-nums">{formatPercent(scenario.frequency, locale)}</span> {labels.ofChampionSims}
          </p>
        </div>
        {/* "22% → 47%", read left to right: now, then in this scenario (audit UXD-19). */}
        <p className="shrink-0 text-right">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {pt ? "Agora → neste cenário" : "Now → in this scenario"}
          </span>
          <span className="font-display text-lg font-extrabold tabular-nums text-ink">
            <span className="text-stone-500">{formatPercent(pCurrent, locale)}</span>
            <span aria-hidden="true"> → </span>
            <span className="sr-only">{pt ? " para " : " to "}</span>
            {formatPercent(finalP, locale)}
          </span>
        </p>
      </div>
      <ol className="px-3 md:px-4">
        {scenario.steps.map((step, i) => (
          <StepRow
            key={i}
            step={step}
            teamColor={teamColor}
            prevP={i === 0 ? pCurrent : scenario.steps[i - 1].p_target_after}
            labels={labels}
            locale={locale}
          />
        ))}
      </ol>
      <RivalConditions conditions={rivalConditionsWithoutOwnMatches(team, scenario)} labels={labels} />
    </li>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function NarrativeScenarios({
  data,
  labels,
  locale,
}: {
  data: TeamNarrativeScenarios;
  locale: string;
  labels: {
    scenarioComfortable: string;
    scenarioRealistic: string;
    scenarioUnlikely: string;
    ofChampionSims: string;
    ofSurvivalSims: string;
    thisWorksBecause: string;
    dropsPointsVs: string;
    resultWin: string;
    resultDraw: string;
    resultLoss: string;
    matchdayPrefix: string;
    home: string;
    away: string;
    winAbbr: string;
    winAbbrPlural: string;
    drawAbbr: string;
    drawAbbrPlural: string;
    lossAbbr: string;
    lossAbbrPlural: string;
  };
}) {
  const pt = locale !== "en";
  const teamColor = teamColorOnPaper(data.team);
  const name = teamDisplayName(data.team);
  const adjustedLabels = {
    ...labels,
    ofChampionSims: data.target === "survival" ? labels.ofSurvivalSims : labels.ofChampionSims,
  };
  const sorted = [...data.scenarios].sort((a, b) => b.frequency - a.frequency);
  const nSteps = sorted[0]?.steps.length ?? 0;

  // What these paths are, before any of them (audit pub-PP-11): each is one
  // combination of results in the club's most telling games, and together
  // they cover only a small share of the simulations.
  const lead = pt
    ? `Cada percurso fixa os resultados do ${name} em ${nSteps} jogos que mais separam as simulações em que ${data.target === "survival" ? "se salva" : "é campeão"} das outras. Os ${sorted.length} juntos cobrem ${formatPercent(data.scenario_coverage, locale)} dessas simulações: são exemplos do que pode acontecer, não o caminho previsto.`
    : `Each path fixes ${name}'s results in the ${nSteps} games that most separate the simulations where they ${data.target === "survival" ? "stay up" : "win the title"} from the rest. Together the ${sorted.length} cover ${formatPercent(data.scenario_coverage, locale)} of those simulations: they are examples of what can happen, not the forecast path.`;

  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-stone-600">{lead}</p>
      <ul className="space-y-3">
        {sorted.map((scenario, i) => (
          <ScenarioCard
            key={i}
            scenario={scenario}
            team={data.team}
            teamColor={teamColor}
            pCurrent={data.p_current}
            labels={adjustedLabels}
            locale={locale}
            summary={scenarioSummary(scenario, {
              win: adjustedLabels.winAbbr,
              winPlural: adjustedLabels.winAbbrPlural,
              draw: adjustedLabels.drawAbbr,
              drawPlural: adjustedLabels.drawAbbrPlural,
              loss: adjustedLabels.lossAbbr,
              lossPlural: adjustedLabels.lossAbbrPlural,
            })}
          />
        ))}
      </ul>
    </div>
  );
}
