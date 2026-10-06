import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  crossingSentence,
  crossings,
  gamesOfMatchdays,
  matchdayListPhrase,
  modelPlainName,
  openingLineSentence,
  phaseMatchdays,
  pointsCalibrationSentence,
  predictedMatchday,
  readingRule,
  TITLE_CALIBRATION,
  titleCalibrationParagraphs,
  uncertaintyNote,
  verdictLine,
  type ScorecardForCopy,
} from './football-model-evaluation';

const scorecard = JSON.parse(
  readFileSync(path.join(process.cwd(), 'public/data/football/liga-2026-27/market_scorecard.json'), 'utf8'),
) as ScorecardForCopy & { calibration: Parameters<typeof pointsCalibrationSentence>[0] };

describe('the /modelo uncertainty note (audit B2)', () => {
  it('agrees with the verdict cards: market ahead overall and early, a tie after', () => {
    const pt = uncertaintyNote(scorecard, 'pt');
    expect(pt).toContain('No conjunto, a diferença é +0,0050 com um erro padrão de 0,0016 (t = 3,07): o mercado está à frente.');
    expect(pt).toContain('No início da época (jogos das jornadas 2 a 11), t = 2,99: o mercado está à frente.');
    expect(pt).toContain('No resto da época (jogos das jornadas 15, 19, 23, 27 e 31), t = 1,10: é um empate técnico.');
    expect(pt).not.toMatch(/passa confortavelmente por zero/);
    const en = uncertaintyNote(scorecard, 'en');
    expect(en).toContain('Overall, the gap is +0.0050 with a standard error of 0.0016 (t = 3.07): the market is ahead.');
  });

  it('applies the 2 SE rule in every verdict line', () => {
    expect(verdictLine({ n: 1, delta: 0.005, se: 0.00163, t: 3.07 }, 'pt')).toMatch(/^O mercado está à frente: a diferença passa de duas vezes/);
    expect(verdictLine({ n: 1, delta: 0.00313, se: 0.00284, t: 1.1 }, 'pt')).toMatch(/^Empate técnico: o sinal favorece o mercado/);
    expect(verdictLine({ n: 1, delta: -0.01, se: 0.004, t: -2.5 }, 'en')).toMatch(/^The model is ahead/);
  });
});

describe('the opening-line sentence (audit F8, M-03)', () => {
  it('reads both comparisons from the file instead of "a few ten-thousandths"', () => {
    const pt = openingLineSentence(scorecard, 'pt')!;
    expect(pt).toContain('a linha de fecho erra 0,0026 menos do que a de abertura (t = −3,09)');
    expect(pt).toContain('Contra a linha de abertura, o modelo fica a +0,0024 (t = 1,70): é um empate técnico.');
  });
});

describe('matchday labels (audit M-06)', () => {
  it('labels checkpoints by the matchday they forecast', () => {
    expect(predictedMatchday({ checkpoint: 1, matchday_predicted: 2 })).toBe(2);
    expect(predictedMatchday({ checkpoint: 30 })).toBe(31);
    expect(phaseMatchdays(scorecard, 'early')).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('compresses runs in both languages', () => {
    expect(matchdayListPhrase([2, 3, 4, 5, 15, 19, 31], 'pt')).toBe('2 a 5, 15, 19 e 31');
    expect(matchdayListPhrase([2, 3, 4, 5, 15, 19, 31], 'en')).toBe('2–5, 15, 19 and 31');
    expect(gamesOfMatchdays([8], 'pt')).toBe('jogos da jornada 8');
    expect(gamesOfMatchdays(scorecard.checkpoints.map(predictedMatchday), 'pt')).toBe(
      'jogos das jornadas 2 a 11, 15, 19, 23, 27 e 31',
    );
  });
});

describe('crossings (audit M-05)', () => {
  it('reports every sign change, not just the first', () => {
    expect(crossings(scorecard.checkpoints)).toEqual([
      { before: 2, after: 3 },
      { before: 19, after: 23 },
      { before: 23, after: 27 },
    ]);
    expect(crossingSentence(scorecard.checkpoints, 'pt')).toBe(
      'A diferença entre o modelo e o mercado muda de sinal três vezes: entre as jornadas 2 e 3, entre as jornadas 19 e 23 e entre as jornadas 23 e 27.',
    );
    // No "lines" that cross: from matchday 15 the chart draws separate points (METH3-14).
    expect(crossingSentence(scorecard.checkpoints, 'en')).toMatch(/^The gap between model and market changes sign three times/);
    expect(crossingSentence([{ checkpoint: 1, delta: 1 }, { checkpoint: 2, delta: 2 }], 'pt')).toBeNull();
  });
});

describe('points calibration (audit M-08)', () => {
  it('counts team-seasons and forecasts separately', () => {
    const pt = pointsCalibrationSentence(scorecard.calibration, 'pt')!;
    expect(pt).toContain('162 equipa-épocas, avaliadas em 6 momentos da época: 972 previsões');
    expect(pt).toContain('o intervalo de 90% para os pontos finais conteve o total real em 89,3% dos casos');
    expect(pointsCalibrationSentence(null, 'pt')).toBeNull();
  });
});

describe('model names (audit M-10, SP-16)', () => {
  it('never prints a codename to readers', () => {
    for (const locale of ['pt', 'en']) {
      for (const id of ['bivcross', 'joint_sot', 'unknown_model']) {
        expect(modelPlainName(id, locale)).not.toMatch(/bivcross|joint_sot|unknown_model/);
      }
    }
  });
});

describe('title calibration (audit METH3-15)', () => {
  const messages = (locale: string) =>
    JSON.parse(readFileSync(path.join(process.cwd(), `messages/${locale}.json`), 'utf8'));

  it('leads with the 17 clean cases and gives the 19 with the data errors second', () => {
    const [first] = titleCalibrationParagraphs('pt');
    const clean = first.indexOf('63%');
    const faulty = first.indexOf('56%');
    expect(clean).toBeGreaterThan(-1);
    expect(faulty).toBeGreaterThan(clean);
    expect(first).toContain(`Nos outros ${TITLE_CALIBRATION.cellsClean}`);
    expect(titleCalibrationParagraphs('en')[0]).toContain('In the other 17');
  });

  it('quotes the clean figures in the caveat every Liga page shows', () => {
    const pct = (v: number) => `${Math.round(v * 100)}%`;
    for (const locale of ['pt', 'en']) {
      const caveat: string = messages(locale).football.titleCalibrationCaveat;
      expect(caveat, locale).toContain(pct(TITLE_CALIBRATION.modelMeanClean));
      expect(caveat, locale).toContain(pct(TITLE_CALIBRATION.leadersWonClean));
      expect(caveat, locale).not.toContain(pct(TITLE_CALIBRATION.modelMean));
    }
  });
});

describe('the /modelo reading rule (audit UXD2-17)', () => {
  it('no longer points back at the cards it sits under', () => {
    expect(readingRule('pt')).not.toMatch(/cartões/);
    expect(readingRule('en')).not.toMatch(/cards/);
  });
});
