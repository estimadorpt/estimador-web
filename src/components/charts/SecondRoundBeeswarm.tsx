"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { FURNITURE } from "@/components/viz/theme";
import { formatElectionNumber, formatElectionPercent, formatElectionProbability } from "@/lib/election-display";
import { everyKthIndex, type RunoffSimulations } from "@/lib/election-aggregates";

interface SecondRoundBeeswarmProps {
  simulations: RunoffSimulations;
  translations: {
    /** Axis title: share of the valid vote on election day. */
    axisLabel: string;
    fiftyPercentLine: string;
    /** "{drawn} of the {total} simulations drawn …", with both placeholders. */
    drawnCaption: string;
    tableCaption: string;
    candidate: string;
    median: string;
    winShare: string;
    tipSuffix: string;
  };
}

/** Phones draw every fourth of the server's sample, so the dots stay legible in a narrow facet. */
const PHONE_STRIDE_TARGET = 200;

/**
 * Election-day shares of the valid vote across the runoff simulations, one dot
 * per drawn simulation. The dots sit at their exact value (dodgeY separates
 * them vertically; nothing is jittered along x) and come from a fixed, evenly
 * spaced subsample chosen on the server, so the picture is the same on every
 * load. Medians, the table and the majority share come from every simulation.
 */
export function SecondRoundBeeswarm({ simulations, translations }: SecondRoundBeeswarmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const [drawnHere, setDrawnHere] = useState(simulations.drawn);
  const pct = (v: number) => formatElectionPercent(v, locale);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const render = () => {
      const width = container.offsetWidth || 800;
      const phone = width < 640;
      const keep = phone ? everyKthIndex(simulations.drawn, PHONE_STRIDE_TARGET) : everyKthIndex(simulations.drawn, simulations.drawn);
      setDrawnHere(keep.length);
      const names = simulations.candidates.map(c => c.name);
      const points = simulations.candidates.flatMap(c => keep.map(i => ({ candidate: c.name, share: c.sample[i] })));
      const medians = simulations.candidates.map(c => ({ candidate: c.name, median: c.summary.median }));
      const plot = Plot.plot({
        width,
        height: phone ? 480 : 480,
        marginLeft: phone ? 12 : 24,
        marginRight: phone ? 12 : 40,
        marginTop: 28,
        marginBottom: 44,
        style: { backgroundColor: "transparent", fontSize: "12px", fontFamily: FURNITURE.font, color: FURNITURE.textMuted },
        x: {
          label: translations.axisLabel,
          domain: [0.15, 0.85],
          ticks: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
          tickFormat: (d: number) => formatElectionPercent(d, locale, 0),
          grid: true,
        },
        // Candidate names sit above each row (below), so long names are never clipped on a phone.
        fy: { domain: names, label: null, axis: null, padding: 0.16 },
        color: { domain: names, range: simulations.candidates.map(c => c.color) },
        marks: [
          Plot.ruleX([0.5], { stroke: FURNITURE.text, strokeWidth: 1.5, strokeDasharray: "4,3", facet: "exclude" }),
          Plot.dotX(points, Plot.dodgeY({
            x: "share",
            fy: "candidate",
            fill: "candidate",
            fillOpacity: 0.7,
            r: phone ? 2 : 1.4,
            anchor: "middle",
            title: (d: { candidate: string; share: number }) => `${d.candidate}: ${pct(d.share)} ${translations.tipSuffix}`,
            tip: true,
          })),
          Plot.ruleX(medians, { x: "median", fy: "candidate", stroke: FURNITURE.text, strokeWidth: 2 }),
          Plot.text(medians, {
            x: "median",
            fy: "candidate",
            // Named: the cards above show the mean, this line the median.
            text: (d: { median: number }) => `${translations.median.toLocaleLowerCase(locale)} ${pct(d.median)}`,
            frameAnchor: "top",
            dy: -16,
            dx: 6,
            textAnchor: "start",
            fontSize: 12,
            fontWeight: 700,
            fill: FURNITURE.text,
          }),
          Plot.text(names.map(name => ({ candidate: name })), {
            fy: "candidate",
            text: "candidate",
            frameAnchor: "top-left",
            dy: -16,
            fontSize: 12,
            fontWeight: 700,
            fill: FURNITURE.text,
          }),
        ],
      });
      // The table twin below is the accessible version; Plot labels role-less <g>s (A11Y-12).
      plot.setAttribute("aria-hidden", "true");
      container.replaceChildren(plot);
    };
    render();
    const observer = new ResizeObserver(() => render());
    observer.observe(container);
    return () => observer.disconnect();
  }, [simulations, translations, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full" data-testid="beeswarm">
      <div ref={containerRef} className="min-h-[260px]" />
      <p className="mt-2 flex items-center gap-2 text-xs text-ink">
        <span aria-hidden="true" className="inline-block w-5 border-t-2 border-dashed border-ink" />
        {translations.fiftyPercentLine}
      </p>
      <p className="text-xs text-stone-500 mt-1">
        {translations.drawnCaption
          .replaceAll('{drawn}', formatElectionNumber(drawnHere, locale))
          .replaceAll('{total}', formatElectionNumber(simulations.total, locale))}
      </p>
      <ChartTable
        caption={translations.tableCaption}
        columns={[translations.candidate, 'P5', 'P25', translations.median, 'P75', 'P95', translations.winShare]}
        rows={simulations.candidates.map(c => [c.name, pct(c.summary.p5), pct(c.summary.p25), pct(c.summary.median), pct(c.summary.p75), pct(c.summary.p95), formatElectionProbability(c.winShare, locale)])}
      />
    </div>
  );
}
