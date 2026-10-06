"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { ChartTable } from '@/components/viz/ChartTable';
import { FURNITURE } from '@/components/viz/theme';
import { PresidentialHeadToHeadData } from '@/types';
import { formatElectionDate, formatElectionProbability } from '@/lib/election-display';

interface PresidentialHeadToHeadProps {
  data: PresidentialHeadToHeadData;
  cutoffDate?: string | null;
  height?: number;
  translations: {
    title: string;
    /** "leads", appended to a candidate's name. */
    probability: string;
    /** Heading over the last value, e.g. "At the last poll". */
    lastValue: string;
    empty: string;
  };
}

/**
 * The probability that candidate A finished ahead of candidate B, by date, up
 * to the forecast's last poll. Drawn at the container's pixel width so the
 * labels keep their real size on a phone; the legend sits below the plot
 * rather than in a fixed right-hand margin.
 */
export function PresidentialHeadToHead({ data, cutoffDate, height = 260, translations }: PresidentialHeadToHeadProps) {
  const { dates, probability_a_leads, candidate_a, candidate_b, color_a, color_b } = data;
  const locale = useLocale();
  const pt = locale !== 'en';
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (hover == null) return;
    const clear = (event: PointerEvent) => { if (!containerRef.current?.contains(event.target as Node)) setHover(null); };
    document.addEventListener('pointerdown', clear);
    return () => document.removeEventListener('pointerdown', clear);
  }, [hover]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(280, Math.round(el.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { filteredDates, filteredProbs } = useMemo(() => {
    const end = cutoffDate ? dates.findIndex(d => d.slice(0, 10) > cutoffDate.slice(0, 10)) : -1;
    const finalIdx = end === -1 ? dates.length : end;
    return { filteredDates: dates.slice(0, finalIdx), filteredProbs: probability_a_leads.slice(0, finalIdx) };
  }, [dates, probability_a_leads, cutoffDate]);

  if (filteredDates.length === 0) {
    return <p className="text-stone-500 text-center py-8">{translations.empty}</p>;
  }

  const phone = width < 640;
  const margin = { top: 16, right: phone ? 12 : 24, bottom: 40, left: 44 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const parsed = filteredDates.map(d => new Date(`${d.slice(0, 10)}T12:00:00Z`));
  const minT = parsed[0].getTime();
  const maxT = parsed[parsed.length - 1].getTime();
  const x = (t: number) => margin.left + ((t - minT) / Math.max(1, maxT - minT)) * innerWidth;
  const y = (v: number) => margin.top + (1 - v) * innerHeight;
  const line = filteredProbs.map((p, i) => `${i ? 'L' : 'M'} ${x(parsed[i].getTime())} ${y(p)}`).join(' ');
  const fill = (clamp: (p: number) => number) =>
    `M ${x(minT)} ${y(0.5)} ${filteredProbs.map((p, i) => `L ${x(parsed[i].getTime())} ${y(clamp(p))}`).join(' ')} L ${x(maxT)} ${y(0.5)} Z`;
  const last = filteredProbs[filteredProbs.length - 1];
  const leaderLast = last >= 0.5 ? candidate_a : candidate_b;
  const leaderProb = last >= 0.5 ? last : 1 - last;
  const ticks = phone ? [parsed[0], parsed[parsed.length - 1]] : [parsed[0], parsed[Math.floor(parsed.length / 2)], parsed[parsed.length - 1]];

  const onPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const t = minT + ((event.clientX - box.left - margin.left) / Math.max(1, innerWidth)) * (maxT - minT);
    let best = 0;
    for (let i = 1; i < parsed.length; i++) if (Math.abs(parsed[i].getTime() - t) < Math.abs(parsed[best].getTime() - t)) best = i;
    setHover(best);
  };
  // Touch: a tap or a horizontal drag sets the tip; lifting the finger fires
  // pointerleave, which must not clear it. A tap elsewhere does.
  const onLeave = (event: React.PointerEvent<SVGSVGElement>) => { if (event.pointerType !== 'touch') setHover(null); };
  const tipX = hover != null ? x(parsed[hover].getTime()) : 0;

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full" role="img"
          aria-label={`${translations.title}: ${candidate_a} ${translations.probability}`}
          onPointerDown={onPointer} onPointerMove={onPointer} onPointerLeave={onLeave} style={{ touchAction: 'pan-y' }}>
          <path d={fill(p => Math.max(p, 0.5))} fill={color_a} opacity={0.2} />
          <path d={fill(p => Math.min(p, 0.5))} fill={color_b} opacity={0.2} />
          {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <g key={tick}>
              <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke={FURNITURE.grid} strokeDasharray={tick === 0.5 ? '4,4' : undefined} />
              <text x={margin.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={FURNITURE.textMuted}>
                {`${Math.round(tick * 100)}%`}
              </text>
            </g>
          ))}
          {ticks.map((date, i) => (
            <text key={date.toISOString()} x={x(date.getTime())} y={height - margin.bottom + 20} fontSize={12} fill={FURNITURE.textMuted}
              textAnchor={i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'}>
              {formatElectionDate(date, locale)}
            </text>
          ))}
          <path d={line} fill="none" stroke={FURNITURE.text} strokeWidth={2.5} />
          <circle cx={x(maxT)} cy={y(last)} r={5} fill={last >= 0.5 ? color_a : color_b} stroke={FURNITURE.surface} strokeWidth={2} />
          {hover != null && (
            <g pointerEvents="none">
              <line x1={tipX} x2={tipX} y1={margin.top} y2={height - margin.bottom} stroke={FURNITURE.text} strokeDasharray="3,3" />
              <circle cx={tipX} cy={y(filteredProbs[hover])} r={4} fill={FURNITURE.text} />
            </g>
          )}
        </svg>
        {hover != null && (
          <div aria-hidden="true" className="pointer-events-none absolute top-2 z-10 rounded-lg border border-line bg-cream px-3 py-2 text-xs text-ink"
            style={tipX > width / 2 ? { right: width - tipX + 8 } : { left: tipX + 8 }}>
            <div className="font-bold">{formatElectionDate(filteredDates[hover], locale)}</div>
            <div className="tabular-nums">{candidate_a} {translations.probability}: <strong>{formatElectionProbability(filteredProbs[hover], locale)}</strong></div>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm" style={{ background: color_a, opacity: 0.5 }} />{candidate_a} {translations.probability}</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm" style={{ background: color_b, opacity: 0.5 }} />{candidate_b} {translations.probability}</span>
        <span className="text-ink">{translations.lastValue} ({formatElectionDate(filteredDates[filteredDates.length - 1], locale)}): <strong>{leaderLast} {formatElectionProbability(leaderProb, locale)}</strong></span>
      </div>
      <ChartTable
        caption={translations.title}
        columns={[pt ? 'Data' : 'Date', `${candidate_a} ${translations.probability}`, `${candidate_b} ${translations.probability}`]}
        rows={filteredDates.map((d, i) => [formatElectionDate(d, locale), formatElectionProbability(filteredProbs[i] ?? 0, locale), formatElectionProbability(1 - (filteredProbs[i] ?? 0), locale)])}
      />
    </div>
  );
}
