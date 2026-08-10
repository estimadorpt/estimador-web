import { teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import type { ActualStanding, TeamStrength, XptsEntry } from "@/types/football";

export interface FormEntry {
  matchday: number;
  opponent: string;
  venue: "H" | "A";
  gf: number;
  ga: number;
  result: "W" | "D" | "L";
}

export interface MatchTeamPanel {
  team: string;
  color: string;
  venue: "H" | "A";
  standing?: ActualStanding;
  strength?: TeamStrength;
  attackRank?: number;
  defenseRank?: number;
  totalTeams: number;
  xpts?: XptsEntry;
  form: FormEntry[];
}

interface MatchTeamCompareProps {
  home: MatchTeamPanel;
  away: MatchTeamPanel;
  locale: string;
}

function ordinal(n: number, locale: string): string {
  if (locale !== "en") return `${n}º`;
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

const RESULT_STYLE: Record<FormEntry["result"], string> = {
  W: "bg-emerald-600 text-white",
  D: "bg-stone-300 text-stone-700",
  L: "bg-red-500 text-white",
};

function num(v: number, pt: boolean, digits = 1): string {
  const fixed = v.toFixed(digits);
  return pt ? fixed.replace(".", ",") : fixed;
}

function TeamCard({ panel, locale }: { panel: MatchTeamPanel; locale: string }) {
  const pt = locale !== "en";
  const L = {
    home: pt ? "Casa" : "Home",
    away: pt ? "Fora" : "Away",
    form: pt ? "Forma" : "Form",
    noForm: pt ? "Sem jogos disputados esta época" : "No matches played this season",
    played: pt ? "J" : "P",
    points: pt ? "Pts" : "Pts",
    gd: pt ? "DG" : "GD",
    attack: pt ? "Ataque" : "Attack",
    defense: pt ? "Defesa" : "Defence",
    strengthNote: pt ? "posição na liga" : "rank in the league",
    xpts: "xPts",
    xgf: "xGF",
    xga: "xGA",
    luck: pt ? "Sorte" : "Luck",
    noXpts: pt ? "Sem xG registado ainda" : "No xG recorded yet",
    resultLetters: pt
      ? { W: "V", D: "E", L: "D" }
      : { W: "W", D: "D", L: "L" },
  };

  const { totalTeams } = panel;
  const attackPct =
    panel.attackRank && totalTeams
      ? ((totalTeams - panel.attackRank + 1) / totalTeams) * 100
      : null;
  const defensePct =
    panel.defenseRank && totalTeams
      ? ((totalTeams - panel.defenseRank + 1) / totalTeams) * 100
      : null;

  const luck =
    panel.standing && panel.xpts ? panel.standing.points - panel.xpts.xpts : null;

  return (
    <div className="border border-stone-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
        {teamLogoSrc(panel.team) && (
          <img src={teamLogoSrc(panel.team)} alt="" className="w-7 h-7 object-contain" />
        )}
        <span className="text-sm font-bold text-stone-900">
          {teamDisplayName(panel.team)}
        </span>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {panel.venue === "H" ? L.home : L.away}
        </span>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Standing line */}
        {panel.standing && (
          <div className="flex gap-4 text-xs text-stone-500">
            <span>
              {L.played}: <strong className="text-stone-800">{panel.standing.played}</strong>
            </span>
            <span>
              {L.points}: <strong className="text-stone-800">{panel.standing.points}</strong>
            </span>
            <span>
              {L.gd}:{" "}
              <strong className="text-stone-800">
                {panel.standing.gd > 0 ? "+" : ""}
                {panel.standing.gd}
              </strong>
            </span>
          </div>
        )}

        {/* Form */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
            {L.form}
          </div>
          {panel.form.length === 0 ? (
            <div className="text-xs text-stone-400">{L.noForm}</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {panel.form.map(f => (
                <div
                  key={`${f.matchday}-${f.opponent}`}
                  className="flex items-center gap-1.5 border border-stone-200 pr-2"
                >
                  <span
                    className={`w-5 h-5 flex items-center justify-center text-[10px] font-black ${
                      RESULT_STYLE[f.result]
                    }`}
                  >
                    {L.resultLetters[f.result]}
                  </span>
                  <span className="text-[11px] tabular-nums text-stone-700 font-medium">
                    {f.gf}-{f.ga}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {f.venue === "H" ? "v" : "@"} {teamDisplayName(f.opponent)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model strength */}
        {(attackPct !== null || defensePct !== null) && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
              {pt ? "Força do modelo" : "Model strength"}
            </div>
            <div className="space-y-1.5">
              {attackPct !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500 w-14">{L.attack}</span>
                  <span className="flex-1 h-1.5 bg-stone-200 overflow-hidden rounded-full">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${attackPct}%`, backgroundColor: panel.color }}
                    />
                  </span>
                  <span className="text-[11px] font-bold text-stone-700 tabular-nums w-8 text-right">
                    {ordinal(panel.attackRank!, locale)}
                  </span>
                </div>
              )}
              {defensePct !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500 w-14">{L.defense}</span>
                  <span className="flex-1 h-1.5 bg-stone-200 overflow-hidden rounded-full">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${defensePct}%`, backgroundColor: panel.color }}
                    />
                  </span>
                  <span className="text-[11px] font-bold text-stone-700 tabular-nums w-8 text-right">
                    {ordinal(panel.defenseRank!, locale)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-stone-400 mt-1">{L.strengthNote}</div>
          </div>
        )}

        {/* xPts */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
            {pt ? "Desempenho esperado" : "Expected performance"}
          </div>
          {!panel.xpts ? (
            <div className="text-xs text-stone-400">{L.noXpts}</div>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-500">
              <span>
                {L.xpts}: <strong className="text-stone-800">{num(panel.xpts.xpts, pt)}</strong>
              </span>
              <span>
                {L.xgf}: <strong className="text-stone-800">{num(panel.xpts.xgf, pt)}</strong>
              </span>
              <span>
                {L.xga}: <strong className="text-stone-800">{num(panel.xpts.xga, pt)}</strong>
              </span>
              {luck !== null && (
                <span>
                  {L.luck}:{" "}
                  <strong
                    className={
                      luck > 0.5
                        ? "text-emerald-600"
                        : luck < -0.5
                          ? "text-red-500"
                          : "text-stone-800"
                    }
                  >
                    {luck > 0 ? "+" : ""}
                    {num(luck, pt)}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MatchTeamCompare({ home, away, locale }: MatchTeamCompareProps) {
  const pt = locale !== "en";
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-1">
        {pt ? "Como chegam" : "How they arrive"}
      </h2>
      <p className="text-sm text-stone-500 mb-6">
        {pt
          ? "Forma recente, força estimada pelo modelo e pontos esperados (xPts) a partir do xG."
          : "Recent form, model-estimated strength and expected points (xPts) from xG."}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <TeamCard panel={home} locale={locale} />
        <TeamCard panel={away} locale={locale} />
      </div>
    </div>
  );
}
