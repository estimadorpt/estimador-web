import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import { loadLigaSummary, loadLigaWithDeltas } from "@/lib/utils/football-data-loader";
import { loadEconomyDashboard, loadPresidentialData, loadForecastData } from "@/lib/utils/data-loader";
import { economyPaused } from "@/lib/utils/economy-time";
import { getArticlesBySection, getMDXArticlesByLocale } from "@/lib/mdx-articles";
import { ALL_ELECTIONS } from "@/lib/config/elections";
import { homepageConfig, resolveHomepageLayout, type HomeSection } from "@/lib/config/homepage";
import { PopulationPanel } from "@/components/home/PopulationPanel";
import { FootballPanel } from "@/components/home/FootballPanel";
import { EconomyPanel } from "@/components/home/EconomyPanel";
import { ElectionsPanel, type ElectionSnapshot } from "@/components/home/ElectionsPanel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return createPageMetadata({
    locale,
    path: '/',
    title: t("meta.homepageTitle"),
    description: t("meta.defaultDescription"),
  });
}

/**
 * The published data behind a configured election, or null when there is none.
 * Only read in election mode; standard mode never touches the election files.
 */
async function electionSnapshot(id: string): Promise<ElectionSnapshot | null> {
  if (id === 'presidential-2026') {
    const data = await loadPresidentialData();
    const forecast = (data as { forecast?: { updated_at?: string; candidates?: Array<{ name: string; mean: number; ci_lower?: number; ci_upper?: number }> } }).forecast;
    if (!forecast?.candidates?.length) return null;
    const leader = [...forecast.candidates].sort((a, b) => b.mean - a.mean)[0];
    return { id, updatedAt: forecast.updated_at, leader: { name: leader.name, mean: leader.mean, lo: leader.ci_lower, hi: leader.ci_upper } };
  }
  if (id === 'parliamentary-2025') {
    const data = await loadForecastData();
    return data.seatData.length ? { id } : null;
  }
  return null;
}

/**
 * The homepage: four subjects, one hierarchy. Population leads in standard
 * mode and football is the rail; economy and elections support. In election
 * mode (src/lib/config/homepage.ts) the same panels change place and size.
 * Every number on the page comes from the loaders; nothing is typed in.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const config = homepageConfig();

  const [ligaSummary, economy] = await Promise.all([loadLigaSummary(), loadEconomyDashboard()]);
  const ligaDeltas = ligaSummary ? (await loadLigaWithDeltas()).deltas : {};
  const economyPausedNow = economyPaused(economy?.as_of ?? economy?.vintage_date);

  const snapshot = config.mode === 'election' && config.election ? await electionSnapshot(config.election) : null;
  const layout = resolveHomepageLayout(config, { electionHasData: id => snapshot?.id === id });
  if (layout.fallback) console.warn(`[homepage] election mode requested (${config.election ?? 'no id'}) but ${layout.fallback}; using the standard layout`);
  const current = layout.election && snapshot ? { election: layout.election, snapshot } : null;

  const economyArticle = getArticlesBySection('economics', locale)[0] ?? null;
  const latestArticle = getMDXArticlesByLocale(locale)[0] ?? null;
  const articleDate = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { year: "numeric", month: "long", day: "numeric" });

  const panel = (section: HomeSection, place: 'lead' | 'secondary' | 'support') => {
    switch (section) {
      case 'population':
        return <PopulationPanel key={section} locale={locale} variant={place === 'lead' ? 'lead' : 'secondary'} />;
      case 'football':
        return <FootballPanel key={section} locale={locale} variant={place === 'support' ? 'support' : 'secondary'} snapshot={ligaSummary} deltas={ligaDeltas} />;
      case 'economy':
        return <EconomyPanel key={section} locale={locale} economy={economy} paused={economyPausedNow} article={economyArticle} />;
      case 'elections':
        return <ElectionsPanel key={section} locale={locale} variant={place === 'lead' ? 'lead' : 'support'} elections={ALL_ELECTIONS} current={current} />;
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1280px] px-4 py-6 outline-none md:px-6 md:py-8">
        <div className="grid gap-4 md:gap-6 min-[1100px]:grid-cols-[2fr_1fr]">
          {panel(layout.lead, 'lead')}
          {panel(layout.secondary, 'secondary')}
        </div>
        <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 min-[1100px]:grid-cols-2">
          {panel(layout.support[0], 'support')}
          {panel(layout.support[1], 'support')}
        </div>
        <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-stone-600 md:mt-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{t('moreKicker')}</span>
          <Link href="/metodologia" locale={locale} className="font-semibold text-ink underline-offset-4 hover:underline">{t('moreMethodology')}</Link>
          {latestArticle && (
            <span>
              {t('moreArticle')}: <Link href={`/artigos/${latestArticle.slug}`} locale={locale} className="font-semibold text-ink underline-offset-4 hover:underline">{latestArticle.title}</Link>
              {latestArticle.date && <span> · {articleDate.format(new Date(latestArticle.date))}</span>}
            </span>
          )}
        </p>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
