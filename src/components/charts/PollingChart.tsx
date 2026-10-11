"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { FURNITURE } from "@/components/viz/theme";
import { partyColors } from "@/lib/config/colors";
import { compactTrendSeries, recentTrendRows, type TrendSeries } from "@/lib/election-aggregates";
import { electionIntlLocale, formatElectionDate, formatElectionShortDate, sortByPartyOrder } from "@/lib/election-display";
import { quietPlot } from "@/components/viz/plot-a11y";

interface TrendData {
  date: string;
  party: string;
  metric: string;
  value: number;
}

interface PollingChartProps {
  /** The two-year window in columns, built on the server (loadParliamentaryArchive). */
  series?: TrendSeries;
  /** Long rows, for MDX pieces that pass inline data; reduced here to the same window. */
  data?: TrendData[];
  voteShareLabel?: string;
}

/** One party's value on one date, as Plot reads it. */
interface Point {
  date: Date;
  party: string;
  mean: number;
  low: number | null;
  high: number | null;
}

const MOBILE_BREAKPOINT = 640;
/** The parties drawn with their band: the largest by the last estimate. */
const BANDED_PARTIES = 3;

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

/**
 * The model's estimate of each party's vote share on the dates of the polls
 * it read, over the two years before the election. Every party is drawn, with
 * no filter (an archived chart has nothing to choose): the three largest
 * carry their 94% HDI band, the smaller parties' bands would sit on top of
 * each other near the floor, so their lines go without, and the table holds
 * every party with its band.
 */
export function PollingChart({ series: provided, data, voteShareLabel: voteShareLabelProp }: PollingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("forecast");
  const voteShareLabel = voteShareLabelProp ?? t("voteShareLabel");
  const locale = useLocale();
  const pt = locale !== "en";
  const intl = electionIntlLocale(locale);
  const fmtPct = (v: number) => `${(v * 100).toLocaleString(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  const series = useMemo(() => provided ?? compactTrendSeries(recentTrendRows(data ?? [])), [provided, data]);
  const points = useMemo(() => {
    const out: Point[] = [];
    for (const [party, values] of Object.entries(series.parties)) {
      series.dates.forEach((date, i) => {
        const mean = values.mean[i];
        if (mean != null) out.push({ date: day(date), party, mean, low: values.low[i], high: values.high[i] });
      });
    }
    return out;
  }, [series]);
  const lastIndex = series.dates.length - 1;
  // Parties by their last estimate, largest first.
  const ranked = useMemo(
    () => Object.entries(series.parties)
      .filter(([, v]) => v.mean[lastIndex] != null)
      .sort((a, b) => (b[1].mean[lastIndex] ?? 0) - (a[1].mean[lastIndex] ?? 0))
      .map(([party]) => party),
    [series, lastIndex],
  );
  const banded = useMemo(() => ranked.slice(0, BANDED_PARTIES), [ranked]);
  // Table columns in the archive's one party order (AEE3-06).
  const allParties = useMemo(() => sortByPartyOrder(ranked), [ranked]);

  // The table twin: every estimate in the window, every party, with its band,
  // newest first, so the values the end labels quote open the table on a phone.
  const table = useMemo(() => {
    if (series.dates.length === 0) return { columns: [], rows: [] };
    return {
      columns: [pt ? "Data" : "Date", ...allParties],
      rows: series.dates.map((date, i) => [
        formatElectionDate(date, locale),
        ...allParties.map(party => {
          const v = series.parties[party];
          const mean = v.mean[i];
          if (mean == null) return "";
          const low = v.low[i];
          const high = v.high[i];
          return low != null && high != null ? `${fmtPct(mean)} (${fmtPct(low)}–${fmtPct(high)})` : fmtPct(mean);
        }),
      ]).reverse(),
    };
  }, [series, allParties, pt, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (points.length === 0 || !containerRef.current) return;

    const render = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth || 900;
      const mobile = containerWidth < MOBILE_BREAKPOINT;
      const containerHeight = mobile ? 300 : 360;

      const drawn = points;
      const withBand = drawn.filter(d => banded.includes(d.party) && d.low != null && d.high != null);
      const latest = drawn.filter(d => d.date.getTime() === day(series.dates[lastIndex]).getTime()).sort((a, b) => b.mean - a.mean);

      // Axis limit from what is drawn (bands included), plus a legible buffer.
      const maxPlotted = Math.max(0.05, ...drawn.map(d => d.mean), ...withBand.map(d => d.high as number));
      const yMax = Math.min(1, Math.ceil((maxPlotted + 0.05) * 20) / 20);
      // End labels at their line's height, pushed apart by at least one
      // label's height (13px) where two lines end close together.
      const marginTop = 20;
      const marginBottom = mobile ? 40 : 50;
      const gap = (13 / (containerHeight - marginTop - marginBottom)) * yMax;
      const labels = latest.reduce<Array<Point & { ly: number }>>((acc, d) => {
        const above = acc[acc.length - 1];
        acc.push({ ...d, ly: above ? Math.min(d.mean, above.ly - gap) : d.mean });
        return acc;
      }, []);
      // Then from the bottom up, so the smallest parties' labels never fall
      // below the 0% axis ("Todos os partidos" puts five near the floor).
      for (let i = labels.length - 1; i >= 0; i--) {
        const below = labels[i + 1];
        labels[i].ly = Math.max(labels[i].ly, below ? below.ly + gap : gap / 2);
      }

      const marks: Plot.Markish[] = [
        Plot.gridY({ stroke: FURNITURE.grid, strokeWidth: 1 }),
        Plot.gridX({ stroke: FURNITURE.grid, strokeWidth: 1 }),
        // The 94% HDI band of each drawn party, a light wash under its line.
        Plot.areaY(withBand, { x: "date", y1: "low", y2: "high", fill: "party", fillOpacity: 0.16, curve: "catmull-rom" }),
        Plot.line(drawn, { x: "date", y: "mean", stroke: "party", strokeWidth: mobile ? 2 : 2.5, curve: "catmull-rom" }),
        Plot.dot(latest, { x: "date", y: "mean", fill: "party", r: mobile ? 3 : 4, stroke: FURNITURE.surface, strokeWidth: mobile ? 1.5 : 2 }),
        // On a phone the tip is three short lines (party and value, band,
        // date): one long line ran up to 110px past the card's edge (UXM3-02).
        // No wider than half the plot, it always fits on one side of a point.
        Plot.tip(drawn, Plot.pointer({
          x: "date",
          y: "mean",
          // Plot's own tip text is 10px; nothing on the site goes below 11.
          fontSize: mobile ? 11 : 12,
          title: (d: Point) => {
            const band = d.low != null && d.high != null ? `(${fmtPct(d.low)}–${fmtPct(d.high)})` : "";
            const date = formatElectionShortDate(d.date, locale);
            return mobile
              ? [`${d.party} ${fmtPct(d.mean)}`, band, date].filter(Boolean).join("\n")
              : `${d.party} ${fmtPct(d.mean)}${band ? ` ${band}` : ""} · ${date}`;
          },
        })),
      ];

      // End labels at every width: the party codes are short enough for a
      // phone's gutter, so no legend is needed to tell the lines apart.
      marks.push(
        Plot.text(labels, {
          x: "date",
          y: "ly",
          text: (d: Point) => `${d.party} ${fmtPct(d.mean)}`,
          fill: FURNITURE.text,
          dx: mobile ? 6 : 8,
          fontSize: mobile ? 11 : 12,
          fontWeight: "600",
          textAnchor: "start",
        }),
      );

      const plot = Plot.plot({
        width: containerWidth,
        height: containerHeight,
        marginLeft: mobile ? 45 : 60,
        marginRight: mobile ? 72 : 120,
        marginTop,
        marginBottom,
        style: { backgroundColor: "transparent", color: FURNITURE.textMuted, fontSize: mobile ? "11px" : "12px", fontFamily: FURNITURE.font },
        x: {
          // UTC, like the dates (built at T12:00Z) and the tick formatter: a
          // local "time" scale put ticks at Lisbon midnight, 23:00Z the day
          // before in summer, and the UTC formatter named the previous month.
          type: "utc",
          label: null,
          // The page's locale ("jul. 2023" / "Jul 2023"), never d3's default English.
          tickFormat: (d: Date) => `${d.toLocaleDateString(intl, { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`,
          grid: true,
          ticks: mobile ? 3 : 4,
        },
        y: {
          label: mobile ? null : voteShareLabel,
          domain: [0, yMax],
          tickFormat: (d: number) => `${(d * 100).toFixed(0)}%`,
          grid: true,
          ticks: 5,
        },
        color: { type: "categorical", domain: Object.keys(partyColors), range: Object.values(partyColors) },
        marks,
      });

      // The table twin below is the accessible version; Plot labels role-less <g>s (A11Y-12).
      containerRef.current.replaceChildren(quietPlot(plot));
    };

    render();
    const resizeObserver = new ResizeObserver(() => setTimeout(render, 100));
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [points, series, lastIndex, voteShareLabel, locale, banded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full">
      <p className="mb-2 text-xs text-graphite">
        {pt
          ? "Todos os partidos, cada um com o nome ao fim da sua linha. A faixa clara (94%) só nos três maiores: a dos outros sobrepor-se-ia junto ao fundo."
          : "Every party, each named at the end of its line. The light band (94%) on the three largest only: the others' would overlap near the floor."}
      </p>
      <div ref={containerRef} />
      <ChartTable
        caption={`${voteShareLabel} · ${pt ? "estimativa e banda de 94% (HDI), todos os partidos" : "estimate and 94% HDI band, every party"}`}
        summaryLabel={pt ? "Ver como tabela, mais recente primeiro" : "View as table, latest first"}
        columns={table.columns}
        rows={table.rows}
      />
    </div>
  );
}
