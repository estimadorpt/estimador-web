import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReactNode } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { RevisedDate } from '@/components/brand/RevisedDate';
import { Callout } from '@/components/mdx/Callout';
import { getMDXComponents } from '@/mdx-components';
import { getTranslations } from "next-intl/server";
import {
  loadLigaData,
  loadLigaMarketScorecard,
  loadLigaPlayersDetail,
  loadLigaSamples,
} from "@/lib/utils/football-data-loader";
import { formatInteger } from "@/lib/football-format";
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

type Json = Record<string, unknown>;

/** One player-model file of the current season, raw (null when absent). */
async function readPlayerFile(name: string): Promise<Json | null> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), 'public/data/football/liga-2026-27', name), 'utf8')) as Json;
  } catch {
    return null;
  }
}

const asSeasons = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
const get = (o: unknown, ...keys: string[]): unknown => keys.reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Json)[k] : undefined), o);

interface PlayerMetricFact {
  name: string;
  what: string;
  seasons: string[];
  minMinutes: number | null;
  extra?: string;
}

/**
 * Each player metric with the seasons and minimum minutes its own file
 * states (audit MR2-05, FA2-11): finishing and contribution use 2023-24 to
 * 2025-26 and 600 minutes, contested possession, goalkeepers and defenders
 * four seasons up to 2026-27, defenders 450 minutes.
 */
async function playerMetricFacts(isPt: boolean): Promise<PlayerMetricFact[]> {
  const [players, contrib, contested, channels, def] = await Promise.all([
    readPlayerFile('players.json'),
    readPlayerFile('contrib_ratings.json'),
    readPlayerFile('contested_ratings.json'),
    readPlayerFile('gk_channels.json'),
    readPlayerFile('def_ratings.json'),
  ]);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const facts: PlayerMetricFact[] = [];
  if (players) facts.push({
    name: isPt ? 'Finalização' : 'Finishing',
    what: isPt
      ? 'golos por 90 minutos acima de um jogador de nível de substituição (SAR, do inglês skill above replacement), descontados os minutos, o adversário e o fator casa. Os golos de cada jogo são limitados antes da conta, para que uma tarde de quatro golos não passe por talento permanente.'
      : 'goals per 90 minutes above a replacement-level player (SAR, skill above replacement), adjusted for minutes, opponent and home advantage. Each match\'s goals are capped before the estimate, so one four-goal afternoon is not read as permanent skill.',
    seasons: asSeasons(get(players, 'generated_from', 'seasons')),
    minMinutes: num(get(players, 'generated_from', 'min_minutes')),
  });
  if (contrib) facts.push({
    name: isPt ? 'Contribuição ofensiva' : 'Attacking contribution',
    what: isPt ? 'a mesma conta, com golos e assistências juntos.' : 'the same calculation, with goals and assists together.',
    seasons: asSeasons(get(contrib, 'generated_from', 'seasons')),
    minMinutes: num(get(contrib, 'generated_from', 'min_minutes')),
  });
  if (contested) facts.push({
    name: isPt ? 'Posse disputada' : 'Contested possession',
    what: isPt
      ? 'a probabilidade de ganhar duelos aéreos e no chão, para defesas e médios, agregada sobre a carreira nessas épocas.'
      : 'the probability of winning aerial and ground duels, for defenders and midfielders, pooled over the career in those seasons.',
    seasons: asSeasons(get(contested, 'seasons')),
    minMinutes: null,
  });
  if (channels) facts.push({
    name: isPt ? 'Guarda-redes' : 'Goalkeepers',
    what: isPt
      ? 'a intervenção em cruzamentos e as saídas da área, publicadas em separado. A defesa de remates não separa os guarda-redes da média nestas épocas, por isso não tem lista.'
      : 'cross intervention and sweeping, published separately. Shot-stopping does not separate keepers from the average over these seasons, so it has no list.',
    seasons: asSeasons(get(channels, 'seasons')),
    minMinutes: null,
  });
  if (def) {
    const n = num(get(def, 'verdict', 'n_players'));
    facts.push({
      name: isPt ? 'Defesas' : 'Defenders',
      what: isPt
        ? `uma mais-valia ajustada sobre golos sofridos, estimada mas sem ranking: nenhum dos ${n != null ? formatInteger(n, 'pt') : ''} jogadores passou o critério pré-registado para se separar dos colegas de equipa.`
        : `an adjusted plus-minus on goals conceded, estimated but not ranked: none of the ${n != null ? formatInteger(n, 'en') : ''} players passed the pre-registered test for separating from their team-mates.`,
      seasons: asSeasons(get(def, 'data', 'seasons')),
      minMinutes: num(get(def, 'data', 'min_minutes')),
    });
  }
  return facts;
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
  const [{ prediction }, scorecard, detail, metrics, samples] = await Promise.all([
    loadLigaData(),
    loadLigaMarketScorecard(),
    loadLigaPlayersDetail(),
    playerMetricFacts(isPt),
    loadLigaSamples(),
  ]);
  const sims = formatInteger(prediction?.n_sims ?? 50000, locale);
  const points = pointsCalibrationSentence(scorecard?.calibration ?? null, locale);
  const finishing = metrics[0]?.seasons ?? [];
  const cutoff = playerDataCutoffSentence(detail?.appearances_through ?? null, finishing, locale);
  const span = (s: string[]) => (s.length ? (isPt ? `${s[0]} a ${s[s.length - 1]}` : `${s[0]} to ${s[s.length - 1]}`) : '');

  const components = getMDXComponents({
    h2: ({ children }) => (
      <h2 id={slugify(children)} className="text-2xl text-stone-900 mt-12 mb-3 tracking-tight">
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
    Samples: () => <>{formatInteger(samples?.samples?.length ?? 300, locale)}</>,
    PlayerMetrics: () => (
      <ul>
        {metrics.map((m) => (
          <li key={m.name}>
            <strong>{m.name}</strong> ({[
              m.seasons.length ? `${isPt ? 'épocas' : 'seasons'} ${span(m.seasons)}` : null,
              m.minMinutes != null ? (isPt ? `mínimo de ${formatInteger(m.minMinutes, locale)} minutos` : `${formatInteger(m.minMinutes, locale)}-minute minimum`) : null,
            ].filter(Boolean).join(', ')}): {m.what}
          </li>
        ))}
      </ul>
    ),
    PlayersCutoff: () => (cutoff ? <Callout kind="context">{cutoff}</Callout> : null),
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="reading"
          compact
          back={{ href: "/desporto/liga", label: t("football.title"), locale }}
          eyebrow={isPt ? "Metodologia" : "Methodology"}
          title={t("football.methodologyTitle")}
          lede={t("football.methodologySubtitle")}
          meta={<RevisedDate date={REVISED} locale={locale} />}
        />

        <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-3xl">
          <article className="article-body max-w-none" lang={locale}>
            <MDXRemote source={readMethodology(locale)} components={components} />
          </article>
        </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
