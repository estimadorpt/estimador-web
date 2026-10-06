import { describe, expect, it } from 'vitest';
import { ANSWER_RADIUS, GUESS_RADIUS, placeMarkers } from './locator-layout';

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('the locator markers (PUB3-07)', () => {
  it('leaves a guess where it is when nothing is in the way', () => {
    const [marker] = placeMarkers([{ x: 50, y: 50 }], { x: 120, y: 150 }, 180, 222);
    expect(marker).toEqual({ at: { x: 50, y: 50 }, label: { x: 50, y: 50 }, moved: false });
  });

  it('moves the guesses that sit under the answer, or under each other, out of the way, inside the frame', () => {
    // The audited loss: Fafe (13 km) and Caldelas (7 km) at about 0.36 px per km from the answer.
    const answer = { x: 108, y: 40 };
    const points = [{ x: 140, y: 120 }, { x: 110, y: 44 }, { x: 106, y: 38 }, { x: 109, y: 41 }];
    const markers = placeMarkers(points, answer, 180, 222);
    expect(markers[0].moved).toBe(false);
    for (const marker of markers.slice(1)) {
      expect(marker.moved).toBe(true);
      expect(distance(marker.label, answer)).toBeGreaterThanOrEqual(GUESS_RADIUS + ANSWER_RADIUS);
      expect(marker.label.x).toBeGreaterThanOrEqual(GUESS_RADIUS);
      expect(marker.label.x).toBeLessThanOrEqual(180 - GUESS_RADIUS);
      expect(marker.label.y).toBeGreaterThanOrEqual(GUESS_RADIUS);
    }
    // No two numbered circles overlap.
    for (let i = 0; i < markers.length; i++) {
      for (let j = i + 1; j < markers.length; j++) {
        expect(distance(markers[i].label, markers[j].label)).toBeGreaterThanOrEqual(2 * GUESS_RADIUS);
      }
    }
    // The true point is kept, for the leader line and its dot.
    expect(markers[1].at).toEqual(points[1]);
  });

  it('spreads guesses that overlap while the game is still on (no answer drawn)', () => {
    const markers = placeMarkers([{ x: 60, y: 60 }, { x: 62, y: 61 }], null, 180, 222);
    expect(markers[0].moved).toBe(false);
    expect(markers[1].moved).toBe(true);
    expect(distance(markers[0].label, markers[1].label)).toBeGreaterThanOrEqual(2 * GUESS_RADIUS);
  });
});
