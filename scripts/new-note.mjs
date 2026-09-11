#!/usr/bin/env node
// Scaffold a new note or explainer.
//
// The article loader parses the metadata export as strict JSON and rejects a
// bad date, a slug that disagrees with the filename, an unknown kind or a
// JavaScript-style object. Every one of those is a failed production build for
// a file that looked fine in review — which is the whole reason a piece of
// ad-hoc analysis feels expensive to publish. This writes the header for you.
//
//   node scripts/new-note.mjs "Onde o modelo errou na jornada 5"
//   node scripts/new-note.mjs "How to read a poll" --locale en --kind explicador
//   node scripts/new-note.mjs "Título" --tags "Liga Portugal,Modelo" --date 2026-09-10
//
// Prints the path it wrote and the URL it will be served at.

import fs from 'node:fs';
import path from 'node:path';

const KINDS = ['nota', 'explicador'];
// Mirrors SectionConfig['type'] in src/lib/config/sections.ts. A piece filed
// under one of these surfaces on that section's page as well as in /artigos.
const SECTIONS = ['football', 'elections', 'economics', 'demographics'];
const LOCALES = ['pt', 'en'];
const AUTHOR = 'Bernardo Caldas';

const argv = process.argv.slice(2);
const flags = new Map();
const positional = [];
for (let index = 0; index < argv.length; index += 1) {
  if (argv[index].startsWith('--')) {
    flags.set(argv[index].slice(2), argv[index + 1]);
    index += 1;
  } else {
    positional.push(argv[index]);
  }
}
const flag = (name, fallback) => flags.get(name) ?? fallback;
const title = positional[0];

if (!title) {
  console.error('Usage: node scripts/new-note.mjs "Title" [--kind nota|explicador] [--locale pt|en] [--section elections] [--tags "A,B"] [--date YYYY-MM-DD] [--slug custom-slug]');
  process.exit(2);
}

const kind = flag('kind', 'nota');
const locale = flag('locale', 'pt');
const localToday = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};
const date = flag('date', localToday());
const tags = (flag('tags', '') || '').split(',').map(tag => tag.trim()).filter(Boolean);
const section = flag('section', '');

/** Matches the slug pattern the loader enforces, with accents folded away. */
function slugify(value) {
  return value
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const slug = flag('slug', slugify(title));

if (!KINDS.includes(kind)) {
  console.error(`--kind must be one of ${KINDS.join(', ')}`);
  process.exit(2);
}
if (section && !SECTIONS.includes(section)) {
  console.error(`--section must be one of ${SECTIONS.join(', ')}`);
  process.exit(2);
}
if (!LOCALES.includes(locale)) {
  console.error(`--locale must be one of ${LOCALES.join(', ')}`);
  process.exit(2);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date).toISOString().slice(0, 10) !== date) {
  console.error(`--date must be a real calendar date as YYYY-MM-DD (got "${date}")`);
  process.exit(2);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`Could not build a usable slug from "${title}". Pass --slug explicitly.`);
  process.exit(2);
}

const target = path.join(process.cwd(), 'src/content/articles', locale, `${slug}.mdx`);
if (fs.existsSync(target)) {
  console.error(`${path.relative(process.cwd(), target)} already exists. Edit it, or pass a different --slug.`);
  process.exit(1);
}

// A placeholder rather than an empty string: an empty excerpt throws in the
// loader, which would break `npm run dev` for the whole index the moment you
// scaffold a piece and start writing. The marker is what the test looks for.
//
// It scaffolds a draft so the half-written file can be committed: the draft
// flag is what exempts it from that test and keeps it out of the production
// build, which is the difference between publishing when a piece is ready and
// publishing in one sitting.
const metadata = {
  title,
  excerpt: locale === 'pt' ? 'TODO: resumo numa frase.' : 'TODO: one-sentence summary.',
  author: AUTHOR,
  date,
  kind,
  // Omitted rather than empty when unset: the loader rejects anything outside
  // the union, and belonging to no forecast surface is a legal state.
  ...(section ? { section } : {}),
  draft: true,
  tags,
  slug,
};

const pt = locale === 'pt';
// No `# ` heading: the page renders the title, and a test rejects a second one.
const body = pt
  ? `${kind === 'nota' ? `<Callout kind="context" label="Contexto">
  Escrito a ${date} com os dados disponíveis nessa data.
</Callout>

` : ''}Primeiro parágrafo: o que se encontrou, em duas frases.

## O que os dados mostram

<Figure caption="Legenda: o que o leitor deve retirar daqui." source="Fonte: ">
  {/* <SeatChart data={[]} /> — os componentes aceitam dados em linha */}
</Figure>

## O que isto não mostra

<Callout kind="caveat" label="Limites">
  O que esta análise não sustenta.
</Callout>
`
  : `${kind === 'nota' ? `<Callout kind="context" label="Context">
  Written on ${date} with the data available that day.
</Callout>

` : ''}First paragraph: what was found, in two sentences.

## What the data shows

<Figure caption="Caption: what the reader should take from this." source="Source: ">
  {/* <SeatChart data={[]} /> — the chart components accept inline data */}
</Figure>

## What it does not show

<Callout kind="caveat" label="Limits">
  What this analysis does not support.
</Callout>
`;

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `export const metadata = ${JSON.stringify(metadata, null, 2)};\n\n${body}`);

const relative = path.relative(process.cwd(), target);
console.log(`Wrote ${relative}`);
console.log(`  http://localhost:3000/${locale}/artigos/${slug}/`);
console.log('\nIt is a draft: "npm run dev" renders it, and nothing the production build');
console.log('emits lists it — index, feeds, sitemap. Commit it half-written if you like.');
console.log('\nTo publish, remove "draft": true and replace the TODO excerpt. The index,');
console.log('the feed and the social card all use that excerpt, and "npm run check"');
console.log('fails on the marker once the piece is no longer a draft.');
