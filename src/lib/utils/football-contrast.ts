/** Text colour (stone-900 or white) that reads on a given hex background. */
export function readableTextOn(hex: string | undefined): string {
  const m = /^#?([a-f\d]{6})$/i.exec((hex ?? '').trim());
  if (!m) return '#ffffff';
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1c1917' : '#ffffff';
}
