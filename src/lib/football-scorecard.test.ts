import { describe, expect, it } from 'vitest';
import {
  blockVerdict,
  calibrationSentence,
  marketSourcesPhrase,
  scorecardSeasonRange,
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

  it('quotes the interval calibration from the file, only for the model it was measured on', () => {
    const calibration = {
      model: 'bivcross', interval_mass: 0.9, coverage: 0.893, n_seasons: 9, first_season: '2017-18', last_season: '2025-26',
    };
    expect(calibrationSentence(calibration, 'bivcross', 'pt')).toBe(
      'Em 9 épocas (2017-18 a 2025-26), o intervalo de 90% conteve o total final de pontos em 89,3% dos casos.',
    );
    expect(calibrationSentence(calibration, 'bivcross', 'en')).toBe(
      'Over 9 seasons (2017-18 to 2025-26), the 90% interval contained the final points total 89.3% of the time.',
    );
    expect(calibrationSentence(calibration, 'joint_sot', 'pt')).not.toMatch(/\d+%/);
    expect(calibrationSentence(null, 'bivcross', 'en')).toMatch(/not been measured/);
    expect(calibrationSentence(calibration, undefined, 'en')).toMatch(/not been measured/);
  });

  it('names the market sources and the season span from the file', () => {
    expect(marketSourcesPhrase({ b365: 37, pinnacle: 773 }, 'pt')).toBe('Pinnacle (773 jogos) e Bet365 (37)');
    expect(marketSourcesPhrase({ pinnacle: 1773, b365: 37 }, 'en')).toBe('Pinnacle (1,773 matches) and Bet365 (37)');
    expect(marketSourcesPhrase({ pinnacle: 810 }, 'en')).toBe('Pinnacle');
    expect(marketSourcesPhrase(undefined, 'pt')).toBeNull();
    expect(scorecardSeasonRange({ first_season: '2020-21', last_season: '2025-26', seasons: ['x'] }, 'pt')).toBe('2020-21 a 2025-26');
    expect(scorecardSeasonRange({ seasons: ['2020-21', '2021-22'] }, 'en')).toBe('2020-21 to 2021-22');
  });

  it('reads every figure the published scorecard needs', async () => {
    const scorecard = await loadLigaMarketScorecard();
    if (!scorecard) return;
    expect(scorecard.calibration && Number.isFinite(scorecard.calibration.coverage)).toBe(true);
    expect(scorecard.checkpoints.every(c => Number.isInteger(c.n) && c.n > 0)).toBe(true);
    expect(Object.values(scorecard.market_sources ?? {}).reduce((a, b) => a + b, 0)).toBe(scorecard.n);
  });

  it('knows every model the published files name', async () => {
    const [scorecard, { prediction }] = await Promise.all([loadLigaMarketScorecard(), loadLigaData()]);
    for (const model of [scorecard?.model, prediction?.model]) {
      if (!model) continue;
      expect(describeModel(model, 'pt'), model).not.toBe(model);
    }
  });
});
