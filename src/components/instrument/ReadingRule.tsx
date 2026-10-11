import { BandGlyph, NowGlyph, TickGlyph } from './glyphs';

const COPY = {
  pt: {
    full: ['Preto: o que já aconteceu.', 'Amarelo: a margem do modelo.', 'Traço só: uma corrida, sem margem.'],
    short: ['o que já aconteceu', 'a margem do modelo, 90%', 'uma corrida, sem margem'],
  },
  en: {
    full: ['Black: what has already happened.', 'Yellow: the model’s margin.', 'Tick alone: one run, no margin.'],
    short: ['what has already happened', 'the model’s margin, 90%', 'one run, no margin'],
  },
} as const;

/**
 * The legend of the site's three marks: printed once on the homepage, in the
 * footer, and as a short key under any chart that uses them.
 */
export function ReadingRule({ locale, variant = 'full', marks = ['now', 'band', 'tick'], className = '' }: {
  locale: string;
  variant?: 'full' | 'short';
  marks?: Array<'now' | 'band' | 'tick'>;
  className?: string;
}) {
  const words = COPY[locale === 'en' ? 'en' : 'pt'][variant];
  const items = [
    { key: 'now', glyph: <NowGlyph />, text: words[0] },
    { key: 'band', glyph: <BandGlyph />, text: words[1] },
    { key: 'tick', glyph: <TickGlyph />, text: words[2] },
  ].filter(item => marks.includes(item.key as 'now' | 'band' | 'tick'));
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-[18px] gap-y-1 ${className}`}>
      {items.map(item => (
        <span key={item.key} className="inline-flex items-center gap-[7px] whitespace-nowrap">
          {item.glyph}
          {item.text}
        </span>
      ))}
    </span>
  );
}
