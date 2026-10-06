import { createPageMetadata } from '@/lib/metadata';
import { loadGameFixtures, loadLigaData, loadLigaSamples, loadUpcomingFixtures } from "@/lib/utils/football-data-loader";
import { listSupportedFixtures } from "@/lib/football-fixtures";
import { formatDateSpan, formatShortDate } from "@/lib/football-format";
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
      ? "Simulador da Liga Portugal"
      : "Liga Portugal simulator",
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

  const [{ prediction, scenarios }, seasonSamples, upcomingFixtures, gameFixtures] = await Promise.all([
    loadLigaData(),
    loadLigaSamples(),
    loadUpcomingFixtures(),
    loadGameFixtures(),
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
  const supportedFixtures = listSupportedFixtures(prediction, scenarios, gameFixtures);

  // "Jornada 7 · atualizado a 25 set. · simula a jornada 8 (9–12 out.)": the
  // forecast this page starts from, and the round it lets you play out
  // (audit FR-09), the same matchday the rest of the site names.
  const simRound = prediction.next_matchday?.matchday ?? prediction.matchday + 1;
  const simSpan = formatDateSpan(upcomingFixtures.filter(f => f.matchday === simRound).map(f => f.kickoff), locale, { short: true });
  const statusLine = locale === "pt"
    ? `Previsão depois da jornada ${prediction.matchday} · atualizada a ${formatShortDate(prediction.timestamp, locale)} · simula a jornada ${simRound}${simSpan ? ` (${simSpan})` : ""}`
    : `Forecast after matchday ${prediction.matchday} · updated ${formatShortDate(prediction.timestamp, locale)} · plays out matchday ${simRound}${simSpan ? ` (${simSpan})` : ""}`;

  return (
    <div className="football-page min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        illustration="football"
        compact
        back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
        icon={<Trophy aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t("football.title")}
        title={t("football.simulator")}
        lede={t("football.simulatorLede")}
        meta={<span>{statusLine}</span>}
      />

      {/* Simulator */}
      <section className="border-b border-stone-200 last:border-b-0">
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
        <section aria-labelledby="duelo-final-heading" className="border-b border-stone-200 last:border-b-0">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <Swords className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{locale === 'pt' ? 'Outra pergunta' : 'A different question'}</span>
            </p>
            <p className="mb-5 border-l-2 border-line pl-4 text-sm leading-relaxed text-ink-muted">{locale === 'pt' ? 'Previsão de base — a comparação abaixo usa as épocas originais do modelo e não incorpora os resultados que escolheste acima.' : 'Baseline forecast — the comparison below uses the original model seasons and does not incorporate your selections above.'}</p>
            <DueloFinal samples={seasonSamples} locale={locale} headingId="duelo-final-heading" />
          </div>
        </section>
      )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
