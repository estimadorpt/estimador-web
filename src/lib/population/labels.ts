/**
 * Words for the synthetic population: card questions, category labels and the
 * quality / fallback / refusal copy. Every surface takes its wording from here
 * so the same thing is never called two names.
 *
 * The producer's own card titles drop their filters ("Vive sozinho" is in fact
 * "people aged 65+ who live alone"), so each question below states its
 * population in full. Categories are listed in their natural order, never by
 * size: with a single model run nothing here may rank (handoff §3).
 */
import { POPULATION_RELEASE } from '@/lib/config/population';
import type { PortraitRecipe, QualityTier, ReasonCode } from '@/types/population';

export type Locale = 'pt' | 'en';
type Text = Record<Locale, string>;

export interface RecipeCopy {
  /** The card's question, the heading a reader scans for. */
  question: Text;
  /** A short name for tables of contents, share cards and the game. */
  short: Text;
  /** Who is counted, and anything a reader would get wrong without it. */
  population: Text;
  /** The permalink anchor on a parish page. */
  anchor: string;
  /** The response cell to lead with as a single number, if one stands for the card. */
  headline?: Record<string, string>;
}

export const RECIPE_COPY: Record<PortraitRecipe, RecipeCopy> = {
  elders_alone: {
    question: {
      pt: 'Quantas pessoas com 65 ou mais anos vivem sozinhas?',
      en: 'How many people aged 65 or over live alone?',
    },
    short: { pt: 'Pessoas com 65+ que vivem sozinhas', en: 'People aged 65+ living alone' },
    population: {
      pt: 'Pessoas com 65 ou mais anos. Quem vive num lar ou noutro alojamento coletivo conta como vivendo com outras pessoas.',
      en: 'People aged 65 or over. Residents of care homes and other collective living quarters count as living with others.',
    },
    anchor: 'vivem-sozinhas',
    headline: { living_alone: 'yes' },
  },
  who_lives_alone: {
    question: { pt: 'Quem vive sozinho?', en: 'Who lives alone?' },
    short: { pt: 'Quem vive sozinho', en: 'Who lives alone' },
    population: {
      pt: 'Pessoas que vivem sozinhas. Em cada faixa etária, como se dividem entre empregadas, desempregadas e inativas; cada linha tem as suas próprias percentagens.',
      en: 'People who live alone. Within each age band, how they split between employed, unemployed and inactive; each row has its own percentages.',
    },
    anchor: 'quem-vive-sozinho',
  },
  multigenerational: {
    question: {
      pt: 'Quantas casas juntam crianças e pessoas com 65 ou mais anos?',
      en: 'How many homes bring together children and people aged 65 or over?',
    },
    short: { pt: 'Agregados com criança e pessoa de 65+', en: 'Households with a child and someone 65+' },
    population: {
      pt: 'Agregados privados com pelo menos uma pessoa com menos de 15 anos e outra com 65 ou mais. Não são necessariamente avós e netos.',
      en: 'Private households with at least one person under 15 and another aged 65 or over. They are not necessarily grandparents and grandchildren.',
    },
    anchor: 'varias-geracoes',
    headline: { multigenerational: 'yes' },
  },
  age: {
    question: { pt: 'Que idades têm?', en: 'How old are they?' },
    short: { pt: 'Idades', en: 'Ages' },
    population: { pt: 'Todas as pessoas, por grupo de cinco anos de idade.', en: 'Everyone, in five-year age groups.' },
    anchor: 'idades',
  },
  employment: {
    question: { pt: 'Qual é a condição perante o trabalho?', en: 'What is their employment status?' },
    short: { pt: 'Condição perante o trabalho', en: 'Employment status' },
    population: {
      pt: 'Todas as pessoas. Crianças, estudantes e reformados contam como inativos.',
      en: 'Everyone. Children, students and retired people count as inactive.',
    },
    anchor: 'trabalho',
  },
  education: {
    question: { pt: 'Que escolaridade têm?', en: 'What education do they have?' },
    short: { pt: 'Escolaridade', en: 'Education' },
    population: {
      pt: 'Todas as pessoas, pelo nível mais alto que completaram. As crianças contam em «Nenhum» até completarem o 1.º ciclo.',
      en: 'Everyone, by the highest level completed. Children count under "None" until they complete the first cycle of basic education.',
    },
    anchor: 'escolaridade',
  },
  household_size: {
    question: { pt: 'Quantas pessoas vivem em cada casa?', en: 'How many people live in each home?' },
    short: { pt: 'Pessoas por agregado', en: 'People per household' },
    population: {
      pt: 'Agregados por número de pessoas. Cada alojamento coletivo (um lar, por exemplo) conta como um agregado.',
      en: 'Households by number of people. Each collective living quarter (a care home, for example) counts as one household.',
    },
    anchor: 'pessoas-por-casa',
  },
  household_type: {
    question: { pt: 'Que famílias formam?', en: 'What families do they form?' },
    short: { pt: 'Núcleos familiares por agregado', en: 'Family nuclei per household' },
    population: {
      pt: 'Agregados pelo número de núcleos familiares: um casal, com ou sem filhos, ou um pai ou uma mãe com filhos. Inclui os alojamentos coletivos.',
      en: 'Households by number of family nuclei: a couple, with or without children, or a parent with children. Includes collective living quarters.',
    },
    anchor: 'familias',
  },
};

/** Dimension names, for table headers. */
export const DIMENSION_LABEL: Record<string, Text> = {
  living_alone: { pt: 'Situação', en: 'Living arrangement' },
  age_story_band: { pt: 'Faixa etária', en: 'Age band' },
  employment_status_coarse3: { pt: 'Condição perante o trabalho', en: 'Employment status' },
  multigenerational: { pt: 'Agregado', en: 'Household' },
  age_5y: { pt: 'Idade', en: 'Age' },
  education_level_coarse5: { pt: 'Escolaridade', en: 'Education' },
  hh_size_bin: { pt: 'Pessoas no agregado', en: 'People in the household' },
  hh_type_top: { pt: 'Núcleos familiares', en: 'Family nuclei' },
};

const AGE_BANDS = [
  '0 - 4 anos', '5 - 9 anos', '10 - 14 anos', '15 - 19 anos', '20 - 24 anos', '25 - 29 anos', '30 - 34 anos',
  '35 - 39 anos', '40 - 44 anos', '45 - 49 anos', '50 - 54 anos', '55 - 59 anos', '60 - 64 anos', '65 - 69 anos',
  '70 - 74 anos', '75 - 79 anos', '80 - 84 anos', '85 - 89 anos', '90 ou mais anos',
];

function ageLabel(value: string): Text {
  if (value === '90 ou mais anos') return { pt: '90+', en: '90+' };
  const [low, high] = value.replace(' anos', '').split(' - ');
  return { pt: `${low}–${high}`, en: `${low}–${high}` };
}

/** Every category value, in its natural order, with its words. */
export const VALUES: Record<string, Array<{ value: string; label: Text }>> = {
  living_alone: [
    { value: 'yes', label: { pt: 'Vivem sozinhas', en: 'Live alone' } },
    { value: 'no', label: { pt: 'Vivem com outras pessoas', en: 'Live with others' } },
  ],
  multigenerational: [
    { value: 'yes', label: { pt: 'Com criança e pessoa de 65+', en: 'With a child and someone 65+' } },
    { value: 'no', label: { pt: 'Outros agregados', en: 'Other households' } },
  ],
  age_story_band: [
    { value: 'under_45', label: { pt: 'Menos de 45 anos', en: 'Under 45' } },
    { value: '45_64', label: { pt: '45 a 64 anos', en: '45 to 64' } },
    { value: '65_plus', label: { pt: '65 ou mais anos', en: '65 or over' } },
  ],
  employment_status_coarse3: [
    { value: '11', label: { pt: 'Empregadas', en: 'Employed' } },
    { value: '12', label: { pt: 'Desempregadas', en: 'Unemployed' } },
    { value: '2', label: { pt: 'Inativas', en: 'Inactive' } },
  ],
  education_level_coarse5: [
    { value: '1', label: { pt: 'Nenhum', en: 'None' } },
    { value: '2', label: { pt: 'Ensino básico', en: 'Basic education' } },
    { value: '3', label: { pt: 'Ensino secundário', en: 'Upper secondary' } },
    { value: '4', label: { pt: 'Pós-secundário', en: 'Post-secondary' } },
    { value: '5', label: { pt: 'Ensino superior', en: 'Tertiary' } },
  ],
  hh_size_bin: [
    { value: '1', label: { pt: '1 pessoa', en: '1 person' } },
    { value: '2', label: { pt: '2 pessoas', en: '2 people' } },
    { value: '3', label: { pt: '3 pessoas', en: '3 people' } },
    { value: '4', label: { pt: '4 pessoas', en: '4 people' } },
    { value: '5', label: { pt: '5 ou mais', en: '5 or more' } },
  ],
  hh_type_top: [
    { value: '1', label: { pt: 'Sem núcleo familiar', en: 'No family nucleus' } },
    { value: '2', label: { pt: 'Um núcleo', en: 'One nucleus' } },
    { value: '3', label: { pt: 'Dois núcleos', en: 'Two nuclei' } },
    { value: '4', label: { pt: 'Três ou mais núcleos', en: 'Three or more nuclei' } },
    // The producer leaves institutional containers unlabelled ("<NA>").
    { value: '<NA>', label: { pt: 'Alojamento coletivo', en: 'Collective living quarters' } },
  ],
  age_5y: AGE_BANDS.map(value => ({ value, label: ageLabel(value) })),
};

export function valueLabel(dimension: string, value: string, locale: Locale): string {
  return VALUES[dimension]?.find(entry => entry.value === value)?.label[locale] ?? value;
}

/**
 * The quality tiers are reading guides, not publication gates: since v1.0.1
 * every parish answers every question with its own numbers and its tier.
 * Thresholds from release.json `quality_tier_policy` (doc 27 §7.2): A has a
 * median SRMSE of at most 0.10, a worst table of at most 0.18 and 2,000 or more
 * residents; B at most 0.15 / 0.26 and 500 or more residents; C is the rest.
 */
export const TIER_COPY: Record<'A' | 'B' | 'C', { label: Text; meaning: Text }> = {
  A: {
    label: { pt: 'Qualidade A', en: 'Quality A' },
    meaning: {
      pt: 'Freguesia com 2 000 ou mais residentes em que a população gerada reproduz de perto as tabelas publicadas pelo INE.',
      en: 'A parish of 2,000 or more residents where the generated population closely reproduces the tables INE publishes.',
    },
  },
  B: {
    label: { pt: 'Qualidade B', en: 'Quality B' },
    meaning: {
      pt: 'Freguesia com 500 ou mais residentes e um ajuste próximo às tabelas do INE, um pouco menos apertado do que no nível A.',
      en: 'A parish of 500 or more residents with a close fit to INE’s tables, a little looser than tier A.',
    },
  },
  C: {
    label: { pt: 'Qualidade C', en: 'Quality C' },
    meaning: {
      pt: 'Freguesia pequena (menos de 500 residentes) ou com um ajuste mais fraco às tabelas do INE: lê os números com mais cuidado.',
      en: 'A small parish (under 500 residents) or one with a weaker fit to INE’s tables: read the numbers with more care.',
    },
  },
};

export function tierLabel(tier: QualityTier | null, locale: Locale): string {
  if (tier === 'A' || tier === 'B' || tier === 'C') return TIER_COPY[tier].label[locale];
  return locale === 'pt' ? 'Sem classificação' : 'Unrated';
}

/**
 * The producer's glossary, adapted where its wording would mislead on this
 * site (the contract allows rewording, never changing the code):
 * - `joint_not_publication_grade` says "cruzamento" even for one variable;
 * - `use_municipio_or_wait_for_v1_1` offers a municipal result that no
 *   release ships for a refused question.
 * No v1.0.1 answer is a fallback or a refusal and no cell is suppressed; the
 * copy stays because the contract can still express them.
 */
export const REASON_COPY: Record<ReasonCode, Text> = {
  population_below_500: {
    pt: 'A freguesia tem menos de 500 residentes; mostramos o concelho.',
    en: 'The parish has fewer than 500 residents; the municipality is shown instead.',
  },
  eval_incomplete: {
    pt: 'A avaliação necessária para publicar este resultado ainda não está completa.',
    en: 'The evaluation required to publish this result is not yet complete.',
  },
  joint_not_publication_grade: {
    pt: 'Nesta freguesia, este resultado não atingiu a qualidade necessária para ser publicado.',
    en: 'In this parish, this result did not reach the quality required for publication.',
  },
  cell_below_minimum: {
    pt: 'Menos de 10 pessoas geradas nesta categoria: o valor não é publicado.',
    en: 'Fewer than 10 generated people in this category: the value is not published.',
  },
  field_unvalidated: {
    pt: 'Uma das variáveis pedidas ainda não foi validada para utilização pública.',
    en: 'One of the requested fields has not been validated for public use.',
  },
  use_municipio_or_wait_for_v1_1: {
    pt: 'Esta pergunta só é publicada para freguesias de qualidade A. Poderá chegar com uma versão futura.',
    en: 'This question is only published for quality A parishes. It may arrive with a future release.',
  },
};

export const SUPPRESSED: Text = { pt: 'Suprimido', en: 'Suppressed' };
export const NOT_PUBLISHED: Text = { pt: 'Sem valor publicado', en: 'No published value' };

/** Lines that travel with every population number. */
export const HONESTY = {
  synthetic: {
    pt: 'Pessoas e agregados gerados, não pessoas, famílias ou moradas reais.',
    en: 'Generated people and households, not real people, families, or addresses.',
  },
  singleRun: {
    pt: 'Esta versão publica uma única execução do modelo: não há amplitude entre execuções e nenhuma comparação direcional entre células é permitida.',
    en: 'This version publishes a single model run: there is no across-run range, and no directional comparison between cells is permitted.',
  },
  positioning: {
    pt: 'Tanto quanto nos foi possível apurar, a primeira população sintética de acesso aberto a cobrir todas as freguesias de Portugal, gerada a partir dos Censos 2021.',
    en: 'To the best of our knowledge, the first open-access synthetic population to cover every parish in Portugal, generated from the 2021 Census.',
  },
  source: {
    pt: `População sintética v${POPULATION_RELEASE} · calibrada nos Censos 2021 (INE)`,
    en: `Synthetic population v${POPULATION_RELEASE} · calibrated to the 2021 Census (INE)`,
  },
  zero: {
    pt: '«0,0%»: nenhuma pessoa ou agregado gerado nessa categoria, ou tão poucos que a percentagem arredonda para zero.',
    en: '“0.0%”: no generated person or household in that category, or so few that the share rounds to zero.',
  },
  /** The same, for a list that already prints «0,0%» as its term. */
  zeroMeaning: {
    pt: 'Nenhuma pessoa ou agregado gerado nessa categoria, ou tão poucos que a percentagem arredonda para zero.',
    en: 'No generated person or household in that category, or so few that the share rounds to zero.',
  },
} satisfies Record<string, Text>;
