'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar } from "lucide-react";

interface HeaderProps {
  lastUpdate?: string;
}

export function Header({ lastUpdate }: HeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case '/forecast':
        return 'Full Election Forecast';
      case '/about':
        return 'About';
      case '/articles':
        return 'Analysis & Articles';
      case '/methodology':
        return 'Methodology';
      default:
        return '';
    }
  };

  const navigationItems = [
    { href: '/', label: 'Home' },
    { href: '/forecast', label: 'Forecast' },
    { href: '/articles', label: 'Analysis' },
    { href: '/about', label: 'About' },
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
              <p className="text-sm text-green-dark/70">Portuguese Election Forecast</p>
            </div>
            {pathname !== '/' && (
              <div className="border-l border-green-medium pl-4">
                <h1 className="text-xl font-bold text-green-dark">{getPageTitle()}</h1>
                {pathname === '/forecast' && (
                  <p className="text-sm text-green-dark/70">Portugal Parliamentary Elections</p>
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
            
            {lastUpdate && (
              <div className="flex items-center gap-1 text-xs text-green-dark/70">
                <Calendar className="w-3 h-3" />
                <span>Updated {lastUpdate}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}