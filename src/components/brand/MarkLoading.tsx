import { useId } from 'react';
import { COUNTER_X, MARK_LEFT, MARK_RIGHT } from '@/lib/brand';

/**
 * The mark while something loads: the median slot travels the band. Only
 * where a page is genuinely fetching; a published forecast is never shown
 * "estimating". The slot is cut through the band with a mask, so the mark
 * reads on any ground. The animation lives in globals.css and stops under
 * prefers-reduced-motion.
 */
export function MarkLoading({ height = 24, color = 'currentColor', label }: { height?: number; color?: string; label?: string }) {
  const mask = `mark-loading-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className="brand-mark-loading"
      width={height * 2}
      height={height}
      viewBox="0 0 48 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="24">
        <rect x="13" y="6" width="22" height="12" fill="#fff" />
        <rect className="brand-mark-loading-slot" x={COUNTER_X - 1} y="8" width="2" height="8" fill="#000" />
      </mask>
      <path d={MARK_LEFT} />
      <rect x="13" y="6" width="22" height="12" mask={`url(#${mask})`} />
      <path d={MARK_RIGHT} />
    </svg>
  );
}
