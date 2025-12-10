'use client';

import { useTranslations } from 'next-intl';

/**
 * Display model assumptions prominently on forecast pages
 * Improves transparency and helps users understand model limitations
 */
export function ModelAssumptionsCard() {
  const t = useTranslations('model');

  return (
    <div className="rounded border-l-4 border-stone-600 bg-stone-50 p-4">
      <h3 className="font-bold text-stone-900">{t('assumptions.title')}</h3>
      <ul className="mt-2 space-y-1 text-sm text-stone-700">
        <li>• {t('assumptions.declared_voters')}</li>
        <li>• {t('assumptions.undecided')}</li>
        <li>• {t('assumptions.house_effects')}</li>
        <li>• {t('assumptions.random_walk')}</li>
      </ul>
    </div>
  );
}
