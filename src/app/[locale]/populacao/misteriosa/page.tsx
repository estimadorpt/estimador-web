import { setRequestLocale } from '@/i18n/request-locale';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { GAME_COPY } from '@/components/population/game/copy';
import { HowToPlay } from '@/components/population/game/HowToPlay';
import { MysteryGame } from '@/components/population/game/MysteryGame';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { createPageMetadata } from '@/lib/metadata';
import { loadPopulationMeta } from '@/lib/utils/population-data-loader';

const asLocale = (locale: string) => (locale === 'en' ? 'en' : 'pt');

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = GAME_COPY[asLocale(locale)];
  return createPageMetadata({
    locale,
    path: POPULATION_ROUTES.game,
    title: t.metaTitle,
    description: t.metaDescription,
  });
}

/**
 * Freguesia misteriosa, the daily game. The page itself is static; the game
 * works out the day on the reader's device (Lisbon calendar) and loads only
 * that day's chunk of candidates.
 */
export default async function MysteryParishPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = asLocale(raw);
  setRequestLocale(locale);
  const t = GAME_COPY[locale];
  const meta = await loadPopulationMeta();
  if (!meta) throw new Error('Freguesia misteriosa needs public/data/population meta.json');
  const honesty = locale === 'pt' ? meta.honesty.game.message_pt : meta.honesty.game.message_en;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      {/* A tool: the population section's compact periwinkle field, no art. */}
      <PageHero
        compact
        field="periwinkle"
        measure="wide"
        eyebrow={t.heroEyebrow}
        title={t.heroTitle}
        lede={t.heroLede}
        meta={<span>{t.heroMeta}</span>}
      />
      <PopulationSectionNav current="game" locale={locale} />
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <div className="mb-6 max-w-3xl">
          <HowToPlay locale={locale} honesty={honesty} />
        </div>
        <MysteryGame locale={locale} meta={meta} />
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
