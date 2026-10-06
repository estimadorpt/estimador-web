import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { forecastProvenance } from './season-review-provenance';

describe('forecastProvenance', () => {
  it('separates a one-minute batch from staggered publications', () => {
    const p = forecastProvenance([
      { matchday: 4, timestamp: '2026-03-04T13:25:46Z', model: 'old' },
      { matchday: 6, timestamp: '2026-03-04T13:25:53Z', model: 'old' },
      { matchday: 8, timestamp: '2026-03-04T13:25:59Z', model: 'old' },
      { matchday: 23, timestamp: '2026-03-06T15:01:44Z', model: 'old' },
      { matchday: 24, timestamp: '2026-03-08T08:23:32Z', model: 'old' },
      { matchday: 25, timestamp: '2026-03-08T21:30:22Z', model: 'old' },
    ]);
    expect(p.reconstructed).toEqual([4, 6, 8]);
    expect(p.published).toEqual([23, 24, 25]);
    expect(p.reconstructedOn).toBe('2026-03-04');
    expect(p.models).toEqual(['old']);
  });

  it('calls two files on the same evening published, not a batch', () => {
    const p = forecastProvenance([
      { matchday: 24, timestamp: '2026-03-08T08:23:32Z' },
      { matchday: 25, timestamp: '2026-03-08T08:25:00Z' },
    ]);
    expect(p.reconstructed).toEqual([]);
    expect(p.reconstructedOn).toBeNull();
  });

  it('classifies the real 2025-26 archive as 10 reconstructed and 9 published', () => {
    const dir = path.join(process.cwd(), 'public/data/football/liga-2025-26');
    const stamps = readdirSync(dir)
      .filter((f) => /^md\d+\.json$/.test(f))
      .map((f) => {
        const d = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
        return { matchday: d.matchday ?? Number(f.slice(2, 4)), timestamp: d.timestamp, model: d.model };
      });
    const p = forecastProvenance(stamps);
    expect(p.reconstructed).toEqual([4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
    expect(p.published).toEqual([23, 24, 25, 26, 27, 28, 29, 30, 31]);
    expect(p.reconstructedOn).toBe('2026-03-04');
    expect(p.models).toEqual(['joint_sot']);
  });
});
