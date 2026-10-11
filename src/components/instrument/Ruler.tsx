import type { CSSProperties } from 'react';
import { onScale } from './scale';

/**
 * The ruler printed in a column head, on the same scale as the bands below
 * it: minor and major ticks drawn in CSS, labels at the given values.
 */
export function Ruler({ min, max, minor, major, labels, format = (v: number) => String(v), unit = '', className = '' }: {
  min: number;
  max: number;
  minor: number;
  major: number;
  labels: number[];
  format?: (v: number) => string;
  /** Printed after the last label only. */
  unit?: string;
  className?: string;
}) {
  const span = max - min;
  const style = {
    '--minor': `${((minor / span) * 100).toFixed(4)}%`,
    '--major': `${((major / span) * 100).toFixed(4)}%`,
  } as CSSProperties;
  return (
    <span className={`ruler ${className}`} style={style} aria-hidden="true">
      {labels.map((v, i) => (
        <span key={v} className={v === min ? 'ruler-start' : v === max ? 'ruler-end' : undefined} style={{ left: onScale(v, min, max) }}>
          {format(v)}{i === labels.length - 1 ? unit : ''}
        </span>
      ))}
    </span>
  );
}
