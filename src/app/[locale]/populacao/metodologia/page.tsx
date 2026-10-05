import { readFileSync } from 'node:fs';
import path from 'node:path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { PopulationUnavailable } from '@/components/population/quality/parts';
import { methodologyBlocks } from '@/components/population/quality/MethodologyBlocks';
import { formatDay } from '@/components/population/quality/copy';
import { getMDXComponents } from '@/mdx-components';
import { POPULATION_PUBLISHED, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import type { Locale } from '@/lib/population/labels';
import { loadPopulationMeta, loadPopulationRelease, loadPopulationScorecard } from '@/lib/utils/population-data-loader';
import { createPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: POPULATION_ROUTES.methodology,
    title: pt ? 'Como foi feita a população sintética de Portugal' : 'How the synthetic population of Portugal was made',
    description: pt
      ? 'O que é uma população sintética, como foi gerada em cinco passos, quando um número é publicado, privacidade, usos adequados, limitações e como citar.'
      : 'What a synthetic population is, how it was generated in five steps, when a figure is published, privacy, suitable uses, limitations and how to cite it.',
  });
}

function readMethodology(locale: Locale): string {
  return readFileSync(path.join(process.cwd(), 'src/content/population-methodology', `${locale}.mdx`), 'utf8');
}

export default async function PopulationMethodology({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = raw === 'en' ? 'en' : 'pt';
  const pt = locale === 'pt';
  const [meta, release, scorecard] = await Promise.all([loadPopulationMeta(), loadPopulationRelease(), loadPopulationScorecard()]);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <PageHero
        width="3xl"
        compact
        back={{ href: POPULATION_ROUTES.hub, label: pt ? 'POPULAÇÃO' : 'POPULATION', locale }}
        eyebrow={pt ? `POPULAÇÃO SINTÉTICA · VERSÃO ${POPULATION_RELEASE}` : `SYNTHETIC POPULATION · RELEASE ${POPULATION_RELEASE}`}
        title={pt ? 'Como foi feita a população sintética?' : 'How was the synthetic population made?'}
        lede={pt
          ? 'Um processo generativo com restrições, calibrado nas tabelas dos Censos 2021 de cada freguesia, e as regras que decidem quando um número é publicado.'
          : 'A constrained generative pipeline, calibrated to each parish’s 2021 Census tables, and the rules that decide when a figure is published.'}
        meta={<><span>{pt ? 'Censos 2021 (INE)' : '2021 Census (INE)'}</span><span>{pt ? `Publicada a ${formatDay(POPULATION_PUBLISHED, locale)}` : `Published ${formatDay(POPULATION_PUBLISHED, locale)}`}</span></>}
      />
      <PopulationSectionNav current="methodology" locale={locale} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        {!meta || !release || !scorecard ? (
          <PopulationUnavailable locale={locale} />
        ) : (
          <article className="article-body max-w-none">
            <MDXRemote
              source={readMethodology(locale)}
              components={getMDXComponents({
                // The hero carries the title; the file's own "# " line would be a second h1.
                h1: () => null,
                ...methodologyBlocks({ locale, meta, release, scorecard }),
              })}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </article>
        )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
