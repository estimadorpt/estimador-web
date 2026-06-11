// "What's moving it" tile — attribution of the DFM factor-news reference model.
//
// HONEST FRAMING (load-bearing): this decomposes a FACTOR REFERENCE model's
// nowcast, NOT the production headline figure, and the shares are an accounting
// attribution, not a causal claim. The visible inline caveat + the verbatim
// `note` (rendered in the collapsible) say so; the "preliminary" badge flags the
// early vintage. Diverging HTML/CSS bars, brand teal (push up) / red (drag down),
// stone palette, tabular-nums, mobile-safe. Server component, zero runtime deps.

import { getTranslations } from 'next-intl/server';
import { TileCard } from './TileCard';
import { fmtSignedPp, COLORS } from '@/lib/utils/economy-format';
import { groupKey, labelKey } from '@/lib/i18n/economy-labels';
import type { ContributionsTileData } from '@/types/economy-dashboard';

const MAX_ROWS = 7;

export async function ContributionsTile({
  data,
  locale,
}: {
  data: ContributionsTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.tile_label);
  const gname = (g?: string | null) => {
    const k = groupKey(g);
    return k ? t(k) : g ?? '—';
  };

  // Null-safe at every step: groups, contribution, and top_drivers may all be missing.
  const allGroups = Array.isArray(data?.level_decomposition?.groups)
    ? data.level_decomposition!.groups!
    : [];

  // Directional "biggest movers" — top up-mover and top down-mover. We deliberately
  // do NOT surface this reference model's q/q point estimate: the official tile is
  // the single q/q-GDP number on the page (avoids a confusing second headline figure).
  const finite = allGroups.filter(
    (g) => g && typeof g.contribution === 'number' && Number.isFinite(g.contribution)
  );
  const topUp = finite
    .filter((g) => g.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)[0];
  const topDown = finite
    .filter((g) => g.contribution < 0)
    .sort((a, b) => a.contribution - b.contribution)[0];
  const moversLine =
    topUp && topDown
      ? t('contributionsMovers', {
          down: gname(topDown.group),
          up: gname(topUp.group),
        })
      : null;
  const rows = allGroups
    .filter((g) => g && typeof g.contribution === 'number' && Number.isFinite(g.contribution))
    .slice()
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, MAX_ROWS);

  // Diverging scale: the widest bar (50% of the track) is the largest |value|.
  const maxAbs = rows.reduce(
    (m, g) => Math.max(m, Math.abs(g.contribution)),
    0
  );

  return (
    <TileCard
      title={t('contributionsTitle')}
      eyebrow={t('contributionsEyebrow')}
      label={lblKey ? t(lblKey) : data?.tile_label}
      labelTone="amber"
      honesty={data?.note ?? t('contributionsHonesty')}
    >
      {/* Directional lead — which groups are pushing the factor nowcast up/down.
          No q/q point estimate here; the official tile owns that single number. */}
      {moversLine && (
        <p className="text-sm leading-relaxed text-stone-700 mb-3">{moversLine}</p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: COLORS.teal }}
          />
          {t('contributionsPushUp')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: COLORS.red }}
          />
          {t('contributionsPullDown')}
        </span>
      </div>

      {/* Diverging horizontal bars from a centered zero axis */}
      {rows.length > 0 ? (
        <div className="space-y-2.5">
          {rows.map((g, i) => {
            const c = g.contribution;
            const positive = c >= 0;
            // Bar length: each side spans up to 50% of the track.
            const pct = maxAbs > 0 ? (Math.abs(c) / maxAbs) * 50 : 0;
            const driver = g.top_drivers?.[0]?.variable;
            return (
              <div key={`${g.group ?? 'group'}-${i}`}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-stone-700 truncate">
                    {gname(g.group)}
                  </span>
                  <span
                    className="text-xs font-semibold tabular-nums shrink-0"
                    style={{ color: positive ? COLORS.teal : COLORS.red }}
                  >
                    {fmtSignedPp(c)}
                  </span>
                </div>
                {/* track with centered zero axis */}
                <div className="relative h-2 w-full rounded-sm bg-stone-100">
                  <span
                    aria-hidden
                    className="absolute top-[-2px] bottom-[-2px] left-1/2 w-px bg-stone-300"
                  />
                  <span
                    aria-hidden
                    className="absolute top-0 bottom-0 rounded-sm"
                    style={{
                      backgroundColor: positive ? COLORS.teal : COLORS.red,
                      width: `${pct}%`,
                      left: positive ? '50%' : undefined,
                      right: positive ? undefined : '50%',
                    }}
                  />
                </div>
                {driver && (
                  <div className="text-[10px] text-stone-400 mt-0.5 truncate">
                    {t('contributionsTopDriver')}: {driver}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-stone-400">—</p>
      )}

      {/* Unit caption */}
      <p className="text-[10px] text-stone-400 mt-3">{t('contributionsUnit')}</p>
    </TileCard>
  );
}
