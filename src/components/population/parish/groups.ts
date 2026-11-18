import { isPortraitRecipe, type Locale } from '@/lib/population/labels';
import type { ParishRecord, PopulationMeta, PortraitRecipe } from '@/types/population';

export interface ParishGroup {
  id: string;
  title: Record<Locale, string>;
  /** A paragraph under the heading (the modelled section says what "modelled" means). */
  lede?: Record<Locale, string>;
  recipes: PortraitRecipe[];
}

/**
 * People questions first, then origin, work and homes, then the modelled
 * questions apart, under their label; each group keeps the producer's order.
 * A group shows only the questions the release answers, and a group with none
 * is not drawn (v1.0.3 has only the first and the fourth).
 */
export const GROUPS: ParishGroup[] = [
  { id: 'pessoas', title: { pt: 'Pessoas', en: 'People' }, recipes: ['elders_alone', 'who_lives_alone', 'age', 'employment', 'education', 'literate', 'marital', 'income_source'] },
  { id: 'origem', title: { pt: 'Origem', en: 'Origin' }, recipes: ['nationality', 'lived_abroad'] },
  { id: 'trabalho-e-deslocacoes', title: { pt: 'Trabalho e deslocações', en: 'Work and commuting' }, recipes: ['sitprof', 'occupation', 'industry', 'work_place', 'transport'] },
  { id: 'casas', title: { pt: 'Casas e famílias', en: 'Homes and families' }, recipes: ['multigenerational', 'household_size', 'household_type', 'tenure', 'rooms', 'building_period', 'accessibility'] },
  {
    id: 'modelado',
    title: { pt: 'Modelado', en: 'Modelled' },
    lede: {
      pt: 'Nenhum quadro do INE fixa estes números freguesia a freguesia. Cada pessoa gerada recebe um valor de um modelo, ancorado no máximo ao concelho; a fonte de cada cartão diz o que o fixa, se alguma coisa o fixa. As diferenças entre freguesias do mesmo concelho são, em boa parte, do modelo.',
      en: 'No INE table fixes these figures parish by parish. Each generated person is given a value by a model, anchored at most to the municipality; each card’s source says what, if anything, fixes it. Differences between parishes of the same municipality are largely the model’s.',
    },
    recipes: ['income', 'birthplace', 'residence_2019', 'school_attendance'],
  },
];

/**
 * The page's sections for one parish: each group's questions in the
 * producer's order (`recipe_order`), only those this release answers for this
 * parish and that the site has words for, and no empty group.
 */
export function parishGroups(order: readonly string[], record: Pick<ParishRecord, 'responses'>, recipes: PopulationMeta['recipes']): ParishGroup[] {
  const answers = (recipe: PortraitRecipe) => Boolean(record.responses[recipe] && recipes[recipe]);
  return GROUPS
    .map(group => ({ ...group, recipes: order.filter((name): name is PortraitRecipe => isPortraitRecipe(name) && group.recipes.includes(name) && answers(name)) }))
    .filter(group => group.recipes.length > 0);
}
