'use client';

import { useTranslations } from 'next-intl';

/**
 * The model's assumptions on the presidential archive, as a ruled list (no
 * filled box): what the forecast modelled and what it left out.
 */
export function ModelAssumptionsCard() {
  const t = useTranslations('model');

  return (
    <div className="border-t border-rule pt-3">
      <h3 className="text-[15px] font-semibold text-ink">{t('assumptions.title')}</h3>
      <ul className="mt-2 space-y-1 text-sm text-ink">
        {/* One bullet for the declared intention and the undecided it leaves out. */}
        <li>• {t('assumptions.declared_voters')}</li>
        <li>• {t('assumptions.house_effects')}</li>
        <li>• {t('assumptions.random_walk')}</li>
      </ul>
    </div>
  );
}
