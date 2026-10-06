import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { kickerWithoutBack } from './hero-kicker';

describe('a hero kicker under a back link (CL3-07)', () => {
  it('drops the section name the back link already says', () => {
    expect(kickerWithoutBack('Liga Portugal · Jogadores', 'Liga Portugal')).toBe('Jogadores');
    expect(kickerWithoutBack('População sintética · dados · versão 1.0.3', 'População sintética')).toBe('Dados · versão 1.0.3');
    expect(kickerWithoutBack('Liga Portugal · 2026-27 · depois da jornada 7', 'Liga Portugal')).toBe('2026-27 · depois da jornada 7');
    // A player page: "← Jogadores" over "Liga Portugal · Jogadores".
    expect(kickerWithoutBack('Liga Portugal · Jogadores', 'Jogadores')).toBe('Liga Portugal');
  });

  it('drops a kicker that only repeats the back link', () => {
    expect(kickerWithoutBack('Liga Portugal', 'Liga Portugal')).toBeNull();
  });

  it('leaves other kickers, and anything that is not plain text, as they are', () => {
    expect(kickerWithoutBack('Metodologia', 'Liga Portugal')).toBe('Metodologia');
    expect(kickerWithoutBack('Explicador · pessoas imaginadas', 'População sintética')).toBe('Explicador · pessoas imaginadas');
    const element = createElement('span', null, 'Liga Portugal');
    expect(kickerWithoutBack(element, 'Liga Portugal')).toBe(element);
    expect(kickerWithoutBack('Liga Portugal', element)).toBe('Liga Portugal');
    expect(kickerWithoutBack(undefined, 'Liga Portugal')).toBeUndefined();
  });
});
