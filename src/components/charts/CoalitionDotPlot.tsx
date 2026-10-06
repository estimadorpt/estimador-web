"use client";

import * as Plot from "@observablehq/plot";
import { useLocale, useTranslations } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { FURNITURE } from "@/components/viz/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";
import { dotsPerRowToFit, everyKthIndex, stackDots, summariseBlocs, type BlocSimulations, type SeatDraw } from "@/lib/election-aggregates";
import { formatElectionNumber, formatElectionProbability } from "@/lib/election-display";
import { quietPlot } from "@/components/viz/plot-a11y";

interface CoalitionDotPlotProps {
  /** Raw seat draws (MDX use, with inline data). Pages pass `simulations` instead. */
  data?: SeatDraw[];
  /** Bloc totals summarised on the server (see loadParliamentaryArchive). */
  simulations?: BlocSimulations;
  leftCoalitionLabel?: string;
  rightCoalitionLabel?: string;
  projectedSeatsLabel?: string;
  majorityLabel?: string;
  /** "{drawn} of the {total} simulations drawn …", with both placeholders. */
  showingOutcomesLabel?: string;
  /** Name of the table twin; distinct from the party chart's, so two regions on one page never share a name. */
  tableCaption?: string;
}

const BLOC_COLOURS: Record<string, string> = { left: "#5eb184", right: "#c49536" };
const PHONE_TARGET = 200;

const SEAT_DOMAIN: [number, number] = [40, 140];
const FACET_PADDING = 0.16;

/**
 * Seat totals of the two blocs across the simulations as a dot histogram: one
 * dot per drawn simulation in its exact seat count's column (nothing is
 * jittered), from a fixed, evenly spaced subsample, so the picture is the same
 * on every load. The dots per row are chosen from the tallest column, so each
 * bloc's stack stays inside its own row and never reaches the axis (a dodge
 * let the 100-dot columns run into the next row). Medians, quantiles and
 * majority odds come from every draw.
 */
export function CoalitionDotPlot({
  data,
  simulations: provided,
  leftCoalitionLabel: leftLabelProp,
  rightCoalitionLabel: rightLabelProp,
  projectedSeatsLabel: seatsLabelProp,
  majorityLabel: majorityLabelProp,
  showingOutcomesLabel: showingProp,
  tableCaption,
}: CoalitionDotPlotProps) {
  const t = useTranslations("forecast");
  const locale = useLocale();
  const pt = locale !== "en";
  const labels: Record<string, string> = { left: leftLabelProp ?? t("leftCoalition"), right: rightLabelProp ?? t("rightCoalition") };
  const projectedSeatsLabel = seatsLabelProp ?? t("projectedSeats");
  const majorityLabel = majorityLabelProp ?? t("majorityThresholdLabel", { seats: majorityThreshold, total: 230 });
  const showingOutcomesLabel = showingProp ?? (t.raw("drawnSimulations") as string);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulations = useMemo(
    () => provided ?? summariseBlocs(data ?? [], [{ key: "left", parties: leftBlocParties }, { key: "right", parties: rightBlocParties }], majorityThreshold),
    [provided, data],
  );
  const [drawnHere, setDrawnHere] = useState(simulations.drawn);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || simulations.total === 0) return;
    const render = () => {
      const width = container.offsetWidth || 1000;
      const phone = width < 640;
      const keep = everyKthIndex(simulations.drawn, phone ? PHONE_TARGET : simulations.drawn);
      setDrawnHere(keep.length);
      const blocNames = simulations.blocs.map(b => labels[b.key] ?? b.key);
      const height = phone ? 360 : 420;
      const margin = { top: 28, right: phone ? 12 : 40, bottom: 44, left: phone ? 12 : 24 };
      // Plot's band scale with equal inner and outer padding.
      const facetHeight = ((height - margin.top - margin.bottom) / (blocNames.length + FACET_PADDING)) * (1 - FACET_PADDING);
      const unitPx = (width - margin.left - margin.right) / (SEAT_DOMAIN[1] - SEAT_DOMAIN[0]);
      const samples = simulations.blocs.map(b => keep.map(i => b.sample[i]));
      const tallest = Math.max(1, ...samples.map(values => Math.max(0, ...Array.from(values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<number, number>()).values()))));
      const perRow = dotsPerRowToFit(tallest, unitPx, facetHeight - 6);
      const pitch = unitPx / perRow;
      const r = Math.max(0.8, Math.min(phone ? 2.2 : 2.4, pitch * 0.42));
      const points = simulations.blocs.flatMap((b, k) => stackDots(samples[k], perRow).dots.map(dot => ({
        bloc: labels[b.key] ?? b.key,
        seats: dot.value,
        x: dot.value + ((dot.col + 0.5) / perRow - 0.5) * 0.92,
        y: dot.row + 0.5,
      })));
      const medians = simulations.blocs.map(b => ({ bloc: labels[b.key] ?? b.key, median: b.summary.median }));
      const plot = Plot.plot({
        width,
        height,
        marginLeft: margin.left,
        marginRight: margin.right,
        marginTop: margin.top,
        marginBottom: margin.bottom,
        style: { backgroundColor: "transparent", fontSize: "12px", fontFamily: FURNITURE.font, color: FURNITURE.textMuted },
        x: { label: projectedSeatsLabel, domain: SEAT_DOMAIN, grid: true, ticks: phone ? [50, 75, 100, majorityThreshold] : [50, 75, 100, majorityThreshold, 125] },
        // Rows counted up from each facet's baseline, on the same pitch as the columns.
        y: { domain: [0, facetHeight / pitch], axis: null },
        // Bloc names sit above each row, so they never take width from the plot on a phone.
        fy: { domain: blocNames, label: null, axis: null, padding: FACET_PADDING },
        color: { domain: blocNames, range: simulations.blocs.map(b => BLOC_COLOURS[b.key] ?? FURNITURE.axis) },
        marks: [
          Plot.ruleX([majorityThreshold], { stroke: FURNITURE.text, strokeWidth: 1.5, strokeDasharray: "4,3", facet: "exclude" }),
          Plot.dot(points, {
            x: "x",
            y: "y",
            fy: "bloc",
            fill: "bloc",
            fillOpacity: 0.8,
            r,
            title: (d: { bloc: string; seats: number }) => `${d.bloc}: ${d.seats} ${pt ? "mandatos" : "seats"}`,
            tip: true,
          }),
          Plot.ruleX(medians, { x: "median", fy: "bloc", stroke: FURNITURE.text, strokeWidth: 2 }),
          Plot.text(medians, {
            x: "median",
            fy: "bloc",
            text: (d: { median: number }) => String(d.median),
            frameAnchor: "top",
            dy: -16,
            dx: 6,
            textAnchor: "start",
            fontSize: 12,
            fontWeight: 700,
            fill: FURNITURE.text,
          }),
          Plot.text(blocNames.map(bloc => ({ bloc })), {
            fy: "bloc",
            text: "bloc",
            frameAnchor: "top-left",
            dy: -16,
            fontSize: 12,
            fontWeight: 700,
            fill: FURNITURE.text,
          }),
        ],
      });
      // The table twin below is the accessible version; Plot labels role-less <g>s (A11Y-12).
      container.replaceChildren(quietPlot(plot));
    };
    render();
    const observer = new ResizeObserver(() => render());
    observer.observe(container);
    return () => observer.disconnect();
  }, [simulations, labels.left, labels.right, projectedSeatsLabel, majorityLabel, pt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (simulations.total === 0) {
    return <p className="py-8 text-center text-stone-500">{t("noSimulations")}</p>;
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="min-h-[280px]" />
      <p className="mt-2 flex items-center gap-2 text-xs text-ink">
        <span aria-hidden="true" className="inline-block w-5 border-t-2 border-dashed border-ink" />
        {majorityLabel}
      </p>
      <p className="text-xs text-stone-500 mt-1">
        {showingOutcomesLabel
          .replaceAll("{drawn}", formatElectionNumber(drawnHere, locale))
          .replaceAll("{total}", formatElectionNumber(simulations.total, locale))
          .replaceAll("{count}", formatElectionNumber(simulations.total, locale))}
      </p>
      <ChartTable
        caption={tableCaption ?? `${projectedSeatsLabel} · ${pt ? "por bloco" : "by bloc"}`}
        columns={[pt ? "Bloco" : "Bloc", "P5", "P25", pt ? "Mediana" : "Median", "P75", "P95", pt ? "Prob. de maioria" : "Majority odds"]}
        rows={simulations.blocs.map(b => [labels[b.key] ?? b.key, b.summary.p5, b.summary.p25, b.summary.median, b.summary.p75, b.summary.p95, formatElectionProbability(b.majority, locale)])}
      />
    </div>
  );
}
