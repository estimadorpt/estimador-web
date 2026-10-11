import { BRAND } from '@/lib/brand';

/**
 * A parish's quality tier on a map, as ink density and never as colour: A is
 * plain paper, B a single hatch, C a cross-hatch, so the caution reads as more
 * ink. The tier is metadata (how closely the generated population follows
 * INE's tables), not a statistic of the population, and no tier uses the
 * signal yellow. The hatch lines are the scale grey (#8a8a8a, 3.4:1 on white).
 *
 * The patterns sit in the map's own camera space; `scale` (1 / the camera's
 * zoom) keeps their spacing at HATCH_GAP screen pixels at every zoom.
 */
export const HATCH_GAP = 6;
const LINE = BRAND.faint;

export type Tier = 'A' | 'B' | 'C';

export function hatchTransform(scale: number): string {
  return `scale(${scale.toPrecision(6)}) rotate(45)`;
}

/** The fill a tier takes: paper for A, the pattern for B and C. */
export function tierFill(tier: Tier | undefined, uid: string): string {
  if (tier === 'B' || tier === 'C') return `url(#${uid}-tier-${tier})`;
  return BRAND.paper;
}

/** The two patterns, for one SVG: put them in its <defs>. */
export function TierPatterns({ uid, scale = 1 }: { uid: string; scale?: number }) {
  return (
    <>
      <pattern id={`${uid}-tier-B`} data-hatch="" width={HATCH_GAP} height={HATCH_GAP} patternUnits="userSpaceOnUse" patternTransform={hatchTransform(scale)}>
        <rect width={HATCH_GAP} height={HATCH_GAP} fill={BRAND.paper} />
        <rect width={1} height={HATCH_GAP} fill={LINE} />
      </pattern>
      <pattern id={`${uid}-tier-C`} data-hatch="" width={HATCH_GAP} height={HATCH_GAP} patternUnits="userSpaceOnUse" patternTransform={hatchTransform(scale)}>
        <rect width={HATCH_GAP} height={HATCH_GAP} fill={BRAND.paper} />
        <rect width={1} height={HATCH_GAP} fill={LINE} />
        <rect width={HATCH_GAP} height={1} fill={LINE} />
      </pattern>
    </>
  );
}

/**
 * The legend's swatch: the tier's fill in a ruled box (the letter beside it
 * carries the name). Drawn line by line inside a nested <svg>, which clips,
 * so it needs no pattern id and renders on the server too.
 */
export function TierSwatch({ tier }: { tier: Tier }) {
  const width = 24;
  const height = 18;
  const step = HATCH_GAP * Math.SQRT2;
  const starts: number[] = [];
  for (let x = -height; x < width + step; x += step) starts.push(x);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className="block shrink-0">
      <rect x={0} y={0} width={width} height={height} fill={BRAND.paper} />
      {tier !== 'A' && (
        <svg x={0} y={0} width={width} height={height}>
          {starts.map(x => <line key={`b${x}`} x1={x} y1={height} x2={x + height} y2={0} stroke={LINE} />)}
          {tier === 'C' && starts.map(x => <line key={`c${x}`} x1={x} y1={0} x2={x + height} y2={height} stroke={LINE} />)}
        </svg>
      )}
      <rect x={0.5} y={0.5} width={width - 1} height={height - 1} fill="none" stroke={LINE} />
    </svg>
  );
}
