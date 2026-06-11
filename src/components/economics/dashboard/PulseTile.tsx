// "Activity pulse" tile — ANCHORED read (schema v1, anchored mode).
//
// HONEST framing (load-bearing, from the producer): the LEVEL is the monthly
// BdP "Coincident Activity" print (the anchor — pseudo-RT corr 0.81 with YoY
// GDP ex-COVID). The weekly index adds NO verified level information beyond
// that free monthly print; its one asset is CADENCE, so it enters only as a
// direction-only TILT since the BdP print, and its history is demoted to a
// small sparkline. The combined read is a freshness overlay, NOT the best
// level estimate (adding the tilt worsens the anchor-only read — the payload's
// own hybrid_validation says so and is rendered verbatim).
//
// Payload honesty strings (honesty_note, anchor_honesty.*) are rendered as-is.
// All values here are already in percent units (yoy %); NO ×100 scaling.

import { getTranslations } from 'next-intl/server';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { TileCard } from './TileCard';
import {
  COLORS,
  fmtSignedPctValue,
  fmtSignedPpValue,
  fmtNum,
  fmtDate,
  fmtDateShort,
} from '@/lib/utils/economy-format';
import { labelKey } from '@/lib/i18n/economy-labels';
import type { PulseTileData, PulsePoint } from '@/types/economy-dashboard';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

// Small, demoted weekly-index sparkline (cadence context only — not the level).
function WeeklySparkline({
  history,
  ariaLabel,
  locale,
}: {
  history: PulsePoint[];
  ariaLabel: string;
  locale: string;
}) {
  const pts = history.filter((p) => p && isNum(p.value));
  if (pts.length < 2) return null;

  const W = 480;
  const H = 80;
  const padL = 8;
  const padR = 44;
  const padTop = 10;
  const padBottom = 16;
  const plotW = W - padL - padR;
  const plotH = H - padTop - padBottom;

  const values = pts.map((p) => p.value);
  const yLo = Math.min(0, ...values);
  const yHi = Math.max(...values, 0.01) * 1.05;
  const span = yHi - yLo || 1;
  const n = pts.length;
  const xAt = (i: number) => padL + (plotW * i) / Math.max(n - 1, 1);
  const yAt = (v: number) => padTop + plotH * (1 - (v - yLo) / span);

  const line = pts.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`).join(' ');
  const last = pts[n - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      className="block w-full h-auto max-w-[520px]"
    >
      {/* 0% baseline */}
      <line x1={padL} x2={W - padR} y1={yAt(0)} y2={yAt(0)} stroke={COLORS.grid} strokeWidth={1} />
      <polyline
        points={line}
        fill="none"
        stroke={COLORS.stoneDark}
        strokeWidth={1.5}
        strokeOpacity={0.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={xAt(n - 1)} cy={yAt(last.value)} r={3} fill={COLORS.stoneDark} />
      <text
        x={W - padR + 6}
        y={yAt(last.value) + 3.5}
        fontSize="10"
        fontWeight="600"
        fill={COLORS.stoneDark}
        className="tabular-nums"
      >
        {fmtSignedPctValue(last.value, 1)}
      </text>
      <text x={padL} y={H - 3} fontSize="9" fill={COLORS.stone}>
        {fmtDateShort(pts[0]?.date, locale)}
      </text>
      <text x={W - padR} y={H - 3} textAnchor="end" fontSize="9" fill={COLORS.stone}>
        {fmtDateShort(last?.date, locale)}
      </text>
    </svg>
  );
}

export async function PulseTile({
  data,
  locale,
}: {
  data: PulseTileData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const lblKey = labelKey(data?.label);

  const anchor = data?.anchor;
  const tilt = data?.tilt;
  const weekly = data?.components?.weekly_index;
  const history = Array.isArray(weekly?.history_recent) ? weekly.history_recent : [];

  // Tilt direction chip: payload `direction` is authoritative; value is in pp.
  const dir = (tilt?.direction ?? '').toLowerCase();
  const TiltIcon = dir === 'down' ? ArrowDownRight : dir === 'up' ? ArrowUpRight : ArrowRight;
  const tiltColor = dir === 'down' ? COLORS.amber : dir === 'up' ? COLORS.teal : COLORS.stoneDark;
  const tiltWord =
    dir === 'down' ? t('pulseTiltDown') : dir === 'up' ? t('pulseTiltUp') : t('pulseTiltFlat');

  const anchorColor =
    isNum(anchor?.value) && (anchor.value as number) < 0 ? COLORS.red : COLORS.teal;

  return (
    <TileCard
      title={t('pulseTitle')}
      eyebrow={t('pulseEyebrow')}
      label={lblKey ? t(lblKey) : data?.label}
      labelTone="amber"
      honesty={data?.honesty_note ?? t('pulseHonesty')}
    >
      <p className="text-sm text-stone-500">{t('pulseSubtitle')}</p>

      {/* ---- LEAD: the ANCHOR level (BdP Coincident Activity) ---------------- */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 md:gap-8">
        <div className="md:col-span-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            {t('pulseAnchorTitle')}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter leading-none"
              style={{ color: anchorColor }}
            >
              {fmtSignedPctValue(anchor?.value, 1)}
            </span>
            <span className="text-sm text-stone-500">
              {t('yoy')}
              {anchor?.date ? ` · ${fmtDate(anchor.date, locale)}` : ''}
            </span>
          </div>
          {/* source + the anchor's measured correlation */}
          <p className="mt-1.5 text-[11px] text-stone-500">
            {anchor?.source ?? '—'}
            {isNum(anchor?.corr_yoy_gdp_exclcovid) && (
              <>
                {' · '}
                <span className="tabular-nums">
                  {t('pulseAnchorCorr', {
                    corr: fmtNum(anchor.corr_yoy_gdp_exclcovid),
                  })}
                </span>
              </>
            )}
          </p>
          {/* verbatim payload claim for the anchor */}
          {data?.anchor_honesty?.anchor_claim && (
            <p className="mt-1 text-[10px] leading-snug text-stone-400 max-w-prose">
              {data.anchor_honesty.anchor_claim}
            </p>
          )}
        </div>

        {/* ---- TILT: small directional chip + combined read (secondary) ------ */}
        <div className="md:col-span-2 mt-4 md:mt-0 md:border-l md:border-stone-100 md:pl-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            {t('pulseTiltTitle')}
          </div>
          <div
            className="inline-flex items-center gap-1.5 border border-stone-200 px-2 py-1 text-sm font-semibold tabular-nums"
            style={{ color: tiltColor }}
          >
            <TiltIcon className="w-4 h-4" strokeWidth={2.5} />
            {tiltWord}
            {isNum(tilt?.value) && <span>{fmtSignedPpValue(tilt.value, 1, locale)}</span>}
            {isNum(tilt?.window_days) && (
              <span className="text-stone-400 font-normal">
                {t('pulseTiltWindow', { days: Math.round(tilt.window_days as number) })}
              </span>
            )}
          </div>
          {/* verbatim payload claim for the tilt */}
          <p className="mt-1 text-[10px] leading-snug text-stone-400">
            {data?.anchor_honesty?.tilt_claim ?? t('pulseTiltNote')}
          </p>

          {isNum(data?.combined_read) && (
            <div className="mt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                {t('pulseCombinedTitle')}
              </div>
              <span className="text-lg font-bold tabular-nums text-stone-500">
                {fmtSignedPctValue(data.combined_read, 1)}
              </span>
              <span className="ml-2 text-[10px] text-stone-400">{t('pulseCombinedNote')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ---- demoted weekly-index sparkline (cadence context, not the level) -- */}
      {history.length >= 2 && (
        <div className="mt-5 border-t border-stone-100 pt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t('pulseWeeklyTitle')}
            </h3>
            <span className="text-[10px] text-stone-400">{t('pulseWeeklyNote')}</span>
          </div>
          <WeeklySparkline history={history} ariaLabel={t('pulseChartAria')} locale={locale} />
        </div>
      )}
    </TileCard>
  );
}
