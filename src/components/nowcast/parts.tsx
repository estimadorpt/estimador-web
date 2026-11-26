import { partyColors } from '@/lib/config/colors';
import { IntervalBand, ProbBar, Ruler } from '@/components/instrument';
import { partyName } from '@/lib/nowcast-copy';
import { formatElectionNumber } from '@/lib/election-display';
import { formatSignedNumber } from '@/lib/typography';

const colour = (p: string) => partyColors[p as keyof typeof partyColors] ?? '#5e5e5e';

export function Swatch({ party }: { party: string }) {
  return <i aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: colour(party) }} />;
}

export interface SeatRowData { party: string; seats: number; lo: number; hi: number; before: number | null; vote: number }

const SEAT_SCALE = { min: 0, max: 120 };

/**
 * Every party's seats with their 90% margin, the 2025 seats (black square), the majority
 * line and the change since 2025, then its vote share. The band is drawn for parties with
 * 20 seats or more; on a 0–120 ruler a smaller one collapses into the no-margin glyph.
 */
export function SeatTable({ rows, locale, sinceYear }: { rows: readonly SeatRowData[]; locale: string; sinceYear: string }) {
  const pt = locale !== 'en';
  const dec = (v: number) => formatElectionNumber(v, locale, 1);
  return (
    <table className="w-full table-fixed border-collapse text-[14px]">
      <caption className="sr-only">
        {pt
          ? `Deputados estimados por partido, com a margem de 90% e a variação desde ${sinceYear}, e a percentagem de votos entre os oito maiores partidos.`
          : `Estimated seats by party, with the 90% margin and the change since ${sinceYear}, and the vote share among the eight largest parties.`}
      </caption>
      <colgroup>
        <col className="w-[4.6rem]" /><col className="w-[2.6rem]" /><col /><col className="w-[3rem]" /><col className="w-[3.4rem]" />
      </colgroup>
      <thead>
        <tr className="border-b border-ink align-bottom text-[12px] leading-[14px] text-graphite">
          <th scope="col" className="pb-1 text-left font-normal"><span className="sr-only">{pt ? 'Partido' : 'Party'}</span></th>
          <th scope="col" className="relative pb-1 font-normal"><span className="absolute bottom-1 right-0 whitespace-nowrap">{pt ? 'Deputados' : 'Seats'}</span></th>
          <th scope="col" className="pb-1 pl-2 font-normal"><span className="sr-only">{pt ? 'Margem de 90%' : '90% margin'}</span><span aria-hidden="true"><Ruler {...SEAT_SCALE} minor={10} major={20} labels={[0, 40, 80, 120]} /></span></th>
          <th scope="col" className="pb-1 text-right font-normal">{pt ? `Desde ${sinceYear}` : `Since ${sinceYear}`}</th>
          <th scope="col" className="pb-1 text-right font-normal">{pt ? 'Votos' : 'Votes'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const big = r.seats >= 20;
          const change = r.before == null ? null : r.seats - r.before;
          return (
            <tr key={r.party} className="border-b border-grid">
              <th scope="row" className={`text-left font-semibold text-ink ${big ? 'py-2' : 'py-1'}`}>
                <span className="inline-flex items-center gap-1.5 text-[15px]"><Swatch party={r.party} />{partyName(r.party)}</span>
              </th>
              <td className={`text-right font-display font-extrabold leading-none tabular-nums text-ink ${big ? 'text-[26px]' : 'text-[17px]'}`}>{r.seats}</td>
              <td className="pl-2">
                {big && <IntervalBand lo={r.lo} md={r.seats} hi={r.hi} now={r.before} reference={116} {...SEAT_SCALE} label={pt ? `${partyName(r.party)}: ${r.seats} deputados, entre ${r.lo} e ${r.hi}` : `${partyName(r.party)}: ${r.seats} seats, between ${r.lo} and ${r.hi}`} />}
                <span className="block text-[12px] leading-4 tabular-nums text-graphite">{pt ? `entre ${r.lo} e ${r.hi}` : `${r.lo} to ${r.hi}`}</span>
              </td>
              <td className="text-right tabular-nums text-ink">{change == null ? '—' : change === 0 ? '=' : formatSignedNumber(change, locale, 0)}</td>
              <td className="text-right tabular-nums text-ink">{dec(r.vote)}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** The key under the seat table, one line. */
export function SeatKey({ locale }: { locale: string }) {
  const pt = locale !== 'en';
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-graphite">
      <span className="inline-flex items-center gap-1.5"><span className="inline-block w-7"><IntervalBand lo={2} md={5} hi={8} min={0} max={10} className="!min-w-0" /></span>{pt ? 'margem de erro (90%)' : 'margin of error (90%)'}</span>
      <span className="inline-flex items-center gap-1.5"><i aria-hidden="true" className="inline-block h-2 w-2 bg-ink" />2025</span>
      <span className="inline-flex items-center gap-1.5"><i aria-hidden="true" className="inline-block h-3 border-l border-dashed border-ink" />{pt ? 'maioria, 116' : 'majority, 116'}</span>
    </p>
  );
}

/** A group of parties and its seats against 116: "maioria" or "faltam 30". */
export function SumRow({ parties, label, total, locale }: { parties: readonly string[]; label: string; total: number; locale: string }) {
  const pt = locale !== 'en';
  const ok = total >= 116;
  return (
    <tr className="border-b border-grid">
      <th scope="row" className="py-2.5 text-left font-normal">
        <span className="flex flex-wrap items-center gap-x-1.5 text-[15px] text-ink">{parties.map(p => <Swatch key={p} party={p} />)}<span className="ml-0.5">{label}</span></span>
      </th>
      <td className="py-2.5 text-right font-display text-[22px] font-extrabold tabular-nums text-ink">{total}</td>
      <td className={`w-[6.5rem] py-2.5 pl-3 text-[14px] ${ok ? 'font-semibold text-ink' : 'text-graphite'}`}>{ok ? (pt ? 'maioria' : 'majority') : (pt ? `faltam ${116 - total}` : `${116 - total} short`)}</td>
    </tr>
  );
}

/** One probability with an ink bar on a 0–100 ruler. */
export function ProbRow({ label, parties, p, locale }: { label: string; parties?: readonly string[]; p: number; locale: string }) {
  const pt = locale !== 'en';
  const text = p < 0.01 ? (pt ? 'menos de 1%' : 'under 1%') : p > 0.99 ? (pt ? 'mais de 99%' : 'over 99%') : `${Math.round(p * 100)}%`;
  return (
    <tr className="border-b border-grid">
      <th scope="row" className="py-2 text-left font-normal">
        <span className="flex items-center gap-x-1.5 text-[14.5px] text-ink">{parties?.map(x => <Swatch key={x} party={x} />)}<span>{label}</span></span>
      </th>
      <td className={`whitespace-nowrap py-2 pl-2 text-right font-display font-extrabold tabular-nums text-ink ${text.length > 4 ? 'text-[14px]' : 'text-[17px]'}`}>{text}</td>
      <td className="w-[110px] py-2 pl-3"><ProbBar p={Math.min(1, Math.max(0, p))} width={104} /></td>
    </tr>
  );
}

/** The source line under every block: the model, the polls and their dates, the method and the data. */
export function NowcastSource({ polls, from, to, note, locale }: { polls: number; from: string; to: string; note?: string; locale: string }) {
  const pt = locale !== 'en';
  const base = locale === 'en' ? '/en' : '/pt';
  return (
    <p className="mt-4 text-[12.5px] leading-[19px] text-graphite">
      {pt
        ? `Fonte: modelo estimador.pt, com as ${polls} sondagens publicadas entre ${from} e ${to}.`
        : `Source: estimador.pt model, with the ${polls} polls published from ${from} to ${to}.`}
      {note ? ` ${note}` : ''}{' '}
      <a href={`${base}/eleicoes/proximas-legislativas/#metodo`} className="text-ink underline underline-offset-2">{pt ? 'Como fazemos' : 'How we do it'}</a>
      {' · '}
      <a href="/data/elections/legislative-nowcast/nowcast.json" className="text-ink underline underline-offset-2">{pt ? 'Descarregar os dados (JSON)' : 'Download the data (JSON)'}</a>
    </p>
  );
}
