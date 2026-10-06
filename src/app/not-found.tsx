import './globals.css';
import { getTranslations } from 'next-intl/server';
import { LocaleOnlyProvider } from '@/components/LocaleOnlyProvider';
import { LogoHorizontal } from '@/components/Logo';
import { NotFoundBody } from '@/components/NotFoundBody';
import { NotFoundByPath } from '@/components/NotFoundSwitch';
import { SiteFooter } from '@/components/SiteFooter';
import { fontVariables } from './fonts';

// Sets <html lang> from the address before the first paint, so the English
// 404 is never read with Portuguese pronunciation while it hydrates (or by a
// reader without JavaScript). NotFoundByPath keeps it in step afterwards.
const LANG_FROM_PATH = "if(/^\\/en(\\/|$)/.test(location.pathname))document.documentElement.lang='en'";

/**
 * The 404's own header. It renders outside the locale layout, where the site
 * Header (client hooks, the article index, next-intl's Link) has nothing to
 * read, so it is a static copy: the sections as plain anchors with the
 * locale written out, and a PT/EN switch to each language's start page (an
 * address that is missing in one language is missing in both).
 */
async function NotFoundHeader({ locale }: { locale: 'pt' | 'en' }) {
  const t = await getTranslations({ locale });
  const pt = locale === 'pt';
  const links = [
    { href: `/${locale}/populacao/`, label: t('nav.population') },
    { href: `/${locale}/desporto/liga/`, label: t('nav.liga') },
    { href: `/${locale}/eleicoes/arquivo/`, label: t('nav.elections') },
    { href: `/${locale}/sobre/`, label: t('nav.about') },
  ];
  return (
    <header className="border-b border-line bg-paper">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-cream focus:px-4 focus:py-3 focus:text-ink">
        {pt ? 'Saltar para o conteúdo' : 'Skip to content'}
      </a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3">
        <a href={`/${locale}/`} className="brand-link inline-block rounded-sm" aria-label={pt ? 'estimador.pt — página inicial' : 'estimador.pt — home'}>
          <LogoHorizontal size={22} />
        </a>
        <div className="order-2 flex items-center gap-2 md:order-3">
          <div role="group" aria-label={pt ? 'Idioma' : 'Language'} className="flex gap-1 rounded-md bg-stone-100 p-0.5">
            {(['pt', 'en'] as const).map(target => (
              <a key={target} href={`/${target}/`} hrefLang={target} lang={target}
                aria-label={target === 'pt' ? 'Português' : 'English'}
                aria-current={target === locale ? 'page' : undefined}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2 text-xs font-medium ${target === locale ? 'bg-cream text-ink shadow-sm' : 'text-stone-600 hover:text-ink'}`}>
                {target.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
        <nav aria-label={pt ? 'Navegação principal' : 'Main navigation'} className="order-3 -mx-2.5 flex w-full flex-wrap md:order-2 md:mx-0 md:ml-auto md:w-auto">
          {links.map(link => (
            <a key={link.href} href={link.href} className="inline-flex min-h-11 items-center rounded-md px-2.5 text-sm text-stone-600 hover:bg-parchment hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Page({ locale }: { locale: 'pt' | 'en' }) {
  // The footer's links read the locale from a provider; they need no messages.
  return (
    <LocaleOnlyProvider locale={locale}>
      <NotFoundHeader locale={locale} />
      <NotFoundBody locale={locale} withTitle />
      <SiteFooter locale={locale} />
    </LocaleOnlyProvider>
  );
}

/**
 * The 404 for every address the export does not have, under /pt, /en or
 * neither: Azure serves this one file (/404.html) for all of them. It renders
 * outside the locale layout, so it carries its own document, and it holds both
 * languages, showing the one the address asks for (NotFoundByPath).
 */
export default function NotFound() {
  return (
    <html lang="pt" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_FROM_PATH }} />
      </head>
      <body className="antialiased">
        <div className="min-h-screen bg-paper text-ink">
          <NotFoundByPath pt={<Page locale="pt" />} en={<Page locale="en" />} />
        </div>
      </body>
    </html>
  );
}
