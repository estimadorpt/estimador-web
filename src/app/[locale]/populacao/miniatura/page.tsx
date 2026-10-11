import { setRequestLocale } from '@/i18n/request-locale';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { BuildSteps, FitSection, MiniatureTwins, RealParish, keepHyphens } from '@/components/miniatura/Explainer';
import { Miniature } from '@/components/miniatura/Miniature';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { createPageMetadata } from '@/lib/metadata';
import { MINIATURA_TITLE } from '@/lib/miniatura/copy';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return createPageMetadata({ locale, path: '/populacao/miniatura',
    title: MINIATURA_TITLE[locale === 'en' ? 'en' : 'pt'],
    description: locale === 'pt'
      ? '100 pessoas e 30 agregados inventados mostram como se lê uma população sintética e como se ajusta às tabelas do INE. Nenhum número é de Portugal.'
      : '100 invented people in 30 households show how a synthetic population is read and how it is fitted to INE’s tables. No number is about Portugal.',
    index: false,
  });
}

/**
 * The explainer with invented people: the neighbourhood in three views, the
 * fit in miniature, the five steps, and a real parish at the end. Noindex:
 * it is not the release.
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: given } = await params;
  setRequestLocale(given);
  const locale = given === 'en' ? 'en' : 'pt';
  const pt = locale === 'pt';

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* The explainer belongs with the methodology: it pictures how the population is made. */}
        <PopulationSectionNav current="methodology" locale={locale} />
        <PageHero
          compact
          back={{ href: POPULATION_ROUTES.hub, label: pt ? 'População sintética' : 'Synthetic population', locale }}
          eyebrow={pt ? 'Explicador' : 'Explainer'}
          title={keepHyphens(MINIATURA_TITLE[locale])}
          lede={pt
            ? 'Um bairro inventado, com 100 pessoas em 30 agregados, mostra como se lê e como se faz uma população sintética. Nenhum número desta página é de Portugal.'
            : 'An invented neighbourhood of 100 people in 30 households shows how a synthetic population is read and how it is made. No number on this page is about Portugal.'}
        />
        <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 md:pt-8">
          <Miniature locale={locale}>
            <MiniatureTwins locale={locale} />
          </Miniature>
          <FitSection locale={locale} />
          <BuildSteps locale={locale} />
          <RealParish locale={locale} />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
