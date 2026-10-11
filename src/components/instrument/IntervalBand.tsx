import type { CSSProperties } from 'react';
import { onScale } from './scale';

export interface IntervalBandProps {
  /** The interval's low end, median and high end, in the scale's units. */
  lo: number;
  md: number;
  hi: number;
  /** The scale the cell spans; a Ruler over the column uses the same one. */
  min: number;
  max: number;
  /** What has already happened (points today): an ink square. */
  now?: number | null;
  /** The outcome, once known: an ink marker on the band. */
  result?: number | null;
  /** A dashed reference line (zero, a threshold). */
  reference?: number | null;
  /** A de-emphasised band (mid-table rows). */
  low?: boolean;
  /** Announce the reading; without it the band is decorative and the row's figures carry it. */
  label?: string;
  className?: string;
}

/**
 * The model's margin: a yellow band between ink caps with an ink median
 * tick, on the cell's own scale. Pure CSS (`.iv` in globals.css), so it
 * renders on the server and scales with its column. Yellow means this and
 * nothing else on the site.
 */
export function IntervalBand({ lo, md, hi, min, max, now = null, result = null, reference = null, low = false, label, className = '' }: IntervalBandProps) {
  const style = {
    '--lo': onScale(lo, min, max),
    '--hi': onScale(hi, min, max),
    '--md': onScale(md, min, max),
    ...(now != null ? { '--now': onScale(now, min, max) } : {}),
    ...(result != null ? { '--res': onScale(result, min, max) } : {}),
    ...(reference != null ? { '--ref': onScale(reference, min, max) } : {}),
  } as CSSProperties;
  return (
    <span
      className={`iv${low ? ' low' : ''} ${className}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {reference != null && <span className="iv-ref" />}
      {now != null && <s />}
      <b />
      <i />
      {result != null && <u />}
    </span>
  );
}
