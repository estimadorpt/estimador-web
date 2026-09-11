import { createPageMetadata } from '@/lib/metadata';
import { loadEconomyDashboard, loadEconomyStories } from "@/lib/utils/data-loader";
import { isTileAvailable, type EconomyDashboardTiles } from "@/types/economy-dashboard";
import { isModuleAvailable } from "@/types/economy-stories";
import { fmtDate } from "@/lib/utils/economy-format";
import { economyPaused } from "@/lib/utils/economy-time";
import { Action } from "@/components/brand/Action";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { TeaserBand } from '@/components/brand/TeaserBand';
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from "next-intl/server";
import { generatedByKey } from "@/lib/i18n/economy-labels";
import { Link } from "@/i18n/routing";
import { TrendingUp, BookOpen } from "lucide-react";
import type { Metadata } from "next";

import {
  StalenessBanner,
  StaleAwareNarrative,
} from "@/components/economics/dashboard/StalenessBanner";

import { DisclaimerCard } from "@/components/economics/dashboard/DisclaimerCard";
import { UnavailableTile } from "@/components/economics/dashboard/UnavailableTile";
import { HealthScoreTile } from "@/components/economics/dashboard/HealthScoreTile";
import { PulseTile } from "@/components/economics/dashboard/PulseTile";
import { AnnualOutlookTile } from "@/components/economics/dashboard/AnnualOutlookTile";
import { ContributionsTile } from "@/components/economics/dashboard/ContributionsTile";
import { RecessionTile } from "@/components/economics/dashboard/RecessionTile";
import { GrowthAtRiskTile } from "@/components/economics/dashboard/GrowthAtRiskTile";
import { OfficialQuarterlyTile } from "@/components/economics/dashboard/OfficialQuarterlyTile";
import { TrackRecordTile } from "@/components/economics/dashboard/TrackRecordTile";
import { LabourTile } from "@/components/economics/dashboard/LabourTile";
import { InflationTile } from "@/components/economics/dashboard/InflationTile";
import { SectionNotes } from "@/components/articles/SectionNotes";
import { StoriesSection } from "@/components/economics/stories/StoriesSection";
import { NextReleaseLine } from "@/components/economics/stories/ReleaseCalendar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return createPageMetadata({
    locale,
    path: '/economia',
    title: t("meta.economicsTitle"),
    description: t("meta.economicsDescription"),
  });
}

export default async function EconomiaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "economics" });

  const data = await loadEconomyDashboard();
  const stories = await loadEconomyStories();

  // Whole-feed failure → honest, non-crashing fallback.
  if (!data) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-stone-500">
          <p>{t("unavailable")}</p>
        </div>
      </div>
    );
  }

  const tiles: EconomyDashboardTiles = data.tiles ?? {};
  const updatedDate = fmtDate(data.vintage_date, locale);

  // Stale beyond the banner's reach: keep the page, drop the numbers.
  if (economyPaused(data.as_of ?? data.vintage_date)) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <PageHero
          width="5xl"
          field="mint"
          compact
          icon={<TrendingUp aria-hidden="true" className="w-4 h-4" />}
          eyebrow={t("eyebrow")}
          title={t("title")}
          lede={t("pageIntro")}
          meta={<span>{t("updated")} {updatedDate}</span>}
        />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <section className="rounded-2xl border border-line bg-cream p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{t("pausedKicker")}</p>
            <h2 className="mt-2 text-2xl">{t("pausedTitle")}</h2>
            <p className="mt-3 max-w-prose text-stone-600 leading-relaxed">{t("pausedBody", { date: updatedDate })}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Action href="/economia/metodologia" locale={locale} variant="secondary">{t("methodologyLink")}</Action>
              <Action href="/" locale={locale} variant="text" arrow>{t("pausedBack")}</Action>
            </div>
          </section>
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  // Top-level narrative lede — fixed-rule template over the published tiles
  // (the payload is bilingual; pick the locale, fall back to the other).
  const narrative =
    locale === "pt"
      ? data.narrative?.pt ?? data.narrative?.en
      : data.narrative?.en ?? data.narrative?.pt;

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <PageHero
        width="5xl"
        field="mint"
        compact
        icon={<TrendingUp aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("pageIntro")}
        meta={
          <>
            <span>{t("updated")} {updatedDate}</span>
            <Link
              href="/economia/metodologia"
              className="inline-flex items-center gap-1 font-semibold text-ink hover:underline"
            >
              <BookOpen aria-hidden="true" className="w-3.5 h-3.5" />
              {t("methodologyLink")}
            </Link>
            {/* next official release (estimated date, from the stories feed) */}
            {stories?.modules?.release_calendar &&
              isModuleAvailable(stories.modules.release_calendar) && (
                <NextReleaseLine
                  data={stories.modules.release_calendar}
                  locale={locale}
                />
              )}
          </>
        }
      />

      {/* Tiles */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {/* Staleness guard (client-side): banner when the payload is older than
            5 business days + a calendar-derived quarter position, so a stale
            payload can never claim "mid-quarter" after the quarter has ended. */}
        <StalenessBanner
          asOf={data.as_of}
          vintageDate={data.vintage_date}
          targetQuarter={data.vintage?.target_quarter}
          payloadPosition={data.vintage?.position}
          locale={locale}
        />

        {/* Narrative lede — the page's plain-language summary, straight from the
            feed (locale-aware). A presentation feature: no model, no new claim.
            Present-tense claims are demoted once the payload is stale. */}
        <StaleAwareNarrative
          text={narrative}
          generatedBy={(() => {
            const key = generatedByKey(data.narrative?.generated_by);
            return key ? t(key) : data.narrative?.generated_by;
          })()}
          byLabel={t("narrativeBy")}
          asOf={data.as_of}
          vintageDate={data.vintage_date}
          locale={locale}
        />

        <DisclaimerCard
          vintageDate={data.vintage_date}
          vintage={data.vintage}
          expectedNextUpdate={data.expected_next_update}
          locale={locale}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1 · health score (hero) */}
          <div className="lg:col-span-2">
            {isTileAvailable(tiles.health_score) ? (
              <HealthScoreTile data={tiles.health_score} locale={locale} />
            ) : (
              <UnavailableTile
                title={t("healthTitle")}
                reason={tiles.health_score?.reason}
                locale={locale}
              />
            )}
          </div>

          {/* 2 · pulse (anchored) */}
          <div className="lg:col-span-2">
            {isTileAvailable(tiles.pulse) ? (
              <PulseTile data={tiles.pulse} locale={locale} asOf={data.as_of ?? data.vintage_date} />
            ) : (
              <UnavailableTile
                title={t("pulseTitle")}
                reason={tiles.pulse?.reason}
                locale={locale}
              />
            )}
          </div>

          {/* 3 · annual outlook — the editorial centerpiece */}
          <div className="lg:col-span-2">
            {isTileAvailable(tiles.annual_outlook) ? (
              <AnnualOutlookTile data={tiles.annual_outlook} locale={locale} />
            ) : (
              <UnavailableTile
                title={t("annualTitleFallback")}
                reason={tiles.annual_outlook?.reason}
                locale={locale}
              />
            )}
          </div>

          {/* 4 · contributions */}
          <div>
            {isTileAvailable(tiles.contributions) ? (
              <ContributionsTile data={tiles.contributions} locale={locale} />
            ) : (
              <UnavailableTile
                title={t("contributionsTitle")}
                reason={tiles.contributions?.reason}
                locale={locale}
              />
            )}
          </div>

          {/* 5 · labour market */}
          <div>
            {isTileAvailable(tiles.labour) ? (
              <LabourTile data={tiles.labour} locale={locale} />
            ) : (
              <UnavailableTile
                title={t("labourTitle")}
                reason={tiles.labour?.reason}
                locale={locale}
              />
            )}
          </div>

          {/* 5b · inflation (PR-1 gated official-data tracker) */}
          <div className="lg:col-span-2">
            {isTileAvailable(tiles.inflation) ? (
              <InflationTile data={tiles.inflation} locale={locale} />
            ) : tiles.inflation ? (
              <UnavailableTile
                title={t("inflationTitle")}
                reason={tiles.inflation?.reason}
                locale={locale}
              />
            ) : null}
          </div>

          {/* 6 · recession */}
          <div className="lg:col-span-2">
            {isTileAvailable(tiles.recession) ? (
              <RecessionTile data={tiles.recession} locale={locale} />
            ) : (
              <UnavailableTile
                title={t("recessionTitle")}
                reason={tiles.recession?.reason}
                locale={locale}
              />
            )}
          </div>

          {/* 7 · growth at risk */}
          <div className="lg:col-span-2">
            {isTileAvailable(tiles.growth_at_risk) ? (
              <GrowthAtRiskTile data={tiles.growth_at_risk} locale={locale} />
            ) : (
              <UnavailableTile
                title={t("garTitle")}
                reason={tiles.growth_at_risk?.reason}
                locale={locale}
              />
            )}
          </div>

          {/* 8 · official quarterly (demoted) */}
          <div>
            {isTileAvailable(tiles.official_quarterly) ? (
              <OfficialQuarterlyTile data={tiles.official_quarterly} locale={locale} />
            ) : (
              <UnavailableTile
                title={t("officialTitle")}
                reason={tiles.official_quarterly?.reason}
                locale={locale}
              />
            )}
          </div>

          {/* 9 · track record */}
          <div>
            {isTileAvailable(tiles.track_record) ? (
              <TrackRecordTile data={tiles.track_record} locale={locale} />
            ) : (
              <UnavailableTile
                title={t("trackTitle")}
                reason={tiles.track_record?.reason}
                locale={locale}
              />
            )}
          </div>
        </div>

        {/* Data stories — official numbers + explicit arithmetic, no models. */}
        {stories && <StoriesSection stories={stories} locale={locale} />}

        {/* The explainer teaser comes after the useful data, never above it. */}
        <TeaserBand
          field="mint"
          title={locale === "pt" ? "O que significam estes números?" : "What do these numbers mean?"}
          href="/economia/metodologia"
          locale={locale}
          action={locale === "pt" ? "Ler a metodologia" : "Read the methodology"}
          className="mt-4"
        >
          {locale === "pt"
            ? "De onde vêm os dados, o que é oficial e o que é estimativa nossa, e porque é que cada painel diz a data a que se refere."
            : "Where the data comes from, what is official and what is our estimate, and why every panel says the date it refers to."}
        </TeaserBand>

        {/* Written analysis, framed like the stories block above it: the tiles
            are the dashboard, and prose is what follows the dashboard. */}
        <SectionNotes
          section="economics"
          locale={locale}
          className="pt-4"
          containerClassName="border-t border-stone-200 pt-8"
        />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
