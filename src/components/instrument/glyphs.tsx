import { BRAND } from '@/lib/brand';

/**
 * The three marks of the reading rule, as small inline glyphs for legends
 * and running text. Decorative: the words beside them carry the meaning.
 */
export function NowGlyph({ className = '' }: { className?: string }) {
  return (
    <svg className={`inline-block shrink-0 align-[-3px] ${className}`} width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" focusable="false">
      <rect x="1" y="3" width="8" height="8" fill={BRAND.ink} />
    </svg>
  );
}

export function BandGlyph({ className = '' }: { className?: string }) {
  return (
    <svg className={`inline-block shrink-0 align-[-3px] ${className}`} width="34" height="16" viewBox="0 0 34 16" aria-hidden="true" focusable="false">
      <rect x="1" y="4" width="32" height="8" fill={BRAND.signal} />
      <rect x="0.5" y="1" width="1" height="14" fill={BRAND.ink} />
      <rect x="32.5" y="1" width="1" height="14" fill={BRAND.ink} />
      <rect x="16" y="0" width="2" height="16" fill={BRAND.ink} />
    </svg>
  );
}

/** One run, no margin: the median tick alone on a short ruler. */
export function TickGlyph({ className = '' }: { className?: string }) {
  return (
    <svg className={`inline-block shrink-0 align-[-3px] ${className}`} width="26" height="16" viewBox="0 0 26 16" aria-hidden="true" focusable="false">
      <rect x="0" y="11" width="26" height="1" fill={BRAND.ink} />
      <rect x="0" y="8" width="1" height="4" fill={BRAND.ink} />
      <rect x="25" y="8" width="1" height="4" fill={BRAND.ink} />
      <rect x="12" y="1" width="2" height="12" fill={BRAND.ink} />
    </svg>
  );
}
