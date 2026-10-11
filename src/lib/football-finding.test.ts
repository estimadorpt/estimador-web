import { describe, expect, it } from 'vitest';
import { seasonShareWords, titleFinding, titleSeasons } from './football-finding';

describe('seasonShareWords', () => {
  it('names a share by its tenth', () => {
    expect(seasonShareWords(0.507, 'pt')).toBe('em metade das épocas simuladas');
    expect(seasonShareWords(0.296, 'pt')).toBe('em três de cada dez épocas simuladas');
    expect(seasonShareWords(0.196, 'pt')).toBe('em duas de cada dez épocas simuladas');
    expect(seasonShareWords(0.507, 'en')).toBe('in half of the simulated seasons');
  });
  it('says "pouco mais/menos de" two points or more from the tenth', () => {
    expect(seasonShareWords(0.53, 'pt')).toBe('em pouco mais de metade das épocas simuladas');
    expect(seasonShareWords(0.37, 'pt')).toBe('em pouco menos de quatro de cada dez épocas simuladas');
    expect(seasonShareWords(0.62, 'en')).toBe('in just over six in ten simulated seasons');
  });
  it('has its own words at the ends', () => {
    expect(seasonShareWords(0.999, 'pt')).toBe('em quase todas as épocas simuladas');
    expect(seasonShareWords(0.96, 'pt')).toBe('em mais de nove de cada dez épocas simuladas');
    expect(seasonShareWords(0.01, 'pt')).toBe('em menos de uma de cada vinte épocas simuladas');
  });
});

describe('titleFinding', () => {
  it('reads as a sentence with the article in Portuguese', () => {
    expect(titleFinding('Porto', 0.507, 'pt')).toBe('O Porto ganha a Liga em metade das épocas simuladas');
    expect(titleFinding('Porto', 0.507, 'en')).toBe('Porto win the league in half of the simulated seasons');
  });
});

describe('titleSeasons', () => {
  it('prefers the published count, from the same number of simulations', () => {
    const paths = { Porto: { target: 'champion', n_target: 25335, n_sims: 50000 } };
    expect(titleSeasons('Porto', 0.507, 50000, paths)).toBe(25335);
    expect(titleSeasons('Porto', 0.507, 40000, paths)).toBe(20280);
    expect(titleSeasons('Benfica', 0.1958, 50000, paths)).toBe(9790);
  });
});
