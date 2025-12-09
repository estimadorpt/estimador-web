'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Globe, Menu, X } from "lucide-react";
import { LogoHorizontal, LogoIconOnly } from './Logo';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getPageTitle = () => {
    if (pathname === '/forecast') return t('forecast.title');
    if (pathname === '/about') return t('about.title');
    if (pathname === '/articles') return t('articles.title');
    if (pathname === '/methodology') return t('methodology.title');
    if (pathname === '/map') return t('map.title');
    return '';
  };

  const navigationItems = [
    { href: '/', label: t('nav.home') },
    { href: '/forecast', label: t('nav.parliamentaryForecast') },
    { href: '/map', label: t('nav.map') },
    { href: '/about', label: t('nav.about') },
  ];

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Link href="/" className="block hover:opacity-80 transition-opacity">
                {/* Desktop: Full horizontal logo */}
                <span className="hidden sm:block">
                  <LogoHorizontal showWordmark={true} />
                </span>
                {/* Mobile: Icon only */}
                <span className="sm:hidden">
                  <LogoIconOnly size={32} />
                </span>
              </Link>
              <p className="text-xs text-stone-500 hidden sm:block mt-0.5">{t('homepage.tagline')}</p>
            </div>
            {pathname !== '/' && (
              <div className="hidden sm:block border-l border-stone-200 pl-4">
                <h1 className="text-lg font-semibold text-stone-900">{getPageTitle()}</h1>
                {pathname === '/forecast' && (
                  <p className="text-xs text-stone-500">{t('forecast.subtitle')}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                    pathname === item.href
                      ? 'text-navy bg-navy/10 font-medium'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
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
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-navy bg-navy/10'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Language Switcher - Mobile */}
            <div className="pt-4 mt-4 border-t border-stone-200">
              <div className="flex items-center gap-3 px-4">
                <Globe className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-500">Language</span>
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