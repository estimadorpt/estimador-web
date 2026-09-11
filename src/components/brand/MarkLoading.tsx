import { BRAND, COUNTER_X, MARK_LEFT, MARK_RIGHT } from '@/lib/brand';

/**
 * The mark while something loads: the counter travels the band. Only where a
 * page is genuinely fetching; a published forecast is never shown "estimating".
 * The animation lives in globals.css and stops under prefers-reduced-motion.
 */
export function MarkLoading({ height = 24, color = 'currentColor', ground = BRAND.forest, label }: { height?: number; color?: string; ground?: string; label?: string }) {
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
      <path d={MARK_LEFT} />
      <path d="M19 6h10a6 6 0 0 1 6 6a6 6 0 0 1 -6 6H19a6 6 0 0 1 -6 -6a6 6 0 0 1 6 -6Z" />
      <path d={MARK_RIGHT} />
      <circle className="brand-mark-loading-dot" cx={COUNTER_X} cy="12" r="3.4" fill={ground} />
    </svg>
  );
}
