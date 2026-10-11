import { createPageMetadata } from '@/lib/metadata';
import { FOOTBALL_DIR, loadGameFixtures, loadPredictionGameData } from "@/lib/utils/football-data-loader";
import { findOpenRound, roundLockState } from "@/lib/utils/prediction-game";
import { frozenBeforePreviousRoundEnded } from "@/lib/utils/prediction-game-record";
import { DeadlineLine } from "./DeadlineLine";
import { HowItCounts } from "./HowItCounts";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { ContraOModelo } from "@/components/charts/football/ContraOModelo";
import { LigaSectionNav } from "@/components/football/LigaSectionNav";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== "en";
  const t = await getTranslations({ locale });
  return createPageMetadata({
    locale,
    path: `/desporto/liga/jogo-previsoes`,
    // One name for the game everywhere, from nav.game (audit pub-PP-15);
    // a colon, not a second separator before the site suffix (SP2-11).
    title: `${t("nav.game")}: Liga Portugal`,
    description: pt
      ? "Escolhe o resultado de cada jogo da próxima jornada da Liga Portugal e vê, depois dos jogos, em quantos ficaste mais perto do que o modelo. Sem conta."
      : "Pick the result of each game of the next Liga Portugal matchday and see, once they are played, in how many you came closer than the model. No account.",
  });
}

/**
 * Contra o Modelo, the weekly game: no account, no server. The page carries
 * the season's rounds from game_fixtures.json (the model's frozen 1X2 and the
 * results known at build time); the reader's picks stay in their browser.
 */
export default async function JogoPrevisoesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw === "en" ? "en" : "pt";
  const pt = locale === "pt";
  const t = await getTranslations({ locale });

  const [data, manifest] = await Promise.all([loadPredictionGameData(), loadGameFixtures()]);

  // The deadline of the round open when the page was built, from the game
  // manifest's locks_at. The line re-reads the clock in the browser and says
  // the round has closed once the deadline passes (audit FR-11).
  const buildNow = Date.now();
  const openRound = data ? findOpenRound(data, buildNow) : null;
  const openLock = openRound ? roundLockState(openRound, buildNow) : null;
  const deadline =
    openRound && openLock?.lockAt != null ? (
      <DeadlineLine
        matchday={openRound.matchday}
        lockAt={new Date(openLock.lockAt).toISOString()}
        confirmed={openRound.fixtures.every(f => f.kickoffConfirmed !== false)}
        locale={locale}
      />
    ) : null;

  // Rounds whose odds were frozen while the previous round was still being
  // played (audit FA2-04, FRESH-02): "Como se conta" names them.
  const frozenRounds = frozenBeforePreviousRoundEnded(manifest?.matchdays ?? []).map(f => f.matchday);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <LigaSectionNav current="jogo" locale={locale} />
      <PageHero
        compact
        measure="reading"
        eyebrow="Liga Portugal"
        title={t("nav.game")}
        lede={pt
          ? "Escolhe o resultado de cada jogo da jornada. Depois dos jogos, vês em quantos ficaste mais perto do que o modelo."
          : "Pick the result of each game of the matchday. Once they are played, you see in how many you came closer than the model."}
        meta={deadline ?? undefined}
      />

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-4 md:pt-6">
        <noscript>
          <p className="mb-4 max-w-3xl border-l-2 border-ink pl-3 text-[15px] leading-relaxed text-ink">
            {pt
              ? "O jogo precisa de JavaScript: as tuas escolhas ficam guardadas no teu navegador. Sem ele, vês os jogos da jornada mas não podes escolher."
              : "The game needs JavaScript: your picks are kept in your browser. Without it you can see the matchday's games but not pick."}
          </p>
        </noscript>
        <div className="mb-6 max-w-3xl">
          <HowItCounts locale={locale} frozenRounds={frozenRounds} />
        </div>
        {data ? (
          <ContraOModelo
            data={data}
            locale={locale}
            builtAt={buildNow}
            manifestUrl={`/data/${FOOTBALL_DIR}/game_fixtures.json`}
          />
        ) : (
          <div className="flex max-w-3xl items-start gap-4 border-t border-rule pt-4">
            <EmptyStateMark className="mt-1" />
            <p className="text-[15px] leading-relaxed text-ink">
              {pt
                ? "Os jogos da jornada não estão disponíveis de momento."
                : "The matchday's games are not available right now."}
            </p>
          </div>
        )}
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
