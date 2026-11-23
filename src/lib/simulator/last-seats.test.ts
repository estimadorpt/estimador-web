import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SimulatorData } from './engine';
import { closeLastSeats } from './last-seats';

const data = JSON.parse(readFileSync(path.join(process.cwd(), 'public/data/elections/parliamentary-2025/simulator.json'), 'utf8')) as SimulatorData;

describe('closeLastSeats', () => {
  it('finds the eight 2025 last seats decided by fewer than 2 500 votes, Santarém closest', () => {
    const r = closeLastSeats(data.circles, 2500);
    expect(r.count).toBe(8);
    expect(r.total).toBe(22);
    expect(r.closest?.name).toBe('Santarém');
    expect(r.closest?.lastSeat).toEqual({ list: 'AD', runnerUp: { list: 'PS', votes: 492 } });
    // 492 + 668 + 776 + 1 018 + 1 139 + 1 643 + 2 204 + 2 306
    expect(r.votes).toBe(10246);
  });
});
