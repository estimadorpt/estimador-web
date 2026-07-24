'use client';

// The confidence indicator that rides next to an uncertain number. Editorial,
// NOT a rounded pill: a thin vertical marker (terracotta when the replicate
// band certifies a precision, stone when we only have a point estimate) plus a
// stone micro-label. The four states map 1:1 to `adaptivePrecision().confidence`
// and their labels come from `populacao.uncertainty.{point|high|medium|low}`.

import { useTranslations } from 'next-intl';
import type { Confidence } from '@/lib/populacao/uncertainty';

const ACCENT = '#9A4A2E';

// Marker colour conveys precision without a pill: solid terracotta at high
// precision, fading through medium/low, stone for an uncertified point estimate.
const MARKER: Record<Confidence, { color: string; opacity: number }> = {
  high: { color: ACCENT, opacity: 1 },
  medium: { color: ACCENT, opacity: 0.55 },
  low: { color: ACCENT, opacity: 0.3 },
  point: { color: '#a8a29e', opacity: 1 }, // stone-400
};

const LABEL_KEY: Record<Confidence, string> = {
  high: 'uncertainty.high',
  medium: 'uncertainty.medium',
  low: 'uncertainty.low',
  point: 'uncertainty.point',
};

export function ConfidenceChip({
  confidence,
  className = '',
}: {
  confidence: Confidence;
  className?: string;
}) {
  const t = useTranslations('populacao');
  const m = MARKER[confidence];
  return (
    <span className={`inline-flex items-center gap-1.5 align-middle ${className}`}>
      <span
        aria-hidden
        className="inline-block h-3 w-[3px]"
        style={{ backgroundColor: m.color, opacity: m.opacity }}
      />
      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
        {t(LABEL_KEY[confidence])}
      </span>
    </span>
  );
}
