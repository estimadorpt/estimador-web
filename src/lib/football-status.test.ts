import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  clockValue,
  forecastAsOf,
  forecastCoverage,
  forecastStatus,
  forecastStatusInput,
  forecastStatusLine,
  forecastStatusLinePlayed,
  kickoffSteps,
  matchPlayedAt,
  matchPlayedLine,
  nextRoundTiming,
  roundPlayedLine,
  slotPassedBeforeForecast,
} from './football-status';

const md8 = ['2026-10-09T17:45:00Z', '2026-10-11T17:00:00Z', '2026-10-12T19:15:00Z'];

describe('forecast status line (audit CL-11, CL-M4)', () => {
  it('says when the forecast is from, what it had seen and when the next one comes', () => {
    const input = { matchday: 7, timestamp: '2026-09-25T14:50:48+00:00', inProgress: false, nextRound: 8, nextRoundKickoffs: md8 };
    expect(forecastStatusLine(input, 'pt')).toBe(
      'Previsão de 25 set., depois da jornada 7 · próxima previsão depois da jornada 8 (9–12 out.)',
    );
    expect(forecastStatusLine(input, 'en')).toBe('Forecast of 25 Sept, after matchday 7 · next forecast after matchday 8 (9–12 Oct)');
    expect(forecastStatusLinePlayed(input, 'pt')).toBe(
      'Previsão de 25 set., depois da jornada 7 · jornada 8 jogada, nova previsão em preparação',
    );
  });

  it('drops the span when no kickoff is known, and says when the season is over', () => {
    expect(
      forecastStatusLine({ matchday: 7, timestamp: '2026-09-25T14:50:48+00:00', inProgress: true, nextRound: 7, nextRoundKickoffs: [] }, 'pt'),
    ).toBe('Previsão de 25 set., a meio da jornada 7 · próxima previsão depois da jornada 7');
    expect(
      forecastStatusLine({ matchday: 34, timestamp: '2027-05-20T10:00:00Z', inProgress: false, nextRound: null, nextRoundKickoffs: [] }, 'pt'),
    ).toBe('Previsão de 20 mai., depois da jornada 34 · época terminada');
  });
});

describe('a forecast published mid-round (md08: 7 of 9 games played)', () => {
  // A frozen copy of md08 as first published mid-round (the live file is
  // regenerated as the round's last games are played).
  const md08 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/test-fixtures/liga-2026-27/md08.json'), 'utf8'));
  // The two games of round 8 still to play when md08 came out, as the
  // fixture loader hands them to the pages.
  const upcoming = [
    { matchday: 8, kickoff: '2026-10-11T19:30:00Z' },
    { matchday: 8, kickoff: '2026-10-12T19:15:00Z' },
    { matchday: 2, kickoff: '2026-10-19T19:15:00Z', postponed: true },
    { matchday: 9, kickoff: '2026-10-23T19:45:00Z' },
  ];

  it('counts the games it had seen, from the file', () => {
    const input = forecastStatusInput(md08, upcoming);
    expect(input.roundSeen).toEqual({ played: 7, total: 9, postponed: 0 });
    expect(input.nextRound).toBe(8);
    expect(input.playedAt).toBe('2026-10-12T21:15:00.000Z');
  });

  it('names the state once, in the same words before and after the round is played', () => {
    const { initial, steps } = forecastStatus(md08, upcoming, 'pt');
    expect(initial).toBe(
      'Previsão de 11 out., com 7 dos 9 jogos da jornada 8 disputados · próxima previsão depois da jornada 8 (11–12 out.)',
    );
    const played = clockValue(initial, steps, Date.parse('2026-10-13T08:00:00Z'));
    expect(played).toBe(
      'Previsão de 11 out., com 7 dos 9 jogos da jornada 8 disputados · jornada 8 jogada, nova previsão em preparação',
    );
    // No "Durante" beside "jogada", no "depois da jornada 8" for a round with games to play.
    for (const line of [initial, played]) {
      expect(line).not.toMatch(/Durante|depois da jornada 8 ·|atualizado/);
    }
    expect(forecastStatus(md08, upcoming, 'en').initial).toBe(
      'Forecast of 11 Oct, with 7 of matchday 8’s 9 games played · next forecast after matchday 8 (11–12 Oct)',
    );
  });

  it('says the same as the homepage instrument about what the forecast had seen', () => {
    expect(forecastCoverage(forecastStatusInput(md08, upcoming), 'pt')).toBe('com 7 dos 9 jogos da jornada 8 disputados');
  });

  it('keeps "jogo em atraso" for a postponed game, never a round state', () => {
    expect(roundPlayedLine(8, 'pt')).toBe('Jornada 8 jogada, nova previsão em preparação');
    expect(nextRoundTiming(md08, upcoming).postponed.map(f => f.matchday)).toEqual([2]);
  });
});

describe('one game and the round it belongs to (audit FR3-01, FR3-02, FR3-04)', () => {
  const ts = '2026-09-25T14:50:48+00:00';

  it('counts a game as played two hours after its kickoff, and says so', () => {
    expect(matchPlayedAt('2026-10-09T17:45:00Z')).toBe('2026-10-09T19:45:00.000Z');
    expect(matchPlayedAt(null)).toBeNull();
    expect(matchPlayedLine(ts, 'pt')).toBe('Jogo disputado · previsão de 25 set.');
    expect(matchPlayedLine(ts, 'en')).toBe('Played · forecast of 25 Sept');
  });

  it('steps from "started" to "played", and not at all for a placeholder kickoff', () => {
    const steps = kickoffSteps('2026-10-09T17:45:00Z', true, 'started', 'played');
    expect(clockValue('before', steps, Date.parse('2026-10-09T17:00:00Z'))).toBe('before');
    expect(clockValue('before', steps, Date.parse('2026-10-09T18:00:00Z'))).toBe('started');
    expect(clockValue('before', steps, Date.parse('2026-10-20T12:00:00Z'))).toBe('played');
    expect(kickoffSteps('2026-10-09T17:45:00Z', false, 'started', 'played')).toEqual([]);
  });

  it('dates a stale "now"', () => {
    expect(forecastAsOf(ts, 'pt')).toBe('na previsão de 25 set.');
    expect(forecastAsOf(ts, 'pt', { capital: true })).toBe('Na previsão de 25 set.');
    expect(forecastAsOf(ts, 'en', { capital: true })).toBe('In the 25 Sept forecast');
  });

  it('times the next round from the forecast, and lists the leftovers of earlier rounds', () => {
    const upcoming = [
      ...md8.map(kickoff => ({ matchday: 8, kickoff })),
      { matchday: 2, kickoff: '2026-10-19T19:15:00Z', postponed: true },
    ];
    const timing = nextRoundTiming({ matchday: 7, matches_remaining: [], next_matchday: { matchday: 8 } }, upcoming);
    expect(timing.round).toBe(8);
    expect(timing.startsAt).toBe('2026-10-09T17:45:00.000Z');
    // The postponed game does not stretch the round: 12 Oct 19:15 + 2 h.
    expect(timing.playedAt).toBe('2026-10-12T21:15:00.000Z');
    expect(timing.postponed.map(f => f.matchday)).toEqual([2]);
    // A forecast published mid-round waits for that round.
    expect(nextRoundTiming({ matchday: 7, matches_remaining: [{}], next_matchday: { matchday: 8 } }, upcoming).round).toBe(7);
  });
});

describe('a game of the forecast\'s own round that was postponed (md11: Estoril–Marítimo)', () => {
  // md11 came out on 8 November at 22:33 UTC with eight of round 11's nine
  // games played. Estoril–Marítimo's confirmed slot (15:30) had passed
  // without a result, and the fixture record kept that slot for weeks.
  const md11 = {
    matchday: 11,
    timestamp: '2026-11-08T22:33:16+00:00',
    matches_remaining: [{ home: 'Estoril', away: 'Maritimo' }],
    matchday_results: Array.from({ length: 8 }, () => ({ matchday: 11 })),
    next_matchday: { matchday: 12 },
  };
  // As the fixture loader hands them over: the postponed game without its
  // old slot, then round 12.
  const upcoming = [
    { matchday: 11, kickoff: null, postponed: true },
    { matchday: 12, kickoff: '2026-11-27T20:15:00Z' },
    { matchday: 12, kickoff: '2026-11-30T20:15:00Z' },
  ];

  it('tells a passed, confirmed slot from a game still to come and from a placeholder', () => {
    expect(slotPassedBeforeForecast('2026-11-08T15:30:00Z', true, md11.timestamp)).toBe(true);
    // The settle time has not passed: the result may simply not be in yet.
    expect(slotPassedBeforeForecast('2026-11-08T21:00:00Z', true, md11.timestamp)).toBe(false);
    expect(slotPassedBeforeForecast('2026-11-27T20:15:00Z', true, md11.timestamp)).toBe(false);
    // An unconfirmed kickoff is the round's first day, not the game's slot.
    expect(slotPassedBeforeForecast('2026-11-08T15:30:00Z', false, md11.timestamp)).toBe(false);
    expect(slotPassedBeforeForecast(null, true, md11.timestamp)).toBe(false);
  });

  it('waits for the next round, not for the game with no date', () => {
    const timing = nextRoundTiming(md11, upcoming);
    expect(timing.round).toBe(12);
    expect(timing.playedAt).toBe('2026-11-30T22:15:00.000Z');
    expect(timing.postponed).toHaveLength(1);
  });

  it('says the round is over but for the postponed game, and never that it was played', () => {
    const status = forecastStatus(md11, upcoming, 'pt');
    expect(status.initial).toBe(
      'Previsão de 8 nov., com 8 dos 9 jogos da jornada 11 disputados e um adiado · próxima previsão depois da jornada 12 (27–30 nov.)',
    );
    // Ten days later the line is the same; it turns only once round 12 is played.
    expect(clockValue(status.initial, status.steps, Date.parse('2026-11-18T23:00:00Z'))).toBe(status.initial);
    expect(clockValue(status.initial, status.steps, Date.parse('2026-11-30T23:00:00Z'))).toContain('jornada 12 jogada');
    expect(forecastStatus(md11, upcoming, 'en').initial).toBe(
      'Forecast of 8 Nov, with 8 of matchday 11’s 9 games played and one postponed · next forecast after matchday 12 (27–30 Nov)',
    );
  });

  it('keeps waiting for the round while one of its games is still to come', () => {
    const mixed = { ...md11, matches_remaining: [{}, {}] };
    const timing = nextRoundTiming(mixed, [
      { matchday: 11, kickoff: null, postponed: true },
      { matchday: 11, kickoff: '2026-11-09T20:15:00Z' },
      ...upcoming.slice(1),
    ]);
    expect(timing.round).toBe(11);
    expect(timing.playedAt).toBe('2026-11-09T22:15:00.000Z');
  });
});
