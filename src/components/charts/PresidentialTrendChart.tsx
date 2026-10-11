"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { ChartTable } from '@/components/viz/ChartTable';
import { FURNITURE } from '@/components/viz/theme';
import { PresidentialPollsData } from '@/types';
import { credibleIntervalLabel, formatElectionDate, formatElectionLongDate, formatElectionNumber, formatElectionPercent, formatElectionShortDate, pollsterDisplayName } from '@/lib/election-display';

/** Structural shape shared by presidential_trends.json and second_round_trends.json,
 * so this chart can render either without a second, near-duplicate component. */
export interface TrendCandidate { color: string; mean: number[]; ci_05: number[]; ci_25: number[]; ci_75: number[]; ci_95: number[]; }
export interface TrendsLike { dates: string[]; candidates: Record<string, TrendCandidate>; }

interface PresidentialTrendChartProps {
  trends: TrendsLike;
  polls?: PresidentialPollsData;
  electionDate?: string;
  /** The forecast's date: later dates in the file are projections and are not drawn. */
  cutoffDate?: string | null;
  height?: number;
  showPolls?: boolean;
  maxCandidates?: number;
  /** Series that are not candidates and are never drawn. */
  exclude?: string[];
}
type Point = { x: number; y: number };
const linePath = (points: Point[]) => points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
const areaPath = (upper: Point[], lower: Point[]) => `${linePath(upper)} ${[...lower].reverse().map(point => `L ${point.x} ${point.y}`).join(' ')} Z`;

/** Line height of an end label, in pixels. */
const LABEL_LINE = 14;

/**
 * A name broken into lines of at most `max` characters, at spaces: "António
 * José Seguro" becomes "António José" and "Seguro" in a phone's narrow gutter.
 */
function wrapName(name: string, max: number): string[] {
  const lines: string[] = [];
  for (const word of name.split(' ')) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

/**
 * Pushes label blocks apart so none overlaps the next, then back up from the
 * bottom so none falls below the plot. `centre` is where each wants to be
 * (its line's end); the result keeps the order of the lines.
 */
export function dodgeLabels(blocks: Array<{ centre: number; height: number }>, top: number, bottom: number, gap = 4): number[] {
  const order = blocks.map((block, index) => ({ ...block, index })).sort((a, b) => a.centre - b.centre);
  const placed = order.map(block => block.centre);
  for (let i = 0; i < order.length; i++) {
    const min = i === 0 ? top + order[i].height / 2 : placed[i - 1] + (order[i - 1].height + order[i].height) / 2 + gap;
    placed[i] = Math.max(placed[i], min);
  }
  for (let i = order.length - 1; i >= 0; i--) {
    const max = i === order.length - 1 ? bottom - order[i].height / 2 : placed[i + 1] - (order[i + 1].height + order[i].height) / 2 - gap;
    placed[i] = Math.min(placed[i], max);
  }
  const out = new Array<number>(blocks.length);
  order.forEach((block, i) => { out[block.index] = placed[i]; });
  return out;
}

/**
 * Estimated support over time for every candidate drawn, each line named at
 * its end with its last estimate and 90% interval, so no candidate has to be
 * chosen to be read (an archived chart has no filters). With two candidates
 * (the runoff) both carry their 50% and 90% bands; with more, every line
 * carries its 50% band only (the 90% bands of five candidates within ten
 * points of each other would cover the chart), and the table twin has every
 * band. In the first round the polls are drawn as dots in each candidate's
 * colour. The SVG is drawn at the container's own pixel width, so its
 * 11–12px labels are never scaled down on a phone.
 */
export function PresidentialTrendChart({ trends, polls, cutoffDate, height = 400, showPolls = true, maxCandidates = 5, exclude = ['Others'] }: PresidentialTrendChartProps) {
  const locale = useLocale();
  const pt = locale !== 'en';
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(820);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (hover == null) return;
    const clear = (event: PointerEvent) => { if (!containerRef.current?.contains(event.target as Node)) setHover(null); };
    document.addEventListener('pointerdown', clear);
    return () => document.removeEventListener('pointerdown', clear);
  }, [hover]);
  const dates = useMemo(() => {
    const firstAfterCutoff = cutoffDate ? trends.dates.findIndex(date => date.slice(0, 10) > cutoffDate.slice(0, 10)) : -1;
    return trends.dates.slice(0, firstAfterCutoff === -1 ? trends.dates.length : firstAfterCutoff);
  }, [trends.dates, cutoffDate]);
  const candidates = useMemo(() => Object.entries(trends.candidates)
    .filter(([name]) => !exclude.includes(name))
    .sort((a, b) => b[1].mean[dates.length - 1] - a[1].mean[dates.length - 1])
    .slice(0, maxCandidates), [trends.candidates, dates.length, maxCandidates, exclude]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(280, Math.round(el.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fmt = (v: number) => formatElectionPercent(v, locale);
  const visiblePolls = useMemo(() => {
    if (!showPolls || dates.length === 0) return [];
    const first = dates[0];
    const last = dates[dates.length - 1];
    return (polls?.polls ?? []).filter(poll => poll.date >= first && poll.date <= last).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [polls, showPolls, dates]);

  if (candidates.length === 0 || dates.length === 0) return null;

  const phone = width < 640;
  // The right gutter holds the end labels: one line per name on a desktop,
  // names broken at spaces in a phone's narrower gutter.
  const gutter = phone ? 100 : 190;
  const margin = phone ? { top: 16, right: gutter, bottom: 44, left: 40 } : { top: 20, right: gutter, bottom: 50, left: 52 };
  const innerWidth = width - margin.left - margin.right; const innerHeight = height - margin.top - margin.bottom;
  const parsedDates = dates.map(date => new Date(`${date.slice(0, 10)}T12:00:00Z`)); const minDate = parsedDates[0].getTime(); const maxDate = parsedDates[parsedDates.length - 1].getTime();
  // Both bands are drawn with two candidates; with more, the 50% band only.
  const bothBands = candidates.length <= 2;
  // The top is the first gridline (a tenth) above the highest band or poll drawn.
  const pollValues = showPolls ? visiblePolls.flatMap(poll => candidates.map(([name]) => poll[name]).filter((v): v is number => typeof v === 'number')) : [];
  const yMax = Math.ceil((Math.max(...candidates.flatMap(([, candidate]) => (bothBands ? candidate.ci_95 : candidate.ci_75).slice(0, dates.length)), ...pollValues, .1) + .02) * 10) / 10;
  // The axis starts at zero unless every band sits well above it (the runoff,
  // where both candidates stay between about 25% and 70%): then it starts at
  // the tenth below the lowest band, so the two series are not flattened.
  const lowest = Math.min(...candidates.flatMap(([, candidate]) => (bothBands ? candidate.ci_05 : candidate.ci_25).slice(0, dates.length)));
  const yMin = Math.max(0, Math.floor((lowest - .05) * 10) / 10);
  const x = (date: Date) => margin.left + ((date.getTime() - minDate) / Math.max(1, maxDate - minDate)) * innerWidth;
  const y = (value: number) => margin.top + (1 - (value - yMin) / (yMax - yMin)) * innerHeight;
  const points = (values: number[]) => parsedDates.map((date, index) => ({ x: x(date), y: y(values[index]) }));
  const latest = dates.length - 1;
  const xEnd = x(parsedDates[latest]);
  const tickDates = phone ? [parsedDates[0], parsedDates[latest]] : [parsedDates[0], parsedDates[Math.floor(latest / 2)], parsedDates[latest]];
  const band50 = credibleIntervalLabel(.25, .75, locale);
  const band90 = credibleIntervalLabel(.05, .95, locale);
  const range90 = (c: TrendCandidate, i: number) => `${formatElectionNumber(c.ci_05[i] * 100, locale, 1)}–${formatElectionNumber(c.ci_95[i] * 100, locale, 1)}`;

  // End labels: the name (wrapped on a phone), then the last estimate and its
  // 90% interval, pushed apart where two lines end close together.
  const labels = candidates.map(([name, c]) => {
    const nameLines = phone ? wrapName(name, 13) : [name];
    const figures = phone ? [fmt(c.mean[latest]), range90(c, latest)] : [`${fmt(c.mean[latest])} (${range90(c, latest)})`];
    return { name, color: c.color, nameLines, figures, lineY: y(c.mean[latest]), height: (nameLines.length + figures.length) * LABEL_LINE };
  });
  const labelCentres = dodgeLabels(labels.map(l => ({ centre: l.lineY, height: l.height })), margin.top - 8, height - margin.bottom + 8);

  // Table twin: every candidate drawn, every date, with the mean and both
  // bands' quantiles in their own columns.
  const rows = [...dates.keys()].reverse().flatMap(index => candidates.map(([name, c]) => [
    formatElectionDate(dates[index], locale), name, fmt(c.mean[index]), fmt(c.ci_25[index]), fmt(c.ci_75[index]), fmt(c.ci_05[index]), fmt(c.ci_95[index]),
  ]));
  const pollColumns = candidates.map(([name]) => name);
  const seriesCount = formatElectionNumber(candidates.length, locale);
  const seriesSummary = candidates.length === 2
    ? (pt ? 'Ver a série dos dois candidatos, mais recente primeiro' : 'View both candidates’ series, latest first')
    : (pt ? `Ver a série dos ${seriesCount} candidatos do gráfico, mais recente primeiro` : `View the series of the chart’s ${seriesCount} candidates, latest first`);

  const onPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    const t = minDate + ((px - margin.left) / Math.max(1, innerWidth)) * (maxDate - minDate);
    let best = 0;
    for (let i = 1; i < parsedDates.length; i++) if (Math.abs(parsedDates[i].getTime() - t) < Math.abs(parsedDates[best].getTime() - t)) best = i;
    setHover(best);
  };
  // Touch: a tap or a horizontal drag sets the tip (pointerdown/move); lifting
  // the finger fires pointerleave, which must not clear it. A tap elsewhere on
  // the page does. pan-y keeps vertical swipes scrolling the page.
  const onLeave = (event: React.PointerEvent<SVGSVGElement>) => { if (event.pointerType !== 'touch') setHover(null); };
  const tipIndex = hover;
  const tipX = tipIndex != null ? x(parsedDates[tipIndex]) : 0;
  const tipRows = tipIndex != null ? [...candidates].sort((a, b) => b[1].mean[tipIndex] - a[1].mean[tipIndex]) : [];
  const summary = candidates.map(([name, c]) => `${name} ${fmt(c.mean[latest])}`).join(', ');

  return <div className="w-full">
    <p className="mb-3 text-sm text-graphite">
      {pt ? `Ao fim de cada linha, a estimativa a ${formatElectionLongDate(dates[latest], locale)} e o seu intervalo de 90%.` : `At the end of each line, the estimate on ${formatElectionLongDate(dates[latest], locale)} and its 90% interval.`}
    </p>
    <div ref={containerRef} className="relative w-full">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full" role="img"
        aria-label={`${pt ? 'Apoio estimado ao longo do tempo' : 'Estimated support over time'}: ${summary}`}
        onPointerDown={onPointer} onPointerMove={onPointer} onPointerLeave={onLeave} style={{ touchAction: 'pan-y' }}>
        {Array.from({ length: Math.floor((yMax - yMin) / .1 + 1e-9) + 1 }, (_, index) => Math.round((yMin + index * .1) * 10) / 10).map(tick => <g key={tick}><line x1={margin.left} x2={xEnd} y1={y(tick)} y2={y(tick)} stroke={FURNITURE.grid} /><text x={margin.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={FURNITURE.textMuted}>{formatElectionPercent(tick, locale, 0)}</text></g>)}
        {tickDates.map((date, index) => <g key={date.toISOString()}><line x1={x(date)} x2={x(date)} y1={height - margin.bottom} y2={height - margin.bottom + 5} stroke={FURNITURE.axis} /><text x={x(date)} y={height - margin.bottom + 22} textAnchor={index === 0 ? 'start' : index === tickDates.length - 1 ? 'end' : 'middle'} fontSize={12} fill={FURNITURE.textMuted}>{formatElectionShortDate(date, locale)}</text></g>)}
        {candidates.map(([name, c]) => <g key={`band-${name}`}>
          {bothBands && <path d={areaPath(points(c.ci_95), points(c.ci_05))} fill={c.color} opacity=".12" />}
          <path d={areaPath(points(c.ci_75), points(c.ci_25))} fill={c.color} opacity={bothBands ? '.28' : '.16'} />
        </g>)}
        {showPolls && candidates.map(([name, c]) => visiblePolls.filter(poll => typeof poll[name] === 'number').map((poll, index) => <circle key={`${name}-${poll.date}-${index}`} cx={x(new Date(`${poll.date}T12:00:00Z`))} cy={y(poll[name] as number)} r={phone ? 2.5 : 3} fill={c.color} opacity=".6"><title>{`${name}, ${pollsterDisplayName(poll.pollster)}: ${fmt(poll[name] as number)} · ${formatElectionShortDate(poll.date, locale)}`}</title></circle>))}
        {candidates.map(([name, c]) => <path key={`line-${name}`} d={linePath(points(c.mean.slice(0, dates.length)))} fill="none" stroke={c.color} strokeWidth={phone ? 2 : 2.5} strokeLinecap="round"><title>{name}</title></path>)}
        {labels.map((label, i) => {
          const top = labelCentres[i] - label.height / 2;
          return <g key={`label-${label.name}`}>
            <path d={`M ${xEnd + 3} ${label.lineY} L ${xEnd + 9} ${labelCentres[i]} L ${xEnd + 12} ${labelCentres[i]}`} fill="none" stroke={label.color} strokeWidth="1.5" />
            <text x={xEnd + 16} y={top} fontSize={phone ? 11 : 12} fill={FURNITURE.text}>
              {label.nameLines.map((line, j) => <tspan key={`n${j}`} x={xEnd + 16} dy={j === 0 ? LABEL_LINE - 3 : LABEL_LINE} fontWeight={700}>{line}</tspan>)}
              {label.figures.map((line, j) => <tspan key={`f${j}`} x={xEnd + 16} dy={LABEL_LINE} fill={j === 0 ? FURNITURE.text : FURNITURE.textMuted} className="tabular-nums">{line}</tspan>)}
            </text>
          </g>;
        })}
        {tipIndex != null && <g pointerEvents="none"><line x1={tipX} x2={tipX} y1={margin.top} y2={height - margin.bottom} stroke={FURNITURE.text} strokeDasharray="3,3" />{candidates.map(([name, c]) => <circle key={`tip-${name}`} cx={tipX} cy={y(c.mean[tipIndex])} r="4" fill={c.color} stroke={FURNITURE.surface} strokeWidth="1.5" />)}</g>}
      </svg>
      {tipIndex != null && (
        <div aria-hidden="true" className="pointer-events-none absolute top-2 z-10 max-w-[17rem] border border-rule bg-paper px-3 py-2 text-xs text-ink"
          style={tipX > (width - gutter) / 2 ? { right: width - tipX + 8 } : { left: tipX + 8 }}>
          <div className="font-bold">{formatElectionShortDate(dates[tipIndex], locale)}</div>
          {tipRows.map(([name, c]) => <div key={name} className="flex items-baseline gap-1.5 tabular-nums"><span aria-hidden="true" className="inline-block size-2 shrink-0" style={{ background: c.color }} /><span>{name}: <strong>{fmt(c.mean[tipIndex])}</strong> <span className="text-graphite">({range90(c, tipIndex)})</span></span></div>)}
        </div>
      )}
    </div>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted"><span>{pt ? 'Linha: estimativa média' : 'Line: mean estimate'}</span><span>{pt ? `Faixa: ${band50.charAt(0).toLowerCase()}${band50.slice(1)}` : `Band: ${band50}`}</span>{bothBands && <span>{pt ? `Faixa clara: ${band90.charAt(0).toLowerCase()}${band90.slice(1)}` : `Light band: ${band90}`}</span>}{showPolls && <span>{pt ? 'Pontos: sondagens' : 'Dots: polls'}</span>}</div>
    <ChartTable caption={pt ? 'Apoio estimado por candidato e data' : 'Estimated support by candidate and date'} summaryLabel={seriesSummary} columns={[pt ? 'Data' : 'Date', pt ? 'Candidato' : 'Candidate', pt ? 'Média' : 'Mean', 'P25', 'P75', 'P5', 'P95']} rows={rows} />
    {showPolls && visiblePolls.length > 0 && (
      <ChartTable caption={pt ? 'Sondagens desenhadas no gráfico' : 'Polls drawn on the chart'} summaryLabel={pt ? `Ver as ${formatElectionNumber(visiblePolls.length, locale)} sondagens` : `View the ${formatElectionNumber(visiblePolls.length, locale)} polls`} columns={[pt ? 'Data' : 'Date', pt ? 'Empresa' : 'Pollster', pt ? 'Amostra' : 'Sample', ...pollColumns]} rows={visiblePolls.map(poll => [formatElectionDate(poll.date, locale), pollsterDisplayName(poll.pollster), typeof poll.sample_size === 'number' ? formatElectionNumber(poll.sample_size, locale) : '—', ...pollColumns.map(name => typeof poll[name] === 'number' ? fmt(poll[name] as number) : '—')])} />
    )}
  </div>;
}
