/**
 * How the scroll position becomes a scene: pure functions of what the shell
 * measures, so the boundaries can be tested without a browser.
 */

/**
 * Where the reader's eye is taken to be, in viewport pixels from the top. Beside
 * the text, a little past the middle of the window; stacked, the text shows under
 * the stage, so the line sits a third of the way into what is left below it.
 */
export function readingLine(viewportHeight: number, beside: boolean, stageBottom: number | null): number {
  if (beside || stageBottom === null) return viewportHeight * 0.55;
  const bottom = Math.min(viewportHeight, Math.max(0, stageBottom));
  return bottom + (viewportHeight - bottom) * 0.35;
}

/**
 * The beat the reading line is in: the last whose top has crossed it (the first
 * while none has), and how far the line is through it, from 0 to 1.
 */
export function activeBeat(beats: { top: number; height: number }[], line: number): { index: number; progress: number } {
  let index = 0;
  beats.forEach((b, i) => { if (b.top <= line) index = i; });
  const b = beats[index];
  const progress = b ? Math.min(1, Math.max(0, (line - b.top) / Math.max(1, b.height))) : 0;
  return { index, progress };
}
