"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { partyColors } from "@/lib/config/colors";

interface TrendData {
  date: string;
  party: string;
  metric: string;
  value: number;
}

interface PollingChartProps {
  data: TrendData[];
  voteShareLabel?: string;
}

const MOBILE_BREAKPOINT = 640;

export function PollingChart({ data, voteShareLabel: voteShareLabelProp }: PollingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("forecast");
  const voteShareLabel = voteShareLabelProp ?? t("voteShareLabel");
  const locale = useLocale();
  const fmtPct = (v: number) => `${(v * 100).toLocaleString(locale === "en" ? "en-GB" : "pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  // The table twin: every estimate in the chart's window, with its band.
  const table = useMemo(() => {
    const all = (data ?? []).filter(d => d.metric === "vote_share_mean" || d.metric === "vote_share_low" || d.metric === "vote_share_high");
    if (all.length === 0) return { columns: [], rows: [] };
    const cutoff = new Date(Math.max(...all.map(d => new Date(d.date).getTime())));
    cutoff.setFullYear(cutoff.getFullYear() - 2);
    const byDate = new Map<string, Map<string, { mean?: number; low?: number; high?: number }>>();
    for (const d of all) {
      if (new Date(d.date) < cutoff) continue;
      const m = byDate.get(d.date) ?? new Map<string, { mean?: number; low?: number; high?: number }>();
      const rec = m.get(d.party) ?? {};
      rec[d.metric.replace("vote_share_", "") as "mean" | "low" | "high"] = d.value;
      m.set(d.party, rec); byDate.set(d.date, m);
    }
    const dates = Array.from(byDate.keys()).sort();
    const lastDay = byDate.get(dates[dates.length - 1]);
    const parties = Array.from(new Set(all.map(d => d.party))).sort((a, b) => (lastDay?.get(b)?.mean ?? 0) - (lastDay?.get(a)?.mean ?? 0));
    const pct = (v?: number) => v == null ? "" : fmtPct(v);
    return {
      columns: [locale === "en" ? "Date" : "Data", ...parties],
      rows: dates.map(dt => [new Date(dt).toLocaleDateString(locale === "en" ? "en-GB" : "pt-PT", { day: "numeric", month: "short", year: "numeric" }), ...parties.map(p => { const r = byDate.get(dt)?.get(p); if (!r || r.mean == null) return ""; return r.low != null && r.high != null ? `${pct(r.mean)} (${pct(r.low)}–${pct(r.high)})` : pct(r.mean); })]),
    };
  }, [data, locale]);
  const [latestValues, setLatestValues] = useState<Array<{ party: string; value: number }>>([])

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Get actual container width for truly responsive sizing
    const containerWidth = containerRef.current.offsetWidth || 900;
    const mobile = containerWidth < MOBILE_BREAKPOINT;

    // Responsive dimensions
    const containerHeight = mobile ? 320 : 450;
    const marginLeft = mobile ? 45 : 60;
    const marginRight = mobile ? 16 : 120; // Minimal margin on mobile (no inline labels)
    const marginBottom = mobile ? 40 : 50;
    const fontSize = mobile ? "11px" : "12px";
    const xTicks = mobile ? 3 : 4;

    // Filter for vote share data only
    const voteShareData = data.filter(d => d.metric === 'vote_share_mean');

    // Filter to recent time period - show all parties
    // The two years up to the last estimate, so the window is stable for an archive.
    const cutoffDate = new Date(Math.max(...voteShareData.map(d => new Date(d.date).getTime())));
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

    const filteredData = voteShareData.filter(d => new Date(d.date) >= cutoffDate);

    // Get latest values for all parties
    const latestData = filteredData
      .filter(d => {
        const maxDate = new Date(Math.max(...filteredData.map(dd => new Date(dd.date).getTime())));
        return new Date(d.date).getTime() === maxDate.getTime();
      })
      .sort((a, b) => b.value - a.value);

    // Store latest values for legend
    setLatestValues(latestData.map(d => ({ party: d.party, value: d.value })));

    // Build marks array - conditionally include labels for desktop only
    const marks: Plot.Markish[] = [
      // Background grid
      Plot.gridY({ stroke: "#f5f4ed", strokeWidth: 1 }),
      Plot.gridX({ stroke: "#f5f4ed", strokeWidth: 1 }),
      Plot.tip(filteredData, Plot.pointer({
        x: (d: TrendData) => new Date(d.date),
        y: "value",
        title: (d: TrendData) => `${d.party} ${fmtPct(d.value)} · ${new Date(d.date).toLocaleDateString(locale === "en" ? "en-GB" : "pt-PT", { day: "numeric", month: "short", year: "numeric" })}`,
      })),

      // Lines for each party
      Plot.line(filteredData, {
        x: d => new Date(d.date),
        y: "value",
        stroke: "party",
        strokeWidth: mobile ? 2 : 2.5,
        curve: "catmull-rom"
      }),

      // Points for latest values
      Plot.dot(latestData, {
        x: d => new Date(d.date),
        y: "value",
        fill: "party",
        r: mobile ? 3 : 4,
        stroke: "white",
        strokeWidth: mobile ? 1.5 : 2
      })
    ];

    // Only add inline labels on desktop
    if (!mobile) {
      marks.push(
        // Major parties - label at line end
        Plot.text(latestData.filter(d => d.value > 0.1), {
          x: d => new Date(d.date),
          y: "value",
          text: d => `${d.party} ${fmtPct(d.value)}`,
          fill: "party",
          dx: 8,
          fontSize: 11,
          fontWeight: "600",
          textAnchor: "start"
        }),

        // Minor parties - sorted bottom to top to match visual order
        Plot.text(latestData.filter(d => d.value <= 0.1).sort((a, b) => a.value - b.value), Plot.dodgeY({
          x: d => new Date(d.date),
          y: "value",
          text: d => `${d.party} ${fmtPct(d.value)}`,
          fill: "party",
          dx: 8,
          dy: -3,
          fontSize: 11,
          fontWeight: "500",
          textAnchor: "start",
          padding: 4
        }))
      );
    }

    const plot = Plot.plot({
      width: containerWidth,
      height: containerHeight,
      marginLeft,
      marginRight,
      marginTop: 20,
      marginBottom,
      style: {
        backgroundColor: "transparent",
        fontSize,
        fontFamily: "Manrope, system-ui, sans-serif"
      },
      x: {
        type: "time",
        label: null,
        tickFormat: mobile ? "%b '%y" : "%b %Y",
        grid: true,
        ticks: xTicks
      },
      y: {
        label: mobile ? null : voteShareLabel,
        domain: [0, 0.5],
        tickFormat: d => `${(d * 100).toFixed(0)}%`,
        grid: true
      },
      color: {
        type: "categorical",
        domain: Object.keys(partyColors),
        range: Object.values(partyColors)
      },
      marks
    });

    if (containerRef.current) {
      containerRef.current.replaceChildren(plot);
    }

    return () => plot.remove();
  }, [data, voteShareLabel, locale]);

  // Add resize observer for responsive behavior
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Re-render chart when container size changes
      if (containerRef.current && data && data.length > 0) {
        // Small delay to ensure container has final dimensions
        setTimeout(() => {
          if (!containerRef.current) return;

          const containerWidth = containerRef.current.offsetWidth || 900;
          const mobile = containerWidth < MOBILE_BREAKPOINT;

          // Responsive dimensions
          const containerHeight = mobile ? 320 : 450;
          const marginLeft = mobile ? 45 : 60;
          const marginRight = mobile ? 16 : 120;
          const marginBottom = mobile ? 40 : 50;
          const fontSize = mobile ? "11px" : "12px";
          const xTicks = mobile ? 3 : 4;

          // Filter for vote share data only
          const voteShareData = data.filter(d => d.metric === 'vote_share_mean');

          // Filter to recent time period - show all parties
          const cutoffDate = new Date(Math.max(...voteShareData.map(d => new Date(d.date).getTime())));
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

          const filteredData = voteShareData.filter(d => new Date(d.date) >= cutoffDate);

          // Get latest values for all parties
          const latestData = filteredData
            .filter(d => {
              const maxDate = new Date(Math.max(...filteredData.map(dd => new Date(dd.date).getTime())));
              return new Date(d.date).getTime() === maxDate.getTime();
            })
            .sort((a, b) => b.value - a.value);

          // Update latest values for legend
          setLatestValues(latestData.map(d => ({ party: d.party, value: d.value })));

          // Build marks array
          const marks: Plot.Markish[] = [
            Plot.gridY({ stroke: "#f5f4ed", strokeWidth: 1 }),
            Plot.gridX({ stroke: "#f5f4ed", strokeWidth: 1 }),
            Plot.tip(filteredData, Plot.pointer({
              x: (d: TrendData) => new Date(d.date),
              y: "value",
              title: (d: TrendData) => `${d.party} ${fmtPct(d.value)} · ${new Date(d.date).toLocaleDateString(locale === "en" ? "en-GB" : "pt-PT", { day: "numeric", month: "short", year: "numeric" })}`,
            })),

            Plot.line(filteredData, {
              x: d => new Date(d.date),
              y: "value",
              stroke: "party",
              strokeWidth: mobile ? 2 : 2.5,
              curve: "catmull-rom"
            }),

            Plot.dot(latestData, {
              x: d => new Date(d.date),
              y: "value",
              fill: "party",
              r: mobile ? 3 : 4,
              stroke: "white",
              strokeWidth: mobile ? 1.5 : 2
            })
          ];

          // Only add inline labels on desktop
          if (!mobile) {
            marks.push(
              Plot.text(latestData.filter(d => d.value > 0.1), {
                x: d => new Date(d.date),
                y: "value",
                text: d => `${d.party} ${fmtPct(d.value)}`,
                fill: "party",
                dx: 8,
                fontSize: 11,
                fontWeight: "600",
                textAnchor: "start"
              }),

              Plot.text(latestData.filter(d => d.value <= 0.1).sort((a, b) => a.value - b.value), Plot.dodgeY({
                x: d => new Date(d.date),
                y: "value",
                text: d => `${d.party} ${fmtPct(d.value)}`,
                fill: "party",
                dx: 8,
                dy: -3,
                fontSize: 11,
                fontWeight: "500",
                textAnchor: "start",
                padding: 4
              }))
            );
          }

          const plot = Plot.plot({
            width: containerWidth,
            height: containerHeight,
            marginLeft,
            marginRight,
            marginTop: 20,
            marginBottom,
            style: {
              backgroundColor: "transparent",
              fontSize,
              fontFamily: "Manrope, system-ui, sans-serif"
            },
            x: {
              type: "time",
              label: null,
              tickFormat: mobile ? "%b '%y" : "%b %Y",
              grid: true,
              ticks: xTicks
            },
            y: {
              label: mobile ? null : voteShareLabel,
              domain: [0, 0.5],
              tickFormat: d => `${(d * 100).toFixed(0)}%`,
              grid: true
            },
            color: {
              type: "categorical",
              domain: Object.keys(partyColors),
              range: Object.values(partyColors)
            },
            marks
          });

          containerRef.current.replaceChildren(plot);
        }, 100);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [data, voteShareLabel, locale]);

  return (
    <div className="w-full">
      <div ref={containerRef} />
      {/* Legend: always present, and the only labels on small screens */}
      {latestValues.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 justify-center px-2">
          {latestValues.map(({ party, value }) => (
            <div key={party} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: partyColors[party as keyof typeof partyColors] || '#888' }}
              />
              <span className="font-medium">{party}</span>
              <span className="text-stone-600">{fmtPct(value)}</span>
            </div>
          ))}
        </div>
      )}
      <ChartTable caption={`${voteShareLabel} · ${locale === "en" ? "estimate and band" : "estimativa e banda"}`} columns={table.columns} rows={table.rows} />
    </div>
  );
}
