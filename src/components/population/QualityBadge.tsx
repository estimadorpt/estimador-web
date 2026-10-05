import { Building2, CircleCheck, CircleSlash, Info } from 'lucide-react';
import { TIER_COPY, type Locale } from '@/lib/population/labels';

type Kind = 'A' | 'B' | 'C' | 'municipality' | 'refused';

const STYLE: Record<Kind, { icon: typeof Info; className: string }> = {
  A: { icon: CircleCheck, className: 'bg-moss text-ink' },
  B: { icon: CircleCheck, className: 'bg-moss text-ink' },
  // Amber means caveat on this site, never emphasis.
  C: { icon: Info, className: 'bg-amber-100 text-amber-900' },
  municipality: { icon: Building2, className: 'bg-amber-100 text-amber-900' },
  refused: { icon: CircleSlash, className: 'bg-parchment text-stone-700' },
};

/**
 * A quality or publication status: always an icon and a word, never colour
 * alone. Tier C and município-level results are caveats (amber); A and B are
 * the plain case.
 */
export function QualityBadge({ kind, locale, label, title, className = '' }: {
  kind: Kind;
  locale: Locale;
  /** Overrides the default word (e.g. "Concelho de Águeda"). */
  label?: string;
  title?: string;
  className?: string;
}) {
  const { icon: Icon, className: tone } = STYLE[kind];
  const word = label
    ?? (kind === 'A' || kind === 'B' || kind === 'C'
      ? TIER_COPY[kind].label[locale]
      : kind === 'municipality'
        ? (locale === 'pt' ? 'Valores do concelho' : 'Municipality figures')
        : (locale === 'pt' ? 'Não publicado' : 'Not published'));
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold ${tone} ${className}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      {word}
    </span>
  );
}
