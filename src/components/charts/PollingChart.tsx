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

/** Vote-share-mean rows for the last two years before the latest date, so the
 * archived window is stable regardless of when the page is viewed. */
function recentVoteShare(data: TrendData[]): TrendData[] {
  const voteShareData = (data ?? []).filter(d => d.metric === "vote_share_mean");
  if (voteShareData.length === 0) return [];
  const cutoffDate = new Date(Math.max(...voteShareData.map(d => new Date(d.date).getTime())));
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
  return voteShareData.filter(d => new Date(d.date) >= cutoffDate);
}

function latestByParty(filteredData: TrendData[]): TrendData[] {
  if (filteredData.length === 0) return [];
  const maxDate = new Date(Math.max(...filteredData.map(dd => new Date(dd.date).getTime())));
  return filteredData
    .filter(d => new Date(d.date).getTime() === maxDate.getTime())
    .sort((a, b) => b.value - a.value);
}

export function PollingChart({ data, voteShareLabel: voteShareLabelProp }: PollingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("forecast");
  const voteShareLabel = voteShareLabelProp ?? t("voteShareLabel");
  const locale = useLocale();
  const pt = locale !== "en";
  const fmtPct = (v: number) => `${(v * 100).toLocaleString(locale === "en" ? "en-GB" : "pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  // The two parties leading in the latest reading, used as the default
  // "selected" comparison so a first-time visitor sees an intelligible
  // question ("how do the top two compare?") instead of every party's line
  // at once (product-usability-diagnosis-2026-09-17 §7/§9).
  const defaultParties = useMemo(() => {
    const latest = latestByParty(recentVoteShare(data));
    return latest.slice(0, 2).map(d => d.party);
  }, [data]);
  const allParties = useMemo(() => {
    const seen = new Set<string>();
    for (const d of recentVoteShare(data)) seen.add(d.party);
    return Array.from(seen).sort((a, b) => Object.keys(partyColors).indexOf(a) - Object.keys(partyColors).indexOf(b));
  }, [data]);

  const [viewMode, setViewMode] = useState<"selected" | "all">("selected");
  const [selectedParties, setSelectedParties] = useState<string[] | null>(null);
  // Memoized so the render effect's dependency array (below) only sees a new
  // reference when the selection actually changes, not on every re-render.
  const activeParties = useMemo(() => selectedParties ?? defaultParties, [selectedParties, defaultParties]);

  const toggleParty = (party: string) => {
    const current = selectedParties ?? defaultParties;
    const next = current.includes(party)
      ? current.filter(p => p !== party)
      : [...current, party];
    setSelectedParties(next.length > 0 ? next : current);
  };

  // The table twin: every estimate in the chart's window, with its band —
  // always the full party set, since it is the retrieval mode rather than
  // the first-view comparison.
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

    const render = () => {
      if (!containerRef.current) return;

      // Get actual container width for truly responsive sizing
      const containerWidth = containerRef.current.offsetWidth || 900;
      const mobile = containerWidth < MOBILE_BREAKPOINT;

      // Responsive dimensions
      const containerHeight = mobile ? 300 : 360;
      const marginLeft = mobile ? 45 : 60;
      const marginRight = mobile ? 16 : 120; // Minimal margin on mobile (no inline labels)
      const marginBottom = mobile ? 40 : 50;
      const fontSize = mobile ? "11px" : "12px";
      const xTicks = mobile ? 3 : 4;

      const recent = recentVoteShare(data);
      const filteredData = viewMode === "all" ? recent : recent.filter(d => activeParties.includes(d.party));
      const latestData = latestByParty(filteredData);

      // Store latest values for legend
      setLatestValues(latestData.map(d => ({ party: d.party, value: d.value })));

      // Axis limit derived from what is actually plotted, plus a legible
      // buffer — never a fixed ceiling that could clip a future estimate.
      const maxPlotted = Math.max(0.05, ...filteredData.map(d => d.value));
      const yMax = Math.min(1, Math.ceil((maxPlotted + 0.05) * 20) / 20);

      // Build marks array - conditionally include labels for desktop only
      const marks: Plot.Markish[] = [
        // Background grid
        Plot.gridY({ stroke: "#dadccf", strokeWidth: 1 }),
        Plot.gridX({ stroke: "#dadccf", strokeWidth: 1 }),
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
          stroke: "#fcfbf5",
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
          color: "#5f7062",
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
          domain: [0, yMax],
          tickFormat: d => `${(d * 100).toFixed(0)}%`,
          grid: true,
          ticks: 5
        },
        color: {
          type: "categorical",
          domain: Object.keys(partyColors),
          range: Object.values(partyColors)
        },
        marks
      });

      containerRef.current.replaceChildren(plot);
    };

    render();
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure container has final dimensions
      setTimeout(render, 100);
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [data, voteShareLabel, locale, viewMode, activeParties]);

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={pt ? "Escolher partidos" : "Choose parties"}>
        {allParties.map(party => (
          <button
            key={party}
            type="button"
            onClick={() => { setViewMode("selected"); toggleParty(party); }}
            aria-pressed={viewMode === "selected" && activeParties.includes(party)}
            className={`min-h-9 rounded-full border px-3 text-sm ${viewMode === "selected" && activeParties.includes(party) ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:bg-cream"}`}
          >
            <span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: partyColors[party as keyof typeof partyColors] || "#888" }} />
            {party}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === "all" ? "selected" : "all")}
          aria-pressed={viewMode === "all"}
          className={`min-h-9 rounded-full border px-3 text-xs font-semibold uppercase tracking-wide ${viewMode === "all" ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-muted hover:bg-cream"}`}
        >
          {pt ? "Todos os partidos (orientação)" : "All parties (orientation)"}
        </button>
      </div>
      {viewMode === "all" && (
        <p className="mb-2 text-xs text-stone-500">
          {pt
            ? "Vista de orientação: médias de todos os partidos, sem intervalos — usa a tabela abaixo para a banda de incerteza."
            : "Orientation view: means for every party, without intervals — use the table below for the uncertainty band."}
        </p>
      )}
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
      <ChartTable caption={`${voteShareLabel} · ${locale === "en" ? "estimate and band, every party" : "estimativa e banda, todos os partidos"}`} columns={table.columns} rows={table.rows} />
    </div>
  );
}
