import { describe, expect, it } from 'vitest';
import { onScale } from './scale';

describe('onScale', () => {
  it('places a value as a percentage of its scale, clamped at the ends', () => {
    expect(onScale(50, 0, 100)).toBe('50.00%');
    expect(onScale(82, 0, 100)).toBe('82.00%');
    expect(onScale(-5, 0, 100)).toBe('0.00%');
    expect(onScale(120, 0, 100)).toBe('100.00%');
    expect(onScale(1, 1, 1)).toBe('0%');
  });
});
