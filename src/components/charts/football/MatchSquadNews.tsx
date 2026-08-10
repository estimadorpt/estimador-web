import { teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import {
  injuryReasonLabel,
  positionLabel,
  positionCodeEn,
  positionCodePt,
} from "@/lib/i18n/football-labels";
import type {
  InjuryPlayer,
  InjuryTeam,
} from "@/components/charts/football/InjuriesPanel";
import type { PlayerSkillEntry } from "@/components/charts/football/PlayerSkillRanking";
import { Stethoscope } from "lucide-react";

export interface MatchSquadSide {
  team: string;
  color: string;
  injuries: InjuryPlayer[];
  injurySummary?: InjuryTeam;
  topPlayers: PlayerSkillEntry[];
}

interface MatchSquadNewsProps {
  home: MatchSquadSide;
  away: MatchSquadSide;
  locale: string;
  /** Player names currently listed as unavailable, to flag in the skill list. */
  unavailable: Set<string>;
  snapshotDate?: string | null;
  metricLabel?: string;
}

function formatValue(v: number | null | undefined, pt: boolean): string {
  if (!v) return "—";
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m.toLocaleString(pt ? "pt-PT" : "en-GB", {
      maximumFractionDigits: m < 10 ? 1 : 0,
    })} M€`;
  }
  return `${Math.round(v / 1000)} ${pt ? "mil €" : "k€"}`;
}

function SideCard({
  side,
  locale,
  unavailable,
}: {
  side: MatchSquadSide;
  locale: string;
  unavailable: Set<string>;
}) {
  const pt = locale !== "en";
  const codes = pt ? positionCodePt : positionCodeEn;

  const maxSar = Math.max(0.0001, ...side.topPlayers.map(p => p.sar));

  return (
    <div className="border border-stone-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
        {teamLogoSrc(side.team) && (
          <img src={teamLogoSrc(side.team)} alt="" className="w-7 h-7 object-contain" />
        )}
        <span className="text-sm font-bold text-stone-900">
          {teamDisplayName(side.team)}
        </span>
      </div>

      {/* Unavailable */}
      <div className="px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Stethoscope className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {pt ? "Indisponíveis" : "Unavailable"}
          </span>
          {side.injurySummary?.share_of_squad != null && (
            <span className="text-[10px] text-stone-400">
              ·{" "}
              {pt
                ? `${Math.round(side.injurySummary.share_of_squad * 100)}% do valor do plantel`
                : `${Math.round(side.injurySummary.share_of_squad * 100)}% of squad value`}
            </span>
          )}
        </div>
        {side.injuries.length === 0 ? (
          <div className="text-xs text-stone-400">
            {pt ? "Sem baixas registadas." : "No absences on record."}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {side.injuries.map(p => (
              <li key={p.player} className="flex items-baseline gap-2 text-xs">
                <span className="font-medium text-stone-800">{p.player}</span>
                {p.position && (
                  <span className="text-[10px] text-stone-400">
                    {positionLabel(p.position, locale)}
                  </span>
                )}
                <span className="ml-auto text-[10px] text-stone-500 text-right">
                  {injuryReasonLabel(p.reason, locale) ||
                    (p.kind === "suspension"
                      ? pt
                        ? "Suspensão"
                        : "Suspension"
                      : pt
                        ? "Lesão"
                        : "Injury")}
                </span>
                <span className="text-[10px] tabular-nums text-stone-400 w-14 text-right">
                  {formatValue(p.market_value_eur, pt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top players by SAR */}
      <div className="px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
          {pt ? "Jogadores decisivos (SAR)" : "Key players (SAR)"}
        </div>
        {side.topPlayers.length === 0 ? (
          <div className="text-xs text-stone-400">
            {pt ? "Sem jogadores com minutos suficientes." : "No players with enough minutes."}
          </div>
        ) : (
          <ul className="space-y-2">
            {side.topPlayers.map(p => {
              const out = unavailable.has(p.player);
              return (
                <li key={p.player}>
                  <div className="flex items-baseline gap-2 text-xs mb-0.5">
                    <span
                      className={`font-medium ${out ? "text-stone-400 line-through" : "text-stone-800"}`}
                    >
                      {p.player}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {codes[p.position] ?? p.position}
                    </span>
                    {out && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-red-500">
                        {pt ? "fora" : "out"}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] font-bold tabular-nums text-stone-700">
                      {pt ? p.sar.toFixed(2).replace(".", ",") : p.sar.toFixed(2)}
                    </span>
                  </div>
                  <span className="block h-1 bg-stone-100 overflow-hidden">
                    <span
                      className="block h-full"
                      style={{
                        width: `${Math.max(4, (p.sar / maxSar) * 100)}%`,
                        backgroundColor: side.color,
                      }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MatchSquadNews({
  home,
  away,
  locale,
  unavailable,
  snapshotDate,
  metricLabel,
}: MatchSquadNewsProps) {
  const pt = locale !== "en";
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight mb-1">
        {pt ? "Plantéis" : "Squads"}
      </h2>
      <p className="text-sm text-stone-500 mb-6">
        {pt
          ? "Baixas conhecidas e os jogadores com maior valor acima do substituto (SAR) em cada equipa."
          : "Known absentees and each side's highest skill-above-replacement (SAR) players."}
        {snapshotDate ? ` ${pt ? "Baixas a" : "Absences as of"} ${snapshotDate}.` : ""}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SideCard side={home} locale={locale} unavailable={unavailable} />
        <SideCard side={away} locale={locale} unavailable={unavailable} />
      </div>
      {metricLabel && (
        <p className="text-[11px] text-stone-400 mt-3">SAR — {metricLabel}</p>
      )}
    </div>
  );
}
