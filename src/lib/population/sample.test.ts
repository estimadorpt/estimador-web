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
    const [person] = decodeSamples({ r: POPULATION_RELEASE, s: [[[4, [1, 74, 21, 23, 3]]]] })[0][0].people;
    expect(personHead(person, 'pt')).toBe('Mulher, 74 anos');
    expect(personDetails(person, 'pt')).toEqual(['reformada', '1.º ciclo do básico', 'viúva']);
    expect(personDetails(person, 'en')).toEqual(['retired', 'primary school', 'widowed']);
    const [worker] = decodeSamples({ r: POPULATION_RELEASE, s: [[[3, [2, 41, 3, 11, 2, 0, 4, 6, 4, 2]]]] })[0][0].people;
    expect([personHead(worker, 'pt'), ...personDetails(worker, 'pt')].join(' · '))
      .toBe('Homem, 41 anos · trabalha por conta de outrem (serviços e vendas) · noutro concelho, de carro · secundário · casado');
    // A child: no schooling level, no "outra situação"; where they study and how they get there.
    const [child] = decodeSamples({ r: POPULATION_RELEASE, s: [[[3, [1, 8, 1, 25, 0, 0, 0, 0, 2, 5]]]] })[0][0].people;
    expect(personHead(child, 'pt')).toBe('Menina, 8 anos');
    expect(personDetails(child, 'pt')).toEqual(['estuda na freguesia, no transporte da empresa ou da escola']);
    expect(personHead(child, 'en')).toBe('Girl, 8');
  });

  it('pick a decorative landscape', () => {
    expect(defaultLandscape('azores', '4801', 19)).toBe('town');
    expect(defaultLandscape('lisboa', '1106', 50000)).toBe('city');
    expect(defaultLandscape('norte', '0402', 300)).toBe('hills');
    expect(defaultLandscape('centro', '1001', 3000)).toBe('village');
  });
});
