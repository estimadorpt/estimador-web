// Methodology / trust page for the synthetic population of Portugal.
//
// Mirrors the economics methodology culture (/economia/metodologia) — same
// stone palette, same MDXRemote + remarkGfm render, same bilingual fallback —
// but themed with the terracotta demographics accent (#9A4A2E) and rendered
// from its own bilingual MDX in src/content/populacao-methodology/{locale}.mdx:
// the headline claim + first-use hedge, data sources, generative-vs-donor-replay
// framing, the post-decode tier policy, the validation scorecard, the privacy
// note, scope limits, and the CC BY 4.0 licence + dual attribution.
//
// Every "Metodologia e confiança" link on the /populacao surface points here —
// keep this page in sync with what the scorecard and tabulator actually claim.

import { Header } from '@/components/Header';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import type { MDXComponents } from 'mdx/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('meta.populacaoMethodologyTitle'),
    description: t('meta.populacaoMethodologyDescription'),
    openGraph: {
      title: t('meta.populacaoMethodologyTitle'),
      description: t('meta.populacaoMethodologyDescription'),
      url: `https://estimador.pt/${locale}/populacao/metodologia`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/populacao/metodologia`,
    },
  };
}

function contentPath(locale: string): string {
  return path.join(process.cwd(), 'src/content/populacao-methodology', `${locale}.mdx`);
}

function getContent(locale: string): { content: string; actualLocale: string } {
  for (const candidate of [locale, 'pt', 'en']) {
    const p = contentPath(candidate);
    if (existsSync(p)) {
      return { content: readFileSync(p, 'utf8'), actualLocale: candidate };
    }
  }
  throw new Error('No populacao methodology content found');
}

// Stone-toned MDX components — same taxonomy as the economics methodology page,
// but the accent (links / anchors) is the demographics terracotta #9A4A2E.
const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mt-8 mb-4 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl md:text-2xl font-bold text-stone-900 mt-8 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-stone-800 mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 text-stone-700 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1.5">{children}</ol>,
  li: ({ children }) => <li className="text-stone-700 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-8 border-stone-200" />,
  a: ({ href, children }) => (
    <a href={href} className="text-[#9A4A2E] font-medium hover:underline">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-stone-300 pl-4 my-4 text-stone-600 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border border-stone-200 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-stone-50">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-stone-200 px-3 py-2 text-left font-semibold text-stone-800">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-stone-200 px-3 py-2 text-stone-700 align-top">{children}</td>
  ),
  code: ({ children }) => (
    <code className="bg-stone-100 rounded px-1 py-0.5 text-[0.9em] text-stone-800">
      {children}
    </code>
  ),
};

export default async function PopulacaoMethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'populacao' });

  const { content: mdxContent, actualLocale } = getContent(locale);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero — same stone theme as /populacao */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t('eyebrow')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t('methodologyLink')}</h1>
          <Link
            href="/populacao"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('title')}
          </Link>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {actualLocale !== locale && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {locale === 'en'
                ? 'This page is only available in Portuguese. Showing the Portuguese version.'
                : 'Esta página apenas está disponível em inglês. A mostrar a versão inglesa.'}
            </p>
          </div>
        )}

        <article className="max-w-none">
          <MDXRemote
            source={mdxContent}
            components={components}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </article>

        <div className="mt-10 border-t border-stone-200 pt-6">
          <Link
            href="/populacao"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#9A4A2E] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('title')}
          </Link>
        </div>
      </main>
    </div>
  );
}
