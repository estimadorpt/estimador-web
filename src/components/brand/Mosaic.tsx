import { BRAND } from '@/lib/brand';

type Variant = 'cover' | 'corner' | 'quarters' | 'people';

interface MosaicProps {
  variant?: Variant;
  className?: string;
  /** Soft tints for surfaces (the default); data tints only on forest, where they need the extra chroma. */
  tone?: 'soft' | 'data';
  /** The colour of the "windows": the ground the mosaic sits on. */
  ground?: string;
  /** Which surface pastels to use, in order, when the mosaic sits on a field of one of them. */
  colors?: Array<'mintSoft' | 'mustardSoft' | 'coralSoft' | 'periwinkleSoft'>;
}

/**
 * The mosaic: the site's playful register, kept away from data. The vocabulary
 * is small and each piece means something on this site: a quarter-circle is a
 * share of a whole, a circle is a person, a grid of dots is a population, a
 * rounded block is a place. Bands stay in the mark.
 */
export function Mosaic({ variant = 'cover', className = '', tone = 'soft', ground = BRAND.paper, colors }: MosaicProps) {
  const picked = colors?.map(k => BRAND[k]);
  const c = picked
    ? { a: picked[0], b: picked[1] ?? picked[0], c: picked[2] ?? picked[0], d: picked[3] ?? picked[1] ?? picked[0] }
    : tone === 'soft'
      ? { a: BRAND.mintSoft, b: BRAND.mustardSoft, c: BRAND.coralSoft, d: BRAND.periwinkleSoft }
      : { a: BRAND.mint, b: BRAND.mustard, c: BRAND.coral, d: BRAND.periwinkle };
  const common = { className, xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true as const, focusable: 'false' as const };

  if (variant === 'corner') {
    return (
      <svg {...common} viewBox="0 0 300 200" preserveAspectRatio="xMaxYMax slice">
        <path d="M300 200H100A200 200 0 0 1 300 0Z" fill={c.a} />
        <rect x="0" y="120" width="80" height="80" fill={c.b} />
        <circle cx="40" cy="160" r="18" fill={ground} />
        <circle cx="230" cy="70" r="26" fill={c.c} />
      </svg>
    );
  }
  if (variant === 'quarters') {
    return (
      <svg {...common} viewBox="0 0 200 200">
        <path d="M97 97H4A93 93 0 0 1 97 4Z" fill={c.a} />
        <path d="M103 4a93 93 0 0 1 93 93h-93Z" fill={c.b} />
        <path d="M97 103v93A93 93 0 0 1 4 103Z" fill={c.c} />
        <path d="M103 103h93a93 93 0 0 1-93 93Z" fill={c.d} />
        <circle cx="150" cy="150" r="18" fill={ground} />
      </svg>
    );
  }
  if (variant === 'people') {
    const cols = 12, rows = 5, fills = [c.a, c.b, c.c, c.d];
    const dots = [];
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) dots.push(<circle key={`${r}-${k}`} cx={10 + k * 16} cy={10 + r * 16} r="5" fill={fills[(r * 7 + k * 3) % 4]} />);
    return <svg {...common} viewBox="0 0 196 84">{dots}</svg>;
  }
  return (
    <svg {...common} viewBox="0 0 200 200">
      <path d="M0 98V0h98A98 98 0 0 1 0 98Z" fill={c.a} />
      <rect x="102" y="0" width="98" height="98" fill={c.b} />
      <circle cx="151" cy="49" r="24" fill={ground} />
      <rect x="0" y="102" width="98" height="98" fill={c.c} />
      <path d="M102 200v-98h98A98 98 0 0 1 102 200Z" fill={c.d} />
    </svg>
  );
}
