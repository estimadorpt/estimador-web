'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Globe, Menu, X, ChevronDown } from "lucide-react";
import { LogoHorizontal, LogoIconOnly } from './Logo';
import { getSectionAccentColor } from '@/lib/config/sections';

interface DropdownItem {
  href: string;
  label: string;
}

interface NavItem {
  href?: string;
  label: string;
  dropdown?: DropdownItem[];
}

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const accentColor = getSectionAccentColor(pathname);

  const getPageTitle = () => {
    if (pathname.includes('/desporto/liga/metodologia')) return t('football.methodologyTitle');
    if (pathname.includes('/desporto/liga')) return t('football.title');
    if (pathname.includes('/eleicoes/presidenciais')) return t('sections.presidential2026');
    if (pathname.includes('/eleicoes/legislativas')) return t('forecast.title');
    if (pathname.includes('/eleicoes/mapa')) return t('map.title');
    if (pathname.includes('/metodologia')) return t('methodology.title');
    if (pathname.includes('/sobre')) return t('about.title');
    if (pathname.includes('/artigos')) return t('articles.title');
    return '';
  };

  const navigationItems: NavItem[] = [
    { href: '/', label: t('nav.home') },
    {
      label: t('nav.sport'),
      dropdown: [
        { href: '/desporto/liga', label: t('nav.liga') },
      ],
    },
    {
      label: t('nav.elections'),
      dropdown: [
        { href: '/eleicoes/presidenciais', label: t('nav.presidential') },
        { href: '/eleicoes/legislativas', label: t('nav.parliamentary') },
        { href: '/eleicoes/mapa', label: t('nav.map') },
      ],
    },
    { href: '/sobre', label: t('nav.about') },
  ];

  const isActive = (item: NavItem) => {
    if (item.href) return pathname === item.href;
    return item.dropdown?.some(d => pathname.startsWith(d.href));
  };

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-50 shadow-sm">
      {/* Section accent bar */}
      {accentColor && (
        <div className="h-1" style={{ backgroundColor: accentColor }} />
      )}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Link href="/" className="block hover:opacity-80 transition-opacity">
                <span className="hidden sm:block">
                  <LogoHorizontal showWordmark={true} />
                </span>
                <span className="sm:hidden">
                  <LogoIconOnly size={32} />
                </span>
              </Link>
            </div>
            {pathname !== '/' && (
              <div className="hidden sm:block border-l border-stone-200 pl-4">
                <h1 className="text-lg font-semibold text-stone-900">{getPageTitle()}</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1">
              {navigationItems.map((item) => {
                if (item.dropdown) {
                  const active = isActive(item);
                  return (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={`text-sm px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-1 ${
                          active
                            ? 'text-navy bg-navy/10 font-medium'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        {item.label}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {openDropdown === item.label && (
                        <div className="absolute top-full left-0 mt-0.5 bg-white border border-stone-200 shadow-lg rounded-md py-1 min-w-[180px] z-50">
                          {item.dropdown.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                pathname === sub.href || pathname.startsWith(sub.href + '/')
                                  ? 'text-navy bg-navy/5 font-medium'
                                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                      pathname === item.href
                        ? 'text-navy bg-navy/10 font-medium'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Language Switcher - Desktop */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-stone-400" />
              <div className="flex gap-1 bg-stone-100 rounded-md p-0.5">
                <Link
                  href={pathname}
                  locale="pt"
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    locale === 'pt'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  PT
                </Link>
                <Link
                  href={pathname}
                  locale="en"
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    locale === 'en'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  EN
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navigationItems.map((item) => {
              if (item.dropdown) {
                const expanded = mobileExpanded === item.label;
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => setMobileExpanded(expanded ? null : item.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive(item)
                          ? 'text-navy bg-navy/10'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.dropdown.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-4 py-2.5 rounded-md text-sm transition-colors ${
                              pathname === sub.href || pathname.startsWith(sub.href + '/')
                                ? 'text-navy bg-navy/5 font-medium'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-navy bg-navy/10'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Language Switcher - Mobile */}
            <div className="pt-4 mt-4 border-t border-stone-200">
              <div className="flex items-center gap-3 px-4">
                <Globe className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-500">{locale === 'pt' ? 'Idioma' : 'Language'}</span>
                <div className="flex gap-1 bg-stone-100 rounded-md p-0.5 ml-auto">
                  <Link
                    href={pathname}
                    locale="pt"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      locale === 'pt'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    PT
                  </Link>
                  <Link
                    href={pathname}
                    locale="en"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      locale === 'en'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    EN
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
