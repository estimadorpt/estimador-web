import { describe, expect, it } from 'vitest';
import { activeBeat, readingLine } from './scroll';

describe('readingLine', () => {
  it('sits a little past the middle beside the text', () => {
    expect(readingLine(1000, true, 600)).toBe(550);
  });

  it('sits a third of the way into the text under a stacked stage', () => {
    expect(readingLine(800, false, 500)).toBeCloseTo(500 + 300 * 0.35);
  });

  it('keeps inside the window when the stage is off screen', () => {
    expect(readingLine(800, false, 1200)).toBe(800);
    expect(readingLine(800, false, -40)).toBeCloseTo(800 * 0.35);
  });
});

describe('activeBeat', () => {
  const beats = [
    { top: 100, height: 200 },
    { top: 300, height: 400 },
    { top: 700, height: 100 },
  ];

  it('holds the first beat, at its start, until the line reaches it', () => {
    expect(activeBeat(beats, 50)).toEqual({ index: 0, progress: 0 });
  });

  it('takes the last beat whose top has crossed the line', () => {
    expect(activeBeat(beats, 300)).toEqual({ index: 1, progress: 0 });
    expect(activeBeat(beats, 500)).toEqual({ index: 1, progress: 0.5 });
  });

  it('caps the progress at 1 past the last beat', () => {
    expect(activeBeat(beats, 2000)).toEqual({ index: 2, progress: 1 });
  });

  it('copes with no beats', () => {
    expect(activeBeat([], 100)).toEqual({ index: 0, progress: 0 });
  });
});
