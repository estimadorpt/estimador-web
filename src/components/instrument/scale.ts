/** A value's place on a scale, as a CSS percentage (clamped to the scale's ends). */
export function onScale(value: number, min: number, max: number): string {
  const span = max - min;
  if (!(span > 0)) return '0%';
  const t = Math.min(1, Math.max(0, (value - min) / span));
  return `${(t * 100).toFixed(2)}%`;
}
