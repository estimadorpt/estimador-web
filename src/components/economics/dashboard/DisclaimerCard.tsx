// Top-of-page "About this dashboard" panel. The honesty contract stays prominent
// but compacted: a short always-visible LEAD, with the full audited disclaimer one
// click away (ReadMore). All copy comes from the i18n message files; the data feed
// supplies only the vintage metadata.

import { getTranslations } from 'next-intl/server';
import { Info } from 'lucide-react';
import type { DashboardVintage } from '@/types/economy-dashboard';
import { ReadMore } from './ReadMore';

export async function DisclaimerCard({
  vintageDate,
  vintage,
  locale,
}: {
  vintageDate?: string;
  vintage?: DashboardVintage;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });

  const fmtVintage = vintageDate
    ? new Date(vintageDate + 'T00:00:00').toLocaleDateString(
        locale === 'pt' ? 'pt-PT' : 'en-US',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : null;

  const coverage =
    vintage?.position &&
    `${vintage.position}${
      typeof vintage.pct_complete === 'number'
        ? ` · ${Math.round(vintage.pct_complete * 100)}%`
        : ''
    }`;

  return (
    <section className="rounded-lg border-l-4 border-l-[#1B4D5E] border-y border-r border-stone-200 bg-stone-50 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <Info className="w-4 h-4 text-[#1B4D5E]" />
        <h2 className="text-xs font-bold uppercase tracking-wide text-stone-700">
          {t('aboutTitle')}
        </h2>
      </div>

      {/* Compact, always-visible lead. */}
      <p className="text-sm leading-relaxed text-stone-700 max-w-3xl">
        {t('disclaimerLead')}
      </p>

      {/* Full audited disclaimer, one click away. */}
      <ReadMore moreLabel={t('readMore')} lessLabel={t('readLess')}>
        {t('disclaimerFull')}
      </ReadMore>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-stone-500">
        {fmtVintage && (
          <span>
            <span className="font-semibold text-stone-600">{t('dataVintage')}:</span>{' '}
            {fmtVintage}
          </span>
        )}
        {coverage && (
          <span>
            <span className="font-semibold text-stone-600">
              {t('quarterCoverage')}:
            </span>{' '}
            {coverage}
          </span>
        )}
      </div>
    </section>
  );
}
