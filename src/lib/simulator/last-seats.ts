import type { SimulatorCircle } from './engine';

/**
 * The 2025 last seats that hung on fewer than `under` votes: how many circles, the
 * votes those margins add up to, and the closest one (the section's finding and
 * standfirst on /eleicoes/legislativas).
 */
export function closeLastSeats(circles: SimulatorCircle[], under: number) {
  const close = circles
    .filter(c => c.lastSeat.runnerUp != null && c.lastSeat.runnerUp.votes < under)
    .sort((a, b) => a.lastSeat.runnerUp!.votes - b.lastSeat.runnerUp!.votes);
  return {
    count: close.length,
    total: circles.length,
    votes: close.reduce((a, c) => a + c.lastSeat.runnerUp!.votes, 0),
    closest: close[0] ?? null,
  };
}
