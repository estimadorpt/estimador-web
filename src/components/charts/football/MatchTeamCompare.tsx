import { teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { formatDecimal, formatOrdinal, formatSigned } from "@/lib/football-format";
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

const ordinal = formatOrdinal;

/** A small square beside each result letter; the letter carries the meaning. */
const RESULT_SQUARE: Record<FormEntry["result"], string> = {
  W: "bg-emerald-700",
  D: "bg-stone-300",
  L: "bg-red-700",
};

function num(v: number, pt: boolean, digits = 1): string {
  return formatDecimal(v, pt ? "pt" : "en", digits);
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
    luck: "Pts − xPts",
    luckTitle: pt
      ? "Diferença entre os pontos conquistados e os pontos que a qualidade dos remates (xG) sugeriria — não é uma medida de sorte."
      : "The gap between points won and the points shot quality (xG) would suggest — not a measure of luck.",
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
    <div className="min-w-0 border-t border-ink">
      {/* The club colour is the identity rule beside the name; the bars
          below are ink, so a red kit never reads as a "bad" bar (UXD3-07). */}
      <div className="flex items-center gap-2 py-2.5 border-b border-rule">
        <i aria-hidden="true" className="h-5 w-1 shrink-0" style={{ backgroundColor: panel.color }} />
        {teamLogoSrc(panel.team) && (
          <img src={teamLogoSrc(panel.team)} alt="" width={28} height={28} loading="lazy" decoding="async" className="w-7 h-7 object-contain" />
        )}
        <span className="name-cut text-sm text-ink">
          {teamDisplayName(panel.team)}
        </span>
        <span className="ml-auto text-[12px] font-semibold text-graphite">
          {panel.venue === "H" ? L.home : L.away}
        </span>
      </div>

      <div className="py-3 space-y-4">
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
                {/* U+2212 for a negative difference (audit FA2-17). */}
                {formatSigned(panel.standing.gd, locale, 0)}
              </strong>
            </span>
          </div>
        )}

        {/* Form */}
        <div>
          <div className="text-[12px] font-semibold text-graphite mb-1.5">
            {L.form}
          </div>
          {panel.form.length === 0 ? (
            <div className="text-xs text-stone-500">{L.noForm}</div>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {panel.form.map(f => (
                <div
                  key={`${f.matchday}-${f.opponent}`}
                  className="flex items-center gap-1.5"
                >
                  <i aria-hidden="true" className={`h-2 w-2 shrink-0 ${RESULT_SQUARE[f.result]}`} />
                  <span className="text-[13px] font-semibold text-ink">
                    {L.resultLetters[f.result]}
                  </span>
                  <span className="text-[11px] tabular-nums text-stone-700 font-medium">
                    {f.gf}–{f.ga}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {teamDisplayName(f.opponent)} ({f.venue === "H" ? (pt ? "C" : "H") : (pt ? "F" : "A")}
                    <span className="sr-only">{f.venue === "H" ? (pt ? ", em casa" : ", at home") : (pt ? ", fora" : ", away")}</span>)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model strength */}
        {(attackPct !== null || defensePct !== null) && (
          <div>
            <div className="text-[12px] font-semibold text-graphite mb-1.5">
              {pt ? "Força do modelo" : "Model strength"}
            </div>
            <div className="space-y-1.5">
              {attackPct !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500 w-14">{L.attack}</span>
                  <span className="flex-1 border-b border-scale pb-px">
                    <span
                      className="block h-1.5"
                      style={{ width: `${attackPct}%`, backgroundColor: "var(--color-ink)" }}
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
                  <span className="flex-1 border-b border-scale pb-px">
                    <span
                      className="block h-1.5"
                      style={{ width: `${defensePct}%`, backgroundColor: "var(--color-ink)" }}
                    />
                  </span>
                  <span className="text-[11px] font-bold text-stone-700 tabular-nums w-8 text-right">
                    {ordinal(panel.defenseRank!, locale)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">{L.strengthNote}</div>
          </div>
        )}

        {/* xPts */}
        <div>
          <div className="text-[12px] font-semibold text-graphite mb-1.5">
            {pt ? "Desempenho esperado" : "Expected performance"}
          </div>
          {!panel.xpts ? (
            <div className="text-xs text-stone-500">{L.noXpts}</div>
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
                <span title={L.luckTitle}>
                  {L.luck}:{" "}
                  <strong
                    className={
                      luck > 0.5
                        ? "text-emerald-700"
                        : luck < -0.5
                          ? "text-red-700"
                          : "text-stone-800"
                    }
                  >
                    {/* U+2212 for a negative gap (audit FA2-17). */}
                    {formatSigned(luck, locale, 1)}
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
      <h2 className="text-2xl md:text-[28px] mb-1">
        {pt ? "Como chegam" : "How they arrive"}
      </h2>
      <p className="text-sm text-stone-500 mb-6">
        {pt
          ? "Forma recente, força estimada pelo modelo e pontos esperados (xPts) a partir do xG."
          : "Recent form, model-estimated strength and expected points (xPts) from xG."}
      </p>
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <TeamCard panel={home} locale={locale} />
        <TeamCard panel={away} locale={locale} />
      </div>
    </div>
  );
}
