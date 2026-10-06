import { getTranslations } from 'next-intl/server';
import { Rss } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LogoHorizontal } from './Logo';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { ECONOMY_PUBLISHED } from '@/lib/config/economy-status';
import { brandDescriptor, brandLine } from '@/lib/brand/descriptor';

// Links are ink with an underline at rest (CLAUDE.md); keyboard focus is the
// global double ring in globals.css, so nothing here declares its own.
const linkStyle = 'text-ink underline underline-offset-4 decoration-ink/40 transition-colors hover:decoration-ink';

interface FooterItem {
  href: string;
  label: string;
}

function FooterColumn({ heading, items, locale }: { heading: string; items: FooterItem[]; locale: string }) {
  return (
    <div>
      <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{heading}</h2>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.href}>
            <Link href={item.href} locale={locale} className={linkStyle}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The one footer every page ends with. Paper ground, hairline rule, the
 * section index and the project links; nothing a page needs to configure.
 */
export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const pt = locale === 'pt';
  const year = new Date().getFullYear();

  // The articles link and the feed are offered only once this locale has
  // published something; the feed routes keep working either way.
  const hasArticles = getMDXArticlesByLocale(locale).length > 0;

  // Ordered by what is live, as in the header: population, the Liga, the
  // election archive, then the economy while it is in preparation.
  const sections: FooterItem[] = [
    { href: '/populacao', label: t('nav.population') },
    { href: '/desporto/liga', label: t('football.title') },
    // Both forecasts are archives; the label says so wherever they are listed.
    { href: '/eleicoes/presidenciais', label: t('elections.navPresidential') },
    { href: '/eleicoes/legislativas', label: t('elections.navParliamentary') },
    { href: '/economia', label: t(ECONOMY_PUBLISHED ? 'sections.economics' : 'nav.economicsPreparing') },
  ];
  // The brand guide (/marca) is an internal, unindexed page: reachable by its
  // address, not listed here.
  const project: FooterItem[] = [
    { href: '/sobre', label: t('about.title') },
    { href: '/metodologia', label: t('nav.methodology') },
    ...(hasArticles ? [{ href: '/artigos', label: t('articles.title') }] : []),
    { href: '/privacidade', label: t('footer.privacy') },
  ];

  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" locale={locale} className="brand-link inline-block rounded-sm" aria-label={pt ? 'estimador — página inicial' : 'estimador — home'}>
              <LogoHorizontal size={20} />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              {brandLine(locale)} {brandDescriptor(locale)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm sm:grid-cols-3">
            <FooterColumn heading={t('footer.products')} items={sections} locale={locale} />
            <FooterColumn heading={t('footer.project')} items={project} locale={locale} />
            <div>
              <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{t('footer.contact')}</h2>
              <ul className="space-y-1.5">
                <li>
                  <a href="mailto:info@estimador.pt" className={linkStyle}>info@estimador.pt</a>
                </li>
                {hasArticles && (
                  <li>
                    <a href={`/${locale}/feed.xml`} className={`inline-flex items-center gap-1.5 ${linkStyle}`}>
                      <Rss aria-hidden="true" className="h-3.5 w-3.5" />
                      RSS
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('about.footerDeveloper')}</p>
          <p>© {year} estimador.pt</p>
        </div>
      </div>
    </footer>
  );
}
