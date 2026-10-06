import './globals.css';
import { LocaleOnlyProvider } from '@/components/LocaleOnlyProvider';
import { LogoHorizontal } from '@/components/Logo';
import { NotFoundBody } from '@/components/NotFoundBody';
import { NotFoundByPath } from '@/components/NotFoundSwitch';
import { SiteFooter } from '@/components/SiteFooter';
import { fontVariables } from './fonts';
import { LOCALE_REDIRECT_SCRIPT } from '@/lib/locale-redirect';

function Page({ locale }: { locale: 'pt' | 'en' }) {
  // The footer's links read the locale from a provider; they need no messages.
  return (
    <LocaleOnlyProvider locale={locale}>
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
          <a href={`/${locale}/`} className="brand-link inline-block rounded-sm" aria-label={locale === 'pt' ? 'estimador.pt — página inicial' : 'estimador.pt — home'}>
            <LogoHorizontal size={22} />
          </a>
        </div>
      </header>
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
      <body className="antialiased">
        {/* A locale-less section address (/populacao/misteriosa) goes on to /pt/…
            before anything paints; src/lib/locale-redirect.ts. */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_REDIRECT_SCRIPT }} />
        <div className="min-h-screen bg-paper text-ink">
          <NotFoundByPath pt={<Page locale="pt" />} en={<Page locale="en" />} />
        </div>
      </body>
    </html>
  );
}
