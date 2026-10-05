import { readCells } from '@/lib/population/compact';
import { HONESTY, TIER_COPY, type Locale } from '@/lib/population/labels';
import type { Parish } from '@/lib/population/places';
import type { ParishRecord, PopulationMeta, PortraitRecipe } from '@/types/population';

export interface HowToReadInput {
  place: Parish;
  record: ParishRecord;
  meta: PopulationMeta;
  locale: Locale;
  fallbackName: string | null;
  municipalityFigures: boolean;
}

/**
 * What a reader needs before the cards. It only describes what this parish's
 * record holds: município figures and «Suprimido» are explained when the
 * record has them (none do in v1.0.1), and «0,0%» always is.
 */
export function howToReadItems({ place, record, meta, locale, fallbackName, municipalityFigures }: HowToReadInput): Array<{ term: string; body: string }> {
  const pt = locale === 'pt';
  const tier = TIER_COPY[place.tier];
  const municipality = fallbackName ?? place.municipalityName;
  const cells = Object.entries(record.responses).flatMap(([recipe, response]) =>
    response && meta.recipes[recipe as PortraitRecipe] ? readCells(response, meta.recipes[recipe as PortraitRecipe], locale) : []);
  const suppressed = cells.some(cell => cell.state === 'suppressed');
  const absent = cells.some(cell => cell.state === 'absent');
  const items: Array<{ term: string; body: string }> = [
    {
      term: tier.label[locale],
      body: pt
        ? `${tier.meaning.pt} O nível descreve o quão perto a população gerada fica das tabelas do INE; não muda de onde vêm os números.`
        : `${tier.meaning.en} The tier describes how close the generated population sits to INE’s tables; it does not change where the numbers come from.`,
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
      ? 'Os números vêm de uma única execução do modelo, por isso não têm uma margem de erro calculada. Lê cada valor por si: esta versão não permite dizer que uma categoria é maior do que outra.'
      : 'The figures come from a single run of the model, so no margin of error is computed for them. Read each value on its own: this release does not support saying that one category is larger than another.',
  });
  return items;
}

