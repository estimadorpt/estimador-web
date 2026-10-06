# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**estimador.pt** is a multi-domain data analysis platform for Portugal, built with Next.js. It provides data-driven forecasts and analysis across different domains (football, elections, and more), with a professional editorial-style interface and interactive visualizations.

### Sections
- **População** (`/populacao/`) — open synthetic population v1.0.3 (Censos 2021), parish by parish (see "Population section")
- **Liga Portugal** (`/desporto/liga/`) — Bayesian football league forecasts, updated every matchday
- **Presidential Elections 2026** (`/eleicoes/presidenciais/`) — archived forecast (both rounds)
- **Parliamentary Elections 2025** (`/eleicoes/legislativas/`) — archived forecast; `/eleicoes/arquivo/` explains how to read both
- **Economia** (`/economia/`) — **in preparation** (see "Economy section"): explainers online, no figures published

This is also the order of what is live, and the site lists its sections in it everywhere: the
header (Início, População, Liga Portugal, Eleições, Economia · em preparação, Sobre), the footer's
"Secções", the homepage shortcuts, `/sobre`'s status list, `/metodologia` and the descriptor.

**One name for football: "Liga Portugal"** (both locales) for the section wherever it is
named as a place on the site: the header item (`nav.sport`), its menu, the footer
(`nav.liga`), the 404 header, the homepage kicker (`home.footballKicker`) and card, `/sobre`
and `/metodologia`. "Futebol"/"football" is a common noun, for prose only ("um modelo de
futebol"); never "Desporto" or "campeonato português" as the section's name. The URLs keep
`/desporto/liga`. In English write "Liga Portugal" without an article ("How could Liga
Portugal end?"); "the Liga" reads as Spain's league. The one exception is the owner's
descriptor in `src/lib/brand/descriptor.json`, quoted verbatim.

The navigation is defined once, in `src/components/brand/site-navigation.ts`
(`siteNavigation(labels, …)`: order, hrefs, labels, the `match` prefixes that light an item,
e.g. every `/desporto/*` page for Liga Portugal). The client `Header` and the static header
of the root 404 (`src/app/not-found.tsx`, native `<details>` menus, plain anchors, the same
60px bar) both render from it, so they cannot drift. `Header.tsx` reads each label with a
literal `t('…')` key (the client-messages test only sees literals);
`site-navigation.test.ts` checks the two stay in step. The few labels only the menu uses
("Previsões da época", "Jogadores", "Simulador", "Modelo vs mercado", the "(jogo semanal)"
suffix, "Privacidade") are bilingual literals in `site-navigation.ts`, not message keys, so
they need no `CLIENT_MESSAGE_KEYS` entry. The 404's header markup is
`NotFoundHeaderView` (`src/components/NotFoundHeaderView.tsx`), a client component with no
state or effects: Next puts the root not-found into every exported page's RSC payload, and
as a client view each page carries a reference and the item list instead of the whole
menu twice (about 40 KB a page). The mobile menu is a full-height sheet
(`h-[calc(100dvh-61px)]`); the language links are named "PT, Português" / "EN, English",
the current one underlined in forced colours; the logo link is "estimador.pt — página
inicial" / "estimador.pt — home".

The footer (`SiteFooter.tsx`) lists, under "Secções", População, Liga Portugal, "Eleições ·
arquivo" (one link to `/eleicoes/arquivo`, `footer.electionsArchive`) and Economia; "O
projeto" includes "Reutilizar e citar" (`/sobre#reutilizar`, `footer.reuse`); its blurb is
the line (semibold) and the descriptor, as two paragraphs.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production (static export)
npm run start        # Start production server
npm run lint         # Run ESLint
./scripts/sync-data.sh           # Sync football, elections and population (never economics)
./scripts/sync-data.sh football  # Sync football data only
./scripts/sync-data.sh population  # Publish the synthetic population release
./scripts/sync-data.sh economics # Economy feeds, only ever on their own (see "Economy section")
npm run check        # validate:data + typecheck + lint + tests (CI runs it before the build)
npm run og           # Regenerate the OG cards + public/og-manifest.json (also run by prebuild)
npm run smoke -- --base <url>  # Probe a deployed export: every route, asset and redirect
npm run check:export # Export budget (files, MB, per-file) + over-long titles/descriptions; runs as postbuild
```

`npm run check` misses static-export prerender failures (a `useSearchParams` without
Suspense, a route with no params): before a release, build the export from a copy
(`git archive HEAD` into a scratch folder, symlink `node_modules`, `npm run build`), never
with `next build` in the working checkout. `postbuild` runs `check:export`, which fails over
the budget (220 MB, 13 000 files, 10 MB per file; it warns from 190 MB and 11 500 files;
`EXPORT_BUDGET_MB`, `EXPORT_BUDGET_FILES` and `EXPORT_BUDGET_FILE_MB` raise the limits after a
plan change) and lists, without failing, every page whose title passes 70 characters or
description 160 (`createPageMetadata` also warns once per page at build). It also weighs
`staticwebapp.config.json` (`SWA_CONFIG` names another file), which Azure refuses past
20 KB: it fails there and warns from 18 KB (one route per retained OG card and the `/x` plus
`/x/*` 404 pairs are the first rules to compact).

### Deployment
The project deploys automatically to Azure Static Web Apps via GitHub Actions when pushing to `main`. The deployment uses:
- `AZURE_DEPLOYMENT_TOKEN` secret for Azure authentication
- Static export configuration (`output: 'export'` in next.config.js)
- Builds to `out/` directory

## Route Structure

Every page lives under a locale prefix (`/pt/…`, `/en/…`, routes in `src/app/[locale]/`);
the paths below omit it.

```
/                                  → Hub homepage (section summaries)
/populacao/                        → Synthetic population (see "Population section")
/desporto/liga/                    → Liga Portugal forecast (+ /jogadores, /simulador, /jogo-previsoes, /modelo, /dados, /2025-26, /{club}, /jogo/{slug}, /jogador/{slug})
/desporto/liga/metodologia/        → Liga Portugal methodology
/economia/                         → Economy (in preparation; noindex while unpublished)
/economia/metodologia/             → Economy methodology
/eleicoes/arquivo/                 → How to read the archived election forecasts
/eleicoes/presidenciais/           → Presidential 2026 forecast (archive)
/eleicoes/legislativas/            → Parliamentary 2025 forecast (archive)
/eleicoes/legislativas/mapa/       → District map (parliamentary 2025)
/artigos/                          → Articles (hidden from the chrome until a locale publishes one)
/sobre/                            → About (mission, author, one status list per section, #reutilizar: licence and citation)
/metodologia/                      → Methodology hub: short, dated, links each section's method
/eleicoes/metodologia/             → Election methodology (archive)
/privacidade/                      → Privacy
/marca/                            → Brand guide (noindex)
```

`staticwebapp.config.json` answers with a 301 for the bare root and `/index.html` (both to
`/pt/`), for the old URLs (`/forecast`, `/about`,
`/methodology`, `/map`, `/articles`, `/feed.xml`), for each section path typed without a
locale (`/economia` → `/pt/economia/`, `/desporto/liga`, `/eleicoes/…`, `/sobre`,
`/artigos`, `/metodologia`, `/privacidade`, `/populacao`, `/eleicoes/metodologia`), for the
shareable pages typed without a locale (`/populacao/misteriosa`, `/dados`, `/qualidade`,
`/metodologia`, `/miniatura`, `/consulta`, the 20 regions `/populacao/regiao/{slug}`, the
Liga sub-pages, the 18 clubs `/desporto/liga/{club}`, `/desporto/liga2`, `/marca`), all to
`/pt/`, for `/{pt,en}/desporto` → liga and
`/{pt,en}/eleicoes` → arquivo, and for the clubs that left the Primeira
(`/{pt,en}/desporto/liga/{avs,tondela}` → the 2025-26 review, `boavista` → the Liga page).
SWA redirects cannot reuse a wildcard capture, so a new top-level section needs its own
line; `scripts/smoke-check.mjs` checks every redirect in the file. Deeper locale-less
addresses (a parish, a match, a player) reach `/404.html`, whose first script
(`src/lib/locale-redirect.ts`, mounted in `src/app/not-found.tsx`) replaces the address
with `/pt` + the same path, for the known section prefixes only.

## Architecture

## Design Language

The site's identity is the interval mark and the atlas palette. Everything lives in `src/app/globals.css` (tokens), `src/lib/brand/index.ts` (mark paths and hex values for SVG and canvas code) and `src/components/Logo.tsx`; the living guide, with downloadable files, is `/marca` (`src/app/[locale]/marca/page.tsx`, not indexed).

- **Mark**: a credible interval drawn as one path in one colour. `<Mark>` from 24px up, `<MarkSmall>` below; `<LogoHorizontal>` is the only signature (Manrope 800 wordmark, no serif or stacked version). Pine on light, paper on dark. Never a coloured band, never inside a chart. Assets in `public/brand/`; regenerate them with the brand script in the session scratchpad or by hand from `src/lib/brand`.
- **Surfaces**: `bg-paper` (page ground), `bg-cream` (cards, panels, table rows), `bg-parchment` (sunken areas, hovers), `border-line` (hairlines). Dark surfaces use `bg-forest`.
- **Ink**: `text-ink` for text and primary actions, `text-stone-500` for secondary text. Links are ink with an underline, never blue.
- **Pastels in two strengths**: data (`mint`, `mustard`, `coral`, `periwinkle`) for categories and small marks (a wrong pick on the Freguesia misteriosa board; chart series use `SERIES`, darker data steps of the same hues); surface (`mint-soft`, `mustard-soft`, `coral-soft`, `periwinkle-soft`) for the mosaic, tinted fields and backgrounds. Neither does the other's job. Party and team colours stay as they are; gold/amber means "caveat", never emphasis.
- **Retuned Tailwind ramps**: `stone`, `amber`/`yellow`, `emerald`/`green`, `red` and `blue` are redefined in `@theme`, so existing utilities keep their meaning but sit on paper. Do not use `gray`, `slate` or `bg-white`. Red and green as text use the 700 step (`text-red-700`, `text-emerald-700`, darkened for AA on cream and parchment) or ink; never `text-red-400` or `text-stone-300` for words. `tree`, `positive`, `success`, `green-600` and `BRAND.tree` are `#377455` (4.5:1 on paper, cream and parchment; `src/components/viz/palette-tokens.test.ts`), and no component types `#4e8056`. Chart text (ticks, axis captions, end labels) is `FURNITURE.axis` (`#5f7062`); `BRAND.faint` (`#7f9284`) is for strokes only. Team colours are not text colours: a club's name or end label is ink with a colour swatch beside it. A missing value is a `text-stone-500` "—" with an sr-only "sem dados", never stone-300.
- **Type**: one family, Manrope (`--font-sans`, `--font-display`): h1 800, h2/h3 700, text 400/500, uppercase kickers 700, headline numbers `font-display font-extrabold tabular-nums`. Newsreader (`--font-serif`) is the reading face and appears only inside `.article-body` (articles, methodology, about, privacy). No italics as decoration. Nothing below 11px. Both faces are self-hosted (`src/app/fonts.ts`): Manrope from `@fontsource/manrope` (it keeps the family name `Manrope`, which Plot, SVG and canvas code name directly), Newsreader through `next/font/google`, downloaded at build time and served from `/_next/static`; no page view contacts a font host. Newsreader ships the weight axis only (no `opsz`, which made each file 130 to 150 KB) and is not preloaded, so only a page that sets the serif fetches it.
- **Mosaic** (`src/components/brand/Mosaic.tsx`): quarter-circles are shares, circles people, dot grids populations, rounded blocks places; bands stay in the mark. Owner decision of 6 October 2026: brand material, the 404 and empty states only. Brand material is `/marca` (whose hero is the one `<PageHero art>` left), the OG brand card and the social kit. Every empty, error, refused or unavailable state (unknown parish or permalink, empty archive, empty `/artigos`, a refused response) draws `<EmptyStateMark>` (`src/components/brand/EmptyStateMark.tsx`: `quarters` at 72px, the same at every width) beside or above its message and one specific next step. The 404 (`NotFoundBody`) keeps a larger `quarters` as its one brand moment, capped at about 200px on desktop and 112px on phones so it never fills a screen. Never the header of a site page outside `/marca` (it came off Liga, Economia and Artigos on 11 September and off `/populacao` and `/misteriosa` on 6 October), never beside a number or a chart, never encoding information. The decorative dot grid (`people`) looks like data, so it is on no page; it stays on `/marca` as a labelled specimen.
- **Motion**: the interval opens on hover of a `.brand-link`; `<MarkLoading>` only where something is genuinely loading. Both stop under prefers-reduced-motion. A published forecast never animates.
- **Three levels of expression**: section entrances carry their painting; dashboards, tools and data pages are restrained (a compact tinted introduction via `<PageHero field>`, then cream tables and plots, decoration outside the plotting areas); reference, methodology and editorial pages are plain paper. The governing art direction is `docs/design/original-illustration-refinement/README.md` ("Latest revision — 13 September 2026") with `docs/design/browser-reference/HANDOFF.md`; `docs/design/design-system-proposal.md` is the 11 September base, and its dated note says which parts they superseded. One colour field per page at most, and one field colour per section where a field is used: population periwinkle, economy mint, articles mustard. No painted residents on population data pages: the house is the homepage's only population painting. One painting family (`docs/brand/section-illustrations.md`): the three 13 September section scenes (`public/images/sections/{football,elections,economy}.webp`) and the refined population house. Which header each kind of page gets (owner decision of 6 October 2026, also on `/marca#ilustracao`):

  | Page kind | Header | Pages |
  |---|---|---|
  | Section entrance with a painting | the section's 13 Sept painting, eager | Liga hub, Liga simulator, /eleicoes/arquivo, /eleicoes/legislativas, /eleicoes/presidenciais; on the homepage each panel carries its section's painting edge to edge (the refined house as the population card's column, the stadium as the band the Liga rail ends on, elections and economy as media objects; see "Homepage") |
  | Data pages, dashboards, tools | compact tinted field, no art | /populacao (hub), parish pages, region pages, /populacao/misteriosa, /economia, /artigos |
  | Reference, methodology, editorial | plain paper | Liga and election sub-pages (club, match, player, modelo, dados, 2025-26, jogo-previsoes, mapa), every methodology page, /populacao/qualidade, /dados, /sobre, /privacidade, /metodologia |
  | Explainer with its own world | its own drawing, under `<PageHero>` | /populacao/miniatura (the village) |
  | Empty, error, 404 | small `quarters` mosaic + one next step | unknown parish, unknown permalink, empty archive, empty articles, refused/unavailable states, 404 |
  | Brand material | mosaic | /marca, OG brand card, social kit |

  The painted headers are an owner exception (October 2026) to the restrained rule for forecasts, and the only raster heroes: the Liga hub (`/desporto/liga`), the Liga simulator (`/desporto/liga/simulador`), `/eleicoes/arquivo`, `/eleicoes/legislativas` and `/eleicoes/presidenciais` open on `<PageHero illustration>` (`SectionIllustration`) instead of a tinted field, and the homepage panels carry their section's painting (see "Homepage"). Because that image is the hero's largest paint, it must load eagerly (`priority` / `fetchPriority="high"`, which `<PageHero illustration>` passes), with a narrow (about 360px) variant for phones where the asset pipeline makes one cheap; no other page gets a raster hero.
- **Primitives**: actions are `<Action>` (`src/components/brand/Action.tsx`: primary pine, secondary bordered cream, tint, text; 48px, 10px corners, one main action per view); keyboard focus is the global double ring in globals.css, so components do not declare their own; inputs and selectors are 44 to 48px with a visible label; cards use `rounded-2xl`, a thin border and no shadow; motion is 140 to 200ms feedback and 200 to 300ms panels. `<TeaserBand>` is the explainer teaser that follows a dashboard's data (a soft field, a question, one action, no mosaic; shown only on a published economy). Empty and error states get `<EmptyStateMark>` and a specific next step (see Mosaic), and missing data is never shown as zero.
- **One container** (`src/components/brand/Container.tsx`): the header, section tab rows, every `<PageHero>` and the page body share `CONTAINER_CLASS` (`mx-auto w-full max-w-7xl px-4`), so their left edges line up at every width. A narrower column is a `measure` inside it, left-aligned (`<PageHero measure="reading|wide">`, `<Container measure="reading|wide">`, or an inner `max-w-3xl`/`max-w-5xl` div), never a second, narrower centred box (`max-w-3xl mx-auto`): that is what put heroes, tabs and text at four x positions (UXD-05). No page passes `PageHero`'s `width` any more; it stays for a deliberate exception.
- **No blank bands, no ragged rows** (owner decision of 6 October 2026): a card never ends in a band of empty cream because a neighbour in its row is taller, and `items-start` is not the fix. Things the reader compares become one card with hairline columns (the three blocs on `/eleicoes/legislativas`, one cream card split by hairlines from `lg`; "Serve para / Não serve para" on the population methodology and `/populacao/dados`; the `/populacao/qualidade` tier cards, which share four subgrid rows from `md` (C on its own row until `lg`), at `1fr 1.3fr 1.4fr` from `lg`, columns as wide as their text, with tier C's two size readings in a note under the row); uneven content is evened (a wider column for the longer text, as the homepage's economy card gives its painting); very different charts stack, each at its own height (the `/qualidade` fit charts, the `/marca` showcase). In the standard layout, homepage panels end on their painting (see "Homepage").
- **Show/hide** is `<Disclosure>` (`src/components/viz/Disclosure.tsx`: a native `<details>`, 44px summary, a left chevron that turns when open, sentence-case label in ink, works in server and client components): table twins (`ChartTable` uses it), map lists, FAQs, notes, "Como ler isto" (`HonestyNote`), producer notes. One look for one action: no uppercase "MOSTRAR" toggles, no rows without a chevron, no chevron on the right, no bespoke button with `useState` for something a `<details>` does. A details whose open state the page controls (the misteriosa "Como se joga?" card, which the page closes after a pick or a new clue) keeps its own element with the same look (left chevron, 44px, sentence case). MDX `<details>`/`<summary>` get the same left chevron and 44px row from `.article-body details` in globals.css (MDX 3 renders a hand-written `<details>` as a plain element, so `mdx-components.tsx` cannot style it), so a methodology page's details read as the same control.
- **Standalone links** (a link on its own line or in a card footer, not inside a sentence) are `<TextLink>` (`src/components/brand/TextLink.tsx`): ink, underlined at rest, 44px tall at any font size. **Back links** have one pattern: `<PageHero back={{ href, label }}>`, an arrow and the parent's own name ("← Liga Portugal", "← População sintética", "← Distrito de Lisboa"), never "Voltar à …". `PageHero` drops the kicker segments that repeat the back label (`kickerWithoutBack`, `src/components/brand/hero-kicker.ts`: "← Liga Portugal" over "Jogadores", not "Liga Portugal · Jogadores"); it reads strings only, so a kicker built from elements (a `ClockSwitch`) is written without the section name by hand. The election archive pages open with "← Eleições" (to `/eleicoes/arquivo`) and the kicker "Arquivo · 2025" or "Arquivo · 2026"; `/eleicoes/legislativas/mapa` with "← Legislativas 2025".
- **Revision dates** are `<RevisedDate date="YYYY-MM-DD" />` (`src/components/brand/RevisedDate.tsx`) in the PageHero's `meta`: "Revisto a 6 de outubro de 2026" / "Revised 6 October 2026", always a full day, never "Última revisão" or a month alone. The date is a constant beside the page (`REVISED`, `HUB_REVISED`, `PRIVACY_REVISED`), moved with the text. A prose page's sitemap `lastmod` is its entry in `COPY_REVISED` (`src/lib/sitemap-dates.ts`): when a page's revision line or copy changes, change its entry too (`sitemap-dates.test.ts` fails when an entry and a printed date drift; data pages are dated by their data).
- **Numbers and ordinals** (`src/lib/typography.ts`): negatives use the minus sign U+2212 (`MINUS`, `formatSignedNumber`, `withMinus` for a string Intl or `toFixed` already formatted), never the hyphen-minus, in text, tables, SVG labels and chart ticks (`formatValue` in `viz/theme.ts` does it); football keeps `formatSigned`/`formatPp` from `football-format.ts`, which follow the same rule. Ordinals go through `ordinal(n, locale, gender)`: "5.º", "1.ª" in Portuguese (always the abbreviation point, never "5º"), "5th", "1st" in English. Football keeps `formatOrdinal(n, locale)` from `football-format.ts` for table positions, with the same output as the masculine `ordinal`. No local `ordinal()` copies.
- **Chart frame**: every chart and every standalone table of figures sits in one `<DataCard>` (title, optional subtitle and badge, the plot, a footer with source, date and a methodology link), in every section. No bespoke card, icon-titled header or loose legend instead of it; a chart inside an article is a `<Figure>` (caption, source, as-of), the editorial twin. Archived forecasts name their run in the footer ("Fonte: modelo estimador.pt, 9 000 simulações · Previsão de 16 de maio de 2025 · Metodologia"; "Forecast of 16 May 2025" in English, the long date from `formatElectionLongDate`). A new chart without the frame and a `<ChartTable>` twin is not finished.
- **Wide tables on phones**: `ChartTable` keeps its first column (the row label) sticky with a hairline, the header row sticky, and a `.scroll-cue` edge shadow (globals.css, pure CSS) while there is more to scroll; another scroll area gets `tabIndex={0} role="region" aria-label` and `.scroll-cue` the same way. `ChartTable` right-aligns figure columns, header included, and left-aligns words (`columnAlignments` in `src/components/viz/table-align.ts`; bounds such as "menos de 1%" count as figures; the `align` prop overrides). MDX tables and code blocks are named, focusable scroll regions (`MdxTable`, `MdxPre` in `src/components/mdx/ScrollBlocks.tsx`: the table on paper with `.scroll-cue`, code wrapping below 640px); inline MDX code breaks words.
- **Phones**: tap targets are at least 44px (`min-h-11`); on a coarse pointer or below 640px, `:where(footer, nav) li > a` and the opt-in `.tap-target` class get it from the base layer, so lists of links need nothing of their own. Form controls are 16px below 640px (globals.css, unlayered), so iOS does not zoom on focus. `html` has `scroll-padding-top: 5rem`, so anchors, focus and `scrollIntoView` clear the sticky header: do not add `scroll-mt-*`.
- **Visualisations** (`src/components/viz`, showcased as section 08 of `/marca`): `<DataCard>` (title, source, date, methodology link) frames every chart; `<StatTile>`/`<KpiRow>` for headline numbers with optional sparkline and delta; `<TrendChart>` (2px line, 80% band wash, dashed projected segment, end labels, crosshair tip); `<ColumnChart>` (24px caps, one highlighted column); `<RankedBars>`; `<OutcomeBar>` for 1X2; `<PeopleGrid>` (100 dots); `<Segmented>` filters; `<Legend>`; `<ChartTable>` (the table twin every chart carries). Series colours live in `theme.ts` (`SERIES`/`SERIES_DARK`, mirrored as `--color-series-1..4` and `--color-series-dark-1..4` tokens): fixed order teal, gold, periwinkle, coral; never cycled, never on text, at most four (the fifth folds into "other"). `STATUS` colours are reserved for state and always ship with an icon and a word. Team and party colours keep their own maps. The data pastels are for categorical fills and small marks, not for line series. Chart text is Manrope (`FURNITURE.font`), never Inter. Every Observable Plot output goes through `quietPlot()` (`src/components/viz/plot-a11y.ts`, exported from `@/components/viz`) before it is inserted: it hides the drawing from assistive technology (Plot labels role-less `<g>`s, which axe reports as aria-prohibited-attr), since the DataCard title and the `<ChartTable>` twin are the accessible version. The same contract applies to the older Plot and SVG charts: the title race, relegation, team timeline, polling, seat, coalition, presidential trend and head-to-head charts and the economy sparklines carry a `<ChartTable>` twin and a hover tip, so a new chart must too. A table twin is a complete alternative: every point the chart draws at the chart's own resolution, with its bands or quantiles in their own columns, in the page's number format; long tables scroll inside the disclosure. Nothing in an SVG is below 11px.
- **Chrome**: every page opens with `<PageHero>` and closes with `<SiteFooter locale={locale} />` (one exception left: `/artigos/tema` still opens on a hand-written `<header>`; give it the `/artigos` hero when it is next touched). OG cards come from `scripts/lib/og-cards.mjs` (Manrope via `@fontsource/manrope`; the mosaic only on the brand card, drawn with the geometry of `<Mosaic variant="cover">`; `articleCard` still adds one to an explainer's card, which the 6 October rule does not list, and no explainer is published yet: settle it before the first one ships).
- **Communications**: one line ("Dados para compreender Portugal."), one descriptor ("Dados e modelos sobre Portugal, com a incerteza à vista: quem vive em cada freguesia, como pode acabar a Liga e o que diziam as previsões eleitorais.", owner decision of 6 October 2026: live sections first, no "previsões" for everything) and two bios (pt, en; same order), written once in `src/lib/brand/descriptor.json` (`src/lib/brand/descriptor.ts` for the app) and read by `meta.defaultDescription`, the homepage's identity line (the page's h1 is the line, the descriptor follows), the footer blurb, the feed description, the OG brand card (`scripts/generate-og-images.mjs`), the social kit and the README; `descriptor.test.ts` fails on a retyped copy. The brand notes live in `docs/brand/` (`social-kit.md`, `section-illustrations.md`). `npm run brand` regenerates every logo, icon and social asset (`scripts/generate-brand-identity.mjs` + `scripts/generate-social-kit.mjs`, outputs under `public/brand`, `public/branding`, `public/images/brand`); the Liga matchday card is `scripts/generate-social-images.mjs`. Voice: sentence case, questions as headings, uncertainty stated with interval, date and source, one action per piece, no emoji or exclamation marks. Portuguese copy addresses the reader as **tu** ("Escolhe a tua equipa", "Explora", "Segue o feed"), never você, including meta descriptions and buttons; English is en-GB. Page titles go through `siteTitle()` (`src/lib/site-title.ts`, re-exported by `src/lib/metadata.ts`; `createPageMetadata` applies it), which appends the one suffix " | estimador.pt": pass a bare, sentence-case title and never type a suffix, in code or in `meta.*` messages. The `.pt` of the signature is `BRAND.muted`, never `BRAND.faint`. The kit and the voice rules are on `/marca`. No `twitter:creator` or `twitter:site` (`src/lib/metadata.ts`) until the owner confirms the account; add them together with a footer link.
- **Licences** (owner decision of 6 October 2026): estimador.pt's own data and model outputs are CC BY-NC 4.0 (non-commercial, with attribution; commercial users write in): the synthetic population (every `pt-synthpop` release relabelled in place; the data files are byte-identical, only the package's licence texts, `ERRATA.md`, `metadata.json` and `checksums.sha256` changed, which `PINNED.checksums` in `scripts/sync-population.py` pins), the Liga Portugal open data (`/desporto/liga/dados`) and the archived election forecasts. `/sobre#reutilizar` is the one site-wide answer (scope, exclusions, citation form). Material from others keeps its own licence and every attribution says which licence covers which part: INE's Censos 2021 data and DGT's CAOP 2021 geometry stay CC BY 4.0 (`SHORT_ATTRIBUTION` and `releaseCitation` in `src/lib/population/cite.ts`: "Fonte: INE, Censos 2021 (CC BY 4.0) · informação modificada por estimador.pt (CC BY-NC 4.0)"; the population map and the game's end panel credit the CAOP geometry as CC BY 4.0). Third-party football data are never relicensed: `/desporto/liga/dados` marks them "Fora da licença" per file (`FILE_DOCS[].thirdParty`: SofaScore results and match statistics, FotMob xG, Pinnacle and Bet365 odds via football-data.co.uk, Transfermarkt injuries and market values); update the mark when a feed gains or loses such a field. Polls, official results, odds and the brand stay outside the grant too.

## Homepage

Four subjects, one hierarchy (`src/app/[locale]/page.tsx`, panels in `src/components/home/`). The page opens by saying what the site is: a compact identity block whose h1 is the brand line (`brandLine`), followed by the descriptor (`brandDescriptor`), "Um projeto independente" (`home.identityByline`) and a "Sobre o projeto" link; every panel title is an h2, in election mode too. Below 1024px, where the nav sits behind the menu button, a labelled row of shortcuts ("Atalhos": A minha freguesia, which goes to the parish search on the same page and focuses it, `SearchShortcut`; O meu clube; Eleições) follows it, left-aligned chips each with a status a newcomer can read ("Censos 2021", "Depois da J7" from `home.shortcutClubStatus`, "Arquivo"); the economy has no shortcut while it is in preparation. The page body uses the shared container (`CONTAINER_CLASS`), so it lines up with the header. Standard mode leads with the synthetic population (2fr: parish search, today's Freguesia misteriosa), football is the rail (1fr), economy and elections support in a second row; below 1100px the lead row stacks.

In the standard layout every panel ends on its painting, so no card ends in empty cream (the layout rule in "Design Language"); in election mode the lead `ElectionsPanel` sets its scene inside the card (inset under the heading, and from 1100px absolutely at the top right, 40% wide), not edge to edge. The lead row shares one height (`items-stretch`): from 768px the population card holds the house in its right column, its ground toned to the card's cream (`ART_FIELD`), up to 430px tall, vertically centred and inset 16px top and bottom (`md:max-h-[430px] md:self-center md:py-4`), so it reads as a column without being full height; the Liga rail (`FootballPanel`) shows, before a club is picked (`FootballClubPicker` then shows that club's outlook), the title race, then the three clubs likeliest to go down ("Probabilidade de despromoção (17.º ou 18.º)", `home.footballRelegationLabel`, from the same `mdNN`), then "Ver a Liga Portugal" and the club picker, and ends on the stadium as a band that takes the height the rail has left (`.home-band` in `globals.css`, cropped to fill; its floor drops from 160px to 96px from 1100px, so the population card, not the rail, sets the row's height). The support row is two media objects (owner choice, 6 October 2026; `.home-media`): text on the left, the section's painting on the right as a column the card's full height, bleeding to its top, right and bottom edges behind a hairline and cropped to fill at a per-scene focus. Below 768px the support cards are text only; from 768px they stack, both painting columns 40% so the paintings line up; from 1280px they sit side by side (3fr/2fr, one shared height), the elections painting at 38% and the economy painting at 50%, so the economy card's shorter text fills the height. The election archive rows inside that card stack below `sm`. Every panel's kicker carries a status pill read from the data (`Kicker pill` and `Status` in `src/components/home/HomePanel.tsx`): the population "Publicada · v{version}" (`home.populationPill`, only when `meta.json` says `data_status: "release"`), with "Versão de {date} · Censos 2021" (`home.populationStatus`, from `meta.published`) as its status line; football the round the forecast follows ("Depois da jornada 7"), which `splitForecastRound` (`src/components/home/football-status-pill.ts`) splits off `forecastStatusLine`, so the rest of that line (the date and the next update, which `ClockSwitch` swaps once the next round is played) sits under the heading and the round is not said twice; elections "Arquivo" ("Previsão" for an election still to come, in election mode); economy "Em preparação" or "Em pausa", and no pill once live. The hierarchy is an editorial setting in `src/lib/config/homepage.ts`: set `HOMEPAGE` to `{ mode: 'election', election: '<id from elections.ts>' }` and rebuild to lead with an election; an id without published data falls back to the standard layout with a build-log warning, and a past election is labelled an archived forecast, never live. Preview without editing: `HOMEPAGE_MODE=election HOMEPAGE_ELECTION=presidential-2026 npm run build`. Every number on the page comes from the loaders (`loadPopulationMeta` counts, `loadLigaSummary` + `loadLigaWithDeltas`, `loadEconomyDashboard` behind `economyState` — the editorial flag, then the pause rule — the election loaders in election mode only); the economy stays in the support row in both modes while it is in preparation (a test pins this); the copy lives under `home` in `messages/*.json`. Each panel carries its section's painting, from the one family in "Three levels of expression". The population panel's is the house, and `<HomeArt>` (`src/components/home/HomeArt.tsx`) draws it and nothing else: the refined 13 September master (`docs/design/original-illustration-refinement/03-people-v2.png`, saved as `population.png` in `docs/design/homepage-claude-handoff/assets`; git-ignored PNGs, only `manifest.json` is tracked), which `node scripts/generate-home-art.mjs` cuts into two shapes of AVIF/WebP in `public/images/home`, its ground toned onto the panel's cream (`ART_FIELD`): the lead is the house alone, its neighbours veiled to cream below the eaves (300, 600 and 880 wide; the 300 serves the 90px phone thumbnail), and the square is the whole scene (tree, house, cypress) padded to a square (400 and 800, for election mode and `/marca`); `<HomeArt>` picks a width (its `SHAPES` mirror the script). The script refuses a master whose size is not the one `manifest.json` records (it prints the `cp` from `03-people-v2.png` to run), and `prebuild` does not run it: the committed crops are what ships. A new master needs the manifest's bytes and the toning constants (`GROUND`) re-measured. `<HomeArt>`'s `media` prop goes on both `<source>`s and swaps the fallback `<img>` for a 1×1 GIF, so art hidden by CSS at one width is not fetched there (UXM2V-04): the two eager placements of the lead layout pass complementary queries (`(max-width: 767.98px)` for the phone thumbnail, `(min-width: 768px)` for the desktop column), and the lazy ones of the secondary layout pass none. The football, economy and elections panels use the section scenes (`SectionIllustration`, `/images/sections/`); the 12 September homepage paintings of those three sections were deleted on 6 October 2026, with their crops. `HomeMiniature` (the village hero) is no longer on the homepage but stays available.

## Economy section

In preparation. One editorial flag, `src/lib/config/economy-status.json`
(`{ "published": false }`), read by `src/lib/config/economy-status.ts` (`ECONOMY_PUBLISHED`,
`economyState(asOf)` → `preparing` | `paused` | `live`) and by
`scripts/generate-og-images.mjs`. Data age never publishes the section; it can only pause
a published one (the 20-business-day guard in `economy-time.ts`). While the flag is off:

- `/economia` is the explainer ("Compreender a economia", no number, no date, no promise of
  a return), which gives its status once, in the kicker ("Economia · em preparação",
  `economics.preparingEyebrow`) and the lede ("Esta secção está em preparação e ainda não
  publica leituras nem estimativas da economia…"); the reading card under it has no pill and
  no painting (`EconomyReading`), and its way on is "Como leríamos a economia?"
  (`economics.methodologyTitle`). The homepage's status line is "Em preparação · ainda sem
  leituras da economia publicadas" / "In preparation · no economic figures published yet"
  (`home.economyPreparingStatus`); and
  `/economia/metodologia` states its status once, as the hero's lede ("ainda não há leituras
  nem estimativas da economia publicadas… os números que mostra são de um teste interno"),
  under one kicker (the back link) and a `RevisedDate`; say "leituras", not "números", since
  the methodology does print backtest figures; both are noindex and
  out of the sitemap, and have no share card of their own (they use the brand card);
- the header, mobile menu and footer say "Economia · em preparação"
  (`nav.economicsPreparing`), the homepage panel carries the "Em preparação" pill and
  status, and `/sobre`'s status list says the same;
- no economy figures are served: `public/data/economics/` is empty and git-ignored (the
  July 2026 `dashboard.json`/`stories.json` were removed), `validate-data` has no economy
  entry, and the loaders are only called when `ECONOMY_PUBLISHED` is true;
  `./scripts/sync-data.sh economics` refuses to copy anything while the flag is off, and
  `./scripts/sync-data.sh all` never touches economics;
- `/economia/metodologia` describes the prototype tested up to July 2026 in the past or
  conditional tense (internal backtest figures labelled as such, no open-code claim until
  the repositories are public), set in `.article-body` with the shared MDX components.

Launch checklist: table twins for the seven charts without one, the copy moved into
messages, en-GB dates, the methodology rewritten for the published panel (present tense,
the live track record, a link to the code), then set `published: true`, remove
`/public/data/economics/` from `.gitignore`, run `./scripts/sync-data.sh economics` and
restore a required `economics/dashboard.json` check in `scripts/validate-data.mjs`. The flag
alone restores indexing, the sitemap entries, the share card and the plain nav label.

## Population section

The synthetic population release (`pt-synthpop` v1.0.3, published 2026-10-05; microdata on
GitHub releases, `POPULATION_DOWNLOADS`). Config, routes and the release number live in
`src/lib/config/population.ts`; code reads `POPULATION_RELEASE`, never a typed version.
v1.0.3 superseded v1.0.0, v1.0.1 and v1.0.2, all dated 5 October 2026 (doc 206 §5–§7;
v1.0.2 was never served nor released on GitHub, and GitHub shows v1.0.3 on 6 October,
because it went up at 00:01 UTC: `GITHUB_PUBLISHED`). The generated population is v1.0.0's
throughout. Every parish answers every question with its own numbers and its measured
tier (A 776 / B 705 / C 1,611), no cell is suppressed, and a category with no one in it
shows "0,0%" (8,723 of them). Household size, household type, "who lives alone" and
"elders alone" (like multigenerational) count private households only
(`is_institutional = 0`); the producer writes pt-PT display values ("18,0%") and
`formatDisplay` sets the decimal mark per locale. The package's `nuts2` is NUTS-2013 from
v1.0.3 and its município names are INE 2021's; the site keeps CAOP 2021 names. The history
sentence lives once, in `SUPERSEDED` (`src/components/population/quality/copy.ts`, with
`REPLACED` and `GITHUB_PUBLISHED` beside it). The quality page renders no band verdict: the
scorecard's pre-registered ranges (`band_reading`, `band_position`, the strata notes,
`in_band`, `coverage_in_band`) were set for an out-of-fit check with the earlier engine,
the page's errors are in-sample, and none of them is shown (MR2-02); `scorecard.json`
stays verbatim. Tiers are reading guides, not gates. The release is dated by its own date
on the population pages and the homepage ("datada de 5 de outubro de 2026", "Versão de …"
in heroes and the homepage status line; `/sobre`'s row still reads "Publicada · … de 5 de
outubro de 2026" and should say "datada de" too); only `/populacao/dados` also gives
GitHub's 6 October (`GITHUB_PUBLISHED`).
The release is CC BY-NC 4.0, INE's data CC BY 4.0 (see "Licences" in "Design Language"):
`/dados`, the parish page's licence row, the hub's data card, the methodology, the cite line,
the share card and the Dataset JSON-LD say so.

**`household_type` caveat (until v1.0.4).** The v1.0.3 bundle's `household_type` responses
do not match the packaged microdata: they were built from a pre-packaging nucleus count and
differ from the private-household `hh_type_top` in 844 parishes, by at most 2.2 pp (producer
ask 25 in `docs/population/producer-feedback-v1.0.0.md`). The site prints them as published,
never recomputes them, and says so wherever they appear: `RECIPE_CAVEAT.household_type` in
`labels.ts` is an amber note on the parish card (#familias, `ResponseCard` passes
`sourceLine(recipe, locale, { withCaveat: false })` and draws the note itself), is appended
to the source line elsewhere (`withCaveat` defaults to true, which is how the game clue gets
it), `MethodologyBlocks` shows it beside the methodology's `hh_type_top` row, and
`SITE_NOTES['households.hh_type_top']` (`src/components/population/data/dictionary.ts`, site
notes in the reader's language under a dictionary row) says it under the `/dados` column.
When the producer ships v1.0.4 (corrected responses, same deck calendar): delete both, re-sync, bump
`POPULATION_RELEASE` and run `npm run og`.

**Freguesia misteriosa's calendar.** The game deck holds all 3,092 parishes with v1.0.1's
calendar; day 0 (N.º 1, parish 030857) is `POPULATION_GAME_EPOCH` in
`src/lib/config/population.ts`, the site's launch day (2026-10-06), not the release date.
`scripts/sync-population.py` reads that constant (or `--game-epoch`) into
`game/index.json`, and `game.test.ts` checks that they match. The epoch must equal the
first deploy date: if the merge or deploy is not on 6 October 2026, change the constant,
re-run the sync and only then deploy (`/data/population/v*` is served immutable, so the
epoch cannot move after).

**Freguesia misteriosa's rules (v2, owner decision of 6 October 2026: "qual destas
quatro?").** Each day shows four parishes, named with their concelho, listed alphabetically
(Portuguese collation, then code) and numbered 1–4 on the small map (`Locator`); one is
the day's answer. The clues are that parish's own published responses in `CLUE_ORDER`
(ages first); a wrong pick crosses that parish out (aria-disabled, an icon and "não é
esta") and opens the next clue, and "Ver a próxima pista" opens one without a pick. The
score is the clue the answer was picked on (1.ª–6.ª); there is no lost game. The other
three come from `gameChoices(day, answerCode, places)` in `src/lib/population/game.ts`:
mulberry32 seeded by the day and the answer's code, drawn from places.json in its own
order, in four different districts or autonomous regions, with at most one on the islands;
the answer's size rank among the four (INE residents) is drawn first and uniform, so size
gives nothing away (a three-band spread made the largest of the four the answer on only 11%
of days); the others are then drawn from below and above the answer, and when no parish
fits a slot the islands rule gives way first, then the side, never the four regions. It reads no response, share or statistic, and `game.test.ts` checks the rules and
the rank spread (25% ± 3 at each place) on all 3,092 days. Only the answer's figures are ever shown; the other three
are names and places. Stored under `estimador:misteriosa:v2` (`{ day, picks, cluesOpened,
status, live }`; v1 records are ignored), listed on `/privacidade`. Share text: "Freguesia
misteriosa n.º {n} ({date}): acertei à {k}.ª pista, {sem erros|com 1 erro|com {e} erros}."
plus the address. On a phone, after a pick the new clue's card scrolls to the top, so the
four stay on the same screen as the clue (clues 1–5); a ruled-out parish keeps its numeral
on the map in full ink, with a coral cross beside it.

- **Routes** (`src/app/[locale]/populacao/`): hub `/populacao`, parish pages
  `/populacao/freguesia/{CODE}` (6-char DICOFRE, e.g. `0302FA`), regions
  `/populacao/regiao/{slug}` (`regionSlug`), `/misteriosa` (daily game), `/qualidade`,
  `/dados`, `/metodologia`, shared query links `/populacao/v/{release}/q/{id}` (served
  by `/populacao/consulta`), and `/miniatura` (an imagined explainer with invented
  people, noindex, not the release).
- **Data**: `./scripts/sync-data.sh population` (`scripts/sync-population.py`) writes
  `public/data/population/v{release}/` (meta, places, parish/<code>, national, game,
  q, scorecard, release, and `manifest.json`: the release and contract versions, the
  data status, the source hashes and the SHA-256 of every other file, which
  `scripts/validate-data.mjs` checks, so a hand edit or a half-finished sync fails the
  check). Server code reads it through
  `src/lib/utils/population-data-loader.ts`, browser code through
  `src/lib/population/client.ts`. To bump: re-sync, change `POPULATION_RELEASE` (config and
  `scripts/validate-data.mjs`), the asset sizes in `POPULATION_DOWNLOADS` (tested against
  release.json), `SUPERSEDED` if the history changes, and rerun `npm run og`. What the
  site still asks of the producer, and the calls it took without them, are in
  `docs/population/producer-feedback-v1.0.0.md`.
- **Data rules** (producer handoff doc 206 §3, enforced in review): every number comes
  from a published response, the scorecard, release/meta counts or the INE counts in
  places.json (labelled "INE, Censos 2021"); never compute new numbers from cells.
  Single model run: no intervals, rankings, superlatives, "more/less than" or sorting by
  value; no choropleth of a statistic (the map colours parishes by quality tier only:
  metadata). The code keeps handling `fallback`/`refuse`/suppressed responses (part of
  the contract: fallback figures name the município, refusals show the reason, suppressed
  reads "Suprimido", absent "—"), but copy describes them only when `meta.counts` or the
  record says they happen; no release since v1.0.1 has any.
  No narrated synthetic individuals. `HONESTY.synthetic` sits near the first number on
  every page; `HONESTY.positioning` is quoted verbatim. Copy helpers in
  `src/lib/population/labels.ts`.
- **Parish shell + rewrite**: one exported shell per locale
  (`generateStaticParams` → `[{ code: '_' }]`); `staticwebapp.config.json` rewrites
  every `/{locale}/populacao/freguesia/*` to it (except the shell's own `_/index.txt`
  payload, served as itself) and `/populacao/v/*` to the consultation
  page. The shell's static HTML names no parish and carries no canonical, hreflang or
  noindex (any of them would apply to every parish at once); its og:image and
  twitter:image are the population card, since link previews run no script (per-parish
  previews are a later, server-side step). The shell page, not the `[locale]` layout,
  renders its pre-hydration script, as its first child, before the header, as an async
  inline module (`<script type="module" async>`: React puts the stylesheets first in
  `<head>`, and a classic inline script after them waits for the CSS; an async module runs
  as soon as the parser reaches it, UXM3-13):
  `parishShellScript(locale)` (`src/lib/population/prefetch.ts`) reads the code from the
  address, writes the parish's canonical and pt/en/x-default alternates (marked
  `data-parish-head`) and starts the `meta.json` and `parish/<CODE>.json` requests (plain
  `fetch()` calls, not preload links) while the JavaScript downloads, leaving them in one
  window key, `window.__populationPrefetch` (`PARISH_PREFETCH_KEY`);
  `src/lib/population/client.ts` takes each request from that key once, so each file is
  fetched once per view. After mount the client reads the code from
  `window.location.pathname` and `parish/head.ts` sets the title and description,
  re-values the `data-parish-head` links, adds noindex only for an unknown code and
  removes what it added when the reader leaves; when the data arrive before Next's
  metadata hydrates, it also drops the second og:title and twitter:title React then adds.
  In the shell's static HTML the header's language links point at the population hub,
  never at `/freguesia/_/`, until the page knows its parish. Titles and descriptions come
  from `parish/head-text.ts` (at most 70 and 155 characters, tested over every parish; the
  h1 keeps the full name). `places.json` is not needed for the first paint: it loads only
  as "Outras freguesias" comes near (an IntersectionObserver in `ParishPage`). Never
  `useSearchParams`. The consultation page (`/populacao/v/{release}/q/{id}`) has the same
  kind of early script: `consultaShellScript(locale)`
  (`src/components/population/consulta/shell-script.ts`, also an async module, rendered first
  by `consulta/page.tsx`) resolves the link with `resolve.ts`'s rules before the bundle and,
  when it can, replaces the address with the card's (`location.replace`); it leaves its
  bucket request in `window.__populationPrefetch` (reading a clone itself), so the React
  resolver (`PermalinkResolver`), which keeps every error state, does not fetch it again. An
  unresolved link sets its own title, and the page reserves the error card's height
  (`RESERVED`).
- **Plain links**: link to parish pages with `ParishLink`/`parishHref` (a plain `<a>`),
  never `next/link` — there is no RSC payload behind the rewrite.
- **Site wiring**: `PopulationPanel` on the homepage (search, game, data link; counts from
  `meta.json`), the `population` entry in `sections.ts`, the header item
  (`nav.population`), the sitemap (hub pages discovered on disk, plus 20 regions and
  3,092 parishes per locale from places.json; `miniatura` and `consulta` hidden), and
  analytics (`analytics-privacy.ts` keeps the page kind, never the parish code or region).
- **Copy**: page copy is inline (`locale === 'pt' ? … : …`) or in the section's copy
  modules; the homepage panel's strings are `home.population*` in `messages/*.json`; the
  About, privacy and site methodology pages carry one paragraph or row each.
- **Smoke check**: `scripts/smoke-check.mjs` probes the rewritten parish and query URLs
  (the unslashed, lower-case parish address included: the rewrite answers it with the
  shell) and keeps a missing parish file a 404.
- **OG card**: `node scripts/generate-og-images.mjs` writes `/populacao`'s card from the
  newest `meta.json` (parish, person and household counts, the release's own honesty
  line); rerun it after a release bump.

- **Places and the parish file**: `places.json` columns are `[code, name, municipality, tier, level, census_population, generated_households, lat, lon, publication_population]` (+ `households_source`); `generated_households` counts the generated population's households (a collective quarters counts one) and is never labelled INE. Each `parish/<code>.json` carries a `place` header (name, município code and name, region id and name, level, census_population, generated_households, publication_population, and `worst_constraint` / `worst_constraint_srmse` / `person_srmse_median` from quality.csv, verbatim: the code is shown only through its site label, never raw, and the median's value is never printed, only whether it is within tier B's limit), so a parish page draws from one file; `places.json` loads lazily: for search, the other-parishes list, and the map, which fetches it only at município level, on a pointer, tap or focus in the map, or for a focused parish (region pages do not fetch it on arrival; the map's country and region lists fall back to the geometry's names). Helpers: `tierMeaningFor(tier, publication_population, census_population?, worst?)` (pass INE's count too, so a parish whose two counts sit either side of a tier threshold says so; pass the place header's fit as a `WorstTable`, `{ key: worst_constraint, srmse: worst_constraint_srmse, median: person_srmse_median }`, and a tier C parish of 500 or more names the table, the typical error or both that set its tier, the table's SRMSE with three decimals in the reader's locale (`formatFit`); only a single-year-age parish whose median is known to be within tier B's limit is told its answers can be close to INE's tables, and without the median the sentence claims nothing of the kind; the map and the game read places.json, which has no worst table, and keep the generic words) and `sourceLine(recipe)` / `RECIPE_PROVENANCE` (fitted vs derived) in `labels.ts`; `searchPlaces` (município rows too), `NEARBY_KEY` and `NEAREST_MAX_KM` (25 km) in `places.ts`. `country.json` is rebuilt with `~/code/estimador-microsynthesis/.venv/bin/python scripts/build-atlas-country.py` (needs shapely). Coverage is worded "as 3 092 freguesias dos Censos 2021 (CAOP 2021)" (the 2025 split into 302 parishes post-dates the census), on the pages, `/sobre` and the OG card; the homepage panel names the Censos 2021 once and then says "as 3 092 freguesias que existiam nessa altura" (`home.populationText`).
- **Trust-page vocabulary** (`src/components/population/quality/`, `data/`): `CONSTRAINT_LABEL` (in `src/lib/population/labels.ts`, with `formatFit`, both re-exported by `quality/copy.ts`) is the one name per evaluated table, keyed on the scorecard's bare `constraints[].key` (`p_age5`). `constraintLabel(key, fallback, locale)` in `quality/copy.ts` looks that bare key up and strips no prefix; quality.csv's and the place header's `worst_constraint` is `srmse_` + the key (`srmse_p_age_single`), so drop the prefix before a lookup, as `tierMeaningFor` does with its `worst` argument. `FITTED_PERSON_KEYS` are the 12 fitted person tables; single-year age is scored but is not one of them. The scorecard's own labels are not shown. `quality/anchors.ts` holds the methodology anchors other pages link to (`METHODOLOGY_ANCHORS`, `methodologyFieldAnchor(field)`, and `methodologyAnchorForRecipe(recipe, locale)` for a card's "Como foi feito"; a test keeps them in step with the MDX headings). `INSTITUTIONAL_RECORDS` (`quality/copy.ts`) is the one statement of what collective-quarters residents carry, and the education and employment source lines say those residents' values were assigned after the fit (`sourceLine`). `FitBars` takes `max`, so the two `/qualidade` fit charts share one scale; the `/qualidade` glossary defines "violação estrutural" from the producer's `release_gates.py`. `SITE_LABEL_MAPS` in `data/dictionary.ts` labels the three code columns the release's `label_maps` leaves out (`activity_sector_code`, `education_level_coarse5`, `nuts2`) on `/populacao/dados`, until the producer ships them.
- **Map** (`src/components/population/map/`): the frame's height is CSS (`PopulationMap.module.css`, `--map-height`, and `min(var(--map-height), max(360px, 108cqw))` below 640px). The Azores region offers its three island groups as framings (`AZORES_GROUPS` in `src/lib/population/map/islands.ts`) and is fitted clear of the zoom controls; a tap on the sea within `TAP_REACH_PX` (22) of a small shape takes the nearest one; at country zoom a district name may be shortened (`COUNTRY_LABEL_SHORT`, `map/placement.ts`). A "Saltar o mapa e ver como lista" bypass link comes before the SVG. `regionLabel()` (`places.ts`) names the Azores "Azores" in English lists, breadcrumbs and labels. The section tab row (`SectionNav`) wraps below `sm`; no horizontal scroll or fade.
- **Parish page sections**: the employment card draws the 100 dots; the separate "Se fosse 100" section was removed. Each card opens with a place line (`ResponseCard`'s `place`: name, code, concelho, and INE's residents under 500), so a shared card or a screenshot still says where its figures are from; the hero states the tier and its meaning as visible text (once per page), and under 500 residents (the count the tier uses) a one-line note says each question counts only its own group. Card footers have fixed rows: the source line, then "Como foi feito" with the response id and copy. A guess-first card (`GuessFirstCard`) takes the guess on a 10×10 grid like `HundredPeople`, which, after the reveal, outlines the guess on the published dots (`guess`). The table twin's rows come from `twin-rows.ts` (an age band where nobody lives alone becomes one row with the chart's sentence).
- **Permalinks and citing**: `responsePermalink` (`src/lib/population/permalink.ts`) builds `/populacao/v/{release}/q/{id}` (with `/en` in front for an English reader); the host rewrites it to the consultation page, whose resolver opens the response on its parish page at the card's anchor (e.g. `/pt/populacao/freguesia/010103/#vivem-sozinhas`), upper-case ids and an `/en` prefix included. The parish page replaces its address with the upper-case, trailing-slash form, and the header's language switch is a plain anchor built from that address. Every parish page ends with a "Como citar" block (`#citar`) from `src/lib/population/cite.ts` (release citation, parish citation, short attribution).
- **Miniatura**: an explainer with invented people, under `<PageHero>`, titled "Como se lê uma população sintética?". From 721px wide the stage ends at its own content, with no slack in it (the last block of `miniatura.css`, "Round 5"; the earlier blocks there are history): `.mini-stage-view` (the bar, the scene, its zoom controls, the caption and the legend) sits inside `.mini-stage-follow`, which ends above `.mini-stage-tools`, a row carrying a second copy of the filter, the count, the tour and the household picker (ids `mini-house` and `mini-house-stage`; one copy is shown at a time, the sidebar's on phones, where it keeps UXM2V-05's order; the row hides while a household is open). From 721 to 1199px wide with at least 560px of height the sidebar is the taller column, so the whole stage follows the reader down it, capped at the viewport less the header (`calc(100svh - 92px)`), the scene row giving way rather than the caption or the tools (P206); from 1200px, or below 560px of height, the stage neither follows nor shrinks, and a one-pixel shadow marks where a shorter stage ends. A touch tap (`pointerType === 'touch'`) that lands between the houses selects the nearest one within 44 screen pixels (`TAP_RADIUS_PX` in `Scene.tsx`, converted through the screen matrix and the camera's scale; `nearestHouse` and `houseCentre` in `src/components/miniatura/hit-test.ts`), since a house is about 29×28px on a phone; a tap on a house is that house's own click, a drag or a tap far from every house selects nothing, and on phones the "go to a household" menu comes before the scene (UXM2V-05).
- **Formats**: `src/lib/population/format.ts` (`formatCount`) is the one count formatter for every INE and release count, the homepage panel included ("3 092" with a no-break space in Portuguese, where Intl's pt-PT leaves four digits ungrouped). Each page states the parish's quality tier once, in the hero; cards carry no repeated status line.

### Data Organization
```
public/data/
  economics/
    dashboard.json              # Economy dashboard feed (unpublished while in preparation)
    stories.json                # Economy data stories (optional)
  elections/
    presidential-2026/          # Presidential archive: 13 files the pages read
    parliamentary-2025/         # Parliamentary archive: 4 files (district forecast, contested summary, house effects, TopoJSON)
  football/
    liga-2026-27/               # Current season: md*.json + md*_scenarios.json, players, game fixtures, injuries
    liga-2025-26/               # Last season: matchday files + review.json (archive)
    liga2-2026-27/              # Liga 2 (page noindex)
  population/v{release}/        # Synthetic population release (see "Population section")
  population-geography/         # Country, municipality and parish geometry
data/build-only/elections/      # Raw simulation draws read only at build time, never exported:
  presidential-2026/second_round_trajectories.json   (8.6 MB, 8000 runoff trajectories)
  parliamentary-2025/seat_forecast_simulations.json  (9000 seat draws)
  parliamentary-2025/national_trends.json            (1.4 MB of long poll-trend rows)
```

Election pages pass no raw draws or long rows to the browser: `loadBuildOnlyJson` (in
`data-loader.ts`) reads the three build-only files and `src/lib/election-aggregates.ts`
reduces them on the server (every quantile from all draws; a subsample for the dots: 800
runoff trajectories, and for the seats `drawnSeatIndices`, every 12th model draw
(`original_sample_id`) with all three of its emigration scenarios, 750 dots, about 200 on
phones; `compactTrendSeries` for the polling chart). `SecondRoundArchive` (server) renders
the runoff half of the presidential archive from those summaries. `validate-data` checks the
build-only files where they are (it requires `original_sample_id` on every seat row) and
fails if any reappears under `public/data`.

### Data Flow
- **Static Data**: Lives in `public/data/{section}/{subsection}/` as JSON files
- **Data Loaders**: `src/lib/utils/data-loader.ts` (elections, economy), `src/lib/utils/football-data-loader.ts` (football), `src/lib/utils/population-data-loader.ts` (population)
- **Chart Components**: Observable Plot + D3 in `src/components/charts/` (elections) and `src/components/charts/football/` (football)
- **Section Config**: `src/lib/config/sections.ts` — the section registry; today it only types an article's `section`. Navigation is `src/components/brand/site-navigation.ts` (header and 404) and `SiteFooter.tsx`, the homepage in `src/app/[locale]/page.tsx`.

### Section System
Sections are defined in `src/lib/config/sections.ts`:
```typescript
interface SectionConfig {
  id: string;
  type: 'football' | 'elections' | 'economics' | 'demographics';
  slug: string;
  nameKey: string;
  isActive: boolean;
  accentColor: string;
  dataPath: string;
  href: string;
}
```

### Key Config Files
- **Section registry**: `src/lib/config/sections.ts` — defines all platform sections (`isActive: false` marks an archive, not an unpublished section)
- **Economy flag**: `src/lib/config/economy-status.json` — whether the economy section is published
- **Homepage hierarchy**: `src/lib/config/homepage.ts`
- **Election config**: `src/lib/config/elections.ts` — election types and contestants
- **Party colors**: `src/lib/config/colors.ts` — political party styling
- **Team colors**: `src/lib/config/football.ts` — Liga Portugal team styling
- **Types**: `src/types/index.ts` (elections), `src/types/football.ts` (football)

### Locale and landmarks
- Every `[locale]` page and `generateMetadata` calls `setRequestLocale(locale)` from `@/i18n/request-locale` (not next-intl's own): the static export has no middleware, and server components that read the locale implicitly (`useLocale` in `ChartTable`, `OutcomeBar` and the other viz pieces, `getTranslations()` without a locale) otherwise fall back to Portuguese. Server components that can take `locale` as a prop should (`<Subscribe locale={locale} />` requires it).
- `<html lang>` is a BCP 47 tag, `pt-PT` or `en-GB` (`languageTag` in `src/lib/structured-data.ts`, also the JSON-LD `inLanguage`); hreflang stays `pt`/`en`. The root 404 (`src/app/not-found.tsx`) is one static file for both languages: a head script sets `lang` from the address, `NOT_FOUND_LANGUAGE_CSS` (keyed on that `lang`) shows the matching copy before hydration, the static HTML has a single Portuguese `<title>`, and a body script and `NotFoundByPath` (`src/components/NotFoundSwitch.tsx`) set the English one. Known and accepted: before hydration the static 404 holds two `main#main-content` (the hidden one is `display:none`), and without JavaScript an `/en/` 404 is Portuguese.
- Every page has exactly one `<main id="main-content" tabIndex={-1}>`, opened before `<PageHero>` so the hero is inside it; the header's skip link targets `#main-content`. Put page width on an inner wrapper, not on `<main>`. `src/lib/landmarks.test.ts` enforces this.
- Metadata: `languageAlternates` adds `x-default` (the pt URL, or the only locale a page exists in); the RSS autodiscovery link is emitted only once that locale has a published article (`feedAlternates`), the same rule as the nav, footer and sitemap. The parish shell builds its head by hand: no canonical or robots in its static HTML; its first script and `parish/head.ts` add the parish's own in the browser (see "Population section").
- Message keys: `npm run messages:unused` lists keys nothing reads, and `messages-unused.test.ts` (part of `npm run check`) keeps the count at zero and pt/en in parity. Delete a key in both locales when its last reader goes.
- Client messages: the browser gets only `CLIENT_MESSAGE_KEYS` (`src/lib/i18n/client-messages.ts`), not the catalogue. When a client component (`'use client'`) calls `useTranslations` for a new key, add the key there; `client-messages.test.ts` walks every route's import graph and fails on a missing key or a listed key that no longer exists. Server components read messages on the server; prefer passing text down as props over adding client keys.
- Structured data: `src/lib/structured-data.ts` is the one JSON-LD helper (`jsonLd()` escapes `<`): the WebSite + Organization `@graph` on every page (the `[locale]` layout; the WebSite `@id` is per locale, `https://estimador.pt/{pt,en}/#website`), `populationDatasetJsonLd(locale, release)` on `/populacao/dados` (release counts, citation and credit line from release.json), and `breadcrumbJsonLd(locale, items)` on region pages and, once the place is known, parish pages (rendered by `ParishPage`).
- The election context, selector and provider (`ElectionContext`, `ElectionSelector`, `ElectionAwareContent`, the `/eleicoes` layout) and `EditorialPage` were deleted: nothing used them.

### Chart Architecture
All chart components follow a consistent pattern:
1. **Responsive sizing**: Use `containerRef.current.offsetWidth` for dynamic width
2. **ResizeObserver**: Handle container size changes
3. **Observable Plot**: Primary charting library with D3 for data manipulation
4. **Editorial style**: paper ground, hairline dividers, cream panels with gentle radii (see Design Language)

### Football Chart Components (`src/components/charts/football/`)
- **LeagueTable.tsx** — Predicted standings with probabilities
- **MatchdayPredictions.tsx** — Next matchday probability bars
- **TitleRaceChart.tsx** — Championship probability time series
- **RelegationChart.tsx** — Relegation probability time series
- **DecisiveMatches.tsx** — Title-swinging upcoming matches
- **MarketScorecard.tsx** — model vs closing line (`/desporto/liga/modelo`); every figure, the RPS axis range, n per point, the season span and the bookmakers (`market_sources`) are read from `market_scorecard.json`
- Helpers: `src/lib/football-format.ts` (pt-PT/en-GB numbers, Lisbon dates), `src/lib/football-injuries.ts` (when an injury list is recent enough to show), `src/lib/football-scorecard.ts` (verdicts, model names, market sources, and the league table's calibration sentence from `market_scorecard.json` → `calibration`, quoted only for the model it was measured on), `src/lib/football-path-builder.ts` (the club page's scenario builder maths), `src/lib/football-status.ts` (the dated forecast line), `src/lib/football-model-evaluation.ts` (the one ±2 SE verdict source for `/modelo`; `TITLE_CALIBRATION` is a dated constant from the 2026-09 assessment, to update when it is re-run), `src/lib/season-review-provenance.ts` (published vs reconstructed forecasts on `/2025-26`), `src/lib/utils/prediction-game-record.ts` (the game's season record and the matchday-1 late-publication flag), `src/lib/utils/player-pages.ts` (`playerDataCutoffLabel`/`Sentence`: the player models' data cut-off, shown beside every SAR figure, match pages and player meta descriptions included; on `/jogadores` it is said once in the hero's meta line and again in the finishing and contribution footers, not above each list), `src/lib/utils/player-inventory.ts` (`playerInventory`, `playerInventorySentence`, `playerCutoffMeta`: what `/jogadores` ranks and what it does not, stated once in the hero, from 640px up), `src/components/charts/football/player-marks.ts` (`PLAYER_MARKS`: the player charts' bars, whiskers and caps in stone-400/900, at least 3:1, held by `player-marks.test.ts`; `BRAND.faint` is not used for a meaningful mark), `src/lib/football-next-matchday.ts` (where an `mdNN`'s `next_matchday` and the game record disagree, for `/dados`) and `src/lib/football-exploration.ts` (the simulator: `defaultObjective` opens a club on the title from 1% of title chance, `TITLE_DEFAULT_FROM`, else on relegation; the URL's goal overrides). Seasons in the copy are read, not typed: the player models' cut-off season is the last entry of `players.json` → `generated_from.seasons`, which `/sobre`'s Liga row reads (`loadLigaPlayers`, CL2-02) as the player hub and the Liga methodology do, and `meta.ligaDescription` takes `{season}` (the latest prediction's `season`, else `CURRENT_LIGA_SEASON` in `config/football.ts`). In `config/football.ts`: `teamDisplayName` (accents, e.g. Paços de Ferreira), `teamPhoneName` (narrow columns), `teamColorOnPaper` (a club colour that reads on paper), `distinctTeamColors` (lines that stay apart on one chart), `teamWithArticle(team, form)` (Portuguese copy never writes "para Porto" or "de Benfica": "para o Porto", "do Benfica", "no Casa Pia") and `OUTCOME_TONES`, the one 1X2 encoding (home dark, draw pale, away mid, on the hub cards and the match page; club colours never fill the split bar). `src/components/football/ClubFixtures.tsx` lists a club's played and remaining fixtures on its page.
- **The reader's clock**: a Liga page is exported once per forecast, so what changes with time is read in the browser. `ClockSwitch` / `useClockReached` (`src/components/football/ClockSwitch.tsx`) swap a line once an instant has passed, using `clockValue`, `roundPlayedAt`, `matchStartedLine`, `roundPlayedLine` and `forecastStatusLinePlayed` from `football-status.ts` ("Jogo começou · previsão de 25 set.", "Jornada 8 · jogada, nova previsão em preparação"). The server render, and the first client render, are always the published state; the clock is read only after mount, and re-read every minute. `football-status.ts` owns the instants, so the hub, the club pages, the simulator and the match pages turn stale together; the homepage rail (`FootballPanel`) does not call `nextRoundTiming` but repeats its round rule inline (the round in progress, else `next_matchday`, with the unplayed `game_fixtures` kickoffs) and shares only `roundPlayedAt`, `forecastStatusLine` and `forecastStatusLinePlayed`, so a change to the rule must be made in both places. The helpers: `nextRoundTiming` (used by the hub, the simulator, the club and match pages; the round the next forecast waits for: the round in progress when the forecast came out mid-round, else the next; its kickoffs, start, `playedAt`, and the postponed leftovers it also prices), `roundPlayedAt` (the last kickoff plus `ROUND_SETTLE_MS`, two hours), `kickoffSteps` / `matchPlayedLine` (a game reads "Jogo começou" at kickoff and "Jogo disputado · previsão de …" two hours later), and `forecastAsOf` ("na previsão de 25 set.", what "agora" becomes once the forecast is out of date). A postponed game ("jogo em atraso") says its new forecast comes "com a próxima atualização", never "depois da jornada".
- **Scenarios** (`src/lib/football-scenarios.ts`, behind the club scenario cards and the match page's impact panel): a rival result is part of a scenario only when it happens in at least 90% of the scenario's simulations (`RIVAL_CONDITION_MIN_SHARE`), and never when it is one of the club's own games; the final-duel bins carry a tie bar (`duelBins`), and `samplingMargin` states the simulation margin beside a share.
- **The prediction game's record** (`src/lib/utils/prediction-game-record.ts`): `frozenBeforePreviousRoundEnded` lists the rounds whose odds were frozen before the previous round's last game (2026-27: matchdays 3, 5, 6 and 7), `roundsWithoutSource` the rounds whose games carry no `probs_source`, and `roundLockAt` the instant a round closes in the game (its earliest lock); `/desporto/liga/dados` names both kinds of round and `/jogo-previsoes` the frozen ones. The dates in the files: an `mdNN.json` `timestamp` is its last regeneration, not its first publication; its `next_matchday` may differ from the game's record (md01, md03 and md04 by up to 0.2 pp in 2026-27) and may list only part of the round, which `/desporto/liga/dados` states, read from the files by `src/lib/football-next-matchday.ts`; and `game_fixtures.json` (its `published_at`, its frozen odds) is the record that counts.
- **One percentage rule** for every football figure: `formatPercent` / `formatPp` in `football-format.ts` (whole numbers from 10%, one decimal below, `<0,1%` and `>99%` at the ends so nothing non-zero reads 0% and nothing short of certain reads 100%, U+2212 for minus, pp for changes), grouped four-digit counts, and `matchLabel(home, away)` with an en dash ("Benfica – Vitória"). No `Math.round(p * 100)` in new code. Posteriors (`p_above_replacement`, `p_above_average`) go through `formatPosterior`, so 1.0 prints ">99%" and 0 "<0,1%"; `formatPercent`'s "100%" and "0%" are for exact shares of simulations only. Probability table twins (title race, relegation) list matchdays newest first, while the charts stay oldest first.
- **No probability bands** on the Liga title and relegation charts, club timelines, their table twins or the OG card (owner decision, October 2026): the published `p_champion_lo/hi` and `p_relegation_lo/hi` are the spread of 500-simulation blocks, not the model's uncertainty, and `/desporto/liga/dados` says so. The 90% final-points ranges stay. The title race carries the title-calibration caveat (`football.titleCalibrationCaveat`, read by the hub, `/modelo` and the methodology, linked to the methodology's answer); the caveat quotes only the clean values (leaders given 63% on average, champions in 82%) and says the two cases with a data error are left out, while the methodology paragraph built from `TITLE_CALIBRATION` (`titleCalibrationParagraphs`) gives the 17 clean cases first and all 19 second; both must match `TITLE_CALIBRATION`'s clean values (`cellsClean`, `modelMeanClean`, `leadersWonClean`; a test checks both texts), and "despromoção" means 17th or 18th wherever it is shown (the 16th goes to a play-off and is not counted): table footnote, relegation caption, club pages, methodology, `/dados`. The page passes the two charts a trimmed history (`probabilityHistory()`), not every prediction in full.
- Match pages (`/jogo/{slug}`) cover the fixtures to come (`loadUpcomingFixtures`, postponed leftovers still in `next_matchday_scenarios` included, with `postponed: true` and a "jogo em atraso" label) and the season's played games (`loadPlayedFixtures`: the result plus the pre-match odds, only when they were published before kickoff); played pages stay online and are in the sitemap, dated by kickoff. The slug (`{home-away}`) has no season in it, so the 2027-28 fixtures would collide with this season's pages: move them to a season-scoped address before 2027-28 (plan in `docs/football-runbook.md`).
- The methodology page renders `src/content/football-methodology/{pt,en}.mdx` (MDX plus data-bound components; the `REVISED` date lives in `metodologia/page.tsx`).
- **Provenance**: the xG behind xPts (the md files' `xpts_table`, `review.json`) is FotMob's; results, shots on target and goalkeeper xGOT are SofaScore's, closing odds Pinnacle's and Bet365's via football-data.co.uk (which provider each past season's results field carries is producer ask 5 in `docs/football-producer-asks.md`). `/desporto/liga/dados` marks the third-party fields "Fora da licença" per file (see "Licences"), and `src/lib/football-provenance.test.ts` checks that `/dados`, `/2025-26` and the methodology name FotMob for every xG they attribute. The hub's source line (`football.xgAttribution` in `messages/*.json`) still says SofaScore and is outside that test: change it to FotMob and add the two message files to the test's `FILES`.
- The published forecasts come from `bivcross` (bivariate Poisson with shots on target) since matchday 1 of 2026-27; md00 was `joint_sot`. Each md file names its model in `model`. Model codenames appear only on `/desporto/liga/dados`, never in reader-facing copy.
- Several older components in that folder (PositionHeatmap, CriticalPaths, PathsToVictory, PointsPace, MatchdayLive, ScheduleDifficulty) are imported by no page; do not build on them without checking.

### Election Chart Components (`src/components/charts/`)
- **HouseEffects.tsx**: Custom HTML/CSS matrix with no hover tooltip (an exception to the hover-tip rule above): each cell's `title` and the `<ChartTable>` twin carry the exact values; the cell colours come from `src/lib/election-heatmap.ts` (one forest ink on every cell, the red and blue ramps capped where it still reaches 4.5:1, `election-heatmap.test.ts` sweeps them)
- **CoalitionDotPlot.tsx**: the two blocs' seat totals as a dot histogram (stacked dots: `drawnSeatIndices`, every 12th model draw with its three emigration scenarios, 750 dots, about 200 on phones; never every k-th row, which drew only the 2024 scenario)
- **DistrictSummary.tsx**: ENSC methodology for contested seats; each district card shows every party above 5% (`seatChangesOf`, `SEAT_CHANGE_SHOWN`) with "+1/−1 mandato ou mais"; the third tile is "Abaixo do limiar (ENSC ≤ 0,8)", with a watch line for districts between 0,4 and 0,8 (`districtsToWatch`); `CONTESTED_ENSC` and `WATCH_ENSC` live in `election-aggregates.ts`
- **PollingChart.tsx**: takes a columnar `TrendSeries` (`compactTrendSeries` in `election-aggregates.ts`) instead of long rows, so the page payload stays small
- **Numbers** (`src/lib/election-display.ts`): election probabilities print "menos de 1%" / "mais de 99%" ("under 1%" / "over 99%") everywhere, tables and twins included, never "<1%" or 0% and 100% (`formatElectionProbability`, `electionProbabilityParts` for a headline figure); counts group from four digits (`formatElectionNumber` uses `useGrouping: 'always'`: "9 000" with a no-break space in Portuguese, like `formatInteger` and `formatCount`), and the methodology MDX writes its counts the same way by hand ("9 000", "8 000", "1 000"). Dates: `formatElectionDate` for table columns ("09/01/2026", dd/mm/aaaa so the column lines up; "9 Jan 2026"), `formatElectionShortDate` for chart ticks and tips ("6 fev. 2026"), `formatElectionLongDate` for readouts and footers. `PARLIAMENTARY_PARTY_ORDER` (AD PS CH IL L CDU BE PAN) and `sortByPartyOrder` are the archive's one party order, so the left bloc reads PS + L + CDU + BE (`src/lib/config/blocs.ts` still lists it PS, BE, CDU, L: sort it before showing it). `PRESSED_IN_FORCED_COLORS` is the pressed state in forced colours for the round toggle and the party and candidate pills.
- **Sections with one chart**: an h2 question, then the `<DataCard>`, whose subtitle carries the explanation; no grey lede between them. Election heroes on phones crop the painting with `object-fit: cover` at `center 32%`.
- The election methodology is its own page, `/eleicoes/metodologia` (`src/content/methodology/eleicoes/{pt,en}.mdx`, dated). Every h2 and h3 there and on `/economia/metodologia` gets a slug id (`headingSlug`, `headingText` in `src/lib/election-methodology.ts`), so keep heading texts unique; charts deep-link through `ELECTION_METHOD_ANCHORS` and `electionMethodHref(section, locale)`, and `election-methodology.test.ts` keeps the anchors and the MDX in step; `src/content/methodology/{pt,en}.mdx` is a short note that keeps the old `/metodologia#eleicoes` and `#segunda-volta-2026` anchors working.

## Azure Static Web Apps Configuration

### staticwebapp.config.json
- 301 redirects: old URLs, locale-less section paths and the bare root (see "Route Structure")
- Rewrites: `/{locale}/populacao/freguesia/*` to the parish shell, after two exact rules that serve the shell's own RSC payload (`/{pt,en}/populacao/freguesia/_/index.txt`) as itself rather than as the shell's HTML; `/pt/populacao/v/*` and `/en/populacao/v/*` to each locale's consultation page, and the locale-less `/populacao/v/*` (the producer's `canonical_path`) to the Portuguese one
- Cache headers: `/api/*` (the prediction game's functions) `no-store`; `/_next/static/*` and the hashed `og-image-*-{hash}.png` cards immutable for a year, except the names matched first by exact routes, which revalidate (`max-age=0, must-revalidate`): the unversioned `og-image-{pt,en}.png` and every retained card name (see the OG paragraph below), whose routes `scripts/generate-og-images.mjs` writes just ahead of the `/og-image-*.png` wildcard; `/favicon.ico` a day; `/data/population/v*` immutable (a release never changes, its `manifest.json` included; there is no rule for anything else under `/data/population`, and `host-config.test.ts` keeps it that way); `/data/population-geography/*` a day; `/images/*`, `/brand/*`, `/branding/*` a week with stale-while-revalidate; everything else `max-age=0, must-revalidate`
- MIME types for `.json`, `.txt` (RSC payloads), `.wasm`, `.parquet`, `.xml`, `.avif`
- 404s rewrite to `/404.html`; there is no navigation fallback
- Bare `"statusCode": 404` rules for the pages the export must write but nobody should reach: `/{pt,en}/artigos/sem-artigos/` and `/{pt,en}/artigos/tema/sem-temas/` (placeholders while nothing is published) and `/404/`. `scripts/smoke-check.mjs` reads these rules, probes each for a 404 and leaves them out of its 200 walk.
- OG cards are served immutable, so `scripts/generate-og-images.mjs` never deletes one production still serves: it fetches the live `og-manifest.json` (offline, the committed manifest's `retained` list) and keeps those names. With the live manifest only production's cards are retained (cards a branch generated and never deployed are not). Every retained name is rewritten as a stand-in, a copy of the current card of its kind and locale (the brand card for the general card and, while the section is in preparation, the economy cards), not only the names it no longer has, and is served `max-age=0, must-revalidate` through the exact routes the script writes into `staticwebapp.config.json`; anything else unclaimed is pruned. So `npm run og` (and the CI `prebuild`) edits the host config too: commit the regenerated manifest, the cards and `staticwebapp.config.json` together, and never delete a file named in `retained`. `manifest.size` records the rendered size for `getOgImageSize()`, and `manifest.alt` the text of each card, which `getOgImageAlt()` uses for `og:image:alt`. Owner call (FRESH-V4, October 2026): retained names get revalidating stand-ins rather than a frozen copy of production's bytes, because production's general card carries the retired descriptor and its economy cards carry July's figures; a cache that already holds one under the old immutable header keeps it, and no deploy can reach it.

## Development Workflow

### Git Branch Strategy
**DEFAULT WORKFLOW**: Use feature branches for development.

**DIRECT TO MAIN**: Allowed for small fixes, docs, config tweaks.

```bash
git checkout -b feature/your-feature-name
# Work on changes...
git push -u origin feature/your-feature-name
gh pr create --title "Feature: Your feature name" --body "Description"
```

### Adding a New Section

1. **Define section** in `src/lib/config/sections.ts`
2. **Create types** in `src/types/{section}.ts`
3. **Create config** in `src/lib/config/{section}.ts` (colors, names)
4. **Create data loader** in `src/lib/utils/{section}-data-loader.ts`
5. **Create chart components** in `src/components/charts/{section}/`
6. **Create route** at `src/app/[locale]/{slug}/page.tsx`
7. **Add i18n keys** to `messages/pt.json` and `messages/en.json`
8. **Add data files** to `public/data/{section}/`
9. **Update the navigation** in `src/components/brand/site-navigation.ts` (header and 404) and the footer in `src/components/SiteFooter.tsx`
10. **Update sitemap** in `src/app/sitemap.ts`
11. **Add routes** to `staticwebapp.config.json`
12. **Update sync script** `scripts/sync-data.sh`

### Publishing Written Analysis

`/artigos/` carries two registers, distinguished by `kind` in the MDX metadata:

- **`nota`** — dated ad-hoc analysis. Listed newest-first under "Notas", date shown first.
- **`explicador`** — evergreen reference pieces. Listed separately, not date-led. This is the default when `kind` is omitted.

An optional `section` files a piece under the forecast surface it is about, so
it appears there and not only in the feed:

- Values are the section registry's own types — `football`, `elections`,
  `economics`, `demographics` (`SectionConfig['type']`, imported by the loader).
  Anything else throws at parse time. Omit it for a piece about the site itself.
  `npm run note` does not scaffold it yet: add the line to the header by hand.
- `getArticlesBySection(section, locale)` returns that section's pieces,
  newest first, with the same draft filtering as every other listing.
- `<SectionNotes>` renders them at the end of `/desporto/liga`, `/economia`,
  `/eleicoes/presidenciais` and `/eleicoes/legislativas`, and renders nothing
  when the section has published nothing. The four pages share no layout, so it
  takes `className` (the block's frame) and `containerClassName` (the page's
  width and padding) from the page it is mounted on.

Scaffold one rather than hand-writing the metadata block (the loader parses it
as strict JSON and a malformed header fails the production build):

```bash
npm run note -- "Onde o modelo errou na jornada 5" --tags "Liga Portugal,Modelo"
npm run note -- "How to read a poll" --locale en --kind explicador
```

It scaffolds `"draft": true` and a `TODO:` excerpt, so the file can be
committed half-written. A draft:

- renders under `npm run dev`, at its real URL, so it can be written and previewed;
- appears in no listing the production build emits — the `/artigos` index, both
  RSS feeds, the sitemap and `generateStaticParams`. The filtering lives in
  `getMDXArticlesByLocale` / `getArticlesByKind` (keyed off `NODE_ENV`), so no
  page has to guard against it;
- is exempt from the `TODO` placeholder test. A published piece is not.

The metadata header is still parsed and validated for a draft — what a draft
may leave unfinished is the prose. Publish by deleting `"draft": true` and
replacing the excerpt.

Inside a piece, `<Figure>` (caption, source, as-of) and `<Callout kind="context|caveat|method">`
are available, alongside the election chart components (`CoalitionDotPlot`, `PollingChart`,
`SeatChart`, `HouseEffects`, `DistrictSummary`), which take inline data:

```mdx
<Figure caption="…" source="Fonte: CNE" asOf="2026-09-08">
  <SeatChart data={[{ party: "PS", seats: 78 }]} />
</Figure>
```

The chart components reach MDX only through the article page: they are `ARTICLE_CHARTS`
(`src/components/mdx/article-charts.ts`), which `artigos/[slug]/page.tsx` passes as
`getMDXComponents(ARTICLE_CHARTS)`. `src/mdx-components.tsx` does not import them, so the
prose pages (about, privacy, the methodologies) do not load Observable Plot or d3 (SP2-01);
a chart a piece needs goes into that list, never into `mdx-components.tsx`.

Optional `updated: "YYYY-MM-DD"` renders an "atualizado a" line and sets `modifiedTime`.

**Until a locale publishes:** the chrome offers articles only once that locale has at
least one published piece (`getMDXArticlesByLocale(locale).length > 0`; in the client
Header, `useHasArticles` from `src/lib/article-navigation.tsx`). Before that the header
nav item, the footer's articles link and RSS link, and the `/artigos` hero's RSS link are
hidden; `/artigos` and `/artigos/tema` render an empty state (`<EmptyStateMark>`, next step), are
noindex, carry no Blog JSON-LD and are left out of the sitemap. The feed routes keep
working and the `rel=alternate` feed link stays in every page's head.

**Feeds:** `/pt/feed.xml` and `/en/feed.xml` are generated by
`src/app/[locale]/feed.xml/route.ts`; every page advertises its locale feed via
`createPageMetadata`. `/feed.xml` redirects to the Portuguese one.

**Email:** the subscribe card reads `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` (a
`NEWSLETTER_ENDPOINT` GitHub secret in CI). Unset, it renders the feed link
only and no email field. The privacy page (`src/content/privacy/{pt,en}.mdx`) names
Buttondown as the processor; keep that section true to what the card actually does.

### Data Updates
- **Football**: Run `./scripts/sync-data.sh football` to copy from `~/code/estimador-football/output/`; it also copies `game_fixtures.json` to `api/data/` (the game server's copy, which `validate-data` requires to be byte-identical) and drops the model's `cards.json`, which is not a published feed. After a round's last game, sync and deploy the next `mdNN` within 24 hours: the reader's clock (`ClockSwitch`) covers the gap on the pages, but the static meta descriptions of that round's match pages keep the pre-match odds until the rebuild. Dates and the season's other chores: `docs/football-runbook.md`; asks for the model repository: `docs/football-producer-asks.md`
- **Elections**: Manually update JSON files in `public/data/elections/`
- **Economics**: Run `./scripts/sync-data.sh economics` to copy `dashboard_latest.json` (and `stories_latest.json`) from `~/code/estimador-economics/output/`. Not part of `all`, and a no-op until `economy-status.json` says `published: true`: publishing is the flag, not the sync.

### Ecosystem Architecture
All data acquisition is centralized in `estimador-data`. Model repos (`estimador-football`, `estimador-elections`, `estimador-economics`, `estimador-microsynthesis`) are pure modeling — they consume data from `estimador-data`, run models, and output JSONs that `estimador-web` displays.

### Portuguese Electoral Context
- **Parties**: AD (center-right), PS (center-left), CH (right), IL (liberal), BE (left), CDU (communist), L (green), PAN (animal rights)
- **System**: Proportional representation using D'Hondt method across multiple districts

### Liga Portugal Context
- **18 teams** in Primeira Liga
- **Bayesian model**: Attack/defense parameters, squad value priors, home advantage
- **Data**: Matchday predictions (md*.json) + scenarios (md*_scenarios.json)
- **Key metrics**: p_champion, p_top3, p_relegation, title_swing, win_uplift
