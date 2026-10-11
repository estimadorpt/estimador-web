/**
 * The one mark an empty, error, refused or unavailable state carries: an
 * instrument with no reading. The ruler is there, with its ticks, and where
 * the model's band would sit there is only its dashed outline: nothing to
 * read here yet. One drawing at every width, beside or above the message and
 * its next step; the 404 draws it larger (`size="lg"`). Never beside a
 * number or a chart, where it would read as a value.
 *
 * Decorative: the message carries the meaning. No hooks and no messages, so
 * server pages and client components both use it. In forced colours it is
 * drawn in CanvasText.
 */
export function EmptyStateMark({ size = 'sm', className = '' }: { size?: 'sm' | 'lg'; className?: string }) {
  const width = size === 'lg' ? 'w-28 md:w-[200px]' : 'w-18';
  return (
    <svg
      className={`empty-mark h-auto shrink-0 ${width} ${className}`}
      viewBox="0 0 96 40"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="31" y="11.5" width="34" height="13" fill="none" stroke="var(--color-graphite)" strokeWidth="1" strokeDasharray="3 2.5" />
      <rect x="2" y="33" width="92" height="1.5" fill="var(--color-ink)" />
      {[2, 25, 48, 71, 93].map(x => (
        <rect key={x} x={x} y="28" width="1" height="5" fill="var(--color-ink)" />
      ))}
    </svg>
  );
}
