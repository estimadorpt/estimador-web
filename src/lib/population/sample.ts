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

/**
 * education_level_code: the highest level completed, as people say it ("tem o
 * 9.º ano", "left school after year 9"). Someone still studying has finished a
 * year rather than left school (`FINISHED_YEAR`).
 */
export const EDUCATION: Record<number, Plain> = {
  1: { pt: 'sem escolaridade', en: 'no schooling' },
  21: { pt: 'tem o 4.º ano', en: 'left school after year 4' },
  22: { pt: 'tem o 6.º ano', en: 'left school after year 6' },
  23: { pt: 'tem o 9.º ano', en: 'left school after year 9' },
  3: { pt: 'tem o 12.º ano', en: 'left school after year 12' },
  4: { pt: 'tem um curso pós-secundário', en: 'has a post-secondary course' },
  51: { pt: 'tem um curso técnico superior', en: 'has a higher technical course' },
  52: { pt: 'tem bacharelato', en: 'has a three-year degree' },
  53: { pt: 'tem licenciatura', en: 'has a degree' },
  54: { pt: 'tem mestrado', en: 'has a master’s' },
  55: { pt: 'tem doutoramento', en: 'has a doctorate' },
};

/** For a student, in English: "finished year 9", not "left school after year 9". */
const FINISHED_YEAR: Record<number, string> = { 21: 'finished year 4', 22: 'finished year 6', 23: 'finished year 9', 3: 'finished year 12' };

/**
 * employment_status_code other than 11 (employed, which sitprof_code words).
 * 25, the census's "outra situação", is never said: it reads like a form, and
 * the rest of the line (where the day is spent, schooling) says enough.
 */
export const ACTIVITY: Record<number, Gendered> = {
  12: { pt: ['desempregada', 'desempregado'], en: 'unemployed' },
  21: { pt: ['estudante', 'estudante'], en: 'student' },
  22: { pt: ['doméstica', 'doméstico'], en: 'homemaker' },
  23: { pt: ['reformada', 'reformado'], en: 'retired' },
  24: { pt: ['incapacitada para o trabalho', 'incapacitado para o trabalho'], en: 'unable to work' },
  25: { pt: ['outra situação', 'outra situação'], en: 'other situation' },
};
const UNSAID_ACTIVITY = 25;

/** sitprof_code, for the employed. */
export const SITUATION: Record<number, Plain> = {
  1: { pt: 'tem uma empresa com menos de 10 pessoas', en: 'runs a business with under 10 staff' },
  2: { pt: 'tem uma empresa com 10 ou mais pessoas', en: 'runs a business with 10 or more staff' },
  3: { pt: 'trabalha por conta própria', en: 'self-employed' },
  4: { pt: 'trabalha por conta de outrem', en: 'works for an employer' },
  5: { pt: 'trabalha', en: 'works' },
};

/**
 * CPP 2010 major group (occupation_major), said after the situation: "trabalha
 * por conta de outrem, como técnica de nível intermédio", "trabalha nos serviços
 * ou nas vendas". A role takes the person's gender.
 */
export const OCCUPATION: Record<number, Gendered> = {
  0: { pt: ['nas Forças Armadas', 'nas Forças Armadas'], en: 'in the armed forces' },
  1: { pt: ['como diretora ou gestora', 'como diretor ou gestor'], en: 'as a manager' },
  2: { pt: ['numa profissão intelectual ou científica', 'numa profissão intelectual ou científica'], en: 'in a professional occupation' },
  3: { pt: ['como técnica de nível intermédio', 'como técnico de nível intermédio'], en: 'as a technician' },
  4: { pt: ['como administrativa', 'como administrativo'], en: 'in an office job' },
  5: { pt: ['nos serviços ou nas vendas', 'nos serviços ou nas vendas'], en: 'in services or sales' },
  6: { pt: ['na agricultura, na floresta ou na pesca', 'na agricultura, na floresta ou na pesca'], en: 'in farming, forestry or fishing' },
  7: { pt: ['na indústria, na construção ou num ofício', 'na indústria, na construção ou num ofício'], en: 'in industry, construction or a trade' },
  8: { pt: ['como operadora de máquinas ou condutora', 'como operador de máquinas ou condutor'], en: 'as a machine operator or driver' },
  9: { pt: ['em tarefas não qualificadas', 'em tarefas não qualificadas'], en: 'in elementary tasks' },
};

/** The groups said as a field of work (nas Forças Armadas, nos serviços…), not as a role. */
const FIELD_GROUPS = new Set([0, 2, 5, 6, 7]);

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

/** transport_mode (NR, "não indicado", is dropped by decodePerson); a child's words come from CHILD_MODE. */
export const MODE: Record<number, Plain> = {
  1: { pt: 'a pé', en: 'on foot' },
  2: { pt: 'de carro', en: 'by car' },
  3: { pt: 'à boleia', en: 'getting a lift' },
  4: { pt: 'de autocarro', en: 'by bus' },
  5: { pt: 'no transporte da empresa', en: 'by company transport' },
  6: { pt: 'de metro', en: 'by metro' },
  7: { pt: 'de comboio', en: 'by train' },
  8: { pt: 'de mota', en: 'by motorbike' },
  9: { pt: 'de bicicleta', en: 'by bicycle' },
  10: { pt: 'de barco', en: 'by boat' },
  11: { pt: 'noutro transporte', en: 'by other transport' },
};
/** Whoever runs a business or works for themselves has no "empresa" bus to be driven in. */
const OWN_WORK_MODE: Plain = { pt: 'em transporte do trabalho', en: 'by work transport' };
/** Under 18 someone else drives, and the shared transport is the school's. */
const CHILD_MODE: Record<number, Plain> = {
  2: { pt: 'de carro', en: 'by car' },
  3: { pt: 'de carro', en: 'by car' },
  5: { pt: 'de transporte escolar', en: 'by school bus' },
};

const gendered = (words: Gendered | undefined, sex: 'f' | 'm', locale: Locale) =>
  words ? (locale === 'pt' ? words.pt[sex === 'f' ? 0 : 1] : words.en) : null;

/** "Mulher, 74 anos", "Menino, 7 anos", "Bebé"; "Woman, 74", "Boy, 7", "Baby". */
export function personHead(person: SamplePerson, locale: Locale): string {
  const { sex, age } = person;
  const f = sex === 'f';
  if (age === 0) return locale === 'pt' ? 'Bebé' : 'Baby';
  if (locale === 'pt') {
    const who = age < 13 ? (f ? 'Menina' : 'Menino') : age < 18 ? (f ? 'Rapariga' : 'Rapaz') : f ? 'Mulher' : 'Homem';
    return `${who}, ${age === 1 ? '1 ano' : `${age} anos`}`;
  }
  const who = age < 18 ? (f ? 'Girl' : 'Boy') : f ? 'Woman' : 'Man';
  return `${who}, ${age}`;
}

/** What a child who leaves home for the day does: creche, jardim de infância, escola. */
function childGoes(age: number, locale: Locale) {
  if (age < 3) return locale === 'pt' ? 'vai à creche' : 'goes to nursery';
  if (age < 6) return locale === 'pt' ? 'vai ao jardim de infância' : 'goes to preschool';
  return locale === 'pt' ? 'vai à escola' : 'goes to school';
}

/**
 * The rest of the line, in the order a neighbour would say it: what the person
 * does, where they work or study and how they get there, schooling, marital
 * status, nationality. Fields a record leaves empty are left out, nothing is
 * said twice ("estuda noutro concelho", not "estudante · estuda …"), and a
 * child under 15 gets neither a schooling level nor the census's "outra
 * situação".
 *
 * The census asks where people work or study, so "estuda" is said only of a
 * student (or of someone under 25 in "outra situação"); anyone else without a
 * job who has a place in the record "passa o dia" there, and a place that is
 * no place ("sem local fixo") is said only of a job.
 */
export function personDetails(person: SamplePerson, locale: Locale): string[] {
  const pt = locale === 'pt';
  const child = person.age < 15;
  const minor = person.age < 18;
  const employed = person.emp === 11;
  const studies = person.emp === 21 || (person.emp === UNSAID_ACTIVITY && person.age < 25);
  const parts: string[] = [];
  const place = person.work > 0 && (employed || person.work !== 6) ? PLACE[person.work]?.[locale] ?? null : null;
  const ownWork = employed && person.sit >= 1 && person.sit <= 3;
  const modeWords = person.work === 1
    ? undefined
    : (minor ? CHILD_MODE[person.mode] : undefined) ?? (ownWork && person.mode === 5 ? OWN_WORK_MODE : MODE[person.mode]);
  const where = place ? `${place}${modeWords ? `, ${modeWords[locale]}` : ''}` : null;

  if (employed) {
    const situation = SITUATION[person.sit]?.[locale] ?? (pt ? 'trabalha' : 'works');
    // An employer's line keeps a field ("na construção") but not a role ("como gestor") or "tarefas não qualificadas".
    const employer = person.sit === 1 || person.sit === 2;
    const occupation = person.occ === null || (employer && !FIELD_GROUPS.has(person.occ)) ? null : gendered(OCCUPATION[person.occ], person.sex, locale);
    // "trabalha nos serviços…" reads on; "trabalha por conta de outrem, como técnica…" takes a comma.
    const bare = situation === (pt ? 'trabalha' : 'works');
    parts.push(occupation ? `${situation}${bare ? ' ' : ', '}${occupation}` : situation);
    if (where) {
      const said = situation.startsWith(pt ? 'trabalha' : 'works');
      parts.push(said ? where : `${pt ? 'trabalha' : 'works'} ${where}`);
    }
  } else if (where && child) {
    parts.push(`${childGoes(person.age, locale)} ${where}`);
  } else if (where && studies) {
    parts.push(`${pt ? 'estuda' : 'studies'} ${where}`);
  } else {
    const activity = person.emp === UNSAID_ACTIVITY ? null : gendered(ACTIVITY[person.emp], person.sex, locale);
    if (activity) parts.push(activity);
    if (where) parts.push(`${pt ? 'passa o dia' : 'spends the day'} ${where}`);
  }
  if (!child && EDUCATION[person.edu]) {
    parts.push(!pt && studies && FINISHED_YEAR[person.edu] ? FINISHED_YEAR[person.edu] : EDUCATION[person.edu][locale]);
  }
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
