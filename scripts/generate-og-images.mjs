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
  formatPercent, formatDate, formatShortDate, formatQuarter,
} from './lib/og-render.mjs';
import { articleCard, figureCard, brandCard, CARD_WIDTH, CARD_HEIGHT } from './lib/og-cards.mjs';
import { teamName, teamColor } from './lib/football-brand.mjs';

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const ARTICLES_DIR = path.join(ROOT_DIR, 'src', 'content', 'articles');
const LOCALES = ['pt', 'en'];

// The brand line and descriptor are written once, in src/lib/brand/descriptor.json,
// shared with the app (descriptor.test.ts holds every surface to it).
const BRAND_COPY = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src', 'lib', 'brand', 'descriptor.json'), 'utf8'));

/**
 * Card copy lives here rather than in messages/{pt,en}.json because these
 * strings are never rendered by the app — next-intl is not available to a node
 * script, and adding build-only keys to the message catalogues would put
 * strings in front of translators that no page can ever show.
 */
const COPY = {
  pt: {
    brandHeadline: BRAND_COPY.line.pt,
    brandStandfirst: BRAND_COPY.descriptor.pt,
    // Live sections first, in the navigation's order; the elections are
    // archives and say so; the economy says it is in preparation until its flag.
    columns: (economyPublished) => [
      { name: 'População', blurb: 'Uma população sintética aberta, freguesia a freguesia' },
      { name: 'Liga Portugal', blurb: 'Probabilidades de título e despromoção' },
      { name: 'Eleições', blurb: 'Previsões arquivadas: presidenciais 2026 e legislativas 2025' },
      { name: 'Economia', blurb: economyPublished ? 'Estado da economia e risco de recessão' : 'Como ler os indicadores (em preparação)' },
    ],
    brandFooter: 'Metodologia aberta · Bernardo Caldas',
    readSuffix: 'de leitura',
    updated: 'atualizado a',
    ligaSection: 'Liga Portugal',
    ligaLabel: 'Probabilidade de título',
    ligaCaption: (sims, matchday) => `${sims} simulações da época a partir da classificação depois da jornada\u00a0${matchday}.`,
    // The as-of line is what keeps a screenshot of the card honest weeks later (FA2-08).
    ligaFooter: (matchday, date, season) => [`Depois da jornada ${matchday}`, date ? `atualizado a ${date}` : null, `Liga Portugal ${season}`].filter(Boolean).join(' · '),
    ligaAlt: (season, matchday, date, rows) => `Liga Portugal ${season} depois da jornada ${matchday}${date ? ` (atualizado a ${date})` : ''}: probabilidade de título, ${rows}.`,
    brandAlt: (line, descriptor) => `estimador.pt. ${line} ${descriptor}`,
    populationAlt: (parishes, version, date) => `População sintética aberta: ${parishes} freguesias dos Censos 2021, versão ${version} de ${date}.`,
    economyAlt: (value, quarter) => `Economia: risco de recessão de ${value}% em ${quarter}.`,
    articleAlt: (title, kind, date) => `${title} (${kind === 'nota' ? 'nota' : 'explicador'}, ${date}).`,
    economySection: 'Economia',
    economyLabel: 'Risco de recessão',
    economySubject: (quarter) => `este trimestre · ${quarter}`,
    economyCaption: 'Onde está o risco de recessão agora — uma leitura calibrada, disponível antes da divulgação do PIB.',
    economySpark: 'Probabilidade por trimestre',
    economyFooter: (date) => `Dados de ${date}`,
    populationSection: 'População',
    populationLabel: 'População sintética aberta',
    populationSubject: 'freguesias · Censos 2021',
    populationCaption: (persons, households, parishes) => `${persons} pessoas e ${households} agregados gerados para as ${parishes} freguesias dos Censos 2021 (CAOP\u00a02021).`,
    populationFooter: (version, date) => `Versão ${version} · ${date}`,
  },
  en: {
    brandHeadline: BRAND_COPY.line.en,
    brandStandfirst: BRAND_COPY.descriptor.en,
    columns: (economyPublished) => [
      { name: 'Population', blurb: 'An open synthetic population, parish by parish' },
      { name: 'Liga Portugal', blurb: 'Title and relegation probabilities' },
      { name: 'Elections', blurb: 'Archived forecasts: 2026 presidential, 2025 legislative' },
      { name: 'Economy', blurb: economyPublished ? 'State of the economy and recession risk' : 'Reading the indicators (in preparation)' },
    ],
    brandFooter: 'Open methodology · Bernardo Caldas',
    readSuffix: 'read',
    updated: 'updated',
    ligaSection: 'Liga Portugal',
    ligaLabel: 'Title probability',
    ligaCaption: (sims, matchday) => `${sims} simulations of the season from the table after matchday\u00a0${matchday}.`,
    ligaFooter: (matchday, date, season) => [`After matchday ${matchday}`, date ? `updated ${date}` : null, `Liga Portugal ${season}`].filter(Boolean).join(' · '),
    ligaAlt: (season, matchday, date, rows) => `Liga Portugal ${season} after matchday ${matchday}${date ? ` (updated ${date})` : ''}: title probability, ${rows}.`,
    brandAlt: (line, descriptor) => `estimador.pt. ${line} ${descriptor}`,
    populationAlt: (parishes, version, date) => `Open synthetic population: ${parishes} parishes of the 2021 Census, version ${version} dated ${date}.`,
    economyAlt: (value, quarter) => `Economy: recession risk of ${value}% in ${quarter}.`,
    articleAlt: (title, kind, date) => `${title} (${kind === 'nota' ? 'note' : 'explainer'}, ${date}).`,
    economySection: 'Economy',
    economyLabel: 'Recession risk',
    economySubject: (quarter) => `this quarter · ${quarter}`,
    economyCaption: 'Where recession risk stands now — a calibrated read available before the GDP print.',
    economySpark: 'Probability by quarter',
    economyFooter: (date) => `Data as of ${date}`,
    populationSection: 'Population',
    populationLabel: 'Open synthetic population',
    populationSubject: 'parishes · 2021 Census',
    populationCaption: (persons, households, parishes) => `${persons} people and ${households} households generated for the ${parishes} parishes of the 2021 Census (CAOP\u00a02021).`,
    populationFooter: (version, date) => `Version ${version} · ${date}`,
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

/**
 * Each card comes with its alt text (og:image:alt), which describes what the
 * image shows rather than repeating the page's title (SPV-04).
 */
function defaultCard(locale, economyIsPublished) {
  const copy = COPY[locale];
  const node = brandCard({
    headline: copy.brandHeadline,
    standfirst: copy.brandStandfirst,
    columns: copy.columns(economyIsPublished),
    footerLeft: copy.brandFooter,
    footerRight: 'estimador.pt',
  });
  return { node, alt: copy.brandAlt(copy.brandHeadline, copy.brandStandfirst) };
}

function articleCardFor(article, locale) {
  const copy = COPY[locale];
  const date = formatDate(article.date, locale);
  const node = articleCard({
    locale,
    title: article.title,
    excerpt: article.excerpt,
    kind: article.kind ?? 'explicador',
    dateLabel: article.updated ? `${date} · ${copy.updated} ${formatDate(article.updated, locale)}` : date,
    byline: article.author,
    readTime: `${article.readMinutes} min ${copy.readSuffix}`,
  });
  return { node, alt: copy.articleAlt(article.title, article.kind ?? 'explicador', date) };
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
  const updated = data.timestamp ? formatShortDate(data.timestamp, locale) : null;
  // No bracketed range beside the probability: p_champion_lo/hi is the spread
  // of 500-simulation blocks, about ten times the Monte Carlo error of the
  // published 50 000-simulation figure, and the site no longer shows it
  // anywhere (audit F-H1). The card carries the number and its simulation count.
  const node = figureCard({
    sectionLabel: copy.ligaSection,
    label: copy.ligaLabel,
    value: formatPercent(leader.p_champion),
    unit: '%',
    subject: teamName(leader.team),
    caption: data.n_sims ? copy.ligaCaption(groupedSims, data.matchday) : null,
    // On the probability's own 0–100% scale: scaled to the leader, a 51% bar
    // filled the track and read as certainty once the card travelled alone.
    rows: contenders.map(team => ({
      name: teamName(team.team),
      value: `${formatPercent(team.p_champion)}%`,
      fraction: team.p_champion,
      color: teamColor(team.team),
    })),
    footerLeft: copy.ligaFooter(data.matchday, updated, data.season),
    footerRight: printedUrl(locale, SITE_PATH.liga),
  });
  const rows = contenders.map(team => `${teamName(team.team)} ${formatPercent(team.p_champion)}%`).join(', ');
  return { node, alt: copy.ligaAlt(data.season, data.matchday, updated, rows) };
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

  const quarter = formatQuarter(current.as_of_quarter ?? tile.as_of_quarter, locale);
  const node = figureCard({
    sectionLabel: copy.economySection,
    label: copy.economyLabel,
    value: formatPercent(current.probability),
    unit: '%',
    subject: copy.economySubject(quarter),
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
  return { node, alt: copy.economyAlt(formatPercent(current.probability), quarter) };
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
  // Grouped like formatCount on the site ("3 092"): Intl's pt-PT leaves four digits ungrouped.
  const number = new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { useGrouping: 'always' });
  const node = figureCard({
    sectionLabel: copy.populationSection,
    label: copy.populationLabel,
    value: number.format(counts.parishes),
    subject: copy.populationSubject,
    caption: `${copy.populationCaption(number.format(counts.persons), number.format(counts.households), number.format(counts.parishes))} ${honesty}`,
    footerLeft: copy.populationFooter(meta.release_version, formatDate(meta.published, locale)),
    footerRight: printedUrl(locale, SITE_PATH.population),
  });
  return { node, alt: copy.populationAlt(number.format(counts.parishes), meta.release_version, formatDate(meta.published, locale)) };
}

/* --------------------------------------------------------------- output --- */

const CARD_FILE = /^og-image-.+-[0-9a-f]{8}\.png$/;

/** The pixel size of a PNG, from its IHDR chunk. */
function pngSize(png) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

let renderedSize = null;

async function emit(node, basename) {
  const png = await renderCard(node, { width: CARD_WIDTH, height: CARD_HEIGHT });
  renderedSize ??= pngSize(png);
  const filename = `${basename}-${contentHash(png)}.png`;
  fs.writeFileSync(path.join(PUBLIC_DIR, filename), png);
  return filename;
}

/** Every hashed card file a manifest object names, `retained` included when asked. */
function namedCards(manifest, { withRetained = false } = {}) {
  if (!manifest || typeof manifest !== 'object') return [];
  return [...new Set([
    ...Object.values(manifest.files ?? {}),
    ...Object.values(manifest.cards ?? {}).flatMap(cards => Object.values(cards ?? {})),
    ...(withRetained ? manifest.retained ?? [] : []),
  ])].filter(name => typeof name === 'string' && CARD_FILE.test(name));
}

function readManifest(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * The manifest production is serving right now. Its cards are what platforms
 * have scraped, and they are cached as immutable: a deploy that deleted them
 * would turn every recent share into a broken image. The committed manifest is
 * not a substitute (a branch regenerates cards that production never served),
 * so the live one is fetched, with a short timeout so an offline build still
 * finishes; OG_LIVE_MANIFEST=off skips the request.
 */
async function liveManifest() {
  const url = process.env.OG_LIVE_MANIFEST ?? 'https://estimador.pt/og-manifest.json';
  if (url === 'off') return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`og: could not read the live manifest (${url}: ${error.message}); keeping the committed manifest's cards instead`);
    return null;
  }
}

/**
 * The current card that stands in for an old file name: same kind and locale
 * (og-image-liga-pt-…, og-image-artigo-{slug}-en-…), else the locale's brand
 * card. Economy cards always get the brand card while the section is in
 * preparation: production's carry a recession figure from July, and a share
 * card never shows a number the page does not.
 */
function standIn(name, manifest, economyIsPublished) {
  const base = name.replace(/-[0-9a-f]{8}\.png$/, '');
  const locale = LOCALES.find(candidate => base.endsWith(`-${candidate}`)) ?? 'pt';
  const brand = manifest.files[locale];
  if (base.startsWith('og-image-economia-') && !economyIsPublished) return brand;
  const sameKind = Object.values(manifest.cards[locale] ?? {}).find(file => file.replace(/-[0-9a-f]{8}\.png$/, '') === base);
  return sameKind ?? brand;
}

/**
 * Anything matching the generated pattern that the new manifest, the previous
 * one and production's do not claim is a card for an article that was renamed
 * or a data vintage that has moved on two builds ago. Leaving them behind is
 * how public/ accumulated twelve orphaned PNGs.
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

/** What a retained card name is served with: it no longer holds the bytes its hash names. */
const RETAINED_CACHE_CONTROL = 'public, max-age=0, must-revalidate';

/**
 * Keeps the host config's exact-name card routes equal to the retained list,
 * just ahead of the `/og-image-*.png` wildcard (first match wins). A retained
 * name holds a stand-in, not the bytes its hash promised, so it must not be
 * cached as immutable: these routes make every cache that revalidates pick up
 * the current card (FRESH-V4). A cache that already holds production's copy
 * under the old immutable header keeps it; nothing a deploy does reaches it.
 */
function syncRetainedRoutes(retained) {
  const file = path.join(ROOT_DIR, 'staticwebapp.config.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const exact = route => /^\/og-image-.+-[0-9a-f]{8}\.png$/.test(route.route);
  const routes = config.routes.filter(route => !exact(route));
  const wildcard = routes.findIndex(route => route.route === '/og-image-*.png');
  if (wildcard === -1) throw new Error('staticwebapp.config.json has no /og-image-*.png route');
  routes.splice(wildcard, 0, ...[...retained].sort().map(name => ({
    route: `/${name}`,
    headers: { 'cache-control': RETAINED_CACHE_CONTROL },
  })));
  config.routes = routes;
  const next = `${JSON.stringify(config, null, 2)}\n`;
  if (next !== fs.readFileSync(file, 'utf8')) fs.writeFileSync(file, next);
}

async function main() {
  const liga = latestLigaMatchday();
  const economy = economyDashboard();
  const population = populationMeta();
  const economyIsPublished = economyPublished();
  const manifestPath = path.join(PUBLIC_DIR, 'og-manifest.json');
  const committed = readManifest(manifestPath);
  const live = await liveManifest();
  const manifest = { generatedAt: new Date().toISOString(), files: {}, cards: {}, alt: {} };
  const written = [];

  for (const locale of LOCALES) {
    const cards = {};

    const brand = defaultCard(locale, economyIsPublished);
    const fallback = await emit(brand.node, `og-image-${locale}`);
    manifest.files[locale] = fallback;
    manifest.alt[fallback] = brand.alt;
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

    for (const [route, card, basename] of sections) {
      if (!card) continue;
      const filename = await emit(card.node, basename);
      cards[route] = filename;
      manifest.alt[filename] = card.alt;
      written.push(filename);
    }

    for (const article of readArticles(locale)) {
      const card = articleCardFor(article, locale);
      const filename = await emit(card.node, `og-image-artigo-${article.slug}-${locale}`);
      cards[`/artigos/${article.slug}`] = filename;
      manifest.alt[filename] = card.alt;
      written.push(filename);
    }

    manifest.cards[locale] = cards;
    console.log(`${locale}: ${Object.keys(cards).length} cards`);
  }

  // What production serves stays for one more deploy, so every link already
  // shared keeps an image. With the live manifest that is exactly its cards;
  // offline, what the committed manifest named and kept last time. Cards this
  // checkout generated but never deployed are not kept (they would only pile up).
  const served = live ? namedCards(live) : namedCards(committed, { withRetained: true });
  const previous = served.filter(file => !written.includes(file));

  // Every retained name is rewritten as a copy of the current card of its kind
  // (the brand card for the general and, while it is in preparation, the
  // economy cards), never left with retired copy or an old figure (FRESH-05),
  // and served with must-revalidate rather than as immutable (syncRetainedRoutes).
  for (const file of previous) {
    fs.copyFileSync(path.join(PUBLIC_DIR, standIn(file, manifest, economyIsPublished)), path.join(PUBLIC_DIR, file));
  }
  syncRetainedRoutes(previous);

  manifest.size = renderedSize;
  // Not read by the site: the names kept from the previous deploy, so an
  // offline build of this checkout still knows to keep them.
  manifest.retained = previous;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const removed = pruneOrphans([...written, ...previous, ...LOCALES.map(locale => `og-image-${locale}.png`)]);
  console.log(`${written.length} cards written (${renderedSize?.width}×${renderedSize?.height}), ${previous.length} from the previous deploy kept`
    + ` as stand-ins (${live ? 'live manifest' : 'committed manifest'}), ${removed} orphaned files removed`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
