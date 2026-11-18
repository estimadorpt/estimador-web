/**
 * Words for the synthetic population: card titles, category labels and the
 * quality / fallback / refusal copy. Every surface takes its wording from here
 * so the same thing is never called two names.
 *
 * Each card below states its population in full (from v1.0.2 the
 * producer's own titles do too). The household questions, "who lives alone"
 * and "elders alone" count private households only (is_institutional = 0,
 * INE's household universe). Categories are listed in their natural order, never by
 * size: with a single model run nothing here may rank (handoff §3).
 */
import { POPULATION_RELEASE } from '@/lib/config/population';
import { formatCount } from './format';
import type { LayerRecipe, PortraitRecipe, QualityTier, ReasonCode } from '@/types/population';

export type Locale = 'pt' | 'en';
type Text = Record<Locale, string>;

export interface RecipeCopy {
  /**
   * The card's title, a statement of what it shows ("Escolaridade"), the
   * heading a reader scans for in the page, the rail and the game's clues.
   */
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
    short: { pt: 'Pessoas com 65+ que vivem sozinhas', en: 'People aged 65+ living alone' },
    population: {
      pt: 'Pessoas com 65 ou mais anos em agregados privados. Quem vive num lar ou noutro alojamento coletivo não entra nesta pergunta.',
      en: 'People aged 65 or over in private households. Residents of care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'vivem-sozinhas',
    headline: { living_alone: 'yes' },
  },
  who_lives_alone: {
    short: { pt: 'Quem vive sozinho e o trabalho', en: 'Living alone and work' },
    population: {
      pt: 'Pessoas que vivem sozinhas num agregado privado. Em cada faixa etária, como se dividem entre empregadas, desempregadas e inativas; cada faixa etária soma 100% por si.',
      en: 'People who live alone in a private household. Within each age band, how they split between employed, unemployed and inactive; each age band adds up to 100% on its own.',
    },
    anchor: 'quem-vive-sozinho',
  },
  multigenerational: {
    short: { pt: 'Agregados com criança e pessoa de 65+', en: 'Households with a child and someone 65+' },
    population: {
      pt: 'Agregados privados com pelo menos uma pessoa com menos de 15 anos e outra com 65 ou mais. Não são necessariamente avós e netos.',
      en: 'Private households with at least one person under 15 and another aged 65 or over. They are not necessarily grandparents and grandchildren.',
    },
    anchor: 'varias-geracoes',
    headline: { multigenerational: 'yes' },
  },
  age: {
    short: { pt: 'Idades', en: 'Ages' },
    population: { pt: 'Todas as pessoas, por grupo de cinco anos de idade.', en: 'Everyone, in five-year age groups.' },
    anchor: 'idades',
  },
  employment: {
    short: { pt: 'Condição perante o trabalho', en: 'Employment status' },
    population: {
      pt: 'Todas as pessoas. Crianças, estudantes e reformados contam como inativos.',
      en: 'Everyone. Children, students and retired people count as inactive.',
    },
    anchor: 'trabalho',
  },
  education: {
    short: { pt: 'Escolaridade', en: 'Education' },
    population: {
      pt: 'Todas as pessoas, pelo nível mais alto que completaram. As crianças contam em «Nenhum» até completarem o 1.º ciclo.',
      en: 'Everyone, by the highest level completed. Children count under "None" until they complete the first cycle of basic education.',
    },
    anchor: 'escolaridade',
  },
  household_size: {
    short: { pt: 'Pessoas por agregado', en: 'People per household' },
    population: {
      pt: 'Agregados privados por número de pessoas. Os lares e outros alojamentos coletivos não entram nesta pergunta.',
      en: 'Private households by number of people. Care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'pessoas-por-casa',
  },
  household_type: {
    short: { pt: 'Núcleos familiares por agregado', en: 'Family nuclei per household' },
    population: {
      pt: 'Agregados privados pelo número de núcleos familiares: um casal, com ou sem filhos, ou um pai ou uma mãe com filhos. Os lares e outros alojamentos coletivos não entram nesta pergunta.',
      en: 'Private households by number of family nuclei: a couple, with or without children, or a parent with children. Care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'familias',
  },
  // ---- v1.2 and its census-facts layer (docs/population/v1.2-parish-questions.md §2) ----
  nationality: {
    short: { pt: 'Nacionalidade', en: 'Nationality' },
    population: {
      pt: 'Todas as pessoas, pela nacionalidade: portuguesa ou estrangeira. Quem não tem nacionalidade nenhuma conta como estrangeiro.',
      en: 'Everyone, by nationality: Portuguese or foreign. Stateless people count as foreign.',
    },
    anchor: 'nacionalidade',
  },
  marital: {
    short: { pt: 'Estado civil', en: 'Marital status' },
    population: {
      pt: 'Pessoas com 12 ou mais anos, pelo estado civil legal. Quem vive em união de facto conta pelo seu estado civil legal.',
      en: 'People aged 12 or over, by legal marital status. People in a de facto union count under their legal status.',
    },
    anchor: 'estado-civil',
  },
  income_source: {
    short: { pt: 'Principal meio de vida', en: 'Main source of livelihood' },
    population: {
      pt: 'Pessoas com 15 ou mais anos, pela principal fonte do dinheiro com que vivem. É a fonte, não o valor do rendimento.',
      en: 'People aged 15 or over, by the main source of the money they live on. It is the source, not the amount of income.',
    },
    anchor: 'meio-de-vida',
  },
  sitprof: {
    short: { pt: 'Situação na profissão', en: 'Status in employment' },
    population: {
      pt: 'Pessoas empregadas, com 15 ou mais anos: por conta de outrem, por conta própria ou como empregadoras.',
      en: 'Employed people aged 15 or over: employees, self-employed or employers.',
    },
    anchor: 'situacao-na-profissao',
  },
  occupation: {
    short: { pt: 'Profissões', en: 'Occupations' },
    population: {
      pt: 'Pessoas empregadas, pelo grande grupo da profissão (Classificação Portuguesa das Profissões, 2010).',
      en: 'Employed people, by major occupation group (Portuguese Classification of Occupations, 2010).',
    },
    anchor: 'profissoes',
  },
  industry: {
    short: { pt: 'Atividade económica', en: 'Industry' },
    population: {
      pt: 'Pessoas empregadas, pela secção da atividade económica onde trabalham (CAE Rev. 3).',
      en: 'Employed people, by the section of the industry they work in (CAE Rev. 3).',
    },
    anchor: 'atividade-economica',
  },
  work_place: {
    short: { pt: 'Onde trabalham ou estudam', en: 'Where people work or study' },
    population: {
      pt: 'Pessoas empregadas e estudantes, pelo local onde trabalham ou estudam.',
      en: 'Employed people and students, by where they work or study.',
    },
    anchor: 'local-de-trabalho',
  },
  transport: {
    short: { pt: 'Como vão para o trabalho ou a escola', en: 'How people get to work or study' },
    population: {
      pt: 'Pessoas empregadas e estudantes que se deslocam para trabalhar ou estudar, pelo principal meio de transporte. Quem trabalha ou estuda em casa, ou sem local fixo, não entra nesta pergunta.',
      en: 'Employed people and students who travel to work or study, by their main means of transport. People who work or study at home, or have no fixed place, are not part of this question.',
    },
    anchor: 'transporte',
  },
  tenure: {
    short: { pt: 'Casa própria ou arrendada', en: 'Owned or rented homes' },
    population: {
      pt: 'Agregados privados que vivem num alojamento clássico de residência habitual, pelo regime de ocupação da casa. Os lares e outros alojamentos coletivos não entram nesta pergunta.',
      en: 'Private households living in a conventional dwelling that is their usual residence, by tenure. Care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'casa-propria-ou-arrendada',
  },
  rooms: {
    short: { pt: 'Divisões por casa', en: 'Rooms per home' },
    population: {
      pt: 'Agregados privados que vivem num alojamento clássico de residência habitual, pelo número de divisões da casa. Os lares e outros alojamentos coletivos não entram nesta pergunta.',
      en: 'Private households living in a conventional dwelling that is their usual residence, by the number of rooms. Care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'divisoes',
  },
  building_period: {
    short: { pt: 'Época de construção do edifício', en: 'When the building was built' },
    population: {
      pt: 'Agregados privados que vivem num alojamento clássico de residência habitual, pela época de construção do edifício. Os lares e outros alojamentos coletivos não entram nesta pergunta.',
      en: 'Private households living in a conventional dwelling that is their usual residence, by when the building was built. Care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'epoca-de-construcao',
  },
  accessibility: {
    short: { pt: 'Casas acessíveis em cadeira de rodas', en: 'Homes a wheelchair user can reach' },
    population: {
      pt: 'Agregados privados que vivem num alojamento clássico de residência habitual, por a casa ser ou não acessível a uma pessoa em cadeira de rodas. Os lares e outros alojamentos coletivos não entram nesta pergunta.',
      en: 'Private households living in a conventional dwelling that is their usual residence, by whether the home is accessible to a wheelchair user. Care homes and other collective living quarters are not part of this question.',
    },
    anchor: 'acessibilidade',
  },
  lived_abroad: {
    short: { pt: 'Já viveram no estrangeiro', en: 'Have lived abroad' },
    population: {
      pt: 'Todas as pessoas: as que já viveram no estrangeiro durante um ano ou mais e as que não.',
      en: 'Everyone: people who have lived abroad for a year or more, and people who have not.',
    },
    anchor: 'viveram-no-estrangeiro',
    headline: { lived_abroad: '1' },
  },
  literate: {
    short: { pt: 'Ler e escrever', en: 'Reading and writing' },
    population: {
      pt: 'Pessoas com 10 ou mais anos: as que sabem ler e escrever e as que não sabem.',
      en: 'People aged 10 or over: those who can read and write, and those who cannot.',
    },
    anchor: 'ler-e-escrever',
  },
  // ---- Modelled, anchored at município level at most (contract §2e) ----
  income: {
    short: { pt: 'Rendimento bruto declarado', en: 'Gross declared income' },
    population: {
      pt: 'Pessoas com 18 ou mais anos em alojamentos familiares, pelo rendimento bruto que declararam no IRS de 2021 em nome próprio, em escalões. Quem não entregou declaração em nome próprio conta à parte: muitas dessas pessoas têm rendimento, só não declaram. Quem vive em alojamentos coletivos não entra.',
      en: 'People aged 18 or over in private households, by the gross income they declared in their own name for 2021 income tax, in bands. Those who filed no return in their own name are counted apart: many of them have an income, they just do not file. Residents of collective quarters are not included.',
    },
    anchor: 'rendimento',
  },
  birthplace: {
    short: { pt: 'Onde nasceram', en: 'Where people were born' },
    population: {
      pt: 'Todas as pessoas, pelo lugar onde nasceram: nesta freguesia, noutra freguesia do concelho, noutro concelho ou no estrangeiro.',
      en: 'Everyone, by where they were born: in this parish, in another parish of the municipality, in another municipality, or abroad.',
    },
    anchor: 'onde-nasceram',
  },
  residence_2019: {
    short: { pt: 'Onde viviam em 2019', en: 'Where people lived in 2019' },
    population: {
      pt: 'Todas as pessoas, pelo lugar onde viviam em 2019, dois anos antes dos Censos. Quem nasceu depois conta à parte.',
      en: 'Everyone, by where they lived in 2019, two years before the Census. People born since then are counted apart.',
    },
    anchor: 'onde-viviam-em-2019',
  },
  school_attendance: {
    short: { pt: 'Frequência de ensino', en: 'School attendance' },
    population: {
      pt: 'Todas as pessoas: as que estudavam em 2021, as que já estudaram e deixaram e as que nunca frequentaram a escola.',
      en: 'Everyone: people studying in 2021, people who studied and stopped, and people who never attended school.',
    },
    anchor: 'frequencia-de-ensino',
  },
};

/** The recipes v1.2 and its layers add (contract §2), in the order the page lists them. */
export const LAYER_RECIPES = [
  'nationality',
  'marital',
  'income_source',
  'lived_abroad',
  'literate',
  'sitprof',
  'occupation',
  'industry',
  'work_place',
  'transport',
  'tenure',
  'rooms',
  'building_period',
  'accessibility',
  'income',
  'birthplace',
  'residence_2019',
  'school_attendance',
] as const satisfies readonly LayerRecipe[];

/**
 * The modelled recipes: no parish table fixes them, so they sit apart, labelled
 * (contract §2e). Income is anchored per município; residence in 2019 and
 * school attendance by no table at any level; birthplace per parish on one
 * share only. So the label says "modelled", and each source line says what,
 * if anything, anchors it (MODELLED_ANCHOR).
 */
export const MODELLED_RECIPES: readonly LayerRecipe[] = ['income', 'birthplace', 'residence_2019', 'school_attendance'];

/** A recipe name the site has copy for (a newer bundle may carry one it does not: that card is skipped, not guessed). */
export function isPortraitRecipe(name: string): name is PortraitRecipe {
  return Object.prototype.hasOwnProperty.call(RECIPE_COPY, name);
}

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
  nationality_group: { pt: 'Nacionalidade', en: 'Nationality' },
  marital_status_code: { pt: 'Estado civil', en: 'Marital status' },
  income_source_code: { pt: 'Principal meio de vida', en: 'Main source of livelihood' },
  sitprof_code: { pt: 'Situação na profissão', en: 'Status in employment' },
  occupation_major: { pt: 'Grande grupo de profissões', en: 'Major occupation group' },
  industry_section: { pt: 'Secção de atividade', en: 'Industry section' },
  work_location_type: { pt: 'Local de trabalho ou estudo', en: 'Place of work or study' },
  transport_mode: { pt: 'Meio de transporte', en: 'Means of transport' },
  hh_tenure_code: { pt: 'Regime de ocupação', en: 'Tenure' },
  hh_rooms_bin: { pt: 'Divisões', en: 'Rooms' },
  building_period_code: { pt: 'Época de construção', en: 'Construction period' },
  accessibility_code: { pt: 'Acesso em cadeira de rodas', en: 'Wheelchair access' },
  lived_abroad: { pt: 'Viveram no estrangeiro', en: 'Lived abroad' },
  literate: { pt: 'Ler e escrever', en: 'Reading and writing' },
  income_band: { pt: 'Rendimento bruto anual', en: 'Gross yearly income' },
  birthplace: { pt: 'Onde nasceram', en: 'Place of birth' },
  residence_2019: { pt: 'Onde viviam em 2019', en: 'Residence in 2019' },
  school_attendance: { pt: 'Frequência de ensino', en: 'School attendance' },
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
  // ---- v1.2: codes from release.json label_maps (v1.0.3) and the census-facts layer ----
  nationality_group: [
    { value: 'PT', label: { pt: 'Portuguesa', en: 'Portuguese' } },
    { value: 'Foreign', label: { pt: 'Estrangeira', en: 'Foreign' } },
  ],
  marital_status_code: [
    { value: '1', label: { pt: 'Solteiras', en: 'Single' } },
    { value: '2', label: { pt: 'Casadas', en: 'Married' } },
    { value: '3', label: { pt: 'Viúvas', en: 'Widowed' } },
    { value: '4', label: { pt: 'Divorciadas', en: 'Divorced' } },
  ],
  income_source_code: [
    { value: '1', label: { pt: 'Trabalho', en: 'Work' } },
    { value: '2', label: { pt: 'Reforma ou pensão', en: 'Retirement or other pension' } },
    { value: '3', label: { pt: 'Subsídio de desemprego', en: 'Unemployment benefit' } },
    { value: '4', label: { pt: 'Rendimento social de inserção', en: 'Social integration income (RSI)' } },
    { value: '5', label: { pt: 'Outro subsídio temporário (doença, parentalidade…)', en: 'Other temporary benefit (sickness, parental…)' } },
    { value: '6', label: { pt: 'Rendimentos de propriedade ou de empresa', en: 'Income from property or a business' } },
    { value: '7', label: { pt: 'A cargo da família', en: 'Supported by the family' } },
    { value: '8', label: { pt: 'Outra situação', en: 'Other' } },
  ],
  sitprof_code: [
    { value: '1', label: { pt: 'Empregador, com menos de 10 empregados', en: 'Employer, under 10 employees' } },
    { value: '2', label: { pt: 'Empregador, com 10 ou mais empregados', en: 'Employer, 10 or more employees' } },
    { value: '3', label: { pt: 'Por conta própria, sem empregados', en: 'Self-employed, no employees' } },
    { value: '4', label: { pt: 'Por conta de outrem', en: 'Employee' } },
    { value: '5', label: { pt: 'Outra situação', en: 'Other' } },
  ],
  occupation_major: [
    { value: '0', label: { pt: 'Forças armadas', en: 'Armed forces' } },
    { value: '1', label: { pt: 'Dirigentes, diretores e gestores', en: 'Managers and directors' } },
    { value: '2', label: { pt: 'Especialistas das atividades intelectuais e científicas', en: 'Professionals' } },
    { value: '3', label: { pt: 'Técnicos e profissões de nível intermédio', en: 'Technicians and associate professionals' } },
    { value: '4', label: { pt: 'Pessoal administrativo', en: 'Clerical support workers' } },
    { value: '5', label: { pt: 'Serviços pessoais, proteção e segurança, vendas', en: 'Service and sales workers' } },
    { value: '6', label: { pt: 'Agricultura, pesca e floresta (qualificados)', en: 'Skilled agricultural, forestry and fishery workers' } },
    { value: '7', label: { pt: 'Indústria, construção e artífices (qualificados)', en: 'Craft and related trades workers' } },
    { value: '8', label: { pt: 'Operadores de instalações e máquinas, montagem', en: 'Plant and machine operators and assemblers' } },
    { value: '9', label: { pt: 'Trabalhadores não qualificados', en: 'Elementary occupations' } },
  ],
  industry_section: [
    { value: 'A', label: { pt: 'Agricultura, floresta e pesca', en: 'Agriculture, forestry and fishing' } },
    { value: 'B', label: { pt: 'Indústrias extrativas', en: 'Mining and quarrying' } },
    { value: 'C', label: { pt: 'Indústrias transformadoras', en: 'Manufacturing' } },
    { value: 'D', label: { pt: 'Eletricidade e gás', en: 'Electricity and gas' } },
    { value: 'E', label: { pt: 'Água, saneamento e resíduos', en: 'Water, sewerage and waste' } },
    { value: 'F', label: { pt: 'Construção', en: 'Construction' } },
    { value: 'G', label: { pt: 'Comércio e reparação de veículos', en: 'Trade and vehicle repair' } },
    { value: 'H', label: { pt: 'Transportes e armazenagem', en: 'Transport and storage' } },
    { value: 'I', label: { pt: 'Alojamento e restauração', en: 'Accommodation and food services' } },
    { value: 'J', label: { pt: 'Informação e comunicação', en: 'Information and communication' } },
    { value: 'K', label: { pt: 'Atividades financeiras e de seguros', en: 'Finance and insurance' } },
    { value: 'L', label: { pt: 'Atividades imobiliárias', en: 'Real estate' } },
    { value: 'M', label: { pt: 'Consultoria, ciência e técnica', en: 'Professional, scientific and technical activities' } },
    { value: 'N', label: { pt: 'Serviços administrativos e de apoio', en: 'Administrative and support services' } },
    { value: 'O', label: { pt: 'Administração pública e defesa', en: 'Public administration and defence' } },
    { value: 'P', label: { pt: 'Educação', en: 'Education' } },
    { value: 'Q', label: { pt: 'Saúde e apoio social', en: 'Health and social work' } },
    { value: 'R', label: { pt: 'Artes, espetáculos, desporto e recreio', en: 'Arts, entertainment and recreation' } },
    { value: 'S_94_96', label: { pt: 'Outros serviços (associações, serviços pessoais)', en: 'Other services (associations, personal services)' } },
    { value: 'S_95', label: { pt: 'Reparação de computadores e bens pessoais', en: 'Repair of computers and personal goods' } },
    { value: 'T', label: { pt: 'Famílias empregadoras de pessoal doméstico', en: 'Households as employers of domestic staff' } },
    { value: 'U', label: { pt: 'Organismos internacionais', en: 'International organisations' } },
  ],
  work_location_type: [
    { value: '1', label: { pt: 'Em casa', en: 'At home' } },
    { value: '2', label: { pt: 'Nesta freguesia', en: 'In this parish' } },
    { value: '3', label: { pt: 'Noutra freguesia do concelho', en: 'In another parish of the municipality' } },
    { value: '4', label: { pt: 'Noutro concelho', en: 'In another municipality' } },
    { value: '5', label: { pt: 'No estrangeiro', en: 'Abroad' } },
    { value: '6', label: { pt: 'Sem local fixo', en: 'No fixed place' } },
  ],
  transport_mode: [
    { value: '01', label: { pt: 'A pé', en: 'On foot' } },
    { value: '02', label: { pt: 'Automóvel, a conduzir', en: 'Car, driving' } },
    { value: '03', label: { pt: 'Automóvel, como passageiro', en: 'Car, as a passenger' } },
    { value: '04', label: { pt: 'Autocarro', en: 'Bus' } },
    { value: '05', label: { pt: 'Transporte da empresa ou da escola', en: 'Company or school transport' } },
    { value: '06', label: { pt: 'Metropolitano', en: 'Metro' } },
    { value: '07', label: { pt: 'Comboio', en: 'Train' } },
    { value: '08', label: { pt: 'Motociclo', en: 'Motorcycle' } },
    { value: '09', label: { pt: 'Bicicleta', en: 'Bicycle' } },
    { value: '10', label: { pt: 'Barco', en: 'Boat' } },
    { value: '11', label: { pt: 'Outro', en: 'Other' } },
    { value: 'NR', label: { pt: 'Não indicado', en: 'Not stated' } },
  ],
  hh_tenure_code: [
    { value: '1', label: { pt: 'Casa própria', en: 'Owned' } },
    { value: '3', label: { pt: 'Arrendada', en: 'Rented' } },
    { value: '4', label: { pt: 'Outra situação', en: 'Other' } },
  ],
  hh_rooms_bin: [
    { value: '1_2', label: { pt: '1 ou 2 divisões', en: '1 or 2 rooms' } },
    { value: '3_4', label: { pt: '3 ou 4 divisões', en: '3 or 4 rooms' } },
    { value: '5+', label: { pt: '5 ou mais divisões', en: '5 or more rooms' } },
  ],
  building_period_code: [
    { value: '21', label: { pt: 'Antes de 1919', en: 'Before 1919' } },
    { value: '22', label: { pt: '1919–1945', en: '1919–1945' } },
    { value: '23', label: { pt: '1946–1960', en: '1946–1960' } },
    { value: '24', label: { pt: '1961–1980', en: '1961–1980' } },
    { value: '25', label: { pt: '1981–1990', en: '1981–1990' } },
    { value: '26', label: { pt: '1991–2000', en: '1991–2000' } },
    { value: '27', label: { pt: '2001–2005', en: '2001–2005' } },
    { value: '28', label: { pt: '2006–2010', en: '2006–2010' } },
    { value: '29', label: { pt: '2011–2015', en: '2011–2015' } },
    { value: '30', label: { pt: '2016–2021', en: '2016–2021' } },
  ],
  accessibility_code: [
    { value: '1', label: { pt: 'Acessível em cadeira de rodas', en: 'Accessible to a wheelchair user' } },
    { value: '2', label: { pt: 'Não acessível', en: 'Not accessible' } },
  ],
  lived_abroad: [
    { value: '1', label: { pt: 'Viveram no estrangeiro um ano ou mais', en: 'Lived abroad for a year or more' } },
    { value: '2', label: { pt: 'Não', en: 'No' } },
  ],
  literate: [
    { value: '1', label: { pt: 'Sabem ler e escrever', en: 'Can read and write' } },
    { value: '2', label: { pt: 'Não sabem ler nem escrever', en: 'Cannot read or write' } },
  ],
  // income_band: INE's bracket edges, the ones the model holds per município (half-open:
  // exactly 5 000 € is in the second band). Code 0 is "filed no return", never "no income".
  income_band: [
    { value: '0', label: { pt: 'Não entregou IRS em nome próprio', en: 'Filed no return in their own name' } },
    { value: '1', label: { pt: 'Menos de 5 000 €', en: 'Under €5,000' } },
    { value: '2', label: { pt: '5 000 a 10 000 €', en: '€5,000 to €10,000' } },
    { value: '3', label: { pt: '10 000 a 13 500 €', en: '€10,000 to €13,500' } },
    { value: '4', label: { pt: '13 500 a 19 000 €', en: '€13,500 to €19,000' } },
    { value: '5', label: { pt: '19 000 a 32 500 €', en: '€19,000 to €32,500' } },
    { value: '6', label: { pt: '32 500 € ou mais', en: '€32,500 or more' } },
  ],
  birthplace: [
    { value: '1', label: { pt: 'Nesta freguesia', en: 'In this parish' } },
    { value: '2', label: { pt: 'Noutra freguesia do concelho', en: 'In another parish of the municipality' } },
    { value: '3', label: { pt: 'Noutro concelho', en: 'In another municipality' } },
    { value: '4', label: { pt: 'No estrangeiro', en: 'Abroad' } },
  ],
  residence_2019: [
    { value: '2', label: { pt: 'Na mesma casa', en: 'In the same home' } },
    { value: '3', label: { pt: 'Noutra casa da freguesia', en: 'In another home in the parish' } },
    { value: '4', label: { pt: 'Noutra freguesia do concelho', en: 'In another parish of the municipality' } },
    { value: '5', label: { pt: 'Noutro concelho', en: 'In another municipality' } },
    { value: '6', label: { pt: 'No estrangeiro', en: 'Abroad' } },
    { value: '1', label: { pt: 'Ainda não tinham nascido', en: 'Not yet born' } },
  ],
  school_attendance: [
    { value: '1', label: { pt: 'Estudavam', en: 'Studying' } },
    { value: '2', label: { pt: 'Já estudaram', en: 'Studied, no longer' } },
    { value: '3', label: { pt: 'Nunca frequentaram', en: 'Never attended' } },
  ],
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
    label: { pt: 'Nível A', en: 'Tier A' },
    meaning: {
      pt: 'Freguesia com 2 000 ou mais residentes em que a população gerada reproduz de perto as tabelas publicadas pelo INE.',
      en: 'A parish of 2,000 or more residents where the generated population closely reproduces the tables INE publishes.',
    },
  },
  B: {
    label: { pt: 'Nível B', en: 'Tier B' },
    meaning: {
      pt: 'Freguesia com 500 ou mais residentes e um ajuste próximo às tabelas do INE. Abaixo de 2 000 residentes, uma freguesia fica em B mesmo com um ajuste igual ao de A.',
      en: 'A parish of 500 or more residents with a close fit to INE’s tables. Under 2,000 residents a parish sits in B even when its fit is as close as tier A’s.',
    },
  },
  C: {
    label: { pt: 'Nível C', en: 'Tier C' },
    meaning: {
      pt: 'Freguesia com menos de 500 residentes, ou em que o erro típico ou a pior tabela (nas maiores, quase sempre a idade ano a ano, que as respostas do site não usam) passa os limiares do nível B: lê os números com mais cuidado.',
      en: 'A parish of under 500 residents, or one whose typical error or worst table (in the larger ones, almost always single-year age, which the site’s answers do not use) is past the tier B thresholds: read the numbers with more care.',
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
        pt: `${head.pt} O erro típico, a mediana dos erros dessas 12 tabelas, fica dentro do limiar do nível B, por isso as respostas podem estar perto das tabelas do INE. A cautela do nível C vale sobretudo para quem usar a idade ano a ano dos microdados.`,
        en: `${head.en} The typical error, the median of the errors of those 12 tables, is within tier B’s limit, so the answers can be close to INE’s tables. The tier C caution applies mostly to anyone using single-year age from the microdata.`,
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
        pt: 'Freguesia com 500 ou mais residentes cujo ajuste não chega aos limiares do nível B, no erro típico ou na pior tabela: lê os números com mais cuidado. Em quase todas estas freguesias, a pior tabela é a idade ano a ano, avaliada à parte das 12 tabelas de pessoas do ajuste e que as respostas não usam (mostram a idade em grupos de 5 anos); aí, a cautela vale sobretudo para quem usar a idade ano a ano dos microdados. O ficheiro de qualidade diz qual é a pior tabela de cada freguesia.',
        en: 'A parish of 500 or more residents whose fit misses the tier B thresholds, on its typical error or its worst table: read the numbers with more care. In almost all such parishes the worst table is single-year age, scored apart from the 12 fitted person tables and not used by the answers (which show age in 5-year bands); there, the caution applies mostly to anyone using single-year age from the microdata. The quality file names each parish’s worst table.',
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
 * How a card's figures were made, in the one vocabulary the methodology uses.
 * `fitted`: the field's INE table is among those the population was fitted to,
 * parish by parish (the five core ones and, from v1.2, people's nationality,
 * marital status and source of livelihood, the work tables §64 fits after the
 * household choice, and the four home tables bound since v1.1). `tilted`: a
 * census-facts layer column, drawn for each person by a model of the Census
 * public-use sample and tilted per parish to an INE table. `derived`: built
 * from the generated population by a fixed rule (living alone = a household of
 * one person; a child and someone 65+ in the same household; age bands), so no
 * table checks it.
 */
export type RecipeProvenance = 'fitted' | 'tilted' | 'modelled' | 'derived';

export const RECIPE_PROVENANCE: Record<PortraitRecipe, RecipeProvenance> = {
  age: 'fitted',
  education: 'fitted',
  employment: 'fitted',
  household_size: 'fitted',
  household_type: 'fitted',
  elders_alone: 'derived',
  multigenerational: 'derived',
  who_lives_alone: 'derived',
  nationality: 'fitted',
  marital: 'fitted',
  income_source: 'fitted',
  sitprof: 'fitted',
  occupation: 'fitted',
  industry: 'fitted',
  work_place: 'fitted',
  transport: 'fitted',
  tenure: 'fitted',
  rooms: 'fitted',
  building_period: 'fitted',
  accessibility: 'fitted',
  lived_abroad: 'tilted',
  literate: 'tilted',
  income: 'modelled',
  birthplace: 'modelled',
  residence_2019: 'modelled',
  school_attendance: 'modelled',
};

/**
 * What anchors a modelled card, the part of its source line after the model:
 * a município table, a parish table that fixes only part of it, or nothing.
 * The census thread's per-attribute table (doc 240 §7) is the source.
 */
export const MODELLED_ANCHOR: Partial<Record<PortraitRecipe, Text>> = {
  income: {
    pt: 'ancorado às declarações de IRS de 2021 por concelho (INE) e às pensões da Segurança Social; a repartição pela freguesia é do modelo',
    en: 'anchored to the 2021 income tax returns by municipality (INE) and to Social Security pensions; the split by parish is the model’s',
  },
  birthplace: {
    pt: 'o quadro 12296 do INE fixa, por freguesia, os portugueses nascidos no estrangeiro; o resto da repartição é do modelo',
    en: 'INE table 12296 fixes, per parish, Portuguese nationals born abroad; the rest of the split is the model’s',
  },
  residence_2019: {
    pt: 'nenhum quadro do INE a fixa, de freguesia ou de concelho; o quadro 12312 serve só de verificação',
    en: 'no INE table fixes it, for the parish or the municipality; table 12312 serves only as a check',
  },
  school_attendance: {
    pt: 'nenhum quadro do INE a fixa, de freguesia ou de concelho; segue a idade e a escolaridade de cada pessoa',
    en: 'no INE table fixes it, for the parish or the municipality; it follows each person’s age and education',
  },
};

/**
 * The INE table that fixes a layer question in each parish, named on its
 * source line (contract §2); the Portuguese carries its contraction ("ao
 * quadro", "à BGRI"). The core recipes keep the generic wording they
 * have carried since v1.0.0.
 */
export const RECIPE_TABLE: Partial<Record<PortraitRecipe, Text>> = {
  occupation: { pt: 'ao quadro 12306 do INE', en: 'INE table 12306' },
  industry: { pt: 'ao quadro 12370 do INE', en: 'INE table 12370' },
  work_place: { pt: 'ao quadro 12369 do INE', en: 'INE table 12369' },
  transport: { pt: 'ao quadro 12371 do INE', en: 'INE table 12371' },
  tenure: { pt: 'ao quadro 12498 do INE', en: 'INE table 12498' },
  building_period: { pt: 'ao quadro 11541 do INE', en: 'INE table 11541' },
  accessibility: { pt: 'à BGRI 2021 do INE', en: 'INE’s BGRI 2021' },
  lived_abroad: { pt: 'ao quadro 12297 do INE', en: 'INE table 12297' },
  literate: { pt: 'ao quadro 12274 do INE', en: 'INE table 12274' },
};

/**
 * A response the site shows as published but whose figures, the producer
 * found, may not match the downloadable microdata (POP3-ACC-01): v1.0.3's
 * household_type answers were computed before the release's final packaging
 * recounted the family nuclei. The site neither recomputes them nor prints
 * its own measure of the gap (handoff §3); it says so wherever the figures
 * appear (the card, the game clue, the methodology row, the column
 * dictionary) until the producer ships a corrected release.
 */
export const RECIPE_CAVEAT: Partial<Record<PortraitRecipe, Text>> = {
  household_type: {
    pt: 'Estes valores podem diferir ligeiramente dos que se obtêm a partir dos microdados para download. Vamos corrigi-los na próxima versão.',
    en: 'These figures can differ slightly from what you get from the downloadable microdata. We will correct them in the next release.',
  },
};

/**
 * Person questions whose field, for residents of collective living quarters,
 * was assigned after the fit (education imputed from similar records,
 * employment status filled in): the source line says so, since "fitted" is
 * not true of those rows (POP3-ACC-V02, INSTITUTIONAL_RECORDS). v1.2 writes
 * those residents inside the generator (DECISIONS §65, C2), so the layer
 * questions, which only v1.2 answers, are not listed, and at the v1.2 bump
 * this list empties (contract, runbook).
 */
const INSTITUTIONAL_AFTER_FIT: readonly PortraitRecipe[] = ['education', 'employment'];

/**
 * A card's source line. It ends with the recipe's caveat, if it has one, so a
 * surface that shows only the source (the game's clue) still carries it; the
 * parish card passes `withCaveat: false` and sets the caveat apart as a note.
 */
export function sourceLine(recipe: PortraitRecipe, locale: Locale, { withCaveat = true }: { withCaveat?: boolean } = {}): string {
  const provenance = RECIPE_PROVENANCE[recipe];
  const table = RECIPE_TABLE[recipe]?.[locale];
  const institutional = INSTITUTIONAL_AFTER_FIT.includes(recipe)
    ? (locale === 'pt'
      ? '; quem vive em alojamentos coletivos entra com valores atribuídos depois do ajuste'
      : '; residents of collective quarters carry values assigned after the fit')
    : '';
  const caveat = withCaveat && RECIPE_CAVEAT[recipe] ? `. ${RECIPE_CAVEAT[recipe]![locale]}` : '';
  if (locale === 'pt') {
    if (provenance === 'derived') return `População sintética v${POPULATION_RELEASE} · derivada da população gerada a partir dos Censos 2021 (INE); não é uma das tabelas usadas no ajuste${caveat}`;
    if (provenance === 'modelled') return `População sintética v${POPULATION_RELEASE} · modelado: atribuído a cada pessoa por um modelo${recipe === 'income' ? '' : ' da amostra de microdados dos Censos 2021'}; ${MODELLED_ANCHOR[recipe]?.pt ?? 'nenhum quadro de freguesia o fixa'}; média de cinco sorteios${caveat}`;
    if (provenance === 'tilted') return `População sintética v${POPULATION_RELEASE}, factos dos Censos · atribuídos a cada pessoa por um modelo da amostra de microdados dos Censos 2021 e ajustados, freguesia a freguesia, ${table ?? 'ao quadro do INE'}; média de cinco sorteios${caveat}`;
    return table
      ? `População sintética v${POPULATION_RELEASE} · grupos de um campo ajustado, freguesia a freguesia, ${table} (Censos 2021)${institutional}${caveat}`
      : `População sintética v${POPULATION_RELEASE} · grupos de um campo ajustado às tabelas dos Censos 2021 (INE)${institutional}${caveat}`;
  }
  if (provenance === 'derived') return `Synthetic population v${POPULATION_RELEASE} · derived from the population generated from the 2021 Census (INE); not one of the tables it was fitted to${caveat}`;
  if (provenance === 'modelled') return `Synthetic population v${POPULATION_RELEASE} · modelled: assigned to each person by a model${recipe === 'income' ? '' : ' of the 2021 Census public-use sample'}; ${MODELLED_ANCHOR[recipe]?.en ?? 'no parish table fixes it'}; mean of five draws${caveat}`;
  if (provenance === 'tilted') return `Synthetic population v${POPULATION_RELEASE}, census facts · drawn for each person by a model of the 2021 Census public-use sample and tilted, parish by parish, to ${table ?? 'INE’s table'}; mean of five draws${caveat}`;
  return table
    ? `Synthetic population v${POPULATION_RELEASE} · groups of a field fitted, parish by parish, to ${table} (2021 Census)${institutional}${caveat}`
    : `Synthetic population v${POPULATION_RELEASE} · groups of a field fitted to the 2021 Census tables (INE)${institutional}${caveat}`;
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
