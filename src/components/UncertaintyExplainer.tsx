'use client';

import { useTranslations } from 'next-intl';

interface UncertaintyExplainerProps {
  numPolls?: number;
}

/**
 * Collapsible component explaining credible intervals and model uncertainty
 * Helps users understand what the uncertainty bands mean
 */
export function UncertaintyExplainer({ numPolls = 8 }: UncertaintyExplainerProps) {
  const t = useTranslations('model');

  return (
    <details className="mt-4">
      <summary className="cursor-pointer font-semibold text-stone-900 hover:text-stone-700">
        {t('uncertainty.title')}
      </summary>
      <div className="mt-2 text-sm text-stone-600">
        <p className="mb-2">
          {t('uncertainty.description')}
        </p>
        <ul className="mt-2 space-y-1">
          <li>
            • <strong>{t('uncertainty.credible_interval')}</strong>: {t('uncertainty.ci_explanation')}
          </li>
          <li>
            • {t('uncertainty.based_on_polls', { count: numPolls })}
          </li>
          <li>
            • {t('uncertainty.wider_bands')}
          </li>
          <li>
            • <strong>{t('uncertainty.note')}</strong> {t('uncertainty.undecided_note')}
          </li>
        </ul>
      </div>
    </details>
  );
}
