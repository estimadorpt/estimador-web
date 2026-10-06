/**
 * Observable Plot output, made quiet for assistive technology.
 *
 * Plot writes `aria-label="line"`, `"dot"`, `"tip"` and so on onto role-less
 * <g> groups and leaves the <svg> itself unnamed: axe reports
 * aria-prohibited-attr on every mark, and a screen reader walks a list of
 * meaningless groups. Naming the svg with role="img" does not clear that (it
 * was tried in the round-1 audit); hiding the drawing does. Every chart on the
 * site already carries its accessible alternative: the DataCard (or section)
 * title and the <ChartTable> twin with every point the chart draws.
 *
 * Call it on whatever Plot.plot() returned, before inserting it:
 *
 *   el.replaceChildren(quietPlot(Plot.plot({ … })));
 *
 * Plot returns an <svg>, or a <figure> when it adds a legend or caption; the
 * attribute goes on that root either way, so the whole subtree is hidden.
 */
export function quietPlot<T extends Element>(plot: T): T {
  plot.setAttribute('aria-hidden', 'true');
  // An svg can be focusable in old engines; a hidden subtree must not be.
  if (plot.tagName.toLowerCase() === 'svg') plot.setAttribute('focusable', 'false');
  for (const svg of Array.from(plot.querySelectorAll('svg'))) svg.setAttribute('focusable', 'false');
  return plot;
}
