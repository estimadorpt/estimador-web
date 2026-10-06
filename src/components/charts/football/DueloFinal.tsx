"use client";

import { useId, useMemo, useState } from "react";
import { teamColorOnPaper, teamDisplayName, teamLogoSrc, teamWithArticle } from "@/lib/config/football";
import { formatInteger, formatPercent, formatShortDate } from "@/lib/football-format";

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
import { duelBins, samplingMargin } from "@/lib/football-scenarios";
import { ChartTable } from "@/components/viz/ChartTable";
import { DataCard } from "@/components/viz/DataCard";
import type { SeasonSamples } from "./SeasonDraw";

interface DueloFinalProps {
  samples: SeasonSamples;
  locale?: string;
  /** The forecast's timestamp, for the card's date line. */
  forecastTimestamp?: string | null;
}

const TIE_COLOR = "#8b9a8e";

/** Head-to-head "who finishes ahead?" duel computed over the real sampled
 *  seasons from the Monte Carlo (same samples.json the SeasonDraw uses).
 *  The tie on points has its own bar; the share carries its sampling margin
 *  (300 seasons, about ±5 points, audit MR2-07); the bins are in a table
 *  twin and in the chart's own label (A11Y2-M1); source, date and method sit
 *  in the card's footer (MR2-07, UXD2-05). The frame is the shared DataCard
 *  (title, subtitle, the two pickers as its controls, footer); the question
 *  itself is the page section's h2, so the card's title names the chart. */
export function DueloFinal({ samples, locale = "pt", forecastTimestamp }: DueloFinalProps) {
  const pt = locale !== "en";
  const selectId = useId();

  // Default matchup = the two teams with the highest title probability
  const defaults = useMemo(() => {
    const order = samples.teams
      .map((_, i) => i)
      .sort((a, b) => samples.p_champion[b] - samples.p_champion[a]);
    return [order[0], order[1]] as const;
  }, [samples]);

  const [iA, setIA] = useState<number>(defaults[0]);
  const [iB, setIB] = useState<number>(defaults[1]);

  const teamOptions = useMemo(
    () =>
      samples.teams
        .map((name, i) => ({ name, i }))
        .sort((a, b) =>
          teamDisplayName(a.name).localeCompare(teamDisplayName(b.name), "pt")
        ),
    [samples.teams]
  );

  // One basis, the chart's: points at the end of the season. The headline
  // used to count final positions (tiebreaks included) while the bars count
  // points, so 66% sat over bars that add up to 64% (audit FA3-02). The
  // points ties are said apart, with how the tiebreaks split them.
  const stats = useMemo(() => {
    const n = samples.samples.length;
    let aheadA = 0;
    let aheadB = 0;
    let ptsTie = 0;
    let tieToA = 0;
    const diffs: number[] = [];
    for (const s of samples.samples) {
      if (s.pts[iA] > s.pts[iB]) aheadA++;
      else if (s.pts[iA] < s.pts[iB]) aheadB++;
      else {
        ptsTie++;
        if (s.pos[iA] < s.pos[iB]) tieToA++;
      }
      diffs.push(s.pts[iA] - s.pts[iB]);
    }
    return { n, aheadA, aheadB, ptsTie, tieToA, bins: duelBins(diffs) };
  }, [samples, iA, iB]);

  const nameA = teamDisplayName(samples.teams[iA]);
  const nameB = teamDisplayName(samples.teams[iB]);
  const colorA = teamColorOnPaper(samples.teams[iA]);
  const colorB = teamColorOnPaper(samples.teams[iB]);
  const shareA = stats.n ? stats.aheadA / stats.n : 0;
  const shareB = stats.n ? stats.aheadB / stats.n : 0;
  const shareTie = stats.n ? stats.ptsTie / stats.n : 0;
  const margin = Math.round(samplingMargin(shareA, stats.n) * 100);
  const maxCount = Math.max(1, ...stats.bins.map(b => b.count));
  // The first club's side on the left, as its selector is (audit UXD3-01).
  const shownBins = [...stats.bins].reverse();

  const rangeLabel = (lo: number, hi: number) => {
    if (lo === 0 && hi === 0) return pt ? "Empate" : "Level";
    const a = Math.min(Math.abs(lo), Math.abs(hi));
    const b = Math.max(Math.abs(lo), Math.abs(hi));
    return a === b ? `${a}` : pt ? `${a} a ${b}` : `${a}–${b}`;
  };
  const binWords = (lo: number, hi: number) => {
    if (lo === 0 && hi === 0) return pt ? "empate em pontos" : "level on points";
    const name = hi < 0 ? nameB : nameA;
    return pt ? `${name} à frente por ${rangeLabel(lo, hi)} pts` : `${name} ahead by ${rangeLabel(lo, hi)} pts`;
  };

  const t = {
    subtitle: pt
      ? `Escolhe duas equipas e vê quem acaba à frente nas ${formatInteger(stats.n, "pt")} épocas completas tiradas das ${formatInteger(samples.n_sims, "pt")} simulações do modelo.`
      : `Pick two teams and see who finishes ahead across ${formatInteger(stats.n, "en")} complete seasons drawn from the model's ${formatInteger(samples.n_sims, "en")} simulations.`,
    hero: pt
      ? `${capitalise(teamWithArticle(samples.teams[iA], "o"))} acaba com mais pontos do que ${teamWithArticle(samples.teams[iB], "o")} em ${formatPercent(shareA, "pt")} das épocas sorteadas; ${teamWithArticle(samples.teams[iB], "o")}, em ${formatPercent(shareB, "pt")}.`
      : `${nameA} finish with more points than ${nameB} in ${formatPercent(shareA, "en")} of the drawn seasons; ${nameB}, in ${formatPercent(shareB, "en")}.`,
    tieNote: stats.ptsTie === 0
      ? ""
      : pt
        ? ` (${formatInteger(stats.ptsTie, "pt")} ${stats.ptsTie === 1 ? "época" : "épocas"}; no desempate do modelo, ${formatInteger(stats.tieToA, "pt")} para ${teamWithArticle(samples.teams[iA], "o")} e ${formatInteger(stats.ptsTie - stats.tieToA, "pt")} para ${teamWithArticle(samples.teams[iB], "o")})`
        : ` (${formatInteger(stats.ptsTie, "en")} ${stats.ptsTie === 1 ? "season" : "seasons"}; on the model's tiebreak, ${formatInteger(stats.tieToA, "en")} to ${nameA} and ${formatInteger(stats.ptsTie - stats.tieToA, "en")} to ${nameB})`,
    marginNote: pt
      ? `Com ${formatInteger(stats.n, "pt")} épocas, a margem de amostragem é de cerca de ±${margin} pontos percentuais; os números de título ao lado vêm das ${formatInteger(samples.n_sims, "pt")} simulações e têm uma margem muito menor.`
      : `With ${formatInteger(stats.n, "en")} seasons, the sampling margin is about ±${margin} percentage points; the title figures beside them come from all ${formatInteger(samples.n_sims, "en")} simulations and carry a much smaller margin.`,
    axis: pt
      ? `Diferença de pontos no fim da época: ${nameA} e ${nameB}`
      : `Points gap at the end of the season: ${nameA} and ${nameB}`,
    ahead: (name: string) => (pt ? `${name} à frente` : `${name} ahead`),
    ptsTieLabel: pt ? "Empate em pontos" : "Level on points",
    champion: pt ? "Campeão" : "Champion",
    medianPts: pt ? "Pontos (mediana)" : "Points (median)",
  };

  // The chart's own label says what it shows, not only its axis (A11Y2-M1).
  const summary = pt
    ? `${t.hero} Empate em pontos em ${formatPercent(shareTie, "pt")}. Os valores de cada barra estão na tabela abaixo.`
    : `${t.hero} Level on points in ${formatPercent(shareTie, "en")}. Each bar's value is in the table below.`;

  const chip = (idx: number) => (
    <div className="flex items-center gap-2 text-xs text-stone-600">
      <span
        aria-hidden="true"
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: teamColorOnPaper(samples.teams[idx]) }}
      />
      <span>
        {t.champion}: <span className="font-semibold text-stone-900 tabular-nums">{formatPercent(samples.p_champion[idx], locale)}</span>
      </span>
      <span aria-hidden="true" className="text-stone-500">·</span>
      <span>
        {t.medianPts}: <span className="font-semibold text-stone-900 tabular-nums">{Math.round(samples.points_q50[idx])}</span>
      </span>
    </div>
  );

  const select = (value: number, other: number, onChange: (i: number) => void, which: "a" | "b") => (
    <div className="flex-1 min-w-0">
      <label htmlFor={`${selectId}-${which}`} className="mb-1 block text-xs font-semibold text-stone-600">
        {which === "a" ? (pt ? "Primeira equipa" : "First club") : (pt ? "Segunda equipa" : "Second club")}
      </label>
      <div className="flex items-center gap-2 mb-1">
        {teamLogoSrc(samples.teams[value]) && (
          <img src={teamLogoSrc(samples.teams[value])} alt="" width={20} height={20} loading="lazy" decoding="async" className="w-5 h-5 object-contain" />
        )}
        <select
          id={`${selectId}-${which}`}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-h-11 w-full rounded-[10px] border border-line bg-paper px-2 text-base font-medium text-ink sm:text-sm"
        >
          {teamOptions
            .filter((o) => o.i !== other)
            .map((o) => (
              <option key={o.i} value={o.i}>
                {teamDisplayName(o.name)}
              </option>
            ))}
        </select>
      </div>
      {chip(value)}
    </div>
  );

  return (
    <DataCard
      title={t.axis}
      subtitle={t.subtitle}
      controls={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-6">
          {select(iA, iB, setIA, "a")}
          <span aria-hidden="true" className="hidden sm:flex items-end pb-3 text-lg font-bold text-stone-500">–</span>
          {select(iB, iA, setIB, "b")}
        </div>
      }
      source={pt
        ? `Fonte: modelo estimador.pt, ${formatInteger(stats.n, "pt")} épocas sorteadas das ${formatInteger(samples.n_sims, "pt")} simulações`
        : `Source: estimador.pt model, ${formatInteger(stats.n, "en")} seasons drawn from ${formatInteger(samples.n_sims, "en")} simulations`}
      updated={forecastTimestamp
        ? pt ? `Previsão de ${formatShortDate(forecastTimestamp, "pt")}` : `Forecast of ${formatShortDate(forecastTimestamp, "en")}`
        : undefined}
      methodologyHref={pt ? "/desporto/liga/metodologia#o-simulador" : "/desporto/liga/metodologia#the-simulator"}
      methodologyLabel={pt ? "Como funciona o simulador" : "How the simulator works"}
      locale={pt ? "pt" : "en"}
    >
      <p className="text-lg sm:text-xl font-bold text-stone-900 mb-1">{t.hero}</p>
      <p className="text-xs text-stone-600 mb-4 max-w-3xl leading-relaxed">
        {t.ptsTieLabel}: <span className="tabular-nums">{formatPercent(shareTie, locale)}</span>{t.tieNote} · {t.marginNote}
      </p>

      {/* Diverging histogram of the points gap: the first club ahead on the
          left, under its selector, the tie in the middle, the second club
          ahead on the right (audit UXD3-01). */}
      <div>
        <div className="flex items-end gap-1 h-32" role="img" aria-label={summary}>
          {shownBins.map((b) => (
            <div key={`${b.lo}`} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="w-full max-w-[56px] mx-auto rounded-t-[4px]"
                style={{
                  height: `${Math.max(b.count > 0 ? 3 : 0, (100 * b.count) / maxCount)}%`,
                  backgroundColor: b.side === "a" ? colorA : b.side === "b" ? colorB : TIE_COLOR,
                }}
              />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="flex gap-1 border-t border-stone-300 pt-1">
          {shownBins.map((b) => (
            <span key={`${b.lo}`} className="flex-1 text-center text-[11px] leading-tight text-stone-600 tabular-nums">
              {b.side === "tie" ? (pt ? "Empate" : "Level") : rangeLabel(b.lo, b.hi)}
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="flex justify-between mt-1 text-[11px] text-stone-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colorA }} />
            {t.ahead(nameA)}
          </span>
          <span className="flex items-center gap-1">
            {t.ahead(nameB)}
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colorB }} />
          </span>
        </div>
        <p aria-hidden="true" className="text-[11px] text-stone-600 mt-2 text-center">{pt ? "Diferença de pontos no fim da época" : "Points gap at the end of the season"}</p>
      </div>

      <ChartTable
        caption={t.axis}
        columns={[pt ? "Diferença" : "Difference", pt ? "Épocas" : "Seasons", pt ? "Parte" : "Share"]}
        rows={shownBins.map(b => [
          binWords(b.lo, b.hi),
          formatInteger(b.count, locale),
          formatPercent(stats.n ? b.count / stats.n : 0, locale),
        ])}
      />
    </DataCard>
  );
}
