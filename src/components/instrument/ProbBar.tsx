import { BRAND } from '@/lib/brand';

/** A probability as an ink bar on a 0–100 ruler, with no grey track. */
export function ProbBar({ p, width = 150, height = 14 }: { p: number; width?: number; height?: number }) {
  const x = (v: number) => (v / 100) * (width - 2) + 1;
  const ticks = [0, 25, 50, 75, 100];
  return (
    <svg className="block" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <rect x="1" y="2" width={Math.max(1, x(Math.min(1, Math.max(0, p)) * 100) - 1)} height="8" fill={BRAND.ink} />
      <line x1="1" x2={width - 1} y1="12.5" y2="12.5" stroke={BRAND.faint} />
      {ticks.map(v => (
        <line key={v} x1={x(v)} x2={x(v)} y1={v % 50 === 0 ? 10 : 12.5} y2={height} stroke={v % 50 === 0 ? BRAND.ink : BRAND.faint} />
      ))}
    </svg>
  );
}
