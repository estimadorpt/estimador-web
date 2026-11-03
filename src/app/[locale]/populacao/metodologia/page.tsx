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
import { methodFigureBlocks } from '@/components/population/method/blocks';
import { formatDay } from '@/components/population/quality/copy';
import { getMDXComponents } from '@/mdx-components';
import { POPULATION_PUBLISHED, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import type { Locale } from '@/lib/population/labels';
import { loadPopulationMeta, loadPopulationPlaces, loadPopulationRelease, loadPopulationScorecard } from '@/lib/utils/population-data-loader';
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
      ? 'Porque é precisa uma população sintética, como foi gerada em cinco passos, o que quer dizer cada nível de qualidade, privacidade, usos, limites e como citar.'
      : 'Why a synthetic population is needed, how it was generated in five steps, what each quality tier means, privacy, suitable uses, limits and how to cite it.',
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
  const [meta, release, scorecard, places] = await Promise.all([loadPopulationMeta(), loadPopulationRelease(), loadPopulationScorecard(), loadPopulationPlaces()]);
  const ineResidents = places?.parishes.reduce((sum, row) => sum + row[5], 0) ?? null;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PopulationSectionNav current="methodology" locale={locale} />
      <PageHero
        measure="reading"
        compact
        back={{ href: POPULATION_ROUTES.hub, label: pt ? 'População sintética' : 'Synthetic population', locale }}
        eyebrow={pt ? `População sintética · versão ${POPULATION_RELEASE}` : `Synthetic population · release ${POPULATION_RELEASE}`}
        title={pt ? 'Como foi feita a população sintética' : 'How the synthetic population was made'}
        lede={pt
          ? 'As tabelas dos Censos 2021 contam pessoas e agregados, mas não dizem quem vive com quem. Uma população sintética preenche essa falta com agregados inventados por um modelo e escolhidos para dar as tabelas de cada freguesia, cada uma com o seu nível de qualidade.'
          : 'The 2021 Census tables count people and households, but do not say who lives with whom. A synthetic population fills that gap with households invented by a model and chosen to match each parish’s tables, every parish with its quality tier.'}
        meta={<><span>{pt ? 'Censos 2021 (INE)' : '2021 Census (INE)'}</span><span>{pt ? `Versão de ${formatDay(POPULATION_PUBLISHED, locale)}` : `Release dated ${formatDay(POPULATION_PUBLISHED, locale)}`}</span></>}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
        {!meta || !release || !scorecard ? (
          <div className="max-w-3xl"><PopulationUnavailable locale={locale} /></div>
        ) : (
          // The text keeps a reading measure; the five steps' story takes the container's width.
          <article className="article-body max-w-none [&>:not(.mstory)]:max-w-3xl">
            <MDXRemote
              source={readMethodology(locale)}
              components={getMDXComponents({
                // The hero carries the title; the file's own "# " line would be a second h1.
                h1: () => null,
                ...methodologyBlocks({ locale, meta, release, scorecard, ineResidents }),
                ...methodFigureBlocks({ locale, meta, release }),
              })}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </article>
        )}
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
