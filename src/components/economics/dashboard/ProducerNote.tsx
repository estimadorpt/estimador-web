import { useTranslations } from 'next-intl';
import { pickNote } from '@/lib/i18n/economy-labels';

type I18n = { en?: string; pt?: string };

const TONE = {
  body: 'text-sm leading-relaxed text-stone-700 max-w-prose border-l-2 border-stone-300 pl-3',
  faint: 'text-[11px] leading-snug text-stone-400 max-w-prose',
  caveat: 'text-[11px] leading-snug text-amber-700 max-w-prose border-l-2 border-amber-200 pl-2',
} as const;

/**
 * Prose the producer ships with the feed (the two-era framing, the
 * first-release footnote, method notes). Never paraphrased here: the feed's
 * wording is the audited wording. Bilingual when the feed carries an
 * `_i18n` object; otherwise the verbatim English text, which on the
 * Portuguese page sits behind a labelled disclosure so the visible surface
 * stays in one language.
 */
export function ProducerNote({
  locale,
  text,
  i18n,
  tone = 'faint',
  className = '',
}: {
  locale: string;
  text?: string | string[] | null;
  i18n?: I18n;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  const t = useTranslations('economics');
  const localized = pickNote(locale, i18n, Array.isArray(text) ? undefined : text ?? undefined);
  const items = i18n && localized ? [localized] : Array.isArray(text) ? text : text ? [text] : [];
  if (items.length === 0) return null;

  const foreign = locale === 'pt' && !i18n?.pt;
  const paragraphs = items.map((p, i) => (
    <p key={i} className={TONE[tone]} lang={foreign ? 'en' : undefined}>
      {p}
    </p>
  ));

  if (!foreign) return <div className={`space-y-1 ${className}`}>{paragraphs}</div>;

  return (
    <details className={className}>
      <summary className="cursor-pointer text-[11px] font-semibold text-stone-500 hover:text-ink">
        {t('producerNoteEn')}
      </summary>
      <div className="mt-1.5 space-y-1">{paragraphs}</div>
    </details>
  );
}
