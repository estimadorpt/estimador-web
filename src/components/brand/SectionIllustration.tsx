import { preload } from 'react-dom';

export type IllustrationScene = 'economy' | 'football' | 'elections';

interface SectionIllustrationProps {
  scene: IllustrationScene;
  className?: string;
  /**
   * Above the fold (the forecast pages' PageHero, where this image is the
   * largest paint): fetch it at once and ahead of other images. Everywhere
   * else it waits until it is near the viewport.
   */
  priority?: boolean;
  /** The slot's rendered width, for choosing between the 360 and 720 px files. */
  sizes?: string;
}

/**
 * Decorative context only. Keep estimates, labels and controls outside the image.
 *
 * The forecast pages keep their raster scenes (an owner exception to the
 * mosaic-only rule), so they have to load fast. Each scene ships at 720 px and
 * at 360 px (`{scene}-360.webp`, made from the 720 px master with sharp:
 * `sharp(src).resize({ width: 360 }).webp({ quality: 82 })`). The export does
 * not optimise images, so this is a plain <img> with its own srcset rather
 * than next/image, which would print only the 720 px file.
 */
export function SectionIllustration({ scene, className = '', priority = false, sizes = '(max-width: 760px) calc(100vw - 32px), 320px' }: SectionIllustrationProps) {
  const src = `/images/sections/${scene}.webp`;
  const srcSet = `/images/sections/${scene}-360.webp 360w, ${src} 720w`;
  // A <link rel="preload"> in the head, so the request starts with the HTML
  // instead of after the stylesheet and scripts have been parsed.
  if (priority) preload(src, { as: 'image', imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: 'high' });
  return (
    <figure aria-hidden="true" className={`section-illustration section-illustration--${scene} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image optimiser, so the srcset is written here */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt=""
        width={720}
        height={480}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </figure>
  );
}
