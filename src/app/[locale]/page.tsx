import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import { loadLigaSamples, loadLigaWithDeltas, loadUpcomingFixtures } from "@/lib/utils/football-data-loader";
import { loadEconomyDashboard, loadPresidentialData, loadForecastData } from "@/lib/utils/data-loader";
import { ECONOMY_PUBLISHED, economyState } from "@/lib/config/economy-status";
import { loadPopulationMeta } from "@/lib/utils/population-data-loader";
import { getArticlesBySection, getMDXArticlesByLocale } from "@/lib/mdx-articles";
import { ALL_ELECTIONS } from "@/lib/config/elections";
import { homepageConfig, resolveHomepageLayout } from "@/lib/config/homepage";
import { PopulationPanel } from "@/components/home/PopulationPanel";
import { LigaInstrument, pointsQuantiles } from "@/components/home/LigaInstrument";
import { EconomyPanel } from "@/components/home/EconomyPanel";
import { ElectionsPanel, type ElectionSnapshot } from "@/components/home/ElectionsPanel";
import { setRequestLocale } from '@/i18n/request-locale';
import { CONTAINER_CLASS } from '@/components/brand/Container';
import { ChannelHead, ReadingRule } from "@/components/instrument";
import { brandLine } from '@/lib/brand/descriptor';

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
 * The homepage: the site's live readings as instruments, in the order of
 * what is live. The Liga (the finding, the clubs with a title chance on one
 * ruler, relegation, the next games and their stakes) and the synthetic
 * population (what it is, the counter-sign of a single run, the parish
 * search) share the first row; the election archive follows with one dated
 * finding per election. The economy appears only once it publishes. In
 * election mode (src/lib/config/homepage.ts) the configured election leads.
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
  const [liga, samples, upcoming, economy, populationMeta] = await Promise.all([
    loadLigaWithDeltas(),
    loadLigaSamples(),
    loadUpcomingFixtures(),
    ECONOMY_PUBLISHED ? loadEconomyDashboard() : Promise.resolve(null),
    loadPopulationMeta(),
  ]);
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

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      {/* The shared container (UXD2-14): the rules, the instruments and the
          header's logo start at the same x. */}
      <main id="main-content" tabIndex={-1} className={`${CONTAINER_CLASS} pt-4 outline-none md:pt-5`}>
        {/* What the site is, in one line, and how to read every figure on it:
            the three marks, printed once. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-rule pb-3">
          <div className="flex flex-wrap items-baseline gap-x-2 text-[14px] leading-5">
            <h1 className="font-sans tracking-normal text-[14px] font-semibold leading-5">{brandLine(locale)}</h1>
            <Link href="/sobre" locale={locale} className="inline-flex min-h-11 items-center text-ink underline decoration-scale underline-offset-4 hover:decoration-ink md:min-h-0">{t('aboutLink')}</Link>
          </div>
          <p className="text-[13px] leading-5 text-graphite"><ReadingRule locale={locale} /></p>
        </div>

        {current && (
          <div className="mt-6">
            <ElectionsPanel locale={locale} variant="lead" elections={ALL_ELECTIONS} current={current} />
          </div>
        )}

        <div className="mt-6 grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {liga.prediction ? (
            <LigaInstrument
              locale={locale}
              prediction={liga.prediction}
              scenarios={liga.scenarios}
              deltas={liga.deltas}
              quantiles={pointsQuantiles(samples)}
              fixtures={upcoming}
            />
          ) : (
            <section aria-labelledby="home-liga">
              <ChannelHead id="home-liga" title="Liga Portugal" href="/desporto/liga" locale={locale} />
              <p className="mt-3 text-[15px] text-graphite">{t('footballUnavailable')}</p>
            </section>
          )}
          <PopulationPanel locale={locale} meta={populationMeta} />
        </div>

        {!current && (
          <div className="mt-12">
            <ElectionsPanel locale={locale} variant="support" elections={ALL_ELECTIONS} current={null} />
          </div>
        )}

        {ECONOMY_PUBLISHED && (
          <div className="mt-12">
            <EconomyPanel locale={locale} economy={economy} state={economyNow} article={economyArticle} />
          </div>
        )}

        <p className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-rule pt-3 text-[13px] text-graphite">
          <Link href="/metodologia" locale={locale} className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-scale underline-offset-4 hover:decoration-ink">{t('moreMethodology')}</Link>
          {latestArticle && (
            <span>
              {t('moreArticle')}: <Link href={`/artigos/${latestArticle.slug}`} locale={locale} className="font-semibold text-ink underline decoration-scale underline-offset-4 hover:decoration-ink">{latestArticle.title}</Link>
              {latestArticle.date && <span> · {articleDate.format(new Date(latestArticle.date))}</span>}
            </span>
          )}
        </p>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
