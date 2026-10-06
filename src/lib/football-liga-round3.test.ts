import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import { ligaTeamSlugs, teamDisplayName, teamWithArticle } from '@/lib/config/football';
import {
  clockValue,
  forecastStatusLine,
  forecastStatusLinePlayed,
  matchStartedLine,
  roundPlayedAt,
  roundPlayedLine,
  roundStartsAt,
} from '@/lib/football-status';
import { disagreementSentence, leadVerdictSentence, selectionCaveat } from '@/lib/football-model-evaluation';
import { initialImpactSide, rivalConditionsWithoutOwnMatches, RIVAL_CONDITION_MIN_SHARE } from '@/lib/football-scenarios';
import type { NarrativeScenario, ScenarioData } from '@/types/football';

const root = process.cwd();
const messages = (locale: string) => JSON.parse(readFileSync(path.join(root, `messages/${locale}.json`), 'utf8'));
const scenarios = JSON.parse(
  readFileSync(path.join(root, 'public/data/football/liga-2026-27/md07_scenarios.json'), 'utf8'),
) as ScenarioData;
const scorecard = JSON.parse(
  readFileSync(path.join(root, 'public/data/football/liga-2026-27/market_scorecard.json'), 'utf8'),
);

describe('club names take their article (audit CL2-01, UXD2-06)', () => {
  const clubs = Object.keys(ligaTeamSlugs).filter(t => !['AVS', 'Boavista', 'Tondela'].includes(t));
  const t = createTranslator({ locale: 'pt', messages: messages('pt') });

  it('renders every club page sentence with "o" before the club', () => {
    for (const team of clubs) {
      const intro = t('football.clubPageIntro', {
        team: teamDisplayName(team),
        teamFor: teamWithArticle(team, 'para'),
        teamOf: teamWithArticle(team, 'de'),
        date: '25 de setembro de 2026',
      });
      const description = t('football.teamPageDescription', {
        race: 'relegation',
        team: teamDisplayName(team),
        teamFor: teamWithArticle(team, 'para'),
        teamOf: teamWithArticle(team, 'de'),
        season: '2026-27',
      });
      const heading = t('football.fixtureStakesHeading', {
        team: teamDisplayName(team),
        opponent: teamDisplayName(team),
        opponentAgainst: teamWithArticle(team, 'contra'),
      });
      for (const text of [intro, description, heading]) {
        expect(text).not.toMatch(/\b(para|contra|de) [A-Z]/);
        expect(text).not.toMatch(/\b(para para|contra contra|de do)\b/);
      }
      expect(intro).toContain(`para o ${teamDisplayName(team)}`);
      // The date is the kicker's alone (audit CL3-14).
      expect(intro).not.toMatch(/atualizad|setembro/);
    }
  });

  it('chooses the race in the meta description', () => {
    const args = { team: 'Casa Pia', teamFor: 'para o Casa Pia', teamOf: 'do Casa Pia', season: '2026-27' };
    expect(t('football.teamPageDescription', { ...args, race: 'relegation' })).toMatch(/^Risco de despromoção/);
    expect(t('football.teamPageDescription', { ...args, race: 'title' })).toMatch(/^Hipóteses de título/);
    expect(t('football.teamPageDescription', { ...args, race: 'other' })).toMatch(/do Casa Pia/);
  });

  it('knows the prepositions', () => {
    expect(teamWithArticle('Benfica', 'de')).toBe('do Benfica');
    expect(teamWithArticle('Sporting CP', 'a')).toBe('ao Sporting');
    expect(teamWithArticle('SC Braga', 'contra')).toBe('contra o Sp. Braga');
    expect(teamWithArticle('Oliveirense', 'de')).toBe('da Oliveirense');
  });
});

describe('scenario rival conditions (audit FA2-01, PUB2-11)', () => {
  const all = Object.values(scenarios.narrative_scenarios ?? {});

  it('never lists a game the club plays itself, nor a result short of 90% in the scenario', () => {
    for (const club of all) {
      for (const scenario of club.scenarios) {
        for (const rc of rivalConditionsWithoutOwnMatches(club.team, scenario)) {
          expect(rc.opponent).not.toBe(club.team);
          expect(rc.p_rival_drops_in_scenario).toBeGreaterThanOrEqual(RIVAL_CONDITION_MIN_SHARE);
        }
      }
    }
  });

  it('drops Porto\'s "Sporting perde pontos vs Sp. Braga (J8)" at 53% against 48%', () => {
    const porto = scenarios.narrative_scenarios!['Porto'];
    const realistic = porto.scenarios.find(s => s.label === 'realistic') as NarrativeScenario;
    expect(realistic.rival_conditions.some(rc => rc.opponent === 'SC Braga' && rc.matchday === 8)).toBe(true);
    expect(rivalConditionsWithoutOwnMatches('Porto', realistic)).toEqual([]);
  });

  it('keeps a near-certain result between two other clubs', () => {
    const scenario = {
      label: 'x',
      steps: [],
      rival_conditions: [
        { rival: 'Sporting CP', opponent: 'SC Braga', matchday: 8, p_rival_drops_baseline: 0.48, p_rival_drops_in_scenario: 0.95, drop_uplift: 0.47 },
      ],
    } as unknown as NarrativeScenario;
    expect(rivalConditionsWithoutOwnMatches('Porto', scenario)).toHaveLength(1);
  });
});

describe('/modelo prose follows the 2 SE rule (audit MR2-01)', () => {
  it('calls the disagreement subset by its t, never "demasiado ruidosa"', () => {
    const s = scorecard.disagreement_summary;
    const t = s.delta / s.se;
    expect(t).toBeGreaterThan(2);
    const pt = disagreementSentence(s, scorecard.n, 'pt');
    const en = disagreementSentence(s, scorecard.n, 'en');
    expect(pt).toContain('t = 2,50');
    expect(pt).toContain('o mercado está à frente');
    expect(pt).not.toMatch(/ruidosa/);
    expect(en).toContain('the market is ahead');
    expect(en).not.toMatch(/noisy/);
  });

  it('calls a sub-2-SE subset a tie', () => {
    const tie = disagreementSentence({ ...scorecard.disagreement_summary, delta: 0.01, se: 0.0069 }, 810, 'pt');
    expect(tie).toContain('é um empate técnico');
  });

  it('says the lead verdict once, from the file', () => {
    expect(leadVerdictSentence(scorecard, 'pt')).toBe(
      'No conjunto e no início da época, o mercado está à frente; no resto da época, é um empate técnico.',
    );
    expect(selectionCaveat('2026-27', 'pt')).toMatch(/não é independente/);
  });
});

describe('the Liga clock (audit FRESH-01)', () => {
  const md8 = ['2026-10-09T17:45:00Z', '2026-10-11T17:00:00Z', '2026-10-12T19:15:00Z'];

  it('switches on kickoff and once the round is over', () => {
    const steps = [
      { at: roundStartsAt(md8), value: 'started' },
      { at: roundPlayedAt(md8), value: 'played' },
    ];
    expect(clockValue('before', steps, Date.parse('2026-10-06T12:00:00Z'))).toBe('before');
    expect(clockValue('before', steps, Date.parse('2026-10-10T19:00:00Z'))).toBe('started');
    expect(clockValue('before', steps, Date.parse('2026-10-12T21:00:00Z'))).toBe('started');
    expect(clockValue('before', steps, Date.parse('2026-10-12T21:16:00Z'))).toBe('played');
    expect(clockValue('before', [{ at: null, value: 'x' }], Date.now())).toBe('before');
  });

  it('writes the lines the brief asks for', () => {
    expect(matchStartedLine('2026-09-25T14:50:48+00:00', 'pt')).toBe('Jogo começou · previsão de 25 set.');
    expect(roundPlayedLine(8, 'pt')).toBe('Jornada 8 · jogada, nova previsão em preparação');
    const input = { matchday: 7, timestamp: '2026-09-25T14:50:48+00:00', inProgress: false, nextRound: 8, nextRoundKickoffs: md8 };
    expect(forecastStatusLine(input, 'pt')).toContain('próxima atualização após a jornada 8');
    expect(forecastStatusLinePlayed(input, 'pt')).toBe(
      'Depois da jornada 7 · atualizado a 25 set. · jornada 8 jogada, nova previsão em preparação',
    );
  });
});

describe('match impact opens on the club the game matters to (audit FA2-M2)', () => {
  it('opens Rio Ave–Nacional on Nacional', () => {
    const nms = scenarios.next_matchday_scenarios!;
    const match = nms.matches.find(m => m.home_team === 'Rio Ave' && m.away_team === 'Nacional')!;
    expect(initialImpactSide(match, nms.baseline as never, 'Rio Ave', 'Nacional')).toBe('away');
  });
});
