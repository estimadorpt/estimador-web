import { loadBuildOnlyJson } from '@/lib/utils/data-loader';
import { partyColors } from '@/lib/config/colors';
import { BRAND } from '@/lib/brand';
import { NowGlyph, BandGlyph } from '@/components/instrument/glyphs';
import { Disclosure } from '@/components/viz/Disclosure';
import { FlowRows, type FlowRow } from './FlowRows';
import { OriginBars } from './OriginBars';
import { ParishHistogram } from './ParishHistogram';

/**
 * The data-bound charts of the note "how the vote moved" (2015–2025). Every
 * figure is read at build time from data/build-only/elections/vote-moves/
 * vote_moves.json (written by the vote-moves analysis, build_article_data.py,
 * from estimador-elections' src/analysis/vote_transitions.py outputs),
 * never typed into the MDX. The file is build-only so the EEP-derived figures
 * are never served before the piece is published.
 */

type Locale = 'pt' | 'en';
type Pair = '2019-2022' | '2022-2024' | '2024-2025';

interface FlowCell { from: string; to: string; central: number; lo: number | null; hi: number | null; others: Record<string, number> }
interface VoteMovesData {
  as_of: string;
  years: number[];
  blocs: { key: string; values: (number | null)[] }[];
  counts: Record<string, number>;
  chega_rise: { parishes: number; rose: number; mean: number; p05: number; p95: number; common_share: number; ch_won_2025: number; ch_won_ps_2022: number; bins: { lo: number; hi: number; count: number }[] };
  origins: { year: number; pair: Pair; source: string; segments: { key: string; central: number; lo: number; hi: number }[] }[];
  combined_ps_ad_to_ch_thousands: Record<Pair, { central: number; lo: number; hi: number }>;
  flows: Record<Pair, FlowCell[]>;
  age: { group: string; exit_CH: number; exit_PS: number; exit_AD: number; eep_CH: number | number[]; eep_PS: number | number[] }[];
  education: { group: string; exit_CH: number; exit_PS: number; exit_AD: number; eep_CH: number; eep_PS: number }[];
}

const load = () => loadBuildOnlyJson<VoteMovesData>('vote_moves.json', 'elections/vote-moves');
const L = (locale: string): Locale => (locale === 'en' ? 'en' : 'pt');
const nf = (locale: Locale, digits = 0) => new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });

const BLOC = {
  CH: { pt: 'Chega', en: 'Chega', color: partyColors.CH },
  PSD_CDS: { pt: 'PSD/CDS (AD)', en: 'PSD/CDS (AD)', color: partyColors.AD },
  IL: { pt: 'IL', en: 'IL', color: partyColors.IL },
  PS: { pt: 'PS', en: 'PS', color: partyColors.PS },
  LEFT: { pt: 'BE, CDU e Livre', en: 'BE, CDU and Livre', color: partyColors.CDU },
  ABST: { pt: 'Abstenção', en: 'Abstention', color: BRAND.muted },
  REST: { pt: 'Outros e novos eleitores', en: 'Others and new voters', color: '#e2e2e2' },
} as const;
type BlocKey = keyof typeof BLOC;
const blocName = (k: string, locale: Locale) => BLOC[k as BlocKey]?.[locale] ?? k;

const th = 'border-b border-ink px-3 py-2 text-[12px] font-semibold text-graphite';
const td = 'border-b border-grid px-3 py-2';

/** Each bloc and abstention as a share of the roll at the five elections: counted, so ink squares joined by the bloc's line. */
export async function VoteMovesBlocs({ locale: loc }: { locale: string }) {
  const locale = L(loc), d = await load(), f = nf(locale, 1);
  const title = locale === 'pt' ? 'Votos de cada bloco e abstenção, em % dos inscritos, 2015 a 2025' : 'Each bloc’s vote and abstention, % of registered voters, 2015 to 2025';
  // Drawn twice: a wide frame from 640px and a narrow one for phones, each at
  // about its rendered width, so no label falls below 12px.
  const chart = (W: number, H: number, right: number, className: string) => {
    const left = 30, top = 12, bottom = 28, max = 50;
    const x = (i: number) => left + (i * (W - left - right)) / (d.years.length - 1);
    const y = (v: number) => top + (1 - v / max) * (H - top - bottom);
    // End labels, pushed apart so none overlap.
    const ends = d.blocs.map(b => ({ key: b.key, v: b.values[b.values.length - 1] ?? 0 })).sort((a, b) => b.v - a.v);
    const labelY: Record<string, number> = {};
    let last = -Infinity;
    for (const e of ends) { const yy = Math.max(y(e.v) + 4, last + 14); labelY[e.key] = yy; last = yy; }
    const short = W < 480;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={`h-auto w-full ${className}`} role="img" aria-label={title}>
        {[0, 10, 20, 30, 40, 50].map(v => (
          <g key={v}>
            <line x1={left} x2={W - right + 6} y1={y(v)} y2={y(v)} stroke={BRAND.grid} />
            <text x={left - 6} y={y(v) + 4} textAnchor="end" fontSize="12" fill={BRAND.muted}>{v}</text>
          </g>
        ))}
        {d.years.map((yr, i) => <text key={yr} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill={BRAND.muted}>{short ? `’${String(yr).slice(2)}` : yr}</text>)}
        {d.blocs.map(b => {
          const pts = b.values.map((v, i) => (v == null ? null : [x(i), y(v)] as const)).filter(Boolean) as [number, number][];
          const color = BLOC[b.key as BlocKey]?.color ?? BRAND.ink;
          const name = short && b.key === 'LEFT' ? (locale === 'pt' ? 'BE+CDU+L' : 'BE+CDU+L') : short && b.key === 'PSD_CDS' ? 'AD' : blocName(b.key, locale);
          return (
            <g key={b.key}>
              <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={2} />
              {pts.map(([px, py], i) => <rect key={i} x={px - 3.5} y={py - 3.5} width={7} height={7} fill={BRAND.ink} />)}
              <text x={W - right + 12} y={labelY[b.key]} fontSize="12" fill={BRAND.ink}>{name} {f.format(b.values[b.values.length - 1] ?? 0)}</text>
            </g>
          );
        })}
      </svg>
    );
  };
  return (
    <div className="font-sans text-sm">
      {chart(640, 300, 150, 'hidden sm:block')}
      {chart(360, 300, 104, 'sm:hidden')}
      <p className="mt-2 flex items-center gap-2 text-[12px] text-graphite"><NowGlyph />{locale === 'pt' ? 'Contado: resultados oficiais, não uma estimativa.' : 'Counted: official results, not an estimate.'}</p>
      <Disclosure summary={locale === 'pt' ? 'Ver como tabela' : 'Show as a table'} srSuffix={title} className="mt-2">
        <div tabIndex={0} role="region" aria-label={title} className="scroll-cue overflow-x-auto">
          <table className="min-w-full border-collapse tabular-nums">
            <thead><tr>
              <th scope="col" className={`${th} text-left`}>{locale === 'pt' ? '% dos inscritos' : '% of registered'}</th>
              {d.years.map(yr => <th key={yr} scope="col" className={`${th} text-right`}>{yr}</th>)}
            </tr></thead>
            <tbody>
              {d.blocs.map(b => (
                <tr key={b.key}>
                  <th scope="row" className={`${td} text-left font-normal text-ink`}>{blocName(b.key, locale)}</th>
                  {b.values.map((v, i) => <td key={i} className={`${td} text-right text-ink`}>{v == null ? '—' : f.format(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>
    </div>
  );
}

/** Chega's change in every parish, 2019 to 2025, in points of the roll. */
export async function VoteMovesParishes({ locale: loc }: { locale: string }) {
  const locale = L(loc), d = await load();
  return (
    <ParishHistogram
      bins={d.chega_rise.bins}
      mean={d.chega_rise.mean}
      locale={locale}
      title={locale === 'pt' ? 'Freguesias pela subida do Chega entre 2019 e 2025' : 'Parishes by Chega’s rise between 2019 and 2025'}
      axis={locale === 'pt' ? 'Subida do Chega entre 2019 e 2025, pontos percentuais dos inscritos (tracejado: a média do país)' : 'Chega’s rise between 2019 and 2025, percentage points of registered voters (dashed: the national average)'}
    />
  );
}

/** Where Chega's vote came from, at each election: central estimate, with the range across methods in the table twin. */
export async function VoteMovesOrigins({ locale: loc }: { locale: string }) {
  const locale = L(loc), d = await load();
  return (
    <OriginBars
      locale={locale}
      title={locale === 'pt' ? 'De onde vieram os votos do Chega, em % dos seus votos' : 'Where Chega’s votes came from, % of its vote'}
      bars={d.origins.map(o => ({
        label: String(o.year),
        segments: o.segments.map(s => ({
          key: s.key,
          label: s.key === 'CH' ? (locale === 'pt' ? `Já votava Chega` : `Already voted Chega`) : s.key === 'ABST' ? (locale === 'pt' ? 'Não tinha votado' : 'Had not voted') : blocName(s.key, locale),
          value: s.central, lo: s.lo, hi: s.hi,
          color: BLOC[s.key as BlocKey]?.color ?? BRAND.ink,
        })),
      }))}
    />
  );
}

const FLOW_LABEL: Record<string, { pt: string; en: string }> = {
  'ABST>CH': { pt: 'Abstencionistas que votaram Chega', en: 'Abstainers who voted Chega' },
  'PSD_CDS>CH': { pt: 'Eleitores do PSD/CDS que votaram Chega', en: 'PSD/CDS voters who voted Chega' },
  'PS>CH': { pt: 'Eleitores do PS que votaram Chega', en: 'PS voters who voted Chega' },
  'PS>PSD_CDS': { pt: 'Eleitores do PS que votaram PSD/CDS', en: 'PS voters who voted PSD/CDS' },
  'CH>ABST': { pt: 'Eleitores do Chega que se abstiveram', en: 'Chega voters who abstained' },
  'PS>ABST': { pt: 'Eleitores do PS que se abstiveram', en: 'PS voters who abstained' },
  'PSD_CDS>ABST': { pt: 'Eleitores do PSD/CDS que se abstiveram', en: 'PSD/CDS voters who abstained' },
  'CH>CH': { pt: 'Eleitores do Chega que voltaram a votar Chega', en: 'Chega voters who voted Chega again' },
};

function flowRows(cells: FlowCell[], keys: string[], locale: Locale): FlowRow[] {
  return keys.map(k => {
    const c = cells.find(x => `${x.from}>${x.to}` === k)!;
    return { label: FLOW_LABEL[k][locale], central: c.central, lo: c.lo ?? undefined, hi: c.hi ?? undefined, others: Object.values(c.others) };
  });
}

function FlowKey({ locale }: { locale: Locale }) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-graphite">
      <span className="flex items-center gap-2"><BandGlyph />{locale === 'pt' ? 'estimativa central e a sua margem de 90% (amostra do inquérito)' : 'central estimate and its 90% margin (the survey’s sample)'}</span>
      <span className="flex items-center gap-2"><span aria-hidden className="inline-block h-4 w-px bg-graphite" />{locale === 'pt' ? 'outro método, sem margem' : 'another method, no margin'}</span>
    </p>
  );
}

/** One pair's main flows: central estimate with its 90% band, other methods as ticks. */
export async function VoteMovesFlows({ locale: loc, pair }: { locale: string; pair: Pair }) {
  const locale = L(loc), d = await load();
  const [a, b] = pair.split('-');
  const keys = ['ABST>CH', 'PSD_CDS>CH', 'PS>CH', 'PS>PSD_CDS', 'CH>ABST', 'PS>ABST', 'PSD_CDS>ABST'];
  const title = locale === 'pt' ? `Para onde foram os eleitores de ${a} em ${b}, em % de cada grupo` : `Where ${a}’s voters went in ${b}, % of each group`;
  return (<><FlowRows rows={flowRows(d.flows[pair], keys, locale)} max={20} locale={locale} title={title} /><FlowKey locale={locale} /></>);
}

/** Chega keeping its voters, 2022→24 and 2024→25, on a 0–100 scale. */
export async function VoteMovesRetention({ locale: loc }: { locale: string }) {
  const locale = L(loc), d = await load();
  const rows: FlowRow[] = (['2022-2024', '2024-2025'] as Pair[]).map(p => {
    const [r] = flowRows(d.flows[p], ['CH>CH'], locale);
    const [a, b] = p.split('-');
    return { ...r, label: locale === 'pt' ? `Eleitores do Chega de ${a} que votaram Chega em ${b}` : `Chega’s ${a} voters who voted Chega in ${b}` };
  });
  return (<><FlowRows rows={rows} max={100} locale={locale} title={locale === 'pt' ? 'Quantos eleitores o Chega manteve' : 'How many voters Chega kept'} /><FlowKey locale={locale} /></>);
}

/** Who votes Chega and PS by age and education: the exit poll of 2025 beside the EEP of 2024. */
export async function VoteMovesAge({ locale: loc }: { locale: string }) {
  const locale = L(loc), d = await load(), f = nf(locale);
  const cell = (v: number | number[]) => (Array.isArray(v) ? v.map(x => f.format(x)).join(locale === 'pt' ? ' e ' : ' and ') : f.format(v));
  const EDU: Record<string, { pt: string; en: string }> = {
    below_secondary: { pt: 'Abaixo do secundário', en: 'Below secondary' },
    secondary: { pt: 'Secundário', en: 'Secondary' },
    tertiary: { pt: 'Superior', en: 'Tertiary' },
  };
  const ageLabel = (g: string) => (g === '65+' ? (locale === 'pt' ? '65 e mais' : '65 and over') : g.replace('-', '–'));
  const title = locale === 'pt' ? 'Chega e PS por idade e escolaridade, em % dos votantes de cada grupo' : 'Chega and PS by age and education, % of each group’s voters';
  const rows = [
    ...d.age.map(r => ({ key: r.group, label: ageLabel(r.group), ...r })),
    ...d.education.map(r => ({ key: r.group, label: EDU[r.group][locale], ...r })),
  ];
  return (
    <div tabIndex={0} role="region" aria-label={title} className="scroll-cue overflow-x-auto font-sans text-sm">
      <table className="min-w-full border-collapse tabular-nums">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className={`${th} text-left`}>{locale === 'pt' ? 'Grupo' : 'Group'}</th>
            <th scope="colgroup" colSpan={2} className="px-3 pt-2 text-right text-[12px] font-semibold text-graphite">Chega</th>
            <th scope="colgroup" colSpan={2} className="px-3 pt-2 text-right text-[12px] font-semibold text-graphite">PS</th>
          </tr>
          <tr>
            {[0, 1].flatMap(i => [
              <th key={`x${i}`} scope="col" className={`${th} text-right`}>{locale === 'pt' ? 'Sondagem à boca das urnas, 2025' : 'Exit poll, 2025'}</th>,
              <th key={`e${i}`} scope="col" className={`${th} text-right`}>EEP, 2024</th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} className={i === d.age.length ? 'border-t-2 border-ink' : ''}>
              <th scope="row" className={`${td} text-left font-normal text-ink`}>{r.label}</th>
              <td className={`${td} text-right text-ink`}>{f.format(r.exit_CH)}</td>
              <td className={`${td} text-right text-graphite`}>{cell(r.eep_CH)}</td>
              <td className={`${td} text-right text-ink`}>{f.format(r.exit_PS)}</td>
              <td className={`${td} text-right text-graphite`}>{cell(r.eep_PS)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A figure from the file, for running text:
 *   <VoteMovesNumber locale="pt" path="counts.right_2019" scale="1e6" digits="2" />
 * Props are strings: the article page compiles MDX with next-mdx-remote, which
 * strips JavaScript expressions ({…}) from attributes.
 */
export async function VoteMovesNumber({ locale: loc, path, scale = '1', digits = '0' }: { locale: string; path: string; scale?: string; digits?: string }) {
  const locale = L(loc), d = await load();
  const v = path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], d);
  const s = Number(scale), n = Number(digits);
  if (typeof v !== 'number' || !Number.isFinite(s) || !Number.isInteger(n)) throw new Error(`VoteMovesNumber: no number at ${path} (scale ${scale}, digits ${digits})`);
  return <>{nf(locale, n).format(v / s)}</>;
}

export const VOTE_MOVES_CHARTS = {
  VoteMovesBlocs, VoteMovesParishes, VoteMovesOrigins, VoteMovesFlows, VoteMovesRetention, VoteMovesAge, VoteMovesNumber,
};
