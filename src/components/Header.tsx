'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Globe } from "lucide-react";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

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
    { href: '/articles', label: t('nav.analysis') },
    { href: '/about', label: t('nav.about') },
  ];

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Link href="/" className="text-xl font-bold text-stone-900 hover:text-blue-700 transition-colors">
                estimador.pt
              </Link>
              <p className="text-xs text-stone-500">{t('homepage.tagline')}</p>
            </div>
            {pathname !== '/' && (
              <div className="border-l border-stone-200 pl-4">
                <h1 className="text-lg font-semibold text-stone-900">{getPageTitle()}</h1>
                {pathname === '/forecast' && (
                  <p className="text-xs text-stone-500">{t('forecast.subtitle')}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                    pathname === item.href
                      ? 'text-blue-700 bg-blue-50 font-medium'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="flex items-center gap-2 text-sm">
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
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}