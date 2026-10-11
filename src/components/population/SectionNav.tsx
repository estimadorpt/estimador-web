'use client';

import { Link } from '@/i18n/routing';
import { POPULATION_ROUTES } from '@/lib/config/population';

export type PopulationPage = 'hub' | 'parish' | 'region' | 'game' | 'quality' | 'data' | 'methodology';

const ITEMS: Array<{ key: PopulationPage; href: string; pt: string; en: string }> = [
  { key: 'hub', href: POPULATION_ROUTES.hub, pt: 'Freguesias', en: 'Parishes' },
  { key: 'game', href: POPULATION_ROUTES.game, pt: 'Freguesia misteriosa', en: 'Mystery parish' },
  { key: 'quality', href: POPULATION_ROUTES.quality, pt: 'Qualidade', en: 'Quality' },
  { key: 'data', href: POPULATION_ROUTES.data, pt: 'Dados', en: 'Data' },
  { key: 'methodology', href: POPULATION_ROUTES.methodology, pt: 'Metodologia', en: 'Methodology' },
];

/**
 * The population section's own row of links, under the site header and above
 * the page hero (the instrument's tab row: the current page in semibold ink
 * over a 2px ink rule, the others in ink at rest). Parish and
 * region pages count as "Freguesias". On a phone the row wraps onto a second
 * line rather than scrolling sideways: a scrolling row hid "Dados" and
 * "Metodologia" past the edge, and its edge fade did not read as "there is
 * more" (CL3-04, PUB3-05). Every tab is in view at every width and zoom.
 */
export function PopulationSectionNav({ current, locale }: { current: PopulationPage; locale: string }) {
  const active = current === 'parish' || current === 'region' ? 'hub' : current;
  const pt = locale === 'pt';

  return (
    <nav aria-label={pt ? 'Secções da população' : 'Population sections'} className="border-b border-rule bg-paper">
      {/* The page container's box (CONTAINER_CLASS without its padding, which the list carries). */}
      <div className="mx-auto w-full max-w-7xl">
        <ul className="flex flex-wrap gap-x-6 px-4">
          {ITEMS.map(item => (
            <li key={item.key} className="shrink-0">
              <Link
                href={item.href}
                locale={locale}
                aria-current={item.key === active ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 text-[15px] text-ink transition-colors duration-150 ${item.key === active ? 'border-ink font-semibold' : 'border-transparent hover:border-rule'}`}
              >
                {pt ? item.pt : item.en}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
