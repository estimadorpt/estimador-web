import { Building2, CircleSlash } from 'lucide-react';
import { TIER_COPY, type Locale } from '@/lib/population/labels';

type Kind = 'A' | 'B' | 'C' | 'municipality' | 'refused';

/**
 * A quality tier or a publication status as words, not a chip: "Nível A" in
 * semibold ink, with no fill and no frame. Tiers are reading guides, so every
 * tier reads the same way; the two statuses (a município's figures, a
 * refusal) keep an icon beside the word, so colour never carries them alone.
 */
export function QualityBadge({ kind, locale, label, title, className = '' }: {
  kind: Kind;
  locale: Locale;
  /** Overrides the default word (e.g. "Concelho de Águeda"). */
  label?: string;
  title?: string;
  className?: string;
}) {
  const word = label
    ?? (kind === 'A' || kind === 'B' || kind === 'C'
      ? TIER_COPY[kind].label[locale]
      : kind === 'municipality'
        ? (locale === 'pt' ? 'Valores do concelho' : 'Municipality figures')
        : (locale === 'pt' ? 'Não publicado' : 'Not published'));
  const Icon = kind === 'municipality' ? Building2 : kind === 'refused' ? CircleSlash : null;
  // A município's figures are a caveat: the caveat colour, as text (700 on white).
  const tone = kind === 'municipality' ? 'text-amber-700' : kind === 'refused' ? 'text-graphite' : 'text-ink';
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 font-semibold ${tone} ${className}`}>
      {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
      {word}
    </span>
  );
}
