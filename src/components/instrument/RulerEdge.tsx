import { CONTAINER_CLASS } from '@/components/brand/Container';

/**
 * The site's one decoration: the edge of a ruler. Graduations hang from an
 * ink rule along the content column (every 8px a minor tick, every 40px a
 * longer one, every 80px a full one in ink), the way a measuring
 * instrument's scale runs along its edge. Under the header and on the
 * footer's rule only, never beside a figure, where it would read as a scale.
 * Decorative and unlabelled: it measures nothing.
 */
export function RulerEdge({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <div className={CONTAINER_CLASS}>
        <div className="ruler-edge h-[7px]" />
      </div>
    </div>
  );
}
