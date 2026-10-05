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

export function placeLabels(candidates: LabelCandidate[], camera: Camera, viewport: Viewport, max = 60): PlacedLabel[] {
  const sized = candidates.map(candidate => {
    const [x0, y0] = toScreen(candidate.bounds[0], camera, viewport);
    const [x1, y1] = toScreen(candidate.bounds[1], camera, viewport);
    return { candidate, w: x1 - x0, h: y1 - y0 };
  }).sort((a, b) => b.w * b.h - a.w * a.h);
  const taken: Array<[number, number, number, number]> = [];
  const placed: PlacedLabel[] = [];
  for (const { candidate, w, h } of sized) {
    if (placed.length >= max) break;
    const width = textWidth(candidate.text);
    if (w < width * 0.95 || h < LABEL_SIZE + 6) continue;
    const [x, y] = toScreen(candidate.at, camera, viewport);
    const box: [number, number, number, number] = [x - width / 2 - 3, y - LABEL_SIZE / 2 - 3, x + width / 2 + 3, y + LABEL_SIZE / 2 + 3];
    if (box[0] < 4 || box[1] < 4 || box[2] > viewport.width - 4 || box[3] > viewport.height - 4) continue;
    if (taken.some(t => box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1])) continue;
    taken.push(box);
    placed.push({ code: candidate.code, text: candidate.text, x, y });
  }
  return placed;
}
