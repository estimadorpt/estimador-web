import { BRAND, MARK_BAND, MARK_LEFT, MARK_RIGHT, MARK_SMALL } from '@/lib/brand';

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
  /** `ink` on light surfaces, `paper` on forest. */
  tone?: 'ink' | 'paper';
  className?: string;
}

/** The signature: mark plus "estimador.pt" in Manrope 800. There is no serif version. */
export function LogoHorizontal({ size = 24, tone = 'ink', className = '' }: LogoHorizontalProps) {
  const color = tone === 'paper' ? BRAND.paper : BRAND.ink;
  const muted = tone === 'paper' ? 'rgba(245,243,234,0.55)' : BRAND.faint;
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: Math.round(size * 0.42), color }}>
      <Mark height={size} />
      <span
        className="font-display font-extrabold leading-none tracking-[-0.035em] whitespace-nowrap"
        style={{ fontSize: Math.round(size * 1.1) }}
      >
        estimador<span style={{ color: muted }}>.pt</span>
      </span>
    </span>
  );
}

/** The mark alone, for the mobile header and avatars. */
export function LogoIconOnly({ size = 32, color = BRAND.ink, className = '' }: { size?: number; color?: string; className?: string }) {
  return <MarkSmall size={size} color={color} className={className} />;
}
