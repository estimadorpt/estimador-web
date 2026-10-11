/**
 * The explainer's neighbourhood: 100 people in 30 households, written by hand
 * for /populacao/miniatura. Nothing here comes from the published population
 * or from anyone real; never import release records into this file.
 */

/** The three ways the scene arranges the same 100 people. */
export type View = 'homes' | 'age' | 'size';
export const VIEWS: View[] = ['homes', 'age', 'size'];

export type Person = {
  id: number;
  household: number;
  /** Place in the household, oldest first as written below. */
  member: number;
  /** People in the person's household. */
  size: number;
  age: number;
  /** Age group, an index into AGE_BANDS. */
  band: number;
};

/** Each household's ages, one array per home, in the order the homes are drawn. */
const HOUSEHOLD_AGES: number[][] = [
  [48], [68, 71], [41, 39, 9], [45, 43, 16, 12], [44, 41, 8, 5, 70], [52, 50, 22, 19, 81],
  [79], [29, 31], [57, 55, 24], [36, 34, 6, 2], [47, 45, 17, 14, 76], [42, 40, 11, 7, 3],
  [69], [74, 77], [30, 28, 1], [58, 56, 27, 23], [43, 40, 13, 10, 68], [67, 65, 37, 33, 4],
  [86], [46, 15], [66, 65, 39], [42, 44, 18, 15], [45, 43, 12, 9, 6], [55, 53, 29, 26, 72],
  [25], [73, 70], [35, 33, 4], [71, 49, 47, 20], [49, 46, 21, 18, 80], [31, 30, 5, 3, 0],
];

/** Age groups as INE's summary tables group them: under 15, 15 to 24, 25 to 64, 65 and over. */
export const AGE_BANDS = {
  pt: ['0–14 anos', '15–24 anos', '25–64 anos', '65 ou mais'],
  en: ['Ages 0–14', 'Ages 15–24', 'Ages 25–64', 'Ages 65+'],
} as const;

export function ageBand(age: number): number {
  return age < 15 ? 0 : age < 25 ? 1 : age < 65 ? 2 : 3;
}

export const PEOPLE: Person[] = HOUSEHOLD_AGES.flatMap((ages, household) =>
  ages.map((age, member) => ({ id: 0, household, member, size: ages.length, age, band: ageBand(age) })),
).map((person, id) => ({ ...person, id }));

export const HOUSEHOLDS = HOUSEHOLD_AGES.map((_, id) => ({ id, people: PEOPLE.filter(p => p.household === id) }));

/** Household sizes drawn in the "by size" view, 1 to 5 people. */
export const SIZES = [1, 2, 3, 4, 5];

/** The people in each age group, in AGE_BANDS order. */
export function byAge(): Person[][] {
  return AGE_BANDS.pt.map((_, band) => PEOPLE.filter(p => p.band === band));
}

/** The people in households of each size, in SIZES order. */
export function bySize(): Person[][] {
  return SIZES.map(size => PEOPLE.filter(p => p.size === size));
}

export const EDUCATION = {
  pt: ['Menos de 15 anos', 'Básico', 'Secundário', 'Superior'],
  en: ['Under 15', 'Basic', 'Secondary', 'Higher'],
} as const;
export const ACTIVITY = {
  pt: ['Empregado', 'Desempregado', 'Inativo'],
  en: ['Employed', 'Unemployed', 'Inactive'],
} as const;
export const MARITAL = {
  pt: ['Solteiro/a', 'Casado/a', 'Divorciado/a', 'Viúvo/a'],
  en: ['Single', 'Married', 'Divorced', 'Widowed'],
} as const;
export const COMMUTE = {
  pt: ['A pé', 'Automóvel', 'Transporte coletivo', 'Não se aplica'],
  en: ['On foot', 'Car', 'Public transport', 'Not applicable'],
} as const;

/** A person's other columns, invented by rule (the same kinds of column the published population has). */
export function details(person: Person) {
  const { id, age, household, member } = person;
  const activity = age < 21 || age >= 66 ? 2 : id % 9 === 4 ? 1 : 0;
  return {
    sex: (id + household) % 2 === 0 ? 'F' : 'M',
    education: age < 15 ? 0 : age >= 65 ? (id % 4 === 0 ? 2 : 1) : 1 + ((household + member) % 3),
    activity,
    marital: age < 25 ? 0 : age >= 75 && id % 2 === 0 ? 3 : person.size === 1 && id % 3 === 0 ? 2 : member < 2 && person.size > 1 ? 1 : 0,
    commute: activity === 0 ? id % 3 : 3,
  };
}

/** The home's own columns, invented by rule. */
export function householdDetails(id: number) {
  return { rooms: 2 + ((id * 7) % 5), rented: id % 3 === 0 };
}

/**
 * The fit, in miniature: the table the neighbourhood has to match (invented,
 * standing in for one of INE's tables for a parish) and 30 households drawn
 * at random from the candidates before any fit, by age group in AGE_BANDS
 * order. The neighbourhood's own counts, after the fit, are counted from PEOPLE.
 */
export const FIT = {
  target: [20, 12, 48, 20],
  unfitted: [28, 9, 41, 15],
} as const;

export function fittedCounts(): number[] {
  return byAge().map(group => group.length);
}

/** How many people a set of counts is away from the table: the sum of the gaps, group by group. */
export function distanceFromTarget(counts: readonly number[]): number {
  return counts.reduce((sum, n, i) => sum + Math.abs(n - FIT.target[i]), 0);
}
