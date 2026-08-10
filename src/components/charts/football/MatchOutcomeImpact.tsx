import { teamDisplayName } from "@/lib/config/football";
import { readableTextOn } from "@/lib/utils/football-contrast";
import type {
  DecisiveMatch,
  NextMatchdayScenarioMatch,
  TeamStanding,
} from "@/types/football";

type TeamProbs = { p_champion: number; p_top3: number; p_relegation: number };

interface MatchOutcomeImpactProps {
  home: string;
  away: string;
  homeColor: string;
  awayColor: string;
  locale: string;
  /** Conditional block from md*_scenarios.json → next_matchday_scenarios.matches */
  scenario: NextMatchdayScenarioMatch | null;
  /** Season-wide baseline from next_matchday_scenarios.baseline */
  baseline: Record<string, TeamProbs> | null;
  /** Fallback when no conditionals exist for this fixture */
  homeStanding?: TeamStanding;
  awayStanding?: TeamStanding;
  decisive: DecisiveMatch | null;
}

const OUTCOMES = ["H", "D", "A"] as const;
type Outcome = (typeof OUTCOMES)[number];

function pctLabel(p: number): string {
  if (p >= 0.995) return ">99%";
  if (p > 0 && p < 0.005) return "<1%";
  return `${Math.round(p * 100)}%`;
}

function deltaLabel(delta: number, pt: boolean): string {
  const pp = delta * 100;
  const zero = pt ? "0,0" : "0.0";
  if (Math.abs(pp) < 0.05) return zero;
  const abs =
    Math.abs(pp) < 10 ? Math.abs(pp).toFixed(1) : Math.round(Math.abs(pp)).toString();
  return `${pp > 0 ? "+" : "−"}${pt ? abs.replace(".", ",") : abs}`;
}

/** Emerald when the move is good news for the team, red when it is bad. */
function deltaClass(delta: number, higherIsBetter: boolean): string {
  const pp = delta * 100;
  if (Math.abs(pp) < 0.05) return "text-stone-400";
  const good = higherIsBetter ? pp > 0 : pp < 0;
  return good ? "text-emerald-600" : "text-red-500";
}

export function MatchOutcomeImpact({
  home,
  away,
  homeColor,
  awayColor,
  locale,
  scenario,
  baseline,
  homeStanding,
  awayStanding,
  decisive,
}: MatchOutcomeImpactProps) {
  const pt = locale !== "en";

  const L = {
    title: pt ? "O que está em jogo" : "What is at stake",
    withData: pt
      ? "Probabilidades de título, Europa e descida das duas equipas em cada um dos três resultados, comparadas com a situação atual."
      : "Both teams' title, Europe and relegation probabilities under each of the three results, against where they stand now.",
    noData: pt
      ? "Os cenários por resultado só são publicados para a jornada em curso. Para já, o retrato é a projeção de época de cada equipa."
      : "Per-outcome scenarios are only published for the matchday in progress. For now, here is each team's season projection.",
    outcome: {
      H: pt ? "Vitória" : "Win",
      D: pt ? "Empate" : "Draw",
      A: pt ? "Vitória" : "Win",
    },
    champion: pt ? "Título" : "Title",
    top3: pt ? "Europa (top 3)" : "Europe (top 3)",
    relegation: pt ? "Descida" : "Relegation",
    baseline: pt ? "agora" : "now",
    noMaterial: pt ? "Sem impacto material" : "No material impact",
    expectedPts: pt ? "Pontos esperados" : "Expected points",
    swing: pt ? "Oscilação no título" : "Title swing",
    swingWho: pt ? "equipa mais afetada" : "most affected team",
    unit: "pp",
  };

  const outcomeHeader: Record<Outcome, string> = {
    H: `${L.outcome.H} ${teamDisplayName(home)}`,
    D: L.outcome.D,
    A: `${L.outcome.A} ${teamDisplayName(away)}`,
  };
  const outcomeColor: Record<Outcome, string> = {
    H: homeColor,
    D: "#a8a29e",
    A: awayColor,
  };

  const hasConditionals =
    !!scenario?.conditionals &&
    !!baseline &&
    OUTCOMES.every(o => !!scenario.conditionals?.[o]?.teams);

  const metrics: {
    key: keyof TeamProbs;
    label: string;
    higherIsBetter: boolean;
  }[] = [
    { key: "p_champion", label: L.champion, higherIsBetter: true },
    { key: "p_top3", label: L.top3, higherIsBetter: true },
    { key: "p_relegation", label: L.relegation, higherIsBetter: false },
  ];

  if (hasConditionals) {
    const teams = [
      { name: home, color: homeColor },
      { name: away, color: awayColor },
    ];

    // Only show a metric when it is live for at least one outcome (>= 0.5%).
    const liveMetrics = (team: string) =>
      metrics.filter(m => {
        const base = baseline![team]?.[m.key] ?? 0;
        const conds = OUTCOMES.map(
          o => scenario!.conditionals[o]?.teams?.[team]?.[m.key] ?? 0,
        );
        return Math.max(base, ...conds) >= 0.005;
      });

    return (
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">{L.title}</h2>
        <p className="text-sm text-stone-500 mb-6">{L.withData}</p>

        <div className="grid gap-4 md:grid-cols-3">
          {OUTCOMES.map(o => (
            <div key={o} className="border border-stone-200">
              <div
                className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider truncate"
                style={{
                  backgroundColor: outcomeColor[o],
                  color: readableTextOn(outcomeColor[o]),
                }}
              >
                {outcomeHeader[o]}
              </div>
              <div className="divide-y divide-stone-100">
                {teams.map(team => {
                  const rows = liveMetrics(team.name);
                  return (
                    <div key={team.name} className="px-3 py-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className="inline-block w-1 h-3"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-xs font-bold text-stone-700">
                          {teamDisplayName(team.name)}
                        </span>
                      </div>
                      {rows.length === 0 ? (
                        <div className="text-[11px] text-stone-400">{L.noMaterial}</div>
                      ) : (
                        <table className="w-full text-xs">
                          <tbody>
                            {rows.map(m => {
                              const base = baseline![team.name]?.[m.key] ?? 0;
                              const val =
                                scenario!.conditionals[o]?.teams?.[team.name]?.[m.key] ?? 0;
                              const delta = val - base;
                              return (
                                <tr key={m.key}>
                                  <td className="py-0.5 text-stone-500">{m.label}</td>
                                  <td className="py-0.5 text-right font-bold tabular-nums text-stone-900">
                                    {pctLabel(val)}
                                  </td>
                                  <td
                                    className={`py-0.5 pl-2 text-right tabular-nums font-medium ${deltaClass(
                                      delta,
                                      m.higherIsBetter,
                                    )}`}
                                  >
                                    {deltaLabel(delta, pt)}
                                    <span className="text-stone-400 font-normal"> {L.unit}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-3">
          {pt
            ? `Variação face à probabilidade atual (${L.baseline}), em pontos percentuais.`
            : "Change against the current probability, in percentage points."}
        </p>
      </div>
    );
  }

  // ---- Fallback: no per-outcome conditionals published for this fixture ----
  const cards = [
    { name: home, color: homeColor, standing: homeStanding },
    { name: away, color: awayColor, standing: awayStanding },
  ].filter(c => !!c.standing);

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-1">{L.title}</h2>
      <p className="text-sm text-stone-500 mb-6">{L.noData}</p>

      {cards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(c => (
            <div key={c.name} className="border border-stone-200 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="inline-block w-1 h-4" style={{ backgroundColor: c.color }} />
                <span className="text-sm font-bold text-stone-800">
                  {teamDisplayName(c.name)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {metrics.map(m => (
                  <div key={m.key}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                      {m.label}
                    </div>
                    <div className="text-2xl font-black tabular-nums text-stone-900">
                      {pctLabel(c.standing![m.key])}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
                {L.expectedPts}:{" "}
                <strong className="text-stone-800">
                  {Math.round(c.standing!.mean_pts)} ± {Math.round(c.standing!.std_pts)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {decisive && (
        <div className="mt-4 border-l-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {L.swing}: <strong>{Math.round(decisive.title_swing * 100)} {L.unit}</strong> (
          {L.swingWho}: {teamDisplayName(decisive.most_affected_team)})
        </div>
      )}
    </div>
  );
}
