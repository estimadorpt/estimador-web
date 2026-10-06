import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import { loadLigaSummary, loadLigaWithDeltas } from "@/lib/utils/football-data-loader";
import { loadEconomyDashboard, loadPresidentialData, loadForecastData } from "@/lib/utils/data-loader";
import { ECONOMY_PUBLISHED, economyState } from "@/lib/config/economy-status";
import { loadPopulationMeta } from "@/lib/utils/population-data-loader";
import { getArticlesBySection, getMDXArticlesByLocale } from "@/lib/mdx-articles";
import { ALL_ELECTIONS } from "@/lib/config/elections";
import { homepageConfig, resolveHomepageLayout, type HomeSection } from "@/lib/config/homepage";
import { PopulationPanel } from "@/components/home/PopulationPanel";
import { FootballPanel } from "@/components/home/FootballPanel";
import { EconomyPanel } from "@/components/home/EconomyPanel";
import { ElectionsPanel, type ElectionSnapshot } from "@/components/home/ElectionsPanel";
import { setRequestLocale } from '@/i18n/request-locale';
import { brandDescriptor, brandLine } from '@/lib/brand/descriptor';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
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
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const config = homepageConfig();

  // The economy feed is not shipped while the section is in preparation, so it
  // is only read once the flag is on.
  const [ligaSummary, economy, populationMeta] = await Promise.all([
    loadLigaSummary(),
    ECONOMY_PUBLISHED ? loadEconomyDashboard() : Promise.resolve(null),
    loadPopulationMeta(),
  ]);
  const ligaDeltas = ligaSummary ? (await loadLigaWithDeltas()).deltas : {};
  // The editorial flag first (src/lib/config/economy-status.json), then the
  // staleness guard: fresh data alone never puts a number on the homepage.
  const economyNow = economyState(economy?.as_of ?? economy?.vintage_date);

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
        return <PopulationPanel key={section} locale={locale} variant={place === 'lead' ? 'lead' : 'secondary'} meta={populationMeta} />;
      case 'football':
        return <FootballPanel key={section} locale={locale} variant={place === 'support' ? 'support' : 'secondary'} snapshot={ligaSummary} deltas={ligaDeltas} />;
      case 'economy':
        return <EconomyPanel key={section} locale={locale} economy={economy} state={economyNow} article={economyArticle} />;
      case 'elections':
        return <ElectionsPanel key={section} locale={locale} variant={place === 'lead' ? 'lead' : 'support'} elections={ALL_ELECTIONS} current={current} />;
    }
  };
  // The support row reads in the order of what is live, as the nav does: the
  // economy, while it is in preparation, comes after the election archive.
  const support = ECONOMY_PUBLISHED ? layout.support : [...layout.support].sort((a, b) => Number(a === 'economy') - Number(b === 'economy'));

  // The shortcuts stand in for the nav below 1024px, where it sits behind the
  // menu button: labelled, each with its status, in the order of what is live.
  // The economy has none while it is in preparation.
  const shortcuts = [
    { href: '/populacao', label: t('shortcutPopulation'), status: populationMeta ? t('shortcutPopulationStatus', { version: populationMeta.release_version }) : null },
    { href: '/#escolher-equipa', label: t('shortcutClub'), status: ligaSummary ? t('shortcutClubStatus', { matchday: ligaSummary.matchday }) : null },
    { href: '/eleicoes/arquivo', label: t('shortcutElections'), status: t('shortcutElectionsStatus') },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1280px] px-4 py-6 outline-none md:px-6 md:py-8">
        {/* What the site is, before any one subject: the line is the page's
            h1, kept small so the population lead stays above the fold. */}
        <div className="mb-5 max-w-4xl md:mb-6">
          <h1 className="text-lg leading-snug text-ink md:text-xl">{brandLine(locale)}</h1>
          <p className="mt-1 text-sm leading-relaxed text-stone-600 md:text-[15px]">
            {brandDescriptor(locale)}{' '}
            <Link href="/sobre" locale={locale} className="font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">{t('aboutLink')}</Link>
          </p>
        </div>
        <nav aria-labelledby="home-shortcuts-label" className="mb-5 lg:hidden">
          <p id="home-shortcuts-label" className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{t('shortcutsLabel')}</p>
          <ul className="grid grid-cols-3 gap-2">
            {shortcuts.map(task => (
              <li key={task.href} className="min-w-0">
                <Link href={task.href} locale={locale} className="flex h-full min-h-14 flex-col justify-center rounded-lg border border-line bg-cream px-2.5 py-2 text-ink transition-colors hover:bg-parchment">
                  <span className="text-sm font-semibold leading-tight">{task.label}</span>
                  {task.status && <span className="mt-0.5 text-[12px] leading-tight text-stone-600">{task.status}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Cards keep their own height (items-start): a short rail or support
            card ends where its content does instead of stretching into an
            empty cream block beside a taller neighbour. */}
        <div className="grid items-start gap-4 md:gap-6 min-[1100px]:grid-cols-[2fr_1fr]">
          {panel(layout.lead, 'lead')}
          {panel(layout.secondary, 'secondary')}
        </div>
        <div className="mt-4 grid items-start gap-4 md:mt-6 md:gap-6 min-[900px]:grid-cols-2">
          {support.map(section => panel(section, 'support'))}
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
