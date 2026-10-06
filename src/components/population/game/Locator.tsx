'use client';

import { Check, X } from 'lucide-react';
import { ACCENT, FURNITURE } from '@/components/viz/theme';
import { BRAND } from '@/lib/brand';
import type { Locale } from '@/lib/population/labels';
import type { Parish } from '@/lib/population/places';
import { GAME_COPY } from './copy';
import { GUESS_RADIUS, placeMarkers } from './locator-layout';
import { OUTLINE_FRAMES, OUTLINE_HEIGHT, OUTLINE_PATHS, OUTLINE_WIDTH, type OutlineFrameName } from './outline';

const FRAME_NAMES = Object.keys(OUTLINE_FRAMES) as OutlineFrameName[];

/** A parish's representative point in the locator's pixels (mainland, or the Azores or Madeira inset). */
export function locate(point: { lat: number; lon: number }): { x: number; y: number } | null {
  for (const name of FRAME_NAMES) {
    const f = OUTLINE_FRAMES[name];
    if (point.lon >= f.lon[0] && point.lon <= f.lon[1] && point.lat >= f.lat[0] && point.lat <= f.lat[1]) {
      return { x: f.ox + (point.lon - f.lon[0]) * f.c * f.k, y: f.oy + (f.lat[1] - point.lat) * f.k };
    }
  }
  return null;
}

/**
 * The four parishes of the day on a light outline of Portugal, numbered 1–4 in
 * the order of the list. A parish ruled out by a wrong pick keeps its numeral
 * in full ink inside a quiet dashed ring, with a coral X beside it (the list
 * says it in a word); at the end the answer is ringed. Drawn at its real pixel size so
 * the numbers stay at 11px. Markers that would overlap move out on a short
 * leader line from a dot at their true point (PUB3-07). The figure's label,
 * and the key beside it when `withKey` is set, are its text alternative.
 */
export function Locator({ choices, ruledOut, answer, locale, withKey = false, scale = 1, className = '' }: {
  /** The four, in the order of the list. */
  choices: Parish[];
  /** Codes picked wrongly. */
  ruledOut: ReadonlySet<string>;
  /** The answer, once the game is over; null while it is a mystery. */
  answer: Parish | null;
  locale: Locale;
  /** List the four beside the map (the end panel); on the board, the choice list is the key. */
  withKey?: boolean;
  /** Drawn larger than its pixel size (the board's column has room); its 11px labels only grow. */
  scale?: number;
  className?: string;
}) {
  const t = GAME_COPY[locale];
  const points = choices
    .map((parish, i) => ({ parish, n: i + 1, at: locate(parish) }))
    .filter((p): p is { parish: Parish; n: number; at: { x: number; y: number } } => Boolean(p.at));
  const markers = placeMarkers(points.map(p => p.at), null, OUTLINE_WIDTH, OUTLINE_HEIGHT);
  const state = (parish: Parish) => (answer && parish.code === answer.code ? 'answer' : ruledOut.has(parish.code) ? 'out' : 'open');
  const label = [
    t.locatorTitle,
    ...choices.map((p, i) => {
      const s = state(p);
      return `${i + 1}. ${p.name}${s === 'answer' ? ` (${t.locatorAnswer})` : s === 'out' ? ` (${t.locatorRuledOut.toLowerCase()})` : ''}`;
    }),
  ].join('; ');

  const map = (
    <svg width={Math.round(OUTLINE_WIDTH * Math.max(1, scale))} height={Math.round(OUTLINE_HEIGHT * Math.max(1, scale))} viewBox={`0 0 ${OUTLINE_WIDTH} ${OUTLINE_HEIGHT}`} role="img" aria-label={label} className="block shrink-0">
      {FRAME_NAMES.map(name => {
        const f = OUTLINE_FRAMES[name];
        return (
          <g key={name}>
            {name !== 'mainland' && <rect x={f.ox - 3} y={f.oy - 3} width={f.w + 6} height={f.h + 6} rx={4} fill="none" stroke={FURNITURE.grid} />}
            <path d={OUTLINE_PATHS[name]} fill={BRAND.parchment} stroke={BRAND.parchment} strokeWidth={0.8} strokeLinejoin="round" />
          </g>
        );
      })}
      {points.map(({ parish, n }, i) => {
        const { at, label: spot, moved } = markers[i];
        const s = state(parish);
        const r = GUESS_RADIUS;
        return (
          <g key={parish.code}>
            {moved && (
              <>
                <line x1={at.x} y1={at.y} x2={spot.x} y2={spot.y} stroke={s === 'out' ? BRAND.muted : BRAND.ink} strokeWidth={1} />
                <circle cx={at.x} cy={at.y} r={2} fill={s === 'out' ? BRAND.muted : BRAND.ink} />
              </>
            )}
            {s === 'answer' && <circle cx={spot.x} cy={spot.y} r={r + 4} fill="none" stroke={ACCENT} strokeWidth={2.5} />}
            {/* Ruled out: the ring goes quiet (dashed, on parchment) and a coral X sits off the numeral, which stays in full ink. */}
            <circle
              cx={spot.x}
              cy={spot.y}
              r={r}
              fill={s === 'answer' ? BRAND.ink : s === 'out' ? BRAND.parchment : BRAND.cream}
              stroke={s === 'out' ? BRAND.muted : BRAND.ink}
              strokeWidth={s === 'out' ? 1 : 1.5}
              strokeDasharray={s === 'out' ? '2 2' : undefined}
            />
            <text x={spot.x} y={spot.y + 4} textAnchor="middle" fontSize="11" fontWeight={700} fill={s === 'answer' ? BRAND.paper : BRAND.ink} fontFamily={FURNITURE.font}>{n}</text>
            {s === 'out' && (
              <g transform={`translate(${spot.x + r - 1} ${spot.y - r + 1})`}>
                <circle r={4.5} fill={BRAND.coral} stroke={BRAND.cream} strokeWidth={1} />
                <path d="M -2 -2 L 2 2 M 2 -2 L -2 2" stroke={BRAND.ink} strokeWidth={1.3} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );

  return (
    <figure className={`rounded-2xl border border-line bg-cream p-4 ${className}`}>
      <figcaption className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{t.locatorTitle}</figcaption>
      {withKey ? (
        <div className="flex flex-col items-center gap-4 min-[480px]:flex-row min-[480px]:items-start">
          {map}
          {/* The key: the four, numbered as on the map, with their state in an icon and a word. */}
          <ol className="grid w-full min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 text-sm min-[480px]:flex min-[480px]:flex-col min-[480px]:gap-2.5" aria-hidden="true">
            {choices.map((parish, i) => {
              const s = state(parish);
              return (
                <li key={parish.code} className="flex items-start gap-2">
                  <span className={`mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink text-xs font-bold tabular-nums ${s === 'answer' ? 'bg-ink text-paper' : s === 'out' ? 'border-dashed bg-parchment text-ink' : 'bg-cream text-ink'}`}>{i + 1}</span>
                  <span className="min-w-0">
                    <span className={`block font-semibold leading-snug ${s === 'out' ? 'text-stone-500 line-through decoration-1' : 'text-ink'}`}>{parish.name}</span>
                    <span className="block text-xs text-stone-500">{parish.municipalityName}</span>
                    {s !== 'open' && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-ink">
                        {s === 'answer' ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <X aria-hidden="true" className="h-3.5 w-3.5" />}
                        {s === 'answer' ? t.locatorAnswer : t.locatorRuledOut}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <>
          <div className="flex justify-center">{map}</div>
          <p className="mt-2 text-xs text-stone-500">{t.locatorKey}</p>
        </>
      )}
    </figure>
  );
}
