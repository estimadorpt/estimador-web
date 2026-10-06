import './globals.css';
import { getTranslations } from 'next-intl/server';
import { LocaleOnlyProvider } from '@/components/LocaleOnlyProvider';
import { navLabels, siteNavigation } from '@/components/brand/site-navigation';
import { ECONOMY_PUBLISHED } from '@/lib/config/economy-status';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { NotFoundBody } from '@/components/NotFoundBody';
import { NotFoundHeaderView } from '@/components/NotFoundHeaderView';
import { NotFoundByPath } from '@/components/NotFoundSwitch';
import { SiteFooter } from '@/components/SiteFooter';
import { fontVariables } from './fonts';
import { LOCALE_REDIRECT_SCRIPT } from '@/lib/locale-redirect';

// Sets <html lang> from the address before the first paint, so the English
// 404 is never read with Portuguese pronunciation while it hydrates (or by a
// reader without JavaScript). NotFoundByPath keeps it in step afterwards.
const LANG_FROM_PATH = "if(/^\\/en(\\/|$)/.test(location.pathname))document.documentElement.lang='en'";

/**
 * The 404's own header, drawn from the same navigation as the site Header
 * (src/components/brand/site-navigation.ts): the same items, order and
 * labels, the same 60px bar and container. It renders outside the locale
 * layout, where the client Header (hooks, next-intl's Link, the article
 * index) has nothing to read, so it needs no JavaScript: the menus are
 * native <details>, the links plain anchors with the locale written out, and
 * the PT/EN switch goes to each language's start page (an address that is
 * missing in one language is missing in both).
 */
async function NotFoundHeader({ locale }: { locale: 'pt' | 'en' }) {
  const t = await getTranslations({ locale });
  const items = siteNavigation(navLabels(key => t(key as never)), {
    locale,
    hasArticles: getMDXArticlesByLocale(locale).length > 0,
    economyPublished: ECONOMY_PUBLISHED,
  });
  return <NotFoundHeaderView locale={locale} items={items} />;
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
