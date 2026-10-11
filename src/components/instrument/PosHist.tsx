import { BRAND } from '@/lib/brand';

/**
 * Where a club can finish: one bar per place, 1st to 18th, with a small gap
 * before the two relegation places. Bars scale to 80% (a full-height bar);
 * the table twin carries the values.
 */
export function PosHist({ probs, barWidth = 3, gap = 1, height = 18, cut = 3, relegationFrom = 16 }: {
  probs: number[];
  barWidth?: number;
  gap?: number;
  height?: number;
  cut?: number;
  /** Index (0-based) of the first relegation place; the gap goes before it. */
  relegationFrom?: number;
}) {
  let x = 0;
  const bars = probs.map((p, i) => {
    if (i === relegationFrom) x += cut;
    const h = p <= 0.0005 ? 0 : Math.max(1, (Math.min(p, 0.8) / 0.8) * (height - 2));
    const bar = <rect key={i} x={x} y={(height - 1 - h).toFixed(2)} width={barWidth} height={h.toFixed(2)} fill={BRAND.ink} />;
    x += barWidth + gap;
    return bar;
  });
  const width = x - gap;
  return (
    <svg className="block" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {bars}
      <rect x="0" y={height - 1} width={width} height="1" fill="#bdbdbd" />
    </svg>
  );
}
