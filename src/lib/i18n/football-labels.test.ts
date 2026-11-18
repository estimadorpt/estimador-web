import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { composeInjuryReasonPt, injuryReasonLabel, injuryReasonPt } from './football-labels';

// A Portuguese page must never print Transfermarkt's English (audit F6:
// "Torn lateral knee ligament" on /pt/desporto/liga/jogo/rio-ave-nacional/).
// It also must not fail the build when the unattended data sync brings a
// reason nobody has labelled yet: on 17 Oct 2026 that turned main red and
// stopped every deploy. So a new reason gets a composed or generic
// Portuguese label, and this test only lists it (console warning) so a
// precise label can be added to `injuryReasonPt` at leisure.

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
  it('give every published reason a Portuguese label, and list the ones without an exact entry', () => {
    const reasons = [...publishedReasons()];
    for (const [reason] of reasons) {
      expect(injuryReasonLabel(reason, 'pt')).not.toBe(reason);
    }
    const unlabelled = reasons.filter(([reason]) => !(reason in injuryReasonPt));
    if (unlabelled.length) {
      console.warn(
        `Injury reasons without an exact Portuguese label (shown as "${unlabelled
          .map(([r]) => `${r} → ${injuryReasonLabel(r, 'pt')}`)
          .join('", "')}"); add them to injuryReasonPt.`,
      );
    }
  });

  it('never print English on a Portuguese page, whatever Transfermarkt sends next', () => {
    expect(injuryReasonLabel('Wrist injury', 'pt')).toBe('Lesão no pulso');
    expect(injuryReasonLabel('Broken collarbone', 'pt')).toBe('Fratura da clavícula');
    expect(injuryReasonLabel('Torn calf muscle', 'pt')).toBe('Rotura do músculo da barriga da perna');
    expect(injuryReasonLabel('Groin strain', 'pt')).toBe('Distensão na virilha');
    expect(injuryReasonLabel('Rib fracture', 'pt')).toBe('Fratura da costela');
    expect(injuryReasonLabel('Torn knee ligaments', 'pt')).toBe('Rotura dos ligamentos do joelho');
    expect(injuryReasonLabel('Corona virus', 'pt')).toBe('Indisponível');
    expect(injuryReasonLabel('Red card suspension', 'pt', 'suspension')).toBe('Suspensão');
    expect(composeInjuryReasonPt('Mystery problem in the spleen')).toBeNull();
  });

  it('translate the reasons that reached the site untranslated', () => {
    expect(injuryReasonLabel('Torn lateral knee ligament', 'pt')).toBe('Rotura do ligamento lateral do joelho');
    expect(injuryReasonLabel('Broken ankle', 'pt')).toBe('Fratura do tornozelo');
    expect(injuryReasonLabel('Pubic bone bruise', 'pt')).toBe('Contusão no osso púbico');
  });

  it('keep English on English pages and fall back to the raw value', () => {
    expect(injuryReasonLabel('Broken ankle', 'en')).toBe('Broken ankle');
    expect(injuryReasonLabel('Something new', 'en')).toBe('Something new');
    expect(injuryReasonLabel(null, 'pt')).toBe('');
  });
});
