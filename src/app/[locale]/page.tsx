import { HomeMiniature } from '@/components/miniatura/HomeMiniature';
import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight, Trophy, Vote, TrendingUp, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { loadLigaSummary, loadLigaWithDeltas } from "@/lib/utils/football-data-loader";
import { loadEconomyDashboard } from "@/lib/utils/data-loader";
import { getMDXArticlesByLocale } from "@/lib/mdx-articles";
import { ligaTeamColors, teamDisplayName } from "@/lib/config/football";
import { Action } from "@/components/brand/Action";
import { HomeEconomyFreshness } from "@/components/economics/HomeEconomyFreshness";
import { economyPaused } from "@/lib/utils/economy-time";
import {
  fmtScore,
  fmtSignedPctValue,
  fmtProbPct,
  fmtDate,
} from "@/lib/utils/economy-format";

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const ligaSummary = await loadLigaSummary();
  // The lead: one dated finding from the latest matchday, written by a fixed
  // rule over the published numbers (no model, no new claim), with the route in.
  const ligaDeltas = ligaSummary ? (await loadLigaWithDeltas()).deltas : {};
  const pct = (p: number) => Math.round(p * 100);
  const lead = (() => {
    if (!ligaSummary || ligaSummary.top3.length < 3) return null;
    const [first, second, third] = ligaSummary.top3;
    const tied = pct(second.p_champion) === pct(third.p_champion);
    const mover = Object.values(ligaDeltas).sort((a, b) => Math.abs(b.p_champion_delta) - Math.abs(a.p_champion_delta))[0];
    const date = ligaSummary.timestamp ? new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(ligaSummary.timestamp)) : "";
    return {
      kicker: t("home.leadKicker", { matchday: ligaSummary.matchday, date }),
      sentence: `${t("home.leadLeader", { team: teamDisplayName(first.team), p: pct(first.p_champion) })} ${tied
        ? t("home.leadTied", { a: teamDisplayName(second.team), b: teamDisplayName(third.team), p: pct(second.p_champion) })
        : t("home.leadFollow", { a: teamDisplayName(second.team), pa: pct(second.p_champion), b: teamDisplayName(third.team), pb: pct(third.p_champion) })}`,
      mover: mover && Math.abs(mover.p_champion_delta) >= 1
        ? t("home.leadMover", { team: teamDisplayName(mover.team), delta: new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-GB", { maximumFractionDigits: 1, signDisplay: "always" }).format(mover.p_champion_delta).replace("-", "\u2212") })
        : null,
      matches: ligaSummary.nextMatchday?.matches?.length ?? 0,
    };
  })();
  const economy = await loadEconomyDashboard();
  const economyPausedNow = economyPaused(economy?.as_of ?? economy?.vintage_date);
  const economyTiles = economyPausedNow ? undefined : economy?.tiles;

  // The homepage is otherwise entirely models and numbers, so nothing on it
  // says the site also writes. Two pieces is enough to establish that without
  // turning the front page into an index; the loader already sorts newest first.
  const recentArticles = getMDXArticlesByLocale(locale).slice(0, 2);
  const articleDateFormat = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <HomeMiniature locale={locale === 'en' ? 'en' : 'pt'} />
      {/* The second act: a real, dated finding and the way in. */}
      {lead && (
        <section className="border-b border-line bg-cream">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{lead.kicker}</p>
            <h2 className="mt-2 max-w-3xl text-2xl leading-tight md:text-3xl">{lead.sentence}</h2>
            {lead.mover && <p className="mt-2 max-w-2xl text-base leading-relaxed text-stone-600">{lead.mover}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
              <Action href="/desporto/liga" locale={locale} arrow>{t("home.leadAction")}</Action>
              {lead.matches > 0 && <Action href="/desporto/liga/jogo-previsoes" locale={locale} variant="text" arrow>{t("home.leadMatches", { count: lead.matches })}</Action>}
            </div>
          </div>
        </section>
      )}

      {/* Active Sections */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Liga Portugal card */}
          {ligaSummary && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-stone-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  {t("football.title")} — {t("football.season")}{" "}
                  {ligaSummary.season}
                </span>
                <span className="text-[11px] bg-green-100 text-green-800 font-bold px-2 py-0.5">
                  {t("sections.activeSection")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-200 border border-stone-200">
                {ligaSummary.top3.map((team, i) => {
                  const color = ligaTeamColors[team.team] || "#5f7062";
                  return (
                    <div key={team.team} className="bg-cream p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-1.5 h-5"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium text-stone-600">
                          {i + 1}. {team.team}
                        </span>
                      </div>
                      <div className="text-3xl font-display font-extrabold tabular-nums text-stone-900">
                        {Math.round(team.p_champion * 100)}%
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mt-1">
                        {t("football.championship")}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  {t("football.matchday")} {ligaSummary.matchday} ·{" "}
                  {ligaSummary.nextMatchday.matches.length}{" "}
                  {locale === "pt" ? "jogos na próxima jornada" : "matches next matchday"}
                </span>
                <Link
                  href="/desporto/liga"
                  locale={locale}
                  className="text-sm font-medium text-ink hover:text-ink-dark inline-flex items-center gap-1 group"
                >
                  {t("common.viewFull")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* Economia card */}
          <div className={economyPausedNow ? "mb-8" : "mb-10"}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-stone-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                {t("sections.economics")}
              </span>
              <span className={economyPausedNow ? "text-[11px] bg-parchment text-stone-600 font-bold px-2 py-0.5" : "text-[11px] bg-green-100 text-green-800 font-bold px-2 py-0.5"}>
                {economyPausedNow ? t("sections.pausedSection") : t("sections.activeSection")}
              </span>
            </div>

            {economyTiles ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-200 border border-stone-200">
                {/* health score */}
                <div className="bg-cream p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-5" style={{ backgroundColor: "#245c68" }} />
                    <span className="text-sm font-medium text-stone-600">
                      {t("economics.homeCardHealth")}
                    </span>
                  </div>
                  <div className="text-3xl font-display font-extrabold tabular-nums text-stone-900">
                    {fmtScore(economyTiles.health_score?.score_0_100)}
                    <span className="text-base font-bold text-stone-400">/100</span>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mt-1">
                    {t("economics.labelStateOfEconomy")}
                  </div>
                </div>
                {/* activity anchor (BdP coincident, YoY) */}
                <div className="bg-cream p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-5" style={{ backgroundColor: "#245c68" }} />
                    <span className="text-sm font-medium text-stone-600">
                      {t("economics.homeCardPulse")}
                    </span>
                  </div>
                  <div className="text-3xl font-display font-extrabold tabular-nums text-stone-900">
                    {fmtSignedPctValue(economyTiles.pulse?.anchor?.value, 1)}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mt-1">
                    {t("economics.labelPreliminary")}
                  </div>
                </div>
                {/* recession risk */}
                <div className="bg-cream p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-5" style={{ backgroundColor: "#245c68" }} />
                    <span className="text-sm font-medium text-stone-600">
                      {t("economics.homeCardRecession")}
                    </span>
                  </div>
                  <div className="text-3xl font-display font-extrabold tabular-nums text-stone-900">
                    {fmtProbPct(economyTiles.recession?.probability, 0)}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mt-1">
                    {t("economics.labelRecessionRisk")}
                  </div>
                </div>
              </div>
            ) : (
              <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
                {economyPausedNow ? t("economics.pausedHome", { date: fmtDate(economy?.vintage_date, locale) }) : t("sections.economicsDescription")}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between gap-4">
              {economyPausedNow ? <span /> : (
                <HomeEconomyFreshness
                  asOf={economy?.as_of}
                  vintageDate={economy?.vintage_date}
                  locale={locale}
                />
              )}
              <Link
                href="/economia"
                locale={locale}
                className="text-sm font-medium text-ink hover:text-ink-dark inline-flex items-center gap-1 group"
              >
                {t("common.viewFull")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Elections card */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Vote className="w-5 h-5 text-stone-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                {t("nav.elections")}
              </span>
              <span className="text-[11px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5">
                {t("sections.archiveSection")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stone-200 border border-stone-200">
              {/* Presidential */}
              <Link
                href="/eleicoes/presidenciais"
                locale={locale}
                className="bg-cream p-5 hover:bg-stone-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-900 group-hover:text-ink">
                      {t("sections.presidential2026")}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {t("sections.presidential2026Description")}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              {/* Parliamentary */}
              <Link
                href="/eleicoes/legislativas"
                locale={locale}
                className="bg-cream p-5 hover:bg-stone-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-900 group-hover:text-ink">
                      {t("sections.parliamentary2025")}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {t("sections.parliamentary2025Description")}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Written analysis */}
      {recentArticles.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-5 h-5 text-stone-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                {t("articles.title")}
              </span>
            </div>

            {/* One piece would leave half the row as bare divider colour, so the
                second column only appears once there is something to put in it. */}
            <div
              className={`grid grid-cols-1 gap-px bg-stone-200 border border-stone-200${
                recentArticles.length > 1 ? " md:grid-cols-2" : ""
              }`}
            >
              {recentArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/artigos/${article.slug}`}
                  locale={locale}
                  className="bg-cream p-5 hover:bg-stone-100 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    <span className="text-stone-800">
                      {t(article.kind === "nota" ? "articles.kindNota" : "articles.kindExplicador")}
                    </span>
                    <time dateTime={article.date}>
                      {articleDateFormat.format(new Date(article.date))}
                    </time>
                  </div>
                  <div className="text-base font-semibold leading-snug text-stone-900 group-hover:text-ink">
                    {article.title}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-600">
                    {article.excerpt}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-end">
              <Link
                href="/artigos"
                locale={locale}
                className="text-sm font-medium text-ink hover:text-ink-dark inline-flex items-center gap-1 group"
              >
                {t("articles.viewAll")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <SiteFooter locale={locale} />
    </div>
  );
}
