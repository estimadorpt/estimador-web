import { readCells } from '@/lib/population/compact';
import { HONESTY, TIER_COPY, tierMeaningFor, type Locale, type WorstTable } from '@/lib/population/labels';
import type { ParishRecord, PopulationMeta, PortraitRecipe } from '@/types/population';

/** The facts about a place this list needs (from the parish file's `place`, or places.json). */
export interface HowToReadPlace {
  tier: 'A' | 'B' | 'C';
  municipalityName: string;
  /** The count the tier was decided on; without it the tier gets its generic words. */
  publicationPopulation?: number | null;
  /** INE's residents: named when it and the tier's count sit on either side of a threshold. */
  censusPopulation?: number | null;
  /** quality.csv's worst table (parish file only): a tier C parish of 500 or more says what set its tier. */
  worst?: WorstTable | null;
}

export interface HowToReadInput {
  place: HowToReadPlace;
  record: ParishRecord;
  meta: PopulationMeta;
  locale: Locale;
  fallbackName: string | null;
  municipalityFigures: boolean;
}

/**
 * What a reader needs before the cards. It only describes what this parish's
 * record holds: município figures and «Suprimido» are explained when the
 * record has them (none do since v1.0.1), and «0,0%» always is. The tier's
 * meaning is this parish's: a tier B parish under 2,000 residents is told it
 * cannot be A whatever its fit.
 */
export function howToReadItems({ place, record, meta, locale, fallbackName, municipalityFigures }: HowToReadInput): Array<{ term: string; body: string }> {
  const pt = locale === 'pt';
  const tier = TIER_COPY[place.tier];
  const meaning = tierMeaningFor(place.tier, place.publicationPopulation, place.censusPopulation, place.worst)[locale];
  const municipality = fallbackName ?? place.municipalityName;
  const cells = Object.entries(record.responses).flatMap(([recipe, response]) =>
    response && meta.recipes[recipe as PortraitRecipe] ? readCells(response, meta.recipes[recipe as PortraitRecipe], locale) : []);
  const suppressed = cells.some(cell => cell.state === 'suppressed');
  const absent = cells.some(cell => cell.state === 'absent');
  const items: Array<{ term: string; body: string }> = [
    {
      term: tier.label[locale],
      body: pt
        ? `${meaning} O nível junta o ajuste às tabelas do INE e o número de residentes; não muda de onde vêm os números.`
        : `${meaning} The tier combines the fit to INE’s tables and the number of residents; it does not change where the numbers come from.`,
    },
  ];
  if (municipalityFigures) {
    items.push({
      term: pt ? 'Valores do concelho' : 'Municipality figures',
      body: pt
        ? `Aqui, os cartões mostram os valores do concelho de ${municipality}, que inclui esta freguesia. Cada cartão diz de onde vêm os seus números.`
        : `Here the cards show the figures for ${municipality} municipality, which includes this parish. Every card says where its numbers come from.`,
    });
  }
  items.push({ term: pt ? '«0,0%»' : '“0.0%”', body: HONESTY.zeroMeaning[locale] });
  if (suppressed) {
    items.push({
      term: pt ? '«Suprimido»' : '“Suppressed”',
      body: pt
        ? `Menos de ${meta.minimum_cell} pessoas geradas nessa categoria, por isso o valor não é publicado. Não quer dizer zero.`
        : `Fewer than ${meta.minimum_cell} generated people in that category, so the value is not published. It does not mean zero.`,
    });
  }
  if (absent) {
    items.push({
      term: '«—»',
      body: pt ? 'A resposta não traz essa categoria. Não quer dizer zero.' : 'The answer does not carry that category. It does not mean zero.',
    });
  }
  // HONESTY.singleRun in words a first-time reader can act on.
  items.push({
    term: pt ? 'Uma só execução' : 'A single run',
    body: pt
      ? 'Os números vêm de uma única execução do modelo e não têm margem de erro calculada; por isso esta página não compara categorias nem freguesias.'
      : 'The figures come from a single run of the model and have no computed margin of error; that is why this page does not compare categories or parishes.',
  });
  return items;
}
