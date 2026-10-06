'use client';

import { ACCENT, FURNITURE } from '@/components/viz/theme';
import { BRAND } from '@/lib/brand';
import type { Locale } from '@/lib/population/labels';
import type { Parish } from '@/lib/population/places';
import { GAME_COPY } from './copy';
import { ANSWER_RADIUS, GUESS_RADIUS, placeMarkers } from './locator-layout';
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
 * Where the player has guessed, as numbered points on a light outline of
 * Portugal; the answer appears only when the game is over. Drawn at its real
 * pixel size so the numbers stay at 11px. The answer is drawn first and the
 * guesses over it; a guess that would sit on the answer or on another guess
 * moves out on a short leader line from a dot at its true point (PUB3-07), so
 * the closest guesses stay readable. The rows beside it are its text
 * alternative.
 */
export function Locator({ guesses, answer, locale }: { guesses: Parish[]; answer: Parish | null; locale: Locale }) {
  const t = GAME_COPY[locale];
  const target = answer ? locate(answer) : null;
  const points = guesses
    .map((parish, i) => ({ parish, n: i + 1, at: locate(parish) }))
    .filter((p): p is { parish: Parish; n: number; at: { x: number; y: number } } => Boolean(p.at) && p.parish.code !== answer?.code);
  const markers = placeMarkers(points.map(p => p.at), target, OUTLINE_WIDTH, OUTLINE_HEIGHT);
  const label = [
    t.locatorTitle,
    ...guesses.map((p, i) => `${i + 1}. ${p.name}`),
    answer ? `${t.locatorAnswer}: ${answer.name}` : '',
  ].filter(Boolean).join('; ');
  return (
    <figure className="rounded-2xl border border-line bg-cream p-4">
      <figcaption className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{t.locatorTitle}</figcaption>
      <svg width={OUTLINE_WIDTH} height={OUTLINE_HEIGHT} viewBox={`0 0 ${OUTLINE_WIDTH} ${OUTLINE_HEIGHT}`} role="img" aria-label={label} className="mx-auto block">
        {FRAME_NAMES.map(name => {
          const f = OUTLINE_FRAMES[name];
          return (
            <g key={name}>
              {name !== 'mainland' && <rect x={f.ox - 3} y={f.oy - 3} width={f.w + 6} height={f.h + 6} rx={4} fill="none" stroke={FURNITURE.grid} />}
              <path d={OUTLINE_PATHS[name]} fill={BRAND.parchment} stroke={BRAND.parchment} strokeWidth={0.8} strokeLinejoin="round" />
            </g>
          );
        })}
        {target && (
          <g>
            <circle cx={target.x} cy={target.y} r={ANSWER_RADIUS} fill="none" stroke={ACCENT} strokeWidth={2} />
            <circle cx={target.x} cy={target.y} r={5} fill={ACCENT} />
          </g>
        )}
        {points.map(({ n }, i) => {
          const { at, label, moved } = markers[i];
          return (
            <g key={n}>
              {moved && (
                <>
                  <line x1={at.x} y1={at.y} x2={label.x} y2={label.y} stroke={BRAND.ink} strokeWidth={1} />
                  <circle cx={at.x} cy={at.y} r={2} fill={BRAND.ink} />
                </>
              )}
              <circle cx={label.x} cy={label.y} r={GUESS_RADIUS} fill={BRAND.cream} stroke={BRAND.ink} strokeWidth={1.5} />
              <text x={label.x} y={label.y + 4} textAnchor="middle" fontSize="11" fontWeight={700} fill={BRAND.ink} fontFamily={FURNITURE.font}>{n}</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-stone-500">
        {guesses.length === 0 && !answer ? t.locatorEmpty : answer ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT }} />
            {t.locatorAnswer}
          </span>
        ) : t.locatorGuesses}
      </p>
    </figure>
  );
}
