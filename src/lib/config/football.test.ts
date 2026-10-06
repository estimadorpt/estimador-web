import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  distinctTeamColors,
  ligaTeamColors,
  liga2Initials,
  teamColorOnPaper,
  teamPhoneName,
} from './football';

const PAPER = '#f5f3ea';

describe('team colours on paper', () => {
  it('reaches 3:1 on the page ground for every club', () => {
    for (const team of Object.keys(ligaTeamColors)) {
      expect(contrastRatio(teamColorOnPaper(team), PAPER), team).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps a club colour that already reads, and darkens the yellows', () => {
    expect(teamColorOnPaper('Porto')).toBe('#003893');
    expect(teamColorOnPaper('Estoril')).not.toBe('#FFD700');
    expect(contrastRatio('#FFD700', PAPER)).toBeLessThan(2);
  });

  it('gives look-alike clubs on one chart different lines', () => {
    const colours = distinctTeamColors(['Nacional', 'Maritimo', 'Rio Ave', 'Vitoria SC']);
    expect(colours.Maritimo).not.toBe(colours['Rio Ave']);
    expect(colours.Nacional).not.toBe(colours['Vitoria SC']);
    for (const c of Object.values(colours)) expect(contrastRatio(c, PAPER)).toBeGreaterThanOrEqual(3);
  });
});

describe('short names', () => {
  it('uses words, not codes, in the narrow table', () => {
    expect(teamPhoneName('Santa Clara')).toBe('Sta. Clara');
    expect(teamPhoneName('Estrela Amadora')).toBe('Estrela');
    expect(teamPhoneName('Porto')).toBe('Porto');
  });

  it('fits Liga 2 badges with two letters', () => {
    expect(liga2Initials('Pacos Ferreira')).toBe('PF');
    expect(liga2Initials('Leixoes')).toBe('LE');
    for (const t of ['Academica', 'Uniao Leiria', 'Cova da Piedade', 'Sporting CP B']) {
      expect(liga2Initials(t).length).toBeLessThanOrEqual(2);
    }
  });
});
