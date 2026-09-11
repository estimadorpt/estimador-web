const WIDTHS = [480, 960] as const;
export type HomeArtName = 'population' | 'football' | 'economy' | 'elections';

/**
 * A homepage illustration: decorative, contained, never stretched. Masters are
 * 1448 × 1086 on a cream field (docs/design/homepage-claude-handoff/assets);
 * scripts/generate-home-art.mjs writes the AVIF and WebP sizes this picks from.
 */
export function HomeArt({ name, sizes, priority = false, className = '' }: { name: HomeArtName; sizes: string; priority?: boolean; className?: string }) {
  const set = (ext: 'avif' | 'webp') => WIDTHS.map(w => `/images/home/${name}-${w}.${ext} ${w}w`).join(', ');
  return (
    <picture className={`block ${className}`}>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, responsive sources above */}
      <img
        src={`/images/home/${name}-960.webp`}
        width={1448}
        height={1086}
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="h-full w-full object-contain"
      />
    </picture>
  );
}
