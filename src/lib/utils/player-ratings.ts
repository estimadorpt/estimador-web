/**
 * Normalisers for the position-specific player rating feeds.
 *
 * Three separate models publish here — goalkeepers (goals prevented above
 * expectation), defenders (adjusted plus-minus, which may find no separation
 * at all) and outfield attacking contribution. They are built by different
 * pipelines in the model repo and their field names are not guaranteed to
 * agree with each other or with what this site expected when it was written.
 *
 * So every field is optional and every reader is defensive: unknown shapes
 * degrade to `null` (section does not render) rather than throwing. A feed
 * that arrives with a renamed column loses that column, not the page.
 *
 * A defenders payload carrying *no* ranking is not a failure: ADR-019 in the
 * model repo says "we cannot separate these players" is a legitimate result,
 * and `diagnostics` is where it lands.
 */

/* ------------------------------------------------------------- primitives */

type Json = Record<string, unknown>;

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Finite number or null. Strings that parse cleanly are accepted. */
function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Non-empty trimmed string or null. */
function str(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

function pick(obj: Json, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function pickNum(obj: Json, keys: readonly string[]): number | null {
  return num(pick(obj, keys));
}

function pickStr(obj: Json, keys: readonly string[]): string | null {
  return str(pick(obj, keys));
}

function pickBool(obj: Json, keys: readonly string[]): boolean | null {
  const v = pick(obj, keys);
  return typeof v === 'boolean' ? v : null;
}

/* ------------------------------------------------------------------ types */

/** One player row, whatever the underlying metric is. */
export interface RatingEntry {
  /** Stable key for React lists; unique within a block. */
  key: string;
  player: string;
  team: string | null;
  position: string | null;
  /** Rank as published; when absent the list order stands in. */
  rank: number | null;
  /** Headline point estimate. Null rows still render as "not estimated". */
  value: number | null;
  /** Credible interval bounds. Rendered only when both are present. */
  lo: number | null;
  hi: number | null;
  /** Unmodelled version of the same quantity (raw sum), when published. */
  raw: number | null;
  /** Posterior probability of being above the reference level. */
  pAbove: number | null;
  minutes: number | null;
  matches: number | null;
  /** Sample size for keepers: shots faced. */
  shots: number | null;
  goalsConceded: number | null;
  xgotFaced: number | null;
  goals: number | null;
  assists: number | null;
  /** Rank on the goals-only metric, for the contribution comparison. */
  goalsRank: number | null;
  /** Published rank movement; only used when no rank pair is available. */
  rankChange: number | null;
}

/** Provenance and diagnostics shared by the whole block. */
export interface RatingsMeta {
  season: string | null;
  model: string | null;
  metricLabel: string | null;
  /** What the metric's unit is, when the feed spells it out. */
  unit: string | null;
  /**
   * Interval mass as published, e.g. 90 for a "90% highest-density posterior
   * interval". Never assumed: a feed on a 90% interval must not be labelled
   * 94% because that is what a different model happened to use.
   */
  intervalPct: number | null;
  /** The interval description verbatim, when there is one. */
  intervalLabel: string | null;
  seasons: string[];
  nPlayers: number | null;
  nObservations: number | null;
  minMinutes: number | null;
  maxRhat: number | null;
  divergences: number | null;
  minEssBulk: number | null;
  /**
   * How many players' intervals exclude the reference level. Zero means the
   * model separated nobody — a null result, and the headline of the section
   * rather than a footnote.
   */
  nIntervalsExcludingZero: number | null;
  /** Free-text caveat published alongside the numbers, if any. */
  note: string | null;
  /** The model's own list of caveats, published verbatim. */
  caveats: string[];
}

/** A labelled diagnostic number or statement (the "not separable" payload). */
export interface DiagnosticEntry {
  label: string;
  value: string;
}

/**
 * One row of the by-position distribution of the metric — the acceptance test
 * ADR-019 demands, published by the model and rendered as content. `range`
 * and `nDistinct` are what expose a degenerate position: 53 goalkeepers
 * spanning 0.001 across two distinct values is not a measurement.
 */
export interface PositionalRow {
  position: string;
  n: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  nDistinct: number | null;
  /** The model's own verdict on whether this position is measured at all. */
  degenerate: boolean | null;
}

export interface RatingsBlock {
  meta: RatingsMeta;
  players: RatingEntry[];
  diagnostics: DiagnosticEntry[];
  positional: PositionalRow[];
  /**
   * Whether the model claims it can tell these players apart. `false` means
   * the honest-limitation copy renders instead of a ranking; `null` means the
   * feed said nothing either way.
   */
  separable: boolean | null;
}

export type RatingKind = 'gk' | 'def' | 'contrib';

/* --------------------------------------------------------------- aliases */

const ROW_KEYS = [
  'players',
  'keepers',
  'goalkeepers',
  'defenders',
  'entries',
  'ratings',
  'rows',
  'results',
] as const;

const NAME_KEYS = ['player', 'keeper', 'name', 'player_name'] as const;
const TEAM_KEYS = ['team', 'club', 'team_name'] as const;
const POSITION_KEYS = ['position', 'pos'] as const;
const RANK_KEYS = ['rank', 'position_rank'] as const;
const LO_KEYS = [
  'lo',
  'low',
  'lower',
  'skill_lo',
  'hdi_lo',
  'ci_lo',
  'hdi_3%',
  'q025',
  'value_lo',
] as const;
const HI_KEYS = [
  'hi',
  'high',
  'upper',
  'skill_hi',
  'hdi_hi',
  'ci_hi',
  'hdi_97%',
  'q975',
  'value_hi',
] as const;
// Per-90 raw figures come first: the headline value is per 90, and pairing it
// with a season total would invite a comparison that is not one.
const RAW_KEYS = [
  'goals_prevented_raw_per90',
  'goals_prevented_raw_per_90',
  'raw_per90',
  'raw',
  'raw_goals_prevented',
  'goals_prevented_raw',
  'raw_value',
  'observed',
] as const;
const P_ABOVE_KEYS = [
  'p_above_replacement',
  'p_above_average',
  'p_positive',
  'p_above',
] as const;
const MINUTES_KEYS = ['minutes', 'mins', 'minutes_played'] as const;
const MATCHES_KEYS = ['matches', 'appearances', 'games', 'n_matches'] as const;
const SHOTS_KEYS = ['shots_faced', 'shots', 'n_shots', 'shots_on_target_faced'] as const;
const CONCEDED_KEYS = ['goals_conceded', 'conceded', 'goals_against'] as const;
const XGOT_KEYS = ['xgot_faced', 'xgot', 'xgot_sum', 'expected_goals_on_target'] as const;
const GOALS_KEYS = ['goals'] as const;
const ASSISTS_KEYS = ['assists'] as const;
const GOALS_RANK_KEYS = [
  'goals_rank',
  'rank_goals_only',
  'goals_only_rank',
  'sar_rank',
  'previous_rank',
  'rank_before',
] as const;
const RANK_CHANGE_KEYS = [
  'rank_change_vs_goals_only',
  'rank_change_vs_goals',
  'rank_change',
  'rank_delta',
  'delta_rank',
] as const;

/** Headline-value aliases, most specific first, per metric. */
const VALUE_KEYS: Record<RatingKind, readonly string[]> = {
  gk: [
    'goals_prevented_per90',
    'goals_prevented_per_90',
    'goals_prevented_p90',
    'gp_per_90',
    'gpae_per_90',
    'gpae_p90',
    'goals_prevented_above_expectation_per_90',
    'sar_per90',
    'per_90',
    'modelled',
    'value',
    'estimate',
    'mean',
    'sar',
    'goals_prevented',
  ],
  def: [
    'def_sar',
    'defensive_sar',
    'goals_prevented_per90',
    'goals_prevented_per_90',
    'sar_per90',
    'value',
    'estimate',
    'mean',
    'sar',
  ],
  contrib: [
    'contrib_sar',
    'contribution_sar',
    'sar_contrib',
    'contribution_per_90',
    'sar',
    'value',
    'estimate',
    'mean',
  ],
};

/**
 * The headline value together with its interval.
 *
 * The bounds are looked for as suffixes of whichever key supplied the value
 * (`contrib_sar` → `contrib_sar_lo`, `goals_prevented_per90` →
 * `goals_prevented_per90_lo`) before falling back to generic names. That
 * convention is what these pipelines actually follow, and it guarantees the
 * interval belongs to the number displayed rather than to some other column
 * that happened to be called `lo`.
 */
function pickValueAndInterval(
  row: Json,
  kind: RatingKind,
): { value: number | null; lo: number | null; hi: number | null } {
  const key = VALUE_KEYS[kind].find(
    k => row[k] !== undefined && row[k] !== null && num(row[k]) !== null,
  );
  const value = key ? num(row[key]) : null;

  const suffixed = (suffixes: string[]) =>
    key ? suffixes.map(s => `${key}${s}`) : [];

  return {
    value,
    lo: pickNum(row, [...suffixed(['_lo', '_low', '_lower']), ...LO_KEYS]),
    hi: pickNum(row, [...suffixed(['_hi', '_high', '_upper']), ...HI_KEYS]),
  };
}

/* ------------------------------------------------------------ normalising */

function normaliseMeta(root: Json): RatingsMeta {
  // Provenance is scattered differently by each pipeline: the contribution
  // feed puts it in `generated_from`, the goalkeeper feed splits it between
  // `model` and `sample`. Search all of them rather than privileging one.
  const scopes: Json[] = [root];
  for (const key of [
    'generated_from',
    'model',
    'sample',
    'fit',
    'data',
    'verdict',
    'convergence',
    'diagnostics',
  ]) {
    const v = root[key];
    if (!isObject(v)) continue;
    scopes.push(v);
    // `convergence` holds one block per model specification; the diagnostics
    // that matter sit one level further down.
    for (const nested of Object.values(v)) {
      if (isObject(nested)) scopes.push(nested);
    }
  }
  const from = (keys: readonly string[]) => {
    for (const scope of scopes) {
      const v = pick(scope, keys);
      if (v !== undefined) return v;
    }
    return undefined;
  };

  const seasonsRaw = from(['seasons']);
  let seasons = Array.isArray(seasonsRaw)
    ? seasonsRaw.map(str).filter((s): s is string => s !== null)
    : [];
  if (seasons.length === 0) {
    // The goalkeeper feed names its seasons only as the keys of a count map.
    const bySeason = from(['events_by_season', 'matches_by_season']);
    if (isObject(bySeason)) seasons = Object.keys(bySeason).sort();
  }

  const intervalLabel = pickStr(root, ['interval', 'interval_label', 'hdi']);
  // "90% highest-density posterior interval" → 90. Assuming a number here
  // would be worse than showing none: every feed is on 90%, and the site
  // labelled the goals ranking 94% for a while precisely because nothing
  // carried the real value. Numeric fields are fractions (0.9), so scale.
  const intervalRaw = num(from(['interval_mass', 'interval_pct', 'hdi_prob']));
  const intervalPct = intervalLabel
    ? num(intervalLabel.match(/(\d{1,3}(?:\.\d+)?)\s*%/)?.[1] ?? null)
    : intervalRaw !== null && intervalRaw > 0 && intervalRaw <= 1
      ? Math.round(intervalRaw * 1000) / 10
      : intervalRaw;

  const caveatsRaw = pick(root, ['caveats', 'notes', 'limitations']);
  const caveats = Array.isArray(caveatsRaw)
    ? caveatsRaw
        .map(c => (isObject(c) ? pickStr(c, ['text', 'caveat', 'note', 'label']) : str(c)))
        .filter((c): c is string => c !== null)
    : [];

  return {
    season: pickStr(root, ['season']),
    model: pickStr(root, ['model']),
    metricLabel: pickStr(root, ['metric_label', 'metric', 'label']),
    unit: pickStr(root, ['unit', 'units']),
    intervalPct,
    intervalLabel,
    seasons,
    nPlayers: num(
      from(['n_players', 'n_keepers', 'n_defenders', 'n_keepers_modelled']),
    ),
    // Deliberately not `n_events`: the goalkeeper feed counts matches there,
    // and printing a match count under an "observations" label would misstate
    // the sample.
    nObservations: num(from(['n_observations', 'n_shots', 'n_obs', 'n_rows'])),
    minMinutes: num(from(['min_minutes', 'min_shots'])),
    maxRhat: num(from(['max_rhat', 'rhat_max', 'max_r_hat'])),
    divergences: num(from(['divergences', 'n_divergences'])),
    minEssBulk: num(from(['min_ess_bulk', 'ess_bulk_min'])),
    nIntervalsExcludingZero: num(
      from(['n_intervals_excluding_zero', 'n_separated', 'n_excluding_zero']),
    ),
    note: pickStr(root, ['note', 'caveat', 'sample_note', 'data_note', 'finding']),
    caveats,
  };
}

/**
 * The by-position distribution table, when the feed publishes one.
 *
 * Two shapes are in use: a list of rows carrying their own `position`, and a
 * mapping of position code to summary. Both are read.
 */
function normalisePositional(root: unknown): PositionalRow[] {
  if (!isObject(root)) return [];
  const raw = pick(root, ['positional_distribution', 'by_position', 'positional']);

  const row = (position: string, item: Json): PositionalRow => ({
    position,
    n: pickNum(item, ['n', 'count', 'n_players']),
    median: pickNum(item, ['median', 'p50']),
    min: pickNum(item, ['min', 'vmin']),
    max: pickNum(item, ['max', 'vmax']),
    range: pickNum(item, ['range']),
    nDistinct: pickNum(item, ['n_distinct_3dp', 'n_distinct', 'n_unique', 'distinct']),
    degenerate: pickBool(item, ['degenerate', 'is_degenerate']),
  });

  const out: PositionalRow[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!isObject(item)) continue;
      const position = pickStr(item, POSITION_KEYS);
      if (!position) continue;
      out.push(row(position, item));
    }
  } else if (isObject(raw)) {
    for (const [position, item] of Object.entries(raw)) {
      if (!isObject(item)) continue;
      out.push(row(position, item));
    }
  }
  return out;
}

function normaliseRow(row: unknown, kind: RatingKind, index: number): RatingEntry | null {
  if (!isObject(row)) return null;
  const player = pickStr(row, NAME_KEYS);
  // A row without a name cannot be displayed or linked; drop it.
  if (!player) return null;

  const team = pickStr(row, TEAM_KEYS);
  const { value, lo, hi } = pickValueAndInterval(row, kind);
  return {
    key: `${player}|${team ?? ''}|${index}`,
    player,
    team,
    position: pickStr(row, POSITION_KEYS),
    rank: pickNum(row, RANK_KEYS),
    value,
    lo,
    hi,
    raw: pickNum(row, RAW_KEYS),
    pAbove: pickNum(row, P_ABOVE_KEYS),
    minutes: pickNum(row, MINUTES_KEYS),
    matches: pickNum(row, MATCHES_KEYS),
    shots: pickNum(row, SHOTS_KEYS),
    goalsConceded: pickNum(row, CONCEDED_KEYS),
    xgotFaced: pickNum(row, XGOT_KEYS),
    goals: pickNum(row, GOALS_KEYS),
    assists: pickNum(row, ASSISTS_KEYS),
    goalsRank: pickNum(row, GOALS_RANK_KEYS),
    rankChange: pickNum(row, RANK_CHANGE_KEYS),
  };
}

/** Find the array of player rows, wherever the exporter decided to put it. */
function findRows(root: unknown): unknown[] {
  if (Array.isArray(root)) return root;
  if (!isObject(root)) return [];
  for (const key of ROW_KEYS) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

/**
 * Diagnostics as a flat label/value list. Accepts either a mapping
 * (`{collinearity: 0.93}`) or an array of `{label, value}`-ish records.
 */
function normaliseDiagnostics(root: unknown): DiagnosticEntry[] {
  if (!isObject(root)) return [];
  const out: DiagnosticEntry[] = [];
  const seen = new Set<string>();

  // snake_case is how these arrive; nobody wants to read it in a table.
  const prettify = (key: string) =>
    key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

  const push = (label: string | null, value: unknown) => {
    if (!label || seen.has(label)) return;
    const asNum = num(value);
    const text =
      asNum !== null
        ? String(asNum)
        : typeof value === 'boolean'
          ? value
            ? 'true'
            : 'false'
          : str(value);
    if (text === null) return;
    seen.add(label);
    out.push({ label: prettify(label), value: text });
  };

  // `verdict` is where the defensive model puts its pre-registered decision;
  // `diagnostics` is the generic name. Read both, first one wins per key.
  for (const key of ['diagnostics', 'verdict', 'diagnostic', 'summary']) {
    const raw = root[key];
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (!isObject(item)) continue;
        push(pickStr(item, ['label', 'name', 'metric', 'key']), pick(item, ['value', 'v']));
      }
    } else if (isObject(raw)) {
      for (const [label, value] of Object.entries(raw)) {
        if (isObject(value) || Array.isArray(value)) continue;
        push(label, value);
      }
    }
  }

  return out;
}

/**
 * Turn a raw parsed feed into a `RatingsBlock`, or null when there is nothing
 * worth rendering (no named players *and* no diagnostics).
 */
export function normaliseRatings(root: unknown, kind: RatingKind): RatingsBlock | null {
  if (!isObject(root) && !Array.isArray(root)) return null;

  const players = findRows(root)
    .map((row, i) => normaliseRow(row, kind, i))
    .filter((e): e is RatingEntry => e !== null);

  const meta = normaliseMeta(isObject(root) ? root : {});
  const diagnostics = normaliseDiagnostics(root);
  const positional = normalisePositional(root);

  let separable = isObject(root)
    ? pickBool(root, ['separable', 'players_separable', 'is_separable'])
    : null;
  if (separable === null && isObject(root)) {
    const negated = pickBool(root, ['not_separable', 'inseparable']);
    if (negated !== null) separable = !negated;
  }
  // No usable ranking is itself the answer: the players could not be told
  // apart (or the fit was not published). Either way, no ranking renders.
  if (players.length === 0) separable = false;

  if (
    players.length === 0 &&
    diagnostics.length === 0 &&
    positional.length === 0 &&
    !meta.note &&
    meta.caveats.length === 0
  ) {
    return null;
  }

  // Rank rows that arrived unranked, so the UI always has an ordering.
  const ordered = [...players].sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return (b.value ?? -Infinity) - (a.value ?? -Infinity);
  });
  ordered.forEach((entry, i) => {
    if (entry.rank === null) entry.rank = i + 1;
  });

  return { meta, players: ordered, diagnostics, positional, separable };
}

/**
 * How many published rows have an interval that excludes the reference level.
 *
 * Prefers the model's own count. Computing it here from the bounds is the
 * fallback, and it answers the only question that matters before printing a
 * ranking: did this model separate anybody at all?
 */
export function countSeparated(block: RatingsBlock): number | null {
  if (block.meta.nIntervalsExcludingZero !== null) {
    return block.meta.nIntervalsExcludingZero;
  }
  const withInterval = block.players.filter(e => e.lo !== null && e.hi !== null);
  if (withInterval.length === 0) return null;
  return withInterval.filter(e => e.lo! > 0 || e.hi! < 0).length;
}

/* ------------------------------------------------------------- rendering */

/**
 * Shared symmetric-ish domain for a set of rows: covers every interval bound
 * and always includes zero, so a metric that can go negative (goals prevented
 * below expectation) renders around a visible baseline.
 */
export function ratingDomain(entries: readonly RatingEntry[]): { min: number; max: number } {
  const values: number[] = [0];
  for (const e of entries) {
    for (const v of [e.value, e.lo, e.hi]) {
      if (v !== null && Number.isFinite(v)) values.push(v);
    }
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Degenerate feeds (single value, all zeros) still need a drawable width.
  if (max - min < 1e-9) return { min: min - 0.5, max: max + 0.5 };
  return { min, max };
}

/** Position of `v` on the shared domain, as a 0-100 percentage, clamped. */
export function ratingPct(v: number, domain: { min: number; max: number }): number {
  const span = domain.max - domain.min;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((v - domain.min) / span) * 100));
}

/** Accent- and case-insensitive key for cross-feed name matching. */
function nameKey(name: string): string {
  let out = '';
  for (const ch of name.normalize('NFD')) {
    const code = ch.codePointAt(0) ?? 0;
    // Drop Unicode combining diacritical marks (U+0300–U+036F).
    if (code >= 0x300 && code <= 0x36f) continue;
    out += ch;
  }
  return out.toLowerCase().trim();
}

/**
 * Find a player's row in a ratings block.
 *
 * Match order: name and club together, then name alone, each tried exactly
 * before accent-insensitively. The feeds are written by different pipelines,
 * so their name strings need not agree byte for byte — but where a club is
 * known it settles namesakes, which are common in Portuguese football. A miss
 * means the player page shows no position metric, which is the correct
 * outcome.
 */
export function findRating(
  block: RatingsBlock | null | undefined,
  player: string,
  team?: string | null,
): RatingEntry | null {
  if (!block?.players.length) return null;
  const key = nameKey(player);
  const teamKey = team ? nameKey(team) : null;

  const candidates: ((e: RatingEntry) => boolean)[] = [];
  if (teamKey !== null) {
    candidates.push(e => e.player === player && e.team === team);
    candidates.push(
      e => nameKey(e.player) === key && e.team !== null && nameKey(e.team) === teamKey,
    );
  }
  candidates.push(e => e.player === player);
  candidates.push(e => nameKey(e.player) === key);

  for (const predicate of candidates) {
    const hit = block.players.find(predicate);
    if (hit) return hit;
  }
  return null;
}

/**
 * Whether the goals-only skill number is meaningful for a position.
 *
 * ADR-019: the metric's outcome variable is goals, so goalkeepers all land on
 * an identical floor value and defenders sit in a band barely wider than the
 * rounding. Displaying it on those pages would be publishing a number that
 * says only "this player is a defender".
 */
export function goalsSarIsMeaningful(position: string | null | undefined): boolean {
  if (!position) return true;
  const p = position.trim().toUpperCase();
  return p !== 'G' && p !== 'D';
}

/**
 * Movement between the goals-only ranking and this one, positive when the
 * player climbs. Prefers a rank pair (unambiguous) over a published delta
 * whose sign convention we cannot verify.
 */
export function rankMovement(
  entry: RatingEntry,
  goalsRankByPlayer?: Record<string, number>,
): number | null {
  const before = entry.goalsRank ?? goalsRankByPlayer?.[entry.player] ?? null;
  if (before !== null && entry.rank !== null) return before - entry.rank;
  return entry.rankChange;
}
