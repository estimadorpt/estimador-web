"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { ChartTable } from '@/components/viz/ChartTable';
import { FURNITURE } from '@/components/viz/theme';
import { PresidentialPollsData } from '@/types';
import { credibleIntervalLabel, formatElectionDate, formatElectionLongDate, formatElectionNumber, formatElectionPercent, formatElectionShortDate, pollsterDisplayName, PRESSED_IN_FORCED_COLORS } from '@/lib/election-display';

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
  /** Series that are not candidates and are never offered in the chooser. */
  exclude?: string[];
  /** Query-string key used to encode the selected candidate, so the same
   * page can host two focused charts (e.g. first and second round) without
   * their selections colliding in the URL. */
  candidateParam?: string;
}
type Point = { x: number; y: number };
const linePath = (points: Point[]) => points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
const areaPath = (upper: Point[], lower: Point[]) => `${linePath(upper)} ${[...lower].reverse().map(point => `L ${point.x} ${point.y}`).join(' ')} Z`;

/**
 * Estimated support over time for one chosen candidate, with its 50% and 90%
 * bands, the others as faint lines and, in the first round, the polls. The
 * SVG is drawn at the container's own pixel width, so its 11–12px labels are
 * never scaled down on a phone.
 */
export function PresidentialTrendChart({ trends, polls, cutoffDate, height = 400, showPolls = true, maxCandidates = 5, exclude = ['Others'], candidateParam = 'candidate' }: PresidentialTrendChartProps) {
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
  // Read the candidate from the URL after mount: useSearchParams would force a Suspense boundary in the static export.
  const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(280, Math.round(el.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // Keep the local selection in sync with the URL (initial load and Back/Forward navigation).
  useEffect(() => {
    const read = () => setChosen(new URLSearchParams(window.location.search).get(candidateParam));
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [candidateParam]);
  const selectedName = candidates.some(([name]) => name === chosen) ? chosen! : candidates[0]?.[0];
  const selectCandidate = (name: string) => {
    setChosen(name);
    const url = new URL(window.location.href);
    url.searchParams.set(candidateParam, name);
    window.history.pushState(null, '', url);
  };
  const selected = selectedName ? trends.candidates[selectedName] : undefined;

  const fmt = (v: number) => formatElectionPercent(v, locale);
  const visiblePolls = useMemo(() => {
    if (!showPolls || dates.length === 0) return [];
    const first = dates[0];
    const last = dates[dates.length - 1];
    return (polls?.polls ?? []).filter(poll => poll.date >= first && poll.date <= last).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [polls, showPolls, dates]);

  if (!selected || dates.length === 0) return null;

  const phone = width < 640;
  const margin = phone ? { top: 20, right: 12, bottom: 44, left: 44 } : { top: 24, right: 24, bottom: 50, left: 56 };
  const innerWidth = width - margin.left - margin.right; const innerHeight = height - margin.top - margin.bottom;
  const parsedDates = dates.map(date => new Date(`${date.slice(0, 10)}T12:00:00Z`)); const minDate = parsedDates[0].getTime(); const maxDate = parsedDates[parsedDates.length - 1].getTime();
  const yMax = Math.ceil(Math.max(...candidates.flatMap(([, candidate]) => candidate.ci_95.slice(0, dates.length)), .1) * 20) / 20 + .05;
  // The axis starts at zero unless every band sits well above it (the runoff,
  // where both candidates stay between about 25% and 70%): then it starts at
  // the tenth below the lowest band, so the two series are not flattened.
  const lowest = Math.min(...candidates.flatMap(([, candidate]) => candidate.ci_05.slice(0, dates.length)));
  const yMin = Math.max(0, Math.floor((lowest - .05) * 10) / 10);
  // With two candidates (the runoff) both are drawn in full, bands and end
  // labels; with more, the chosen one is, and the others are faint lines.
  const drawAll = candidates.length <= 2;
  const x = (date: Date) => margin.left + ((date.getTime() - minDate) / Math.max(1, maxDate - minDate)) * innerWidth;
  const y = (value: number) => margin.top + (1 - (value - yMin) / (yMax - yMin)) * innerHeight;
  const points = (values: number[]) => parsedDates.map((date, index) => ({ x: x(date), y: y(values[index]) }));
  const latest = dates.length - 1;
  const selectedPolls = visiblePolls.filter(poll => typeof poll[selectedName] === 'number');
  const tickDates = phone ? [parsedDates[0], parsedDates[latest]] : [parsedDates[0], parsedDates[Math.floor(latest / 2)], parsedDates[latest]];
  const band50 = credibleIntervalLabel(.25, .75, locale);
  const band90 = credibleIntervalLabel(.05, .95, locale);

  // Table twin: every candidate the chooser offers, every date drawn, with
  // the mean and both bands' quantiles in their own columns.
  const rows = [...dates.keys()].reverse().flatMap(index => candidates.map(([name, c]) => [
    formatElectionDate(dates[index], locale), name, fmt(c.mean[index]), fmt(c.ci_25[index]), fmt(c.ci_75[index]), fmt(c.ci_05[index]), fmt(c.ci_95[index]),
  ]));
  const pollColumns = candidates.map(([name]) => name);
  // The table holds the candidates the chart draws (the chooser's), so its
  // label says how many, not "every candidate".
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

  return <div className="w-full">
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={pt ? 'Escolher candidato' : 'Choose candidate'}>
      {candidates.map(([name, candidate]) => <button key={name} type="button" onClick={() => selectCandidate(name)} aria-pressed={selectedName === name} className={`min-h-11 max-w-full rounded-full border px-3 text-left text-sm ${PRESSED_IN_FORCED_COLORS} ${selectedName === name ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink hover:bg-cream'}`}><span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full" style={{ background: candidate.color }} />{name}</button>)}
    </div>
    <div className="mb-4 border-l-2 pl-4" style={{ borderColor: selected.color }}>
      {/* The chosen series' name, not a heading: the chart frame's title is the heading. */}
      <p className="text-lg font-semibold text-ink">{selectedName}</p>
      <p className="mt-1 text-sm text-ink-muted">{pt ? `Estimativa a ${formatElectionLongDate(dates[latest], locale)}` : `Estimate on ${formatElectionLongDate(dates[latest], locale)}`}: <strong className="text-ink tabular-nums">{fmt(selected.mean[latest])}</strong>{' · '}{band50}: {fmt(selected.ci_25[latest])}–{fmt(selected.ci_75[latest])}{' · '}{band90}: {fmt(selected.ci_05[latest])}–{fmt(selected.ci_95[latest])}</p>
    </div>
    <div ref={containerRef} className="relative w-full">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full" role="img" aria-label={`${selectedName}: ${pt ? 'apoio estimado ao longo do tempo' : 'estimated support over time'}`}
        onPointerDown={onPointer} onPointerMove={onPointer} onPointerLeave={onLeave} style={{ touchAction: 'pan-y' }}>
        {Array.from({ length: Math.floor((yMax - yMin) / .1 + 1e-9) + 1 }, (_, index) => Math.round((yMin + index * .1) * 10) / 10).map(tick => <g key={tick}><line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke={FURNITURE.grid} /><text x={margin.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={FURNITURE.textMuted}>{formatElectionPercent(tick, locale, 0)}</text></g>)}
        {tickDates.map((date, index) => <g key={date.toISOString()}><line x1={x(date)} x2={x(date)} y1={height - margin.bottom} y2={height - margin.bottom + 5} stroke={FURNITURE.axis} /><text x={x(date)} y={height - margin.bottom + 22} textAnchor={index === 0 ? 'start' : index === tickDates.length - 1 ? 'end' : 'middle'} fontSize={12} fill={FURNITURE.textMuted}>{formatElectionShortDate(date, locale)}</text></g>)}
        {candidates.filter(([name]) => name !== selectedName).map(([name, candidate]) => drawAll
          ? <g key={name}><path d={areaPath(points(candidate.ci_95), points(candidate.ci_05))} fill={candidate.color} opacity=".12" /><path d={areaPath(points(candidate.ci_75), points(candidate.ci_25))} fill={candidate.color} opacity=".28" /><path d={linePath(points(candidate.mean.slice(0, dates.length)))} fill="none" stroke={candidate.color} strokeWidth="2.5" strokeLinecap="round"><title>{name}</title></path></g>
          : <path key={name} d={linePath(points(candidate.mean.slice(0, dates.length)))} fill="none" stroke={candidate.color} strokeWidth="1.5" opacity=".32" strokeLinecap="round"><title>{name}</title></path>)}
        <path d={areaPath(points(selected.ci_95), points(selected.ci_05))} fill={selected.color} opacity=".12" /><path d={areaPath(points(selected.ci_75), points(selected.ci_25))} fill={selected.color} opacity=".28" /><path d={linePath(points(selected.mean.slice(0, dates.length)))} fill="none" stroke={selected.color} strokeWidth="3" strokeLinecap="round" />
        {drawAll && candidates.map(([name, candidate]) => <text key={`label-${name}`} x={x(parsedDates[latest]) - 4} y={y(candidate.mean[latest]) - 10} textAnchor="end" fontSize={12} fontWeight={700} fill={FURNITURE.text}>{`${name} ${fmt(candidate.mean[latest])}`}</text>)}
        {selectedPolls.map((poll, index) => <circle key={`${poll.date}-${index}`} cx={x(new Date(`${poll.date}T12:00:00Z`))} cy={y(poll[selectedName] as number)} r="4" fill={selected.color} opacity=".75" stroke={FURNITURE.surface} strokeWidth="1.5"><title>{`${pollsterDisplayName(poll.pollster)}: ${fmt(poll[selectedName] as number)} · ${formatElectionShortDate(poll.date, locale)}`}</title></circle>)}
        {tipIndex != null && <g pointerEvents="none"><line x1={tipX} x2={tipX} y1={margin.top} y2={height - margin.bottom} stroke={FURNITURE.text} strokeDasharray="3,3" /><circle cx={tipX} cy={y(selected.mean[tipIndex])} r="4.5" fill={selected.color} stroke={FURNITURE.surface} strokeWidth="2" /></g>}
      </svg>
      {tipIndex != null && (
        <div aria-hidden="true" className="pointer-events-none absolute top-2 z-10 max-w-[16rem] rounded-lg border border-line bg-cream px-3 py-2 text-xs text-ink shadow-none"
          style={tipX > width / 2 ? { right: width - tipX + 8 } : { left: tipX + 8 }}>
          <div className="font-bold">{formatElectionShortDate(dates[tipIndex], locale)}</div>
          <div className="tabular-nums">{selectedName}: <strong>{fmt(selected.mean[tipIndex])}</strong></div>
          <div className="tabular-nums text-stone-600">P25–P75: {fmt(selected.ci_25[tipIndex])}–{fmt(selected.ci_75[tipIndex])}</div>
          <div className="tabular-nums text-stone-600">P5–P95: {fmt(selected.ci_05[tipIndex])}–{fmt(selected.ci_95[tipIndex])}</div>
        </div>
      )}
    </div>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted"><span>{pt ? 'Linha: estimativa média' : 'Line: mean estimate'}</span><span>{band50}</span><span>{band90}</span>{showPolls && <span>{pt ? 'Pontos: sondagens' : 'Dots: polls'}</span>}</div>
    <ChartTable caption={pt ? 'Apoio estimado por candidato e data' : 'Estimated support by candidate and date'} summaryLabel={seriesSummary} columns={[pt ? 'Data' : 'Date', pt ? 'Candidato' : 'Candidate', pt ? 'Média' : 'Mean', 'P25', 'P75', 'P5', 'P95']} rows={rows} />
    {showPolls && visiblePolls.length > 0 && (
      <ChartTable caption={pt ? 'Sondagens desenhadas no gráfico' : 'Polls drawn on the chart'} summaryLabel={pt ? `Ver as ${formatElectionNumber(visiblePolls.length, locale)} sondagens` : `View the ${formatElectionNumber(visiblePolls.length, locale)} polls`} columns={[pt ? 'Data' : 'Date', pt ? 'Empresa' : 'Pollster', pt ? 'Amostra' : 'Sample', ...pollColumns]} rows={visiblePolls.map(poll => [formatElectionDate(poll.date, locale), pollsterDisplayName(poll.pollster), typeof poll.sample_size === 'number' ? formatElectionNumber(poll.sample_size, locale) : '—', ...pollColumns.map(name => typeof poll[name] === 'number' ? fmt(poll[name] as number) : '—')])} />
    )}
  </div>;
}
