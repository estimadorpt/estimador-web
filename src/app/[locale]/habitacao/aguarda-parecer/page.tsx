import { setRequestLocale } from '@/i18n/request-locale';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { HousingGame } from '@/components/habitacao/HousingGame';
import { createPageMetadata } from '@/lib/metadata';

// Unlisted: no link from the navigation, the footer or any page, left out of the sitemap
// (HIDDEN_ROUTES in src/app/sitemap.ts) and noindex until the owner decides to launch it.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return createPageMetadata({
    locale,
    path: '/habitacao/aguarda-parecer',
    title: locale === 'pt' ? 'Aguarda parecer: um simulador de habitação em Lisboa' : 'Awaiting opinion: a Lisbon housing simulator',
    description: locale === 'pt'
      ? 'Tenta pôr casas de pé em Lisboa de 2015 a 2029: licenciamentos, pareceres, a Câmara, tribunais, juros e custos de construção, com as leis nas datas reais.'
      : 'Get homes built in Lisbon, 2015 to 2029: licensing, expert opinions, the Câmara, courts, rates and building costs, with laws changing on their real dates.',
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <HousingGame locale={locale === 'en' ? 'en' : 'pt'} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
