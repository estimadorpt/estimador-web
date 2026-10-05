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
 *   - one per section that publishes a live headline number (the population
 *     card's figures are the release's own counts, read from meta.json);
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
    columns: (economyPublished) => [
      { name: 'Economia', blurb: economyPublished ? 'Estado da economia e risco de recessão' : 'Como ler os indicadores (em preparação)' },
      { name: 'Liga Portugal', blurb: 'Probabilidades de título e despromoção' },
      { name: 'Eleições', blurb: 'Sondagens, previsões e arquivo' },
      { name: 'População', blurb: 'Uma população sintética aberta, freguesia a freguesia' },
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
    populationSection: 'População',
    populationLabel: 'População sintética aberta',
    populationSubject: 'freguesias · Censos 2021',
    populationCaption: (persons, households) => `${persons} pessoas e ${households} agregados gerados para todas as freguesias do país.`,
    populationFooter: (version, date) => `Versão ${version} · publicada a ${date}`,
  },
  en: {
    brandHeadline: 'Data to understand Portugal.',
    brandStandfirst: 'Forecasts and analysis with the uncertainty in plain sight. Open models, dated data.',
    columns: (economyPublished) => [
      { name: 'Economy', blurb: economyPublished ? 'State of the economy and recession risk' : 'Reading the indicators (in preparation)' },
      { name: 'Liga Portugal', blurb: 'Title and relegation probabilities' },
      { name: 'Elections', blurb: 'Polling, forecasts and the archive' },
      { name: 'Population', blurb: 'An open synthetic population, parish by parish' },
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
    populationSection: 'Population',
    populationLabel: 'Open synthetic population',
    populationSubject: 'parishes · 2021 Census',
    populationCaption: (persons, households) => `${persons} people and ${households} households generated for every parish in the country.`,
    populationFooter: (version, date) => `Version ${version} · released ${date}`,
  },
};

const SITE_PATH = {
  home: '/',
  liga: '/desporto/liga',
  economy: '/economia',
  population: '/populacao',
};

/**
 * The address a card prints: with the locale, because the bare section path
 * is not a page on the host (it only redirects since the 301s were added).
 */
const printedUrl = (locale, route) => `estimador.pt/${locale}${route}`;

/* ------------------------------------------------------------- sources ---- */

/**
 * The economy's editorial flag, the same file src/lib/config/economy-status.ts
 * reads. Off means the section is in preparation: no card of its own.
 */
function economyPublished() {
  const file = path.join(ROOT_DIR, 'src', 'lib', 'config', 'economy-status.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).published === true;
  } catch {
    return false;
  }
}

/**
 * Business days (Mon–Fri) after `fromIso` up to `now`, as economy-time.ts
 * counts them (that module is TypeScript; a node script cannot import it).
 */
function businessDaysSince(fromIso, now = new Date()) {
  if (!fromIso) return null;
  const from = new Date(fromIso.length <= 10 ? `${fromIso}T00:00:00` : fromIso);
  if (Number.isNaN(from.getTime())) return null;
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let count = 0;
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

/** economy-time.ts ECONOMY_PAUSE_BUSINESS_DAYS: past this, no number anywhere. */
const ECONOMY_PAUSE_BUSINESS_DAYS = 20;

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

/** The published synthetic population release's meta.json (counts, honesty copy). */
function populationMeta() {
  const dir = path.join(PUBLIC_DIR, 'data', 'population');
  if (!fs.existsSync(dir)) return null;
  const releases = fs.readdirSync(dir).filter(name => /^v\d+\.\d+\.\d+$/.test(name))
    .sort((a, b) => a.slice(1).localeCompare(b.slice(1), undefined, { numeric: true }));
  const latest = releases.at(-1);
  const file = latest && path.join(dir, latest, 'meta.json');
  return file && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

/* --------------------------------------------------------------- cards ---- */

function defaultCard(locale, economyIsPublished) {
  const copy = COPY[locale];
  return brandCard({
    headline: copy.brandHeadline,
    standfirst: copy.brandStandfirst,
    columns: copy.columns(economyIsPublished),
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
  // The interval the table and the title-race chart print beside the same
  // number (p_champion_lo/hi), so a screenshot of the card carries it too.
  const interval = typeof leader.p_champion_lo === 'number' && typeof leader.p_champion_hi === 'number'
    ? ` (${formatPercent(leader.p_champion_lo)}–${formatPercent(leader.p_champion_hi)}%)`
    : '';
  return figureCard({
    sectionLabel: copy.ligaSection,
    label: copy.ligaLabel,
    value: formatPercent(leader.p_champion),
    unit: '%',
    subject: `${teamName(leader.team)}${interval}`,
    caption: data.n_sims ? copy.ligaCaption(groupedSims) : null,
    rows: contenders.map(team => ({
      name: teamName(team.team),
      value: `${formatPercent(team.p_champion)}%`,
      fraction: team.p_champion / leader.p_champion,
      color: teamColor(team.team),
    })),
    footerLeft: copy.ligaFooter(data.matchday, data.season),
    footerRight: printedUrl(locale, SITE_PATH.liga),
  });
}

/**
 * The economy card, or null — and /economia then shares the brand card. Null
 * while the section is in preparation, and null when the data is past the
 * staleness guard, so a share card never carries a number the page does not.
 */
function economyCard(dashboard, locale, isPublished) {
  if (!isPublished) return null;
  const age = businessDaysSince(dashboard?.as_of ?? dashboard?.vintage_date);
  if (age === null || age > ECONOMY_PAUSE_BUSINESS_DAYS) return null;
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
    footerRight: printedUrl(locale, SITE_PATH.economy),
  });
}

/**
 * Every figure is one of the release's own counts and the caveat is the
 * release's own sentence: nothing here is computed from the data, and the
 * synthetic people are never shown as anyone in particular.
 */
function populationCard(meta, locale) {
  const copy = COPY[locale];
  const counts = meta?.counts;
  const honesty = meta?.honesty?.portrait?.[locale];
  if (!counts?.parishes || !counts.persons || !counts.households || !honesty) return null;
  const number = new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB');
  return figureCard({
    sectionLabel: copy.populationSection,
    label: copy.populationLabel,
    value: number.format(counts.parishes),
    subject: copy.populationSubject,
    caption: `${copy.populationCaption(number.format(counts.persons), number.format(counts.households))} ${honesty}`,
    footerLeft: copy.populationFooter(meta.release_version, formatDate(meta.published, locale)),
    footerRight: printedUrl(locale, SITE_PATH.population),
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
 * Every file a manifest names. Read before the new manifest replaces it: the
 * cards the previous build served stay one more build, because they are cached
 * as immutable and a platform that scraped one shortly before a deploy would
 * otherwise get a 404 on the next fetch.
 */
function manifestFiles(file) {
  try {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    return [...new Set([
      ...Object.values(manifest.files ?? {}),
      ...Object.values(manifest.cards ?? {}).flatMap(cards => Object.values(cards)),
    ])].filter(name => typeof name === 'string' && /^og-image-.+-[0-9a-f]{8}\.png$/.test(name));
  } catch {
    return [];
  }
}

/**
 * Anything matching the generated pattern that neither the new manifest nor
 * the previous one claims is a card for an article that was renamed or a data
 * vintage that has moved on two builds ago. Leaving them behind is how public/
 * accumulated twelve orphaned PNGs.
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
  const population = populationMeta();
  const economyIsPublished = economyPublished();
  const manifestPath = path.join(PUBLIC_DIR, 'og-manifest.json');
  const previous = manifestFiles(manifestPath);
  const manifest = { generatedAt: new Date().toISOString(), files: {}, cards: {} };
  const written = [];

  for (const locale of LOCALES) {
    const cards = {};

    const fallback = await emit(defaultCard(locale, economyIsPublished), `og-image-${locale}`);
    manifest.files[locale] = fallback;
    cards[SITE_PATH.home] = fallback;
    written.push(fallback);

    // The unversioned copy is the last resort in src/lib/metadata.ts, for a
    // build that ships without a manifest.
    fs.copyFileSync(path.join(PUBLIC_DIR, fallback), path.join(PUBLIC_DIR, `og-image-${locale}.png`));

    const sections = [
      liga ? [SITE_PATH.liga, ligaCard(liga, locale), `og-image-liga-${locale}`] : null,
      economy ? [SITE_PATH.economy, economyCard(economy, locale, economyIsPublished), `og-image-economia-${locale}`] : null,
      population ? [SITE_PATH.population, populationCard(population, locale), `og-image-populacao-${locale}`] : null,
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

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const removed = pruneOrphans([...written, ...previous, ...LOCALES.map(locale => `og-image-${locale}.png`)]);
  const retained = previous.filter(file => !written.includes(file)).length;
  console.log(`${written.length} cards written, ${retained} from the previous build kept, ${removed} orphaned files removed`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
