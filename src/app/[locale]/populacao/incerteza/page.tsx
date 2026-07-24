// Standalone demo of the uncertainty UX primitives (deliverable 4). Shows both
// regimes side by side — a point estimate (n_replicates 1, no interval) vs a
// real replicate band (n_replicates 3, with lo/hi rounded to the precision it
// supports) — and two RankedList cases: one where the top two bands overlap (the
// superlative is correctly hedged) and one where they separate (superlative
// allowed). Editorial hero + terracotta accent, mirroring /economia/metodologia;
// back-link to /populacao. Server page rendering client islands.

import { Header } from '@/components/Header';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Scale } from 'lucide-react';
import type { Metadata } from 'next';
import {
  UncertainNumber,
  RankedList,
  UncertaintyExplainer,
  type RankedListItem,
} from '@/components/demographics/uncertainty';
import type { ReplicateInterval } from '@/types/populacao';

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
    alternates: { canonical: `https://estimador.pt/${locale}/populacao/incerteza` },
  };
}

// Bilingual demo copy. Section captions and the RankedList superlative/hedge
// wording have NO existing i18n key (see report); kept local to this demo.
const COPY = {
  pt: {
    disclaimer:
      'Todos os valores nesta página são exemplos ilustrativos, não estimativas reais. As etiquetas “Freguesia A/B/C…” são fictícias e não correspondem a nenhuma freguesia.',
    disclaimerShort: 'Valores e etiquetas ilustrativos — não são estimativas reais.',
    lead: 'A mesma quantidade, lida de duas formas: como estimativa pontual (sem réplicas) e como intervalo real entre réplicas. Repare como a precisão apresentada muda com a largura da banda.',
    regimeTitle: 'Dois regimes',
    pointCaption: 'Estimativa pontual — 1 réplica (ainda sem intervalo)',
    intervalCaption: 'Intervalo real — 3 réplicas (arredondado à precisão que suporta)',
    rankTitle: 'Comparações honestas',
    separatedCaption: 'Bandas separadas — o superlativo é permitido',
    overlapCaption: 'Bandas sobrepostas — o superlativo é atenuado',
    pointRankCaption: 'Regime pontual — sem réplicas, nunca afirmamos um vencedor',
    people: 'pessoas',
    supSupported: 'Maior: {label}.',
    supHedged: 'Empate estatístico no topo — não afirmamos um único vencedor.',
  },
  en: {
    disclaimer:
      'All values on this page are illustrative examples, not real estimates. The “Freguesia A/B/C…” labels are fictitious and do not correspond to any parish.',
    disclaimerShort: 'Illustrative values and labels — not real estimates.',
    lead: 'The same quantity, read two ways: as a point estimate (no replicates) and as a real replicate interval. Notice how the displayed precision tracks the band width.',
    regimeTitle: 'Two regimes',
    pointCaption: 'Point estimate — 1 replicate (no interval yet)',
    intervalCaption: 'Real interval — 3 replicates (rounded to the precision it supports)',
    rankTitle: 'Honest comparisons',
    separatedCaption: 'Bands separate — the superlative is allowed',
    overlapCaption: 'Bands overlap — the superlative is hedged',
    pointRankCaption: 'Point regime — no replicates, we never claim a winner',
    people: 'people',
    supSupported: 'Highest: {label}.',
    supHedged: 'Statistical tie at the top — we do not claim a single winner.',
  },
} as const;

export default async function IncertezaDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: 'pt' | 'en' = rawLocale === 'en' ? 'en' : 'pt';
  const t = await getTranslations({ locale, namespace: 'populacao' });
  const c = COPY[locale];

  // --- worked point/interval examples (same underlying value) ---
  const N = 12345;
  const pointVal: ReplicateInterval = { value: N, n_replicates: 1 };
  const highBand: ReplicateInterval = { value: N, lo: N - 200, hi: N + 200, n_replicates: 3 }; // high
  const medBand: ReplicateInterval = { value: N, lo: N - 820, hi: N + 820, n_replicates: 3 }; // medium
  const lowBand: ReplicateInterval = { value: N, lo: N - 8200, hi: N + 8200, n_replicates: 3 }; // low

  // --- RankedList: clearly separated bands (superlative supported) ---
  // Labels are anonymised placeholders (see the illustrative-values note); no
  // real parish is named on this page.
  const separated: RankedListItem[] = [
    { label: 'Freguesia A', value: 9800, lo: 9650, hi: 9950, n_replicates: 3 },
    { label: 'Freguesia B', value: 7200, lo: 7060, hi: 7340, n_replicates: 3 },
    { label: 'Freguesia C', value: 4300, lo: 4210, hi: 4390, n_replicates: 3 },
  ];

  // --- RankedList: overlapping top two (superlative hedged, ties flagged) ---
  const overlapping: RankedListItem[] = [
    { label: 'Freguesia D', value: 5100, lo: 4840, hi: 5360, n_replicates: 3 },
    { label: 'Freguesia E', value: 4950, lo: 4650, hi: 5250, n_replicates: 3 },
    { label: 'Freguesia F', value: 3600, lo: 3420, hi: 3780, n_replicates: 3 },
  ];

  // --- RankedList: point regime (no intervals) — always hedges ---
  const pointRegime: RankedListItem[] = [
    { label: 'Freguesia G', value: 6100, n_replicates: 1 },
    { label: 'Freguesia H', value: 5800, n_replicates: 1 },
    { label: 'Freguesia I', value: 2100, n_replicates: 1 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero — stone theme, terracotta accent (mirrors /economia/metodologia) */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-10">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t('eyebrow')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t('uncertainty.aboutTitle')}</h1>
          <Link
            href="/populacao"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('title')}
          </Link>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Illustrative-values note — every number and label on this page is fake. */}
        <p
          className="border-l-2 pl-3 text-sm font-medium text-stone-700"
          style={{ borderColor: ACCENT }}
        >
          {c.disclaimer}
        </p>

        <UncertaintyExplainer />

        <p className="text-stone-700 leading-relaxed max-w-2xl">{c.lead}</p>

        {/* Two regimes */}
        <section className="space-y-5">
          <h2 className="text-xl font-bold text-stone-900">{c.regimeTitle}</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {c.pointCaption}
              </p>
              <div className="text-2xl">
                <UncertainNumber value={pointVal} unit={c.people} locale={locale} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {c.intervalCaption}
              </p>
              <div className="space-y-3 text-2xl">
                <UncertainNumber value={highBand} unit={c.people} locale={locale} />
                <UncertainNumber value={medBand} unit={c.people} locale={locale} />
                <UncertainNumber value={lowBand} unit={c.people} locale={locale} />
              </div>
            </div>
          </div>
        </section>

        {/* Honest comparisons */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-stone-900">{c.rankTitle}</h2>
          <p
            className="border-l-2 pl-3 text-[10px] font-bold uppercase tracking-wider text-stone-500"
            style={{ borderColor: ACCENT }}
          >
            {c.disclaimerShort}
          </p>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {c.separatedCaption}
            </p>
            <RankedList
              items={separated}
              locale={locale}
              unit={c.people}
              superlative={{ supported: c.supSupported, hedged: c.supHedged }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {c.overlapCaption}
            </p>
            <RankedList
              items={overlapping}
              locale={locale}
              unit={c.people}
              superlative={{ supported: c.supSupported, hedged: c.supHedged }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {c.pointRankCaption}
            </p>
            <RankedList
              items={pointRegime}
              locale={locale}
              unit={c.people}
              superlative={{ supported: c.supSupported, hedged: c.supHedged }}
            />
          </div>
        </section>

        <div className="border-t border-stone-200 pt-6">
          <Link
            href="/populacao"
            className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            style={{ color: ACCENT }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('title')}
          </Link>
        </div>
      </main>
    </div>
  );
}
