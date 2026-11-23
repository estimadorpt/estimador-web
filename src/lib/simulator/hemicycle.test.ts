import { describe, expect, it } from 'vitest';
import { hemicycleLayout } from './hemicycle';

describe('hemicycleLayout', () => {
  it('draws exactly 230 seats, half on each side of the top of the arc', () => {
    const seats = hemicycleLayout(230);
    expect(seats).toHaveLength(230);
    const left = seats.filter(s => s.angle > Math.PI / 2 + 1e-9).length;
    const right = seats.filter(s => s.angle < Math.PI / 2 - 1e-9).length;
    expect(left).toBe(right);
    // Seats are ordered left to right, so the 116th is at the top or past it: a list (or a
    // bloc drawn from one end) that reaches the line at the top has a majority.
    expect(seats[115].angle).toBeLessThanOrEqual(Math.PI / 2 + 1e-9);
    expect(seats[114].angle).toBeGreaterThanOrEqual(Math.PI / 2 - 1e-9);
  });

  it('keeps the count for other sizes too', () => {
    for (const n of [100, 179, 226, 250]) expect(hemicycleLayout(n)).toHaveLength(n);
  });
});
