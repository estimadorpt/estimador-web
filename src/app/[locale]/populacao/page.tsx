// /populacao — L0 scorecard page (A2). Hero with the hedged headline claim + the
// "not real" honesty statement, a pre-launch reference-scope banner, and the
// scorecard rendered from the demographics/scorecard.json feed. Everything is
// null-safe: a missing feed degrades to an honest "unavailable" state.
import { Header } from '@/components/Header';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Users, BookOpen, Table2 } from 'lucide-react';
import type { Metadata } from 'next';

import { loadPopulacaoScorecard } from '@/lib/utils/data-loader';
import { ScorecardSection } from '@/components/demographics/scorecard/ScorecardSection';

const ACCENT = '#9A4A2E';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('meta.populacaoTitle'),
    description: t('meta.populacaoDescription'),
    openGraph: {
      title: t('meta.populacaoTitle'),
      description: t('meta.populacaoDescription'),
      type: 'website',
    },
    alternates: { canonical: `https://estimador.pt/${locale}/populacao` },
  };
}

export default async function PopulacaoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'populacao' });

  const scorecard = await loadPopulacaoScorecard();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t('eyebrow')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t('title')}</h1>
          <p className="text-stone-200 text-base md:text-lg max-w-2xl leading-relaxed">
            {t('intro')}
          </p>

          {/* Honesty statement — "these people are not real" */}
          <div className="mt-6 pt-6 border-t border-stone-700 max-w-2xl">
            <p className="text-lg font-bold text-white">{t('notReal')}</p>
            <p className="mt-1.5 text-stone-300 leading-relaxed">{t('notRealBody')}</p>
            <p className="mt-3 text-sm text-stone-400">{t('positioning')}</p>
          </div>

          {/* Links */}
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/populacao/metodologia"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white border-b-2 pb-0.5 transition-colors hover:opacity-80"
              style={{ borderColor: ACCENT }}
            >
              <BookOpen className="w-4 h-4" style={{ color: ACCENT }} />
              {t('methodologyLink')}
            </Link>
            <Link
              href="/populacao/explorar"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white border-b-2 pb-0.5 transition-colors hover:opacity-80"
              style={{ borderColor: ACCENT }}
            >
              <Table2 className="w-4 h-4" style={{ color: ACCENT }} />
              {t('exploreLink')}
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Pre-launch reference-scope banner — left-border accent note, no card. */}
        <div className="border-l-4 border-y border-r border-stone-200 bg-stone-50 p-4 md:p-5"
             style={{ borderLeftColor: ACCENT }}>
          <p className="text-sm leading-relaxed text-stone-700">{t('preLaunch')}</p>
        </div>

        {/* Scorecard — from the feed, or an honest unavailable state. */}
        {scorecard ? (
          <ScorecardSection scorecard={scorecard} locale={locale} />
        ) : (
          <div className="border-t border-stone-200 pt-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              {t('scorecard.title')}
            </h2>
            <p className="mt-3 text-stone-500">{t('scorecard.unavailable')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
