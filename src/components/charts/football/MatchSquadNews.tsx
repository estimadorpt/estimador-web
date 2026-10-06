import { teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { Link } from "@/i18n/routing";
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
import type { AbsencesStatus } from "@/lib/football-injuries";
import { formatDecimal, formatLongDate } from "@/lib/football-format";

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
  /** 'current' only when the absences list is recent enough for this forecast
   * (see currentAbsences); anything else hides the lists and says so. */
  absencesStatus: AbsencesStatus;
  snapshotDate?: string | null;
  /** "Dados até 16 mai. 2026 (fim da época 2025-26)": the SAR fit's last
   * appearance (playerDataCutoffLabel), shown next to the SAR lists (F-H6). */
  sarCutoffLabel?: string | null;
  /** How many players the published finishing list holds (players.json):
   * a club with none in it is not a club without minutes (audit VFA-M1). */
  publishedCount?: number;
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

/** One team's column of the shared squads card: its name, its absences and its
 * finishing list, read top-down. From md the two columns sit on one subgrid, so
 * the name, "Indisponíveis" and "Finalização" rows start at the same height in
 * both and the hairlines between them line up across the card. */
function SideColumn({
  side,
  locale,
  unavailable,
  absencesStatus,
  sarCutoffLabel,
  publishedCount = 0,
  className = "",
}: {
  side: MatchSquadSide;
  locale: string;
  unavailable: Set<string>;
  absencesStatus: AbsencesStatus;
  sarCutoffLabel?: string | null;
  publishedCount?: number;
  className?: string;
}) {
  const pt = locale !== "en";
  const codes = pt ? positionCodePt : positionCodeEn;

  const maxSar = Math.max(0.0001, ...side.topPlayers.map(p => p.sar));

  return (
    <div className={`md:row-span-3 md:grid md:grid-rows-subgrid ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
        {/* The club colour as the identity rule; the bars are ink (UXD3-07). */}
        <i aria-hidden="true" className="h-5 w-1 shrink-0 rounded-full" style={{ backgroundColor: side.color }} />
        {teamLogoSrc(side.team) && (
          <img src={teamLogoSrc(side.team)} alt="" width={28} height={28} loading="lazy" decoding="async" className="w-7 h-7 object-contain" />
        )}
        <span className="text-sm font-bold text-stone-900">
          {teamDisplayName(side.team)}
        </span>
      </div>

      {/* Unavailable */}
      <div className="px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Stethoscope className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {pt ? "Indisponíveis" : "Unavailable"}
          </span>
          {absencesStatus === "current" && side.injurySummary?.share_of_squad != null && (
            <span className="text-[11px] text-stone-500">
              ·{" "}
              {pt
                ? `${Math.round(side.injurySummary.share_of_squad * 100)}% do valor do plantel`
                : `${Math.round(side.injurySummary.share_of_squad * 100)}% of squad value`}
            </span>
          )}
        </div>
        {absencesStatus !== "current" ? (
          <div className="text-xs text-stone-500">
            {pt ? "Sem dados recentes de baixas." : "No recent absence data."}
          </div>
        ) : side.injuries.length === 0 ? (
          <div className="text-xs text-stone-500">
            {pt
              ? "Sem baixas registadas. Isto não garante que o plantel esteja totalmente disponível."
              : "No absences on record. This is not proof of a fully available squad."}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {side.injuries.map(p => (
              <li key={p.player} className="flex items-baseline gap-2 text-xs">
                <span className="font-medium text-stone-800">{p.player}</span>
                {p.position && (
                  <span className="text-[11px] text-stone-500">
                    {positionLabel(p.position, locale)}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-stone-500 text-right">
                  {injuryReasonLabel(p.reason, locale) ||
                    (p.kind === "suspension"
                      ? pt
                        ? "Suspensão"
                        : "Suspension"
                      : pt
                        ? "Lesão"
                        : "Injury")}
                </span>
                <span className="text-[11px] tabular-nums text-stone-500 w-14 text-right">
                  {formatValue(p.market_value_eur, pt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top players by SAR */}
      <div className="px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
          {pt ? "Finalização (SAR)" : "Finishing (SAR)"}
        </div>
        <p className="text-[11px] text-stone-500 mb-2 leading-relaxed">
          {pt
            ? "Só golos por 90 minutos acima do substituto — uma métrica de avançados, não uma classificação geral de qualidade."
            : "Goals/90 above replacement only — a forwards metric, not a general quality ranking."}
          {sarCutoffLabel ? ` ${sarCutoffLabel}.` : ""}
        </p>
        {side.topPlayers.length === 0 ? (
          // The reason is the list, not the minutes (audit VFA-M1).
          <div className="text-xs text-stone-500">
            {publishedCount > 0
              ? pt
                ? `Nenhum jogador deste clube está entre os ${publishedCount} publicados na lista de finalização. `
                : `No player from this club is among the ${publishedCount} on the published finishing list. `
              : pt
                ? "Nenhum jogador deste clube está na lista de finalização publicada. "
                : "No player from this club is on the published finishing list. "}
            <Link href="/desporto/liga/jogadores" locale={pt ? "pt" : "en"} className="font-semibold text-ink underline underline-offset-4">
              {pt ? "Ver a lista" : "See the list"}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {side.topPlayers.map(p => {
              const out = unavailable.has(p.player);
              return (
                <li key={p.player}>
                  <div className="flex items-baseline gap-2 text-xs mb-0.5">
                    <span
                      className={`font-medium ${out ? "text-stone-500 line-through" : "text-stone-800"}`}
                    >
                      {p.player}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {codes[p.position] ?? p.position}
                    </span>
                    {out && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                        {pt ? "fora" : "out"}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] font-bold tabular-nums text-stone-700">
                      {formatDecimal(p.sar, locale, 2)}
                    </span>
                  </div>
                  <span className="block h-1 bg-stone-100 overflow-hidden">
                    <span
                      className="block h-full"
                      style={{
                        width: `${Math.max(4, (p.sar / maxSar) * 100)}%`,
                        backgroundColor: "var(--color-ink)",
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
  absencesStatus,
  snapshotDate,
  sarCutoffLabel,
  publishedCount = 0,
}: MatchSquadNewsProps) {
  const pt = locale !== "en";
  const current = absencesStatus === "current";
  const snapshot = snapshotDate ? formatLongDate(snapshotDate, locale) : "";
  return (
    <div>
      <h2 className="text-2xl tracking-tight mb-1">
        {pt ? "Plantéis" : "Squads"}
      </h2>
      <p className="text-sm text-stone-500 mb-6">
        {/* The players are those of the published list, not a ranking within
            each club (audit VFA-M1). */}
        {pt
          ? `Baixas conhecidas e os jogadores de cada equipa que entram na lista de finalização publicada${publishedCount ? `, de ${publishedCount} jogadores` : ""} (SAR, valor acima do substituto). Baixas e jogadores individuais não entram nesta previsão: o modelo usa golos, remates à baliza e o valor de cada plantel.`
          : `Known absentees and each side's players on the published finishing list${publishedCount ? ` of ${publishedCount}` : ""} (SAR, skill above replacement). Neither absences nor individual players feed this forecast: the model uses goals, shots on target and each squad's value.`}
        {current && snapshot
          ? ` ${pt ? "Baixas registadas a" : "Absences recorded as of"} ${snapshot}.`
          : !current
            ? ` ${
                pt
                  ? `Não mostramos baixas: a lista publicada${snapshot ? `, de ${snapshot},` : ""} não é recente o suficiente para esta previsão.`
                  : `Absences are not shown: the published list${snapshot ? `, from ${snapshot},` : ""} is not recent enough for this forecast.`
              }`
            : ""}
      </p>
      {/* The two teams are compared, so they share one card: two columns split by
          a hairline (stacked below md, with the hairline between them), not two
          cards where the shorter one is stretched to the taller one's height. */}
      <div className="overflow-hidden rounded-2xl border border-line bg-cream md:grid md:grid-cols-2 md:grid-rows-[auto_auto_auto]">
        <SideColumn side={home} locale={locale} unavailable={unavailable} absencesStatus={absencesStatus} sarCutoffLabel={sarCutoffLabel} publishedCount={publishedCount} />
        <SideColumn side={away} locale={locale} unavailable={unavailable} absencesStatus={absencesStatus} sarCutoffLabel={sarCutoffLabel} publishedCount={publishedCount} className="border-t border-line md:border-t-0 md:border-l" />
      </div>
      {/* The feed's metric_label is English; the definition is ours to write. */}
      <p className="text-[11px] text-stone-500 mt-3">
        {pt
          ? "SAR: golos por 90 minutos acima de um jogador de nível de substituição, com os valores extremos limitados."
          : "SAR: goals per 90 minutes above a replacement-level player, with extreme values capped."}
      </p>
    </div>
  );
}
