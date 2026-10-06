/** Minimum vertical gap between two end labels (11px text). */
const LABEL_GAP = 13;

/**
 * End-label positions, pushed apart in both directions so none overprints
 * another and none leaves the plot: down from the top, then, when the
 * lowest label passes the bottom bound, back up from it (audit UXD3-04:
 * "Desp. Chaves <1%" used to land on the "J25" tick). Input sorted by y.
 */
export function spreadLabels(ys: number[], top: number, bottom: number, gap = LABEL_GAP): number[] {
  const out = ys.map(y => Math.min(Math.max(y, top), bottom));
  for (let i = 1; i < out.length; i++) {
    if (out[i] - out[i - 1] < gap) out[i] = out[i - 1] + gap;
  }
  if (out.length && out[out.length - 1] > bottom) {
    out[out.length - 1] = bottom;
    for (let i = out.length - 2; i >= 0; i--) {
      if (out[i + 1] - out[i] < gap) out[i] = out[i + 1] - gap;
    }
  }
  return out;
}
