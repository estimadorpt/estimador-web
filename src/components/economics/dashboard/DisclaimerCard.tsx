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
  expectedNextUpdate,
  locale,
}: {
  vintageDate?: string;
  vintage?: DashboardVintage;
  expectedNextUpdate?: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });

  const fmtLong = (iso?: string) =>
    iso
      ? new Date(iso + 'T00:00:00').toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;
  const fmtVintage = fmtLong(vintageDate);
  const fmtNextUpdate = fmtLong(expectedNextUpdate);

  const coverage =
    vintage?.position &&
    `${vintage.position}${
      typeof vintage.pct_complete === 'number'
        ? ` · ${Math.round(vintage.pct_complete * 100)}%`
        : ''
    }`;

  return (
    <section className="border-t border-ink pt-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Info aria-hidden="true" className="w-4 h-4 text-ink" />
        <h2 className="text-xs font-bold text-ink">
          {t('aboutTitle')}
        </h2>
      </div>

      {/* Compact, always-visible lead. */}
      <p className="text-sm leading-relaxed text-ink max-w-3xl">
        {t('disclaimerLead')}
      </p>

      {/* Full audited disclaimer, one click away. */}
      <ReadMore moreLabel={t('readMore')} lessLabel={t('readLess')}>
        {t('disclaimerFull')}
      </ReadMore>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-graphite">
        {fmtVintage && (
          <span>
            <span className="font-semibold text-graphite">{t('dataVintage')}:</span>{' '}
            {fmtVintage}
          </span>
        )}
        {coverage && (
          <span>
            <span className="font-semibold text-graphite">
              {t('quarterCoverage')}:
            </span>{' '}
            {coverage}
          </span>
        )}
        {fmtNextUpdate && (
          <span>
            <span className="font-semibold text-graphite">{t('nextUpdate')}:</span>{' '}
            {fmtNextUpdate}
          </span>
        )}
      </div>
    </section>
  );
}
