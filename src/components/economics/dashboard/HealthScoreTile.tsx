// Hero tile for the "state of the economy" dashboard. A fixed-rule PRESENTATION
// composite (activity pulse + next-quarter downside, capped by recession risk),
// surfaced as a single 0–100 dial. It is NOT a model and NOT a skill claim — the
// always-visible caveat and the collapsible honesty_note say so verbatim. Pure
// server component, brand teal accent, stone palette, null-safe throughout.

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import { Gauge } from './Gauge';
import { toneForLabel } from './LabelBadge';
import { labelKey } from '@/lib/i18n/economy-labels';
import type { HealthScoreTileData } from '@/types/economy-dashboard';
import {
  COLORS,
  fmtScore,
  normalizeVerdict,
  verdictColor,
  type VerdictKey,
} from '@/lib/utils/economy-format';

export async function HealthScoreTile({
  data,
  locale,
}: {
  data: HealthScoreTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const components = data?.components;
  const weights = components?.weights;

  // Verdict word + color: trust the backend string, fall back by score.
  const verdictKey: VerdictKey = normalizeVerdict(data?.verdict, data?.score_0_100);
  const verdictLabelMap: Record<VerdictKey, string> = {
    contracting: t('verdictContracting'),
    softening: t('verdictSoftening'),
    steady: t('verdictSteady'),
    expanding: t('verdictExpanding'),
    strong: t('verdictStrong'),
  };
  const verdictWord = verdictLabelMap[verdictKey];
  const vColor = verdictColor(verdictKey);

  // Weights are fractions (0.65 / 0.35). Round to whole-percent for display and
  // for the blend note; guard with documented defaults so we never show NaN.
  const activityWeightPct = Math.round((weights?.activity ?? 0) * 100);
  const downsideWeightPct = Math.round((weights?.downside ?? 0) * 100);
  const blendActivityPct = Math.round((weights?.activity ?? 0.65) * 100);
  const blendDownsidePct = Math.round((weights?.downside ?? 0.35) * 100);

  return (
    <TileCard
      title={t('healthTitle')}
      eyebrow={t('healthEyebrow')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone={toneForLabel(data?.label)}
      honesty={data?.honesty_note ?? t('healthHonesty')}
      accent={COLORS.teal}
      hero
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
        {/* Left: the big dial */}
        <div>
          <Gauge
            size="lg"
            value={data?.score_0_100}
            min={0}
            max={100}
            color={vColor}
            display={fmtScore(data?.score_0_100)}
            sublabel={verdictWord}
            sublabelColor={vColor}
            minLabel={t('healthScaleMin')}
            maxLabel={t('healthScaleMax')}
            ariaLabel={`${t('healthTitle')}: ${fmtScore(data?.score_0_100)} / 100 · ${verdictWord}`}
          />
        </div>

        {/* Right: verdict word, always-visible caveat, component breakdown */}
        <div>
          <div
            className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums"
            style={{ color: vColor }}
          >
            {verdictWord}
          </div>

          {/* HONESTY: short caveat ALWAYS visible next to the headline — this is
              a fixed-rule presentation composite, not a model or skill claim. */}
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            {t('healthCaveat')}
          </p>

          {/* Component breakdown */}
          <div className="mt-5 border-t border-stone-100 pt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">
              {t('healthComposedOf')}
            </div>

            <dl className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-stone-600">{t('healthActivity')}</dt>
                <dd className="flex items-baseline gap-2 text-sm">
                  <span className="font-semibold tabular-nums text-stone-800">
                    {fmtScore(components?.activity_subscore)}
                  </span>
                  <span className="text-[11px] tabular-nums text-stone-400">
                    {activityWeightPct}%
                  </span>
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-stone-600">{t('healthDownside')}</dt>
                <dd className="flex items-baseline gap-2 text-sm">
                  <span className="font-semibold tabular-nums text-stone-800">
                    {fmtScore(components?.downside_subscore)}
                  </span>
                  <span className="text-[11px] tabular-nums text-stone-400">
                    {downsideWeightPct}%
                  </span>
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-stone-600">
                  {t('healthRecessionCap')}
                </dt>
                <dd className="flex items-baseline gap-2 text-sm">
                  <span className="font-semibold tabular-nums text-stone-800">
                    {fmtScore(components?.recession_cap)}
                  </span>
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
              {t('healthBlendNote', {
                activity: blendActivityPct,
                downside: blendDownsidePct,
              })}
            </p>
          </div>
        </div>
      </div>
    </TileCard>
  );
}
