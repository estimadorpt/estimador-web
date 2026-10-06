'use client';

import { useEffect, useRef, useState } from 'react';
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
 * region pages count as "Freguesias". On a phone the row scrolls sideways: it
 * opens scrolled to the current page, and a fade at the edge says there is
 * more past it ("Dados", "Metodologia").
 */
export function PopulationSectionNav({ current, locale }: { current: PopulationPage; locale: string }) {
  const active = current === 'parish' || current === 'region' ? 'hub' : current;
  const pt = locale === 'pt';
  const list = useRef<HTMLUListElement>(null);
  const [more, setMore] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });

  useEffect(() => {
    const row = list.current;
    if (!row) return;
    const item = row.querySelector<HTMLElement>('[aria-current="page"]');
    if (item && row.scrollWidth > row.clientWidth) {
      const left = item.offsetLeft - (row.clientWidth - item.offsetWidth) / 2;
      row.scrollLeft = Math.max(0, Math.min(left, row.scrollWidth - row.clientWidth));
    }
    const update = () => setMore({
      left: row.scrollLeft > 2,
      right: row.scrollLeft + row.clientWidth < row.scrollWidth - 2,
    });
    update();
    row.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => { row.removeEventListener('scroll', update); observer.disconnect(); };
  }, [active]);

  return (
    <nav aria-label={pt ? 'Secções da população' : 'Population sections'} className="border-b border-line bg-paper">
      <div className="relative mx-auto max-w-7xl">
        <ul ref={list} className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        {/* Edge fades: decoration only, they never catch a tap. */}
        {more.left && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-paper to-transparent" />}
        {more.right && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-paper to-transparent" />}
      </div>
    </nav>
  );
}
