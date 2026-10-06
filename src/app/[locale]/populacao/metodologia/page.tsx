import { setRequestLocale } from '@/i18n/request-locale';
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
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: POPULATION_ROUTES.methodology,
    title: pt ? 'Como foi feita a população sintética de Portugal' : 'How the synthetic population of Portugal was made',
    description: pt
      ? 'O que é uma população sintética, como foi gerada em cinco passos, o que quer dizer cada nível de qualidade, privacidade, usos adequados, limitações e como citar.'
      : 'What a synthetic population is, how it was generated in five steps, what each quality tier means, privacy, suitable uses, limitations and how to cite it.',
  });
}

function readMethodology(locale: Locale): string {
  return readFileSync(path.join(process.cwd(), 'src/content/population-methodology', `${locale}.mdx`), 'utf8');
}

export default async function PopulationMethodology({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = raw === 'en' ? 'en' : 'pt';
  setRequestLocale(locale);
  const pt = locale === 'pt';
  const [meta, release, scorecard] = await Promise.all([loadPopulationMeta(), loadPopulationRelease(), loadPopulationScorecard()]);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="reading"
        compact
        back={{ href: POPULATION_ROUTES.hub, label: pt ? 'População sintética' : 'Synthetic population', locale }}
        eyebrow={pt ? `População sintética · versão ${POPULATION_RELEASE}` : `Synthetic population · release ${POPULATION_RELEASE}`}
        title={pt ? 'Como foi feita a população sintética?' : 'How was the synthetic population made?'}
        lede={pt
          ? 'Um processo generativo com restrições, calibrado nas tabelas dos Censos 2021 de cada freguesia, e o que quer dizer o nível de qualidade de cada uma.'
          : 'A constrained generative pipeline, calibrated to each parish’s 2021 Census tables, and what each parish’s quality tier means.'}
        meta={<><span>{pt ? 'Censos 2021 (INE)' : '2021 Census (INE)'}</span><span>{pt ? `Publicada a ${formatDay(POPULATION_PUBLISHED, locale)}` : `Published ${formatDay(POPULATION_PUBLISHED, locale)}`}</span></>}
      />
      <PopulationSectionNav current="methodology" locale={locale} />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14"><div className="max-w-3xl">
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
      </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
