import type { ReactNode } from 'react';
import { ChannelHead } from '@/components/instrument';
import { contrastRatio } from '@/lib/config/football';

/**
 * Pieces of the design-system page (/marca) and nothing else. The page shows
 * the site's own components; these only frame them.
 */

/** Copy for the guide's lists: Portuguese first, English second. */
export type Copy = readonly [pt: string, en: string];
export const tr = (pt: boolean, [ptText, enText]: Copy) => (pt ? ptText : enText);

/** One chapter of the guide: an instrument head with its number, a lede, the content. */
export function Chapter({ id, n, title, lede, children }: { id: string; n: number; title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-16 first:mt-10 md:mt-24">
      <ChannelHead id={id} title={title} serial={`§${n}`} />
      {lede && <p className="mt-4 max-w-[68ch] text-[16px] leading-[25px]">{lede}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** A sub-heading inside a chapter. */
export function Part({ title, note, children, flush = false, className = '' }: { title: string; note?: ReactNode; children: ReactNode; flush?: boolean; className?: string }) {
  return (
    <div className={`${flush ? '' : 'mt-10 first:mt-0'} ${className}`}>
      <h3 className="text-[19px] leading-6">{title}</h3>
      {note && <p className="mt-1.5 max-w-[68ch] text-[14px] leading-[21px] text-graphite">{note}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** "Exemplo": every specimen with figures says its figures are illustrative. */
export function ExampleTag({ pt }: { pt: boolean }) {
  return <span className="text-[12px] text-graphite">{pt ? 'Exemplo, valores ilustrativos' : 'Example, illustrative values'}</span>;
}

/** A specimen: the live component on the page's ground, with what it is and how it is called. */
export function Specimen({ name, code, note, children, example }: { name: string; code?: string; note?: ReactNode; children: ReactNode; example?: ReactNode }) {
  return (
    <figure className="min-w-0 border-t border-rule pt-3">
      <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[14px] font-semibold">{name}</span>
        {code && <code className="font-mono text-[12px] text-graphite">{code}</code>}
        {example && <span className="ml-auto">{example}</span>}
      </figcaption>
      <div className="mt-4 min-w-0">{children}</div>
      {note && <p className="mt-3 max-w-[68ch] text-[13px] leading-[19px] text-graphite">{note}</p>}
    </figure>
  );
}

const fmtRatio = (r: number, pt: boolean) => `${r.toFixed(1).replace('.', pt ? ',' : '.')}:1`;

/**
 * A colour as a token: a square of it, its name, the Tailwind token and hex,
 * its contrast on white (computed, not typed), and what it is for.
 */
export function Swatch({ name, token, hex, use, pt, textual = false }: { name: string; token: string; hex: string; use: string; pt: boolean; textual?: boolean }) {
  const ratio = contrastRatio(hex, '#ffffff');
  const passes = textual ? ratio >= 4.5 : ratio >= 3;
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-3 border-b border-grid py-3">
      <span className="block size-14 border border-rule" style={{ backgroundColor: hex }} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[14px] font-semibold">{name}</p>
        <p className="font-mono text-[12px] text-graphite">{token} · {hex}</p>
        <p className="mt-1 text-[13px] leading-[18px]">{use}</p>
        <p className="mt-0.5 text-[12px] text-graphite tnum">
          {pt ? 'Contraste sobre branco' : 'Contrast on white'} {fmtRatio(ratio, pt)}
          {textual ? (passes ? (pt ? ' · lê-se como texto (AA)' : ' · reads as text (AA)') : (pt ? ' · nunca como texto' : ' · never as text')) : ''}
        </p>
      </div>
    </div>
  );
}

/** A rule shown as a pair: what we write, and what we do not. */
export function DoDont({ pt, rows }: { pt: boolean; rows: ReadonlyArray<readonly [doThis: ReactNode, notThis: ReactNode, why?: ReactNode]> }) {
  return (
    <div tabIndex={0} role="region" aria-label={pt ? 'Sim e não' : 'Do and don’t'} className="scroll-cue overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-ink text-left text-[12.5px] text-graphite">
            <th scope="col" className="w-[42%] pb-1.5 pr-4 font-medium">{pt ? 'Sim' : 'Do'}</th>
            <th scope="col" className="w-[33%] pb-1.5 pr-4 font-medium">{pt ? 'Não' : 'Don’t'}</th>
            <th scope="col" className="pb-1.5 font-medium">{pt ? 'Porquê' : 'Why'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([yes, no, why], i) => (
            <tr key={i} className="border-b border-grid align-top">
              <td className="py-2.5 pr-4 font-semibold">{yes}</td>
              <td className="py-2.5 pr-4 text-graphite line-through decoration-graphite/60">{no}</td>
              <td className="py-2.5 text-[13px] leading-[19px] text-graphite">{why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A plain ruled list of rules, each a short statement. */
export function Rules({ items }: { items: ReadonlyArray<ReactNode> }) {
  return (
    <ul className="max-w-[72ch] border-t border-ink">
      {items.map((item, i) => (
        <li key={i} className="border-b border-grid py-2.5 text-[14.5px] leading-[21px]">{item}</li>
      ))}
    </ul>
  );
}

/**
 * The mark's construction, drawn from the same geometry as the logo, on its
 * 48×24 unit grid with the dimensions that make it: the caps, the whiskers,
 * the band and the median slot left of centre.
 */
export function MarkConstruction({ pt, left, band, right }: { pt: boolean; left: string; band: string; right: string }) {
  const s = 10; // px per unit
  const w = 48 * s, h = 24 * s;
  const gridLines = [];
  for (let x = 0; x <= 48; x += 1) gridLines.push(<line key={`x${x}`} x1={x * s} y1={0} x2={x * s} y2={h} stroke="var(--color-grid)" strokeWidth={x % 12 === 0 ? 1.5 : 0.75} />);
  for (let y = 0; y <= 24; y += 1) gridLines.push(<line key={`y${y}`} x1={0} y1={y * s} x2={w} y2={y * s} stroke="var(--color-grid)" strokeWidth={y % 12 === 0 ? 1.5 : 0.75} />);
  const dim = (x1: number, x2: number, y: number, text: string) => (
    <g>
      <line x1={x1 * s} y1={y} x2={x2 * s} y2={y} stroke="var(--color-graphite)" strokeWidth="1" />
      <line x1={x1 * s} y1={y - 5} x2={x1 * s} y2={y + 5} stroke="var(--color-graphite)" strokeWidth="1" />
      <line x1={x2 * s} y1={y - 5} x2={x2 * s} y2={y + 5} stroke="var(--color-graphite)" strokeWidth="1" />
      <text x={((x1 + x2) / 2) * s} y={y - 8} textAnchor="middle" fontSize="13" fill="var(--color-graphite)">{text}</text>
    </g>
  );
  return (
    <div tabIndex={0} role="region" aria-label={pt ? 'Construção do símbolo' : 'Construction of the mark'} className="scroll-cue overflow-x-auto">
      <svg viewBox={`-20 -56 ${w + 40} ${h + 136}`} className="h-auto w-full min-w-[480px] max-w-[640px]" role="img" aria-label={pt ? 'O símbolo numa grelha de 48 por 24 unidades: tampas de 2 por 10, bigodes de 9 por 2, banda de 22 por 12 com a ranhura da mediana de 2 por 8 a começar na unidade 21.' : 'The mark on a 48 by 24 unit grid: caps 2 by 10, whiskers 9 by 2, a 22 by 12 band with a 2 by 8 median slot starting at unit 21.'}>
        {gridLines}
        <g transform={`scale(${s})`} fill="var(--color-ink)">
          <path d={left} />
          <path d={band} />
          <path d={right} />
        </g>
        {dim(0, 2, -14, '2')}
        {dim(4, 13, -14, '9')}
        {dim(13, 35, -34, '22')}
        {dim(21, 23, h + 32, pt ? 'mediana 21–23' : 'median 21–23')}
        {dim(0, 48, h + 70, '48')}
      </svg>
    </div>
  );
}
