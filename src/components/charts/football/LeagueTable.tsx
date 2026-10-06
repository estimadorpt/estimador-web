"use client";

import { ligaTeamSlugs, teamColorOnPaper, teamLogoSrc, teamDisplayName, teamPhoneName } from "@/lib/config/football";
import type { ActualStanding, TeamStanding, TeamDelta } from "@/types/football";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState, useEffect, useId } from "react";
import { describePp, formatDecimal, formatInteger, formatPercent, formatPp, formatSigned } from "@/lib/football-format";
import { calibrationSentence, type PointsCalibration } from "@/lib/football-scorecard";

/**
 * The league page's club chooser: a labelled select and an explicit "Ver"
 * button. Choosing in the select changes nothing until the button (or
 * Enter) submits, so arrowing through the list with a keyboard never
 * navigates away (audit A11Y-14).
 */
export function ClubChooser({
  teams,
  label,
  placeholder,
}: {
  teams: string[];
  label: string;
  placeholder: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const id = useId();
  const [value, setValue] = useState("");
  const [hint, setHint] = useState(false);
  const sorted = [...teams].sort((a, b) => teamDisplayName(a).localeCompare(teamDisplayName(b), "pt"));
  return (
    <form
      className="flex min-w-0 flex-wrap items-end gap-2 text-left"
      onSubmit={e => {
        e.preventDefault();
        const slug = ligaTeamSlugs[value];
        // Never a disabled button that looks broken (audit CL2-04): with no
        // club chosen, the select gets focus and a hint says why.
        if (!slug) {
          setHint(true);
          document.getElementById(id)?.focus();
          return;
        }
        router.push(`/${locale}/desporto/liga/${slug}`);
      }}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</label>
        <select
          id={id}
          value={value}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={e => {
            setValue(e.target.value);
            setHint(false);
          }}
          className="min-h-11 min-w-[200px] rounded-[10px] border border-line bg-paper px-3 text-base text-ink sm:text-sm"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {sorted.map(team => (
            <option key={team} value={team}>
              {teamDisplayName(team)}
            </option>
          ))}
        </select>
      </span>
      <button
        type="submit"
        className="min-h-11 rounded-[10px] bg-ink px-4 text-sm font-semibold text-paper transition-colors duration-150 hover:bg-forest"
      >
        {locale === "en" ? "See club" : "Ver equipa"}
      </button>
      {hint && (
        <p id={`${id}-hint`} role="status" className="w-full text-sm text-stone-600">
          {locale === "en" ? "Choose a club from the list first." : "Escolhe primeiro um clube na lista."}
        </p>
      )}
    </form>
  );
}

/** Final-points quantiles from the season simulation, per team. */
export interface PointsInterval {
  q05: number;
  q25: number;
  q50: number;
  q75: number;
  q95: number;
}

interface LeagueTableProps {
  data: TeamStanding[];
  actualStandings?: ActualStanding[];
  deltas?: Record<string, TeamDelta>;
  /** Keyed by team name. When absent the table renders exactly as before. */
  intervals?: Record<string, PointsInterval>;
  /** Simulated seasons behind the intervals (prediction.n_sims). */
  nSims?: number;
  /** The model that produced the forecast (prediction.model): the
   * calibration figure is only quoted for the model it was measured on. */
  model?: string;
  /** The final-points interval check (market_scorecard.json → calibration). */
  calibration?: PointsCalibration | null;
  /** The matchday the deltas compare with, for their words. */
  previousMatchday?: number;
  labels: {
    team: string;
    meanPoints: string;
    goalDifference: string;
    championship: string;
    top3: string;
    relegation: string;
    teamClickHint?: string;
    played?: string;
    actualPoints?: string;
  };
}

/**
 * A change since the previous forecast: signed in text ("+26 pp", U+2212),
 * coloured only as a repeat, and said in words for screen readers
 * (audit A11Y-V03: "51% 26" was all an arrow and a colour left).
 */
function Delta({ value, invert = false, since, locale }: { value: number; invert?: boolean; since: string; locale: string }) {
  // value is in percentage points (TeamDelta); formatPp takes 0–1.
  if (Math.abs(value) < 1) return null;
  const good = invert ? value < 0 : value > 0;
  return (
    <span className={`ml-1 block text-[11px] font-semibold tabular-nums sm:inline ${good ? "text-emerald-700" : "text-red-700"}`}>
      <span aria-hidden="true">{formatPp(value / 100, locale)}</span>
      <span className="sr-only">, {describePp(value / 100, locale, since)}</span>
    </span>
  );
}

/**
 * Final-points distribution as a horizontal range: the thin rule spans the
 * 90% interval (q05–q95), the block the middle half (q25–q75), the tick the
 * median. All teams share one scale, so positions compare down the column.
 */
function PointsBand({ interval, min, max, color }: { interval: PointsInterval; min: number; max: number; color: string }) {
  const span = Math.max(max - min, 1);
  const pos = (v: number) => ((v - min) / span) * 100;
  const left = pos(interval.q05);
  const right = pos(interval.q95);
  const iqrLeft = pos(interval.q25);
  const iqrRight = pos(interval.q75);
  return (
    <div aria-hidden="true" className="relative h-4 w-full min-w-[120px]">
      <div className="absolute top-1/2 h-px -translate-y-1/2 bg-stone-500" style={{ left: `${left}%`, width: `${Math.max(right - left, 0.5)}%` }} />
      <div className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-stone-500" style={{ left: `${left}%` }} />
      <div className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-stone-500" style={{ left: `${right}%` }} />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-sm"
        style={{ left: `${iqrLeft}%`, width: `${Math.max(iqrRight - iqrLeft, 0.8)}%`, backgroundColor: color, opacity: 0.6 }}
      />
      <div className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 bg-stone-900" style={{ left: `${pos(interval.q50)}%` }} />
    </div>
  );
}

export function LeagueTable({
  data,
  actualStandings,
  deltas,
  intervals,
  labels,
  nSims = 50000,
  model,
  calibration,
  previousMatchday,
}: LeagueTableProps) {
  const locale = useLocale();
  const pt = locale !== "en";
  // Read ?club= after mount: useSearchParams would force a Suspense boundary in the static export.
  const [clubParam, setClubParam] = useState<string | null>(null);
  useEffect(() => {
    setClubParam(new URLSearchParams(window.location.search).get("club"));
  }, []);
  const [expanded, setExpanded] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsNarrow(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const actualLookup = new Map<string, ActualStanding>();
  for (const s of actualStandings ?? []) actualLookup.set(s.team, s);
  const hasActual = actualLookup.size > 0;

  const bandTeams = intervals ? data.filter(t => intervals[t.team]) : [];
  const hasBands = bandTeams.length > 0;
  const bandMin = hasBands ? Math.min(...bandTeams.map(t => intervals![t.team].q05)) - 1 : 0;
  const bandMax = hasBands ? Math.max(...bandTeams.map(t => intervals![t.team].q95)) + 1 : 1;

  const since = previousMatchday
    ? pt ? `face à previsão depois da jornada ${previousMatchday}` : `since the forecast after matchday ${previousMatchday}`
    : pt ? "face à previsão anterior" : "since the previous forecast";
  const bandLabel = pt ? "Pontos finais" : "Final points";
  const bandRange = (v: PointsInterval) => `${v.q05}–${v.q95}`;
  const bandTitle = (v: PointsInterval) =>
    pt
      ? `90% das simulações entre ${v.q05} e ${v.q95} pontos; metade entre ${v.q25} e ${v.q75}; mediana ${v.q50}`
      : `90% of simulations between ${v.q05} and ${v.q95} points; half between ${v.q25} and ${v.q75}; median ${v.q50}`;

  if (!data || data.length === 0) return null;

  // ?club= (a slug) drives the phone-compact view: selected row + neighbours,
  // with a disclosure back to the full table.
  const selectedIndex = clubParam ? data.findIndex(t => ligaTeamSlugs[t.team] === clubParam) : -1;
  const compact = selectedIndex >= 0 && isNarrow && !expanded;
  const NEIGHBOURS = 2;
  const visibleData = compact ? data.filter((_, i) => Math.abs(i - selectedIndex) <= NEIGHBOURS) : data;
  const skippedBefore = compact ? Math.max(0, selectedIndex - NEIGHBOURS) : 0;
  const skippedAfter = compact ? Math.max(0, data.length - 1 - (selectedIndex + NEIGHBOURS)) : 0;

  return (
    <div>
      {labels.teamClickHint && <p className="mb-3 text-xs text-stone-500">{labels.teamClickHint}</p>}
      {/* Below `sm` the table keeps five columns (position, club, points,
          title, relegation) so nothing sits off screen at 320 px; the
          predicted points, goal difference and top 3 join from `sm` up
          (audit UXM-10). */}
      {/* On a phone the rows' order has to be readable from what is on
          screen: the visible points column is the predicted one, and the
          caption says so before the first row (audit PUB2-01). */}
      <p className="mb-2 text-xs leading-relaxed text-stone-600 sm:hidden">
        {pt
          ? "Ordenada pelos pontos previstos no fim da época (Prev.). Os pontos atuais estão na página de cada clube e num ecrã maior."
          : "Ordered by predicted end-of-season points (Pred.). Current points are on each club's page and on a wider screen."}
      </p>
      <div tabIndex={0} role="region" aria-label={pt ? "Classificação prevista" : "Predicted standings"} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-stone-500 sm:hidden">
              <th className="py-1 pr-2" colSpan={2}><span className="sr-only">{labels.team}</span></th>
              <th className="px-2 py-1 text-center" colSpan={3}>{pt ? "Previsão do modelo" : "Model forecast"}</th>
            </tr>
            {hasActual && (
              <tr className="hidden text-left text-[11px] uppercase tracking-wider text-stone-500 sm:table-row">
                <th className="py-1 pr-2" colSpan={2}><span className="sr-only">{labels.team}</span></th>
                <th className="px-2 py-1 text-center" colSpan={2}>{pt ? "Atual" : "Current"}</th>
                <th className="border-l border-stone-200 px-3 py-1 text-center" colSpan={hasBands ? 5 : 4}>
                  {pt ? "Previsão do modelo" : "Model forecast"}
                </th>
              </tr>
            )}
            <tr className="border-b border-ink/40 bg-cream text-left">
              <th scope="col" className="w-7 py-2 pr-1 font-medium text-stone-500">#</th>
              <th scope="col" className="py-2 pr-2 font-medium">{labels.team}</th>
              {hasActual && (
                <>
                  <th scope="col" className="hidden px-2 py-2 text-right text-xs font-medium text-stone-500 sm:table-cell">{labels.played ?? "J"}</th>
                  <th scope="col" className="hidden px-2 py-2 text-right text-xs font-medium sm:table-cell">
                    <abbr title={pt ? "Pontos" : "Points"} className="no-underline">{labels.actualPoints ?? "Pts"}</abbr>
                  </th>
                </>
              )}
              <th scope="col" className={`px-2 py-2 text-right font-medium sm:px-3 ${hasActual ? "sm:border-l sm:border-stone-200" : ""}`}>
                <abbr aria-hidden="true" title={labels.meanPoints} className="no-underline sm:hidden">{pt ? "Prev." : "Pred."}</abbr>
                <span className="sr-only sm:not-sr-only">{labels.meanPoints}</span>
              </th>
              {hasBands && (
                <th scope="col" className="hidden w-[20%] px-3 py-2 text-xs font-medium text-stone-500 md:table-cell">
                  {bandLabel} <span className="text-stone-500">90%</span>
                </th>
              )}
              <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">{labels.goalDifference}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">{labels.championship}</th>
              <th scope="col" className="hidden px-3 py-2 text-right font-medium sm:table-cell">{labels.top3}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">
                <span aria-hidden="true" className="sm:hidden">{pt ? "Desp." : "Rel."}</span>
                <span className="sr-only sm:not-sr-only">{labels.relegation}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {compact && skippedBefore > 0 && (
              <tr aria-hidden="true">
                <td colSpan={99} className="py-1 text-center text-[11px] text-stone-500">
                  {pt ? `${skippedBefore} equipa(s) acima` : `${skippedBefore} team(s) above`}
                </td>
              </tr>
            )}
            {visibleData.map(team => {
              const i = data.indexOf(team);
              const color = teamColorOnPaper(team.team);
              const interval = intervals?.[team.team];
              const isRelegationZone = i >= data.length - 3;
              const isChampionZone = i < 3;
              const isSelected = i === selectedIndex;
              const slug = ligaTeamSlugs[team.team];
              const actual = actualLookup.get(team.team);
              const name = (
                <>
                  {teamLogoSrc(team.team) ? (
                    <img src={teamLogoSrc(team.team)} alt="" width={20} height={20} loading="lazy" decoding="async" className="h-5 w-5 shrink-0 object-contain" />
                  ) : (
                    <i aria-hidden="true" className="h-5 w-1 shrink-0" style={{ backgroundColor: color }} />
                  )}
                  <span className="font-medium text-ink sm:hidden">{teamPhoneName(team.team)}</span>
                  <span className="hidden font-medium text-ink sm:inline">{teamDisplayName(team.team)}</span>
                </>
              );
              return (
                <tr
                  key={team.team}
                  className={`border-b border-stone-200 ${isSelected ? "bg-parchment" : isRelegationZone ? "bg-red-50/40" : isChampionZone ? "bg-stone-50" : ""}`}
                >
                  <td className="py-2.5 pr-1 tabular-nums text-stone-500">{i + 1}</td>
                  <td className="py-1 pr-2">
                    {slug ? (
                      <Link
                        href={`/desporto/liga/${slug}`}
                        locale={locale}
                        className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-11 items-center gap-2">{name}</span>
                    )}
                  </td>
                  {hasActual && (
                    <>
                      <td className="hidden px-2 py-2.5 text-right text-xs tabular-nums text-stone-500 sm:table-cell">{actual?.played ?? ""}</td>
                      <td className="hidden px-2 py-2.5 text-right font-semibold tabular-nums sm:table-cell">{actual ? formatInteger(actual.points, locale) : ""}</td>
                    </>
                  )}
                  <td className={`px-2 py-2.5 text-right font-semibold tabular-nums sm:px-3 ${hasActual ? "sm:border-l sm:border-stone-200" : ""}`}>
                    {formatDecimal(team.mean_pts, locale, 1)}
                    {interval && (
                      <div className="text-[11px] font-normal tabular-nums text-stone-500 md:hidden">{bandRange(interval)}</div>
                    )}
                  </td>
                  {hasBands && (
                    <td className="hidden px-3 py-2.5 md:table-cell" title={interval ? bandTitle(interval) : undefined}>
                      {interval ? (
                        <div className="flex items-center gap-2">
                          <PointsBand interval={interval} min={bandMin} max={bandMax} color={color} />
                          <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-stone-500">
                            <span className="sr-only">{pt ? "90% das simulações entre " : "90% of simulations between "}</span>
                            {bandRange(interval)}
                          </span>
                        </div>
                      ) : null}
                    </td>
                  )}
                  <td className="hidden px-3 py-2.5 text-right tabular-nums text-stone-500 sm:table-cell">
                    {formatSigned(Math.round(team.mean_gd), locale, 0)}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums sm:px-3">
                    <span className={team.p_champion > 0.01 ? "font-semibold text-ink" : "text-stone-500"}>{formatPercent(team.p_champion, locale)}</span>
                    {deltas?.[team.team] && <Delta value={deltas[team.team].p_champion_delta} since={since} locale={locale} />}
                  </td>
                  <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">{formatPercent(team.p_top3, locale)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums sm:px-3">
                    <span className={team.p_relegation > 0.1 ? "font-semibold text-red-700" : team.p_relegation > 0 ? "text-ink" : "text-stone-500"}>
                      {formatPercent(team.p_relegation, locale)}
                    </span>
                    {deltas?.[team.team] && <Delta value={deltas[team.team].p_relegation_delta} invert since={since} locale={locale} />}
                  </td>
                </tr>
              );
            })}
            {compact && skippedAfter > 0 && (
              <tr aria-hidden="true">
                <td colSpan={99} className="py-1 text-center text-[11px] text-stone-500">
                  {pt ? `${skippedAfter} equipa(s) abaixo` : `${skippedAfter} team(s) below`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedIndex >= 0 && isNarrow && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="mt-3 min-h-11 text-sm font-semibold text-ink underline underline-offset-4"
        >
          {expanded ? (pt ? "Mostrar só a minha equipa" : "Show only my club") : (pt ? "Ver tabela completa" : "See the full table")}
        </button>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-stone-500 sm:hidden">
        {pt
          ? "Num ecrã maior, a tabela mostra também os pontos atuais, a diferença de golos e o top 3; cada equipa tem tudo na sua página."
          : "On a wider screen the table also shows current points, goal difference and top 3; each club's page has everything."}
      </p>

      {/* What the relegation column counts (audit M-07): the play-off place is not in it. */}
      <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
        {pt
          ? "Despromoção = 17.º ou 18.º lugar; o 16.º joga o play-off e não conta."
          : "Relegation = 17th or 18th; 16th plays off and is not counted."}
      </p>

      {/* Legend + the calibration claim, next to the thing it is a claim about. */}
      {hasBands && (
        <div className="mt-3 hidden max-w-3xl md:block">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="relative inline-block h-px w-6 bg-stone-500" />
              {pt ? "90% das simulações" : "90% of simulations"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-1.5 w-4 rounded-sm bg-stone-500/60" />
              {pt ? "metade das simulações" : "half of simulations"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-3 w-[2px] bg-stone-900" />
              {pt ? "mediana" : "median"}
            </span>
          </div>
        </div>
      )}
      {hasBands && (
        <p className="mt-1.5 hidden max-w-3xl text-[11px] leading-relaxed text-stone-500 sm:block">
          {pt
            ? `Os pontos finais são uma distribuição, não um número: o intervalo mostra onde caem 90% das ${formatInteger(nSims, locale)} épocas simuladas.`
            : `Final points are a distribution, not a number: the range shows where 90% of the ${formatInteger(nSims, locale)} simulated seasons fall.`}{" "}
          {calibrationSentence(calibration, model, locale)}
        </p>
      )}
    </div>
  );
}
