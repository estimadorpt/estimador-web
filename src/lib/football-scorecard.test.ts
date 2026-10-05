import { describe, expect, it } from 'vitest';
import {
  blockVerdict,
  calibrationSentence,
  crossoverMatchday,
  describeModel,
  evaluatesCurrentModel,
  seasonRange,
  verdictSentence,
} from './football-scorecard';
import { loadLigaData, loadLigaMarketScorecard } from '@/lib/utils/football-data-loader';

describe('scorecard wording', () => {
  it('reads verdicts from t, at twice the standard error', () => {
    expect(blockVerdict({ n: 144, delta: 0.00977, se: 0.00453, t: 2.16 })).toBe('market_ahead');
    expect(blockVerdict({ n: 360, delta: -0.00247, se: 0.00223, t: -1.11 })).toBe('tie_model_sign');
    expect(blockVerdict({ n: 504, delta: 0.00103, se: 0.00207, t: 0.5 })).toBe('tie');
    expect(blockVerdict({ n: 504, delta: -0.01, se: 0.002, t: -5 })).toBe('model_ahead');
    expect(verdictSentence({ n: 504, delta: 0.00103, se: 0.00207, t: 0.5 }, 'pt', '0,50')).toMatch(/indistinguível de zero/);
  });

  it('names the evaluated model and says when it is not the published one', () => {
    expect(describeModel('joint_sot', 'pt')).toBe('joint_sot, o modelo usado até agosto de 2026');
    expect(describeModel('x_new', 'en')).toBe('x_new');
    expect(evaluatesCurrentModel('joint_sot', 'bivcross')).toBe(false);
    expect(evaluatesCurrentModel('bivcross', 'bivcross')).toBe(true);
    expect(evaluatesCurrentModel(undefined, 'bivcross')).toBe(false);
  });

  it('formats season ranges and finds the crossover', () => {
    expect(seasonRange(['2017-18', '2018-19', '2024-25'], 'pt')).toBe('2017-18 a 2024-25');
    expect(seasonRange(['2017-18', '2024-25'], 'en')).toBe('2017-18 to 2024-25');
    expect(
      crossoverMatchday([
        { checkpoint: 6, delta: 0.009 },
        { checkpoint: 10, delta: 0.01 },
        { checkpoint: 14, delta: -0.004 },
      ]),
    ).toEqual({ before: 10, after: 14 });
    expect(crossoverMatchday([{ checkpoint: 6, delta: 0.009 }])).toBeNull();
  });

  it('quotes the interval calibration only for the model it was measured on', () => {
    expect(calibrationSentence('bivcross', 'pt')).toBe(
      'Numa verificação de setembro de 2026, em 9 épocas (2017-18 a 2025-26), o intervalo de 90% conteve o total real de pontos em 89% dos casos.',
    );
    expect(calibrationSentence('joint_sot', 'pt')).not.toMatch(/\d+%/);
    expect(calibrationSentence(undefined, 'en')).toMatch(/not been measured/);
  });

  it('knows every model the published files name', async () => {
    const [scorecard, { prediction }] = await Promise.all([loadLigaMarketScorecard(), loadLigaData()]);
    for (const model of [scorecard?.model, prediction?.model]) {
      if (!model) continue;
      expect(describeModel(model, 'pt'), model).not.toBe(model);
    }
  });
});
