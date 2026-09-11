import { createPageMetadata } from '@/lib/metadata';
import { loadLigaData, loadLigaSamples } from "@/lib/utils/football-data-loader";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { MatchdayPicker } from "@/components/charts/football/MatchdayPicker";
import { DueloFinal } from "@/components/charts/football/DueloFinal";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Trophy } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return createPageMetadata({
    locale,
    path: `/desporto/liga/simulador`,
    title: locale === "pt"
      ? "Simulador — Liga Portugal - estimador.pt"
      : "Simulator — Liga Portugal - estimador.pt",
    description: t("football.whatIfDescription"),
  });
}

export default async function SimuladorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const [{ prediction, scenarios }, seasonSamples] = await Promise.all([
    loadLigaData(),
    loadLigaSamples(),
  ]);

  if (!prediction || !scenarios?.next_matchday_scenarios) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-stone-500">
          <p>{locale === "pt" ? "Dados do simulador não disponíveis." : "Simulator data not available."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <PageHero
        back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
        icon={<Trophy aria-hidden="true" className="w-4 h-4" />}
        eyebrow={`${t("football.title")} — ${t("football.matchday")} ${prediction.next_matchday.matchday}`}
        title={t("football.simulator")}
        lede={t("football.simulatorCta")}
      />

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

      {/* Rivalry duel over the real sampled seasons */}
      {seasonSamples && (
        <section className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <DueloFinal samples={seasonSamples} locale={locale} />
          </div>
        </section>
      )}
      <SiteFooter locale={locale} />
    </div>
  );
}
