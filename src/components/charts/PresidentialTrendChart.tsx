"use client";

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { ChartTable } from '@/components/viz/ChartTable';
import { PresidentialPollsData } from '@/types';
import { credibleIntervalLabel, formatElectionDate, formatElectionPercent } from '@/lib/election-display';

/** Structural shape shared by presidential_trends.json and second_round_trends.json,
 * so this chart can render either without a second, near-duplicate component. */
export interface TrendCandidate { color: string; mean: number[]; ci_05: number[]; ci_25: number[]; ci_75: number[]; ci_95: number[]; }
export interface TrendsLike { dates: string[]; candidates: Record<string, TrendCandidate>; }

interface PresidentialTrendChartProps {
  trends: TrendsLike;
  polls?: PresidentialPollsData;
  electionDate?: string;
  cutoffDate?: string;
  height?: number;
  showPolls?: boolean;
  maxCandidates?: number;
  /** Query-string key used to encode the selected candidate, so the same
   * page can host two focused charts (e.g. first and second round) without
   * their selections colliding in the URL. */
  candidateParam?: string;
}
type Point = { x: number; y: number };
const linePath = (points: Point[]) => points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
const areaPath = (upper: Point[], lower: Point[]) => `${linePath(upper)} ${[...lower].reverse().map(point => `L ${point.x} ${point.y}`).join(' ')} Z`;

export function PresidentialTrendChart({ trends, polls, cutoffDate, height = 400, showPolls = true, maxCandidates = 5, candidateParam = 'candidate' }: PresidentialTrendChartProps) {
  const locale = useLocale();
  const pt = locale !== 'en';
  const router = useRouter();
  const pathname = usePathname();
  const dates = useMemo(() => {
    const firstAfterCutoff = cutoffDate ? trends.dates.findIndex(date => new Date(date) > new Date(cutoffDate)) : -1;
    return trends.dates.slice(0, firstAfterCutoff === -1 ? trends.dates.length : firstAfterCutoff);
  }, [trends.dates, cutoffDate]);
  const candidates = useMemo(() => Object.entries(trends.candidates)
    .filter(([name]) => name !== 'Others')
    .sort((a, b) => b[1].mean[dates.length - 1] - a[1].mean[dates.length - 1])
    .slice(0, maxCandidates), [trends.candidates, dates.length, maxCandidates]);
  // Read the candidate from the URL after mount: useSearchParams would force a Suspense boundary in the static export.
  const [chosen, setChosen] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update(); window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
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
    const params = new URLSearchParams(window.location.search);
    params.set(candidateParam, name);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const selected = selectedName ? trends.candidates[selectedName] : undefined;
  if (!selected || dates.length === 0) return null;

  const width = isMobile ? 430 : 820; const margin = isMobile ? { top: 24, right: 14, bottom: 48, left: 46 } : { top: 28, right: 24, bottom: 54, left: 56 };
  const innerWidth = width - margin.left - margin.right; const innerHeight = height - margin.top - margin.bottom;
  const parsedDates = dates.map(date => new Date(date)); const minDate = parsedDates[0].getTime(); const maxDate = parsedDates[parsedDates.length - 1].getTime();
  const yMax = Math.ceil(Math.max(...candidates.flatMap(([, candidate]) => candidate.ci_95.slice(0, dates.length)), .1) * 20) / 20 + .05;
  const x = (date: Date) => margin.left + ((date.getTime() - minDate) / Math.max(1, maxDate - minDate)) * innerWidth;
  const y = (value: number) => margin.top + (1 - value / yMax) * innerHeight;
  const points = (values: number[]) => parsedDates.map((date, index) => ({ x: x(date), y: y(values[index]) }));
  const latest = dates.length - 1;
  const selectedPolls = showPolls ? (polls?.polls ?? []).filter(poll => { const date = new Date(poll.date).getTime(); return date >= minDate && date <= maxDate && typeof poll[selectedName] === 'number'; }) : [];
  const rows = [...dates.keys()].reverse().map(index => [formatElectionDate(dates[index], locale), formatElectionPercent(selected.mean[index], locale), `${formatElectionPercent(selected.ci_25[index], locale)}–${formatElectionPercent(selected.ci_75[index], locale)}`, `${formatElectionPercent(selected.ci_05[index], locale)}–${formatElectionPercent(selected.ci_95[index], locale)}`]);
  const tickDates = isMobile ? [parsedDates[0], parsedDates[latest]] : [parsedDates[0], parsedDates[Math.floor(latest / 2)], parsedDates[latest]];

  return <div className="w-full">
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={pt ? 'Escolher candidato' : 'Choose candidate'}>
      {candidates.map(([name, candidate]) => <button key={name} type="button" onClick={() => selectCandidate(name)} aria-pressed={selectedName === name} className={`min-h-11 max-w-full rounded-full border px-3 text-left text-sm ${selectedName === name ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink hover:bg-cream'}`}><span className="mr-2 inline-block size-2 rounded-full" style={{ background: candidate.color }} />{name}</button>)}
    </div>
    <div className="mb-4 border-l-2 pl-4" style={{ borderColor: selected.color }}>
      <h3 className="text-lg font-semibold text-ink">{selectedName}</h3>
      <p className="mt-1 text-sm text-ink-muted">{pt ? 'Última estimativa' : 'Latest estimate'}: <strong className="text-ink tabular-nums">{formatElectionPercent(selected.mean[latest], locale)}</strong>{' · '}{credibleIntervalLabel(.25, .75, locale)}: {formatElectionPercent(selected.ci_25[latest], locale)}–{formatElectionPercent(selected.ci_75[latest], locale)}{' · '}{credibleIntervalLabel(.05, .95, locale)}: {formatElectionPercent(selected.ci_05[latest], locale)}–{formatElectionPercent(selected.ci_95[latest], locale)}</p>
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${selectedName}: ${pt ? 'apoio estimado ao longo do tempo' : 'estimated support over time'}`}>
      {Array.from({ length: Math.floor(yMax / .1) + 1 }, (_, index) => index * .1).map(tick => <g key={tick}><line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="#dadccf" /><text x={margin.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="text-[11px] fill-stone-500">{formatElectionPercent(tick, locale, 0)}</text></g>)}
      {tickDates.map((date, index) => <g key={date.toISOString()}><line x1={x(date)} x2={x(date)} y1={height - margin.bottom} y2={height - margin.bottom + 5} stroke="#7f9284" /><text x={x(date)} y={height - margin.bottom + 22} textAnchor={index === 0 ? 'start' : index === tickDates.length - 1 ? 'end' : 'middle'} className="text-xs fill-stone-500">{formatElectionDate(date, locale)}</text></g>)}
      {candidates.filter(([name]) => name !== selectedName).map(([name, candidate]) => <path key={name} d={linePath(points(candidate.mean))} fill="none" stroke={candidate.color} strokeWidth="1.5" opacity=".32" strokeLinecap="round"><title>{name}</title></path>)}
      <path d={areaPath(points(selected.ci_95), points(selected.ci_05))} fill={selected.color} opacity=".12" /><path d={areaPath(points(selected.ci_75), points(selected.ci_25))} fill={selected.color} opacity=".28" /><path d={linePath(points(selected.mean))} fill="none" stroke={selected.color} strokeWidth="3" strokeLinecap="round" />
      {selectedPolls.map((poll, index) => <circle key={`${poll.date}-${index}`} cx={x(new Date(poll.date))} cy={y(poll[selectedName] as number)} r="4" fill={selected.color} opacity=".75" stroke="#fcfbf5" strokeWidth="1.5"><title>{`${poll.pollster}: ${formatElectionPercent(poll[selectedName] as number, locale)} · ${formatElectionDate(poll.date, locale)}`}</title></circle>)}
    </svg>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted"><span>{pt ? 'Linha: estimativa média' : 'Line: mean estimate'}</span><span>{credibleIntervalLabel(.25, .75, locale)}</span><span>{credibleIntervalLabel(.05, .95, locale)}</span>{showPolls && <span>{pt ? 'Pontos: sondagens' : 'Dots: polls'}</span>}</div>
    <ChartTable caption={pt ? `Série temporal de ${selectedName}` : `${selectedName} time series`} summaryLabel={pt ? 'Ver a série por data, mais recente primeiro' : 'View the series by date, latest first'} columns={[pt ? 'Data' : 'Date', pt ? 'Estimativa média' : 'Mean estimate', 'P25–P75', 'P5–P95']} rows={rows} />
  </div>;
}
