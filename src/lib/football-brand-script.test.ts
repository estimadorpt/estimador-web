import { describe, expect, it } from 'vitest';
import { ligaDisplayNames, teamColorOnPaper } from '@/lib/config/football';
import { titleFinding, titleSeasons } from '@/lib/football-finding';
import * as script from '../../scripts/lib/football-brand.mjs';
import { formatPercent as cardPercent, formatReadingTime as cardReadingTime } from '../../scripts/lib/og-render.mjs';
import { formatPercent, formatReadingTime } from '@/lib/football-format';

/**
 * The card generators run as plain node and keep their own copy of the club
 * names and the title finding (scripts/lib/football-brand.mjs). A share card
 * says what the page says: these hold the copy to the site's.
 */
const CLUBS = [...Object.keys(ligaDisplayNames), 'Oliveirense', 'Academica'];
const SHARES = Array.from({ length: 201 }, (_, i) => i / 200);

describe('the card generators’ football copy', () => {
  it('names every club the way the site does', () => {
    for (const team of Object.keys(ligaDisplayNames)) expect(script.teamName(team)).toBe(ligaDisplayNames[team]);
  });

  it('draws every club in its on-paper colour', () => {
    for (const team of Object.keys(script.TEAM_COLORS)) expect(script.teamColor(team)).toBe(teamColorOnPaper(team));
  });

  it('states the title finding in the site’s words', () => {
    for (const team of CLUBS) {
      for (const p of SHARES) {
        expect(script.titleFinding(team, p, 'pt')).toBe(titleFinding(team, p, 'pt'));
        expect(script.titleFinding(team, p, 'en')).toBe(titleFinding(team, p, 'en'));
      }
    }
  });

  it('counts the seasons the same way', () => {
    const paths = { Porto: { target: 'champion', n_target: 25335, n_sims: 50000 } };
    expect(script.titleSeasons('Porto', 0.507, 50000, paths)).toBe(titleSeasons('Porto', 0.507, 50000, paths));
    expect(script.titleSeasons('Benfica', 0.196, 50000, paths)).toBe(titleSeasons('Benfica', 0.196, 50000, paths));
  });

  it('dates a reading and prints a share as the site does', () => {
    for (const iso of ['2026-10-10T23:11:00Z', '2026-01-05T09:03:00Z', '2026-03-29T00:30:00Z']) {
      expect(cardReadingTime(iso, 'pt')).toBe(formatReadingTime(iso, 'pt'));
      expect(cardReadingTime(iso, 'en')).toBe(formatReadingTime(iso, 'en'));
    }
    for (const p of [0, 0.0002, 0.001, 0.0099, 0.05, 0.0996, 0.1, 0.507, 0.994, 0.996, 1]) {
      expect(`${cardPercent(p, 'pt')}%`).toBe(formatPercent(p, 'pt'));
      expect(`${cardPercent(p, 'en')}%`).toBe(formatPercent(p, 'en'));
    }
  });
});
