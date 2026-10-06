export type HomeArtName = 'population' | 'football' | 'economy' | 'elections';
export type HomeArtShape = 'lead' | 'wide' | 'square';

/** Mirrors scripts/generate-home-art.mjs: the crop's pixel size and the widths shipped. */
const SHAPES: Record<HomeArtShape, { width: number; height: number; widths: number[] }> = {
  lead: { width: 850, height: 1086, widths: [600, 1000] },
  wide: { width: 1448, height: 850, widths: [480, 960] },
  square: { width: 1086, height: 1086, widths: [400, 800] },
};

/** The illustrations' own field, so a contained image reads edge to edge. */
export const ART_FIELD = '#fbfaf4';

/** A 1×1 transparent GIF: what a viewport outside `media` gets instead of the art. */
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * A homepage illustration: decorative, contained, never stretched, on its own
 * cream field so it can run to a panel's edge. Masters and crops are described
 * in scripts/generate-home-art.mjs; this only picks a width.
 *
 * `media` limits the art to the viewports that show it (UXM2V-04): a wrapper
 * hidden by CSS still downloads an eager image, so an illustration shown only
 * on desktop gets `media="(min-width: 768px)"` (and the phone-only one the
 * opposite query), and the other viewport fetches nothing.
 */
export function HomeArt({ name, shape, sizes, priority = false, media, className = '' }: { name: HomeArtName; shape: HomeArtShape; sizes: string; priority?: boolean; media?: string; className?: string }) {
  const { width, height, widths } = SHAPES[shape];
  const set = (ext: 'avif' | 'webp') => widths.map(w => `/images/home/${name}-${shape}-${w}.${ext} ${w}w`).join(', ');
  return (
    <div aria-hidden="true" className={`flex items-center justify-center overflow-hidden ${className}`} style={{ backgroundColor: ART_FIELD }}>
      <picture className="block h-full w-full">
        <source type="image/avif" srcSet={set('avif')} sizes={sizes} media={media} />
        <source type="image/webp" srcSet={set('webp')} sizes={sizes} media={media} />
        <img
          src={media ? BLANK : `/images/home/${name}-${shape}-${widths[widths.length - 1]}.webp`}
          width={width}
          height={height}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="h-full w-full object-contain"
        />
      </picture>
    </div>
  );
}
