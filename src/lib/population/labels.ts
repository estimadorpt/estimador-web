/**
 * Words for the synthetic population: card questions, category labels and the
 * quality / fallback / refusal copy. Every surface takes its wording from here
 * so the same thing is never called two names.
 *
 * Each question below states its population in full (from v1.0.2 the
 * producer's own titles do too). The household questions, "who lives alone"
 * and "elders alone" count private households only (is_institutional = 0,
 * INE's household universe). Categories are listed in their natural order, never by
 * size: with a single model run nothing here may rank (handoff §3).
 */
import { POPULATION_RELEASE } from '@/lib/config/population';
import { formatCount } from './format';
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
      pt: 'Pessoas com 65 ou mais anos em agregados privados. Quem vive num lar ou noutro alojamento coletivo não entra nesta pergunta.',
      en: 'People aged 65 or over in private households. Residents of care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'vivem-sozinhas',
    headline: { living_alone: 'yes' },
  },
  who_lives_alone: {
    question: { pt: 'Quem vive sozinho trabalha?', en: 'Do people who live alone work?' },
    short: { pt: 'Quem vive sozinho e o trabalho', en: 'Living alone and work' },
    population: {
      pt: 'Pessoas que vivem sozinhas num agregado privado. Em cada faixa etária, como se dividem entre empregadas, desempregadas e inativas; cada faixa etária soma 100% por si.',
      en: 'People who live alone in a private household. Within each age band, how they split between employed, unemployed and inactive; each age band adds up to 100% on its own.',
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
      pt: 'Agregados privados por número de pessoas. Os lares e outros alojamentos coletivos não entram nesta pergunta.',
      en: 'Private households by number of people. Care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'pessoas-por-casa',
  },
  household_type: {
    question: { pt: 'Que famílias formam?', en: 'What families do they form?' },
    short: { pt: 'Núcleos familiares por agregado', en: 'Family nuclei per household' },
    population: {
      pt: 'Agregados privados pelo número de núcleos familiares: um casal, com ou sem filhos, ou um pai ou uma mãe com filhos. Os lares e outros alojamentos coletivos não entram nesta pergunta.',
      en: 'Private households by number of family nuclei: a couple, with or without children, or a parent with children. Care homes and other collective living quarters are not part of this question.',
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
  ],
  age_5y: AGE_BANDS.map(value => ({ value, label: ageLabel(value) })),
};

export function valueLabel(dimension: string, value: string, locale: Locale): string {
  return VALUES[dimension]?.find(entry => entry.value === value)?.label[locale] ?? value;
}

/**
 * The quality tiers are reading guides, not publication gates: from v1.0.1
 * every parish answers every question with its own numbers and its tier.
 * Thresholds from release.json `quality_tier_policy` (doc 27 §7.2): A has a
 * median SRMSE of at most 0.10, a worst table of at most 0.18 and 2,000 or more
 * residents; B at most 0.15 / 0.26 and 500 or more residents; C is the rest.
 */
export const TIER_COPY: Record<'A' | 'B' | 'C', { label: Text; meaning: Text }> = {
  A: {
    label: { pt: 'Qualidade A', en: 'Quality A' },
    meaning: {
      pt: 'Freguesia com 2 000 ou mais residentes em que a população gerada reproduz de perto as tabelas publicadas pelo INE.',
      en: 'A parish of 2,000 or more residents where the generated population closely reproduces the tables INE publishes.',
    },
  },
  B: {
    label: { pt: 'Qualidade B', en: 'Quality B' },
    meaning: {
      pt: 'Freguesia com 500 ou mais residentes e um ajuste próximo às tabelas do INE. Abaixo de 2 000 residentes, uma freguesia fica em B mesmo com um ajuste igual ao de A.',
      en: 'A parish of 500 or more residents with a close fit to INE’s tables. Under 2,000 residents a parish sits in B even when its fit is as close as tier A’s.',
    },
  },
  C: {
    label: { pt: 'Qualidade C', en: 'Quality C' },
    meaning: {
      pt: 'Freguesia com menos de 500 residentes, ou em que o erro típico ou a pior tabela (muitas vezes, a idade ano a ano) passa os limiares do nível B: lê os números com mais cuidado.',
      en: 'A parish of under 500 residents, or one whose typical error or worst table (often single-year age) is past the tier B thresholds: read the numbers with more care.',
    },
  },
};

/**
 * One name per evaluated table, keyed on the scorecard's `constraints[].key`
 * (and quality.csv's `worst_constraint`, which is `srmse_` + the key). The
 * scorecard file stays verbatim; its own labels are not shown, because two of
 * them used other words than the rest of the site ("Situação perante o
 * trabalho", "Trabalho × rendimento": the table is MEIOVIDA, the main source of
 * livelihood, not income). `age_single` is scored but is not one of the 12.
 */
export const CONSTRAINT_LABEL: Record<string, Text> = {
  p_age5: { pt: 'Idade (grupos de 5 anos)', en: 'Age (5-year bands)' },
  p_marital: { pt: 'Estado civil', en: 'Marital status' },
  p_educ: { pt: 'Escolaridade', en: 'Education' },
  p_labour: { pt: 'Condição perante o trabalho', en: 'Labour-force status' },
  p_income: { pt: 'Principal meio de vida', en: 'Main source of livelihood' },
  p_labour3_educ5: { pt: 'Trabalho × escolaridade', en: 'Labour × education' },
  p_labour3_income: { pt: 'Trabalho × principal meio de vida', en: 'Labour × source of livelihood' },
  p_nat: { pt: 'Nacionalidade', en: 'Nationality' },
  p_religion: { pt: 'Religião', en: 'Religion' },
  p_sitprof: { pt: 'Situação na profissão', en: 'Status in employment' },
  p_sector: { pt: 'Setor de atividade (quatro grandes grupos)', en: 'Activity sector (four groups)' },
  p_union: { pt: 'União de facto', en: 'De facto union' },
  p_age_single: { pt: 'Idade ano a ano', en: 'Single-year age' },
};

/** Fit statistics are shown with three decimals, as the model card prints them. */
export function formatFit(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

/** release.json `quality_tier_policy.thresholds.B.max_worst_srmse` (labels.test.ts reads it back). */
export const TIER_B_MAX_WORST_SRMSE = 0.26;

/** release.json `quality_tier_policy.thresholds.B.max_person_srmse_median` (labels.test.ts reads it back). */
export const TIER_B_MAX_PERSON_SRMSE_MEDIAN = 0.15;

/** quality.csv's fit for a parish, from the parish file's `place` header (MR2-03, P202). */
export interface WorstTable {
  /** `worst_constraint`, e.g. `srmse_p_age_single`. */
  key: string;
  /** `worst_constraint_srmse`, as the producer wrote it. */
  srmse: number;
  /** `person_srmse_median`, the typical error; null or absent when the file does not carry it (unknown, never "fine"). */
  median?: number | null;
}

/** The site's name for a worst-table code, lower-cased to sit inside a sentence; null for a code it does not know. */
function worstTableName(key: string, locale: Locale): string | null {
  const label = CONSTRAINT_LABEL[key.replace(/^srmse_/, '')]?.[locale];
  return label ? label.charAt(0).toLowerCase() + label.slice(1) : null;
}

/**
 * A tier C parish of 500 or more residents, told what put it there. In
 * v1.0.3 (quality.csv, 728 such parishes): 2 are C on the typical error alone
 * (the median of the 12 fitted tables; their worst table is within tier B's
 * limit); 726 have a worst table past that limit, 704 of them single-year age
 * (scored, but outside the fit and unused by the answers), and 16 of the 726
 * miss the typical-error limit as well (10 single-year age, 6 a fitted table),
 * so the sentence names both criteria. Only a single-year-age parish whose
 * typical error is known to be within tier B's limit is told its answers may
 * be close to INE's tables; without the median (a file synced before it was
 * carried) the sentence makes no such claim. The median's value is not shown:
 * at three decimals 0.1503 would read "0,150", as if on the limit. Null when
 * the code is not one the site names.
 */
function worstTableMeaning(worst: WorstTable): Text | null {
  const pt = worstTableName(worst.key, 'pt');
  const en = worstTableName(worst.key, 'en');
  if (!pt || !en) return null;
  const error = { pt: formatFit(worst.srmse, 'pt'), en: formatFit(worst.srmse, 'en') };
  if (worst.srmse <= TIER_B_MAX_WORST_SRMSE) {
    return {
      pt: `Freguesia com 500 ou mais residentes, no nível C pelo seu erro típico, a mediana dos erros das 12 tabelas de pessoas do ajuste: lê os números com mais cuidado. A sua pior tabela é ${pt}, com um erro de ${error.pt}.`,
      en: `A parish of 500 or more residents, in tier C because of its typical error, the median of the errors of the 12 fitted person tables: read the numbers with more care. Its worst table is ${en}, with an error of ${error.en}.`,
    };
  }
  const median = worst.median ?? null;
  if (median != null && median > TIER_B_MAX_PERSON_SRMSE_MEDIAN) {
    return {
      pt: `Freguesia com 500 ou mais residentes, no nível C pelos dois critérios: o erro típico, a mediana dos erros das 12 tabelas de pessoas do ajuste, e a pior tabela, ${pt}, com um erro de ${error.pt}. Lê os números com mais cuidado.`,
      en: `A parish of 500 or more residents, in tier C on both criteria: its typical error, the median of the errors of the 12 fitted person tables, and its worst table, ${en}, with an error of ${error.en}. Read the numbers with more care.`,
    };
  }
  if (worst.key === 'srmse_p_age_single') {
    const head = {
      pt: `Freguesia com 500 ou mais residentes, no nível C pela sua pior tabela, ${pt}, com um erro de ${error.pt}. Essa tabela é avaliada à parte das 12 tabelas de pessoas do ajuste e as respostas não a usam (mostram a idade em grupos de 5 anos).`,
      en: `A parish of 500 or more residents, in tier C because of its worst table, ${en}, with an error of ${error.en}. That table is scored apart from the 12 fitted person tables and the answers do not use it (they show age in 5-year bands).`,
    };
    return median != null
      ? {
        pt: `${head.pt} O erro típico, a mediana dos erros dessas 12 tabelas, fica dentro do limiar do nível B, por isso as respostas podem estar perto das tabelas do INE.`,
        en: `${head.en} The typical error, the median of the errors of those 12 tables, is within tier B’s limit, so the answers can be close to INE’s tables.`,
      }
      : {
        pt: `${head.pt} Lê os números com mais cuidado.`,
        en: `${head.en} Read the numbers with more care.`,
      };
  }
  return {
    pt: `Freguesia com 500 ou mais residentes, no nível C pela sua pior tabela, ${pt}, com um erro de ${error.pt}. É uma das 12 tabelas de pessoas do ajuste: lê os números com mais cuidado.`,
    en: `A parish of 500 or more residents, in tier C because of its worst table, ${en}, with an error of ${error.en}. It is one of the 12 fitted person tables: read the numbers with more care.`,
  };
}

/**
 * When INE's count and the count the tier uses sit on opposite sides of a
 * size threshold (one parish in v1.0.3: 160707, INE 500, publication 499),
 * the sentence names both, so the page does not say "500 residents" and
 * "under 500 residents" at once.
 */
function acrossThreshold(threshold: number, residents: number, census: number | null | undefined): Text | null {
  if (census == null || !(residents < threshold && census >= threshold)) return null;
  const num = (value: number, locale: Locale) => formatCount(value, locale);
  return {
    pt: `O INE contou ${num(census, 'pt')} residentes, mas o nível usa a contagem de publicação (a menor entre a do INE e as pessoas geradas), que aqui é de ${num(residents, 'pt')}, abaixo de ${num(threshold, 'pt')}.`,
    en: `INE counted ${num(census, 'en')} residents, but the tier uses the publication count (the smaller of INE’s and the generated people), which here is ${num(residents, 'en')}, under ${num(threshold, 'en')}.`,
  };
}

/**
 * What a tier means for one parish, chosen from the count the tier was
 * decided on (quality.csv `publication_population`): a tier B parish under
 * 2,000 residents may fit as closely as an A, and a tier C parish of 500 or
 * more is C for its typical error or its worst table, not its size; in almost
 * all of them (705 of 728 in quality.csv) the worst table is single-year age.
 * Pass INE's count (`census`) as well, and a parish whose two counts sit on
 * either side of a threshold says so; pass the parish's fit (`worst`, from its
 * file's place header: worst table, its error and the typical error) and a
 * tier C parish of 500 or more names the table, or the criteria, that set its
 * tier (MR2-03, P202). Without them, the generic words (the map and the game,
 * which read places.json, have no worst table), which say what is true of the
 * class and claim nothing about this parish's answers.
 */
export function tierMeaningFor(tier: 'A' | 'B' | 'C', residents: number | null | undefined, census?: number | null, worst?: WorstTable | null): Text {
  if (residents == null) return TIER_COPY[tier].meaning;
  if (tier === 'B') {
    const across = acrossThreshold(2000, residents, census);
    if (across) {
      return {
        pt: `${across.pt} Com menos de ${formatCount(2000, 'pt')} residentes nessa contagem, não pode ficar em A, por mais próximo que seja o ajuste às tabelas do INE.`,
        en: `${across.en} Under ${formatCount(2000, 'en')} residents on that count it cannot be tier A, however close its fit to INE’s tables.`,
      };
    }
    return residents < 2000
      ? {
        pt: 'Freguesia com menos de 2 000 residentes e um ajuste próximo às tabelas do INE. Com menos de 2 000 residentes não pode ficar em A, por mais próximo que seja o ajuste.',
        en: 'A parish of under 2,000 residents with a close fit to INE’s tables. Under 2,000 residents it cannot be tier A, however close the fit.',
      }
      : {
        pt: 'Freguesia com 2 000 ou mais residentes e um ajuste próximo às tabelas do INE, sem chegar aos limiares do nível A.',
        en: 'A parish of 2,000 or more residents with a close fit to INE’s tables that falls short of the tier A thresholds.',
      };
  }
  if (tier === 'C') {
    const across = acrossThreshold(500, residents, census);
    if (across) {
      return {
        pt: `${across.pt} Abaixo de 500, uma freguesia fica sempre no nível C, seja qual for o ajuste. Com poucas pessoas, cada uma pesa mais; lê os números com mais cuidado.`,
        en: `${across.en} Under 500, a parish is always tier C, whatever its fit. With few people each one weighs more; read the numbers with more care.`,
      };
    }
    if (residents >= 500 && worst) {
      const named = worstTableMeaning(worst);
      if (named) return named;
    }
    return residents < 500
      ? {
        pt: 'Freguesia com menos de 500 residentes: fica sempre no nível C, seja qual for o ajuste às tabelas do INE. Com poucas pessoas, cada uma pesa mais; lê os números com mais cuidado.',
        en: 'A parish of under 500 residents: it is always tier C, whatever its fit to INE’s tables. With few people each one weighs more; read the numbers with more care.',
      }
      : {
        pt: 'Freguesia com 500 ou mais residentes cujo ajuste não chega aos limiares do nível B, no erro típico ou na pior tabela: lê os números com mais cuidado. Em quase todas estas freguesias, a pior tabela é a idade ano a ano, avaliada à parte das 12 tabelas de pessoas do ajuste e que as respostas não usam (mostram a idade em grupos de 5 anos). O ficheiro de qualidade diz qual é a pior tabela de cada freguesia.',
        en: 'A parish of 500 or more residents whose fit misses the tier B thresholds, on its typical error or its worst table: read the numbers with more care. In almost all such parishes the worst table is single-year age, scored apart from the 12 fitted person tables and not used by the answers (which show age in 5-year bands). The quality file names each parish’s worst table.',
      };
  }
  return TIER_COPY.A.meaning;
}

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
 * No answer since v1.0.1 is a fallback or a refusal and no cell is suppressed;
 * the copy stays because the contract can still express them.
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

/**
 * How a card's figures were made, in the one vocabulary the methodology uses:
 * five questions group a field whose INE table is among those the population
 * was fitted to; three are derived from the generated population by a fixed
 * rule (living alone = a household of one person; a child and someone 65+ in
 * the same household; age bands), so no table in the fit checks them.
 */
export const RECIPE_PROVENANCE: Record<PortraitRecipe, 'fitted' | 'derived'> = {
  age: 'fitted',
  education: 'fitted',
  employment: 'fitted',
  household_size: 'fitted',
  household_type: 'fitted',
  elders_alone: 'derived',
  multigenerational: 'derived',
  who_lives_alone: 'derived',
};

export function sourceLine(recipe: PortraitRecipe, locale: Locale): string {
  const derived = RECIPE_PROVENANCE[recipe] === 'derived';
  if (locale === 'pt') {
    return derived
      ? `População sintética v${POPULATION_RELEASE} · derivada da população gerada a partir dos Censos 2021 (INE); não é uma das tabelas usadas no ajuste`
      : `População sintética v${POPULATION_RELEASE} · grupos de um campo ajustado às tabelas dos Censos 2021 (INE)`;
  }
  return derived
    ? `Synthetic population v${POPULATION_RELEASE} · derived from the population generated from the 2021 Census (INE); not one of the tables it was fitted to`
    : `Synthetic population v${POPULATION_RELEASE} · groups of a field fitted to the 2021 Census tables (INE)`;
}

export const SUPPRESSED: Text ={ pt: 'Suprimido', en: 'Suppressed' };
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
  /** The generic source line (a chart of several kinds of field, or a national figure). */
  source: {
    pt: `População sintética v${POPULATION_RELEASE} · a partir dos Censos 2021 (INE)`,
    en: `Synthetic population v${POPULATION_RELEASE} · from the 2021 Census (INE)`,
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
