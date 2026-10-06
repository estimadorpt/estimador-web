import { describe, expect, it } from 'vitest';
import { AZORES_GROUPS, azoresGroupBounds, azoresGroupOf, nearestShape, TAP_REACH_PX } from './islands';
import { COUNTRY_LABEL_SHORT, placeLabels, textWidth } from './placement';
import type { Bounds, Point } from './geometry';

describe('the Azores island groups (UXM3V-01)', () => {
  it('puts each of the 19 municípios in one group, by island', () => {
    const codes = ['4101', '4201', '4202', '4203', '4204', '4205', '4206', '4301', '4302', '4401', '4501', '4502', '4601', '4602', '4603', '4701', '4801', '4802', '4901'];
    const groups = codes.map(azoresGroupOf);
    expect(groups.every(Boolean)).toBe(true);
    expect(groups.filter(g => g === 'oriental')).toHaveLength(7);
    expect(groups.filter(g => g === 'central')).toHaveLength(9);
    expect(groups.filter(g => g === 'ocidental')).toHaveLength(3);
    expect(azoresGroupOf('1106')).toBeNull();
    expect(AZORES_GROUPS.map(g => g.id)).toEqual(['ocidental', 'central', 'oriental']);
  });

  it('frames a group by its own municípios', () => {
    const shapes = [
      { code: '4801', fit: [[0, 0], [1, 1]] as Bounds },
      { code: '4901', fit: [[0.5, -1], [1, 0]] as Bounds },
      { code: '4201', fit: [[10, 10], [12, 11]] as Bounds },
    ];
    expect(azoresGroupBounds(shapes, 'ocidental')).toEqual([[0, -1], [1, 1]]);
    expect(azoresGroupBounds(shapes, 'central')).toBeNull();
  });
});

describe('a tap beside a small shape', () => {
  const camera = { x: 0, y: 0, k: 1 };
  const viewport = { width: 200, height: 200 };
  // Screen = plane + 100 with this camera.
  const shape = (code: string, x0: number, y0: number, x1: number, y1: number) => ({ code, bounds: [[x0, y0], [x1, y1]] as Bounds, label: [(x0 + x1) / 2, (y0 + y1) / 2] as Point });
  const corvo = shape('4901', -2, -2, 1, 2);
  const flores = shape('4801', -10, 20, 5, 40);

  it('takes the nearest shape within 22px, and nothing farther', () => {
    expect(nearestShape([corvo, flores], [110, 100], camera, viewport)?.code).toBe('4901');
    expect(nearestShape([corvo, flores], [101 + TAP_REACH_PX + 1, 100], camera, viewport)).toBeNull();
    expect(nearestShape([corvo, flores], [100, 135], camera, viewport)?.code).toBe('4801');
  });

  it('breaks a tie inside two boxes by the nearer label', () => {
    const west = shape('a', 0, 0, 40, 40);
    const east = shape('b', 30, 0, 70, 40);
    expect(nearestShape([west, east], [100 + 36, 120], camera, viewport)?.code).toBe('b');
    expect(nearestShape([west, east], [100 + 32, 120], camera, viewport)?.code).toBe('a');
  });
});

describe('district names at country zoom (VUXD-09)', () => {
  const camera = { x: 0, y: 0, k: 1 };
  const viewport = { width: 400, height: 400 };

  it('shortens a name that does not fit, and keeps the full one when it does', () => {
    const narrow = { code: '16', text: 'Viana do Castelo', alternates: [COUNTRY_LABEL_SHORT['Viana do Castelo']], at: [0, 0] as Point, bounds: [[-30, -15], [30, 15]] as Bounds };
    expect(placeLabels([narrow], camera, viewport, 60, { maxRatio: 1.3 })).toEqual([{ code: '16', text: 'V. Castelo', x: 200, y: 200 }]);
    const wide = { ...narrow, bounds: [[-80, -15], [80, 15]] as Bounds };
    expect(placeLabels([wide], camera, viewport, 60, { maxRatio: 1.3 })[0].text).toBe('Viana do Castelo');
  });

  it('steps a name up or down, within its own shape, to clear a neighbour', () => {
    const big = { code: 'big', text: 'Bragança', at: [0, 0] as Point, bounds: [[-100, -40], [100, 40]] as Bounds };
    const small = { code: 'small', text: 'Vila Real', at: [0, 4] as Point, bounds: [[-50, -30], [50, 30]] as Bounds };
    expect(placeLabels([big, small], camera, viewport).map(label => label.code)).toEqual(['big']);
    const nudged = placeLabels([big, small], camera, viewport, 60, { nudge: true });
    expect(nudged.map(label => label.code)).toEqual(['big', 'small']);
    expect(Math.abs(nudged[1].y - nudged[0].y)).toBeGreaterThanOrEqual(12);
    expect(textWidth('Vila Real')).toBeGreaterThan(0);
  });
});
