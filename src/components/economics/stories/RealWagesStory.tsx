// Real-wages story: official nominal wage growth (BdP/BPstat declared wage),
// deflated by the SAME-MONTH official HICP — explicit arithmetic, no model.
// The nominal reading can lag badly (it carries its own period + stale flag,
// rendered as an amber chip). The purchasing-power-since-2021 block degrades
// honestly: when its input series is missing the payload ships null and we say
// so instead of publishing a chained approximation.

import { getTranslations } from 'next-intl/server';
import { StoryCard } from './StoryCard';
import { COLORS } from '@/lib/utils/economy-format';
import { fmtSignedPctLoc, fmtPctLoc, fmtMonthLoc } from '@/lib/utils/story-format';
import { pickText, type RealWagesModule } from '@/types/economy-stories';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export async function RealWagesStory({
  data,
  locale,
}: {
  data: RealWagesModule;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const nominal = data?.nominal_yoy;
  const real = data?.real_yoy_pct;
  const pp = data?.purchasing_power_since_2021;

  return (
    <StoryCard
      title={data?.title}
      badge={data?.badge}
      asOf={data?.as_of}
      headline={data?.headline}
      honesty={pickText(locale, data?.honesty_note_i18n)}
      locale={locale}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-stone-200 border border-stone-200">
        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('wagesNominal')}
          </div>
          <div className="text-2xl font-black tabular-nums mt-0.5 text-stone-800">
            {fmtSignedPctLoc(nominal?.value_pct, locale, 1)}
          </div>
          {nominal?.period && (
            <span
              className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded ${
                nominal?.stale
                  ? 'bg-amber-100 text-amber-800 font-semibold'
                  : 'bg-stone-100 text-stone-500'
              }`}
              title={nominal?.stale ? t('labourStaleTitle') : undefined}
            >
              {fmtMonthLoc(nominal.period, locale)}
            </span>
          )}
        </div>
        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('wagesInflation')}
          </div>
          <div className="text-2xl font-black tabular-nums mt-0.5 text-stone-800">
            {fmtPctLoc(data?.deflator?.hicp_yoy_pct, locale, 1)}
          </div>
          {data?.deflator?.period && (
            <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
              {fmtMonthLoc(data.deflator.period, locale)}
            </span>
          )}
        </div>
        <div className="bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('wagesReal')}
          </div>
          <div
            className="text-2xl font-black tabular-nums mt-0.5"
            style={{
              color: isNum(real) ? (real >= 0 ? COLORS.teal : COLORS.red) : COLORS.stoneDark,
            }}
          >
            {fmtSignedPctLoc(real, locale, 1)}
          </div>
        </div>
      </div>

      {/* purchasing-power block: published only when its input series exists */}
      {pp && pp.index_jan2021_100 == null && (
        <p className="mt-3 text-[11px] leading-relaxed text-stone-400 max-w-prose">
          {t('wagesPpUnavailable')}
        </p>
      )}
    </StoryCard>
  );
}
