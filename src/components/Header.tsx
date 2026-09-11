'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Globe, Menu, X, ChevronDown } from 'lucide-react';
import { LogoHorizontal, LogoIconOnly } from './Logo';
import { useArticleLanguagePath } from '@/lib/article-navigation';

interface NavItem {
  id: string;
  href?: string;
  label: string;
  dropdown?: { href: string; label: string }[];
}

const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

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

  const navigationItems: NavItem[] = [
    { id: 'home', href: '/', label: t('nav.home') },
    { id: 'miniature', href: '/populacao', label: isPortuguese ? 'População' : 'Population' },
    { id: 'economics', href: '/economia', label: t('nav.economics') },
    {
      id: 'sport', label: t('nav.sport'),
      dropdown: [
        { href: '/desporto/liga', label: t('nav.liga') },
        { href: '/desporto/liga2', label: 'Liga Portugal 2' },
        { href: '/desporto/liga/jogadores', label: isPortuguese ? 'Jogadores' : 'Players' },
        { href: '/desporto/liga/simulador', label: isPortuguese ? 'Simulador' : 'Simulator' },
        { href: '/desporto/liga/jogo-previsoes', label: isPortuguese ? 'Jogo de previsões' : 'Prediction game' },
      ],
    },
    {
      id: 'elections', label: t('nav.elections'),
      dropdown: [
        { href: '/eleicoes/presidenciais', label: t('nav.presidential') },
        { href: '/eleicoes/legislativas', label: t('nav.parliamentary') },
        { href: '/eleicoes/mapa', label: t('nav.map') },
      ],
    },
    { id: 'articles', href: '/artigos', label: t('articles.title') },
    {
      id: 'about', label: t('nav.about'),
      dropdown: [
        { href: '/sobre', label: t('nav.about') },
        { href: '/metodologia', label: t('methodology.title') },
        { href: '/privacidade', label: isPortuguese ? 'Privacidade' : 'Privacy' },
      ],
    },
  ];

  const exactActive = (href: string) => pathname.replace(/\/$/, '') === href.replace(/\/$/, '');
  const sectionActive = (href: string) => exactActive(href) || (href !== '/' && pathname.startsWith(`${href}/`));
  const isActive = (item: NavItem) => item.href ? sectionActive(item.href) : item.dropdown?.some(sub => sectionActive(sub.href));
  const closeNavigation = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    setMobileExpanded(null);
  };

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
      <div className="flex gap-1 bg-stone-100 rounded-md p-0.5" aria-label={isPortuguese ? 'Idioma' : 'Language'}>
        {(['pt', 'en'] as const).map(targetLocale => {
          const href = targetLocale === 'pt' ? ptPath : enPath;
          const fallback = href !== pathname;
          const languageName = targetLocale === 'pt' ? 'Português' : 'English';
          const fallbackLabel = isPortuguese ? 'índice de artigos; tradução indisponível' : 'article index; translation unavailable';
          return (
            <Link key={targetLocale} href={href} locale={targetLocale} hrefLang={targetLocale} lang={targetLocale}
              onClick={closeNavigation} aria-label={fallback ? `${languageName}: ${fallbackLabel}` : languageName}
              aria-current={locale === targetLocale ? 'page' : undefined}
              title={fallback ? `${languageName}: ${fallbackLabel}` : languageName}
              className={`${mobile ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs'} rounded font-medium transition-colors ${focusStyle} ${locale === targetLocale ? 'bg-cream text-ink shadow-sm' : 'text-stone-600 hover:text-ink'}`}>
              {targetLocale.toUpperCase()}{fallback ? (isPortuguese ? ' · Índice' : ' · Index') : ''}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <>
    <header ref={headerRef} onKeyDown={handleEscape} className="border-b border-line bg-paper/95 backdrop-blur-sm sticky top-0 z-50">
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-cream focus:px-4 focus:py-3 focus:text-ink ${focusStyle}`}
        onClick={() => {
          const main = document.getElementById('main-content');
          main?.focus();
        }}>
        {isPortuguese ? 'Saltar para o conteúdo' : 'Skip to content'}
      </a>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" aria-label={isPortuguese ? 'estimador — página inicial' : 'estimador — home'}
          onClick={closeNavigation} className={`brand-link shrink-0 block rounded-sm ${focusStyle}`}>
          <span className="hidden sm:block" aria-hidden="true"><LogoHorizontal size={22} /></span>
          <span className="sm:hidden" aria-hidden="true"><LogoIconOnly size={30} /></span>
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
                  className={`text-sm px-2.5 py-2 rounded-md inline-flex items-center gap-1 transition-colors ${focusStyle} ${isActive(item) ? 'text-ink bg-ink/10 font-medium' : 'text-stone-600 hover:text-ink hover:bg-parchment'}`}>
                  {item.label}<ChevronDown aria-hidden="true" className={`w-3 h-3 ${openDropdown === item.id ? 'rotate-180' : ''}`} />
                </button>
                <ul id={`desktop-${item.id}`} hidden={openDropdown !== item.id} className="absolute top-full right-0 mt-1 bg-cream border border-line shadow-lg shadow-forest/10 rounded-md py-1 min-w-[210px] z-50">
                  {item.dropdown.map(sub => <li key={sub.href}>
                    <Link href={sub.href} onClick={closeNavigation} aria-current={exactActive(sub.href) ? 'page' : undefined}
                      className={`block px-4 py-2.5 text-sm ${focusStyle} ${exactActive(sub.href) ? 'text-ink bg-ink/5 font-medium' : 'text-stone-700 hover:bg-stone-100'}`}>
                      {sub.label}
                    </Link>
                  </li>)}
                </ul>
              </div>
            ) : (
              <Link key={item.id} href={item.href!} onClick={closeNavigation} aria-current={exactActive(item.href!) ? 'page' : undefined}
                className={`text-sm px-2.5 py-2 rounded-md ${focusStyle} ${isActive(item) ? 'text-ink bg-ink/10 font-medium' : 'text-stone-600 hover:text-ink hover:bg-parchment'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2"><Globe aria-hidden="true" className="w-4 h-4 text-stone-500" /><LanguageLinks /></div>
          <button type="button" ref={mobileToggleRef} onClick={() => setMobileMenuOpen(current => !current)}
            aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation"
            aria-label={isPortuguese ? (mobileMenuOpen ? 'Fechar menu' : 'Abrir menu') : (mobileMenuOpen ? 'Close menu' : 'Open menu')}
            className={`lg:hidden p-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md ${focusStyle}`}>
            {mobileMenuOpen ? <X aria-hidden="true" className="w-5 h-5" /> : <Menu aria-hidden="true" className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div id="mobile-navigation" hidden={!mobileMenuOpen} className="lg:hidden border-t border-line bg-paper max-h-[calc(100dvh-85px)] overflow-y-auto">
        <nav aria-label={isPortuguese ? 'Navegação principal móvel' : 'Mobile main navigation'} className="max-w-7xl mx-auto px-4 py-4 space-y-1">
          {navigationItems.map(item => item.dropdown ? (
            <div key={item.id}>
              <button type="button" aria-expanded={mobileExpanded === item.id} aria-controls={`mobile-${item.id}`}
                onClick={() => setMobileExpanded(current => current === item.id ? null : item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-base font-medium ${focusStyle} ${isActive(item) ? 'text-ink bg-ink/10' : 'text-stone-700 hover:bg-stone-100'}`}>
                {item.label}<ChevronDown aria-hidden="true" className={`w-4 h-4 ${mobileExpanded === item.id ? 'rotate-180' : ''}`} />
              </button>
              <ul id={`mobile-${item.id}`} hidden={mobileExpanded !== item.id} className="ml-4 mt-1 space-y-1">
                {item.dropdown.map(sub => <li key={sub.href}>
                  <Link href={sub.href} onClick={closeNavigation} aria-current={exactActive(sub.href) ? 'page' : undefined}
                    className={`block px-4 py-3 rounded-md text-sm ${focusStyle} ${exactActive(sub.href) ? 'text-ink bg-ink/5 font-medium' : 'text-stone-600 hover:bg-stone-100'}`}>
                    {sub.label}
                  </Link>
                </li>)}
              </ul>
            </div>
          ) : (
            <Link key={item.id} href={item.href!} onClick={closeNavigation} aria-current={exactActive(item.href!) ? 'page' : undefined}
              className={`block px-4 py-3 rounded-md text-base font-medium ${focusStyle} ${isActive(item) ? 'text-ink bg-ink/10' : 'text-stone-700 hover:bg-stone-100'}`}>
              {item.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-stone-200 flex items-center gap-3 px-4">
            <Globe aria-hidden="true" className="w-4 h-4 text-stone-500" /><span className="text-sm text-stone-600 mr-auto">{isPortuguese ? 'Idioma' : 'Language'}</span><LanguageLinks mobile />
          </div>
        </nav>
      </div>
    </header>
    {/* Skip-link target. Kept here, immediately after the navigation, so every
        page has one: the pages own their <main> and not all of them carry an id. */}
    <div id="main-content" tabIndex={-1} className="outline-none" />
    </>
  );
}
