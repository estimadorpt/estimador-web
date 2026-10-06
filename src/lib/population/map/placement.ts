/**
 * Label placement on the map: a name is drawn only where it fits inside its
 * own shape at the current zoom and does not collide with another. Larger
 * shapes are placed first — an order by drawn size, which is geometry, not a
 * statistic about the place.
 */
import { toScreen, type Camera, type Viewport } from './camera';
import type { Bounds, Point } from './geometry';

export interface LabelCandidate {
  code: string;
  text: string;
  /** Shorter forms to try when `text` does not fit ("V. Castelo"). */
  alternates?: string[];
  /** Anchor in the map plane. */
  at: Point;
  bounds: Bounds;
}

export interface PlacedLabel {
  code: string;
  text: string;
  x: number;
  y: number;
}

/** Manrope at 12px, semibold: a generous average advance per character. */
export const LABEL_SIZE = 12;
const CHAR = 6.6;

export function textWidth(text: string, size = LABEL_SIZE): number {
  return text.length * CHAR * (size / LABEL_SIZE) + 4;
}

/**
 * District names that may be shortened at country zoom, where Viana do
 * Castelo's district is narrower than its name (VUXD-09).
 */
export const COUNTRY_LABEL_SHORT: Record<string, string> = {
  'Viana do Castelo': 'V. Castelo',
  'Castelo Branco': 'C. Branco',
};

export interface PlaceOptions {
  /** How much wider than its shape a name may be (default: about its own width). */
  maxRatio?: number;
  /** Try the name a little above or below its anchor when it collides (inside the shape's box). */
  nudge?: boolean;
}

/** Vertical steps tried, in pixels, when nudging a name off a neighbour's. */
const NUDGES = [0, -9, 9, -16, 16];

export function placeLabels(candidates: LabelCandidate[], camera: Camera, viewport: Viewport, max = 60, { maxRatio = 1 / 0.95, nudge = false }: PlaceOptions = {}): PlacedLabel[] {
  const sized = candidates.map(candidate => {
    const [x0, y0] = toScreen(candidate.bounds[0], camera, viewport);
    const [x1, y1] = toScreen(candidate.bounds[1], camera, viewport);
    return { candidate, w: x1 - x0, h: y1 - y0, top: y0, bottom: y1 };
  }).sort((a, b) => b.w * b.h - a.w * a.h);
  const taken: Array<[number, number, number, number]> = [];
  const placed: PlacedLabel[] = [];
  for (const { candidate, w, h, top, bottom } of sized) {
    if (placed.length >= max) break;
    if (h < LABEL_SIZE + 6) continue;
    const [ax, ay] = toScreen(candidate.at, camera, viewport);
    let done = false;
    for (const text of [candidate.text, ...(candidate.alternates ?? [])]) {
      const width = textWidth(text);
      if (width > w * maxRatio) continue;
      for (const dy of nudge ? NUDGES : [0]) {
        const x = ax;
        const y = ay + dy;
        // A nudged name stays over its own shape's box.
        if (dy !== 0 && (y - LABEL_SIZE / 2 < top || y + LABEL_SIZE / 2 > bottom)) continue;
        const box: [number, number, number, number] = [x - width / 2 - 3, y - LABEL_SIZE / 2 - 3, x + width / 2 + 3, y + LABEL_SIZE / 2 + 3];
        if (box[0] < 4 || box[1] < 4 || box[2] > viewport.width - 4 || box[3] > viewport.height - 4) continue;
        if (taken.some(t => box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1])) continue;
        taken.push(box);
        placed.push({ code: candidate.code, text, x, y });
        done = true;
        break;
      }
      if (done) break;
    }
  }
  return placed;
}
