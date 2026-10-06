'use client';

import { useTranslations } from 'next-intl';
import { Disclosure } from '@/components/viz/Disclosure';

interface UncertaintyExplainerProps {
  numPolls: number;
  /** The intervals this page actually draws, each named with credibleIntervalLabel() and where it appears. */
  intervals: Array<{ label: string; where: string }>;
}

/**
 * Collapsible note on what the page's bands and intervals mean. The levels
 * are passed in by the page, so the explainer names the intervals that are
 * drawn (50%, 90% and 95% on the presidential archive) instead of a fixed
 * level that no chart uses. The undecided voters the bands leave out are
 * said once, in the page's caveat callout, not repeated here.
 */
export function UncertaintyExplainer({ numPolls, intervals }: UncertaintyExplainerProps) {
  const t = useTranslations('model');

  return (
    <Disclosure summary={t('uncertainty.title')} className="mt-4">
      <div className="mt-1 text-sm text-stone-600">
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
        </ul>
      </div>
    </Disclosure>
  );
}
