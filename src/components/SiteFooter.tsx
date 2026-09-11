import { getTranslations } from 'next-intl/server';
import { Rss } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LogoHorizontal } from './Logo';

const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

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
            <Link href={item.href} locale={locale} className={`text-stone-600 transition-colors hover:text-ink ${focusStyle}`}>
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

  const products: FooterItem[] = [
    { href: '/populacao', label: pt ? 'População' : 'Population' },
    { href: '/economia', label: t('sections.economics') },
    { href: '/desporto/liga', label: t('football.title') },
    { href: '/eleicoes/presidenciais', label: t('sections.presidential2026') },
    { href: '/eleicoes/legislativas', label: t('sections.parliamentary2025') },
  ];
  const project: FooterItem[] = [
    { href: '/sobre', label: t('nav.about') },
    { href: '/metodologia', label: t('nav.methodology') },
    { href: '/artigos', label: t('articles.title') },
    { href: '/privacidade', label: t('footer.privacy') },
    { href: '/marca', label: pt ? 'Marca' : 'Brand' },
  ];

  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" locale={locale} className={`brand-link inline-block rounded-sm ${focusStyle}`} aria-label={pt ? 'estimador — página inicial' : 'estimador — home'}>
              <LogoHorizontal size={20} />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              {pt
                ? 'Dados para compreender Portugal. Modelos probabilísticos, dados datados e metodologia aberta.'
                : 'Data to understand Portugal. Probabilistic models, dated data and open methodology.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm sm:grid-cols-3">
            <FooterColumn heading={t('footer.products')} items={products} locale={locale} />
            <FooterColumn heading={t('footer.project')} items={project} locale={locale} />
            <div>
              <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Seguir' : 'Follow'}</h2>
              <ul className="space-y-1.5">
                <li>
                  <a href={`/${locale}/feed.xml`} className={`inline-flex items-center gap-1.5 text-stone-600 transition-colors hover:text-ink ${focusStyle}`}>
                    <Rss aria-hidden="true" className="h-3.5 w-3.5" />
                    RSS
                  </a>
                </li>
                <li>
                  <a href="mailto:info@estimador.pt" className={`text-stone-600 transition-colors hover:text-ink ${focusStyle}`}>
                    {pt ? 'Contacto' : 'Contact'}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} estimador.pt · {t('about.footerDeveloper')}</p>
          <p>{pt ? 'Construído com transparência e metodologia aberta.' : 'Built with transparency and open methodology.'}</p>
        </div>
      </div>
    </footer>
  );
}
