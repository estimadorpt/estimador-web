import { IntervalBand, ReadingRule } from '@/components/instrument';
import { formatDecimal, formatInteger } from '@/lib/football-format';
import type { RecordRow, SeasonRecord as Record } from '@/lib/football-record';

/**
 * "O que dissemos e o que aconteceu": each count of the season's games whose
 * 1X2 was published before kickoff (home wins, draws, away wins; favourites
 * by how sure the model was), drawn as the model's own 90% range in yellow
 * with a black square where reality landed. A forecast that is right about
 * its uncertainty puts nine squares in ten inside their bands.
 */
export function SeasonRecord({ record, locale }: { record: Record; locale: string }) {
  const pt = locale !== 'en';
  if (record.games === 0) return null;
  const row = (r: RecordRow) => {
    const max = Math.max(r.q95, r.happened, 1);
    const scaleMax = Math.ceil((max + 1) / 5) * 5;
    const inside = r.happened >= r.q05 && r.happened <= r.q95;
    return (
      <tr key={r.key} className="border-b border-grid">
        <th scope="row" className="py-2 pr-3 text-left font-normal">
          <span className="block font-semibold">{r.label}</span>
          <span className="block text-[12.5px] text-graphite">{pt ? `${formatInteger(r.games, locale)} jogos` : `${formatInteger(r.games, locale)} games`}</span>
        </th>
        <td className="w-[38%] min-w-[140px] py-2 pr-3">
          <IntervalBand lo={r.q05} md={r.q50} hi={r.q95} min={0} max={scaleMax} now={r.happened} />
          <span className="mt-0.5 flex justify-between text-[11px] text-graphite" aria-hidden="true"><span>0</span><span>{scaleMax}</span></span>
        </td>
        <td className="whitespace-nowrap py-2 pr-3 text-right text-[13.5px] text-graphite">{pt ? 'esperado' : 'expected'} {formatDecimal(r.expected, locale, 1)}<span className="block">{pt ? 'margem' : 'range'} {r.q05}–{r.q95}</span></td>
        <td className="py-2 text-right">
          <span className="disp text-[23px] leading-6">{formatInteger(r.happened, locale)}</span>
          <span className="block text-[12px] text-graphite">{inside ? (pt ? 'dentro' : 'inside') : (pt ? 'fora' : 'outside')}</span>
        </td>
      </tr>
    );
  };
  const head = (
    <thead>
      <tr className="border-b border-ink text-left align-bottom text-[12.5px] text-graphite">
        <th scope="col" className="pb-1.5 pr-3 font-medium">{pt ? 'Contagem' : 'Count'}</th>
        <th scope="col" className="pb-1.5 pr-3 font-medium">{pt ? 'Margem do modelo (90%) e o que aconteceu' : 'The model’s range (90%) and what happened'}</th>
        <th scope="col" className="pb-1.5 pr-3 text-right font-medium">{pt ? 'O modelo' : 'The model'}</th>
        <th scope="col" className="pb-1.5 text-right font-medium">{pt ? 'Aconteceu' : 'Happened'}</th>
      </tr>
    </thead>
  );
  return (
    <div>
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
        <table className="w-full border-collapse text-[14px]">
          <caption className="mb-1.5 text-left text-[15px] font-semibold">{pt ? 'Resultados' : 'Results'}</caption>
          {head}
          <tbody>{record.outcomes.map(row)}</tbody>
        </table>
        <table className="w-full border-collapse text-[14px]">
          <caption className="mb-1.5 text-left text-[15px] font-semibold">{pt ? 'Vitórias do favorito, pela confiança do modelo' : 'Favourite wins, by how sure the model was'}</caption>
          {head}
          <tbody>{record.favourites.map(row)}</tbody>
        </table>
      </div>
      <p className="mt-3 text-[12.5px] leading-[17px] text-graphite">
        <ReadingRule locale={locale} variant="short" marks={['now', 'band']} />
      </p>
      <p className="mt-2 max-w-[84ch] text-[12.5px] leading-[17px] text-graphite">
        {pt
          ? `Os ${formatInteger(record.games, locale)} jogos desta época com probabilidades publicadas antes do início. A margem é a distribuição de cada contagem se as probabilidades publicadas estivessem certas, jogo a jogo (90% das vezes cai dentro dela); com poucos jogos, as margens são largas.`
          : `This season's ${formatInteger(record.games, locale)} games with probabilities published before kickoff. The range is each count's distribution if the published probabilities were right, game by game (it falls inside 90% of the time); with few games, the ranges are wide.`}
      </p>
    </div>
  );
}
