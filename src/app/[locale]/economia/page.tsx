import { loadEconomyDashboard } from "@/lib/utils/data-loader";
import { isTileAvailable, type EconomyDashboardTiles } from "@/types/economy-dashboard";
import { fmtDate } from "@/lib/utils/economy-format";
import { Header } from "@/components/Header";
import { getTranslations } from "next-intl/server";
import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("meta.economicsTitle"),
    description: t("meta.economicsDescription"),
    openGraph: {
      title: t("meta.economicsTitle"),
      description: t("meta.economicsDescription"),
      type: "website",
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/economia`,
    },
  };
}

export default async function EconomiaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "economics" });

  const data = await loadEconomyDashboard();

  // Whole-feed failure → honest, non-crashing fallback.
  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-stone-500">
          <p>{t("unavailable")}</p>
        </div>
      </div>
    );
  }

  const tiles: EconomyDashboardTiles = data.tiles ?? {};
  const updatedDate = fmtDate(data.vintage_date, locale);

  // Top-level narrative lede — fixed-rule template over the published tiles
  // (the payload is bilingual; pick the locale, fall back to the other).
  const narrative =
    locale === "pt"
      ? data.narrative?.pt ?? data.narrative?.en
      : data.narrative?.en ?? data.narrative?.pt;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t("eyebrow")}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("title")}</h1>
          <p className="text-stone-300 text-sm md:text-base max-w-2xl">
            {t("pageIntro")}
          </p>
          <p className="text-stone-400 text-xs mt-3">
            {t("updated")} {updatedDate}
          </p>
        </div>
      </section>

      {/* Tiles */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {/* Narrative lede — the page's plain-language summary, straight from the
            feed (locale-aware). A presentation feature: no model, no new claim. */}
        {narrative && (
          <section className="border-l-2 border-stone-300 pl-4">
            <p className="text-base md:text-lg leading-relaxed text-stone-700 max-w-4xl">
              {narrative}
            </p>
            {data.narrative?.generated_by && (
              <p className="mt-1.5 text-[10px] text-stone-400">
                {t("narrativeBy")}: {data.narrative.generated_by}
              </p>
            )}
          </section>
        )}

        <DisclaimerCard
          vintageDate={data.vintage_date}
          vintage={data.vintage}
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
              <PulseTile data={tiles.pulse} locale={locale} />
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
      </main>
    </div>
  );
}
