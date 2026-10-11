'use client';

import { Link } from '@/i18n/routing';
import { LIGA_TABS, type LigaPage } from './liga-tabs';

export type { LigaPage };

/**
 * Liga Portugal's tab row (Previsões, Jogadores, Contra o Modelo, Modelo,
 * Dados), under the site header and above the hero, in the page container:
 * the population row's look and behaviour (PopulationSectionNav), the
 * current page in semibold ink over a 2px ink rule, the others in ink at
 * rest, 44px targets. It wraps onto a second line on a phone instead of
 * scrolling sideways, so every tab is in view at every width and zoom.
 */
export function LigaSectionNav({ current, locale }: { current: LigaPage; locale: string }) {
  const pt = locale !== 'en';
  return (
    <nav aria-label={pt ? 'Secções da Liga Portugal' : 'Liga Portugal sections'} className="border-b border-rule bg-paper">
      {/* The page container's box (CONTAINER_CLASS without its padding, which the list carries). */}
      <div className="mx-auto w-full max-w-7xl">
        <ul className="flex flex-wrap gap-x-6 px-4">
          {LIGA_TABS.map(item => (
            <li key={item.key} className="shrink-0">
              <Link
                href={item.href}
                locale={locale}
                aria-current={item.key === current ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 text-[15px] text-ink transition-colors duration-150 ${item.key === current ? 'border-ink font-semibold' : 'border-transparent hover:border-rule'}`}
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
