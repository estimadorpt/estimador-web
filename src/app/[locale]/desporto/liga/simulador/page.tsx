import { createPageMetadata } from '@/lib/metadata';
import { loadGameFixtures, loadLigaData, loadLigaSamples, loadUpcomingFixtures } from "@/lib/utils/football-data-loader";
import { listSupportedFixtures } from "@/lib/football-fixtures";
import { formatDateSpan, formatInteger, formatShortDate } from "@/lib/football-format";
import { roundPlayedAt } from "@/lib/football-status";
import { ClockSwitch } from "@/components/football/ClockSwitch";
import { Link } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { MatchdayPicker } from "@/components/charts/football/MatchdayPicker";
import { DueloFinal } from "@/components/charts/football/DueloFinal";
import { getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";
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
  // Once that round is played the simulator plays out results already known:
  // it says so (audit FRESH-01).
  const simRoundPlayedAt = roundPlayedAt(upcomingFixtures.filter(f => f.matchday === simRound).map(f => f.kickoff));
  const statusPlayed = locale === "pt"
    ? `Previsão depois da jornada ${prediction.matchday} · atualizada a ${formatShortDate(prediction.timestamp, locale)} · a jornada ${simRound} já foi jogada, nova previsão em preparação: o simulador mostra o que o modelo dava antes`
    : `Forecast after matchday ${prediction.matchday} · updated ${formatShortDate(prediction.timestamp, locale)} · matchday ${simRound} has been played, new forecast in preparation: the simulator shows what the model gave before it`;

  return (
    <div className="football-page min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        field="periwinkle"
        compact
        back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
        icon={<Trophy aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t("football.title")}
        title={locale === "pt" ? `Simulador da jornada ${simRound}` : `Matchday ${simRound} simulator`}
        lede={t("football.simulatorLede", { round: simRound })}
        meta={<span><ClockSwitch initial={statusLine} steps={[{ at: simRoundPlayedAt, value: statusPlayed }]} /></span>}
      />

      {/* Simulator */}
      <section className="border-b border-stone-200 last:border-b-0">
        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Where the numbers come from and how the method works, beside
              the tool (audit MR2-07). */}
          <p className="mb-6 max-w-3xl text-xs leading-relaxed text-stone-500">
            {locale === "pt"
              ? `Fonte: modelo estimador.pt, ${formatInteger(prediction.n_sims, locale)} simulações do resto da época (previsão de ${formatShortDate(prediction.timestamp, locale)}). Cada resultado escolhido mostra as simulações em que ele aconteceu; um resultado pouco provável tem menos simulações por trás e mais ruído. `
              : `Source: estimador.pt model, ${formatInteger(prediction.n_sims, locale)} simulations of the rest of the season (forecast of ${formatShortDate(prediction.timestamp, locale)}). Each result you pick shows the simulations where it happened; an unlikely result has fewer simulations behind it and more noise. `}
            <Link href={locale === "pt" ? "/desporto/liga/metodologia#o-simulador" : "/desporto/liga/metodologia#the-simulator"} locale={locale} className="font-semibold text-ink underline underline-offset-4">
              {locale === "pt" ? "Como funciona o simulador" : "How the simulator works"}
            </Link>
          </p>
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
            {/* A plain kicker, no icon: the duel's card carries the one title (UXD2-07). */}
            <p className="mb-5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              {locale === 'pt' ? 'Outra pergunta' : 'A different question'}
            </p>
            <p className="mb-5 border-l-2 border-line pl-4 text-sm leading-relaxed text-ink-muted">{locale === 'pt' ? 'Previsão de base: esta comparação usa as épocas simuladas da previsão publicada, sem nenhum resultado escolhido no simulador.' : 'Baseline forecast: this comparison uses the published forecast\'s simulated seasons, with no result picked in the simulator.'}</p>
            <DueloFinal samples={seasonSamples} locale={locale} headingId="duelo-final-heading" forecastTimestamp={prediction.timestamp} />
          </div>
        </section>
      )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
