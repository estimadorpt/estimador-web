import { describe, expect, it } from 'vitest';
import { spreadLabels } from './label-spread';

describe('end labels (audit UXD3-04)', () => {
  it('leaves labels that do not collide where they are', () => {
    expect(spreadLabels([20, 60, 120], 16, 230)).toEqual([20, 60, 120]);
  });

  it('never pushes a label below the plot: a crowd at the bottom stacks upwards', () => {
    // Vizela 8%, Torreense 7%, Chaves <1% at the end of the 2025-26 race.
    const out = spreadLabels([213, 215, 229], 16, 230);
    expect(Math.max(...out)).toBeLessThanOrEqual(230);
    for (let i = 1; i < out.length; i++) expect(out[i] - out[i - 1]).toBeGreaterThanOrEqual(13);
    expect(out).toEqual([204, 217, 230]);
  });

  it('keeps the order of the lines it labels', () => {
    const out = spreadLabels([30, 31, 32, 33], 16, 230);
    expect([...out].sort((a, b) => a - b)).toEqual(out);
  });
});
