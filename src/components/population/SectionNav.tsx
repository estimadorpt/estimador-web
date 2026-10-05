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
 * The population section's own row of links, under the page hero. Parish and
 * region pages count as "Freguesias".
 */
export function PopulationSectionNav({ current, locale }: { current: PopulationPage; locale: string }) {
  const active = current === 'parish' || current === 'region' ? 'hub' : current;
  const pt = locale === 'pt';
  return (
    <nav aria-label={pt ? 'Secções da população' : 'Population sections'} className="border-b border-line bg-paper">
      <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
        {ITEMS.map(item => (
          <li key={item.key} className="shrink-0">
            <Link
              href={item.href}
              locale={locale}
              aria-current={item.key === active ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors duration-150 ${item.key === active ? 'border-ink text-ink' : 'border-transparent text-stone-500 hover:text-ink'}`}
            >
              {pt ? item.pt : item.en}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
