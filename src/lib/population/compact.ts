/**
 * Reading the compact population files.
 *
 * `rebuildResponse` is the exact inverse of `compact()` in
 * scripts/sync-population.py: it returns the producer's contract-v1 response,
 * byte for byte. The sync proves that against the bundle; the tests prove it
 * again in CI by validating every rebuilt response and re-hashing its query.
 *
 * `readCells` is what the pages draw: the response's own cells, in each
 * dimension's natural order, with the producer's display strings. Nothing is
 * recomputed — no sums, no remainders, no re-rounding.
 */
import type {
  CompactResponse,
  GeographyRef,
  PopulationMeta,
  PopulationRecipe,
  PublicResponseV1,
} from '@/types/population';
import { NOT_PUBLISHED, SUPPRESSED, VALUES, valueLabel, type Locale } from './labels';

export function rebuildResponse(
  record: CompactResponse,
  recipe: PopulationRecipe,
  geography: GeographyRef,
  meta: Pick<PopulationMeta, 'contract_version' | 'release_version' | 'data_status' | 'display' | 'provenance' | 'links' | 'minimum_cell'>,
): PublicResponseV1 {
  const fallback = record.decision === 'fallback' && record.resolved
    ? { level: 'municipio' as const, code: record.resolved, name: null }
    : null;
  return {
    contract_version: meta.contract_version,
    data_status: meta.data_status,
    query: {
      contract_version: meta.contract_version,
      release_version: meta.release_version,
      geography,
      unit: recipe.unit,
      dimensions: recipe.dimensions,
      filters: recipe.filters,
      measure: recipe.measure,
      normalization: recipe.normalization,
    },
    query_id: record.id,
    resolved_geography: fallback ?? geography,
    quality: {
      decision: record.decision,
      requested_tier: record.requested_tier,
      resolved_tier: record.resolved_tier,
      reasons: record.reasons,
      fallback_geography: fallback,
      minimum_cell: meta.minimum_cell,
    },
    display: meta.display,
    cells: record.cells.map(cell => {
      const suppressed = cell.length > 3;
      return {
        coordinates: Object.fromEntries(recipe.dimensions.map((dimension, i) => [dimension, cell[0][i]])),
        count: null,
        share: cell[1],
        display_value: cell[2],
        suppressed,
        suppression_reason: suppressed ? (cell[3] as string) : null,
        variation: null,
      };
    }),
    provenance: meta.provenance,
    links: {
      canonical_path: `/populacao/v/${meta.release_version}/q/${record.id}`,
      ...meta.links,
    },
  };
}

/** The canonical query JSON the producer hashes into a query_id. */
export function canonicalQuery(query: PublicResponseV1['query']): string {
  // Python sorts (field, operator, values) by code point; so does `<` on strings.
  const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  const filters = [...query.filters].sort((a, b) =>
    compare(a.field, b.field) || compare(a.operator, b.operator) || compare(a.values.join('\u0000'), b.values.join('\u0000')));
  return stableStringify({ ...query, filters });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * A share as the producer rounded it, in the reader's number format: "17.2%"
 * stays "17.2%" in English and becomes "17,2%" in Portuguese. Re-formatting the
 * float instead could round a tie differently from the published value.
 */
export function formatDisplay(display: string, locale: Locale): string {
  if (display === 'Suprimido') return SUPPRESSED[locale];
  // The producer writes pt-PT decimals from v1.0.2 ("17,2%") and wrote a dot
  // before; only the decimal mark of a share changes, never its digits.
  const share = /^(\d+)[.,](\d+)%$/.exec(display);
  if (!share) return display;
  return `${share[1]}${locale === 'pt' ? ',' : '.'}${share[2]}%`;
}

export type CellState = 'published' | 'suppressed' | 'absent';

export interface ReadCell {
  /** Coordinate values, in dimension order. */
  values: string[];
  /** Labels for each coordinate, in dimension order. */
  labels: string[];
  share: number | null;
  /** The value as the reader sees it ("17,2%", "Suprimido", or "—"). */
  display: string;
  state: CellState;
}

/**
 * The cells to draw, in natural category order. Since v1.0.1 every category is
 * in the response, with a share of 0 ("0,0%" from v1.0.2) when no generated person is in
 * it. A category a response does not carry still comes back as `absent`, shown
 * as a dash and never as zero; suppressed cells keep their label. For a two-way
 * response the order is row by row.
 */
export function readCells(record: CompactResponse, recipe: PopulationRecipe, locale: Locale): ReadCell[] {
  const present = new Map(record.cells.map(cell => [cell[0].join('|'), cell]));
  const orders = recipe.dimensions.map(dimension =>
    (VALUES[dimension] ?? []).map(entry => entry.value));
  const combos = orders.reduce<string[][]>(
    (acc, values) => acc.flatMap(prefix => values.map(value => [...prefix, value])),
    [[]],
  );
  // Anything the label table does not know is still shown, after the known order.
  for (const cell of record.cells) {
    if (!combos.some(combo => combo.join('|') === cell[0].join('|'))) combos.push(cell[0]);
  }
  return combos.map(values => {
    const cell = present.get(values.join('|'));
    const labels = values.map((value, i) => valueLabel(recipe.dimensions[i], value, locale));
    if (!cell) return { values, labels, share: null, display: '—', state: 'absent' as const };
    if (cell.length > 3) return { values, labels, share: null, display: SUPPRESSED[locale], state: 'suppressed' as const };
    return { values, labels, share: cell[1], display: formatDisplay(cell[2], locale), state: 'published' as const };
  });
}

/**
 * Whether the response may be drawn as a whole (a 100-person grid, a stacked
 * bar): only when nothing is suppressed. With one suppressed cell, the
 * remainder of a part-to-whole picture *is* the suppressed value.
 */
export function isWhole(record: CompactResponse): boolean {
  return record.decision !== 'refuse' && record.cells.length > 0 && record.cells.every(cell => cell.length === 3);
}

/** The single cell a card leads with, if the copy names one and it is published. */
export function headlineCell(record: CompactResponse, recipe: PopulationRecipe, coordinates: Record<string, string> | undefined) {
  if (!coordinates || record.decision === 'refuse') return null;
  const key = recipe.dimensions.map(dimension => coordinates[dimension]).join('|');
  const cell = record.cells.find(item => item[0].join('|') === key);
  if (!cell || cell.length > 3) return null;
  return { share: cell[1] as number, display: cell[2] };
}

export const NOT_PUBLISHED_LABEL = NOT_PUBLISHED;
