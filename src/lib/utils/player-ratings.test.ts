import { describe, expect, it } from 'vitest';
import {
  countSeparated,
  findRating,
  goalsSarIsMeaningful,
  normaliseRatings,
  rankMovement,
  ratingDomain,
  ratingPct,
  type RatingsBlock,
} from '@/lib/utils/player-ratings';
import {
  loadContribRatings,
  loadDefRatings,
  loadGkRatings,
} from '@/lib/utils/football-data-loader';

/**
 * These feeds are written by three separate models in the model repo, none of
 * which existed when this page was built. The contract these tests defend is
 * not "the schema is X" — it is "an unexpected schema loses a column, never
 * the page".
 */

describe('normaliseRatings — nothing usable', () => {
  it('returns null for null, primitives and empty objects', () => {
    expect(normaliseRatings(null, 'gk')).toBeNull();
    expect(normaliseRatings(42, 'gk')).toBeNull();
    expect(normaliseRatings('nope', 'gk')).toBeNull();
    expect(normaliseRatings({}, 'gk')).toBeNull();
  });

  it('returns null when the rows carry no names', () => {
    const block = normaliseRatings({ players: [{ value: 0.4 }, { foo: 1 }] }, 'gk');
    expect(block).toBeNull();
  });

  it('drops unnamed rows but keeps the named ones', () => {
    const block = normaliseRatings(
      { players: [{ value: 0.4 }, { player: 'Diogo Costa', value: 0.2 }] },
      'gk',
    )!;
    expect(block.players).toHaveLength(1);
    expect(block.players[0].player).toBe('Diogo Costa');
  });
});

describe('normaliseRatings — the documented shape', () => {
  const feed = {
    season: '2026-27',
    model: 'gk_shotstopping',
    metric_label: 'Goals prevented above expectation',
    note: 'Shotmaps start in 2025-26.',
    generated_from: {
      n_players: 24,
      n_observations: 3120,
      seasons: ['2025-26', '2026-27'],
      max_rhat: 1.01,
      divergences: 0,
    },
    players: [
      {
        rank: 1,
        player: 'Diogo Costa',
        team: 'Porto',
        position: 'G',
        goals_prevented_per_90: 0.21,
        lo: 0.02,
        hi: 0.41,
        raw_goals_prevented: 4.8,
        shots_faced: 118,
        goals_conceded: 27,
        xgot_faced: 31.8,
        p_above_average: 0.98,
      },
      {
        rank: 2,
        player: 'Rui Silva',
        team: 'Sporting CP',
        position: 'G',
        goals_prevented_per_90: -0.05,
        lo: -0.24,
        hi: 0.15,
        shots_faced: 96,
      },
    ],
  };

  it('reads the headline value, interval and sample fields', () => {
    const block = normaliseRatings(feed, 'gk')!;
    expect(block.players).toHaveLength(2);
    const [first, second] = block.players;
    expect(first.player).toBe('Diogo Costa');
    expect(first.value).toBe(0.21);
    expect(first.lo).toBe(0.02);
    expect(first.hi).toBe(0.41);
    expect(first.raw).toBe(4.8);
    expect(first.shots).toBe(118);
    expect(first.xgotFaced).toBe(31.8);
    expect(first.pAbove).toBe(0.98);
    expect(second.value).toBe(-0.05);
  });

  it('reads provenance and diagnostics from generated_from', () => {
    const { meta } = normaliseRatings(feed, 'gk')!;
    expect(meta.season).toBe('2026-27');
    expect(meta.metricLabel).toBe('Goals prevented above expectation');
    expect(meta.nPlayers).toBe(24);
    expect(meta.nObservations).toBe(3120);
    expect(meta.seasons).toEqual(['2025-26', '2026-27']);
    expect(meta.maxRhat).toBe(1.01);
    expect(meta.divergences).toBe(0);
    expect(meta.note).toBe('Shotmaps start in 2025-26.');
  });

  it('treats a present ranking as separable', () => {
    expect(normaliseRatings(feed, 'gk')!.separable).not.toBe(false);
  });
});

describe('normaliseRatings — schema drift', () => {
  it('accepts alternative row-array and field names', () => {
    const block = normaliseRatings(
      {
        keepers: [
          { name: 'Ricardo Velho', club: 'Famalicão', gpae_p90: 0.09, hdi_lo: -0.02, hdi_hi: 0.2 },
        ],
        n_players: 3,
      },
      'gk',
    )!;
    const [only] = block.players;
    expect(only.player).toBe('Ricardo Velho');
    expect(only.team).toBe('Famalicão');
    expect(only.value).toBe(0.09);
    expect(only.lo).toBe(-0.02);
    expect(only.hi).toBe(0.2);
    expect(block.meta.nPlayers).toBe(3);
  });

  it('accepts a bare array of rows', () => {
    const block = normaliseRatings(
      [{ player: 'Samu Aghehowa', contrib_sar: 0.5 }],
      'contrib',
    )!;
    expect(block.players[0].value).toBe(0.5);
    expect(block.meta.season).toBeNull();
  });

  it('leaves unknown fields as null rather than guessing', () => {
    const block = normaliseRatings(
      { players: [{ player: 'X', some_new_column: 0.3 }] },
      'contrib',
    )!;
    expect(block.players[0].value).toBeNull();
    expect(block.players[0].lo).toBeNull();
    expect(block.players[0].hi).toBeNull();
  });

  it('parses numeric strings and rejects non-numeric ones', () => {
    const block = normaliseRatings(
      { players: [{ player: 'X', value: '0.25', lo: 'n/a' }] },
      'def',
    )!;
    expect(block.players[0].value).toBe(0.25);
    expect(block.players[0].lo).toBeNull();
  });

  it('fills in a rank when the feed publishes none, best value first', () => {
    const block = normaliseRatings(
      {
        players: [
          { player: 'Low', value: 0.1 },
          { player: 'High', value: 0.4 },
        ],
      },
      'contrib',
    )!;
    expect(block.players.map(p => p.player)).toEqual(['High', 'Low']);
    expect(block.players.map(p => p.rank)).toEqual([1, 2]);
  });
});

describe('normaliseRatings — defenders with no ranking', () => {
  it('keeps a diagnostics-only payload and marks it not separable', () => {
    const block = normaliseRatings(
      {
        season: '2026-27',
        separable: false,
        note: 'Team-mates cannot be told apart.',
        diagnostics: {
          median_interval_width: 0.42,
          max_vif: 18.3,
          players_attempted: 96,
        },
      },
      'def',
    )!;
    expect(block.players).toHaveLength(0);
    expect(block.separable).toBe(false);
    expect(block.diagnostics).toHaveLength(3);
    // Labels are humanised: these arrive as snake_case keys.
    expect(block.diagnostics.map(d => d.label)).toContain('Max vif');
    expect(block.meta.note).toBe('Team-mates cannot be told apart.');
  });

  it('accepts diagnostics as an array of label/value records', () => {
    const block = normaliseRatings(
      {
        diagnostics: [
          { label: 'Median interval width', value: 0.42 },
          { name: 'Conclusion', value: 'not separable' },
          { value: 3 },
        ],
      },
      'def',
    )!;
    expect(block.diagnostics).toEqual([
      { label: 'Median interval width', value: '0.42' },
      { label: 'Conclusion', value: 'not separable' },
    ]);
  });

  it('reads not_separable as the negation of separable', () => {
    const block = normaliseRatings(
      { not_separable: true, players: [{ player: 'A', value: 0.1 }] },
      'def',
    )!;
    expect(block.separable).toBe(false);
  });

  it('marks an empty ranking not separable even without a flag', () => {
    const block = normaliseRatings({ players: [], note: 'no fit' }, 'def')!;
    expect(block.separable).toBe(false);
  });
});

describe('ratingDomain / ratingPct', () => {
  const entry = (value: number, lo?: number, hi?: number) =>
    normaliseRatings(
      { players: [{ player: 'p', value, ...(lo !== undefined ? { lo } : {}), ...(hi !== undefined ? { hi } : {}) }] },
      'contrib',
    )!.players[0];

  it('always includes zero so a negative metric has a baseline', () => {
    const d = ratingDomain([entry(0.3), entry(0.5)]);
    expect(d.min).toBe(0);
    expect(d.max).toBe(0.5);
  });

  it('covers the interval bounds, not just the point estimates', () => {
    const d = ratingDomain([entry(0.1, -0.4, 0.6)]);
    expect(d.min).toBe(-0.4);
    expect(d.max).toBe(0.6);
  });

  it('stays drawable when every value is identical', () => {
    const d = ratingDomain([entry(0), entry(0)]);
    expect(d.max).toBeGreaterThan(d.min);
    expect(ratingPct(0, d)).toBeGreaterThan(0);
  });

  it('clamps out-of-domain values to the track', () => {
    const d = { min: 0, max: 1 };
    expect(ratingPct(-5, d)).toBe(0);
    expect(ratingPct(5, d)).toBe(100);
    expect(ratingPct(0.25, d)).toBe(25);
  });
});

describe('rankMovement', () => {
  const rows = (row: Record<string, unknown>) =>
    normaliseRatings({ players: [{ player: 'A', value: 1, ...row }] }, 'contrib')!
      .players[0];

  it('is positive when the player climbs against the goals ranking', () => {
    expect(rankMovement(rows({ rank: 3, goals_rank: 20 }))).toBe(17);
  });

  it('uses the supplied goals ranks when the feed omits them', () => {
    expect(rankMovement(rows({ rank: 2 }), { A: 9 })).toBe(7);
  });

  it('prefers an unambiguous rank pair over a published delta', () => {
    expect(rankMovement(rows({ rank: 4, goals_rank: 6, rank_change: -99 }))).toBe(2);
  });

  it('falls back to the published delta, and to null with neither', () => {
    expect(rankMovement(rows({ rank_change: 5 }))).toBe(5);
    expect(rankMovement(rows({}))).toBeNull();
  });
});

describe('goalsSarIsMeaningful', () => {
  it('is false for the positions the goals model cannot separate', () => {
    expect(goalsSarIsMeaningful('G')).toBe(false);
    expect(goalsSarIsMeaningful('g')).toBe(false);
    expect(goalsSarIsMeaningful('D')).toBe(false);
  });

  it('is true for midfielders, forwards and unknown positions', () => {
    expect(goalsSarIsMeaningful('M')).toBe(true);
    expect(goalsSarIsMeaningful('F')).toBe(true);
    expect(goalsSarIsMeaningful(null)).toBe(true);
  });
});

describe('findRating', () => {
  const block = normaliseRatings(
    {
      players: [
        { player: 'Gonçalo Ramos', team: 'Benfica', value: 0.3 },
        { player: 'João Mário', team: 'Porto', value: 0.2 },
      ],
    },
    'contrib',
  )!;

  it('matches on the exact name', () => {
    expect(findRating(block, 'João Mário')?.value).toBe(0.2);
  });

  it('matches with the accents stripped', () => {
    expect(findRating(block, 'Goncalo Ramos')?.value).toBe(0.3);
  });

  it('returns null for an unknown player or an absent block', () => {
    expect(findRating(block, 'Nobody')).toBeNull();
    expect(findRating(null, 'João Mário')).toBeNull();
  });

  it('breaks a name collision with the club', () => {
    const dup = normaliseRatings(
      {
        players: [
          { player: 'João Silva', team: 'Braga', value: 0.1 },
          { player: 'Joao Silva', team: 'Estoril', value: 0.9 },
        ],
      },
      'contrib',
    )!;
    expect(findRating(dup, 'João Silva', 'Estoril')?.value).toBe(0.9);
  });
});

/**
 * The loaders against whatever is actually published. All three feeds are
 * optional: null is a valid answer and must not throw. When a feed *is*
 * present its shape has to survive normalisation, which is what would break
 * silently if a sibling pipeline renamed a column.
 */
describe('the shapes actually published', () => {
  // Abridged from the real gk_ratings.json: rows under `keepers`, the name in
  // `keeper`, the value in `goals_prevented_per90` and the bounds as suffixes
  // of that key, with provenance split between `model` and `sample`.
  const realGk = {
    metric: 'goalkeeper shot-stopping — goals prevented above expectation',
    unit: 'goals per 90 minutes vs a league-average keeper facing the same shots',
    interval: '90% highest-density posterior interval',
    keepers: [
      {
        rank: 1,
        keeper: 'André Ferreira',
        team: 'Moreirense',
        minutes: 2070,
        shots_on_target_faced: 107,
        xgot_faced: 33.1,
        goals_conceded: 32,
        goals_prevented_raw_per90: 0.2252,
        goals_prevented_per90: 0.0409,
        goals_prevented_per90_lo: -0.11,
        goals_prevented_per90_hi: 0.1966,
        p_above_average: 0.67,
      },
    ],
    model: { divergences: 0, max_r_hat: 1.0, min_ess_bulk: 1360.0, min_minutes: 900 },
    sample: { events_by_season: { '2025-26': 306, '2026-27': 8 } },
    caveats: ['Penalties are excluded.', 'This measures shot-stopping only.'],
  };

  it('reads the goalkeeper feed end to end', () => {
    const block = normaliseRatings(realGk, 'gk')!;
    const [k] = block.players;
    expect(k.player).toBe('André Ferreira');
    expect(k.value).toBeCloseTo(0.0409, 6);
    expect(k.lo).toBeCloseTo(-0.11, 6);
    expect(k.hi).toBeCloseTo(0.1966, 6);
    // The raw figure must be the per-90 one, matching the headline's units.
    expect(k.raw).toBeCloseTo(0.2252, 6);
    expect(k.shots).toBe(107);
    expect(k.pAbove).toBe(0.67);
  });

  it('takes the interval mass from the feed rather than assuming it', () => {
    const { meta } = normaliseRatings(realGk, 'gk')!;
    expect(meta.intervalPct).toBe(90);
    expect(meta.intervalLabel).toBe('90% highest-density posterior interval');
  });

  // The site labelled 90% intervals as 94% for as long as no feed carried the
  // real value, so the numeric field is now read and scaled from the fraction
  // the models export.
  it('reads interval_mass as a fraction and renders it as a percentage', () => {
    const { meta } = normaliseRatings(
      { interval_mass: 0.9, players: [{ player: 'A', value: 1 }] },
      'contrib',
    )!;
    expect(meta.intervalPct).toBe(90);
  });

  it('leaves an already-percentage interval field alone', () => {
    const { meta } = normaliseRatings(
      { interval_pct: 94, players: [{ player: 'A', value: 1 }] },
      'contrib',
    )!;
    expect(meta.intervalPct).toBe(94);
  });

  it('reports no interval mass when the feed carries none', () => {
    const { meta } = normaliseRatings(
      { players: [{ player: 'A', value: 1 }] },
      'contrib',
    )!;
    expect(meta.intervalPct).toBeNull();
  });

  it('finds provenance nested under model and sample', () => {
    const { meta } = normaliseRatings(realGk, 'gk')!;
    expect(meta.maxRhat).toBe(1.0);
    expect(meta.divergences).toBe(0);
    expect(meta.minEssBulk).toBe(1360);
    expect(meta.minMinutes).toBe(900);
    expect(meta.seasons).toEqual(['2025-26', '2026-27']);
    expect(meta.caveats).toHaveLength(2);
  });

  it('does not report a match count as an observation count', () => {
    const block = normaliseRatings(
      { ...realGk, sample: { n_events: 314, events_by_season: { '2025-26': 306 } } },
      'gk',
    )!;
    expect(block.meta.nObservations).toBeNull();
  });

  // Abridged from the real contrib_ratings.json.
  const realContrib = {
    season: '2026-27',
    metric_label: 'Contribution Above Replacement (winsorized goals+assists per 90)',
    generated_from: {
      n_players: 718,
      n_observations: 29019,
      min_minutes: 600,
      seasons: ['2023-24', '2024-25', '2025-26', '2026-27'],
      max_rhat: 1.04,
      divergences: 0,
    },
    players: [
      {
        rank: 5,
        player: 'Francisco Trincão',
        team: 'Sporting CP',
        position: 'F',
        minutes: 7542,
        goals: 25,
        assists: 31,
        contrib_sar: 0.4249,
        contrib_sar_lo: 0.302,
        contrib_sar_hi: 0.5501,
        p_above_replacement: 1.0,
        rank_goals_only: 31,
        rank_change_vs_goals_only: 26,
      },
    ],
    positional_distribution: [
      { position: 'F', n: 173, median: 0.1377, min: 0.0132, max: 0.8157, range: 0.8025, n_distinct_3dp: 125 },
      { position: 'G', n: 53, median: -0.15, min: -0.1502, max: -0.1489, range: 0.0013, n_distinct_3dp: 2 },
    ],
    caveats: ['Goalkeepers are not measured by this metric.'],
  };

  it('reads the contribution feed end to end', () => {
    const block = normaliseRatings(realContrib, 'contrib')!;
    const [p] = block.players;
    expect(p.value).toBeCloseTo(0.4249, 6);
    expect(p.lo).toBeCloseTo(0.302, 6);
    expect(p.hi).toBeCloseTo(0.5501, 6);
    expect(p.goals).toBe(25);
    expect(p.assists).toBe(31);
    expect(p.goalsRank).toBe(31);
    expect(block.meta.maxRhat).toBe(1.04);
  });

  it('agrees with the feed on which way the rank moved', () => {
    const [p] = normaliseRatings(realContrib, 'contrib')!.players;
    // Derived from the rank pair, and equal to the published delta.
    expect(rankMovement(p)).toBe(26);
    expect(p.rankChange).toBe(26);
  });

  it('keeps the positional distribution, degeneracy included', () => {
    const { positional } = normaliseRatings(realContrib, 'contrib')!;
    expect(positional).toHaveLength(2);
    const gkRow = positional.find(r => r.position === 'G')!;
    expect(gkRow.n).toBe(53);
    expect(gkRow.range).toBeCloseTo(0.0013, 6);
    expect(gkRow.nDistinct).toBe(2);
  });
});

describe('the defenders null result, as actually published', () => {
  // Abridged from the real def_ratings.json: no `players` array at all, the
  // decision under `verdict`, the distribution as a mapping, and provenance
  // split across `data` and `convergence.spec_b`.
  const realDef = {
    generated_for_season: '2026-27',
    model: 'defensive adjusted plus-minus (RAPM) on goals conceded',
    separable: false,
    ranking: null,
    verdict: {
      criterion: '>= 20 players with shrinkage >= 0.2 AND positive walk-forward log-score gain',
      n_players: 786,
      n_separable: 0,
      median_shrinkage: -0.022024,
      n_ci_excludes_zero: 12,
      expected_false_positives_at_90pct: 78.6,
      passes_shrinkage: false,
      separable: false,
    },
    data: {
      seasons: ['2023-24', '2024-25', '2025-26', '2026-27'],
      players_modelled: 786,
      min_minutes: 450.0,
    },
    positional_distribution: {
      D: { n: 266, median: 0.10029, vmin: 0.016573, vmax: 0.229941, n_unique: 266, degenerate: false },
      G: { n: 55, median: 0.093096, vmin: -0.010895, vmax: 0.247141, n_unique: 55, degenerate: false },
    },
    convergence: {
      spec_b: { label: 'specB', max_rhat: 1.01, min_ess_bulk: 765.0, divergences: 0 },
    },
    caveats: ['NO RANKING IS PUBLISHED.', 'Goals conceded is a team outcome.'],
  };

  it('publishes no ranking and says so', () => {
    const block = normaliseRatings(realDef, 'def')!;
    expect(block.players).toHaveLength(0);
    expect(block.separable).toBe(false);
  });

  it('keeps the pre-registered verdict as diagnostics', () => {
    const { diagnostics } = normaliseRatings(realDef, 'def')!;
    const byLabel = Object.fromEntries(diagnostics.map(d => [d.label, d.value]));
    expect(byLabel['N players']).toBe('786');
    expect(byLabel['N separable']).toBe('0');
    expect(byLabel['Passes shrinkage']).toBe('false');
    expect(byLabel['Criterion']).toContain('shrinkage');
  });

  it('reads a positional distribution published as a mapping', () => {
    const { positional } = normaliseRatings(realDef, 'def')!;
    expect(positional.map(r => r.position).sort()).toEqual(['D', 'G']);
    const d = positional.find(r => r.position === 'D')!;
    expect(d.n).toBe(266);
    expect(d.min).toBeCloseTo(0.016573, 6);
    expect(d.max).toBeCloseTo(0.229941, 6);
    expect(d.nDistinct).toBe(266);
    expect(d.degenerate).toBe(false);
  });

  it('finds convergence diagnostics nested two levels deep', () => {
    const { meta } = normaliseRatings(realDef, 'def')!;
    expect(meta.maxRhat).toBe(1.01);
    expect(meta.divergences).toBe(0);
    expect(meta.minEssBulk).toBe(765);
    expect(meta.minMinutes).toBe(450);
    expect(meta.nPlayers).toBe(786);
    expect(meta.seasons).toEqual(['2023-24', '2024-25', '2025-26', '2026-27']);
  });
});

describe('countSeparated', () => {
  it('prefers the count the model published', () => {
    const block = normaliseRatings(
      {
        players: [{ player: 'A', value: 0.4, lo: 0.2, hi: 0.6 }],
        model: { n_intervals_excluding_zero: 0 },
      },
      'gk',
    )!;
    expect(countSeparated(block)).toBe(0);
  });

  it('otherwise counts intervals that clear zero from either side', () => {
    const block = normaliseRatings(
      {
        players: [
          { player: 'over', value: 0.4, lo: 0.2, hi: 0.6 },
          { player: 'straddles', value: 0.04, lo: -0.11, hi: 0.2 },
          { player: 'under', value: -0.4, lo: -0.6, hi: -0.2 },
        ],
      },
      'gk',
    )!;
    expect(countSeparated(block)).toBe(2);
  });

  it('is null when no interval was published at all', () => {
    const block = normaliseRatings({ players: [{ player: 'A', value: 0.4 }] }, 'gk')!;
    expect(countSeparated(block)).toBeNull();
  });
});

describe('rating loaders (real published data)', () => {
  const assertUsable = (block: RatingsBlock | null) => {
    if (block === null) return; // not published on this build — valid
    expect(Array.isArray(block.players)).toBe(true);
    expect(Array.isArray(block.diagnostics)).toBe(true);
    for (const e of block.players) {
      expect(e.player.length).toBeGreaterThan(0);
      if (e.lo !== null && e.hi !== null) expect(e.hi).toBeGreaterThanOrEqual(e.lo);
    }
    // Something must be renderable: a ranking, diagnostics or a stated finding.
    expect(
      block.players.length > 0 || block.diagnostics.length > 0 || block.meta.note !== null,
    ).toBe(true);
  };

  it('loads or skips the goalkeeper feed without throwing', async () => {
    assertUsable(await loadGkRatings());
  });

  it('loads or skips the defender feed without throwing', async () => {
    assertUsable(await loadDefRatings());
  });

  it('loads or skips the contribution feed without throwing', async () => {
    assertUsable(await loadContribRatings());
  });
});
