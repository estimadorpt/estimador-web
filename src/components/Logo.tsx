import { BRAND, MARK_BAND, MARK_LEFT, MARK_RIGHT, MARK_SMALL } from '@/lib/brand';
import { WORDMARK_BASELINE, WORDMARK_HEIGHT, WORDMARK_NAME, WORDMARK_TLD, WORDMARK_WIDTH, WORDMARK_X } from '@/lib/brand/wordmark';

interface MarkProps {
  /** Rendered height in px; the mark is twice as wide. */
  height?: number;
  color?: string;
  className?: string;
  /** When given, the SVG is announced with this label; otherwise it is decorative. */
  title?: string;
}

/**
 * The interval mark at 24px and above: square caps, one band, a slightly left-offset
 * counter. One colour. The whiskers are separate paths so a hover on the
 * wrapping `.brand-link` can open the interval (see globals.css).
 */
export function Mark({ height = 24, color = 'currentColor', className = '', title }: MarkProps) {
  return (
    <svg
      className={`brand-mark ${className}`}
      width={height * 2}
      height={height}
      viewBox="0 0 48 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path className="brand-mark-left" d={MARK_LEFT} />
      <path d={MARK_BAND} />
      <path className="brand-mark-right" d={MARK_RIGHT} />
    </svg>
  );
}

/** Below 24px: shorter whiskers, thicker caps, and the same offset counter. Square, so it fits a favicon or an avatar. */
export function MarkSmall({ size = 16, color = 'currentColor', className = '', title }: { size?: number; color?: string; className?: string; title?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d={MARK_SMALL} />
    </svg>
  );
}

interface LogoHorizontalProps {
  /** Mark height in px; the wordmark scales with it. */
  size?: number;
  /** `ink` on light surfaces, `paper` on dark ones. */
  tone?: 'ink' | 'paper';
  className?: string;
}

/**
 * The signature: the interval mark and "estimador.pt", drawn exactly as the
 * published logo (public/brand/estimador-logo.svg): the wordmark is outlined
 * paths (src/lib/brand/wordmark.ts), so it never depends on the page's
 * typeface. The whiskers keep their own paths for the hover on `.brand-link`.
 */
export function LogoHorizontal({ size = 24, tone = 'ink', className = '' }: LogoHorizontalProps) {
  const color = tone === 'paper' ? BRAND.paper : BRAND.ink;
  // The ".pt" steps back from the name but stays readable (BRAND.muted is
  // 6.4:1 on white; the paper tone is 4.9:1 or better on ink).
  const muted = tone === 'paper' ? 'rgba(255,255,255,0.62)' : BRAND.muted;
  return (
    <svg
      className={`brand-mark ${className}`}
      width={Math.round((size * WORDMARK_WIDTH) / WORDMARK_HEIGHT)}
      height={size}
      viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <g fill={color}>
        <path className="brand-mark-left" d={MARK_LEFT} />
        <path d={MARK_BAND} />
        <path className="brand-mark-right" d={MARK_RIGHT} />
      </g>
      <g transform={`translate(${WORDMARK_X} ${WORDMARK_BASELINE})`}>
        <path d={WORDMARK_NAME} fill={color} />
        <path d={WORDMARK_TLD} fill={muted} />
      </g>
    </svg>
  );
}

/** The mark alone, for the mobile header and avatars. */
export function LogoIconOnly({ size = 32, color = BRAND.ink, className = '' }: { size?: number; color?: string; className?: string }) {
  return <MarkSmall size={size} color={color} className={className} />;
}
