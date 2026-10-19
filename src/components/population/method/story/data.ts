/**
 * The scroll story's script: the scenes in order, which of the five steps
 * each belongs to, what the stage says in each, and the household that step 1
 * writes token by token. Shared by the server (which checks the MDX against
 * it) and the client stage. Every number here belongs to the invented parish
 * of src/lib/population/method-example.ts; the probabilities in WRITE are
 * illustrative and the stage says so.
 */

type Locale = 'pt' | 'en';
type Text = { pt: string; en: string };

/** The scenes, in the order the reader meets them. Each `<Beat at="…">` in the MDX names one. */
export const BEATS = ['learn', 'tables', 'candidates', 'mask', 'tilt', 'choose', 'collective', 'publish', 'tier'] as const;
export type BeatId = (typeof BEATS)[number];

/** Which of the five steps a scene belongs to (1 to 5). */
export const BEAT_STEP: Record<BeatId, number> = {
  learn: 1, tables: 2, candidates: 2, mask: 2, tilt: 2, choose: 3, collective: 4, publish: 5, tier: 5,
};

/** Scenes the scroll plays through rather than switches: the reader's position inside them is the animation's. */
export const SCRUBBED: readonly BeatId[] = ['learn', 'tilt'];

/** The five steps' short names, for the ruler over the stage. */
export const STEP_NAMES: Record<Locale, string[]> = {
  pt: ['Aprender', 'Ajustar', 'Escolher', 'Coletivos', 'Publicar'],
  en: ['Learn', 'Fit', 'Choose', 'Collective', 'Publish'],
};

/** One field of a person, as the stage writes it. */
export type Field = 'sex' | 'age' | 'education' | 'work';

/** One option the generator could write, with its (illustrative) probability; 0 and `impossible` for an option the rules forbid. */
export type Choice = { label: Text; p: number; impossible?: boolean };

/** One token of the written household: whose, which field, what was written and what else could have been. */
export type Token = {
  member: number;
  field: Field;
  value: Text;
  /** What the panel asks while this token is written. */
  question: Text;
  /** What the generator has already written, when it changes the odds. */
  given?: Text;
  choices: Choice[];
  /** Index of the written option in `choices`. */
  picked: number;
  /** Earlier tokens (indices in WRITE) this one depends on most; the stage draws a line from each. */
  looksAt?: number[];
};

const c = (pt: string, en: string, p: number, impossible = false): Choice => ({ label: { pt, en }, p, impossible: impossible || undefined });

/**
 * The household step 1 writes: a woman of 38, a man of 36 and a boy of 4,
 * candidate WRITTEN of the example. Four fields a person (the model writes
 * more); the odds shift with what is already written: the second adult's age
 * gathers near the first's, and a four-year-old cannot have finished school
 * or work.
 */
export const WRITE: Token[] = [
  { member: 0, field: 'sex', value: { pt: 'Mulher', en: 'Female' }, question: { pt: 'Sexo da pessoa 1', en: 'Sex of person 1' },
    choices: [c('Mulher', 'Female', 0.52), c('Homem', 'Male', 0.48)], picked: 0 },
  { member: 0, field: 'age', value: { pt: '38', en: '38' }, question: { pt: 'Idade da pessoa 1', en: 'Age of person 1' },
    choices: [c('25–34', '25–34', 0.22), c('35–44', '35–44', 0.41), c('45–54', '45–54', 0.22), c('55–64', '55–64', 0.09), c('Outra', 'Other', 0.06)], picked: 1 },
  { member: 0, field: 'education', value: { pt: 'Superior', en: 'Higher' }, question: { pt: 'Escolaridade da pessoa 1', en: 'Education of person 1' },
    choices: [c('Básico', 'Basic', 0.34), c('Secundário', 'Secondary', 0.28), c('Superior', 'Higher', 0.38)], picked: 2 },
  { member: 0, field: 'work', value: { pt: 'Empregada', en: 'Employed' }, question: { pt: 'Trabalho da pessoa 1', en: 'Work of person 1' },
    choices: [c('Empregada', 'Employed', 0.81), c('Desempregada', 'Unemployed', 0.06), c('Inativa', 'Inactive', 0.13)], picked: 0 },
  { member: 1, field: 'sex', value: { pt: 'Homem', en: 'Male' }, question: { pt: 'Sexo da pessoa 2', en: 'Sex of person 2' },
    given: { pt: 'Já escrita: uma mulher de 38 anos', en: 'Already written: a woman of 38' },
    choices: [c('Mulher', 'Female', 0.12), c('Homem', 'Male', 0.88)], picked: 1, looksAt: [0, 1] },
  { member: 1, field: 'age', value: { pt: '36', en: '36' }, question: { pt: 'Idade da pessoa 2', en: 'Age of person 2' },
    given: { pt: 'Perto da idade da pessoa 1, que tem 38', en: 'Close to person 1’s age, 38' },
    choices: [c('25–34', '25–34', 0.21), c('35–44', '35–44', 0.66), c('45–54', '45–54', 0.09), c('Outra', 'Other', 0.04)], picked: 1, looksAt: [1] },
  { member: 1, field: 'education', value: { pt: 'Secundário', en: 'Secondary' }, question: { pt: 'Escolaridade da pessoa 2', en: 'Education of person 2' },
    choices: [c('Básico', 'Basic', 0.3), c('Secundário', 'Secondary', 0.41), c('Superior', 'Higher', 0.29)], picked: 1 },
  { member: 1, field: 'work', value: { pt: 'Empregado', en: 'Employed' }, question: { pt: 'Trabalho da pessoa 2', en: 'Work of person 2' },
    choices: [c('Empregado', 'Employed', 0.86), c('Desempregado', 'Unemployed', 0.05), c('Inativo', 'Inactive', 0.09)], picked: 0 },
  { member: 2, field: 'sex', value: { pt: 'Homem', en: 'Male' }, question: { pt: 'Sexo da pessoa 3', en: 'Sex of person 3' },
    choices: [c('Mulher', 'Female', 0.49), c('Homem', 'Male', 0.51)], picked: 1 },
  { member: 2, field: 'age', value: { pt: '4', en: '4' }, question: { pt: 'Idade da pessoa 3', en: 'Age of person 3' },
    given: { pt: 'Ao lado de um casal de 38 e 36, o mais provável é uma criança', en: 'Beside a couple of 38 and 36, a child is most likely' },
    choices: [c('0–4', '0–4', 0.41), c('5–9', '5–9', 0.33), c('10–14', '10–14', 0.19), c('15 ou mais', '15 or over', 0.07)], picked: 0, looksAt: [1, 5] },
  { member: 2, field: 'education', value: { pt: 'Nenhum', en: 'None' }, question: { pt: 'Escolaridade da pessoa 3', en: 'Education of person 3' },
    given: { pt: 'Aos 4 anos, o resto é impossível', en: 'At 4, the rest is impossible' },
    choices: [c('Nenhum', 'None', 1), c('Básico', 'Basic', 0, true), c('Secundário', 'Secondary', 0, true), c('Superior', 'Higher', 0, true)], picked: 0, looksAt: [9] },
  { member: 2, field: 'work', value: { pt: '—', en: '—' }, question: { pt: 'Trabalho da pessoa 3', en: 'Work of person 3' },
    given: { pt: 'Menos de 15 anos: fica fora', en: 'Under 15: left out' },
    choices: [c('Não se aplica', 'Not applicable', 1), c('Empregado', 'Employed', 0, true), c('Desempregado', 'Unemployed', 0, true)], picked: 0, looksAt: [9] },
];

/** The fields in the order a person's row lists them. */
export const FIELDS: Field[] = ['sex', 'age', 'education', 'work'];

/** How many tokens are written a share `p` of the way through step 1 (0 to WRITE.length). */
export function tokensWritten(p: number): number {
  // The last stretch holds the finished household, so the reader sees it whole before the scene changes.
  return Math.min(WRITE.length, Math.floor(Math.max(0, p) / 0.86 * WRITE.length + 0.35));
}

/** What the stage's caption says in each scene: one line, read out when the scene changes. */
export const READOUT: Record<Locale, Record<BeatId, string>> = {
  pt: {
    learn: 'O gerador escreve um atributo de cada vez; as probabilidades do desenho são ilustrativas.',
    tables: 'A freguesia inventada: 10 agregados e 23 pessoas nas suas tabelas.',
    candidates: '24 candidatos, todos com o mesmo peso.',
    mask: '3 candidatos ficam de fora: a tabela não tem agregados de 5 ou mais pessoas.',
    tilt: 'Os pesos mudam até as somas darem as tabelas.',
    choose: '10 agregados inteiros, 23 pessoas: as somas dão as duas tabelas.',
    collective: 'Mais 5 pessoas num lar, a partir das contagens do INE.',
    publish: 'Um registo por pessoa, com as colunas declaradas.',
    tier: 'Com menos de 500 residentes, a freguesia fica no nível C.',
  },
  en: {
    learn: 'The generator writes one attribute at a time; the drawing’s probabilities are illustrative.',
    tables: 'The invented parish: 10 households and 23 people in its tables.',
    candidates: '24 candidates, all with the same weight.',
    mask: '3 candidates are left out: the table has no households of 5 or more.',
    tilt: 'The weights move until the sums match the tables.',
    choose: '10 whole households, 23 people: the sums match both tables.',
    collective: '5 more people in a care home, from INE’s counts.',
    publish: 'One record per person, with the declared columns.',
    tier: 'With under 500 residents, the parish is tier C.',
  },
};
