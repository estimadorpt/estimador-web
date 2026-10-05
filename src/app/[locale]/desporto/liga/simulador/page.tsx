import { createPageMetadata } from '@/lib/metadata';
import { loadLigaData, loadLigaSamples, loadUpcomingFixtures } from "@/lib/utils/football-data-loader";
import { listSupportedFixtures } from "@/lib/football-fixtures";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { MatchdayPicker } from "@/components/charts/football/MatchdayPicker";
import { DueloFinal } from "@/components/charts/football/DueloFinal";
import { getTranslations } from "next-intl/server";
import { Trophy, Swords } from "lucide-react";
import type { Metadata } from "next";
import { setRequestLocale } from '@/i18n/request-locale';

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
    path: `/desporto/liga/simulador`,
    title: locale === "pt"
      ? "Simulador · Liga Portugal"
      : "Simulator · Liga Portugal",
    description: t("football.whatIfDescription"),
  });
}

export default async function SimuladorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const [{ prediction, scenarios }, seasonSamples, upcomingFixtures] = await Promise.all([
    loadLigaData(),
    loadLigaSamples(),
    loadUpcomingFixtures(),
  ]);

  if (!prediction || !scenarios?.next_matchday_scenarios) {
    return (
      <div className="football-page min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
          <PageHero
            compact
            back={{ href: "/desporto/liga", label: "Liga Portugal", locale }}
            eyebrow="Liga Portugal"
            title={locale === "pt" ? "Simulador" : "Simulator"}
            lede={locale === "pt"
              ? "Os cenários da próxima jornada não estão publicados de momento. A previsão da época continua na página da Liga."
              : "The next matchday's scenarios are not published right now. The season forecast is on the Liga page."}
          />
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  const matchHrefs = Object.fromEntries(upcomingFixtures.map((fixture) => [
    `${fixture.home}|${fixture.away}`,
    `/desporto/liga/jogo/${fixture.slug}`,
  ]));

  // Which of next_matchday_scenarios.matches is each club's own outstanding
  // fixture, and which are postponed leftovers — the "O meu próximo jogo"
  // path (diagnosis §5 "Simulator").
  const supportedFixtures = listSupportedFixtures(prediction, scenarios);

  return (
    <div className="football-page min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        illustration="football"
        compact
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
            version={`${prediction.season}-${prediction.timestamp}`}
            matchHrefs={matchHrefs}
            supportedFixtures={supportedFixtures}
            forecastTimestamp={prediction.timestamp}
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

      {/* A separate, unrelated question — kept out of the scenario flow above
          so that flow never needs a warning that half the page ignores the
          chosen result (diagnosis §5 "Simulator"). DueloFinal carries its own
          heading and disclaimer already; this wrapper just gives the section
          its own identity in the page furniture. */}
      {seasonSamples && (
        <section aria-labelledby="duelo-final-heading" className="border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              <Swords className="w-3.5 h-3.5" aria-hidden="true" />
              <span id="duelo-final-heading">{locale === 'pt' ? 'Outra pergunta' : 'A different question'}</span>
            </div>
            <p className="mb-5 border-l-2 border-line pl-4 text-sm leading-relaxed text-ink-muted">{locale === 'pt' ? 'Previsão de base — a comparação abaixo usa as épocas originais do modelo e não incorpora os resultados que escolheste acima.' : 'Baseline forecast — the comparison below uses the original model seasons and does not incorporate your selections above.'}</p>
            <DueloFinal samples={seasonSamples} locale={locale} />
          </div>
        </section>
      )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
