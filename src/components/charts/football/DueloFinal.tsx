"use client";

import { useId, useMemo, useState } from "react";
import { teamColorOnPaper, teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { formatInteger } from "@/lib/football-format";
import { Swords } from "lucide-react";
import type { SeasonSamples } from "./SeasonDraw";

interface DueloFinalProps {
  samples: SeasonSamples;
  locale?: string;
  /** Id for the heading, so the page section can be labelled by it. */
  headingId?: string;
}

const HALF_BINS = 4; // 4 bins each side of zero + center bin = 9 bins

/** Head-to-head "who finishes ahead?" duel computed over the real sampled
 *  seasons from the Monte Carlo (same samples.json the SeasonDraw uses). */
export function DueloFinal({ samples, locale = "pt", headingId }: DueloFinalProps) {
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
    const maxAbs = Math.max(1, ...diffs.map((d) => Math.abs(d)));
    const binWidth = Math.max(1, Math.ceil(maxAbs / (HALF_BINS + 0.5)));
    const counts = new Array(2 * HALF_BINS + 1).fill(0) as number[];
    for (const d of diffs) {
      const k = Math.min(HALF_BINS, Math.max(-HALF_BINS, Math.round(d / binWidth)));
      counts[k + HALF_BINS]++;
    }
    return { n, ahead, ptsTie, counts, binWidth };
  }, [samples, iA, iB]);

  const nameA = teamDisplayName(samples.teams[iA]);
  const nameB = teamDisplayName(samples.teams[iB]);
  const colorA = teamColorOnPaper(samples.teams[iA]);
  const colorB = teamColorOnPaper(samples.teams[iB]);
  const pctAhead = Math.round((100 * stats.ahead) / stats.n);
  const pctTie = Math.round((100 * stats.ptsTie) / stats.n);
  const maxCount = Math.max(1, ...stats.counts);

  const t = {
    title: pt ? "Quem acaba à frente?" : "Who finishes ahead?",
    subtitle: pt
      ? `Escolhe duas equipas e vê quem acaba à frente nas ${formatInteger(stats.n, "pt")} épocas completas tiradas das ${formatInteger(samples.n_sims, "pt")} simulações do modelo.`
      : `Pick two teams and see who finishes ahead across ${formatInteger(stats.n, "en")} complete seasons drawn from the model's ${formatInteger(samples.n_sims, "en")} simulations.`,
    hero: pt
      ? `O ${nameA} acaba à frente do ${nameB} em ${pctAhead}% das simulações.`
      : `${nameA} finishes ahead of ${nameB} in ${pctAhead}% of simulations.`,
    axis: pt
      ? "Diferença de pontos no fim da época"
      : "Points difference at the end of the season",
    ahead: (name: string) => (pt ? `${name} à frente` : `${name} ahead`),
    ptsTieLabel: pt ? "Empate em pontos" : "Level on points",
    champion: pt ? "Campeão" : "Champion",
    medianPts: pt ? "Pontos (mediana)" : "Points (median)",
    seasonsLabel: (c: number) => (pt ? `${c} épocas` : `${c} seasons`),
  };

  const chip = (idx: number) => (
    <div className="flex items-center gap-2 text-xs text-stone-600">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: teamColorOnPaper(samples.teams[idx]) }}
      />
      <span>
        {t.champion}: <span className="font-semibold text-stone-900 tabular-nums">{Math.round(samples.p_champion[idx] * 100)}%</span>
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
          <img src={teamLogoSrc(samples.teams[value])} alt="" className="w-5 h-5 object-contain" />
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
      <p className="text-xs text-stone-500 mb-4">
        {t.ptsTieLabel}: <span className="tabular-nums">{pctTie}%</span>
      </p>

      {/* Diverging histogram of pts[A] - pts[B]: B ahead on the left, A ahead on the right */}
      <div className="max-w-md">
        <div className="flex items-end gap-[2px] h-24" role="img" aria-label={t.axis}>
          {stats.counts.map((c, bi) => {
            const k = bi - HALF_BINS;
            const center = k * stats.binWidth;
            return (
              <div
                key={bi}
                className="flex-1 flex flex-col justify-end h-full"
                title={`${center > 0 ? "+" : center < 0 ? "\u2212" : ""}${Math.abs(center)} pts: ${t.seasonsLabel(c)}`}
              >
                <div
                  className="w-full max-w-[24px] mx-auto rounded-t-[4px]"
                  style={{
                    height: `${Math.max(c > 0 ? 3 : 0, (100 * c) / maxCount)}%`,
                    backgroundColor: k > 0 ? colorA : k < 0 ? colorB : "#cbccbb",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-[2px] border-t border-stone-300 pt-1">
          {stats.counts.map((_, bi) => {
            const center = (bi - HALF_BINS) * stats.binWidth;
            return (
              <span key={bi} className="flex-1 text-center text-[11px] text-stone-500 tabular-nums">
                {center > 0 ? `+${center}` : center < 0 ? `\u2212${Math.abs(center)}` : center}
              </span>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[11px] text-stone-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colorB }} />
            {t.ahead(nameB)}
          </span>
          <span className="flex items-center gap-1">
            {t.ahead(nameA)}
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colorA }} />
          </span>
        </div>
        <p className="text-[11px] text-stone-500 mt-2 text-center">{t.axis}</p>
      </div>
    </div>
  );
}
