import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { injuryReasonLabel, injuryReasonPt } from './football-labels';

// Every injury reason in a published injuries.json must have a Portuguese
// label, or a Portuguese match page prints Transfermarkt's English (audit F6:
// "Torn lateral knee ligament" on /pt/desporto/liga/jogo/rio-ave-nacional/).
// Part of `npm run check`, so a data sync that brings a new reason fails CI
// until the label is added here.

const FOOTBALL = path.join(process.cwd(), 'public/data/football');

function publishedReasons(): Map<string, string> {
  const found = new Map<string, string>();
  for (const season of readdirSync(FOOTBALL)) {
    const file = path.join(FOOTBALL, season, 'injuries.json');
    let raw: string;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if (key === 'reason' && typeof value === 'string' && value.trim()) found.set(value, season);
          else walk(value);
        }
      }
    };
    walk(JSON.parse(raw));
  }
  return found;
}

describe('injury reason labels', () => {
  it('cover every reason in the published injury snapshots', () => {
    const missing = [...publishedReasons()].filter(([reason]) => !(reason in injuryReasonPt));
    expect(missing.map(([reason, season]) => `${reason} (${season})`)).toEqual([]);
  });

  it('translate the reasons that reached the site untranslated', () => {
    expect(injuryReasonLabel('Torn lateral knee ligament', 'pt')).toBe('Rotura do ligamento lateral do joelho');
    expect(injuryReasonLabel('Broken ankle', 'pt')).toBe('Fratura do tornozelo');
    expect(injuryReasonLabel('Pubic bone bruise', 'pt')).toBe('Contusão no osso púbico');
  });

  it('keep English on English pages and fall back to the raw value', () => {
    expect(injuryReasonLabel('Broken ankle', 'en')).toBe('Broken ankle');
    expect(injuryReasonLabel('Something new', 'pt')).toBe('Something new');
    expect(injuryReasonLabel(null, 'pt')).toBe('');
  });
});
