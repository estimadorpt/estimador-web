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
header (Início, População, Desporto, Eleições, Economia · em preparação, Sobre), the footer's
"Secções", the homepage shortcuts, `/sobre`'s status list, `/metodologia` and the descriptor.

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
```

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
/desporto/liga/                    → Liga Portugal forecast (+ /jogadores, /simulador, /jogo-previsoes, /{club}, /jogo/{slug}, /jogador/{slug})
/desporto/liga/metodologia/        → Liga Portugal methodology
/economia/                         → Economy (in preparation; noindex while unpublished)
/economia/metodologia/             → Economy methodology
/eleicoes/arquivo/                 → How to read the archived election forecasts
/eleicoes/presidenciais/           → Presidential 2026 forecast (archive)
/eleicoes/legislativas/            → Parliamentary 2025 forecast (archive)
/eleicoes/legislativas/mapa/       → District map (parliamentary 2025)
/artigos/                          → Articles (hidden from the chrome until a locale publishes one)
/sobre/                            → About (mission, author, one status list per section)
/metodologia/                      → Methodology hub: short, dated, links each section's method
/eleicoes/metodologia/             → Election methodology (archive)
/privacidade/                      → Privacy
/marca/                            → Brand guide (noindex)
```

`staticwebapp.config.json` answers with a 301 for the old URLs (`/forecast`, `/about`,
`/methodology`, `/map`, `/articles`, `/feed.xml`), for each section path typed without a
locale (`/economia` → `/pt/economia/`, `/desporto/liga`, `/eleicoes/…`, `/sobre`,
`/artigos`, `/metodologia`, `/privacidade`, `/populacao`), and for `/{pt,en}/desporto` →
liga and `/{pt,en}/eleicoes` → arquivo. SWA redirects cannot reuse a wildcard capture, so
a new top-level section needs its own line; `scripts/smoke-check.mjs` checks every
redirect in the file.

## Architecture

## Design Language

The site's identity is the interval mark and the atlas palette. Everything lives in `src/app/globals.css` (tokens), `src/lib/brand/index.ts` (mark paths and hex values for SVG and canvas code) and `src/components/Logo.tsx`; the living guide, with downloadable files, is `/marca` (`src/app/[locale]/marca/page.tsx`, not indexed).

- **Mark**: a credible interval drawn as one path in one colour. `<Mark>` from 24px up, `<MarkSmall>` below; `<LogoHorizontal>` is the only signature (Manrope 800 wordmark, no serif or stacked version). Pine on light, paper on dark. Never a coloured band, never inside a chart. Assets in `public/brand/`; regenerate them with the brand script in the session scratchpad or by hand from `src/lib/brand`.
- **Surfaces**: `bg-paper` (page ground), `bg-cream` (cards, panels, table rows), `bg-parchment` (sunken areas, hovers), `border-line` (hairlines). Dark surfaces use `bg-forest`.
- **Ink**: `text-ink` for text and primary actions, `text-stone-500` for secondary text. Links are ink with an underline, never blue.
- **Pastels in two strengths**: data (`mint`, `mustard`, `coral`, `periwinkle`) for chart categoricals and the atlas's people; surface (`mint-soft`, `mustard-soft`, `coral-soft`, `periwinkle-soft`) for the mosaic, covers and backgrounds. Neither does the other's job. Party and team colours stay as they are; gold/amber means "caveat", never emphasis.
- **Retuned Tailwind ramps**: `stone`, `amber`/`yellow`, `emerald`/`green`, `red` and `blue` are redefined in `@theme`, so existing utilities keep their meaning but sit on paper. Do not use `gray`, `slate` or `bg-white`.
- **Type**: one family, Manrope (`--font-sans`, `--font-display`): h1 800, h2/h3 700, text 400/500, uppercase kickers 700, headline numbers `font-display font-extrabold tabular-nums`. Newsreader (`--font-serif`) is the reading face and appears only inside `.article-body` (articles, methodology, about, privacy). No italics as decoration. Nothing below 11px. Both faces are self-hosted (`src/app/fonts.ts`): Manrope from `@fontsource/manrope` (it keeps the family name `Manrope`, which Plot, SVG and canvas code name directly), Newsreader through `next/font/google`, downloaded at build time and served from `/_next/static`; no page view contacts a font host.
- **Mosaic** (`src/components/brand/Mosaic.tsx`): quarter-circles are shares, circles people, dot grids populations, rounded blocks places; bands stay in the mark. Allowed on brand and explainer covers, hero art of pages without data (`<PageHero art>`), empty states, the 404 and avatars. Never beside a club or party number, never encoding information.
- **Motion**: the interval opens on hover of a `.brand-link`; `<MarkLoading>` only where something is genuinely loading. Both stop under prefers-reduced-motion. A published forecast never animates.
- **Three levels of expression** (docs/design/design-system-proposal.md): entrances, explainers and empty states are the most playful (a soft field, a mosaic, one invitation); dashboards and forecasts are restrained (a compact tinted introduction via `<PageHero field>`, then cream tables and plots, decoration outside the plotting areas); articles and methodology are editorial. One colour field per page at most. Owner exception (October 2026): the Liga hub (`/desporto/liga`), `/eleicoes/legislativas` and `/eleicoes/presidenciais` keep their raster section illustration in the hero (`<PageHero illustration>`, `SectionIllustration`) instead of the tinted field. Because that image is the page's largest paint, it must load eagerly (`priority` / `fetchPriority="high"`), with a narrow (about 360px) variant for phones where the asset pipeline makes one cheap; no other forecast page gets a raster hero.
- **Primitives**: actions are `<Action>` (`src/components/brand/Action.tsx`: primary pine, secondary bordered cream, tint, text; 48px, 10px corners, one main action per view); keyboard focus is the global double ring in globals.css, so components do not declare their own; inputs and selectors are 44 to 48px with a visible label; cards use `rounded-2xl`, a thin border and no shadow; motion is 140 to 200ms feedback and 200 to 300ms panels. `<TeaserBand>` is the explainer teaser that follows a dashboard's data. Empty states get a small mosaic and a specific next step, and missing data is never shown as zero.
- **Visualisations** (`src/components/viz`, showcased as section 08 of `/marca`): `<DataCard>` (title, source, date, methodology link) frames every chart; `<StatTile>`/`<KpiRow>` for headline numbers with optional sparkline and delta; `<TrendChart>` (2px line, 80% band wash, dashed projected segment, end labels, crosshair tip); `<ColumnChart>` (24px caps, one highlighted column); `<RankedBars>`; `<OutcomeBar>` for 1X2; `<PeopleGrid>` (100 dots); `<Segmented>` filters; `<Legend>`; `<ChartTable>` (the table twin every chart carries). Series colours live in `theme.ts` (`SERIES`/`SERIES_DARK`, mirrored as `--color-series-1..4` and `--color-series-dark-1..4` tokens): fixed order teal, gold, periwinkle, coral; never cycled, never on text, at most four (the fifth folds into "other"). `STATUS` colours are reserved for state and always ship with an icon and a word. Team and party colours keep their own maps. The data pastels are for the atlas's people and categorical fills, not for line series. Chart text is Manrope (`FURNITURE.font`), never Inter. The same contract applies to the older Plot and SVG charts: the title race, relegation, team timeline, polling, seat, coalition, presidential trend and head-to-head charts and the economy sparklines carry a `<ChartTable>` twin and a hover tip, so a new chart must too. A table twin is a complete alternative: every point the chart draws at the chart's own resolution, with its bands or quantiles in their own columns, in the page's number format; long tables scroll inside the disclosure. Nothing in an SVG is below 11px.
- **Chrome**: every page opens with `<PageHero>` and closes with `<SiteFooter locale={locale} />`. OG cards come from `scripts/lib/og-cards.mjs` (Manrope via `@fontsource/manrope`; the mosaic only on the brand card and explainer covers).
- **Communications**: one line ("Dados para compreender Portugal."), one descriptor ("Dados e modelos sobre Portugal, com a incerteza à vista: quem vive em cada freguesia, como pode acabar a Liga e o que diziam as previsões eleitorais.", owner decision of 6 October 2026: live sections first, no "previsões" for everything) and two bios (pt, en; same order), written once in `src/lib/brand/descriptor.json` (`src/lib/brand/descriptor.ts` for the app) and read by `meta.defaultDescription`, the homepage's identity line (the page's h1 is the line, the descriptor follows), the footer blurb, the feed description, the OG brand card (`scripts/generate-og-images.mjs`), the social kit and the README; `descriptor.test.ts` fails on a retyped copy. The brand notes live in `docs/brand/` (`social-kit.md`, `section-illustrations.md`). `npm run brand` regenerates every logo, icon and social asset (`scripts/generate-brand-identity.mjs` + `scripts/generate-social-kit.mjs`, outputs under `public/brand`, `public/branding`, `public/images/brand`); the Liga matchday card is `scripts/generate-social-images.mjs`. Voice: sentence case, questions as headings, uncertainty stated with interval, date and source, one action per piece, no emoji or exclamation marks. Portuguese copy addresses the reader as **tu** ("Escolhe a tua equipa", "Explora", "Segue o feed"), never você, including meta descriptions and buttons; English is en-GB. Page titles go through `siteTitle()` (`src/lib/site-title.ts`, re-exported by `src/lib/metadata.ts`; `createPageMetadata` applies it), which appends the one suffix " | estimador.pt": pass a bare, sentence-case title and never type a suffix, in code or in `meta.*` messages. The `.pt` of the signature is `BRAND.muted`, never `BRAND.faint`. The kit and the voice rules are on `/marca`.

## Homepage

Four subjects, one hierarchy (`src/app/[locale]/page.tsx`, panels in `src/components/home/`). The page opens by saying what the site is: a compact identity block whose h1 is the brand line (`brandLine`), followed by the descriptor (`brandDescriptor`) and a "Sobre o projeto" link; every panel title is an h2, in election mode too. Below 1024px, where the nav sits behind the menu button, a labelled row of shortcuts ("Atalhos": A minha freguesia → `/populacao`, O meu clube, Eleições) follows it, each with its status (release version, last matchday, "Arquivo"); the economy has no shortcut while it is in preparation. Standard mode leads with the synthetic population (2fr: parish search, today's Freguesia misteriosa), football is the rail (1fr), economy and elections support in a second row; below 1100px the rows stack. The hierarchy is an editorial setting in `src/lib/config/homepage.ts`: set `HOMEPAGE` to `{ mode: 'election', election: '<id from elections.ts>' }` and rebuild to lead with an election; an id without published data falls back to the standard layout with a build-log warning, and a past election is labelled an archived forecast, never live. Preview without editing: `HOMEPAGE_MODE=election HOMEPAGE_ELECTION=presidential-2026 npm run build`. Every number on the page comes from the loaders (`loadPopulationMeta` counts, `loadLigaSummary` + `loadLigaWithDeltas`, `loadEconomyDashboard` behind `economyState` — the editorial flag, then the pause rule — the election loaders in election mode only); the economy stays in the support row in both modes while it is in preparation (a test pins this); the copy lives under `home` in `messages/*.json`. Illustrations are the four masters in `docs/design/homepage-claude-handoff/assets`; `node scripts/generate-home-art.mjs` writes their AVIF/WebP sizes to `public/images/home` and `<HomeArt>` picks between them. `HomeMiniature` (the village hero) is no longer on the homepage but stays available.

## Economy section

In preparation. One editorial flag, `src/lib/config/economy-status.json`
(`{ "published": false }`), read by `src/lib/config/economy-status.ts` (`ECONOMY_PUBLISHED`,
`economyState(asOf)` → `preparing` | `paused` | `live`) and by
`scripts/generate-og-images.mjs`. Data age never publishes the section; it can only pause
a published one (the 20-business-day guard in `economy-time.ts`). While the flag is off:

- `/economia` is the explainer ("Compreender a economia", status "Em preparação · sem
  números publicados", no number, no date, no promise of a return) and
  `/economia/metodologia` opens with a dated in-preparation notice; both are noindex and
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
v1.0.3 superseded v1.0.0, v1.0.1 and v1.0.2, all of the same day (doc 206 §5–§7; v1.0.2
was never served nor released on GitHub). The generated population is v1.0.0's
throughout. Every parish answers every question with its own numbers and its measured
tier (A 776 / B 705 / C 1,611), no cell is suppressed, a category with no one in it shows
"0,0%" (8,723 of them), and the game deck holds all 3,092 parishes with v1.0.1's calendar
(day 0 = 030857). Household size, household type, "who lives alone" and "elders alone"
(like multigenerational) count private households only (`is_institutional = 0`); the
producer writes pt-PT display values ("18,0%") and `formatDisplay` sets the decimal mark
per locale. The package's `nuts2` is NUTS-2013 from v1.0.3 and its município names are
INE 2021's; the site keeps CAOP 2021 names. The history sentence lives once, in
`SUPERSEDED` (`src/components/population/quality/copy.ts`). The quality page quotes the
scorecard's `band_reading` and band notes (`band-reading.ts`) and never renders `in_band`
or `coverage_in_band`. Tiers are reading guides, not gates.

- **Routes** (`src/app/[locale]/populacao/`): hub `/populacao`, parish pages
  `/populacao/freguesia/{CODE}` (6-char DICOFRE, e.g. `0302FA`), regions
  `/populacao/regiao/{slug}` (`regionSlug`), `/misteriosa` (daily game), `/qualidade`,
  `/dados`, `/metodologia`, shared query links `/populacao/v/{release}/q/{id}` (served
  by `/populacao/consulta`), and `/miniatura` (an imagined explainer with invented
  people, noindex, not the release).
- **Data**: `./scripts/sync-data.sh population` (`scripts/sync-population.py`) writes
  `public/data/population/v{release}/` (meta, places, parish/<code>, national, game,
  q, scorecard, release). Server code reads it through
  `src/lib/utils/population-data-loader.ts`, browser code through
  `src/lib/population/client.ts`. To bump: re-sync, change `POPULATION_RELEASE` (config and
  `scripts/validate-data.mjs`), the asset sizes in `POPULATION_DOWNLOADS` (tested against
  release.json), `SUPERSEDED` if the history changes, and rerun `npm run og`.
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
  every `/{locale}/populacao/freguesia/*` to it and `/populacao/v/*` to the consultation
  page. The client reads the code from `window.location.pathname` after mount; the shell
  emits no canonical or noindex in its static HTML (title, canonical and, for an unknown
  code, noindex are set client-side). Never `useSearchParams`.
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
  and keeps a missing parish file a 404.
- **OG card**: `node scripts/generate-og-images.mjs` writes `/populacao`'s card from the
  newest `meta.json` (parish, person and household counts, the release's own honesty
  line); rerun it after a release bump.

- **Formats**: `src/lib/population/format.ts` (`formatCount`) is the one count formatter for every INE and release count, the homepage panel included ("3 092" with a no-break space in Portuguese, where Intl's pt-PT leaves four digits ungrouped). Each page states the parish's quality tier once, in the hero; cards carry no repeated status line.

### Data Organization
```
public/data/
  economics/
    dashboard.json              # Economy dashboard feed (unpublished while in preparation)
    stories.json                # Economy data stories (optional)
  elections/
    presidential-2026/          # Presidential archive: 16 files the pages read
    parliamentary-2025/         # Parliamentary archive: 5 files the pages read
  football/
    liga-2026-27/               # Current season: md*.json + md*_scenarios.json, players, game fixtures, injuries
    liga-2025-26/               # Last season: matchday files + review.json (archive)
    liga2-2026-27/              # Liga 2 (page noindex)
  population/v{release}/        # Synthetic population release (see "Population section")
  population-geography/         # Country, municipality and parish geometry
data/build-only/elections/      # Raw simulation draws read only at build time, never exported:
  presidential-2026/second_round_trajectories.json   (8.6 MB, 8000 runoff trajectories)
  parliamentary-2025/seat_forecast_simulations.json  (9000 seat draws)
```

Election pages pass no raw draws to the browser: `loadBuildOnlyJson` (in `data-loader.ts`)
reads the two build-only files and `src/lib/election-aggregates.ts` reduces them on the
server (every quantile from all draws, an evenly spaced 800-draw subsample for the dots).
`SecondRoundArchive` (server) renders the runoff half of the presidential archive from
those summaries. `validate-data` checks the build-only files where they are and fails if
either reappears under `public/data`.

### Data Flow
- **Static Data**: Lives in `public/data/{section}/{subsection}/` as JSON files
- **Data Loaders**: `src/lib/utils/data-loader.ts` (elections, economy), `src/lib/utils/football-data-loader.ts` (football), `src/lib/utils/population-data-loader.ts` (population)
- **Chart Components**: Observable Plot + D3 in `src/components/charts/` (elections) and `src/components/charts/football/` (football)
- **Section Config**: `src/lib/config/sections.ts` — the section registry; today it only types an article's `section`. Navigation is hand-written in `Header.tsx` and `SiteFooter.tsx`, the homepage in `src/app/[locale]/page.tsx`.

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
- Every page has exactly one `<main id="main-content" tabIndex={-1}>`, opened before `<PageHero>` so the hero is inside it; the header's skip link targets `#main-content`. Put page width on an inner wrapper, not on `<main>`. `src/lib/landmarks.test.ts` enforces this.
- Metadata: `languageAlternates` adds `x-default` (the pt URL, or the only locale a page exists in); the RSS autodiscovery link is emitted only once that locale has a published article (`feedAlternates`), the same rule as the nav, footer and sitemap. The parish shell builds its head by hand and keeps no canonical or robots.
- Message keys: `npm run messages:unused` lists keys nothing reads, and `messages-unused.test.ts` (part of `npm run check`) keeps the count at zero and pt/en in parity. Delete a key in both locales when its last reader goes.
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
- Helpers: `src/lib/football-format.ts` (pt-PT/en-GB numbers, Lisbon dates), `src/lib/football-injuries.ts` (when an injury list is recent enough to show), `src/lib/football-scorecard.ts` (verdicts, model names, market sources, and the league table's calibration sentence from `market_scorecard.json` → `calibration`, quoted only for the model it was measured on)
- The published forecasts come from `bivcross` (bivariate Poisson with shots on target; the `x_bivcross` arm in estimador-football) since matchday 1 of 2026-27; md00 was `joint_sot`. Each md file names its model in `model`.
- Several older components in that folder (PositionHeatmap, CriticalPaths, PathsToVictory, PointsPace, MatchdayLive, ScheduleDifficulty) are imported by no page; do not build on them without checking.

### Election Chart Components (`src/components/charts/`)
- **HouseEffects.tsx**: Custom HTML/CSS matrix
- **CoalitionDotPlot.tsx**: Samples large datasets for performance
- **DistrictSummary.tsx**: ENSC methodology for contested seats
- **PollingChart.tsx**: `Plot.dodgeY` for label collision avoidance

## Azure Static Web Apps Configuration

### staticwebapp.config.json
- 301 redirects: old URLs, locale-less section paths and the bare root (see "Route Structure")
- Rewrites: `/{locale}/populacao/freguesia/*` to the parish shell, `/populacao/v/*` to the consultation page
- Cache headers: `/_next/static/*` and the hashed `og-image-*-{hash}.png` cards immutable for a year (the unversioned `og-image-{pt,en}.png` are matched first and revalidate); everything else `max-age=0, must-revalidate`
- MIME types for `.json`, `.txt` (RSC payloads), `.wasm`, `.parquet`, `.xml`, `.avif`
- 404s rewrite to `/404.html`; there is no navigation fallback
- Bare `"statusCode": 404` rules for the pages the export must write but nobody should reach: `/{pt,en}/artigos/sem-artigos/` and `/{pt,en}/artigos/tema/sem-temas/` (placeholders while nothing is published) and `/404/`. `scripts/smoke-check.mjs` reads these rules, probes each for a 404 and leaves them out of its 200 walk.
- The OG generator keeps the previous build's hashed cards one more run, because they are served immutable

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
9. **Update Header** navigation in `src/components/Header.tsx`
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
are available, alongside the election chart components, which take inline data:

```mdx
<Figure caption="…" source="Fonte: CNE" asOf="2026-09-08">
  <SeatChart data={[{ party: "PS", seats: 78 }]} />
</Figure>
```

Optional `updated: "YYYY-MM-DD"` renders an "atualizado a" line and sets `modifiedTime`.

**Until a locale publishes:** the chrome offers articles only once that locale has at
least one published piece (`getMDXArticlesByLocale(locale).length > 0`; in the client
Header, `useHasArticles` from `src/lib/article-navigation.tsx`). Before that the header
nav item, the footer's articles link and RSS link, and the `/artigos` hero's RSS link are
hidden; `/artigos` and `/artigos/tema` render an empty state (mosaic, next step), are
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
- **Football**: Run `./scripts/sync-data.sh football` to copy from `~/code/estimador-football/output/`; it also copies `game_fixtures.json` to `api/data/` (the game server's copy, which `validate-data` requires to be byte-identical) and drops the model's `cards.json`, which is not a published feed
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
