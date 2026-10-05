"use client";

import * as Plot from "@observablehq/plot";
import { useLocale, useTranslations } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { FURNITURE } from "@/components/viz/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";
import { everyKthIndex, summariseBlocs, type BlocSimulations, type SeatDraw } from "@/lib/election-aggregates";
import { formatElectionNumber, formatElectionProbability } from "@/lib/election-display";

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
}

const BLOC_COLOURS: Record<string, string> = { left: "#5eb184", right: "#c49536" };
const PHONE_TARGET = 200;

/**
 * Seat totals of the two blocs across the simulations: one dot per drawn
 * simulation at its exact seat count (dodgeY stacks equal counts; nothing is
 * jittered), from a fixed, evenly spaced subsample, so the picture is the same
 * on every load. Medians, quantiles and majority odds come from every draw.
 */
export function CoalitionDotPlot({
  data,
  simulations: provided,
  leftCoalitionLabel: leftLabelProp,
  rightCoalitionLabel: rightLabelProp,
  projectedSeatsLabel: seatsLabelProp,
  majorityLabel: majorityLabelProp,
  showingOutcomesLabel: showingProp,
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
      const points = simulations.blocs.flatMap(b => keep.map(i => ({ bloc: labels[b.key] ?? b.key, seats: b.sample[i] })));
      const medians = simulations.blocs.map(b => ({ bloc: labels[b.key] ?? b.key, median: b.summary.median }));
      const plot = Plot.plot({
        width,
        height: phone ? 520 : 400,
        marginLeft: phone ? 12 : 24,
        marginRight: phone ? 12 : 40,
        marginTop: 28,
        marginBottom: 44,
        style: { backgroundColor: "transparent", fontSize: "12px", fontFamily: FURNITURE.font, color: FURNITURE.textMuted },
        x: { label: projectedSeatsLabel, domain: [40, 140], grid: true, ticks: phone ? [50, 75, 100, majorityThreshold] : [50, 75, 100, majorityThreshold, 125] },
        // Bloc names sit above each row, so they never take width from the plot on a phone.
        fy: { domain: blocNames, label: null, axis: null, padding: 0.16 },
        color: { domain: blocNames, range: simulations.blocs.map(b => BLOC_COLOURS[b.key] ?? FURNITURE.axis) },
        marks: [
          Plot.ruleX([majorityThreshold], { stroke: FURNITURE.text, strokeWidth: 1.5, strokeDasharray: "4,3", facet: "exclude" }),
          Plot.dotX(points, Plot.dodgeY({
            x: "seats",
            fy: "bloc",
            fill: "bloc",
            fillOpacity: 0.75,
            r: phone ? 1.8 : 1.5,
            anchor: "middle",
            title: (d: { bloc: string; seats: number }) => `${d.bloc}: ${d.seats} ${pt ? "mandatos" : "seats"}`,
            tip: true,
          })),
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
      container.replaceChildren(plot);
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
        caption={projectedSeatsLabel}
        columns={[pt ? "Bloco" : "Bloc", "P5", "P25", pt ? "Mediana" : "Median", "P75", "P95", pt ? "Prob. de maioria" : "Majority odds"]}
        rows={simulations.blocs.map(b => [labels[b.key] ?? b.key, b.summary.p5, b.summary.p25, b.summary.median, b.summary.p75, b.summary.p95, formatElectionProbability(b.majority, locale)])}
      />
    </div>
  );
}
