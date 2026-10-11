import { TickGlyph } from './glyphs';

/**
 * The counter-sign on population figures: one model run, so no band. It sits
 * before the first figure of every population page and beside each chart.
 */
export function NoMargin({ locale, children, className = '' }: { locale: string; children?: React.ReactNode; className?: string }) {
  const text = children ?? (locale === 'en' ? 'one model run, no margin' : 'uma corrida do modelo, sem margem');
  return (
    <span className={`inline-flex items-center gap-[7px] text-[12.5px] text-graphite ${className}`}>
      <TickGlyph />
      <span>{text}</span>
    </span>
  );
}
