import { loadEconomicsData } from "@/lib/utils/data-loader";
import { Header } from "@/components/Header";
import { GdpNowcastChart, type GdpChartPoint } from "@/components/economics/GdpNowcastChart";
import { getTranslations } from "next-intl/server";
import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";

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

function fmtSignedPct(v: number): string {
  const pct = v * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

export default async function EconomiaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const data = await loadEconomicsData();

  if (!data || !data.headline) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-stone-500">
          <p>{t("economics.unavailable")}</p>
        </div>
      </div>
    );
  }

  const { headline, latest_official, gdp_history } = data;
  const isPreliminary = headline.status !== "authoritative";

  const updatedDate = new Date(data.vintage_date).toLocaleDateString(
    locale === "pt" ? "pt-PT" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const chartData: GdpChartPoint[] = [
    ...(gdp_history ?? []).map((p) => ({ quarter: p.quarter, value: p.qoq_growth })),
    { quarter: data.target_quarter, value: headline.point, isNowcast: true },
  ];

  const [bandLo, bandHi] = headline.typical_error_band;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t("economics.eyebrow")}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {t("economics.title")}
          </h1>
          <p className="text-stone-400 text-sm">
            {t("economics.updated")} {updatedDate}
          </p>
        </div>
      </section>

      {/* Headline numbers: latest official + current-quarter nowcast */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Latest official quarter */}
          {latest_official && (
            <div className="border-t-2 border-stone-300 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                {t("economics.officialLabel")} · {latest_official.quarter}
              </div>
              <div className="text-5xl font-black tabular-nums text-stone-900">
                {fmtSignedPct(latest_official.qoq_growth)}
              </div>
              <p className="text-xs text-stone-400 mt-2">
                {t("economics.qoq")} · {t("economics.officialSource")}
              </p>
            </div>
          )}

          {/* Current-quarter nowcast */}
          <div className="border-t-2 pt-4" style={{ borderColor: "#1B4D5E" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {t("economics.nowcastLabel")} · {data.target_quarter}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isPreliminary
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isPreliminary
                  ? t("economics.preliminaryBadge")
                  : t("economics.authoritativeBadge")}
              </span>
            </div>
            <div className="text-5xl font-black tabular-nums" style={{ color: "#1B4D5E" }}>
              {fmtSignedPct(headline.point)}
            </div>
            <p className="text-xs text-stone-500 mt-2">
              {t("economics.bandLabel")}: {fmtSignedPct(bandLo)} … {fmtSignedPct(bandHi)}
              {" "}({t("economics.qoq")})
            </p>
            <p className="text-xs text-stone-500 mt-3 leading-relaxed max-w-md">
              {isPreliminary
                ? t("economics.caveatPreliminary")
                : t("economics.caveatAuthoritative")}
            </p>
          </div>
        </div>
      </section>

      {/* History chart */}
      {chartData.length > 1 && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-1">
              {t("economics.historyTitle")}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {t("economics.historyDescription")}
            </p>
            <GdpNowcastChart
              data={chartData}
              labels={{
                official: t("economics.chartOfficial"),
                nowcast: t("economics.chartNowcast"),
              }}
            />
          </div>
        </section>
      )}

      {/* Methodology / honest disclosure */}
      <section>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold tracking-tight mb-3">
            {t("economics.methodologyTitle")}
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
            {t("economics.methodologyBody")}
          </p>
          <p className="text-xs text-stone-400 mt-4">
            {t("economics.modelLabel")}: {headline.model}
          </p>
        </div>
      </section>
    </div>
  );
}
