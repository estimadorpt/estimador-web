import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ReactNode } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Callout } from '@/components/mdx/Callout';
import { getMDXComponents } from '@/mdx-components';
import { getTranslations } from "next-intl/server";
import {
  loadLigaData,
  loadLigaMarketScorecard,
  loadLigaPlayers,
  loadLigaPlayersDetail,
} from "@/lib/utils/football-data-loader";
import { formatInteger, formatLongDate } from "@/lib/football-format";
import { pointsCalibrationSentence, titleCalibrationParagraphs } from "@/lib/football-model-evaluation";
import { playerDataCutoffSentence } from "@/lib/utils/player-pages";
import type { Metadata } from "next";
import { setRequestLocale } from '@/i18n/request-locale';

/** When this page's text was last checked against the production model. */
const REVISED = '2026-10-06';

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
    path: `/desporto/liga/metodologia`,
    title: t("football.methodologyTitle"),
    description: t("football.methodologyDescription"),
  });
}

function readMethodology(locale: 'pt' | 'en'): string {
  return readFileSync(path.join(process.cwd(), 'src/content/football-methodology', `${locale}.mdx`), 'utf8');
}

/** A stable anchor from a heading's text ("Como medimos os jogadores?" → como-medimos-os-jogadores). */
function slugify(node: ReactNode): string | undefined {
  const text = typeof node === 'string' ? node : Array.isArray(node) ? node.filter(n => typeof n === 'string').join('') : '';
  if (!text) return undefined;
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Describes the production model (estimador-football
// docs/MODEL-REVIEW-2026-09.md, "The production model in one paragraph") and
// what has and has not been evaluated (docs/research/2026-09-model-assessment.md).
// The prose lives in src/content/football-methodology/{pt,en}.mdx; every
// number in it is a component below, read from the published files, except
// the dated title-calibration finding (TITLE_CALIBRATION). When the model
// changes, this page, the match-page footnote and /dados change with it.
export default async function LigaMethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: 'pt' | 'en' = raw === 'en' ? 'en' : 'pt';
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const isPt = locale === "pt";
  const [{ prediction }, scorecard, players, detail] = await Promise.all([
    loadLigaData(),
    loadLigaMarketScorecard(),
    loadLigaPlayers(),
    loadLigaPlayersDetail(),
  ]);
  const sims = formatInteger(prediction?.n_sims ?? 50000, locale);
  const points = pointsCalibrationSentence(scorecard?.calibration ?? null, locale);
  const seasons = players?.generated_from?.seasons ?? [];
  const seasonSpan = seasons.length
    ? isPt
      ? `de ${seasons[0]} a ${seasons[seasons.length - 1]}`
      : `from ${seasons[0]} to ${seasons[seasons.length - 1]}`
    : '';
  const minMinutes = formatInteger(players?.generated_from?.min_minutes ?? 600, locale);
  const cutoff = playerDataCutoffSentence(detail?.appearances_through ?? null, seasons, locale);

  const components = getMDXComponents({
    h2: ({ children }) => (
      <h2 id={slugify(children)} className="text-2xl text-stone-900 mt-12 mb-3 tracking-tight scroll-mt-24">
        {children}
      </h2>
    ),
    Sims: () => <>{sims}</>,
    PointsCalibration: () => (
      <>{points ?? (isPt
        ? 'A verificação ainda não foi publicada para o modelo atual.'
        : 'The check has not been published for the current model yet.')}</>
    ),
    TitleCaveat: () => <Callout kind="caveat">{t("football.titleCalibrationCaveat")}</Callout>,
    TitleCalibration: () => (
      <>
        {titleCalibrationParagraphs(locale).map((p) => (
          <p key={p.slice(0, 40)} className="mb-5 text-stone-800">{p}</p>
        ))}
      </>
    ),
    PlayerSeasons: () => <>{seasonSpan}</>,
    PlayerMinMinutes: () => <>{minMinutes}</>,
    PlayersCutoff: () => (cutoff ? <Callout kind="context">{cutoff}</Callout> : null),
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <PageHero
          width="3xl"
          compact
          back={{ href: "/desporto/liga", label: t("football.title"), locale }}
          eyebrow={isPt ? "Metodologia" : "Methodology"}
          title={t("football.methodologyTitle")}
          lede={t("football.methodologySubtitle")}
          meta={<span>{isPt ? `Revisto a ${formatLongDate(REVISED, locale)}` : `Revised ${formatLongDate(REVISED, locale)}`}</span>}
        />

        <div className="max-w-3xl mx-auto px-4 py-10">
          <article className="article-body max-w-none" lang={locale}>
            <MDXRemote source={readMethodology(locale)} components={components} />
          </article>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
