/**
 * "Bate à porta": a few generated households per parish, drawn for the parish
 * page's village (scripts/build-parish-samples.py writes sample/<CODE>.json).
 * The file keeps the release's codes as small integers; this module turns them
 * into plain words, in Portuguese and English, from the release's label maps
 * (release.json → label_maps), shortened for a line on a card.
 *
 * It is a toy beside the parish's published answers: every line describes one
 * generated record, and nothing here counts, ranks or compares them.
 */
import type { Neighbourhood } from '@/lib/miniatura/population';

export type Locale = 'pt' | 'en';
/** [sex, age, edu, emp, mar, foreign, sit, occ, work, mode], trailing zeros dropped (see the script). */
export type RawPerson = number[];
/** [rooms, person, person, …] */
export type RawHousehold = [number, ...RawPerson[]];
export interface ParishSample { r: string; s: RawHousehold[][] }

export interface SamplePerson {
  sex: 'f' | 'm';
  age: number;
  /** education_level_code (1, 21, 22, 23, 3, 4, 51–55), 0 when not given */
  edu: number;
  /** employment_status_code (11, 12, 21–25) */
  emp: number;
  /** marital_status_code (1–4), 0 when not given */
  mar: number;
  foreign: boolean;
  /** sitprof_code (1–5), 0 when not applicable */
  sit: number;
  /** CPP 2010 major group (0–9), null when not applicable */
  occ: number | null;
  /** work_location_type (1–6): where the person works or studies, 0 when not applicable */
  work: number;
  /** transport_mode (1–11), 0 when not applicable or not given */
  mode: number;
}

export interface SampleHousehold { rooms: number | null; people: SamplePerson[] }

export function decodePerson(raw: RawPerson): SamplePerson {
  const at = (i: number) => raw[i] ?? 0;
  return {
    sex: at(0) === 1 ? 'f' : 'm',
    age: at(1),
    edu: at(2),
    emp: at(3),
    mar: at(4),
    foreign: at(5) === 1,
    sit: at(6),
    occ: at(7) > 0 ? at(7) - 1 : null,
    work: at(8),
    mode: at(9) === 12 ? 0 : at(9),
  };
}

export function decodeHousehold(raw: RawHousehold): SampleHousehold {
  const [rooms, ...people] = raw;
  return { rooms: rooms > 0 ? rooms : null, people: (people as RawPerson[]).map(decodePerson) };
}

export function decodeSamples(file: ParishSample): SampleHousehold[][] {
  return file.s.map(sample => sample.map(decodeHousehold));
}

type Gendered = { pt: [f: string, m: string]; en: string };
type Plain = { pt: string; en: string };

/** education_level_code. */
export const EDUCATION: Record<number, Plain> = {
  1: { pt: 'sem escolaridade', en: 'no schooling' },
  21: { pt: '1.º ciclo do básico', en: 'primary school' },
  22: { pt: '2.º ciclo do básico', en: '2nd cycle of basic school' },
  23: { pt: '3.º ciclo do básico', en: 'lower secondary' },
  3: { pt: 'secundário', en: 'upper secondary' },
  4: { pt: 'pós-secundário', en: 'post-secondary' },
  51: { pt: 'curso técnico superior', en: 'higher technical course' },
  52: { pt: 'bacharelato', en: 'bacharelato (3-year degree)' },
  53: { pt: 'licenciatura', en: 'degree' },
  54: { pt: 'mestrado', en: 'master’s' },
  55: { pt: 'doutoramento', en: 'doctorate' },
};

/** employment_status_code other than 11 (employed, which sitprof_code words). */
export const ACTIVITY: Record<number, Gendered> = {
  12: { pt: ['desempregada', 'desempregado'], en: 'unemployed' },
  21: { pt: ['estudante', 'estudante'], en: 'student' },
  22: { pt: ['doméstica', 'doméstico'], en: 'homemaker' },
  23: { pt: ['reformada', 'reformado'], en: 'retired' },
  24: { pt: ['incapacitada para o trabalho', 'incapacitado para o trabalho'], en: 'unable to work' },
  25: { pt: ['outra situação', 'outra situação'], en: 'other situation' },
};

/** sitprof_code, for the employed. */
export const SITUATION: Record<number, Gendered> = {
  1: { pt: ['patroa, com menos de 10 pessoas', 'patrão, com menos de 10 pessoas'], en: 'employer, under 10 staff' },
  2: { pt: ['patroa, com 10 ou mais pessoas', 'patrão, com 10 ou mais pessoas'], en: 'employer, 10 or more staff' },
  3: { pt: ['trabalha por conta própria', 'trabalha por conta própria'], en: 'self-employed' },
  4: { pt: ['trabalha por conta de outrem', 'trabalha por conta de outrem'], en: 'employee' },
  5: { pt: ['trabalha', 'trabalha'], en: 'works' },
};

/** CPP 2010 major group (occupation_major). */
export const OCCUPATION: Record<number, Plain> = {
  0: { pt: 'Forças Armadas', en: 'armed forces' },
  1: { pt: 'direção e gestão', en: 'management' },
  2: { pt: 'profissão intelectual ou científica', en: 'professional' },
  3: { pt: 'técnico de nível intermédio', en: 'technician' },
  4: { pt: 'apoio administrativo', en: 'clerical support' },
  5: { pt: 'serviços e vendas', en: 'services and sales' },
  6: { pt: 'agricultura e pesca', en: 'farming and fishing' },
  7: { pt: 'indústria, construção e ofícios', en: 'crafts and trades' },
  8: { pt: 'operação de máquinas', en: 'machine operation' },
  9: { pt: 'trabalho não qualificado', en: 'elementary work' },
};

/** marital_status_code. */
export const MARITAL: Record<number, Gendered> = {
  1: { pt: ['solteira', 'solteiro'], en: 'single' },
  2: { pt: ['casada', 'casado'], en: 'married' },
  3: { pt: ['viúva', 'viúvo'], en: 'widowed' },
  4: { pt: ['divorciada', 'divorciado'], en: 'divorced' },
};

/** work_location_type: where a person works or studies. */
export const PLACE: Record<number, Plain> = {
  1: { pt: 'em casa', en: 'at home' },
  2: { pt: 'na freguesia', en: 'in the parish' },
  3: { pt: 'noutra freguesia do concelho', en: 'elsewhere in the municipality' },
  4: { pt: 'noutro concelho', en: 'in another municipality' },
  5: { pt: 'no estrangeiro', en: 'abroad' },
  6: { pt: 'sem local fixo', en: 'with no fixed place' },
};

/** transport_mode (NR, "não indicado", is dropped by decodePerson). */
export const MODE: Record<number, Plain> = {
  1: { pt: 'a pé', en: 'on foot' },
  2: { pt: 'de carro', en: 'by car' },
  3: { pt: 'à boleia, de carro', en: 'by car, as a passenger' },
  4: { pt: 'de autocarro', en: 'by bus' },
  5: { pt: 'no transporte da empresa ou da escola', en: 'by company or school transport' },
  6: { pt: 'de metro', en: 'by metro' },
  7: { pt: 'de comboio', en: 'by train' },
  8: { pt: 'de mota', en: 'by motorbike' },
  9: { pt: 'de bicicleta', en: 'by bicycle' },
  10: { pt: 'de barco', en: 'by boat' },
  11: { pt: 'noutro transporte', en: 'by other transport' },
};

const gendered = (words: Gendered | undefined, sex: 'f' | 'm', locale: Locale) =>
  words ? (locale === 'pt' ? words.pt[sex === 'f' ? 0 : 1] : words.en) : null;

/** "Mulher, 74 anos", "Menino, 7 anos", "Woman, 74", "Boy, 7". */
export function personHead(person: SamplePerson, locale: Locale): string {
  const { sex, age } = person;
  const f = sex === 'f';
  if (locale === 'pt') {
    const who = age < 13 ? (f ? 'Menina' : 'Menino') : age < 18 ? (f ? 'Rapariga' : 'Rapaz') : f ? 'Mulher' : 'Homem';
    return `${who}, ${age === 0 ? 'menos de 1 ano' : age === 1 ? '1 ano' : `${age} anos`}`;
  }
  const who = age < 18 ? (f ? 'Girl' : 'Boy') : f ? 'Woman' : 'Man';
  return `${who}, ${age === 0 ? 'under 1' : age}`;
}

/**
 * The rest of the line, in the order a neighbour would say it: what the person
 * does, where they work or study and how they get there, schooling, marital
 * status, nationality. Fields a record leaves empty are left out; a child's
 * schooling and "outra situação" are not said (they read wrong under 15).
 */
export function personDetails(person: SamplePerson, locale: Locale): string[] {
  const pt = locale === 'pt';
  const child = person.age < 15;
  const parts: string[] = [];
  if (person.emp === 11) {
    const doing = gendered(SITUATION[person.sit], person.sex, locale) ?? (pt ? 'trabalha' : 'works');
    const occupation = person.occ === null ? null : OCCUPATION[person.occ]?.[locale];
    parts.push(occupation ? `${doing} (${occupation})` : doing);
  } else if (!(child && person.emp === 25)) {
    const activity = gendered(ACTIVITY[person.emp], person.sex, locale);
    if (activity) parts.push(activity);
  }
  if (person.work > 0 && PLACE[person.work]) {
    // "trabalha por conta própria · noutro concelho, de carro": the verb is not said twice.
    const said = parts[0]?.startsWith(pt ? 'trabalha' : 'works');
    const verb = said ? '' : person.emp === 11 ? (pt ? 'trabalha ' : 'works ') : (pt ? 'estuda ' : 'studies ');
    const mode = person.work === 1 ? null : MODE[person.mode]?.[locale];
    parts.push(`${verb}${PLACE[person.work][locale]}${mode ? `, ${mode}` : ''}`);
  }
  if (!child && EDUCATION[person.edu]) parts.push(EDUCATION[person.edu][locale]);
  if (person.age >= 18) {
    const marital = gendered(MARITAL[person.mar], person.sex, locale);
    if (marital) parts.push(marital);
  }
  if (person.foreign) parts.push(pt ? 'nacionalidade estrangeira' : 'foreign national');
  return parts;
}

/** "3 pessoas · 4 divisões" / "3 people · 4 rooms". */
export function householdLine(household: SampleHousehold, locale: Locale): string {
  const n = household.people.length;
  const pt = locale === 'pt';
  const people = pt ? `${n} ${n === 1 ? 'pessoa' : 'pessoas'}` : `${n} ${n === 1 ? 'person' : 'people'}`;
  if (household.rooms === null) return people;
  const rooms = pt
    ? `${household.rooms} ${household.rooms === 1 ? 'divisão' : 'divisões'}`
    : `${household.rooms} ${household.rooms === 1 ? 'room' : 'rooms'}`;
  return `${people} · ${rooms}`;
}

/**
 * The village's scenery, which is decoration and says nothing about the place:
 * the islands by the sea, the largest parishes as a town, the inland north and
 * centre among hills, the rest as a village. The reader can change it.
 */
export function defaultLandscape(region: string, municipality: string, censusPopulation: number): Neighbourhood {
  if (region === 'azores' || region === 'madeira') return 'town';
  if (censusPopulation >= 20000) return 'city';
  const district = municipality.slice(0, 2);
  if (['04', '05', '09', '17', '18'].includes(district)) return 'hills';
  if (district === '08') return 'town';
  return 'village';
}
