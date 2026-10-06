import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createPageMetadata } from '@/lib/metadata';
import { loadPredictionGameData } from "@/lib/utils/football-data-loader";
import { findOpenRound, roundLockState } from "@/lib/utils/prediction-game";
import { formatLongDate } from "@/lib/football-format";
import { frozenBeforePreviousRoundEnded, latePublications, type ManifestRoundLike } from "@/lib/utils/prediction-game-record";
import { DeadlineLine } from "./DeadlineLine";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { ContraOModelo } from "@/components/charts/football/ContraOModelo";
import { GameAuthProvider } from "@/components/GameAuthProvider";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Swords } from "lucide-react";
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
      ? "Faz as tuas previsões para a próxima jornada da Liga Portugal e vê se bates o modelo, avaliado pela mesma medida que tu: o Ranked Probability Score."
      : "Forecast the next Liga Portugal matchday and see if you can beat the model. Scored with the Ranked Probability Score, the same measure we grade the model with.",
  });
}

/** The raw game manifest's rounds, for the notes the scoring server does not carry. */
async function loadManifestRounds(): Promise<ManifestRoundLike[]> {
  try {
    const file = path.join(process.cwd(), "public", "data", "football", "liga-2026-27", "game_fixtures.json");
    const raw = JSON.parse(await readFile(file, "utf8"));
    return Array.isArray(raw?.matchdays) ? raw.matchdays : [];
  } catch {
    return [];
  }
}

export default async function JogoPrevisoesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== "en";
  const t = await getTranslations({ locale });

  const [data, manifestRounds] = await Promise.all([loadPredictionGameData(), loadManifestRounds()]);

  // The deadline of the round open when the page was built, from the game
  // manifest's locks_at. The line re-reads the clock in the browser and says
  // the round has closed once the deadline passes (audit FR-11).
  const openRound = data ? findOpenRound(data, Date.now()) : null;
  const openLock = openRound ? roundLockState(openRound, Date.now()) : null;
  const deadline =
    openRound && openLock?.lockAt != null ? (
      <DeadlineLine
        matchday={openRound.matchday}
        lockAt={new Date(openLock.lockAt).toISOString()}
        confirmed={openRound.fixtures.every(f => f.kickoffConfirmed !== false)}
        locale={locale}
      />
    ) : null;

  // The model's season record counts rounds it published after kickoff
  // (2026-27 matchday 1); the table says so (audit M2).
  // It also counts rounds whose odds were frozen while the previous round
  // was still being played (audit FA2-04, FRESH-02).
  const frozen = frozenBeforePreviousRoundEnded(manifestRounds).map(f => f.matchday);
  const frozenNote = frozen.length
    ? pt
      ? `As probabilidades ${frozen.length > 1 ? `das jornadas ${frozen.slice(0, -1).join(", ")} e ${frozen[frozen.length - 1]}` : `da jornada ${frozen[0]}`} foram congeladas antes do fim da jornada anterior, sem os resultados que faltavam; o modelo é avaliado com elas tal como foram congeladas.`
      : `The probabilities for ${frozen.length > 1 ? `matchdays ${frozen.slice(0, -1).join(", ")} and ${frozen[frozen.length - 1]}` : `matchday ${frozen[0]}`} were frozen before the previous round ended, without the results still to come; the model is scored on them as frozen.`
    : null;
  const recordNote = [
    ...latePublications(manifestRounds).map(l => pt
      ? `O registo do modelo inclui a jornada ${l.matchday}, cujas probabilidades foram publicadas a ${formatLongDate(l.publishedAt, locale)}, depois de ${l.startedBefore} dos ${l.total} jogos terem começado.`
      : `The model's record includes matchday ${l.matchday}, whose probabilities were published on ${formatLongDate(l.publishedAt, locale)}, after ${l.startedBefore} of its ${l.total} games had started.`),
    ...(frozenNote ? [frozenNote] : []),
  ].join(" ") || null;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="reading"
        back={{ href: "/desporto/liga", label: t("football.backToLeague"), locale }}
        icon={<Swords aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t("football.title")}
        title={t("nav.game")}
        lede={pt
          ? "Consegues prever melhor do que o modelo? Escolhe as tuas probabilidades antes da jornada e compara-te com ele, semana após semana."
          : "Can you forecast better than the model? Set your own probabilities before the matchday and go head to head, week after week."}
        meta={deadline ?? undefined}
      />

      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-3xl">
          {data ? (
            // Auth wraps this page only: readers of forecast pages never
            // download an auth bundle they have no use for.
            <GameAuthProvider>
              <ContraOModelo data={data} locale={locale} recordNote={recordNote} />
            </GameAuthProvider>
          ) : (
            <p className="text-stone-500 text-sm">
              {pt
                ? "Dados do jogo não disponíveis de momento."
                : "Game data is not available right now."}
            </p>
          )}
        </div></div>
      </section>

      <section className="border-t border-stone-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-8"><div className="max-w-3xl text-xs text-stone-500 space-y-2">
          {/* Where a season is stored, and what is kept, depends on whether
              the season backend answers, which only the browser can know: the
              game states it once, in its own storage note (audit pub-PP-10,
              F21). */}
          <p>
            {pt ? (
              <>
                Sobre o modelo e como é avaliado:{" "}
                <Link
                  href="/desporto/liga/modelo"
                  locale={locale}
                  className="text-ink underline underline-offset-4"
                >
                  modelo vs mercado
                </Link>
                .
              </>
            ) : (
              <>
                About the model and how it is graded:{" "}
                <Link
                  href="/desporto/liga/modelo"
                  locale={locale}
                  className="text-ink underline underline-offset-4"
                >
                  model vs market
                </Link>
                .
              </>
            )}
          </p>
        </div></div>
      </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
