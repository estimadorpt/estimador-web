import { describe, expect, it } from 'vitest';
import { POPULATION_RELEASE } from '@/lib/config/population';
import { otherReleaseText } from './other-release';

describe('a link to an earlier release (PRO3-07)', () => {
  it('says what changed since 1.0.1, question by question, and that the people are the same', () => {
    const pt = otherReleaseText('1.0.1', 'pt');
    expect(pt).toContain(`versão 1.0.1; o site mostra a ${POPULATION_RELEASE}`);
    expect(pt).toContain('As pessoas e os agregados gerados são os mesmos');
    expect(pt).toContain('idades, escolaridade, condição perante o trabalho');
    expect(pt).toContain('agregados privados');
    // The old sentence said figures from different releases never stand in for one another.
    expect(pt).not.toMatch(/não se substituem/);
    expect(otherReleaseText('1.0.1', 'en')).toContain('The generated people and households are the same in both');
  });

  it('says 1.0.0 hid about half the parish answers', () => {
    expect(otherReleaseText('1.0.0', 'pt')).toContain('cerca de metade das respostas das freguesias');
    expect(otherReleaseText('1.0.0', 'en')).toContain('about half the parish answers');
  });

  it('makes no claim about a release it does not know', () => {
    const text = otherReleaseText('1.0.2', 'pt');
    expect(text).toContain('podem não coincidir');
    expect(text).not.toContain('mesmos números');
  });
});
