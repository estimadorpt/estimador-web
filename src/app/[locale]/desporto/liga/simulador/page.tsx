import { createPageMetadata } from '@/lib/metadata';
import { loadGameFixtures, loadLigaData, loadLigaSamples, loadUpcomingFixtures } from "@/lib/utils/football-data-loader";
import { listSupportedFixtures } from "@/lib/football-fixtures";
import { formatDateSpan, formatInteger, formatShortDate } from "@/lib/football-format";
import { forecastAsOf, nextRoundTiming, roundPlayedAt } from "@/lib/football-status";
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
  // The scope is every game the simulator offers, as on the hub: the round
  // and any leftover from an earlier one, with its own date (audit VFA-M5).
  const timing = nextRoundTiming(prediction, upcomingFixtures);
  const leftoverRounds = Array.from(new Set(supportedFixtures.filter(f => f.matchday !== simRound).map(f => f.matchday))).sort((a, b) => a - b);
  const simSpan = formatDateSpan(supportedFixtures.map(f => f.kickoff), locale, { short: true });
  const scope = leftoverRounds.length === 0
    ? locale === "pt" ? `a jornada ${simRound}` : `matchday ${simRound}`
    : locale === "pt"
      ? `a jornada ${simRound} e ${leftoverRounds.length === 1 && supportedFixtures.filter(f => f.matchday !== simRound).length === 1 ? "o jogo em atraso" : "os jogos em atraso"} da jornada ${leftoverRounds.join(" e ")}`
      : `matchday ${simRound} and the postponed ${supportedFixtures.filter(f => f.matchday !== simRound).length === 1 ? "match" : "matches"} from matchday ${leftoverRounds.join(" and ")}`;
  const statusLine = locale === "pt"
    ? `Previsão depois da jornada ${prediction.matchday} · atualizada a ${formatShortDate(prediction.timestamp, locale)} · simula ${scope}${simSpan ? ` (${simSpan})` : ""}`
    : `Forecast after matchday ${prediction.matchday} · updated ${formatShortDate(prediction.timestamp, locale)} · plays out ${scope}${simSpan ? ` (${simSpan})` : ""}`;
  // Once that round is played the simulator plays out results already known:
  // it says so (audit FRESH-01), in the lede too (FR3-05).
  const simRoundPlayedAt = timing.round === simRound ? timing.playedAt : roundPlayedAt(upcomingFixtures.filter(f => f.matchday === simRound).map(f => f.kickoff));
  const statusPlayed = locale === "pt"
    ? `Previsão depois da jornada ${prediction.matchday} · atualizada a ${formatShortDate(prediction.timestamp, locale)} · a jornada ${simRound} já foi jogada, nova previsão em preparação: o simulador mostra o que o modelo dava antes`
    : `Forecast after matchday ${prediction.matchday} · updated ${formatShortDate(prediction.timestamp, locale)} · matchday ${simRound} has been played, new forecast in preparation: the simulator shows what the model gave before it`;
  const asOf = forecastAsOf(prediction.timestamp, locale);
  const ledePlayed = locale === "pt"
    ? `A jornada ${simRound} já foi jogada: escolhe um clube e depois um resultado para veres o que esse resultado mudava ${asOf.endsWith(".") ? asOf : `${asOf}.`} Um jogo de cada vez; os outros resultados continuam incertos.`
    : `Matchday ${simRound} has been played: choose a club, then a result, to see what that result would have changed ${asOf}. One match at a time; every other result stays uncertain.`;

  return (
    <div className="football-page min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      {/* The section's painting, eager, as on the Liga hub: a section entrance
          (the header table in CLAUDE.md's Design Language). */}
      <PageHero
        illustration="football"
        compact
        back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
        icon={<Trophy aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t("football.title")}
        title={locale === "pt" ? `Simulador da jornada ${simRound}` : `Matchday ${simRound} simulator`}
        lede={<ClockSwitch initial={t("football.simulatorLede", { round: simRound })} steps={[{ at: simRoundPlayedAt, value: ledePlayed }]} />}
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
            staleAt={simRoundPlayedAt}
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
          chosen result (diagnosis §5 "Simulator"). The question is this
          section's h2, as on the Liga page; DueloFinal is its DataCard, whose
          title names the chart (the card's h3 cannot carry an id). */}
      {seasonSamples && (
        <section aria-labelledby="duelo-final-heading" className="border-b border-stone-200 last:border-b-0">
          <div className="max-w-7xl mx-auto px-4 py-10">
            {/* A plain kicker, no icon (UXD2-07). */}
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              {locale === 'pt' ? 'Outra pergunta' : 'A different question'}
            </p>
            <h2 id="duelo-final-heading" className="mb-3 text-2xl tracking-tight">
              {locale === 'pt' ? 'Quem acaba à frente?' : 'Who finishes ahead?'}
            </h2>
            <p className="mb-6 border-l-2 border-line pl-4 text-sm leading-relaxed text-ink-muted">{locale === 'pt' ? 'Previsão de base: esta comparação usa as épocas simuladas da previsão publicada, sem nenhum resultado escolhido no simulador.' : 'Baseline forecast: this comparison uses the published forecast\'s simulated seasons, with no result picked in the simulator.'}</p>
            <DueloFinal samples={seasonSamples} locale={locale} forecastTimestamp={prediction.timestamp} />
          </div>
        </section>
      )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
