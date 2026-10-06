/**
 * Which way a table twin's columns align (UXD3-08): figures to the right, so
 * a column of percentages lines up on its last digit, and words to the left.
 * Pure, so ChartTable stays a plain component and the rule has its own test.
 */

export type ColumnAlign = 'left' | 'right';

/**
 * A cell that holds a figure: digits with their signs, separators and marks
 * ("51%", "<0,1%", "−7,2 pp", "1 236", "12.º", "0,23"), and at most one unit
 * word. A letter anywhere else ("J2", "Porto", "14 ago.") makes it text.
 */
const FIGURE = /^(?:[^\p{L}]|[ºª])*(?:pp|p\.p\.|pts?|mil|x)?(?:[^\p{L}]|[ºª])*$/u;
/** What a table prints for a missing value; it says nothing about the column. */
const MISSING = new Set(['', '—', '–', '-', '…']);

/** True when every cell of column `j` is a figure (or missing) and at least one has a digit. */
export function isFigureColumn(rows: ReadonlyArray<ReadonlyArray<string | number>>, j: number): boolean {
  let figures = 0;
  for (const row of rows) {
    const value = row[j];
    if (typeof value === 'number') {
      figures++;
      continue;
    }
    const text = String(value ?? '').trim();
    if (MISSING.has(text)) continue;
    if (!FIGURE.test(text) || !/\d/.test(text)) return false;
    figures++;
  }
  return figures > 0;
}

/**
 * One alignment per column: the first (the row's label) always left, the
 * others right when they hold figures, unless the caller says otherwise.
 */
export function columnAlignments(
  columnCount: number,
  rows: ReadonlyArray<ReadonlyArray<string | number>>,
  given?: ReadonlyArray<ColumnAlign | undefined>,
): ColumnAlign[] {
  return Array.from({ length: columnCount }, (_, j) => {
    if (j === 0) return 'left';
    return given?.[j] ?? (isFigureColumn(rows, j) ? 'right' : 'left');
  });
}
