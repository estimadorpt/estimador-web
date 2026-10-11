"use client";

import { useId, useMemo, useState } from "react";
import { teamColorOnPaper, teamDisplayName, teamWithArticle } from "@/lib/config/football";
import { formatInteger, formatPercent, formatShortDate } from "@/lib/football-format";
import { BRAND } from "@/lib/brand";
import { duelBins, samplingMargin, type ClubFrame } from "@/lib/football-scenarios";
import type { SeasonSamples } from "@/lib/utils/football-data-loader";
import { ChartTable } from "@/components/viz/ChartTable";
import { DataCard } from "@/components/viz/DataCard";

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface DueloFinalProps {
  samples: SeasonSamples;
  /** The club whose page this is: always the first of the two. */
  team: string;
  /** The club the duel opens on (`duelRival`: the closest in the same race). */
  rival: string;
  /** The page's frame: the figure printed under each club. */
  frame: ClubFrame;
  locale?: string;
  /** The forecast's timestamp, for the card's date line. */
  forecastTimestamp?: string | null;
}

/** The tie on points: the scale grey, 3.4:1 on paper, never a club's colour. */
const TIE_COLOR = BRAND.faint;

/**
 * A club's colour for the duel's bars and keys. A club drawn in near-black
 * on paper (Nacional) would make solid black bars and a black square key,
 * the reading rule's mark for what has already happened: it gets graphite.
 */
function duelColor(team: string): string {
  const hex = teamColorOnPaper(team);
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 48 ? BRAND.muted : hex;
}

/**
 * The final duel, on a club's page: which of two clubs finishes the season
 * with more points, counted over the complete seasons samples.json draws
 * from the simulations. The page's club is fixed; the other is a select that
 * acts on change, opening on the closest club in the same race. The tie on
 * points has its own bar (audit PUB2-09); the sampling margin is said in one
 * plain sentence (review, October 2026: "no desempate do modelo… margem de
 * amostragem ±5" read as written for journalists); the bins are in a table
 * twin and in the chart's own label (A11Y2-M1).
 */
export function DueloFinal({ samples, team, rival, frame, locale = "pt", forecastTimestamp }: DueloFinalProps) {
  const pt = locale !== "en";
  const selectId = useId();
  const iA = Math.max(0, samples.teams.indexOf(team));
  const [iB, setIB] = useState<number>(() => {
    const i = samples.teams.indexOf(rival);
    return i >= 0 && i !== iA ? i : samples.teams.findIndex((_, j) => j !== iA);
  });

  const teamOptions = useMemo(
    () =>
      samples.teams
        .map((name, i) => ({ name, i }))
        .filter(o => o.i !== iA)
        .sort((a, b) => teamDisplayName(a.name).localeCompare(teamDisplayName(b.name), "pt")),
    [samples.teams, iA],
  );

  // One basis, the chart's: points at the end of the season (audit FA3-02).
  const stats = useMemo(() => {
    const n = samples.samples.length;
    let aheadA = 0;
    let aheadB = 0;
    let ptsTie = 0;
    const diffs: number[] = [];
    for (const s of samples.samples) {
      if (s.pts[iA] > s.pts[iB]) aheadA++;
      else if (s.pts[iA] < s.pts[iB]) aheadB++;
      else ptsTie++;
      diffs.push(s.pts[iA] - s.pts[iB]);
    }
    return { n, aheadA, aheadB, ptsTie, bins: duelBins(diffs) };
  }, [samples, iA, iB]);

  const nameA = teamDisplayName(samples.teams[iA]);
  const nameB = teamDisplayName(samples.teams[iB]);
  const colorA = duelColor(samples.teams[iA]);
  const colorB = duelColor(samples.teams[iB]);
  const shareA = stats.n ? stats.aheadA / stats.n : 0;
  const shareB = stats.n ? stats.aheadB / stats.n : 0;
  const shareTie = stats.n ? stats.ptsTie / stats.n : 0;
  const margin = Math.max(1, Math.round(samplingMargin(Math.max(shareA, shareB), stats.n) * 100));
  const maxCount = Math.max(1, ...stats.bins.map(b => b.count));
  // The page's club on the left, as its name is first (audit UXD3-01).
  const shownBins = [...stats.bins].reverse();

  // The frame's figure from every simulation, printed under each club.
  const frameValue = (i: number) =>
    frame === "title"
      ? samples.p_champion[i]
      : (samples.position_probs[i]?.[16] ?? 0) + (samples.position_probs[i]?.[17] ?? 0);
  const frameLabel = frame === "title" ? (pt ? "Título" : "Title") : (pt ? "Despromoção" : "Relegation");

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

  const hero = pt
    ? `${capitalise(teamWithArticle(samples.teams[iA], "o"))} acaba com mais pontos do que ${teamWithArticle(samples.teams[iB], "o")} em ${formatPercent(shareA, "pt")} das épocas; ${teamWithArticle(samples.teams[iB], "o")}, em ${formatPercent(shareB, "pt")}; empatam em pontos em ${formatPercent(shareTie, "pt")}.`
    : `${nameA} finish with more points than ${nameB} in ${formatPercent(shareA, "en")} of the seasons; ${nameB}, in ${formatPercent(shareB, "en")}; they finish level on points in ${formatPercent(shareTie, "en")}.`;
  // The margin in one plain sentence.
  const marginNote = pt
    ? `Contámos ${formatInteger(stats.n, "pt")} épocas completas tiradas à sorte das ${formatInteger(samples.n_sims, "pt")} simulações, por isso cada uma destas percentagens pode estar uns ${margin} pontos percentuais acima ou abaixo.`
    : `We counted ${formatInteger(stats.n, "en")} complete seasons drawn at random from the ${formatInteger(samples.n_sims, "en")} simulations, so each of these percentages can be about ${margin} percentage points higher or lower.`;
  const axis = pt
    ? `Diferença de pontos no fim da época: ${nameA} e ${nameB}`
    : `Points gap at the end of the season: ${nameA} and ${nameB}`;
  const summary = `${hero} ${pt ? "Os valores de cada barra estão na tabela abaixo." : "Each bar's value is in the table below."}`;

  const figure = (idx: number) => (
    <span className="text-xs text-stone-600">
      {frameLabel}: <span className="font-semibold tabular-nums text-ink">{formatPercent(frameValue(idx), locale)}</span>
      <span aria-hidden="true" className="text-stone-500"> · </span>
      {pt ? "Pontos (mediana)" : "Points (median)"}: <span className="font-semibold tabular-nums text-ink">{Math.round(samples.points_q50[idx])}</span>
    </span>
  );

  return (
    <DataCard
      title={axis}
      subtitle={pt
        ? `Quem acaba com mais pontos, ${teamWithArticle(samples.teams[iA], "o")} ou outro clube à tua escolha.`
        : `Who finishes with more points, ${nameA} or another club of your choice.`}
      controls={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex min-h-11 items-center gap-2 text-base font-semibold text-ink">
              <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ backgroundColor: colorA }} />
              {nameA}
            </p>
            {figure(iA)}
          </div>
          <span aria-hidden="true" className="hidden pb-6 text-lg font-bold text-stone-500 sm:block">–</span>
          <div className="min-w-0 flex-1">
            <label htmlFor={selectId} className="mb-1 block text-xs font-semibold text-stone-600">
              {pt ? "Contra" : "Against"}
            </label>
            <div className="mb-1 flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ backgroundColor: colorB }} />
              <select
                id={selectId}
                value={iB}
                onChange={(e) => setIB(Number(e.target.value))}
                className="min-h-11 w-full border border-ink bg-paper px-2 text-base font-medium text-ink sm:text-sm"
              >
                {teamOptions.map((o) => (
                  <option key={o.i} value={o.i}>{teamDisplayName(o.name)}</option>
                ))}
              </select>
            </div>
            {figure(iB)}
          </div>
        </div>
      }
      source={pt
        ? `Fonte: modelo estimador.pt, ${formatInteger(stats.n, "pt")} épocas tiradas das ${formatInteger(samples.n_sims, "pt")} simulações`
        : `Source: estimador.pt model, ${formatInteger(stats.n, "en")} seasons drawn from ${formatInteger(samples.n_sims, "en")} simulations`}
      updated={forecastTimestamp
        ? pt ? `Previsão de ${formatShortDate(forecastTimestamp, "pt")}` : `Forecast of ${formatShortDate(forecastTimestamp, "en")}`
        : undefined}
      methodologyHref="/desporto/liga/metodologia"
      methodologyLabel={pt ? "Como funciona o modelo" : "How the model works"}
      locale={pt ? "pt" : "en"}
    >
      {/* A readout beside the control that changed it, in a live region. */}
      <div aria-live="polite">
        <p className="mb-1 text-lg font-bold text-stone-900 sm:text-xl">{hero}</p>
      </div>
      <p className="mb-4 max-w-3xl text-xs leading-relaxed text-stone-600">{marginNote}</p>

      {/* Diverging histogram of the points gap: the page's club ahead on the
          left, the tie in the middle, the other club ahead on the right. */}
      <div>
        <div className="flex h-32 items-end gap-1" role="img" aria-label={summary}>
          {shownBins.map((b) => (
            <div key={`${b.lo}`} className="flex h-full flex-1 flex-col justify-end">
              <div
                className="mx-auto w-full max-w-[56px]"
                style={{
                  height: `${Math.max(b.count > 0 ? 3 : 0, (100 * b.count) / maxCount)}%`,
                  backgroundColor: b.side === "a" ? colorA : b.side === "b" ? colorB : TIE_COLOR,
                }}
              />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="flex gap-1 border-t border-ink pt-1">
          {shownBins.map((b) => (
            <span key={`${b.lo}`} className="flex-1 text-center text-[11px] leading-tight tabular-nums text-stone-600">
              {b.side === "tie" ? (pt ? "Empate" : "Level") : rangeLabel(b.lo, b.hi)}
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="mt-1 flex justify-between text-[11px] text-stone-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2" style={{ backgroundColor: colorA }} />
            {pt ? `${nameA} à frente` : `${nameA} ahead`}
          </span>
          <span className="flex items-center gap-1">
            {pt ? `${nameB} à frente` : `${nameB} ahead`}
            <span className="inline-block h-2 w-2" style={{ backgroundColor: colorB }} />
          </span>
        </div>
        <p aria-hidden="true" className="mt-2 text-center text-[11px] text-stone-600">{pt ? "Diferença de pontos no fim da época" : "Points gap at the end of the season"}</p>
      </div>

      <ChartTable
        caption={axis}
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
