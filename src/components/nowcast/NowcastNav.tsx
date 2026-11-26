'use client';

import { Link } from '@/i18n/routing';

export type NowcastPage = 'resumo' | 'sondagens' | 'deputados' | 'circulos';

const BASE = '/eleicoes/proximas-legislativas';

/** The live nowcast's pages, in the order a reader goes: the overview, the polls, the seats, the districts. */
export const NOWCAST_TABS: ReadonlyArray<{ key: NowcastPage; href: string; pt: string; en: string }> = [
  { key: 'resumo', href: BASE, pt: 'Resumo', en: 'Overview' },
  { key: 'sondagens', href: `${BASE}/sondagens`, pt: 'Sondagens', en: 'Polls' },
  { key: 'deputados', href: `${BASE}/deputados`, pt: 'Deputados', en: 'Seats' },
  { key: 'circulos', href: `${BASE}/circulos`, pt: 'Círculos', en: 'Districts' },
];

/**
 * The nowcast's tab row, under the site header and above the hero: Liga Portugal's look
 * (LigaSectionNav), the current page in semibold ink over a 2px ink rule, 44px targets,
 * wrapping on a phone instead of scrolling sideways.
 */
export function NowcastNav({ current, locale }: { current: NowcastPage; locale: string }) {
  const pt = locale !== 'en';
  return (
    <nav aria-label={pt ? 'Páginas das próximas legislativas' : 'Next parliamentary election pages'} className="border-b border-rule bg-paper">
      <div className="mx-auto w-full max-w-7xl">
        <ul className="flex flex-wrap gap-x-6 px-4">
          {NOWCAST_TABS.map(item => (
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
