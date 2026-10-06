/**
 * The table twin's rows for a population card, kept apart from the component
 * so they can be tested on the published files.
 */
import type { Locale } from '@/lib/population/labels';
import type { readCells } from '@/lib/population/compact';
import type { PortraitRecipe } from '@/types/population';

type Cells = ReturnType<typeof readCells>;

/** Every share in the band is a published zero: nobody of that age lives alone in the generated population. */
export const emptyBand = (rows: Cells) => rows.every(row => row.state === 'published' && row.share === 0);

export const NOBODY_ALONE: Record<Locale, string> = {
  pt: 'Ninguém desta faixa etária vive sozinho na população gerada.',
  en: 'Nobody in this age band lives alone in the generated population.',
};

/**
 * The table twin's rows. In "Quem vive sozinho trabalha?" an age band with
 * nobody living alone has every share at 0,0% (the producer's zero for an
 * empty band): its rows would add up to 0% under a question that says each
 * band adds up to 100%, so the twin gives that band one row with the chart's
 * sentence instead, as the chart does (POP3-ACC-07).
 */
export function twinRows(recipeName: PortraitRecipe, cells: Cells, locale: Locale): string[][] {
  if (recipeName !== 'who_lives_alone') return cells.map(cell => [...cell.labels, cell.display]);
  const rows: string[][] = [];
  for (const [band, bandCells] of groupByBand(cells)) {
    if (emptyBand(bandCells)) rows.push([band, NOBODY_ALONE[locale], '—']);
    else rows.push(...bandCells.map(cell => [...cell.labels, cell.display]));
  }
  return rows;
}

export function groupByBand(cells: Cells) {
  const bands = new Map<string, typeof cells>();
  for (const cell of cells) bands.set(cell.labels[0], [...(bands.get(cell.labels[0]) ?? []), cell]);
  return bands;
}

