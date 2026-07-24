'use client';

// Renders a single published quantity at the precision its replicate band
// supports (`adaptivePrecision`), followed by a ConfidenceChip. When the
// interval is real (`certified`) a subtle "± half-width" is shown; when it is a
// point estimate nothing is invented — just the full value and a "point
// estimate" chip. Presentational and self-contained: A2/A3 MAY import it, but
// they call the lib directly, so this owns no data-loading.

import { useTranslations } from 'next-intl';
import { adaptivePrecision } from '@/lib/populacao/uncertainty';
import type { ReplicateInterval } from '@/types/populacao';
import { ConfidenceChip } from './ConfidenceChip';

function fmtHalfWidth(half: number, locale: 'pt' | 'en'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    maximumSignificantDigits: 2,
  }).format(half);
}

export function UncertainNumber({
  value,
  unit,
  locale = 'pt',
  className = '',
  chip = true,
}: {
  value: ReplicateInterval;
  unit?: string;
  locale?: 'pt' | 'en';
  className?: string;
  /** Set false to render the number bare (e.g. inside a table cell). */
  chip?: boolean;
}) {
  const t = useTranslations('populacao');
  const r = adaptivePrecision(value, locale);

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className="inline-flex items-baseline gap-1">
        <span className="tabular-nums text-stone-900">{r.display}</span>
        {unit ? <span className="text-stone-500">{unit}</span> : null}
        {r.certified && r.halfWidth != null ? (
          <span className="tabular-nums text-[0.85em] text-stone-400">
            <span aria-hidden> ± </span>
            <span className="sr-only"> {locale === 'en' ? 'plus or minus' : 'mais ou menos'} </span>
            {fmtHalfWidth(r.halfWidth, locale)}
          </span>
        ) : null}
      </span>
      {chip ? <ConfidenceChip confidence={r.confidence} /> : null}
      {/* Screen-reader footnote of what the chip means, once per number. */}
      <span className="sr-only">{t(`uncertainty.${r.confidence}`)}</span>
    </span>
  );
}
