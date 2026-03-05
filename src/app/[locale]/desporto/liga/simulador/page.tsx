import { loadLigaData } from "@/lib/utils/football-data-loader";
import { Header } from "@/components/Header";
import { MatchdayPicker } from "@/components/charts/football/MatchdayPicker";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Trophy } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: locale === "pt"
      ? "Simulador — Liga Portugal - estimador.pt"
      : "Simulator — Liga Portugal - estimador.pt",
    description: t("football.whatIfDescription"),
    alternates: {
      canonical: `https://estimador.pt/${locale}/desporto/liga/simulador`,
    },
  };
}

export default async function SimuladorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const { prediction, scenarios } = await loadLigaData();

  if (!prediction || !scenarios?.next_matchday_scenarios) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-stone-500">
          <p>{locale === "pt" ? "Dados do simulador não disponíveis." : "Simulator data not available."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero section */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <Link
            href="/desporto/liga"
            locale={locale}
            className="text-sm text-stone-400 hover:text-white inline-flex items-center gap-1 mb-4 group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {t("football.backToLeague")}
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {t("football.title")} — {t("football.matchday")} {prediction.next_matchday.matchday}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {t("football.simulator")}
          </h1>
          <p className="text-stone-400 text-sm">
            {t("football.simulatorCta")}
          </p>
        </div>
      </section>

      {/* Simulator */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <MatchdayPicker
            data={scenarios.next_matchday_scenarios}
            labels={{
              whatIfTitle: t("football.whatIfTitle"),
              whatIfDescription: t("football.whatIfDescription"),
              resetAll: t("football.resetAll"),
              impactOnTitle: t("football.impactOnTitle"),
              impactOnRelegation: t("football.impactOnRelegation"),
              noChange: t("football.noChange"),
              home: t("football.home"),
              draw: t("football.draw"),
              away: t("football.away"),
              win: t("football.win"),
              simulatedStandings: t("football.simulatedStandings"),
              team: t("football.team"),
              championship: t("football.championship"),
              top3: t("football.top3"),
              relegation: t("football.relegation"),
            }}
          />
        </div>
      </section>
    </div>
  );
}
