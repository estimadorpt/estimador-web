import { describe, expect, it } from 'vitest';
import { distanceSentence, publishedPoints, revealSentence, roundedOf100 } from './guess-reveal';

describe('the guess-first reveal', () => {
  it('reads the value as printed and rounds it as a reader would, halves up', () => {
    expect(publishedPoints('17,5%', 0.1749)).toBe(17.5);
    expect(publishedPoints('17.5%', 0.1749)).toBe(17.5);
    expect(publishedPoints('—', 0.2)).toBeCloseTo(20);
    expect(roundedOf100(17.5)).toBe(18);
    expect(roundedOf100(39.4)).toBe(39);
    expect(roundedOf100(0)).toBe(0);
    expect(roundedOf100(100)).toBe(100);
  });

  it('states the value as a sentence in the card’s unit', () => {
    expect(revealSentence('elders_alone', 39.4, 'em Arroios', 'pt'))
      .toBe('Cerca de 39 em cada 100 pessoas com 65 ou mais anos em agregados privados em Arroios vivem sozinhas.');
    expect(revealSentence('multigenerational', 12.1, 'nesta freguesia', 'pt'))
      .toBe('Cerca de 12 em cada 100 agregados privados nesta freguesia juntam uma criança e uma pessoa com 65 ou mais anos.');
    expect(revealSentence('elders_alone', 39.4, 'in Arroios', 'en'))
      .toBe('About 39 in every 100 people aged 65 or over in private households in Arroios live alone.');
  });

  it('agrees in number at one and below, and never says "cerca de 0"', () => {
    expect(revealSentence('elders_alone', 1.2, 'aqui', 'pt')).toMatch(/^Cerca de 1 em cada 100 .* vive sozinha\.$/);
    expect(revealSentence('elders_alone', 0.3, 'aqui', 'pt')).toMatch(/^Menos de 1 em cada 100 .* vive sozinha\.$/);
    expect(revealSentence('multigenerational', 0, 'aqui', 'pt')).toMatch(/^0 em cada 100 agregados .* juntam /);
    expect(revealSentence('multigenerational', 0.4, 'here', 'en')).toMatch(/^Fewer than 1 in every 100 .* brings together/);
  });

  it('says how close the guess came as a word with its band, never as a computed number', () => {
    expect(distanceSentence(38, 39.4, 'pt')).toBe('O teu palpite, 38, ficou muito perto do valor publicado: a 3 pontos ou menos.');
    expect(distanceSentence(30, 39.4, 'pt')).toBe('O teu palpite, 30, ficou perto, abaixo do valor publicado: a 10 pontos ou menos.');
    expect(distanceSentence(50, 39.4, 'pt')).toBe('O teu palpite, 50, ficou longe, acima do valor publicado: a mais de 10 pontos.');
    expect(distanceSentence(30, 39.4, 'en')).toBe('Your guess, 30, was close, below the published value: within 10 points.');
    // No sentence prints the distance itself (handoff §3).
    for (const g of [0, 12, 38, 50, 77, 100]) {
      expect(distanceSentence(g, 39.4, 'pt')).not.toMatch(/\b(1[1-9]|[2-9]\d|[4-9]) pontos? (acima|abaixo)/);
    }
  });
});
