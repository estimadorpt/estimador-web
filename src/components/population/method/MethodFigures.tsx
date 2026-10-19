import type { ReactNode } from 'react';
import { BRAND } from '@/lib/brand';
import { DEEMPHASIS, SERIES, formatValue } from '@/components/viz/theme';
import { ChartTable } from '@/components/viz/ChartTable';
import { formatCount } from '@/lib/population/format';
import {
  AGE_BANDS, ARRANGEMENTS, CANDIDATES as EX_ALL, CARE_HOME, ELDERS_ALONE_RANGE, SAMPLE, SIZE_LABELS, TARGET, TARGET_HOUSEHOLDS, TARGET_PEOPLE,
  ageBand, agesOf, eldersAlone, methodExample, type Counts,
} from '@/lib/population/method-example';
import type { PopulationReleaseInfo } from '@/types/population';
import { HouseGlyph, type HouseState } from './HouseGlyph';
import { TickGlyph } from '@/components/instrument/glyphs';
import { tierGrid, type TierThresholds } from './rules';

/**
 * The methodology's fixed drawings: why the population is needed (the same
 * tables fit different parishes; the public sample has no parish), then one
 * figure per step that follows the same invented parish as the scroll story
 * (24 households the generator proposes, two small tables to match) from the
 * first guess to the published file and the opening question's answer, and
 * the tier rule as the grid it is. They are the story's twin, with its tables,
 * and what a reader without scripts sees. The figures are
 * server-rendered HTML with small SVG glyphs, so their words stay real text at
 * every width; every figure with numbers has its table beside it or a table
 * twin under it. Nothing here is from the published population: the example
 * says so in each figure's note.
 */
type Locale = 'pt' | 'en';

// Server-only: computed once per build (milliseconds); never import this module from a client component.
const EX = methodExample();

const people = (n: number, pt: boolean) => (pt ? `${n} ${n === 1 ? 'pessoa' : 'pessoas'}` : `${n} ${n === 1 ? 'person' : 'people'}`);
const households = (n: number, pt: boolean) => (pt ? `${n} ${n === 1 ? 'agregado' : 'agregados'}` : `${n} ${n === 1 ? 'household' : 'households'}`);
const one = (v: number, locale: Locale) => formatValue(Math.round(v * 10) / 10, locale);
const two = (v: number, locale: Locale) => (locale === 'pt' ? v.toFixed(2).replace('.', ',') : v.toFixed(2));

/** The note under every example figure: what is invented, and what it stands for. */
function exampleNote(locale: Locale, candidates = true): string {
  if (!candidates) {
    return locale === 'pt'
      ? 'Esquema com uma freguesia inventada: casas, idades e tabelas escritas para este exemplo; numa freguesia real, as tabelas são as do INE (Censos 2021).'
      : 'Diagram with an invented parish: homes, ages and tables written for this example; in a real parish the tables are INE’s (2021 Census).';
  }
  return locale === 'pt'
    ? 'Esquema com uma freguesia inventada: agregados, idades e tabelas escritos para este exemplo; numa freguesia real, as tabelas são as do INE (Censos 2021) e os candidatos são muitos mais.'
    : 'Diagram with an invented parish: households, ages and tables written for this example; in a real parish the tables are INE’s (2021 Census) and the candidates are many more.';
}

function Frame({ id, title, lede, note, children, twin }: { id?: string; title: string; lede?: ReactNode; note?: string; children: ReactNode; twin?: ReactNode }) {
  return (
    <figure id={id} className="not-prose my-8 min-w-0 border-t border-ink pt-3 font-sans">
      <figcaption className="mb-5">
        <span className="block text-[17px] font-semibold leading-6 text-ink">{title}</span>
        {lede && <span className="mt-1 block max-w-[68ch] text-[14px] leading-5 text-graphite">{lede}</span>}
      </figcaption>
      {children}
      {note && <p className="mb-0 mt-5 max-w-[68ch] text-[12.5px] leading-[18px] text-graphite">{note}</p>}
      {twin}
    </figure>
  );
}

/** The four age colours, named, with the heights children take. */
function AgeKey({ locale }: { locale: Locale }) {
  return (
    <ul className="mt-4 flex list-none flex-wrap gap-x-4 gap-y-1 pl-0 text-[12.5px] text-graphite" aria-label={locale === 'pt' ? 'Cores das idades' : 'Age colours'}>
      {AGE_BANDS[locale].map((band, i) => (
        <li key={band} className="m-0 inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-2.5" style={{ background: SERIES[i] }} />
          {band}
        </li>
      ))}
    </ul>
  );
}

/** One household with its ages under it. */
function Home({ ages, state, weight, prior, maxWeight, label }: { ages: number[]; state?: HouseState; weight?: number; prior?: number; maxWeight?: number; label?: string }) {
  const barMax = 60;
  return (
    <li className="m-0 flex w-[74px] flex-col items-center gap-1">
      <HouseGlyph ages={ages} state={state} />
      <span className={`text-center text-[11px] leading-[14px] tabular-nums ${state === 'masked' || state === 'faded' ? 'text-graphite' : 'text-ink'}`}>
        {ages.join(' · ')}
      </span>
      {weight !== undefined && maxWeight !== undefined && (
        <span aria-hidden="true" className="relative mt-0.5 block h-[12px]" style={{ width: barMax }}>
          <span className="absolute left-0 top-[3px] block h-[6px] bg-ink" style={{ width: Math.max(1, (weight / maxWeight) * barMax) }} />
          {prior !== undefined && <span className="absolute top-0 block h-[12px] w-[1.5px] bg-graphite" style={{ left: (prior / maxWeight) * barMax }} />}
        </span>
      )}
      {label && <span className="text-[11px] leading-[14px] text-graphite">{label}</span>}
    </li>
  );
}

function Pool({ children, label }: { children: ReactNode; label: string }) {
  return <ul aria-label={label} className="m-0 flex list-none flex-wrap gap-x-1.5 gap-y-4 pl-0">{children}</ul>;
}

/** A table's rows as bars: the generated count (before in grey, after in ink) against the table's count, a black square. */
function TableBars({ title, labels, target, before, after, locale }: { title: string; labels: readonly string[]; target: readonly number[]; before?: number[]; after: number[]; locale: Locale }) {
  const pt = locale === 'pt';
  const max = Math.max(...target, ...(before ?? []), ...after) * 1.05;
  const at = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[13px] font-semibold text-ink">{title}</p>
      <ul className="m-0 list-none space-y-2.5 pl-0">
        {labels.map((label, i) => (
          <li key={label} className="m-0 grid grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-[12.5px]">
            <span className="text-ink">{label}</span>
            <span className="relative block h-[18px] border-l border-ink">
              {before && <span className="absolute left-0 top-[2px] block h-[5px]" style={{ width: at(before[i]), background: DEEMPHASIS }} />}
              <span className="absolute left-0 top-[9px] block h-[7px] bg-ink" style={{ width: at(after[i]) }} />
              <span className="absolute top-[4px] block size-[10px] -translate-x-1/2 border border-paper bg-ink" style={{ left: at(target[i]) }} />
            </span>
            <span className="text-right tabular-nums text-ink">{target[i]}</span>
          </li>
        ))}
      </ul>
      <p className="mb-0 mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-graphite">
        <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="inline-block size-2 bg-ink" />{pt ? 'a tabela (número à direita)' : 'the table (number on the right)'}</span>
        {before && <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="inline-block h-1 w-3" style={{ background: DEEMPHASIS }} />{pt ? 'antes' : 'before'}</span>}
        <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="inline-block h-1.5 w-3 bg-ink" />{before ? (pt ? 'depois' : 'after') : (pt ? 'os escolhidos' : 'the chosen')}</span>
      </p>
    </div>
  );
}

/** The parish's two invented tables, as tables. */
function ParishTables({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const th = 'border-b border-ink py-1 text-[12px] font-semibold text-graphite';
  const td = 'border-b border-grid py-1';
  const table = (caption: string, head: [string, string], labels: readonly string[], values: readonly number[], total: string) => (
    <table className="w-full border-collapse text-[13px] tabular-nums">
      <caption className="mb-1 text-left text-[13px] font-semibold text-ink">{caption}</caption>
      <thead><tr><th scope="col" className={`${th} text-left`}>{head[0]}</th><th scope="col" className={`${th} text-right`}>{head[1]}</th></tr></thead>
      <tbody>
        {labels.map((label, i) => (
          <tr key={label}><th scope="row" className={`${td} text-left font-normal text-ink`}>{label}</th><td className={`${td} text-right ${values[i] === 0 ? 'font-semibold' : ''}`}>{values[i]}</td></tr>
        ))}
        <tr><th scope="row" className="py-1 text-left font-normal text-graphite">Total</th><td className="py-1 text-right text-graphite">{total}</td></tr>
      </tbody>
    </table>
  );
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      {table(pt ? 'Agregados por número de pessoas' : 'Households by number of people', pt ? ['Pessoas', 'Agregados'] : ['People', 'Households'], SIZE_LABELS[locale], TARGET.sizes, String(TARGET_HOUSEHOLDS))}
      {table(pt ? 'Pessoas por idade' : 'People by age', pt ? ['Idade', 'Pessoas'] : ['Age', 'People'], AGE_BANDS[locale], TARGET.ages, String(TARGET_PEOPLE))}
    </div>
  );
}

function Arrow({ children }: { children: ReactNode }) {
  return (
    <p className="my-4 flex items-center gap-2 text-[13px] text-graphite">
      <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden="true" focusable="false" className="shrink-0"><path d="M7 0 V20 M1 14 L7 20 L13 14" stroke={BRAND.ink} strokeWidth="1.5" fill="none" /></svg>
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ why */

const ELDERS = TARGET.ages[3];
const ALONE = TARGET.sizes[0];
/** The opening question's answer in a set of households: people of 65 or over living alone. */
const aloneIn = (homes: number[][]) => eldersAlone(homes);
const isElderAlone = (ages: number[]) => ages.length === 1 && ageBand(ages[0]) === 3;

/** The question as the two tables leave it: the margins known, the inside not. */
function CrossTable({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const th = 'border-b border-ink px-2 py-1 text-right text-[12px] font-semibold text-graphite';
  const td = 'border-b border-grid px-2 py-1 text-right';
  const unknown = <span aria-label={pt ? 'desconhecido' : 'unknown'} className="font-bold text-graphite">?</span>;
  const rows: Array<[string, ReactNode, ReactNode, number]> = [
    [pt ? 'Vivem sozinhas' : 'Live alone', unknown, unknown, ALONE],
    [pt ? 'Não vivem sozinhas' : 'Do not live alone', unknown, unknown, TARGET_PEOPLE - ALONE],
  ];
  return (
    <table className="mt-6 w-full max-w-[30rem] border-collapse text-[13px] tabular-nums">
      <caption className="mb-1 text-left text-[13px] font-semibold text-ink">{pt ? `Quantas das ${ELDERS} pessoas com 65 ou mais anos vivem sozinhas?` : `How many of the ${ELDERS} people aged 65 or over live alone?`}</caption>
      <thead>
        <tr>
          <th scope="col" className="border-b border-ink py-1 pl-0 pr-2 text-left text-[12px] font-semibold text-graphite"><span className="sr-only">{pt ? 'Pessoas' : 'People'}</span></th>
          <th scope="col" className={th}>{pt ? '65 ou mais' : '65 or over'}</th>
          <th scope="col" className={th}>{pt ? 'Menos de 65' : 'Under 65'}</th>
          <th scope="col" className={`${th} pr-0`}>Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, a, b, total]) => (
          <tr key={label}>
            <th scope="row" className="border-b border-grid py-1 pl-0 pr-2 text-left font-normal text-ink">{label}</th>
            <td className={td}>{a}</td><td className={td}>{b}</td><td className={`${td} pr-0 font-semibold`}>{total}</td>
          </tr>
        ))}
        <tr>
          <th scope="row" className="py-1 pl-0 text-left font-normal text-graphite">Total</th>
          <td className="px-2 py-1 text-right font-semibold">{ELDERS}</td>
          <td className="px-2 py-1 text-right font-semibold">{TARGET_PEOPLE - ELDERS}</td>
          <td className="py-1 pl-2 pr-0 text-right text-graphite">{TARGET_PEOPLE}</td>
        </tr>
      </tbody>
    </table>
  );
}

/** The same tables, three parishes: the 23 people in the 10 homes three ways, each giving both tables. */
export function FigureWhy({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const ways = [
    { key: 'real', homes: agesOf(ARRANGEMENTS.real), name: pt ? 'A freguesia do início' : 'The parish we began with' },
    { key: 'none', homes: agesOf(ARRANGEMENTS.none), name: pt ? 'Outra maneira' : 'Another way' },
    { key: 'three', homes: agesOf(ARRANGEMENTS.three), name: pt ? 'Mais outra' : 'And another' },
  ];
  const counts = ways.map(w => aloneIn(w.homes)).sort((a, b) => a - b);
  const list = pt ? `${counts[0]}, ${counts[1]} ou ${counts[2]}` : `${counts[0]}, ${counts[1]} or ${counts[2]}`;
  return (
    <Frame
      id="figura-porque"
      title={pt ? `As mesmas tabelas servem freguesias com ${list} pessoas de 65 ou mais a viver sozinhas` : `The same tables fit parishes where ${list} people aged 65 or over live alone`}
      lede={pt
        ? `O INE publica contagens, tabela a tabela. Estas duas dizem que ${ALONE} pessoas vivem sozinhas e que ${ELDERS} têm 65 ou mais anos, mas não quantas são as duas coisas. As mesmas ${TARGET_PEOPLE} pessoas cabem nas mesmas ${TARGET_HOUSEHOLDS} casas de muitas maneiras que dão estas tabelas; três delas, abaixo.`
        : `INE publishes counts, table by table. These two say that ${ALONE} people live alone and ${ELDERS} are aged 65 or over, but not how many are both. The same ${TARGET_PEOPLE} people fit the same ${TARGET_HOUSEHOLDS} homes in many ways that give these tables; three of them below.`}
      note={exampleNote(locale, false)}
      twin={(
        <ChartTable
          summaryLabel={pt ? 'Ver as três maneiras em tabela' : 'View the three ways as a table'}
          caption={pt ? 'Três maneiras de viver nas mesmas casas, com as mesmas tabelas' : 'Three ways of living in the same homes, with the same tables'}
          columns={pt ? ['Maneira', 'Idades, casa a casa', 'Com 65 ou mais, a viver sozinhas'] : ['Way', 'Ages, home by home', 'Aged 65 or over, living alone']}
          align={[undefined, 'left', 'right']}
          rows={ways.map(w => [w.name, w.homes.map(h => h.join(', ')).join(' | '), aloneIn(w.homes)])}
        />
      )}
    >
      <ParishTables locale={locale} />
      <CrossTable locale={locale} />
      {ways.map(w => (
        <div key={w.key} className="mt-6">
          <p className="mb-2 text-[13px] text-ink"><span className="font-semibold">{w.name}</span>{pt ? `: ${aloneIn(w.homes)} com 65 ou mais a viver sozinhas` : `: ${aloneIn(w.homes)} aged 65 or over living alone`}</p>
          <Pool label={pt ? `${w.name}: as ${TARGET_HOUSEHOLDS} casas, com as idades de cada uma; o telhado preenchido marca uma pessoa de 65 ou mais a viver sozinha` : `${w.name}: the ${TARGET_HOUSEHOLDS} homes, with each one’s ages; a filled roof marks someone aged 65 or over living alone`}>
            {w.homes.map((ages, i) => <Home key={i} ages={ages} state={isElderAlone(ages) ? 'chosen' : 'plain'} label={isElderAlone(ages) ? (pt ? 'sozinha, 65+' : 'alone, 65+') : undefined} />)}
          </Pool>
        </div>
      ))}
      <AgeKey locale={locale} />
    </Frame>
  );
}

/** The public sample: whole households, from anywhere in the country, with no parish. */
export function FigureSample({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  return (
    <Frame
      id="figura-amostra"
      title={pt ? 'A amostra pública mostra agregados inteiros, sem a freguesia' : 'The public sample shows whole households, without the parish'}
      lede={pt
        ? 'O Ficheiro de Uso Público dos Censos 2021 guarda as respostas de cada pessoa juntas, para cerca de 1 em cada 20 agregados do país, e diz só a região (NUTS II). Mostra como as pessoas vivem juntas; as tabelas, quantas são em cada freguesia.'
        : 'The 2021 Census Public Use File keeps each person’s answers together, for about 1 in 20 households in the country, and gives only the region (NUTS II). It shows how people live together; the tables, how many there are in each parish.'}
      note={pt
        ? `Agregados inventados para este exemplo (${SAMPLE.length}); os registos da amostra do INE não podem ser redistribuídos.`
        : `Households invented for this example (${SAMPLE.length}); INE’s sample records may not be redistributed.`}
    >
      <Pool label={pt ? `${SAMPLE.length} agregados de uma amostra inventada, com as idades de cada um` : `${SAMPLE.length} households from an invented sample, with each one’s ages`}>
        {SAMPLE.map((ages, i) => <Home key={i} ages={ages} />)}
      </Pool>
      <AgeKey locale={locale} />
    </Frame>
  );
}

/** The opening question, answered by counting the chosen households. */
export function FigureAnswer({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const { lo, hi } = ELDERS_ALONE_RANGE;
  const real = aloneIn(agesOf(ARRANGEMENTS.real));
  const generated = aloneIn(EX.chosen.map(i => EX.kept[i]));
  const W = 320;
  const x = (v: number) => 12 + ((v - lo) / Math.max(1, hi - lo)) * (W - 40);
  const ry = 22;
  return (
    <Frame
      id="figura-resposta"
      title={pt ? `Nesta população sintética, ${generated} das ${ELDERS} pessoas com 65 ou mais vivem sozinhas` : `In this synthetic population, ${generated} of the ${ELDERS} people aged 65 or over live alone`}
      lede={pt
        ? `As tabelas só garantiam uma resposta entre ${lo} e ${hi}; na freguesia do início eram ${real}. A população sintética dá uma resposta possível e coerente com as tabelas, não a verdadeira.`
        : `The tables only guaranteed an answer between ${lo} and ${hi}; in the parish we began with, it was ${real}. The synthetic population gives a possible answer, consistent with the tables, not the true one.`}
      note={exampleNote(locale)}
      twin={(
        <ChartTable
          summaryLabel={pt ? 'Ver em tabela' : 'View as a table'}
          caption={pt ? 'Pessoas com 65 ou mais anos que vivem sozinhas, na freguesia de exemplo' : 'People aged 65 or over who live alone, in the example parish'}
          columns={pt ? ['', 'Pessoas'] : ['', 'People']}
          align={[undefined, 'right']}
          rows={[
            [pt ? 'O que as duas tabelas permitem' : 'What the two tables allow', pt ? `${lo} a ${hi}` : `${lo} to ${hi}`],
            [pt ? 'A freguesia do início' : 'The parish we began with', real],
            [pt ? 'A população sintética, uma execução do modelo' : 'The synthetic population, one model run', generated],
          ]}
        />
      )}
    >
      <svg width={W} height={44} viewBox={`0 0 ${W} 44`} aria-hidden="true" focusable="false" className="block overflow-visible">
        <line x1={0} x2={W} y1={ry} y2={ry} stroke={BRAND.ink} strokeWidth={1} />
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map(v => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={ry} y2={ry + 5} stroke={BRAND.ink} strokeWidth={1} />
            <text x={x(v)} y={ry + 18} fontSize={12} fill={BRAND.muted} textAnchor="middle" fontFamily="inherit">{v}</text>
          </g>
        ))}
        <rect x={x(real) - 5} y={ry - 5} width={10} height={10} fill={BRAND.ink} stroke={BRAND.paper} strokeWidth={1.5} />
        <rect x={x(generated) - 1} y={ry - 13} width={2} height={18} fill={BRAND.ink} />
      </svg>
      <ul className="m-0 mt-3 list-none space-y-1 pl-0 text-[13px] text-ink">
        <li className="m-0 flex items-center gap-2">
          <span aria-hidden="true" className="inline-flex w-[26px] shrink-0 justify-center"><span className="inline-block size-2.5 bg-ink" /></span>
          <span>{pt ? 'A freguesia do início: ' : 'The parish we began with: '}<b className="tabular-nums">{real}</b></span>
        </li>
        <li className="m-0 flex items-center gap-2">
          <TickGlyph />
          <span>{pt ? 'A população sintética: ' : 'The synthetic population: '}<b className="tabular-nums">{generated}</b><span className="text-graphite">{pt ? ', uma execução do modelo' : ', one model run'}</span></span>
        </li>
      </ul>
    </Frame>
  );
}

/* ------------------------------------------------------------------ step 1 */

/** A household written one attribute at a time; the next choice reads everything already written. */
export function FigureLearn({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const rows: string[][] = pt
    ? [['Homem', '44 anos', 'Secundário', 'Empregado'], ['Mulher', '41 anos', 'Licenciatura', 'Empregada'], ['Homem']]
    : [['Man', '44', 'Secondary', 'Employed'], ['Woman', '41', 'Degree', 'Employed'], ['Man']];
  const options = AGE_BANDS[locale].map((band, i) => [band, [0.66, 0.24, 0.08, 0.02][i]] as [string, number]);
  const box = 'inline-flex min-h-8 items-center border border-rule px-2 text-[13px] text-ink';
  return (
    <Frame
      id="figura-aprender"
      title={pt ? 'Um agregado escreve-se como uma frase, um atributo de cada vez' : 'A household is written like a sentence, one attribute at a time'}
      lede={pt
        ? 'O gerador escolhe cada atributo depois de ler tudo o que já escreveu sobre o agregado. Aprendeu essas regras com a amostra pública dos Censos 2021, uma vez, e depois ficou fixo.'
        : 'The generator chooses each attribute after reading everything it has already written about the household. It learnt those rules from the 2021 Census public-use sample, once, and was then frozen.'}
      note={pt
        ? 'Esquema: o agregado e o comprimento das barras são inventados para mostrar a ideia; o gerador real escreve mais atributos por pessoa (por exemplo, estado civil, profissão e local de trabalho) e as idades ano a ano.'
        : 'Diagram: the household and the bar lengths are invented to show the idea; the real generator writes more attributes per person (marital status, occupation and place of work, for example) and single-year ages.'}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem]">
        <ol className="m-0 list-none space-y-2 pl-0" aria-label={pt ? 'O agregado, pessoa a pessoa' : 'The household, person by person'}>
          {rows.map((row, i) => (
            <li key={i} className="m-0 flex flex-wrap items-center gap-1.5">
              <span className="w-full text-[12.5px] text-graphite sm:w-[4.5rem]">{pt ? `Pessoa ${i + 1}` : `Person ${i + 1}`}</span>
              {row.map((value, j) => (
                <span key={j} className="inline-flex items-center gap-1.5">
                  <span className={box}>{value}</span>
                  {(j < row.length - 1 || i < rows.length - 1) && <span aria-hidden="true" className="text-graphite">›</span>}
                </span>
              ))}
              {i === rows.length - 1 && <span className={`${box} border-dashed border-ink font-semibold`}>{pt ? 'idade?' : 'age?'}</span>}
            </li>
          ))}
        </ol>
        <div className="border-l border-ink pl-4">
          <p className="mb-2 text-[13px] font-semibold text-ink">{pt ? 'A idade da pessoa 3, depois de ler as duas primeiras' : 'Person 3’s age, after reading the first two'}</p>
          <ul className="m-0 list-none space-y-1.5 pl-0">
            {options.map(([band, p], i) => (
              <li key={band} className="m-0 grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-2 text-[12.5px] text-ink">
                <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block size-2.5" style={{ background: SERIES[i] }} />{band}</span>
                <span className="block h-[7px] bg-ink" style={{ width: `${p * 100}%`, minWidth: 2 }} />
              </li>
            ))}
          </ul>
          <p className="mb-0 mt-2 text-[12px] leading-4 text-graphite">
            {pt ? 'Mais provável: um filho. A escolha é sorteada com estas chances, por isso dois agregados nunca saem iguais por obrigação.' : 'Likeliest: a child. The choice is drawn with these odds, so no two households are forced to come out the same.'}
          </p>
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ step 2 */

/** The parish's tables, the 24 candidates, and the three the tables rule out. */
export function FigureCandidates({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const masked = EX_ALL.length - EX.kept.length;
  return (
    <Frame
      id="figura-candidatos"
      title={pt ? `O gerador propõe ${EX_ALL.length} agregados; ${masked} ficam logo de fora` : `The generator proposes ${EX_ALL.length} households; ${masked} are out at once`}
      lede={pt
        ? 'Lê as tabelas da freguesia e inventa candidatos. A tabela de tamanhos publica zero agregados de 5 ou mais pessoas, por isso nenhum candidato desse tamanho pode entrar (a máscara).'
        : 'It reads the parish’s tables and invents candidates. The size table publishes zero households of 5 or more people, so no candidate of that size can enter (the mask).'}
      note={exampleNote(locale)}
    >
      <ParishTables locale={locale} />
      <Arrow>{pt ? 'o gerador lê as tabelas e inventa candidatos' : 'the generator reads the tables and invents candidates'}</Arrow>
      <Pool label={pt ? 'Os 24 agregados candidatos, com as idades de cada um' : 'The 24 candidate households, with each one’s ages'}>
        {EX_ALL.map((ages, i) => <Home key={i} ages={ages} state={ages.length >= 5 ? 'masked' : 'plain'} label={ages.length >= 5 ? (pt ? 'fora' : 'out') : undefined} />)}
      </Pool>
      <AgeKey locale={locale} />
    </Frame>
  );
}

/** The kept candidates' weights after the reweighting, and both tables before and after. */
export function FigureTilt({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const maxW = Math.max(...EX.after);
  const prior = EX.before[0];
  const rows = (labels: readonly string[], target: readonly number[], c0: Counts, c1: Counts, key: 'sizes' | 'ages') =>
    labels.map((label, i) => [label, target[i], one(c0[key][i], locale), one(c1[key][i], locale)]);
  const sizeLabels = SIZE_LABELS[locale].slice(0, 4);
  return (
    <Frame
      id="figura-pesos"
      title={pt ? 'Os pesos mudam o menos possível até as somas darem as tabelas' : 'The weights move as little as possible until the sums give the tables'}
      lede={pt
        ? 'Todos começam com o mesmo peso (o traço fino). Os candidatos ficaram novos de mais para esta freguesia, por isso os agregados de pessoas com 65 ou mais anos ganham peso e os casais jovens perdem.'
        : 'All start with the same weight (the thin tick). The candidates came out too young for this parish, so households of people aged 65 or over gain weight and young couples lose it.'}
      note={exampleNote(locale)}
      twin={(<>
        <ChartTable
          summaryLabel={pt ? 'Ver os pesos em tabela' : 'View the weights as a table'}
          caption={pt ? 'O peso de cada candidato, antes e depois do ajuste' : 'Each candidate’s weight, before and after the fit'}
          columns={pt ? ['Candidato', 'Idades', 'Peso antes', 'Peso depois'] : ['Candidate', 'Ages', 'Weight before', 'Weight after']}
          align={[undefined, 'left', 'right', 'right']}
          rows={EX.kept.map((ages, i) => [i + 1, ages.join(', '), two(EX.before[i], locale), two(EX.after[i], locale)])}
        />
        <ChartTable
          summaryLabel={pt ? 'Ver as somas em tabela' : 'View the sums as a table'}
          caption={pt ? 'As tabelas da freguesia de exemplo, antes e depois dos pesos' : 'The example parish’s tables, before and after the weights'}
          columns={pt ? ['Célula', 'Tabela', 'Antes', 'Depois'] : ['Cell', 'Table', 'Before', 'After']}
          rows={[...rows(sizeLabels, TARGET.sizes, EX.countsBefore, EX.countsAfter, 'sizes'), ...rows(AGE_BANDS[locale], TARGET.ages, EX.countsBefore, EX.countsAfter, 'ages')]}
        />
      </>)}
    >
      <Pool label={pt ? `Os ${EX.kept.length} candidatos que ficaram, cada um com o seu peso` : `The ${EX.kept.length} remaining candidates, each with its weight`}>
        {EX.kept.map((ages, i) => <Home key={i} ages={ages} weight={EX.after[i]} prior={prior} maxWeight={maxW} />)}
      </Pool>
      <p className="mb-0 mt-3 text-[12px] text-graphite">
        <span aria-hidden="true" className="mr-1 inline-block h-1 w-6 align-middle bg-ink" />{pt ? 'peso depois do ajuste; o traço fino marca o peso de partida, igual para todos' : 'weight after the fit; the thin tick marks the starting weight, the same for all'}
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <TableBars title={pt ? 'Pessoas por idade' : 'People by age'} labels={AGE_BANDS[locale]} target={TARGET.ages} before={EX.countsBefore.ages} after={EX.countsAfter.ages} locale={locale} />
        <TableBars title={pt ? 'Agregados por número de pessoas' : 'Households by number of people'} labels={sizeLabels} target={TARGET.sizes.slice(0, 4)} before={EX.countsBefore.sizes.slice(0, 4)} after={EX.countsAfter.sizes.slice(0, 4)} locale={locale} />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ step 3 */

export function FigureChoose({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const chosen = new Set(EX.chosen);
  const sizeLabels = SIZE_LABELS[locale].slice(0, 4);
  return (
    <Frame
      id="figura-escolha"
      title={pt ? `Ficam ${households(TARGET_HOUSEHOLDS, pt)} inteiros, com ${people(TARGET_PEOPLE, pt)}` : `${TARGET_HOUSEHOLDS} whole households stay, with ${TARGET_PEOPLE} people`}
      lede={pt
        ? 'Um peso de 0,4 não é um agregado. Escolhem-se agregados inteiros, cada um entra ou não entra, e a escolha procura ficar tão perto das tabelas quanto possível. Numa freguesia tão pequena experimentam-se todas as combinações; aqui uma acerta as duas tabelas, o que numa freguesia real nem sempre acontece.'
        : 'A weight of 0.4 is not a household. Whole households are chosen, each either in or out, and the choice tries to come as close to the tables as it can. In a parish this small every combination is tried; here one matches both tables, which does not always happen in a real parish.'}
      note={exampleNote(locale)}
      twin={(
        <ChartTable
          summaryLabel={pt ? 'Ver os escolhidos em tabela' : 'View the chosen ones as a table'}
          caption={pt ? 'Os agregados escolhidos na freguesia de exemplo' : 'The households chosen in the example parish'}
          columns={pt ? ['Agregado', 'Pessoas', 'Idades'] : ['Household', 'People', 'Ages']}
          align={[undefined, 'right', 'left']}
          rows={EX.chosen.map((i, n) => [n + 1, EX.kept[i].length, EX.kept[i].join(', ')])}
        />
      )}
    >
      <Pool label={pt ? `Os ${EX.kept.length} candidatos; os escolhidos têm o telhado preenchido` : `The ${EX.kept.length} candidates; the chosen ones have a filled roof`}>
        {EX.kept.map((ages, i) => <Home key={i} ages={ages} state={chosen.has(i) ? 'chosen' : 'faded'} label={chosen.has(i) ? (pt ? 'escolhido' : 'chosen') : undefined} />)}
      </Pool>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <TableBars title={pt ? 'Pessoas por idade' : 'People by age'} labels={AGE_BANDS[locale]} target={TARGET.ages} after={EX.countsChosen.ages} locale={locale} />
        <TableBars title={pt ? 'Agregados por número de pessoas' : 'Households by number of people'} labels={sizeLabels} target={TARGET.sizes.slice(0, 4)} after={EX.countsChosen.sizes.slice(0, 4)} locale={locale} />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ step 4 */

export function FigureCollective({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const filled = 'inline-block size-3 shrink-0 bg-ink';
  const imputed = 'inline-block size-3 shrink-0 border border-ink bg-[repeating-linear-gradient(45deg,var(--color-ink)_0_1px,transparent_1px_4px)]';
  const empty = 'inline-block size-3 shrink-0 border border-dashed border-ink';
  const fields: Array<[string, string, string]> = pt
    ? [
      ['Sexo e idade', 'das contagens do INE', filled],
      ['Escolaridade', 'imputada a partir de registos semelhantes', imputed],
      ['Núcleo familiar e campos de trabalho', 'vazios', empty],
    ]
    : [
      ['Sex and age', 'from INE’s counts', filled],
      ['Education', 'imputed from similar records', imputed],
      ['Family nucleus and work fields', 'empty', empty],
    ];
  const chosen = EX.chosen.map(i => EX.kept[i]);
  return (
    <Frame
      id="figura-coletivos"
      title={pt ? `Os residentes do lar entram depois, como registos parciais` : 'The care home’s residents join afterwards, as partial records'}
      lede={pt
        ? `O INE conta ${people(CARE_HOME.length, pt)} no lar desta freguesia de exemplo. Juntam-se aos ${households(TARGET_HOUSEHOLDS, pt)} escolhidos num alojamento coletivo, e não passam pelo ajuste.`
        : `INE counts ${CARE_HOME.length} people in this example parish’s care home. They join the ${TARGET_HOUSEHOLDS} chosen households in one collective dwelling, and do not go through the fit.`}
      note={exampleNote(locale)}
    >
      <div className="flex flex-wrap items-end gap-x-1.5 gap-y-4">
        <ul aria-label={pt ? 'Os agregados escolhidos' : 'The chosen households'} className="m-0 flex list-none flex-wrap gap-x-1.5 gap-y-4 pl-0">
          {chosen.map((ages, i) => <Home key={i} ages={ages} state="chosen" />)}
        </ul>
        <span aria-hidden="true" className="px-1 pb-6 text-[22px] leading-none text-ink">+</span>
        <ul aria-label={pt ? 'O lar' : 'The care home'} className="m-0 list-none pl-0">
          <li className="m-0 flex flex-col items-center gap-1">
            <HouseGlyph ages={CARE_HOME.map(p => p.age)} kind="collective" state="chosen" />
            <span className="text-[11px] leading-[14px] tabular-nums text-ink">{CARE_HOME.map(p => p.age).join(' · ')}</span>
            <span className="text-[11px] font-semibold leading-[14px] text-ink">{pt ? 'lar' : 'care home'}</span>
          </li>
        </ul>
      </div>
      <dl className="mt-6 grid gap-2 border-t border-grid pt-3 text-[13px]">
        {fields.map(([field, how, mark]) => (
          <div key={field} className="grid grid-cols-[1rem_minmax(0,1fr)] items-baseline gap-x-2 sm:grid-cols-[1rem_minmax(0,13rem)_minmax(0,1fr)]">
            <span aria-hidden="true" className={`${mark} translate-y-[2px]`} />
            <dt className="font-semibold text-ink">{field}</dt>
            <dd className="col-start-2 m-0 text-ink sm:col-start-auto">{how}</dd>
          </div>
        ))}
      </dl>
    </Frame>
  );
}

/* ------------------------------------------------------------------ step 5 */

const SHOWN_COLUMNS: Array<['persons' | 'households', string]> = [
  ['persons', 'freguesia'], ['persons', 'sex'], ['persons', 'age'], ['persons', 'age_5y'],
  ['persons', 'education_level_code'], ['persons', 'employment_status_code'], ['households', 'hh_size'], ['persons', 'is_institutional'],
];

const PROVENANCE_WORD: Record<string, Record<Locale, string>> = {
  G: { pt: 'gerada', en: 'generated' },
  D: { pt: 'derivada', en: 'derived' },
  C: { pt: 'tornada coerente', en: 'made coherent' },
  X: { pt: 'do código geográfico', en: 'from the geographic code' },
  flag: { pt: 'indicador', en: 'flag' },
};

export function FigurePublish({ locale, release }: { locale: Locale; release: PopulationReleaseInfo }) {
  const pt = locale === 'pt';
  const columns = SHOWN_COLUMNS
    .map(([table, name]) => ({ table, name, provenance: release.column_dictionary[table]?.[name]?.provenance }))
    .filter((c): c is { table: 'persons' | 'households'; name: string; provenance: string } => typeof c.provenance === 'string');
  const residents = TARGET_PEOPLE + CARE_HOME.length;
  const floor = formatCount(tierThresholds(release)?.B.min_population ?? 500, locale);
  return (
    <Frame
      id="figura-publicar"
      title={pt ? 'Cada coluna diz de onde vem, e cada freguesia o seu nível' : 'Every column says where it comes from, and every parish its tier'}
      lede={pt
        ? 'Algumas das colunas dos ficheiros de pessoas e de agregados, com a origem que o dicionário de colunas lhes dá; o que é interno ao modelo fica de fora.'
        : 'Some of the person and household files’ columns, with the origin the column dictionary gives them; what is internal to the model is left out.'}
      note={pt
        ? 'Colunas e origens tiradas do dicionário desta versão; a freguesia de exemplo é inventada.'
        : 'Columns and origins taken from this release’s dictionary; the example parish is invented.'}
    >
      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">{pt ? 'Colunas publicadas e a sua origem' : 'Published columns and their origin'}</caption>
        <thead>
          <tr className="border-b border-ink">
            <th scope="col" className="py-1 pr-3 text-left text-[12px] font-semibold text-graphite">{pt ? 'Coluna (ficheiro)' : 'Column (file)'}</th>
            <th scope="col" className="py-1 text-left text-[12px] font-semibold text-graphite">{pt ? 'Origem' : 'Origin'}</th>
          </tr>
        </thead>
        <tbody>
          {columns.map(c => (
            <tr key={`${c.table}.${c.name}`} className="border-b border-grid align-baseline">
              <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                <code className="break-all text-[12.5px] text-ink">{c.name}</code>{' '}
                <span className="text-[12px] text-graphite">({c.table === 'persons' ? (pt ? 'pessoas' : 'persons') : (pt ? 'agregados' : 'households')})</span>
              </th>
              <td className="py-1.5 text-ink">
                <b className="mr-1.5 font-semibold tabular-nums">{c.provenance}</b>
                <span className="text-graphite">{c.provenance.split('/').map(p => PROVENANCE_WORD[p]?.[locale] ?? p).join(pt ? ', depois ' : ', then ')}</span>
              </td>
            </tr>
          ))}
          <tr className="border-b border-grid align-baseline">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-graphite line-through">{pt ? 'ligações aos registos da amostra' : 'links to the sample’s records'}</th>
            <td className="py-1.5 text-ink">{pt ? 'retiradas' : 'removed'}</td>
          </tr>
          <tr className="align-baseline">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-graphite line-through">{pt ? 'ligações entre cônjuges' : 'links between spouses'}</th>
            <td className="py-1.5 text-ink">{pt ? 'não incluídas' : 'not included'}</td>
          </tr>
        </tbody>
      </table>
      <p className="mb-0 mt-5 border-l-2 border-ink pl-3 text-[14px] text-ink">
        {pt
          ? <>A freguesia de exemplo tem {people(residents, pt)}: fica no <b className="font-semibold">nível C</b>, como todas as que têm menos de {floor} residentes.</>
          : <>The example parish has {residents} people: it is <b className="font-semibold">tier C</b>, like every parish under {floor} residents.</>}
      </p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ tiers */

export function tierThresholds(release: PopulationReleaseInfo): TierThresholds | null {
  const t = (release.quality_tier_policy as { thresholds?: TierThresholds }).thresholds;
  return t?.A && t?.B ? t : null;
}

/** The tier rule as the grid it is: residents across, typical error down, a tier in each cell; the worst-table limits under it. */
export function TierGrid({ locale, release, counts }: { locale: Locale; release: PopulationReleaseInfo; counts: Record<'A' | 'B' | 'C', number> }) {
  const pt = locale === 'pt';
  const t = tierThresholds(release);
  if (!t) return null;
  const fit = (v: number) => v.toFixed(2).replace('.', pt ? ',' : '.');
  const n = (v: number) => formatCount(v, locale);
  const cols = [
    pt ? `Menos de ${n(t.B.min_population)}` : `Under ${n(t.B.min_population)}`,
    `${n(t.B.min_population)}–${n(t.A.min_population - 1)}`,
    pt ? `${n(t.A.min_population)} ou mais` : `${n(t.A.min_population)} or more`,
  ];
  const grid = tierGrid(t);
  const rows: Array<[string, Array<'A' | 'B' | 'C'>]> = [
    [pt ? `Até ${fit(t.A.max_person_srmse_median)}` : `Up to ${fit(t.A.max_person_srmse_median)}`, grid[0]],
    [pt ? `${fit(t.A.max_person_srmse_median)} a ${fit(t.B.max_person_srmse_median)}` : `${fit(t.A.max_person_srmse_median)} to ${fit(t.B.max_person_srmse_median)}`, grid[1]],
    [pt ? `Acima de ${fit(t.B.max_person_srmse_median)}` : `Above ${fit(t.B.max_person_srmse_median)}`, grid[2]],
  ];
  // Ink density, as the map draws the tiers: A plain, B hatched, C cross-hatched.
  const hatch: Record<'A' | 'B' | 'C', string> = {
    A: '',
    B: 'bg-[repeating-linear-gradient(45deg,var(--color-scale)_0_1px,transparent_1px_6px)]',
    C: 'bg-[repeating-linear-gradient(45deg,var(--color-scale)_0_1px,transparent_1px_6px),repeating-linear-gradient(-45deg,var(--color-scale)_0_1px,transparent_1px_6px)]',
  };
  return (
    <figure className="not-prose my-8 border-t border-ink pt-3 font-sans">
      <figcaption className="mb-4">
        <span className="block text-[17px] font-semibold leading-6 text-ink">{pt ? 'O nível sai de duas medidas: residentes e erro típico' : 'The tier comes from two measures: residents and typical error'}</span>
        <span className="mt-1 block max-w-[68ch] text-[14px] leading-5 text-graphite">
          {pt
            ? `Quanto mais tinta, mais cuidado na leitura, como no mapa. Com menos de ${n(t.B.min_population)} residentes, o nível é sempre C, por melhor que seja o ajuste.`
            : `The more ink, the more care in reading, as on the map. Under ${n(t.B.min_population)} residents the tier is always C, however good the fit.`}
        </span>
      </figcaption>
      <div className="scroll-cue overflow-x-auto" tabIndex={0} role="region" aria-label={pt ? 'Regra dos níveis de qualidade' : 'Quality tier rule'}>
        <table className="w-full min-w-[19rem] table-fixed border-collapse text-[13px]">
          <caption className="sr-only">{pt ? 'Nível de qualidade por residentes e erro típico' : 'Quality tier by residents and typical error'}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[7.5rem] pb-1 text-left align-bottom text-[12px] font-semibold text-graphite">{pt ? 'Erro típico ↓ · residentes →' : 'Typical error ↓ · residents →'}</th>
              {cols.map(c => <th key={c} scope="col" className="pb-1 text-center align-bottom text-[12px] font-semibold tabular-nums text-graphite">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, tiers]) => (
              <tr key={label}>
                <th scope="row" className="border-t border-ink py-1 pr-2 text-left font-normal tabular-nums text-ink">{label}</th>
                {tiers.map((tier, i) => (
                  <td key={i} className={`h-14 border border-ink text-center ${hatch[tier]}`}>
                    <span className="inline-block bg-paper px-1.5 py-0.5 text-[15px] font-semibold text-ink">{tier}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-0 mt-3 max-w-[68ch] text-[13px] leading-[19px] text-ink">
        {pt
          ? `E a pior tabela não pode passar ${fit(t.A.max_worst_srmse)} no nível A, nem ${fit(t.B.max_worst_srmse)} no B; se passar, a freguesia desce de nível. Nesta versão: ${n(counts.A)} freguesias no nível A, ${n(counts.B)} no B e ${n(counts.C)} no C.`
          : `And the worst table may not pass ${fit(t.A.max_worst_srmse)} in tier A, nor ${fit(t.B.max_worst_srmse)} in B; if it does, the parish drops a tier. In this release: ${n(counts.A)} parishes in tier A, ${n(counts.B)} in B and ${n(counts.C)} in C.`}
      </p>
      <p className="mb-0 mt-2 text-[12.5px] text-graphite">
        {pt ? 'Limiares da política de níveis desta versão (release.json).' : 'Thresholds from this release’s tier policy (release.json).'}
      </p>
    </figure>
  );
}

