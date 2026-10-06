'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Globe, Menu, X, ChevronDown } from 'lucide-react';
import { LogoHorizontal } from './Logo';
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
      <div role="group" className="flex gap-1 bg-stone-100 rounded-md p-0.5" aria-label={isPortuguese ? 'Idioma' : 'Language'}>
        {(['pt', 'en'] as const).map(targetLocale => {
          const href = targetLocale === 'pt' ? ptPath : enPath;
          const fallback = href !== pathname;
          const languageName = targetLocale === 'pt' ? 'Português' : 'English';
          // 44px in the mobile menu, 40px in the desktop bar (which stays
          // 60px tall). The current language is marked with a hairline, not
          // a shadow, so its focus keeps the global paper ring (A11Y2-18);
          // forced colours draw every border, so there it is underlined too
          // (A11Y3-11).
          const className = `inline-flex items-center justify-center rounded border font-medium transition-colors ${mobile ? 'min-h-11 min-w-11 px-3 text-sm' : 'min-h-10 min-w-10 px-2 text-xs'} ${locale === targetLocale ? 'border-line bg-cream text-ink forced-colors:underline forced-colors:decoration-2 forced-colors:underline-offset-4' : 'border-transparent text-stone-600 hover:text-ink'}`;
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
    }} className="border-b border-line bg-paper/95 backdrop-blur-sm sticky top-0 z-50">
      {/* Every page has exactly one main#main-content (tabIndex -1, so the
          jump moves focus) that opens with its hero; landmarks.test.ts. */}
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-cream focus:px-4 focus:py-3 focus:text-ink`}>
        {isPortuguese ? 'Saltar para o conteúdo' : 'Skip to content'}
      </a>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* The name starts with the wordmark it shows (A11Y3-M2). */}
        <Link href="/" aria-label={isPortuguese ? 'estimador.pt — página inicial' : 'estimador.pt — home'}
          onClick={closeNavigation} className="brand-link inline-flex min-h-11 shrink-0 items-center rounded-sm">
          <span className="hidden sm:block" aria-hidden="true"><LogoHorizontal size={22} /></span>
          <span className="sm:hidden" aria-hidden="true"><LogoHorizontal size={18} /></span>
        </Link>
        <div className="flex items-center gap-3">
          <nav aria-label={isPortuguese ? 'Navegação principal' : 'Main navigation'} className="hidden lg:flex gap-0.5">
            {navigationItems.map(item => item.dropdown ? (
              <div key={item.id} className="relative" onBlur={event => {
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
                  className={`text-sm px-2.5 py-2 rounded-md inline-flex items-center gap-1 transition-colors ${isActive(item) ? 'text-ink bg-ink/10 font-medium' : 'text-stone-600 hover:text-ink hover:bg-parchment'}`}>
                  {item.label}<ChevronDown aria-hidden="true" className={`w-3 h-3 ${openDropdown === item.id ? 'rotate-180' : ''}`} />
                </button>
                <ul id={`desktop-${item.id}`} hidden={openDropdown !== item.id} className="absolute top-full right-0 mt-1 bg-cream border border-line shadow-lg shadow-forest/10 rounded-md py-1 min-w-[16rem] z-50">
                  {item.dropdown.map(sub => <li key={sub.href}>
                    <Link href={sub.href} onClick={closeNavigation} aria-current={exactActive(sub.href) ? 'page' : undefined}
                      className={`block whitespace-nowrap px-4 py-2.5 text-sm ${exactActive(sub.href) ? 'text-ink bg-ink/5 font-medium' : 'text-stone-700 hover:bg-stone-100'}`}>
                      {sub.label}
                    </Link>
                  </li>)}
                </ul>
              </div>
            ) : (
              <Link key={item.id} href={item.href!} onClick={closeNavigation} aria-current={exactActive(item.href!) ? 'page' : undefined}
                className={`text-sm px-2.5 py-2 rounded-md ${isActive(item) ? 'text-ink bg-ink/10 font-medium' : 'text-stone-600 hover:text-ink hover:bg-parchment'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2"><Globe aria-hidden="true" className="w-4 h-4 text-stone-500" /><LanguageLinks /></div>
          <button type="button" ref={mobileToggleRef} onClick={() => setMobileMenuOpen(current => !current)}
            aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation"
            aria-label={isPortuguese ? (mobileMenuOpen ? 'Fechar menu' : 'Abrir menu') : (mobileMenuOpen ? 'Close menu' : 'Open menu')}
            className={`lg:hidden p-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md`}>
            {mobileMenuOpen ? <X aria-hidden="true" className="w-5 h-5" /> : <Menu aria-hidden="true" className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {/* A full-height sheet under the 60px bar: shorter, the page showed
          through below it and read as part of the menu (UXM3-08). */}
      <div id="mobile-navigation" hidden={!mobileMenuOpen} className="lg:hidden border-t border-line bg-paper h-[calc(100dvh-61px)] overflow-y-auto overscroll-contain">
        <nav aria-label={isPortuguese ? 'Navegação principal móvel' : 'Mobile main navigation'} className="max-w-7xl mx-auto px-4 py-4 space-y-1">
          {navigationItems.map(item => item.dropdown ? (
            <div key={item.id}>
              <button type="button" aria-expanded={mobileExpanded === item.id} aria-controls={`mobile-${item.id}`}
                onClick={() => setMobileExpanded(current => current === item.id ? null : item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-base font-medium ${isActive(item) ? 'text-ink bg-ink/10' : 'text-stone-700 hover:bg-stone-100'}`}>
                {item.label}<ChevronDown aria-hidden="true" className={`w-4 h-4 ${mobileExpanded === item.id ? 'rotate-180' : ''}`} />
              </button>
              <ul id={`mobile-${item.id}`} hidden={mobileExpanded !== item.id} className="ml-4 mt-1 space-y-1">
                {item.dropdown.map(sub => <li key={sub.href}>
                  <Link href={sub.href} onClick={closeNavigation} aria-current={exactActive(sub.href) ? 'page' : undefined}
                    className={`block px-4 py-3 rounded-md text-sm ${exactActive(sub.href) ? 'text-ink bg-ink/5 font-medium' : 'text-stone-600 hover:bg-stone-100'}`}>
                    {sub.label}
                  </Link>
                </li>)}
              </ul>
            </div>
          ) : (
            <Link key={item.id} href={item.href!} onClick={closeNavigation} aria-current={exactActive(item.href!) ? 'page' : undefined}
              className={`block px-4 py-3 rounded-md text-base font-medium ${isActive(item) ? 'text-ink bg-ink/10' : 'text-stone-700 hover:bg-stone-100'}`}>
              {item.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-stone-200 flex items-center gap-3 px-4">
            <Globe aria-hidden="true" className="w-4 h-4 text-stone-500" /><span className="text-sm text-stone-600 mr-auto">{isPortuguese ? 'Idioma' : 'Language'}</span><LanguageLinks mobile />
          </div>
        </nav>
      </div>
    </header>
  );
}
