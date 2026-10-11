import type { ReactNode } from 'react';

/**
 * A chart and its table twin as two typographic tabs (CSS radios, no
 * script): "Gráfico | Tabela". The twin is a complete alternative, so the
 * table tab is a real table, not a summary.
 */
export function ChartTabs({ id, title, chart, table, locale, headingLevel = 3, note }: {
  /** Unique on the page: names the radio group. */
  id: string;
  title: ReactNode;
  chart: ReactNode;
  table: ReactNode;
  locale: string;
  headingLevel?: 2 | 3;
  /** A source sentence or caveat under both panes. */
  note?: ReactNode;
}) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const labels = locale === 'en' ? ['Chart', 'Table'] : ['Gráfico', 'Tabela'];
  return (
    <div className="tabs-twin">
      <input type="radio" name={id} id={`${id}-chart`} defaultChecked aria-label={labels[0]} />
      <input type="radio" name={id} id={`${id}-table`} aria-label={labels[1]} />
      <div className="tabs-twin-head mb-1.5 mt-5 flex flex-wrap items-end gap-3">
        <H className="mr-auto pb-2 text-[19px] leading-[22px]">{title}</H>
        <span className="flex gap-4">
          <label htmlFor={`${id}-chart`}>{labels[0]}</label>
          <label htmlFor={`${id}-table`}>{labels[1]}</label>
        </span>
      </div>
      <div className="tabs-twin-pane1">{chart}</div>
      <div className="tabs-twin-pane2">{table}</div>
      {note && <p className="mt-2 max-w-[84ch] text-[12.5px] leading-[17px] text-graphite">{note}</p>}
    </div>
  );
}
