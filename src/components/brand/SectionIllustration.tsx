import Image from 'next/image';

export type IllustrationScene = 'economy' | 'football' | 'elections';

/** Decorative context only. Keep estimates, labels and controls outside the image. */
export function SectionIllustration({ scene, className = '' }: { scene: IllustrationScene; className?: string }) {
  return (
    <figure aria-hidden="true" className={`section-illustration section-illustration--${scene} ${className}`}>
      <Image src={`/images/sections/${scene}.webp`} alt="" width={720} height={480} sizes="(max-width: 760px) 360px, 295px" />
    </figure>
  );
}
