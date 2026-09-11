import { useLocale } from 'next-intl';
import { FURNITURE } from './theme';
import { ChartTable } from './ChartTable';

interface Segment {
  label: string;
  /** A share in [0, 1]. */
  value: number;
  display: string;
  color?: string;
}

/**
 * A three-outcome bar (home, draw, away; yes, undecided, no). Segments are
 * separated by 2px of surface; a label only sits inside a segment that has
 * room for it, and every value is repeated under the bar so nothing depends
 * on hovering or on colour. Neutral by default; pass the entities' own colours
 * when they have them.
 */
export function OutcomeBar({ segments, tableCaption, tableColumns, className = '' }: { segments: Segment[]; /** Renders the table twin when given. */ tableCaption?: string; tableColumns?: [string, string]; className?: string }) {
  const locale = useLocale();
  const palette = ['#434d48', '#c3c8bb', '#7f9284'];
  const columns = tableColumns ?? (locale === 'en' ? ['Outcome', 'Probability'] : ['Resultado', 'Probabilidade']);
  return (
    <div className={className}>
      <div className="flex h-7 gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={segments.map(s => `${s.label} ${s.display}`).join(', ')}>
        {segments.map((s, i) => (
          <div key={s.label} className="flex items-center justify-center overflow-hidden" style={{ width: `${s.value * 100}%`, backgroundColor: s.color ?? palette[i % palette.length] }}>
            {s.value >= 0.12 && <span className={`text-xs font-bold ${isLight(s.color ?? palette[i % palette.length]) ? 'text-ink' : 'text-paper'}`}>{s.display}</span>}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-stone-600">
        {segments.map((s, i) => (
          <span key={s.label} className={`flex items-center gap-1.5 ${i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''}`}>
            <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: s.color ?? palette[i % palette.length] }} aria-hidden="true" />
            {s.label} <strong className="text-ink">{s.display}</strong>
          </span>
        ))}
      </div>
      {tableCaption && <ChartTable caption={tableCaption} columns={columns} rows={segments.map(s => [s.label, s.display])} />}
    </div>
  );
}

function isLight(hex: string): boolean {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export { FURNITURE as _furniture };
