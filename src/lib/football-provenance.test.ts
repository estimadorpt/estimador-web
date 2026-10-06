import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Who the Liga pages say the third-party data belong to (audit PRO3-03,
 * round 4). The xG behind xPts is FotMob's: the model's
 * `analysis/xpts.py` reads `xg_data.parquet`, which `cli/predict.py`
 * rebuilds with `data/fotmob.build_xg_dataset`. Results, shot counts and the
 * goalkeepers' xGOT are SofaScore's. The "Fora da licença" marks on
 * /desporto/liga/dados point readers to the rights-holder, so a wrong name
 * there sends them to the wrong one.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf8');

const DADOS = 'src/app/[locale]/desporto/liga/dados/page.tsx';
const FILES = [
  DADOS,
  'src/app/[locale]/desporto/liga/2025-26/page.tsx',
  'src/content/football-methodology/pt.mdx',
  'src/content/football-methodology/en.mdx',
];
const PROVIDER = /SofaScore|FotMob|Transfermarkt|football-data\.co\.uk|Pinnacle|Bet365/;

describe('Liga third-party provenance', () => {
  it.each(FILES)('%s names FotMob for every xG it attributes', file => {
    const text = read(file);
    // "SofaScore xG" puts the provider before the word.
    expect(text).not.toMatch(/SofaScore\s+xG\b/);
    // Otherwise the provider follows xG in the same clause ("xG da FotMob",
    // "o xG de xpts_table (…), da FotMob"): the first one named after it,
    // before the clause ends, must be FotMob. \bxG\b leaves out xGOT and xGF.
    for (const m of text.matchAll(/\bxG\b/g)) {
      const clause = text.slice(m.index! + 2).split(/[.;]\s|\n/)[0];
      const named = clause.match(PROVIDER)?.[0];
      if (named) expect(`${named} in "xG${clause.slice(0, 80)}"`).toMatch(/^FotMob/);
    }
  });

  it('every "Fora da licença" mark on /dados names its provider, in both locales', () => {
    const marks = [...read(DADOS).matchAll(/thirdParty: \{\s*pt: "([^"]+)",\s*en: "([^"]+)"/g)];
    expect(marks.length).toBeGreaterThan(10);
    for (const [, pt, en] of marks) {
      expect(pt).toMatch(PROVIDER);
      expect(en).toMatch(PROVIDER);
    }
  });

  it('the licence paragraph lists FotMob among the sources it does not cover', () => {
    const lines = read(DADOS).split('\n');
    const licence = lines.filter((_, i) => /licenceThirdParty:/.test(lines[i - 1] ?? ''));
    expect(licence).toHaveLength(2);
    for (const line of licence) expect(line).toMatch(/xG \(FotMob\)/);
  });
});
