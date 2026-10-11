/**
 * The site's one decoration: the edge of a ruler. Graduations along an ink
 * rule (every 8px a minor tick, every 40px a longer one, every 80px a full one
 * in ink), the way a measuring instrument's scale runs along its edge.
 *
 * The ticks always point away from the page's content, so they never sit
 * beside a figure, where they would read as a chart's scale: in the header
 * they rise from its bottom rule into the bar ("up"), under the logo's side
 * only, ending a clear margin before the menu, so the current section's
 * underline never meets a tick; in the footer they hang from its top rule
 * ("down"). Both end on a full ink tick. Decorative and unlabelled: it
 * measures nothing.
 */
export function RulerEdge({ direction, className = '' }: { direction: 'up' | 'down'; className?: string }) {
  return (
    <div aria-hidden="true"
      className={`ruler-edge ruler-edge-fit pointer-events-none h-[7px] ${direction === 'up' ? 'ruler-edge-up' : ''} ${className}`} />
  );
}
