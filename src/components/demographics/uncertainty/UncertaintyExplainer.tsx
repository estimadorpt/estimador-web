'use client';

// "Como lemos a incerteza" — the reusable explainer block (scorecard, tabulator
// and methodology all drop it in). Copy comes from `populacao.uncertainty`
// (aboutTitle / aboutBody); it also renders the four confidence states as a
// legend so readers can decode the ConfidenceChip they see on the numbers.
// Editorial: terracotta rule, micro-label heading, stone body — no card/shadow.

import { useTranslations } from 'next-intl';
import type { Confidence } from '@/lib/populacao/uncertainty';
import { ConfidenceChip } from './ConfidenceChip';

const ACCENT = '#9A4A2E';
const LEGEND: Confidence[] = ['high', 'medium', 'low', 'point'];

export function UncertaintyExplainer({
  className = '',
  showLegend = true,
}: {
  className?: string;
  showLegend?: boolean;
}) {
  const t = useTranslations('populacao');
  return (
    <section className={`border-l-2 pl-4 ${className}`} style={{ borderColor: ACCENT }}>
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
        {t('uncertainty.aboutTitle')}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-700 max-w-2xl">
        {t('uncertainty.aboutBody')}
      </p>
      {showLegend ? (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {LEGEND.map((c) => (
            <ConfidenceChip key={c} confidence={c} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
