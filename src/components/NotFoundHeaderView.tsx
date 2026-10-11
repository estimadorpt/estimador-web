'use client';

import { ChevronDown, Menu, X } from 'lucide-react';
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
    <div role="group" aria-label={pt ? 'Idioma' : 'Language'} className="flex gap-0.5">
      {(['pt', 'en'] as const).map(target => (
        <a key={target} href={`/${target}/`} hrefLang={target} lang={target}
          aria-label={`${target.toUpperCase()}, ${target === 'pt' ? 'Português' : 'English'}`}
          aria-current={target === locale ? 'page' : undefined}
          className={`inline-flex items-center justify-center font-medium ${mobile ? 'min-h-11 min-w-11 px-3 text-[15px]' : 'min-h-10 min-w-9 px-1.5 text-[13px]'} ${target === locale ? 'font-bold text-ink underline decoration-2 underline-offset-[5px]' : 'text-graphite hover:text-ink'}`}>
          {target.toUpperCase()}
        </a>
      ))}
    </div>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-ink bg-paper">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-paper focus:px-4 focus:py-3 focus:text-ink">
        {pt ? 'Saltar para o conteúdo' : 'Skip to content'}
      </a>
      <div className="mx-auto flex h-[60px] max-w-7xl items-stretch justify-between gap-3 px-4">
        <a href={`/${locale}/`} className="brand-link inline-flex min-h-11 shrink-0 items-center self-center" aria-label={pt ? 'estimador.pt — página inicial' : 'estimador.pt — home'}>
          <span className="hidden sm:block" aria-hidden="true"><LogoHorizontal size={22} /></span>
          <span className="sm:hidden" aria-hidden="true"><LogoHorizontal size={18} /></span>
        </a>
        <div className="flex items-stretch gap-3">
          <nav aria-label={pt ? 'Navegação principal' : 'Main navigation'} className="hidden items-stretch lg:flex">
            {items.map(item => item.dropdown ? (
              <details key={item.id} className="group/menu relative flex">
                <summary className="inline-flex h-full cursor-pointer list-none items-center gap-1 px-3 text-[15px] font-medium text-ink hover:bg-field [&::-webkit-details-marker]:hidden">
                  {item.label}<ChevronDown aria-hidden="true" className="h-3 w-3 text-graphite group-open/menu:rotate-180" />
                </summary>
                <ul className="absolute right-0 top-full z-50 min-w-[16rem] border border-ink bg-paper py-1">
                  {item.dropdown.map(link => (
                    <li key={link.href}>
                      <a href={localeHref(locale, link.href)} className="block whitespace-nowrap px-4 py-2.5 text-[15px] text-ink hover:bg-field">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <a key={item.id} href={localeHref(locale, item.href!)} className="inline-flex items-center px-3 text-[15px] font-medium text-ink hover:bg-field">{item.label}</a>
            ))}
          </nav>
          <div className="hidden items-center border-l border-rule pl-3 lg:flex">{languages(false)}</div>
          {/* Below 1024px: the same hamburger as the site header, as a native disclosure. */}
          <details className="group/mobile flex lg:hidden">
            <summary aria-label={pt ? 'Menu' : 'Menu'} className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 self-center border-l border-rule pl-4 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <Menu aria-hidden="true" className="h-5 w-5 group-open/mobile:hidden" />
              <X aria-hidden="true" className="hidden h-5 w-5 group-open/mobile:block" />
              <span aria-hidden="true">Menu</span>
            </summary>
            {/* A full-height sheet, as the site header's (UXM3-08). */}
            <div className="absolute inset-x-0 top-full h-[calc(100dvh-61px)] overflow-y-auto border-t border-ink bg-paper">
              <nav aria-label={pt ? 'Navegação principal móvel' : 'Mobile main navigation'} className="mx-auto max-w-7xl px-4 py-2">
                {items.map(item => item.dropdown ? (
                  <details key={item.id} className="group/section">
                    <summary className="flex w-full cursor-pointer list-none items-center justify-between border-b border-grid py-3 text-[17px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                      {item.label}<ChevronDown aria-hidden="true" className="h-4 w-4 text-graphite group-open/section:rotate-180" />
                    </summary>
                    <ul className="border-b border-grid py-1 pl-4">
                      {item.dropdown.map(link => (
                        <li key={link.href}><a href={localeHref(locale, link.href)} className="block py-3 text-[15px] text-ink">{link.label}</a></li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <a key={item.id} href={localeHref(locale, item.href!)} className="block border-b border-grid py-3 text-[17px] font-medium text-ink">{item.label}</a>
                ))}
                <div className="mt-4 flex items-center gap-3">
                  <span className="mr-auto text-[15px] text-graphite">{pt ? 'Idioma' : 'Language'}</span>{languages(true)}
                </div>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
