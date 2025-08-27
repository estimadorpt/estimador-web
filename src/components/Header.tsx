'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Calendar, Globe } from "lucide-react";

interface HeaderProps {
  lastUpdate?: string;
}

export function Header({ lastUpdate }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/forecast') return t('forecast.title');
    if (pathname === '/about') return t('about.title');
    if (pathname === '/articles') return t('articles.title');
    if (pathname === '/methodology') return t('methodology.title');
    return '';
  };

  const navigationItems = [
    { href: '/', label: t('nav.home') },
    { href: '/forecast', label: t('nav.forecast') },
    { href: '/articles', label: t('nav.analysis') },
    { href: '/about', label: t('nav.about') },
  ];

  return (
    <header className="border-b border-green-medium bg-green-pale sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Link href="/" className="text-2xl font-bold text-green-dark hover:text-green-medium">
                estimador.pt
              </Link>
              <p className="text-sm text-green-dark/70">{t('homepage.tagline')}</p>
            </div>
            {pathname !== '/' && (
              <div className="border-l border-green-medium pl-4">
                <h1 className="text-xl font-bold text-green-dark">{getPageTitle()}</h1>
                {pathname === '/forecast' && (
                  <p className="text-sm text-green-dark/70">{t('forecast.subtitle')}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-green-dark'
                      : 'text-green-dark/70 hover:text-green-dark'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-dark/70" />
                <select 
                  value={locale}
                  onChange={(e) => {
                    const newLocale = e.target.value;
                    // This will be handled by next-intl routing
                    window.location.href = `/${newLocale}${pathname === '/' ? '' : pathname}`;
                  }}
                  className="text-sm text-green-dark/70 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  <option value="pt">PT</option>
                  <option value="en">EN</option>
                </select>
              </div>
              
              {lastUpdate && (
                <div className="flex items-center gap-1 text-xs text-green-dark/70">
                  <Calendar className="w-3 h-3" />
                  <span>{t('common.updated')} {lastUpdate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}