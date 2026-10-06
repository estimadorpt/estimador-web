import { createPageMetadata } from '@/lib/metadata';
import { Disclosure } from '@/components/viz/Disclosure';
import { loadEconomyDashboard, loadEconomyStories } from "@/lib/utils/data-loader";
import { isTileAvailable, type EconomyDashboardTiles } from "@/types/economy-dashboard";
import { isModuleAvailable } from "@/types/economy-stories";
import { fmtDate } from "@/lib/utils/economy-format";
import { ECONOMY_PUBLISHED, economyState } from "@/lib/config/economy-status";
import { Action } from "@/components/brand/Action";
import { Header } from "@/components/Header";
import { EconomyReading } from '@/components/economics/EconomyReading';
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

import { WhatChanged } from "@/components/economics/dashboard/WhatChanged";
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
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  // While the section is in preparation (src/lib/config/economy-status.json)
  // the page stays online as an explainer but out of search, with a title and
  // description that promise only what it shows.
  return createPageMetadata({
    locale,
    path: '/economia',
    title: t(ECONOMY_PUBLISHED ? "meta.economicsTitle" : "meta.economicsPreparingTitle"),
    description: t(ECONOMY_PUBLISHED ? "meta.economicsDescription" : "meta.economicsPreparingDescription"),
    index: ECONOMY_PUBLISHED,
  });
}

/**
 * A status beside the card's kicker: one box that wraps as a box on a phone.
 * A rounded-full inline span broke into two ragged pills (UXM3-10).
 */
const STATUS_PILL = 'inline-block rounded-lg px-2.5 py-1';

export default async function EconomiaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "economics" });

  // The feeds are not shipped while the section is in preparation
  // (economy-status.json), so they are only read once it is published.
  const data = ECONOMY_PUBLISHED ? await loadEconomyDashboard() : null;
  const stories = ECONOMY_PUBLISHED ? await loadEconomyStories() : null;
  const state = economyState(data?.as_of ?? data?.vintage_date);

  // Written analysis filed under the economy, on every branch of the page; it
  // renders nothing while the section has published nothing.
  const notes = (
    <SectionNotes
      section="economics"
      locale={locale}
      className="pt-4"
      containerClassName="mt-8 border-t border-stone-200 pt-8"
    />
  );

  // In preparation: the editorial flag is off. The explainers are the page; no
  // number, no date and no promise of when the read-out arrives.
  if (state === 'preparing') {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="wide"
          field="mint"
          compact
          icon={<TrendingUp aria-hidden="true" className="w-4 h-4" />}
          eyebrow={t("preparingEyebrow")}
          title={t("preparingTitle")}
          lede={t("preparingLede")}
        />
        <div className="mx-auto w-full max-w-7xl px-4 py-6"><div className="max-w-5xl">
          {/* The status is the kicker's and the lede's: the card says it no
              third time (CL3-09), and carries no painting, since a data page
              takes a tinted field and no art (VUXD-03). */}
          <EconomyReading locale={locale} />
          {/* Why there are no numbers is in the lede above; what remains here
              is where the method is explained. */}
          <div className="mt-8 border-t border-line pt-4">
            <Action href="/economia/metodologia" locale={locale} variant="text" arrow>{t("methodologyTitle")}</Action>
          </div>
          {notes}
        </div></div>
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  // Whole-feed failure → the same explainer/question areas as the paused
  // branch, with an "unavailable" status instead of a thinner page. The
  // shared EconomyReading component is the single source of truth for both.
  if (!data) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="wide"
          field="mint"
          compact
          icon={<TrendingUp aria-hidden="true" className="w-4 h-4" />}
          eyebrow={t("eyebrow")}
          title={t("title")}
          lede={t("explainerLede")}
        />
        <div className="mx-auto w-full max-w-7xl px-4 py-6"><div className="max-w-5xl">
          <EconomyReading
            locale={locale}
            status={
              <span className={`${STATUS_PILL} bg-stone-200 text-stone-700`}>
                {t("statusUnavailable")}
              </span>
            }
          />
          <p className="mt-6 max-w-prose border-l-2 border-line pl-4 text-sm leading-relaxed text-ink-muted">
            {t("unavailableBody")}
          </p>
          {notes}
        </div></div>
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  const tiles: EconomyDashboardTiles = data.tiles ?? {};
  const updatedDate = fmtDate(data.vintage_date, locale);

  // Published but stale beyond the banner's reach: keep the page, drop the
  // numbers. The question and its answer come first — right after a minimal
  // hero — with the paused status inline beside them, not in a section above.
  if (state === 'paused') {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="wide"
          field="mint"
          compact
          icon={<TrendingUp aria-hidden="true" className="w-4 h-4" />}
          eyebrow={t("eyebrow")}
          title={t("title")}
          lede={t("explainerLede")}
        />
        <div className="mx-auto w-full max-w-7xl px-4 py-6"><div className="max-w-5xl">
          <EconomyReading
            locale={locale}
            status={
              <span className={`${STATUS_PILL} bg-amber-100 text-amber-800`}>
                {t("statusPaused", { date: updatedDate })}
              </span>
            }
          />
          <Disclosure className="mt-8 border-t border-line pt-3 text-sm text-ink-muted" summary={t("pausedQuestion")}>
            <p className="my-3 leading-relaxed">{t("pausedBody", { date: updatedDate })}</p>
            <Action href="/economia/metodologia" locale={locale} variant="text" arrow>{t("methodologyLink")}</Action>
          </Disclosure>
          {notes}
        </div></div>
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

  const releaseCalendar =
    stories?.modules?.release_calendar && isModuleAvailable(stories.modules.release_calendar)
      ? stories.modules.release_calendar
      : undefined;

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="wide"
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
          </>
        }
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8"><div className="max-w-5xl space-y-5">

      {/* Tiles */}
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
            Present-tense claims are demoted once the payload is stale. This is
            the page's "one dated conclusion + main evidence". */}
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

        {/* "What changed since the last reading" + the next relevant release —
            read from existing payload fields only (contributions.revision_decomposition,
            the release calendar). Comes before the tile inventory, not after it. */}
        <WhatChanged
          revision={tiles.contributions?.revision_decomposition}
          targetQuarter={tiles.contributions?.target_quarter ?? data.vintage?.target_quarter}
          nextRelease={releaseCalendar}
          locale={locale}
        />

        {/* Question-led paths (prices, work/income, activity) — moved up,
            ahead of the ten-tile inventory, per the usability diagnosis. */}
        <EconomyReading locale={locale} />

        <DisclaimerCard
          vintageDate={data.vintage_date}
          vintage={data.vintage}
          expectedNextUpdate={data.expected_next_update}
          locale={locale}
        />

        {/* The ten-tile instrument inventory, demoted below the dated
            conclusion and the question-led paths above. The health score is
            not visually promoted above the facts it summarises. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1 · health score */}
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
      </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
