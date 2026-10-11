'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Menu, X, ChevronDown } from 'lucide-react';
import { LogoHorizontal } from './Logo';
import { RulerEdge } from '@/components/instrument/RulerEdge';
import { useArticleLanguagePath, useHasArticles } from '@/lib/article-navigation';
import { ECONOMY_PUBLISHED } from '@/lib/config/economy-status';
import { isExactPath, isNavItemActive, siteNavigation, type NavLabels } from '@/components/brand/site-navigation';

// Keyboard focus is the global double ring in globals.css (CLAUDE.md,
// "Primitives"); nothing here declares its own outline.

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const dropdownButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const ptPath = useArticleLanguagePath(pathname, 'pt');
  const enPath = useArticleLanguagePath(pathname, 'en');
  const isPortuguese = locale === 'pt';
  const hasArticles = useHasArticles(locale);
  // The parish shell is one exported page behind a rewrite, with no RSC
  // payload of its own: its language switch is a plain anchor built from the
  // real address (upper-case code, trailing slash), never /freguesia/_/.
  const [parishPath, setParishPath] = useState<string | null>(null);
  useEffect(() => {
    const match = /\/populacao\/freguesia\/([^/]+)\/?$/.exec(window.location.pathname);
    setParishPath(match && match[1] !== '_' ? `/populacao/freguesia/${decodeURIComponent(match[1]).toUpperCase()}/` : null);
  }, [pathname]);

  // The navigation is defined once (site-navigation.ts) and shared with the
  // root 404's static header. The labels are read here with literal keys, so
  // the client message payload test (client-messages.test.ts) sees each one.
  const labels: NavLabels = {
    home: t('nav.home'),
    population: t('nav.population'),
    populationSearch: t('nav.populationSearch'),
    populationGame: t('nav.populationGame'),
    populationData: t('nav.populationData'),
    populationQuality: t('nav.populationQuality'),
    populationMethodology: t('nav.populationMethodology'),
    sport: t('nav.sport'),
    game: t('nav.game'),
    elections: t('nav.elections'),
    electionsArchive: t('elections.navArchiveGuide'),
    electionsPresidential: t('elections.navPresidential'),
    electionsParliamentary: t('elections.navParliamentary'),
    electionsMethodology: t('elections.navMethodology'),
    economics: t('nav.economics'),
    economicsPreparing: t('nav.economicsPreparing'),
    articles: t('articles.title'),
    about: t('nav.about'),
    aboutSite: t('about.title'),
    methodology: t('methodology.title'),
  };
  const navigationItems = siteNavigation(labels, { locale, hasArticles, economyPublished: ECONOMY_PUBLISHED });

  const exactActive = (href: string) => isExactPath(pathname, href);
  const isActive = (item: (typeof navigationItems)[number]) => isNavItemActive(item, pathname);
  const closeNavigation = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    setMobileExpanded(null);
  };

  // The open mobile menu holds the page still beneath it, and lets it go on
  // close (or when the header unmounts).
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = previous; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) closeNavigation();
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  function handleEscape(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') return;
    if (mobileMenuOpen) {
      closeNavigation();
      mobileToggleRef.current?.focus();
      event.preventDefault();
    } else if (openDropdown) {
      dropdownButtons.current[openDropdown]?.focus();
      setOpenDropdown(null);
      event.preventDefault();
    }
  }

  function openAndFocusDropdown(id: string, last = false) {
    setOpenDropdown(id);
    requestAnimationFrame(() => {
      const links = headerRef.current?.querySelectorAll<HTMLAnchorElement>(`#desktop-${id} a`);
      links?.[last ? links.length - 1 : 0]?.focus();
    });
  }

  function LanguageLinks({ mobile = false }: { mobile?: boolean }) {
    return (
      <div role="group" className="flex gap-0.5" aria-label={isPortuguese ? 'Idioma' : 'Language'}>
        {(['pt', 'en'] as const).map(targetLocale => {
          const href = targetLocale === 'pt' ? ptPath : enPath;
          const fallback = href !== pathname;
          const languageName = targetLocale === 'pt' ? 'Português' : 'English';
          // 44px in the mobile menu, 40px in the desktop bar (which stays
          // 60px tall). The current language is set bold and underlined, in
          // every colour mode (A11Y3-11).
          const className = `inline-flex items-center justify-center font-medium ${mobile ? 'min-h-11 min-w-11 px-3 text-[15px]' : 'min-h-10 min-w-9 px-1.5 text-[13px]'} ${locale === targetLocale ? 'font-bold text-ink underline decoration-2 underline-offset-[5px]' : 'text-graphite hover:text-ink'}`;
          // The accessible name starts with what the link shows ("PT"), so a
          // reader who says what they see can follow it (A11Y3-M2, WCAG 2.5.3).
          const code = targetLocale.toUpperCase();
          // In the shell's static HTML (code "_") the parish is not known yet: link
          // the population hub until mount, never /freguesia/_/, a not-found page (SPV-03).
          const plainPath = parishPath ?? (/\/populacao\/freguesia\/_\/?$/.test(pathname) ? '/populacao/' : null);
          if (plainPath) return (
            <a key={targetLocale} href={`/${targetLocale}${plainPath}`} hrefLang={targetLocale} lang={targetLocale}
              onClick={closeNavigation} aria-label={`${code}, ${languageName}`} title={languageName}
              aria-current={locale === targetLocale ? 'page' : undefined} className={className}>
              {code}
            </a>
          );
          const fallbackLabel = isPortuguese ? 'índice de artigos; tradução indisponível' : 'article index; translation unavailable';
          const visible = `${code}${fallback ? (isPortuguese ? ' · Índice' : ' · Index') : ''}`;
          return (
            <Link key={targetLocale} href={href} locale={targetLocale} hrefLang={targetLocale} lang={targetLocale}
              onClick={closeNavigation} aria-label={fallback ? `${visible}, ${languageName}: ${fallbackLabel}` : `${visible}, ${languageName}`}
              aria-current={locale === targetLocale ? 'page' : undefined}
              title={fallback ? `${languageName}: ${fallbackLabel}` : languageName}
              className={className}>
              {visible}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <header ref={headerRef} onKeyDown={handleEscape} onBlur={event => {
      // Keyboard focus that leaves the header closes the menus, so nothing
      // focused can sit hidden under the open mobile panel. A null target
      // (a tap on the panel's own padding) is not a departure; pointerdown
      // outside the header already covers taps elsewhere.
      const next = event.relatedTarget;
      if (next instanceof Node && !event.currentTarget.contains(next)) closeNavigation();
    }} className="sticky top-0 z-50 border-b border-ink bg-paper">
      {/* Every page has exactly one main#main-content (tabIndex -1, so the
          jump moves focus) that opens with its hero; landmarks.test.ts. */}
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-paper focus:px-4 focus:py-3 focus:text-ink`}>
        {isPortuguese ? 'Saltar para o conteúdo' : 'Skip to content'}
      </a>
      <div className="max-w-7xl mx-auto flex h-[60px] items-stretch justify-between gap-3 px-4">
        {/* The logo's side of the bar: the ruler's edge rises from the bar's
            bottom rule here only, ending a clear margin before the menu, so
            the current section's underline never meets a tick. */}
        <div className="relative flex min-w-0 flex-1 items-center">
          <RulerEdge direction="up" className="absolute bottom-0 left-0 [--ruler-clear:24px]" />
          {/* The name starts with the wordmark it shows (A11Y3-M2). */}
          <Link href="/" aria-label={isPortuguese ? 'estimador.pt — página inicial' : 'estimador.pt — home'}
            onClick={closeNavigation} className="brand-link inline-flex min-h-11 shrink-0 items-center">
            <span className="hidden sm:block" aria-hidden="true"><LogoHorizontal size={22} /></span>
            <span className="sm:hidden" aria-hidden="true"><LogoHorizontal size={18} /></span>
          </Link>
        </div>
        <div className="flex items-stretch gap-3">
          <nav aria-label={isPortuguese ? 'Navegação principal' : 'Main navigation'} className="hidden lg:flex items-stretch">
            {navigationItems.map(item => item.dropdown ? (
              <div key={item.id} className="relative flex" onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenDropdown(current => current === item.id ? null : current);
              }}>
                <button type="button" ref={element => { dropdownButtons.current[item.id] = element; }}
                  aria-expanded={openDropdown === item.id} aria-controls={`desktop-${item.id}`}
                  onClick={() => setOpenDropdown(current => current === item.id ? null : item.id)}
                  onKeyDown={event => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                      event.preventDefault();
                      openAndFocusDropdown(item.id, event.key === 'ArrowUp');
                    }
                  }}
                  className={`relative inline-flex items-center gap-1 px-3 text-[15px] hover:bg-field ${isActive(item) ? 'font-bold text-ink after:absolute after:inset-x-3 after:-bottom-px after:border-b-[3px] after:border-ink forced-colors:after:border-[Highlight]' : 'font-medium text-ink'}`}>
                  {item.label}<ChevronDown aria-hidden="true" className={`h-3 w-3 text-graphite ${openDropdown === item.id ? 'rotate-180' : ''}`} />
                </button>
                <ul id={`desktop-${item.id}`} hidden={openDropdown !== item.id} className="absolute right-0 top-full z-50 min-w-[16rem] border border-ink bg-paper py-1">
                  {item.dropdown.map(sub => <li key={sub.href}>
                    <Link href={sub.href} onClick={closeNavigation} aria-current={exactActive(sub.href) ? 'page' : undefined}
                      className={`block whitespace-nowrap px-4 py-2.5 text-[15px] ${exactActive(sub.href) ? 'font-bold text-ink underline decoration-2 underline-offset-4' : 'text-ink hover:bg-field'}`}>
                      {sub.label}
                    </Link>
                  </li>)}
                </ul>
              </div>
            ) : (
              <Link key={item.id} href={item.href!} onClick={closeNavigation} aria-current={exactActive(item.href!) ? 'page' : undefined}
                className={`relative inline-flex items-center gap-1 px-3 text-[15px] hover:bg-field ${isActive(item) ? 'font-bold text-ink after:absolute after:inset-x-3 after:-bottom-px after:border-b-[3px] after:border-ink forced-colors:after:border-[Highlight]' : 'font-medium text-ink'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:flex items-center border-l border-rule pl-3"><LanguageLinks /></div>
          <button type="button" ref={mobileToggleRef} onClick={() => setMobileMenuOpen(current => !current)}
            aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation"
            aria-label={isPortuguese ? (mobileMenuOpen ? 'Fechar menu' : 'Abrir menu') : (mobileMenuOpen ? 'Close menu' : 'Open menu')}
            className="lg:hidden inline-flex min-h-11 items-center gap-2 self-center border-l border-rule pl-4 text-[15px] font-semibold text-ink">
            {mobileMenuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            <span aria-hidden="true">{isPortuguese ? (mobileMenuOpen ? 'Fechar' : 'Menu') : (mobileMenuOpen ? 'Close' : 'Menu')}</span>
          </button>
        </div>
      </div>
      {/* A full-height sheet under the 60px bar: shorter, the page showed
          through below it and read as part of the menu (UXM3-08). */}
      <div id="mobile-navigation" hidden={!mobileMenuOpen} className="lg:hidden bg-paper h-[calc(100dvh-61px)] overflow-y-auto overscroll-contain">
        <nav aria-label={isPortuguese ? 'Navegação principal móvel' : 'Mobile main navigation'} className="max-w-7xl mx-auto px-4 py-2">
          {navigationItems.map(item => item.dropdown ? (
            <div key={item.id}>
              <button type="button" aria-expanded={mobileExpanded === item.id} aria-controls={`mobile-${item.id}`}
                onClick={() => setMobileExpanded(current => current === item.id ? null : item.id)}
                className={`flex w-full items-center justify-between border-b border-grid py-3 text-[17px] ${isActive(item) ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
                {item.label}<ChevronDown aria-hidden="true" className={`h-4 w-4 text-graphite ${mobileExpanded === item.id ? 'rotate-180' : ''}`} />
              </button>
              <ul id={`mobile-${item.id}`} hidden={mobileExpanded !== item.id} className="border-b border-grid py-1 pl-4">
                {item.dropdown.map(sub => <li key={sub.href}>
                  <Link href={sub.href} onClick={closeNavigation} aria-current={exactActive(sub.href) ? 'page' : undefined}
                    className={`block py-3 text-[15px] ${exactActive(sub.href) ? 'font-bold text-ink underline decoration-2 underline-offset-4' : 'text-ink'}`}>
                    {sub.label}
                  </Link>
                </li>)}
              </ul>
            </div>
          ) : (
            <Link key={item.id} href={item.href!} onClick={closeNavigation} aria-current={exactActive(item.href!) ? 'page' : undefined}
              className={`block border-b border-grid py-3 text-[17px] ${isActive(item) ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
              {item.label}
            </Link>
          ))}
          <div className="mt-4 flex items-center gap-3">
            <span className="mr-auto text-[15px] text-graphite">{isPortuguese ? 'Idioma' : 'Language'}</span><LanguageLinks mobile />
          </div>
        </nav>
      </div>
    </header>
  );
}
