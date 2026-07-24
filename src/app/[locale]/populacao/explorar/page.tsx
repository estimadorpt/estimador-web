// L1 tabulator page — /populacao/explorar (Builder A3).
//
// Static-export-safe: this server component loads the manifest + the default
// pre-baked featured cross-tab from the filesystem and hands them to the client
// <TabulatorExplorer>, which renders the featured table instantly (first paint /
// no-JS / WASM-failure) and then hydrates the live DuckDB-WASM engine. All query
// state (?q= permalink, controls) lives client-side — no dynamic route params,
// no backend.

import { Header } from '@/components/Header';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import type { TabQuery, PopulacaoManifest } from '@/types/populacao';
import type { TabResult } from '@/lib/populacao/tabulate-engine';
import { loadPopulacaoManifest, loadJsonData } from '@/lib/utils/data-loader';
import { TabulatorExplorer } from '@/components/demographics/tabulator/TabulatorExplorer';
import type { Loc } from '@/components/demographics/tabulator/labels';

const ACCENT = '#9A4A2E';

interface FeaturedPayload {
  slug: string;
  query: TabQuery;
  label: string;
  label_en?: string;
  result: TabResult;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('meta.populacaoExplorarTitle'),
    description: t('meta.populacaoExplorarDescription'),
    openGraph: {
      title: t('meta.populacaoExplorarTitle'),
      description: t('meta.populacaoExplorarDescription'),
      url: `https://estimador.pt/${locale}/populacao/explorar`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/populacao/explorar`,
    },
  };
}

async function loadDefaultFeatured(
  manifest: PopulacaoManifest,
): Promise<FeaturedPayload | null> {
  const slug = manifest.featured?.[0]?.slug;
  if (!slug) return null;
  try {
    return await loadJsonData<FeaturedPayload>(`${slug}.json`, 'demographics/featured');
  } catch {
    return null;
  }
}

export default async function ExplorarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc: Loc = locale === 'en' ? 'en' : 'pt';
  const t = await getTranslations({ locale, namespace: 'populacao' });

  const manifest = await loadPopulacaoManifest();
  const featured = manifest ? await loadDefaultFeatured(manifest) : null;

  const scopeNote =
    manifest &&
    (loc === 'en'
      ? (manifest as PopulacaoManifest & { scope_note_en?: string }).scope_note_en
      : (manifest as PopulacaoManifest & { scope_note_pt?: string }).scope_note_pt);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link
            href="/populacao"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-200 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('common.back')}
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('eyebrow')}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-3">{t('tabulator.title')}</h1>
          <p className="text-stone-300 max-w-2xl">{t('tabulator.subtitle')}</p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* honesty: these people are not real */}
        <p className="text-sm text-stone-600 mb-6 border-l-2 pl-3" style={{ borderColor: ACCENT }}>
          <span className="font-semibold text-stone-800">{t('notReal')}</span>{' '}
          {t('notRealBody')}
        </p>

        {scopeNote && (
          <p className="text-xs text-stone-500 mb-6 uppercase tracking-wide font-semibold">
            {scopeNote}
          </p>
        )}

        {manifest && featured ? (
          <TabulatorExplorer
            manifest={manifest}
            locale={loc}
            initialQuery={featured.query}
            initialResult={featured.result}
          />
        ) : (
          <p className="text-sm text-stone-500 py-10">{t('scorecard.unavailable')}</p>
        )}
      </main>
    </div>
  );
}
