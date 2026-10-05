import { createPageMetadata, siteTitle } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from '@/i18n/request-locale';
import { PageHero } from '@/components/PageHero';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/mdx-components';
import { POPULATION_RELEASE } from '@/lib/config/population';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return createPageMetadata({
    locale,
    path: '/metodologia',
    title: siteTitle(t('methodology.title')),
    description: t('methodology.subtitle'),
  });
}

function getMethodologyPath(locale: string): string {
  return path.join(process.cwd(), 'src/content/methodology', `${locale}.mdx`);
}

function getMethodologyContent(locale: string): { content: string; actualLocale: string } {
  // Try preferred locale first
  let mdxPath = getMethodologyPath(locale);
  
  if (existsSync(mdxPath)) {
    return {
      content: readFileSync(mdxPath, 'utf8'),
      actualLocale: locale
    };
  }
  
  // Fallback to Portuguese
  if (locale !== 'pt') {
    mdxPath = getMethodologyPath('pt');
    if (existsSync(mdxPath)) {
      return {
        content: readFileSync(mdxPath, 'utf8'),
        actualLocale: 'pt'
      };
    }
  }
  
  // Fallback to English
  mdxPath = getMethodologyPath('en');
  if (existsSync(mdxPath)) {
    return {
      content: readFileSync(mdxPath, 'utf8'),
      actualLocale: 'en'
    };
  }
  
  throw new Error('No methodology content found');
}

export default async function MethodologyPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';

  const { content: mdxContent, actualLocale } = getMethodologyContent(locale);
  const components = getMDXComponents();

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero
          width="3xl"
          compact
          eyebrow={pt ? 'Dados, modelos e limites' : 'Data, models and limits'}
          title={pt ? 'Como chegamos a cada resposta' : 'How we arrive at each answer'}
          lede={pt ? 'Escolhe a área que estás a explorar. Cada uma tem fontes, pressupostos e formas de verificar os resultados diferentes.' : 'Choose the area you are exploring. Each has its own sources, assumptions and ways to check results.'}
        />
        <div className="max-w-3xl mx-auto px-4 pb-10 md:pb-16">
        <nav aria-label={pt ? 'Métodos por área' : 'Methods by area'} className="my-8 divide-y divide-line border-y border-line">
          {(pt ? [
            ['População', 'Como é gerada uma população sintética?', `Dados de partida, níveis de qualidade e privacidade da versão ${POPULATION_RELEASE}.`, '/populacao/metodologia'],
            ['Futebol', 'O que sustenta estas probabilidades?', 'Modelo, simulações e pressupostos.', '/desporto/liga/metodologia'],
            ['Economia', 'Como vamos ler a economia?', 'Fontes, atualização, avaliação e limites.', '/economia/metodologia'],
            ['Eleições', 'Como são combinadas as sondagens?', 'Modelos eleitorais e incerteza, nesta página.', '#eleicoes'],
          ] : [
            ['Population', 'How is a synthetic population generated?', `Inputs, quality tiers and privacy of release ${POPULATION_RELEASE}.`, '/populacao/metodologia'],
            ['Football', 'What supports these probabilities?', 'Model, simulations and assumptions.', '/desporto/liga/metodologia'],
            ['Economy', 'How will we read the economy?', 'Sources, updates, evaluation and limitations.', '/economia/metodologia'],
            ['Elections', 'How are polls combined?', 'Election models and uncertainty, on this page.', '#eleicoes'],
          ]).map(([label,question,description,href]) => <div key={label} className="py-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
            {href.startsWith('#') ? <a href={href} className="mt-2 inline-block min-h-8 text-lg font-bold text-ink underline underline-offset-4 hover:text-ink-dark">{question} →</a> : <Link href={href} locale={locale} className="mt-2 inline-block min-h-8 text-lg font-bold text-ink underline underline-offset-4 hover:text-ink-dark">{question} →</Link>}
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
          </div>)}
        </nav>
        <p className="mb-10 text-sm text-ink-muted">{pt ? 'Queres verificar o modelo do futebol? ' : 'Want to check the football model? '}<Link href="/desporto/liga/modelo" locale={locale} className="font-semibold text-ink underline underline-offset-4">{pt ? 'Ver a avaliação publicada' : 'See the published evaluation'}</Link></p>
        {/* Locale Notice (if fallback) */}
        {actualLocale !== locale && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {locale === 'en' 
                ? `This page is only available in Portuguese. Showing Portuguese version.`
                : `Esta página apenas está disponível em português.`
              }
            </p>
          </div>
        )}

        <article id="eleicoes" className="article-body max-w-none scroll-mt-24" lang={actualLocale}>
          <MDXRemote source={mdxContent} components={components} />
        </article>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
