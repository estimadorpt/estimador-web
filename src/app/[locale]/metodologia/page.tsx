import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/mdx-components';

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
    title: t('meta.methodologyTitle'),
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
  const pt = locale === 'pt';
  
  const { content: mdxContent, actualLocale } = getMethodologyContent(locale);
  const components = getMDXComponents();

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1} className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">{pt ? 'DADOS, MODELOS E LIMITES' : 'DATA, MODELS AND LIMITS'}</p>
          <h1 className="mt-3 text-3xl md:text-4xl">{pt ? 'Como chegamos a cada resposta' : 'How we arrive at each answer'}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{pt ? 'Escolhe a área que estás a explorar. Cada uma tem fontes, pressupostos e formas de verificar os resultados diferentes.' : 'Choose the area you are exploring. Each has its own sources, assumptions and ways to check results.'}</p>
        </header>
        <nav aria-label={pt ? 'Métodos por área' : 'Methods by area'} className="my-8 divide-y divide-line border-y border-line">
          {(pt ? [
            ['População', 'Posso usar estes dados na minha investigação?', 'Disponibilidade, campos e limites da demonstração.', '/populacao/dados'],
            ['Futebol', 'O que sustenta estas probabilidades?', 'Modelo, simulações e pressupostos.', '/desporto/liga/metodologia'],
            ['Economia', 'De onde vem esta leitura?', 'Fontes, atualização, avaliação e limites.', '/economia/metodologia'],
            ['Eleições', 'Como são combinadas as sondagens?', 'Modelos eleitorais e incerteza, nesta página.', '#eleicoes'],
          ] : [
            ['Population', 'Can I use these data in my research?', 'Availability, fields and demonstration limits.', '/populacao/dados'],
            ['Football', 'What supports these probabilities?', 'Model, simulations and assumptions.', '/desporto/liga/metodologia'],
            ['Economy', 'Where does this reading come from?', 'Sources, updates, evaluation and limitations.', '/economia/metodologia'],
            ['Elections', 'How are polls combined?', 'Election models and uncertainty, on this page.', '#eleicoes'],
          ]).map(([label,question,description,href]) => <div key={label} className="py-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
            {href.startsWith('#') ? <a href={href} className="mt-2 inline-block min-h-8 text-lg font-bold text-ink underline-offset-4 hover:underline">{question} →</a> : <Link href={href} locale={locale} className="mt-2 inline-block min-h-8 text-lg font-bold text-ink underline-offset-4 hover:underline">{question} →</Link>}
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
          </div>)}
        </nav>
        <p className="mb-10 text-sm text-ink-muted">{pt ? 'Queres verificar o modelo do futebol? ' : 'Want to check the football model? '}<Link href="/desporto/liga/modelo" locale={locale} className="font-semibold text-ink underline underline-offset-4">{pt ? 'Ver a avaliação publicada' : 'See the published evaluation'}</Link></p>
        {/* Locale Notice (if fallback) */}
        {actualLocale !== locale && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              {locale === 'en' 
                ? `This page is only available in Portuguese. Showing Portuguese version.`
                : `Esta página apenas está disponível em português.`
              }
            </p>
          </div>
        )}

        <article id="eleicoes" className="article-body max-w-none scroll-mt-24">
          <MDXRemote source={mdxContent} components={components} />
        </article>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
