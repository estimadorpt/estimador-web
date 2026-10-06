import type { MDXComponents } from 'mdx/types';
import { CoalitionDotPlot } from '@/components/charts/CoalitionDotPlot';
import { PollingChart } from '@/components/charts/PollingChart';
import { SeatChart } from '@/components/charts/SeatChart';
import { HouseEffects } from '@/components/charts/HouseEffects';
import { DistrictSummary } from '@/components/charts/DistrictSummary';

/**
 * The chart components an article can call with inline data:
 *   <Figure caption="…" source="…"><SeatChart data={[…]} /></Figure>
 * Only the article page passes them (getMDXComponents(ARTICLE_CHARTS)): a
 * module that imports them makes every page that imports it load Observable
 * Plot and d3, and the prose pages (about, privacy, the methodologies) draw no
 * chart (SP2-01).
 */
export const ARTICLE_CHARTS: MDXComponents = {
  CoalitionDotPlot,
  PollingChart,
  SeatChart,
  HouseEffects,
  DistrictSummary,
};
