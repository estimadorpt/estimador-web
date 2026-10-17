import { BRAND } from '@/lib/brand';
import { SERIES } from '@/components/viz/theme';
import { ageBand } from '@/lib/population/method-example';

/**
 * One invented household of the methodology's example, drawn the way the
 * miniatura draws its homes: a front-on house in ink lines and its people as
 * figures whose bodies take their age group's series colour (the same colours,
 * in the same order, as /populacao/miniatura). Children are shorter. The ages
 * are printed under the house, so the colour never carries the age alone.
 *
 * `masked`: ruled out before anything else (a terracotta cross, as the game's
 * crossed-out parishes); `chosen`: kept in the final population (the roof
 * filled with ink, as a chosen box); `faded`: not chosen.
 */
export type HouseState = 'plain' | 'masked' | 'chosen' | 'faded';

const STEP = 11;

export function houseWidth(people: number): number {
  return Math.max(2, people) * STEP + 14;
}

export function HouseGlyph({ ages, state = 'plain', kind = 'home', scale = 1.2 }: { ages: number[]; state?: HouseState; kind?: 'home' | 'collective'; scale?: number }) {
  const w = houseWidth(ages.length);
  const h = 46;
  const faded = state === 'faded' || state === 'masked';
  const line = faded ? BRAND.line : BRAND.ink;
  const roof = state === 'chosen' ? BRAND.ink : BRAND.parchment;
  const body = 18;
  return (
    <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false" className="block overflow-visible">
      {kind === 'home'
        ? <path d={`M1.5 ${body} L${w / 2} 2 L${w - 1.5} ${body} Z`} fill={roof} stroke={line} strokeWidth={state === 'chosen' ? 1.5 : 1} strokeLinejoin="round" />
        : <rect x={1.5} y={body - 8} width={w - 3} height={8} fill={roof} stroke={line} strokeWidth={state === 'chosen' ? 1.5 : 1} />}
      <rect x={3.5} y={body} width={w - 7} height={h - body - 1} fill={BRAND.paper} stroke={line} strokeWidth={state === 'chosen' ? 1.5 : 1} />
      {ages.map((age, i) => {
        const band = ageBand(age);
        const tall = band === 0 ? 0.68 : 1;
        const x = (w - ages.length * STEP) / 2 + STEP * i + STEP / 2;
        const foot = h - 4;
        const top = foot - 20 * tall;
        return (
          <g key={i} opacity={faded ? 0.3 : 1}>
            <circle cx={x} cy={top + 2.6 * tall} r={2.6 * tall} fill={BRAND.ink} />
            <rect x={x - 2.8} y={top + 5.6 * tall} width={5.6} height={8.4 * tall} fill={SERIES[band]} />
            <path d={`M${x - 1.4} ${top + 14 * tall} L${x - 2} ${foot} M${x + 1.4} ${top + 14 * tall} L${x + 2} ${foot}`} stroke={BRAND.ink} strokeWidth={1.2} fill="none" />
          </g>
        );
      })}
      {state === 'masked' && (
        <path d={`M6 ${body - 4} L${w - 6} ${h - 2} M${w - 6} ${body - 4} L6 ${h - 2}`} stroke={BRAND.terracotta} strokeWidth={2} strokeLinecap="square" />
      )}
    </svg>
  );
}
