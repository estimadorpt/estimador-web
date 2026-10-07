import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR, POPULATION_RELEASE } from '@/lib/config/population';
import {
  ACTIVITY, EDUCATION, MARITAL, MODE, OCCUPATION, PLACE, SITUATION,
  decodeSamples, defaultLandscape, householdLine, personDetails, personHead,
  type ParishSample,
} from './sample';

const dir = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const read = (code: string) => fs.readFileSync(path.join(dir, 'sample', `${code}.json`));
const release = JSON.parse(fs.readFileSync(path.join(dir, 'release.json'), 'utf8')) as { label_maps: Record<string, Record<string, string>> };

/**
 * The bytes scripts/build-parish-samples.py writes for these parishes. The
 * draw is seeded by the release and the parish code, so a rebuild must write
 * the same files; the script's --verify checks every parish against the
 * microdata (members of their own household, private households only).
 */
const PINNED: Record<string, string> = {
  '040219': 'f302c873a40dd6968c59fe3dc57df5f862c249f30a01419cca4766c2c86cdbb2',
  '0302FA': '4502f08fd88683f8a1422cd63295d8157e813f5dd7c2afe5b59280ae7feb85dd',
  '111102': 'c3fcfa0c2639cd72c3d8723901e2d44d4641de043d57d7960ba0db97b66d22b7',
  '030857': '88a2e6d84cbc32b45085e59435ccba0b711bf5201f718cb8f67eacdcf4979f59',
  // Mosteiro (Lajes das Flores): 11 private households, all of them in one sample.
  '480107': '0c0f3eccd0030bb1039be7ba5d86438dc1e39bdd606db4beb7793245af77cf74',
  // Between 25 and 71 private households: every one of them, in two or three streets, none twice.
  '480201': '7206a18192bd306a0acd6c36da47478a387ac10916e6c288c6d4dcb28ff35489',
  '090729': '850d56f2414e8085cc7ed2388aa2c21210246a8730982d01a02119255607f5a0',
};

describe('parish samples (Bate à porta)', () => {
  it('are the deterministic draw the script writes', () => {
    for (const [code, digest] of Object.entries(PINNED)) {
      expect(createHash('sha256').update(read(code)).digest('hex'), code).toBe(digest);
    }
  });

  it('exist for every parish and stay small', () => {
    const files = fs.readdirSync(path.join(dir, 'sample')).filter(name => name.endsWith('.json'));
    expect(files).toHaveLength(3092);
    for (const code of Object.keys(PINNED)) expect(read(code).length).toBeLessThanOrEqual(6 * 1024);
  });

  it('hold up to three samples of up to 24 households, each with its own people', () => {
    for (const code of Object.keys(PINNED)) {
      const file = JSON.parse(read(code).toString('utf8')) as ParishSample;
      expect(file.r).toBe(POPULATION_RELEASE);
      const samples = decodeSamples(file);
      expect(samples.length).toBeGreaterThanOrEqual(1);
      expect(samples.length).toBeLessThanOrEqual(3);
      for (const sample of samples) {
        expect(sample.length).toBeGreaterThan(0);
        expect(sample.length).toBeLessThanOrEqual(24);
        for (const household of sample) {
          // A private household: someone lives there, and not a collective quarters' crowd.
          expect(household.people.length).toBeGreaterThan(0);
          expect(household.people.length).toBeLessThanOrEqual(15);
          expect(household.rooms === null || household.rooms >= 1).toBe(true);
          // Oldest first, as the card lists them.
          const ages = household.people.map(p => p.age);
          expect([...ages].sort((a, b) => b - a)).toEqual(ages);
        }
      }
    }
    expect(decodeSamples(JSON.parse(read('480107').toString('utf8')))).toHaveLength(1);
    expect(decodeSamples(JSON.parse(read('111102').toString('utf8')))).toHaveLength(3);
  });

  it('decode every code they carry into words, in both languages', () => {
    for (const code of Object.keys(PINNED)) {
      for (const sample of decodeSamples(JSON.parse(read(code).toString('utf8')))) {
        for (const household of sample) {
          for (const person of household.people) {
            expect(['f', 'm']).toContain(person.sex);
            expect(person.age).toBeGreaterThanOrEqual(0);
            expect(person.age).toBeLessThan(120);
            if (person.edu) expect(EDUCATION[person.edu], `edu ${person.edu}`).toBeDefined();
            expect(person.emp === 11 || ACTIVITY[person.emp] !== undefined, `emp ${person.emp}`).toBe(true);
            if (person.mar) expect(MARITAL[person.mar]).toBeDefined();
            if (person.sit) expect(SITUATION[person.sit]).toBeDefined();
            if (person.occ !== null) expect(OCCUPATION[person.occ]).toBeDefined();
            if (person.work) expect(PLACE[person.work]).toBeDefined();
            if (person.mode) expect(MODE[person.mode]).toBeDefined();
            for (const locale of ['pt', 'en'] as const) {
              const line = [personHead(person, locale), ...personDetails(person, locale)].join(' · ');
              expect(line).not.toMatch(/undefined|null|NaN/);
              expect(householdLine(household, locale)).not.toMatch(/undefined|null|NaN/);
            }
          }
        }
      }
    }
  });

  it('have a word for every code in the release’s label maps', () => {
    const maps = release.label_maps;
    const words: Array<[string, (code: string) => unknown]> = [
      ['education_level_code', c => EDUCATION[Number(c)]],
      ['employment_status_code', c => (c === '11' ? SITUATION[4] : ACTIVITY[Number(c)])],
      ['marital_status_code', c => MARITAL[Number(c)]],
      ['sitprof_code', c => SITUATION[Number(c)]],
      ['work_location_type', c => PLACE[Number(c)]],
      ['transport_mode', c => (c === 'NR' ? 'dropped' : MODE[Number(c)])],
    ];
    for (const [column, word] of words) {
      expect(maps[column], column).toBeDefined();
      for (const code of Object.keys(maps[column])) expect(word(code), `${column} ${code}`).toBeDefined();
    }
    for (let major = 0; major <= 9; major++) expect(OCCUPATION[major].pt && OCCUPATION[major].en).toBeTruthy();
  });

  it('speak in plain words', () => {
    const one = (raw: number[]) => decodeSamples({ r: POPULATION_RELEASE, s: [[[3, raw]]] })[0][0].people[0];
    const line = (raw: number[], locale: 'pt' | 'en' = 'pt') => [personHead(one(raw), locale), ...personDetails(one(raw), locale)].join(' · ');
    expect(line([1, 74, 21, 23, 3])).toBe('Mulher, 74 anos · reformada · tem o 4.º ano · viúva');
    expect(line([1, 74, 21, 23, 3], 'en')).toBe('Woman, 74 · retired · left school after year 4 · widowed');
    expect(line([2, 41, 3, 11, 2, 0, 4, 6, 4, 2]))
      .toBe('Homem, 41 anos · trabalha por conta de outrem, nos serviços ou nas vendas · noutro concelho, de carro · tem o 12.º ano · casado');
    // The occupation takes the person's gender.
    expect(line([1, 38, 3, 11, 2, 0, 4, 4, 3, 7])).toBe('Mulher, 38 anos · trabalha por conta de outrem, como técnica de nível intermédio · noutra freguesia do concelho, de comboio · tem o 12.º ano · casada');
    // Elementary work never says "trabalha … (trabalho …)".
    expect(line([2, 50, 23, 11, 2, 0, 4, 10, 2, 1])).toBe('Homem, 50 anos · trabalha por conta de outrem, em tarefas não qualificadas · na freguesia, a pé · tem o 9.º ano · casado');
    // An employer has a business; the place still says "trabalha".
    expect(line([1, 52, 23, 11, 2, 0, 1, 6, 1])).toBe('Mulher, 52 anos · tem uma empresa com menos de 10 pessoas, nos serviços ou nas vendas · trabalha em casa · tem o 9.º ano · casada');
    expect(line([1, 52, 23, 11, 2, 0, 1, 6, 1], 'en')).toBe('Woman, 52 · runs a business with under 10 staff, in services or sales · works at home · left school after year 9 · married');
    // A student is said once: where they study.
    expect(line([1, 20, 3, 21, 1, 0, 0, 0, 4, 4])).toBe('Mulher, 20 anos · estuda noutro concelho, de autocarro · tem o 12.º ano · solteira');
    expect(line([1, 20, 3, 21, 1])).toBe('Mulher, 20 anos · estudante · tem o 12.º ano · solteira');
    expect(line([1, 20, 3, 21, 1, 0, 0, 0, 4, 4], 'en')).toBe('Woman, 20 · studies in another municipality, by bus · finished year 12 · single');
    // "Estuda" only of a student, or of someone under 25 in "outra situação"; anyone else spends the day there.
    expect(line([2, 19, 23, 25, 1, 0, 0, 0, 3, 4])).toBe('Homem, 19 anos · estuda noutra freguesia do concelho, de autocarro · tem o 9.º ano · solteiro');
    expect(line([2, 50, 23, 25, 2, 0, 0, 0, 4, 2])).toBe('Homem, 50 anos · passa o dia noutro concelho, de carro · tem o 9.º ano · casado');
    expect(line([2, 50, 23, 25, 2, 0, 0, 0, 4, 2], 'en')).toBe('Man, 50 · spends the day in another municipality, by car · left school after year 9 · married');
    // "Sem local fixo" is said only of a job: a retired woman with no fixed place gets no place at all.
    expect(line([1, 63, 21, 23, 2, 0, 0, 0, 6, 2])).toBe('Mulher, 63 anos · reformada · tem o 4.º ano · casada');
    expect(line([1, 8, 1, 25, 0, 0, 0, 0, 6, 2])).toBe('Menina, 8 anos');
    expect(line([2, 30, 3, 11, 1, 0, 4, 9, 6, 2])).toBe('Homem, 30 anos · trabalha por conta de outrem, como operador de máquinas ou condutor · sem local fixo, de carro · tem o 12.º ano · solteiro');
    // Whoever runs a business or works for themselves goes in work transport, not "da empresa".
    expect(line([2, 45, 23, 11, 2, 0, 2, 8, 4, 5])).toBe('Homem, 45 anos · tem uma empresa com 10 ou mais pessoas, na indústria, na construção ou num ofício · trabalha noutro concelho, em transporte do trabalho · tem o 9.º ano · casado');
    expect(line([2, 45, 23, 11, 2, 0, 3, 7, 3, 5])).toBe('Homem, 45 anos · trabalha por conta própria, na agricultura, na floresta ou na pesca · noutra freguesia do concelho, em transporte do trabalho · tem o 9.º ano · casado');
    expect(line([2, 45, 23, 11, 2, 0, 4, 10, 3, 5])).toBe('Homem, 45 anos · trabalha por conta de outrem, em tarefas não qualificadas · noutra freguesia do concelho, no transporte da empresa · tem o 9.º ano · casado');
    // "Outra situação" is never said, at any age.
    expect(line([2, 45, 22, 25, 4])).toBe('Homem, 45 anos · tem o 6.º ano · divorciado');
    // Children: creche, jardim de infância or escola, by school bus; no schooling level.
    expect(line([1, 8, 1, 25, 0, 0, 0, 0, 2, 5])).toBe('Menina, 8 anos · vai à escola na freguesia, de transporte escolar');
    expect(line([1, 8, 1, 25, 0, 0, 0, 0, 2, 5], 'en')).toBe('Girl, 8 · goes to school in the parish, by school bus');
    expect(line([2, 4, 1, 25, 0, 0, 0, 0, 3, 3])).toBe('Menino, 4 anos · vai ao jardim de infância noutra freguesia do concelho, de carro');
    expect(line([2, 0, 1, 25])).toBe('Bebé');
    expect(line([2, 0, 1, 25], 'en')).toBe('Baby');
    expect(line([1, 1, 1, 25])).toBe('Menina, 1 ano');
  });

  it('never repeat a household across a parish’s streets', () => {
    // Under 72 private households the streets are near-equal and hold every household once (25 to 71 → 2 or 3 streets).
    for (const code of ['480201', '090729']) {
      const sizes = decodeSamples(JSON.parse(read(code).toString('utf8'))).map(sample => sample.length);
      expect(Math.max(...sizes) - Math.min(...sizes), code).toBeLessThanOrEqual(1);
      expect(Math.max(...sizes), code).toBeLessThan(24);
    }
  });

  it('pick a decorative landscape', () => {
    expect(defaultLandscape('azores', '4801', 19)).toBe('town');
    expect(defaultLandscape('lisboa', '1106', 50000)).toBe('city');
    expect(defaultLandscape('norte', '0402', 300)).toBe('hills');
    expect(defaultLandscape('centro', '1001', 3000)).toBe('village');
  });
});
