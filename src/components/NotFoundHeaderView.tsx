'use client';

import { ChevronDown, Globe, Menu, X } from 'lucide-react';
import { LogoHorizontal } from '@/components/Logo';
import type { NavItem } from '@/components/brand/site-navigation';

/** A section address with the locale written out and the export's trailing slash. */
const localeHref = (locale: string, href: string) => `/${locale}${href === '/' ? '/' : `${href}/`}`;

/**
 * The markup of the root 404's header (src/app/not-found.tsx builds the items).
 * It is a client component only so that the root not-found, which Next puts
 * into every exported page's RSC payload, carries a reference and the item
 * list instead of the whole menu markup twice (about 40 KB per page). It uses
 * no state or effects: the 404.html it renders is the same static HTML, the
 * menus are native <details> and work without JavaScript.
 */
export function NotFoundHeaderView({ locale, items }: { locale: 'pt' | 'en'; items: NavItem[] }) {
  const pt = locale === 'pt';
  const languages = (mobile: boolean) => (
    <div role="group" aria-label={pt ? 'Idioma' : 'Language'} className="flex gap-1 rounded-md bg-stone-100 p-0.5">
      {(['pt', 'en'] as const).map(target => (
        <a key={target} href={`/${target}/`} hrefLang={target} lang={target}
          aria-label={target === 'pt' ? 'Português' : 'English'}
          aria-current={target === locale ? 'page' : undefined}
          className={`inline-flex items-center justify-center rounded border font-medium ${mobile ? 'min-h-11 min-w-11 px-3 text-sm' : 'min-h-10 min-w-10 px-2 text-xs'} ${target === locale ? 'border-line bg-cream text-ink' : 'border-transparent text-stone-600 hover:text-ink'}`}>
          {target.toUpperCase()}
        </a>
      ))}
    </div>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-cream focus:px-4 focus:py-3 focus:text-ink">
        {pt ? 'Saltar para o conteúdo' : 'Skip to content'}
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
        <a href={`/${locale}/`} className="brand-link inline-flex min-h-11 shrink-0 items-center rounded-sm" aria-label={pt ? 'estimador — página inicial' : 'estimador — home'}>
          <span className="hidden sm:block" aria-hidden="true"><LogoHorizontal size={22} /></span>
          <span className="sm:hidden" aria-hidden="true"><LogoHorizontal size={18} /></span>
        </a>
        <div className="flex items-center gap-3">
          <nav aria-label={pt ? 'Navegação principal' : 'Main navigation'} className="hidden gap-0.5 lg:flex">
            {items.map(item => item.dropdown ? (
              <details key={item.id} className="group/menu relative">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md px-2.5 py-2 text-sm text-stone-600 transition-colors hover:bg-parchment hover:text-ink [&::-webkit-details-marker]:hidden">
                  {item.label}<ChevronDown aria-hidden="true" className="h-3 w-3 group-open/menu:rotate-180" />
                </summary>
                <ul className="absolute right-0 top-full z-50 mt-1 min-w-[16rem] rounded-md border border-line bg-cream py-1 shadow-lg shadow-forest/10">
                  {item.dropdown.map(link => (
                    <li key={link.href}>
                      <a href={localeHref(locale, link.href)} className="block whitespace-nowrap px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <a key={item.id} href={localeHref(locale, item.href!)} className="rounded-md px-2.5 py-2 text-sm text-stone-600 hover:bg-parchment hover:text-ink">{item.label}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex"><Globe aria-hidden="true" className="h-4 w-4 text-stone-500" />{languages(false)}</div>
          {/* Below 1024px: the same hamburger as the site header, as a native disclosure. */}
          <details className="group/mobile lg:hidden">
            <summary aria-label={pt ? 'Menu' : 'Menu'} className="inline-flex cursor-pointer list-none rounded-md p-3 text-stone-600 hover:bg-stone-100 hover:text-stone-900 [&::-webkit-details-marker]:hidden">
              <Menu aria-hidden="true" className="h-5 w-5 group-open/mobile:hidden" />
              <X aria-hidden="true" className="hidden h-5 w-5 group-open/mobile:block" />
            </summary>
            <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-85px)] overflow-y-auto border-y border-line bg-paper">
              <nav aria-label={pt ? 'Navegação principal móvel' : 'Mobile main navigation'} className="mx-auto max-w-7xl space-y-1 px-4 py-4">
                {items.map(item => item.dropdown ? (
                  <details key={item.id} className="group/section">
                    <summary className="flex w-full cursor-pointer list-none items-center justify-between rounded-md px-4 py-3 text-base font-medium text-stone-700 hover:bg-stone-100 [&::-webkit-details-marker]:hidden">
                      {item.label}<ChevronDown aria-hidden="true" className="h-4 w-4 group-open/section:rotate-180" />
                    </summary>
                    <ul className="ml-4 mt-1 space-y-1">
                      {item.dropdown.map(link => (
                        <li key={link.href}><a href={localeHref(locale, link.href)} className="block rounded-md px-4 py-3 text-sm text-stone-600 hover:bg-stone-100">{link.label}</a></li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <a key={item.id} href={localeHref(locale, item.href!)} className="block rounded-md px-4 py-3 text-base font-medium text-stone-700 hover:bg-stone-100">{item.label}</a>
                ))}
                <div className="mt-4 flex items-center gap-3 border-t border-stone-200 px-4 pt-4">
                  <Globe aria-hidden="true" className="h-4 w-4 text-stone-500" /><span className="mr-auto text-sm text-stone-600">{pt ? 'Idioma' : 'Language'}</span>{languages(true)}
                </div>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
