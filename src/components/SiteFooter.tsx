import { getTranslations } from 'next-intl/server';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { ECONOMY_PUBLISHED } from '@/lib/config/economy-status';
import { brandDescriptor, brandLine } from '@/lib/brand/descriptor';
import { SiteFooterView, type FooterItem } from './SiteFooterView';

/**
 * The one footer every page ends with. Paper ground, hairline rule, the
 * section index and the project links; nothing a page needs to configure.
 * This reads the copy and decides the links; SiteFooterView draws them.
 */
export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const year = new Date().getFullYear();

  // The articles link and the feed are offered only once this locale has
  // published something; the feed routes keep working either way.
  const hasArticles = getMDXArticlesByLocale(locale).length > 0;

  // Ordered by what is live, as in the header: population, the Liga, the
  // election archive, then the economy once it publishes.
  const sections: FooterItem[] = [
    { href: '/populacao', label: t('nav.population') },
    // One public name for football, the league's own (CLAUDE.md).
    { href: '/desporto/liga', label: t('nav.liga') },
    // One entry for both archived forecasts, as the header groups them under
    // "Eleições": the archive's own page leads to each (CL3-06).
    { href: '/eleicoes/arquivo', label: t('footer.electionsArchive') },
    ...(ECONOMY_PUBLISHED ? [{ href: '/economia', label: t('sections.economics') }] : []),
  ];
  // The brand guide (/marca) is an internal, unindexed page: reachable by its
  // address, not listed here.
  const project: FooterItem[] = [
    { href: '/sobre', label: t('about.title') },
    { href: '/metodologia', label: t('nav.methodology') },
    // The reuse terms and the citation form for every page (PRO3-V02).
    { href: '/sobre#reutilizar', label: t('footer.reuse') },
    ...(hasArticles ? [{ href: '/artigos', label: t('articles.title') }] : []),
    { href: '/privacidade', label: t('footer.privacy') },
  ];

  return (
    <SiteFooterView
      locale={locale}
      labels={{
        line: brandLine(locale),
        descriptor: brandDescriptor(locale),
        products: t('footer.products'),
        project: t('footer.project'),
        contact: t('footer.contact'),
        developer: t('about.footerDeveloper'),
      }}
      sections={sections}
      project={project}
      hasArticles={hasArticles}
      year={year}
    />
  );
}
