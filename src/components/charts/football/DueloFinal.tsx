"use client";

import { useId, useMemo, useState } from "react";
import { teamColorOnPaper, teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { formatInteger, formatPercent, formatShortDate, MINUS } from "@/lib/football-format";
import { duelBins, samplingMargin } from "@/lib/football-scenarios";
import { ChartTable } from "@/components/viz/ChartTable";
import { Link } from "@/i18n/routing";
import { Swords } from "lucide-react";
import type { SeasonSamples } from "./SeasonDraw";

interface DueloFinalProps {
  samples: SeasonSamples;
  locale?: string;
  /** Id for the heading, so the page section can be labelled by it. */
  headingId?: string;
  /** The forecast's timestamp, for the source line. */
  forecastTimestamp?: string | null;
}

const TIE_COLOR = "#8b9a8e";

/** Head-to-head "who finishes ahead?" duel computed over the real sampled
 *  seasons from the Monte Carlo (same samples.json the SeasonDraw uses).
 *  The tie on points has its own bar; the share carries its sampling margin
 *  (300 seasons, about ±5 points, audit MR2-07); the bins are in a table
 *  twin and in the chart's own label (A11Y2-M1); source, date and method sit
 *  in the card's footer (MR2-07, UXD2-05). */
export function DueloFinal({ samples, locale = "pt", headingId, forecastTimestamp }: DueloFinalProps) {
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

  const stats = useMemo(() => {
    const n = samples.samples.length;
    let ahead = 0;
    let ptsTie = 0;
    const diffs: number[] = [];
    for (const s of samples.samples) {
      if (s.pos[iA] < s.pos[iB]) ahead++;
      if (s.pts[iA] === s.pts[iB]) ptsTie++;
      diffs.push(s.pts[iA] - s.pts[iB]);
    }
    return { n, ahead, ptsTie, bins: duelBins(diffs) };
  }, [samples, iA, iB]);

  const nameA = teamDisplayName(samples.teams[iA]);
  const nameB = teamDisplayName(samples.teams[iB]);
  const colorA = teamColorOnPaper(samples.teams[iA]);
  const colorB = teamColorOnPaper(samples.teams[iB]);
  const shareAhead = stats.n ? stats.ahead / stats.n : 0;
  const shareTie = stats.n ? stats.ptsTie / stats.n : 0;
  const margin = Math.round(samplingMargin(shareAhead, stats.n) * 100);
  const maxCount = Math.max(1, ...stats.bins.map(b => b.count));

  const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `${MINUS}${Math.abs(v)}` : "0");
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
    title: pt ? "Quem acaba à frente?" : "Who finishes ahead?",
    subtitle: pt
      ? `Escolhe duas equipas e vê quem acaba à frente nas ${formatInteger(stats.n, "pt")} épocas completas tiradas das ${formatInteger(samples.n_sims, "pt")} simulações do modelo.`
      : `Pick two teams and see who finishes ahead across ${formatInteger(stats.n, "en")} complete seasons drawn from the model's ${formatInteger(samples.n_sims, "en")} simulations.`,
    hero: pt
      ? `O ${nameA} acaba à frente do ${nameB} em ${formatPercent(shareAhead, "pt")} das épocas sorteadas.`
      : `${nameA} finishes ahead of ${nameB} in ${formatPercent(shareAhead, "en")} of the drawn seasons.`,
    marginNote: pt
      ? `Com ${formatInteger(stats.n, "pt")} épocas, a margem de amostragem é de cerca de ±${margin} pontos percentuais; os números de título ao lado vêm das ${formatInteger(samples.n_sims, "pt")} simulações e têm uma margem muito menor.`
      : `With ${formatInteger(stats.n, "en")} seasons, the sampling margin is about ±${margin} percentage points; the title figures beside them come from all ${formatInteger(samples.n_sims, "en")} simulations and carry a much smaller margin.`,
    axis: pt
      ? `Diferença de pontos no fim da época (${nameA} − ${nameB})`
      : `Points difference at the end of the season (${nameA} − ${nameB})`,
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
    <div className="rounded-2xl border border-line bg-cream p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Swords aria-hidden="true" className="w-5 h-5 text-stone-500" />
        <h2 id={headingId} className="text-xl font-bold text-ink">{t.title}</h2>
      </div>
      <p className="text-sm text-stone-500 mb-4">{t.subtitle}</p>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-5">
        {select(iA, iB, setIA, "a")}
        <span aria-hidden="true" className="hidden sm:flex items-end pb-3 text-lg font-bold text-stone-500">–</span>
        {select(iB, iA, setIB, "b")}
      </div>

      <p className="text-lg sm:text-xl font-bold text-stone-900 mb-1">{t.hero}</p>
      <p className="text-xs text-stone-600 mb-4 max-w-3xl leading-relaxed">
        {t.ptsTieLabel}: <span className="tabular-nums">{formatPercent(shareTie, locale)}</span> · {t.marginNote}
      </p>

      {/* Diverging histogram of pts[A] − pts[B]: B ahead on the left, the
          tie in the middle, A ahead on the right, across the card's width. */}
      <div>
        <div className="flex items-end gap-1 h-32" role="img" aria-label={summary}>
          {stats.bins.map((b) => (
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
          {stats.bins.map((b) => (
            <span key={`${b.lo}`} className="flex-1 text-center text-[11px] leading-tight text-stone-600 tabular-nums">
              {b.side === "tie" ? (pt ? "Empate" : "Level") : rangeLabel(b.lo, b.hi)}
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="flex justify-between mt-1 text-[11px] text-stone-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colorB }} />
            {t.ahead(nameB)}
          </span>
          <span className="flex items-center gap-1">
            {t.ahead(nameA)}
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colorA }} />
          </span>
        </div>
        <p aria-hidden="true" className="text-[11px] text-stone-600 mt-2 text-center">{t.axis}, {pt ? "em pontos" : "in points"}</p>
      </div>

      <ChartTable
        caption={t.axis}
        columns={[pt ? "Diferença" : "Difference", pt ? "Épocas" : "Seasons", pt ? "Parte" : "Share"]}
        rows={stats.bins.map(b => [
          `${binWords(b.lo, b.hi)} (${signed(b.lo)}${b.lo !== b.hi ? `${pt ? " a " : " to "}${signed(b.hi)}` : ""})`,
          formatInteger(b.count, locale),
          formatPercent(stats.n ? b.count / stats.n : 0, locale),
        ])}
      />

      <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-stone-500">
        <span>
          {pt
            ? `Fonte: modelo estimador.pt, ${formatInteger(stats.n, "pt")} épocas sorteadas das ${formatInteger(samples.n_sims, "pt")} simulações`
            : `Source: estimador.pt model, ${formatInteger(stats.n, "en")} seasons drawn from ${formatInteger(samples.n_sims, "en")} simulations`}
        </span>
        {forecastTimestamp && (
          <span>{pt ? `Previsão de ${formatShortDate(forecastTimestamp, "pt")}` : `Forecast of ${formatShortDate(forecastTimestamp, "en")}`}</span>
        )}
        <Link
          href={pt ? "/desporto/liga/metodologia#o-simulador" : "/desporto/liga/metodologia#the-simulator"}
          locale={pt ? "pt" : "en"}
          className="inline-flex min-h-11 items-center font-semibold text-ink underline-offset-4 hover:underline"
        >
          {pt ? "Como funciona o simulador" : "How the simulator works"}
        </Link>
      </footer>
    </div>
  );
}
