'use client';

import { useTranslations } from 'next-intl';

interface UncertaintyExplainerProps {
  numPolls: number;
  /** The intervals this page actually draws, each named with credibleIntervalLabel() and where it appears. */
  intervals: Array<{ label: string; where: string }>;
}

/**
 * Collapsible note on what the page's bands and intervals mean. The levels
 * are passed in by the page, so the explainer names the intervals that are
 * drawn (50%, 90% and 95% on the presidential archive) instead of a fixed
 * level that no chart uses.
 */
export function UncertaintyExplainer({ numPolls, intervals }: UncertaintyExplainerProps) {
  const t = useTranslations('model');

  return (
    <details className="mt-4">
      <summary className="cursor-pointer font-semibold text-stone-900 hover:text-stone-700">
        {t('uncertainty.title')}
      </summary>
      <div className="mt-2 text-sm text-stone-600">
        <p className="mb-2">{t('uncertainty.description')}</p>
        <ul className="mt-2 space-y-1">
          {intervals.map(interval => (
            <li key={interval.where}>
              • <strong>{interval.label}</strong>: {interval.where}
            </li>
          ))}
          <li>• {t('uncertainty.ci_explanation')}</li>
          <li>• {t('uncertainty.based_on_polls', { count: numPolls })}</li>
          <li>• {t('uncertainty.wider_bands')}</li>
          <li>
            • <strong>{t('uncertainty.note')}</strong> {t('uncertainty.undecided_note')}
          </li>
        </ul>
      </div>
    </details>
  );
}
