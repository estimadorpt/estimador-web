#!/usr/bin/env node
/**
 * Generates every Open Graph card the site serves, plus the manifest that maps
 * a page to its card.
 *
 * Run it by hand after a content or data update: the site is a static export,
 * so there is no runtime image route and the PNGs are committed like any other
 * asset.
 *
 *   node scripts/generate-og-images.mjs
 *
 * Three kinds of card come out of here:
 *   - one per article per locale, carrying the headline, register and date;
 *   - one per section that publishes a live headline number;
 *   - a fallback per locale for everything else.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT_DIR, COLOR, renderCard, contentHash,
  formatPercent, formatDate, formatQuarter,
} from './lib/og-render.mjs';
import { articleCard, figureCard, brandCard, CARD_WIDTH, CARD_HEIGHT } from './lib/og-cards.mjs';
import { teamName, teamColor } from './lib/football-brand.mjs';

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const ARTICLES_DIR = path.join(ROOT_DIR, 'src', 'content', 'articles');
const LOCALES = ['pt', 'en'];

/**
 * Card copy lives here rather than in messages/{pt,en}.json because these
 * strings are never rendered by the app — next-intl is not available to a node
 * script, and adding build-only keys to the message catalogues would put
 * strings in front of translators that no page can ever show.
 */
const COPY = {
  pt: {
    brandHeadline: 'Dados para compreender Portugal.',
    brandStandfirst: 'Previsões e análises com a incerteza à vista. Modelos abertos, dados datados.',
    columns: [
      { name: 'Economia', blurb: 'Estado da economia e risco de recessão' },
      { name: 'Liga Portugal', blurb: 'Probabilidades de título e despromoção' },
      { name: 'Eleições', blurb: 'Sondagens, previsões e arquivo' },
      { name: 'População', blurb: 'Um atlas humano, do país à porta de casa' },
    ],
    brandFooter: 'Metodologia aberta · Bernardo Caldas',
    readSuffix: 'de leitura',
    updated: 'atualizado a',
    ligaSection: 'Liga Portugal',
    ligaLabel: 'Probabilidade de título',
    ligaCaption: (sims) => `${sims} simulações da época a partir da classificação atual.`,
    ligaFooter: (matchday, season) => `Jornada ${matchday} · Liga Portugal ${season}`,
    economySection: 'Economia',
    economyLabel: 'Risco de recessão',
    economySubject: (quarter) => `este trimestre · ${quarter}`,
    economyCaption: 'Onde está o risco de recessão agora — uma leitura calibrada, disponível antes da divulgação do PIB.',
    economySpark: 'Probabilidade por trimestre',
    economyFooter: (date) => `Dados de ${date}`,
  },
  en: {
    brandHeadline: 'Data to understand Portugal.',
    brandStandfirst: 'Forecasts and analysis with the uncertainty in plain sight. Open models, dated data.',
    columns: [
      { name: 'Economy', blurb: 'State of the economy and recession risk' },
      { name: 'Liga Portugal', blurb: 'Title and relegation probabilities' },
      { name: 'Elections', blurb: 'Polling, forecasts and the archive' },
      { name: 'Population', blurb: 'A human atlas, from the country to the front door' },
    ],
    brandFooter: 'Open methodology · Bernardo Caldas',
    readSuffix: 'read',
    updated: 'updated',
    ligaSection: 'Liga Portugal',
    ligaLabel: 'Title probability',
    ligaCaption: (sims) => `${sims} simulations of the season from the current table.`,
    ligaFooter: (matchday, season) => `Matchday ${matchday} · Liga Portugal ${season}`,
    economySection: 'Economy',
    economyLabel: 'Recession risk',
    economySubject: (quarter) => `this quarter · ${quarter}`,
    economyCaption: 'Where recession risk stands now — a calibrated read available before the GDP print.',
    economySpark: 'Probability by quarter',
    economyFooter: (date) => `Data as of ${date}`,
  },
};

const SITE_PATH = {
  home: '/',
  liga: '/desporto/liga',
  economy: '/economia',
};

/* ------------------------------------------------------------- sources ---- */

const metadataPattern = /^export const metadata = (\{[\s\S]*?\n\});?\s*/;

/**
 * A deliberately small re-read of the article front matter. `src/lib/mdx-articles.ts`
 * owns the real parser but is TypeScript; what a card needs is the header, and
 * the header is plain JSON inside the MDX export.
 */
function readArticles(locale) {
  const dir = path.join(ARTICLES_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      const match = source.match(metadataPattern);
      if (!match) throw new Error(`Missing article metadata: ${locale}/${file}`);
      const meta = JSON.parse(match[1]);
      const body = source.slice(match[0].length);
      const words = body.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(/\s+/).filter(Boolean).length;
      return { ...meta, readMinutes: Math.max(1, Math.ceil(words / 200)) };
    })
    // A draft has no published URL, so a card for it would be a card nothing links to.
    .filter(article => !article.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** The newest first-tier season directory that actually holds matchday files. */
function latestLigaMatchday() {
  const footballDir = path.join(PUBLIC_DIR, 'data', 'football');
  if (!fs.existsSync(footballDir)) return null;
  const seasons = fs.readdirSync(footballDir).filter(name => /^liga-\d{4}-\d{2}$/.test(name)).sort();
  for (const season of seasons.reverse()) {
    const dir = path.join(footballDir, season);
    const files = fs.readdirSync(dir).filter(name => /^md\d+\.json$/.test(name)).sort();
    for (const file of files.reverse()) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (data.table?.length) return data;
    }
  }
  return null;
}

function economyDashboard() {
  const file = path.join(PUBLIC_DIR, 'data', 'economics', 'dashboard.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/* --------------------------------------------------------------- cards ---- */

function defaultCard(locale) {
  const copy = COPY[locale];
  return brandCard({
    headline: copy.brandHeadline,
    standfirst: copy.brandStandfirst,
    columns: copy.columns,
    footerLeft: copy.brandFooter,
    footerRight: 'estimador.pt',
  });
}

function articleCardFor(article, locale) {
  const copy = COPY[locale];
  const date = formatDate(article.date, locale);
  return articleCard({
    locale,
    title: article.title,
    excerpt: article.excerpt,
    kind: article.kind ?? 'explicador',
    dateLabel: article.updated ? `${date} · ${copy.updated} ${formatDate(article.updated, locale)}` : date,
    byline: article.author,
    readTime: `${article.readMinutes} min ${copy.readSuffix}`,
  });
}

function ligaCard(data, locale) {
  const copy = COPY[locale];
  const contenders = [...data.table]
    .filter(team => team.p_champion > 0)
    .sort((a, b) => b.p_champion - a.p_champion)
    .slice(0, 3);
  if (!contenders.length) return null;

  const leader = contenders[0];
  const groupedSims = new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB').format(data.n_sims ?? 0);
  return figureCard({
    sectionLabel: copy.ligaSection,
    label: copy.ligaLabel,
    value: formatPercent(leader.p_champion),
    unit: '%',
    subject: teamName(leader.team),
    caption: data.n_sims ? copy.ligaCaption(groupedSims) : null,
    rows: contenders.map(team => ({
      name: teamName(team.team),
      value: `${formatPercent(team.p_champion)}%`,
      fraction: team.p_champion / leader.p_champion,
      color: teamColor(team.team),
    })),
    footerLeft: copy.ligaFooter(data.matchday, data.season),
    footerRight: 'estimador.pt/desporto/liga',
  });
}

function economyCard(dashboard, locale) {
  const copy = COPY[locale];
  const tile = dashboard?.tiles?.recession;
  const current = tile?.recession_probability;
  if (tile?.status !== 'ok' || !current?.available || typeof current.probability !== 'number') return null;

  const history = (current.probability_history ?? []).slice(-48);
  const quarterRange = history.length > 1
    ? `${formatQuarter(history[0].quarter, locale)} – ${formatQuarter(history[history.length - 1].quarter, locale)}`
    : '';

  return figureCard({
    sectionLabel: copy.economySection,
    label: copy.economyLabel,
    value: formatPercent(current.probability),
    unit: '%',
    subject: copy.economySubject(formatQuarter(current.as_of_quarter ?? tile.as_of_quarter, locale)),
    caption: copy.economyCaption,
    spark: {
      label: copy.economySpark,
      values: history.map(point => point.p),
      caption: quarterRange,
      color: COLOR.navy,
    },
    footerLeft: copy.economyFooter(formatDate(dashboard.vintage_date, locale)),
    footerRight: 'estimador.pt/economia',
  });
}

/* --------------------------------------------------------------- output --- */

async function emit(node, basename) {
  const png = await renderCard(node, { width: CARD_WIDTH, height: CARD_HEIGHT });
  const filename = `${basename}-${contentHash(png)}.png`;
  fs.writeFileSync(path.join(PUBLIC_DIR, filename), png);
  return filename;
}

/**
 * Anything matching the generated pattern that the new manifest does not claim
 * is a card for an article that was renamed or a data vintage that has moved
 * on. Leaving them behind is how public/ accumulated twelve orphaned PNGs.
 */
function pruneOrphans(keep) {
  const kept = new Set(keep);
  let removed = 0;
  for (const file of fs.readdirSync(PUBLIC_DIR)) {
    if (!/^og-image-.+\.png$/.test(file) || kept.has(file)) continue;
    fs.unlinkSync(path.join(PUBLIC_DIR, file));
    removed += 1;
  }
  return removed;
}

async function main() {
  const liga = latestLigaMatchday();
  const economy = economyDashboard();
  const manifest = { generatedAt: new Date().toISOString(), files: {}, cards: {} };
  const written = [];

  for (const locale of LOCALES) {
    const cards = {};

    const fallback = await emit(defaultCard(locale), `og-image-${locale}`);
    manifest.files[locale] = fallback;
    cards[SITE_PATH.home] = fallback;
    written.push(fallback);

    // The unversioned copy is the last resort in src/lib/metadata.ts, for a
    // build that ships without a manifest.
    fs.copyFileSync(path.join(PUBLIC_DIR, fallback), path.join(PUBLIC_DIR, `og-image-${locale}.png`));

    const sections = [
      liga ? [SITE_PATH.liga, ligaCard(liga, locale), `og-image-liga-${locale}`] : null,
      economy ? [SITE_PATH.economy, economyCard(economy, locale), `og-image-economia-${locale}`] : null,
    ].filter(Boolean);

    for (const [route, node, basename] of sections) {
      if (!node) continue;
      const filename = await emit(node, basename);
      cards[route] = filename;
      written.push(filename);
    }

    for (const article of readArticles(locale)) {
      const filename = await emit(articleCardFor(article, locale), `og-image-artigo-${article.slug}-${locale}`);
      cards[`/artigos/${article.slug}`] = filename;
      written.push(filename);
    }

    manifest.cards[locale] = cards;
    console.log(`${locale}: ${Object.keys(cards).length} cards`);
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'og-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const removed = pruneOrphans([...written, ...LOCALES.map(locale => `og-image-${locale}.png`)]);
  console.log(`${written.length} cards written, ${removed} orphaned files removed`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
