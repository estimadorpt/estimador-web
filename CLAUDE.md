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
header (Início, População, Liga Portugal, Eleições, Sobre; Economia joins only once it publishes),
the footer's "Secções", the homepage, `/sobre`'s status list, `/metodologia` and the descriptor.

**One name for football: "Liga Portugal"** (both locales) for the section wherever it is
named as a place on the site: the header item (`nav.sport`), its menu, the footer
(`nav.liga`), the 404 header, the homepage's Liga channel, `/sobre` and `/metodologia`. "Futebol"/"football" is a common noun, for prose only ("um modelo de
futebol"); never "Desporto" or "campeonato português" as the section's name. The URLs keep
`/desporto/liga`. In English write "Liga Portugal" without an article ("How could Liga
Portugal end?"); "the Liga" reads as Spain's league. The one exception is the owner's
descriptor in `src/lib/brand/descriptor.json`, quoted verbatim.

The navigation is defined once, in `src/components/brand/site-navigation.ts`
(`siteNavigation(labels, …)`: order, hrefs, labels, the `match` prefixes that light an item,
e.g. every `/desporto/*` page for Liga Portugal). The client `Header` and the static header
of the root 404 (`src/app/not-found.tsx`, native `<details>` menus, plain anchors, the same
60px bar on a 1px ink rule, the current section under a 3px ink underline) both render from it,
so they cannot drift. The client `Header`'s menus and phone sheet are native `<details>` too
(one open at a time), so they work without JavaScript; with it, React keeps `open` in state
(Escape, arrow keys, closing on outside focus or pointer, the scroll lock). `Header.tsx` reads each label with a
literal `t('…')` key (the client-messages test only sees literals);
`site-navigation.test.ts` checks the two stay in step. The Liga Portugal menu's items are
`LIGA_TABS` (`src/components/football/liga-tabs.ts`), the same list as the Liga tab row
(`LigaSectionNav`); those labels, the "(jogo semanal)" suffix and "Privacidade" are bilingual
literals, not message keys, so they need no `CLIENT_MESSAGE_KEYS` entry. The 404's header markup is
`NotFoundHeaderView` (`src/components/NotFoundHeaderView.tsx`), a client component with no
state or effects: Next puts the root not-found into every exported page's RSC payload, and
as a client view each page carries a reference and the item list instead of the whole
menu twice (about 40 KB a page). The mobile menu is a full-height sheet
(`h-[calc(100dvh-61px)]`); the language links are named "PT, Português" / "EN, English",
the current one underlined in forced colours; the logo link is "estimador.pt — página
inicial" / "estimador.pt — home".

The footer (`SiteFooter.tsx`, under a 2px ink rule) lists, under "Secções", População, Liga
Portugal and "Eleições · arquivo" (one link to `/eleicoes/arquivo`, `footer.electionsArchive`),
and Economia once it publishes; "O projeto" includes "Reutilizar e citar" (`/sobre#reutilizar`,
`footer.reuse`); its blurb is the line (semibold), the descriptor and the reading rule (the
three marks, see "Design Language"). The owner's name appears only in the footer's credit line
and on `/sobre`, never in a masthead or a share card (owner decision, 11 October 2026).

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

`scripts/patch-next.mjs` (postinstall and prebuild) fixes one Next 15.5 bug: when a link's RSC
fetch fails, Next falls back to a full load of the payload's address, so the reader lands on raw
text at `/pt/populacao/index.txt`; the patch sends that fallback to the page. `patch-next.test.ts`
fails if a Next upgrade moves the code; delete both with the move to Next 16, which fixed it.

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
/desporto/liga/                    → Liga Portugal forecast (+ /jogadores, /jogo-previsoes, /modelo, /dados, /2025-26, /{club}, /jogo/{slug}, /jogador/{slug})
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
/marca/                            → Design system: the brand and component reference (noindex)
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
(`/{pt,en}/desporto/liga/{avs,tondela}` → the 2025-26 review, `boavista` → the Liga page), and
for the retired simulator (`/{pt,en}/desporto/liga/simulador` → the Liga page of the same
language; the locale-less address → `/pt/desporto/liga/`).
SWA redirects cannot reuse a wildcard capture, so a new top-level section needs its own
line; `scripts/smoke-check.mjs` checks every redirect in the file. Deeper locale-less
addresses (a parish, a match, a player) reach `/404.html`, whose first script
(`src/lib/locale-redirect.ts`, mounted in `src/app/not-found.tsx`) replaces the address
with `/pt` + the same path, for the known section prefixes only.

## Architecture

## Design Language

**Instrumento** (owner decision of 11 October 2026, after friends called the September look
"vibed": the exploration, ranking and the chosen direction's mocks are in
`docs/design/directions-2026-10-11/`). estimador.pt reads like a measuring instrument: black ink
on white, 1px rules between instruments, findings as headlines, and one grammar of three marks
used the same way on every page. Everything lives in `src/app/globals.css` (tokens and the mark
CSS), `src/lib/brand/index.ts` (hex values and font stacks for SVG, Plot and canvas code) and
`src/components/instrument/` (the primitives). The September system (cream paper, pine ink,
Manrope, rounded cream cards, pills, letter-spaced uppercase kickers, painted section scenes, the
pastel mosaic, question headlines) is retired from every page; do not bring any of it back.
**`/marca` is the design system's reference** (`src/app/[locale]/marca/page.tsx`, noindex, its
pieces in `src/components/design-system/parts.tsx`): fourteen chapters built from the live
components, with figures from the site's own formatters and contrasts computed. Change it when
the system changes.

- **The reading rule**, printed in the homepage masthead and the footer (`<ReadingRule>`), and
  as a short key under any chart that uses the marks:
  - a **black square**: what has already happened (a club's points today, a game's result, the
    count that occurred);
  - a **yellow band between thin ink caps, with an ink median tick** (`<IntervalBand>`): the
    model's margin, a 90% interval unless the label says otherwise. `--color-signal`
    (`#ffd400`, `BRAND.signal`) means this and nothing else on the site; `--color-signal-low`
    (`#fff1b3`) is a de-emphasised band (mid-table rows);
  - a **lone tick on a short ruler** (`<NoMargin>`): one model run, no margin. Every figure from
    the synthetic population carries it (with `HONESTY.synthetic`) before the first number.
  The band's meaning never depends on the yellow (1.4:1): the ink caps, the median and the
  printed range carry it. In forced colours the band is drawn in CanvasText.
- **Mark and signature** (owner's pick, 11 October 2026): the interval mark drawn as the pages
  draw one (square caps on whiskers, a square-ended band, a median slot a little left of centre,
  `COUNTER_X`) and "estimador.pt" in IBM Plex Sans 700 with ".pt" in graphite, one colour (`#111`
  on white, white on ink). `<LogoHorizontal>` draws it from paths (`src/lib/brand/geometry.json`,
  `wordmark-paths.json`), so it never depends on the page's typeface; the OG cards, the social kit,
  and the population share card draw the same paths.
  `scripts/generate-brand-identity.mjs` writes `public/brand/estimador-logo*.svg`, the icons
  (square tiles) and the downloads from those two files (`wordmark.test.ts` holds them together):
  changing the logo is replacing the two JSON files and running `npm run brand`. Below 24px the
  small mark (`MARK_SMALL`, 32×32). `MarkLoading` cuts its travelling slot with a mask.
- **The ruler edge** (`RulerEdge`, `.ruler-edge`; owner's call, 11 October 2026): the site's one
  decoration, graduations on an ink rule aligned to the content column (a fine tick every 8px, a
  longer one every 40px, a full ink tick every 80px), always ending on a full tick
  (`.ruler-edge-fit`, CSS `round()`). The ticks point away from the content, so they never read
  as a chart's scale: in the header (and the 404's static header) they rise from the bar's bottom
  rule, on the logo's side only, ending at least 24px before the menu, so the current section's
  3px underline never meets a tick; in the footer they hang from the 2px rule. Decorative
  (`aria-hidden`), unlabelled, no yellow, hidden in forced colours, never beside a figure.
- **Surfaces and rules**: `bg-paper` (white, the page and every panel; `cream` is a legacy alias
  for it), `bg-field` (`#f4f4f4`, hovers, sunken areas; `parchment` is its alias), `border-rule`
  (`#d9d9d9`, 1px between instruments; `line` is its alias), `border-grid` (`#ececec`, table row
  hairlines and chart grids), `border-ink` for the rule under a channel head or a table head. No
  cards with backgrounds, no shadows, no radii: every `--radius-*` token is 0, so `rounded-*`
  utilities draw square corners; `rounded-full` stays for dots. Dark surfaces (`bg-forest`) are
  ink.
- **Ink**: `text-ink` (`#111`) for text and marks, `text-graphite` (`#5e5e5e`, 6.4:1) for
  secondary text and chart text, `--color-scale` (`#8a8a8a`) for minor ticks and strokes only,
  never for words. Links are ink with an underline at rest. The retuned ramps (`stone` neutral
  grey, `red`, `emerald`/`green`, `blue`, `amber`) keep their meaning on white; red and green
  as text use the 700 step; `stone-400` and up read as text (AA). `palette-contrast.test.ts`
  and `palette-tokens.test.ts` hold them. Colour otherwise belongs to the data: team and party
  colours keep their own maps (`teamColorOnPaper` reaches 3:1 on white), as swatches, bars and
  lines, never as text.
- **Type** (owner's pick of seven options, `docs/design/directions-2026-10-11/type/`, then one
  width rather than a condensed display cut): **IBM Plex Sans** for everything
  (`@fontsource-variable/ibm-plex-sans`, the weight axis). `--font-sans` is text;
  `--font-display` is the headline role, the same face today: h1 and h2 700
  (`--display-weight`), h3 600, headline figures (`.disp`, `.fig`, or `font-display
  font-extrabold tabular-nums`) and names in tables (`.name-cut`, 600). Figures are tabular in
  every `td`/`th` and `.tnum`. `FONT_STACK` and `DISPLAY_FONT_STACK` in `src/lib/brand` mirror
  the two CSS stacks for Plot, SVG and canvas; change them together. Newsreader
  (`--font-serif`) stays the reading face inside `.article-body` only. Labels are sentence case
  at 12px in graphite: no letter-spaced uppercase kickers anywhere. Nothing below 11px. Fonts
  are self-hosted; no page view contacts a font host.
- **Primitives** (`src/components/instrument/`, server-safe): `IntervalBand` (lo/md/hi on the
  cell's own scale, `now` square, `result`, `reference`, `low`), `Ruler` (the scale printed in a
  column head, same min/max as the bands below it), `ReadingRule` and the three glyphs,
  `NoMargin`, `ChannelHead` (an instrument's h2, optional serial such as "J8" or "v1.0.3", and the
  reading's date on the right, over an ink rule), `Register` (a reading's facts as a ruled
  definition list, instead of pills or middle-dot chains), `PosHist` (where a club can finish,
  1st to 18th), `ProbBar` (an ink bar on a 0–100 ruler, no grey track), `ChartTabs` ("Gráfico |
  Tabela" as CSS radio tabs). Football adds `Coupon` (`src/components/football/Coupon.tsx`: the
  games to come with Lisbon kickoff and the reader's clock, 1X2 in whole numbers with the
  likeliest set heavier and nothing boxed or filled, the club-side stake under each game) and
  `SeasonRecord` ("O que dissemos e o que aconteceu"). Actions are `<Action>` (square, 48px);
  keyboard focus is the global ring in globals.css; inputs are 44 to 48px with a visible label.
- **Findings, not questions**: a page or instrument with a result states it as the headline, in
  words people repeat, with the counts behind it in the standfirst ("O Porto ganha a Liga em
  metade das épocas simuladas" / "Em 25 335 de 50 000 épocas simuladas", from
  `src/lib/football-finding.ts`, which reads `victory_paths.n_target` when published). Questions
  stay only where the reader is asked something (the misteriosa game, a search label). The
  election archive's headings are dated findings from its own files (`src/lib/election-findings.ts`);
  the population hub, parish and trust pages, the Liga sub-pages and the methodologies use findings
  or plain statements (methodology anchors follow the new slugs; `trust-pages.test.ts`,
  `football-methodology-anchors.test.ts` and `election-methodology.test.ts` hold them). FAQ-style
  `<Disclosure>` summaries, guess-first prompts and checklists may stay questions. Stakes are stated from the playing club's side (`src/lib/football-stakes.ts`:
  "Título do Porto: 55% se ganhar, 43% se empatar, 39% se perder"; under 5 pp, "Pouco em jogo").
  Uncertainty is shown as an object (a band, a range printed beside it), not declared in hedging
  prose; dates are absolute and in Lisbon time (`formatReadingTime`: "11 out. 2026, 00:11"),
  never "hoje" or "amanhã" in a static page (the reader's clock, `ClockSwitch`, handles change).
- **No paintings, no mosaic**: the section scenes, the home art, `SectionIllustration`, `Mosaic`
  and their images are deleted; `PageHero` has no `icon`, `illustration`, `field` or `art`.
  `<EmptyStateMark>` is an instrument with no reading (a ruler and a dashed, empty band) on every
  empty, refused or error state; the 404 draws it larger (`size="lg"`).
- **One container** (`src/components/brand/Container.tsx`): the header, section tab rows, every
  `<PageHero>` and the page body share `CONTAINER_CLASS` (`mx-auto w-full max-w-7xl px-4`), so
  their left edges line up at every width. A narrower column is a `measure` inside it,
  left-aligned, never a second, narrower centred box (UXD-05).
- **Show/hide** is `<Disclosure>` (`src/components/viz/Disclosure.tsx`: a native `<details>`, 44px
  summary, a left chevron, sentence-case label): table twins (`ChartTable` uses it; new charts
  may use `ChartTabs` instead), map lists, FAQs, notes. MDX `<details>` get the same look from
  `.article-body details` in globals.css.
- **Choosing** (owner decision of 11 October 2026, after the games and interaction review;
  `/marca` §9 writes it as rules): a choice that changes what is shown in place is
  `ChoiceGroup`, or `choiceClass` + `CHOICE_GROUP_CLASS` + `<ChoiceCheck />` for markup of its
  own (`src/components/brand/Choice.tsx`: square boxes on one ink-ruled frame, the chosen one
  filled with ink and checked; `aria-pressed` on buttons, `aria-current` on links, a 2px
  outline in forced colours). An underline is for navigation only (links, the header, section
  tabs), never for "chosen". A long list (clubs) is a native select that acts on change; places
  use the search. Show more is `<Disclosure>`; an action is `<Action>` (primary, secondary,
  text; "Copiar link" secondary). A guess or a what-if is drawn hollow, never in solid ink. A
  readout sits beside its control, in a live region present from load. No multi-select filters
  on archived charts. Only the site's own models speak its uncertainty language.
- **Standalone links** are `<TextLink>` (ink, underlined, 44px). **Back links** are `<PageHero
  back={{ href, label }}>`, an arrow and the parent's own name ("← Liga Portugal", "← Distrito de
  Lisboa"), never "Voltar à …"; `kickerWithoutBack` drops the kicker segments that repeat it. The
  election archive pages open with "← Eleições" and the kicker "Arquivo · 2025" or "Arquivo · 2026".
- **Revision dates** are `<RevisedDate date="YYYY-MM-DD" />` in the PageHero's `meta` ("Revisto a 6
  de outubro de 2026"), a constant beside the page; a prose page's sitemap `lastmod` is its entry
  in `COPY_REVISED` (`src/lib/sitemap-dates.ts`; `sitemap-dates.test.ts` holds them together).
- **Numbers and ordinals** (`src/lib/typography.ts`): negatives use the minus sign U+2212
  (`MINUS`, `formatSignedNumber`, `withMinus`), in text, tables, SVG labels and chart ticks;
  football keeps `formatSigned`/`formatPp` (`football-format.ts`). Ordinals go through
  `ordinal(n, locale, gender)` ("5.º", "1.ª"; "5th"); football keeps `formatOrdinal`.
- **Chart frame**: every chart and standalone table of figures has a title, a source sentence
  (source, date, method link) and a table twin (`<ChartTable>` or `ChartTabs`); `<DataCard>`
  provides that frame (a title over an ink rule, no box or fill; `badge` is graphite text),
  `<Figure>` inside articles.
  Archived forecasts name their run ("Fonte: modelo estimador.pt, 9 000 simulações · Previsão de
  16 de maio de 2025"). A new chart without a twin is not finished.
- **Wide tables on phones**: `ChartTable` keeps its first column and header row sticky with a
  `.scroll-cue` edge shadow; another scroll area gets `tabIndex={0} role="region" aria-label` and
  `.scroll-cue`. Figure columns right-aligned, words left (`columnAlignments`). MDX tables and code
  blocks are named, focusable scroll regions (`ScrollBlocks.tsx`).
- **Phones**: tap targets at least 44px (`min-h-11`; `:where(footer, nav) li > a` and `.tap-target`
  get it from the base layer on a coarse pointer or below 640px); form controls are 16px below
  640px; `html` has `scroll-padding-top: 5rem` (no `scroll-mt-*`).
- **Visualisations** (`src/components/viz`): every Observable Plot output goes through
  `quietPlot()` before it is inserted (the title and the twin are the accessible version); chart
  text is `FURNITURE.font` (`FONT_STACK`) in `FURNITURE.axis` (graphite). Series colours
  (`SERIES` in `theme.ts`) are a fixed order of four, never cycled, never on text; team and party
  colours keep their own maps. `STATUS` colours ship with an icon and a word. A table twin is a
  complete alternative: every point at the chart's resolution, bands or quantiles in their own
  columns. Nothing in an SVG is below 11px.
- **Chrome**: every page opens with `<PageHero>` (section name in the display cut, the title, a
  lede, the meta line) and closes with `<SiteFooter locale={locale} />`. OG cards
  (`scripts/lib/og-cards.mjs`, `og-render.mjs`, satori with the static `@fontsource/ibm-plex-sans`
  files) are the page read at a glance: the outlined logo, a ChannelHead with the reading's date,
  the finding, the figures with their marks and the reading rule as the key; no owner name, no
  byline, no economy column while it is unpublished. The social kit
  (`scripts/generate-social-kit.mjs`) and the matchday post (`generate-social-images.mjs`) use the
  same pieces. The scripts keep their own copy of the club names, colours, finding, percentages
  and reading times; `src/lib/football-brand-script.test.ts` holds them to the site's.
- **Communications**: one line ("Dados para compreender Portugal."), one descriptor and two bios,
  written once in `src/lib/brand/descriptor.json` (`descriptor.ts` for the app) and read by
  `meta.defaultDescription`, the footer blurb, the feed description, the OG brand card, the social
  kit and the README; `descriptor.test.ts` fails on a retyped copy. `npm run brand` regenerates
  every logo, icon and social asset. Voice: sentence case, findings as headlines, uncertainty
  drawn and dated with its source, one action per piece, no emoji or exclamation marks.
  Portuguese copy addresses the reader as **tu**, never você; English is en-GB. Portuguese keeps
  the English tech terms PT-PT readers say ("download", "link", "checksums", "online", "email",
  "feed", "app") and never shows production jargon ("empacotamento", "bundle", "contrato",
  "pipeline", "o produtor"): the publisher is estimador.pt, so copy says "nós". Page titles go
  through `siteTitle()` (one suffix " | estimador.pt", never typed). No `twitter:creator` or
  `twitter:site` until the owner confirms the account.
- **Licences** (owner decision of 6 October 2026): estimador.pt's own data and model outputs are
  CC BY-NC 4.0: the synthetic population (every `pt-synthpop` release relabelled in place;
  `PINNED.checksums` in `scripts/sync-population.py` pins the changed files), the Liga Portugal
  open data (`/desporto/liga/dados`) and the archived election forecasts. `/sobre#reutilizar` is
  the one site-wide answer. Material from others keeps its own licence and every attribution says
  which licence covers which part: INE's Censos 2021 data and DGT's CAOP 2021 geometry stay CC BY
  4.0 (`SHORT_ATTRIBUTION` and `releaseCitation` in `src/lib/population/cite.ts`). Third-party
  football data are never relicensed: `/desporto/liga/dados` marks them "Fora da licença" per file
  (`FILE_DOCS[].thirdParty`: SofaScore results and match statistics, FotMob xG, Pinnacle and
  Bet365 odds via football-data.co.uk, Transfermarkt injuries and market values). Polls, official
  results, odds and the brand stay outside the grant too.

## Homepage

The site's live readings as instruments (`src/app/[locale]/page.tsx`, pieces in
`src/components/home/`), in the order of what is live. It opens with a masthead line: the brand
line as the page's h1 (`brandLine`, small), "Sobre o projeto", and on the right the reading rule.
Then:

- **Liga Portugal** (`LigaInstrument`, two thirds of the first row from `lg`): `ChannelHead`
  ("Liga Portugal", serial "J8", "previsão de 11 out. 2026, 00:11"), the finding as a large
  display line (`titleFinding`), a standfirst with the count of seasons (`titleSeasons`), how many
  of the round's games the forecast had seen and the biggest title move since the previous
  forecast; the clubs with a title chance on one 0–100 points ruler (title share, change, today's
  points as a square and the final-points band from `samples.json`, the place histogram); then,
  below the table at every width (two columns from `md`), relegation (17th or 18th, `ProbBar`)
  and the next five games as a `Coupon`. The container stops at 1280px, so there is never room
  beside the table: a wide screen gains margins, not columns (a 1560px side-by-side layout
  squeezed both into 134px columns on wide screens, 11 October 2026).
- **População sintética** (`PopulationPanel`, the first row's last third): `ChannelHead` with the
  release version and its own date (`home.populationStatus`, "datada de 5 de outubro de 2026"),
  the statement "As 3 092 freguesias dos Censos 2021, uma a uma" (`home.populationTitle`), the
  release counts from `meta.json` in one sentence (`home.populationText`), the no-margin sign and
  `HONESTY.synthetic` before any further figure, the parish search, today's Freguesia misteriosa
  and the open data as text links.
- **Eleições, arquivo** (`ElectionsPanel` standard variant): one dated finding per election, read
  from its own files ("António José Seguro vencia a 2.ª volta em mais de 99% das simulações";
  "A AD elegia mais deputados do que qualquer outro partido em mais de 99% das simulações", from
  the 9 000 seat draws), each with a link to its archive page.
- **Economia** appears only once it publishes (`EconomyPanel`); while it is in preparation the
  homepage says nothing about it. There are no shortcut chips, pills, paintings or status dots.

Election mode is an editorial setting in `src/lib/config/homepage.ts` (`HOMEPAGE = { mode:
'election', election: '<id>' }`; preview with `HOMEPAGE_MODE=election
HOMEPAGE_ELECTION=presidential-2026 npm run build`): the configured election's lead panel comes
first, then the same first row; an id without published data falls back to the standard layout
with a build-log warning, and a past election is labelled an archived forecast. Every number on
the page comes from the loaders; the copy lives under `home` in `messages/*.json`.

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
  no painting (`EconomyReading`), and its way on is "A leitura que faríamos da economia"
  (`economics.methodologyTitle`). The homepage's status line is "Em preparação · ainda sem
  leituras da economia publicadas" / "In preparation · no economic figures published yet"
  (`home.economyPreparingStatus`); and
  `/economia/metodologia` states its status once, as the hero's lede ("ainda não há leituras
  nem estimativas da economia publicadas… os números que mostra são de um teste interno"),
  under one kicker (the back link) and a `RevisedDate`; say "leituras", not "números", since
  the methodology does print backtest figures; both are noindex and
  out of the sitemap, and have no share card of their own (they use the brand card);
- the economy is absent from the header, the mobile menu, the footer and the homepage
  (`siteNavigation`, `SiteFooter` and the homepage read `ECONOMY_PUBLISHED`; the pages stay
  reachable by address), and `/sobre`'s status list says it is in preparation;
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
alone restores indexing, the sitemap entries, the share card, the nav and footer items and the
homepage panel.

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
in heroes and the homepage status line; `/sobre`'s row says "datada de" too); only
`/populacao/dados` also gives
GitHub's 6 October (`GITHUB_PUBLISHED`).
The release is CC BY-NC 4.0, INE's data CC BY 4.0 (see "Licences" in "Design Language"):
`/dados`, the parish page's licence row, the hub's data card, the methodology, the cite line,
the share card and the Dataset JSON-LD say so.

**`household_type` caveat (until v1.0.4).** The v1.0.3 bundle's `household_type` responses
do not match the packaged microdata: they were built from a pre-packaging nucleus count and
differ from the private-household `hh_type_top` in 844 parishes, by at most 2.2 pp (producer
ask 25 in `docs/population/producer-feedback-v1.0.0.md`). The site prints them as published,
never recomputes them, and says so wherever they appear: `RECIPE_CAVEAT.household_type` in
`labels.ts` is an ink-ruled note with a bold "Nota." on the parish card (#familias, `ResponseCard` passes
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
on the map in full ink, with a terracotta (`BRAND.terracotta`) cross beside it.

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
- **Map** (`src/components/population/map/`): the frame's height is CSS (`PopulationMap.module.css`, `--map-height`, and `min(var(--map-height), max(360px, 108cqw))` below 640px). The Azores region offers its three island groups as framings (`AZORES_GROUPS` in `src/lib/population/map/islands.ts`) and is fitted clear of the zoom controls; a tap on the sea within `TAP_REACH_PX` (22) of a small shape takes the nearest one; at country zoom a district name may be shortened (`COUNTRY_LABEL_SHORT`, `map/placement.ts`). A "Saltar o mapa e ver como lista" bypass link comes before the SVG. `regionLabel()` (`places.ts`) names the Azores "Azores" in English lists, breadcrumbs and labels. The section tab row (`SectionNav`) sits under the header, above the hero, on every population page, and wraps below `sm`; no horizontal scroll or fade. The map fills parishes by quality tier only, as ink density (A plain, B hatched, C cross-hatched; `map/tier-hatch.tsx`), never by colour or by a statistic.
- **Parish page head** (the finalist mock, `docs/design/directions-2026-10-11/instrument/final-parish-desktop.png`): the h1 is the parish's name, then "Freguesia do concelho de X. Código N.", the lone tick with `HONESTY.synthetic`, and a "Ficha desta freguesia" `Register` (INE residents, generated households, the tier and its meaning, the release, the responses). The document title is "Name, Município: população sintética" (`parish/head-text.ts`, at most 70 characters for every parish); the share card's title is the name too. Card titles are `RECIPE_COPY[*].short` statements; `QualityBadge` is words ("Nível A"), never a chip.
- **Parish page sections**: the employment card draws the 100 dots; the separate "Se fosse 100" section was removed. Each card opens with a place line (`ResponseCard`'s `place`: name, code, concelho, and INE's residents under 500), so a shared card or a screenshot still says where its figures are from; the hero's register states the tier and its meaning as visible text (once per page), and under 500 residents (the count the tier uses) a one-line note says each question counts only its own group. Card footers have fixed rows: the source line, then "Como foi feito" with the response id and copy. A guess-first card (`GuessFirstCard`) takes the guess on a 10×10 grid like `HundredPeople`: the grid starts empty, the guess is drawn as hollow squares, and "Ver o valor" (`Action`, `disabled`) stays off until the slider moves; the reveal states the value as a sentence ("Cerca de 39 em cada 100…") and how close the guess came as a word with its band ("perto, abaixo do valor publicado: a 10 pontos ou menos"; `guess-reveal.ts`, `guessVerdict` and `GUESS_BANDS` in `src/lib/population/guess.ts`), never a computed number of points (handoff §3); after it the published dots are ink. The table twin's rows come from `twin-rows.ts` (an age band where nobody lives alone becomes one row with the chart's sentence).
- **Permalinks and citing**: `responsePermalink` (`src/lib/population/permalink.ts`) builds `/populacao/v/{release}/q/{id}` (with `/en` in front for an English reader); the host rewrites it to the consultation page, whose resolver opens the response on its parish page at the card's anchor (e.g. `/pt/populacao/freguesia/010103/#vivem-sozinhas`), upper-case ids and an `/en` prefix included. The parish page replaces its address with the upper-case, trailing-slash form, and the header's language switch is a plain anchor built from that address. Every parish page ends with a "Como citar" block (`#citar`) from `src/lib/population/cite.ts` (release citation, parish citation, short attribution).
- **Miniatura** (`/populacao/miniatura`, noindex; simplified by owner decision of 11 October 2026): 100 invented people in 30 households, written by hand in `src/lib/miniatura/population.ts`, under the population tab row (Metodologia lit) and `<PageHero>` ("Uma população sintética lê-se agregado a agregado", `MINIATURA_TITLE`). One client part, `Miniature`: the scene (`Scene.tsx`, ink lines on one plain ground; `layout.ts` draws it 1000×540 or, below 640px, 400×440 with four homes to a row, inside the first phone screen) with, beside it from 1024px and under it on a phone, the three views as a `ChoiceGroup` (homes, by age, by household size: rows of the same figures), a live readout and, for a chosen home, `HouseholdInspector`. A chosen home stays highlighted in every view; figures glide between views except under reduced motion; the homes are one tab stop (roving tabindex); a touch between homes picks the nearest within 44px (`nearestHouse`, `hit-test.ts`). The rest is server-rendered (`Explainer.tsx`): table twins, the fit (`FIT`: the age groups of an invented target table, a random draw and the fitted neighbourhood), the five steps, and a real parish (`<NoMargin>`, `HONESTY.synthetic`, the search, `REAL_PARISH`). Parish pages link to it ("Um exemplo com 100 pessoas inventadas"). No landscapes, zoom, tour or postcard, and no figure from Portugal.
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
4. **Instrument style**: white ground, rules between instruments, no panels, fills or radii (see Design Language)

### Football Chart Components (`src/components/charts/football/`)
- **LeagueTable.tsx** — Predicted standings with probabilities
- **Coupon** (`src/components/football/Coupon.tsx`) — the games to come: 1X2 and each game's club-side stake (`football-stakes.ts`)
- **SeasonRecord** (`src/components/football/SeasonRecord.tsx`) — the season's pre-kickoff record against the model's ranges (`football-record.ts`)
- **TitleRaceChart.tsx** — Championship probability time series
- **RelegationChart.tsx** — Relegation probability time series
- **RivalGames** (`src/components/football/RivalGames.tsx`) — on club pages, "Outros jogos que pesam": the rival games (never the club's own) whose result moves the club's frame by 3 pp or more (`rivalGames`, `RIVAL_GAME_MIN_SWING`), and the final duel (`DueloFinal`, `duelRival`), both moved from the retired simulator
- **LigaSectionNav** (`src/components/football/LigaSectionNav.tsx`) — the Liga tab row (Previsões, Jogadores, Contra o Modelo, Modelo, Dados; `LIGA_TABS`) under the header on every Liga page; club and match pages light Previsões
- **MarketScorecard.tsx** — model vs closing line (`/desporto/liga/modelo`); every figure, the RPS axis range, n per point, the season span and the bookmakers (`market_sources`) are read from `market_scorecard.json`
- Helpers: `src/lib/football-format.ts` (pt-PT/en-GB numbers, Lisbon dates), `src/lib/football-injuries.ts` (when an injury list is recent enough to show), `src/lib/football-scorecard.ts` (verdicts, model names, market sources, and the league table's calibration sentence from `market_scorecard.json` → `calibration`, quoted only for the model it was measured on), `src/lib/football-path-builder.ts` (the club page's scenario builder maths), `src/lib/football-status.ts` (the dated forecast line), `src/lib/football-model-evaluation.ts` (the one ±2 SE verdict source for `/modelo`; `TITLE_CALIBRATION` is a dated constant from the 2026-09 assessment, to update when it is re-run), `src/lib/season-review-provenance.ts` (published vs reconstructed forecasts on `/2025-26`), `src/lib/utils/prediction-game-record.ts` (the model's frozen-odds record and the matchday-1 late-publication flag; the game itself has no server: picks stay in localStorage, `estimador:contra-o-modelo:v1`, and each game is scored in the browser from `game_fixtures.json`, "Mais perto do que o modelo em 5 de 9 jogos", the season line counting completed rounds only; see `docs/football-runbook.md`), `src/lib/utils/player-pages.ts` (`playerDataCutoffLabel`/`Sentence`, `playerFitInProgress`, `playerSeasonReach`: the player models' data cut-off, "(época 2026-27 em curso)" while that season is played, shown beside every SAR figure, match pages and player meta descriptions included; on `/jogadores` it is said once in the hero's meta line and again in the finishing and contribution footers, not above each list), `src/lib/utils/player-inventory.ts` (`playerInventory`, `playerInventorySentence`, `playerCutoffMeta`: what `/jogadores` ranks and what it does not, stated once in the hero, from 640px up), `src/components/charts/football/player-marks.ts` (`PLAYER_MARKS`: the player charts' bars and marks, at least 3:1, held by `player-marks.test.ts`; their 90% intervals are drawn as the band, `IntervalBand`; `BRAND.faint` is not used for a meaningful mark), `src/lib/football-next-matchday.ts` (where an `mdNN`'s `next_matchday` and the game record disagree, for `/dados`) and `src/lib/football-scenarios.ts` (`clubFrame`: one frame per club page, the title from 1% of title chance, `TITLE_DEFAULT_FROM`, else relegation from 1%, else none; `clubObjective`, `rivalGames`, `duelRival`). The simulator page was retired on 11 October 2026; its unique parts live on club pages. Seasons in the copy are read, not typed: the player models' cut-off season is the last entry of `players.json` → `generated_from.seasons`, which `/sobre`'s Liga row reads (`loadLigaPlayers`, CL2-02) as the player hub and the Liga methodology do, and `meta.ligaDescription` takes `{season}` (the latest prediction's `season`, else `CURRENT_LIGA_SEASON` in `config/football.ts`). In `config/football.ts`: `teamDisplayName` (accents, e.g. Paços de Ferreira), `teamPhoneName` (narrow columns), `teamColorOnPaper` (a club colour that reads on paper), `distinctTeamColors` (lines that stay apart on one chart), `teamWithArticle(team, form)` (Portuguese copy never writes "para Porto" or "de Benfica": "para o Porto", "do Benfica", "no Casa Pia") and `OUTCOME_TONES`, the 1X2 split-bar encoding (home dark, draw pale, away mid, on the match page; club colours never fill the split bar; lists of games use the `Coupon`'s figures instead). `src/components/football/ClubFixtures.tsx` lists a club's played and remaining fixtures on its page.
- **The reader's clock**: a Liga page is exported once per forecast, so what changes with time is read in the browser. `ClockSwitch` / `useClockReached` (`src/components/football/ClockSwitch.tsx`) swap a line once an instant has passed, using `clockValue`, `roundPlayedAt`, `matchStartedLine`, `roundPlayedLine` and `forecastStatusLinePlayed` from `football-status.ts` ("Jogo começou · previsão de 25 set.", "Jornada 8 jogada, nova previsão em preparação"). Every Liga hero's status comes from one helper, `forecastStatus` ("Previsão de 11 out., com 7 dos 9 jogos da jornada 8 disputados · …"), with one vocabulary for a forecast published mid-round. The server render, and the first client render, are always the published state; the clock is read only after mount, and re-read every minute. `football-status.ts` owns the instants, so the hub, the club pages and the match pages turn stale together; the homepage's Liga instrument (`LigaInstrument`) states the forecast's own date and time and lets its `Coupon` rows turn with `kickoffSteps`, so it holds no round rule of its own. The helpers: `nextRoundTiming` (used by the hub, the club and match pages; the round the next forecast waits for: the round in progress when the forecast came out mid-round, else the next; its kickoffs, start, `playedAt`, and the postponed leftovers it also prices), `roundPlayedAt` (the last kickoff plus `ROUND_SETTLE_MS`, two hours), `kickoffSteps` / `matchPlayedLine` (a game reads "Jogo começou" at kickoff and "Jogo disputado · previsão de …" two hours later), and `forecastAsOf` ("na previsão de 25 set.", what "agora" becomes once the forecast is out of date). A postponed game ("jogo em atraso") says its new forecast comes "com a próxima atualização", never "depois da jornada".
- **Scenarios** (`src/lib/football-scenarios.ts`, behind the club page's scenario builder, "Outros jogos que pesam" and final duel, and the match page's impact panel): each club page keeps one frame (`clubFrame`: title or relegation, never "permanência" for the same thing); the rival list uses that frame and a 3 pp floor (`RIVAL_GAME_MIN_SWING`) and never the club's own games; the builder marks the decisive games itself (or says none stands out); the impact panel draws its what-ifs hollow; the final-duel bins carry a tie bar (`duelBins`), and `samplingMargin` states the simulation margin, in one plain sentence, beside a share.
- **The prediction game's record** (`src/lib/utils/prediction-game-record.ts`): `frozenBeforePreviousRoundEnded` lists the rounds whose odds were frozen before the previous round's last game (2026-27: matchdays 3, 5, 6 and 7), `roundsWithoutSource` the rounds whose games carry no `probs_source`, and `roundLockAt` the instant a round closes in the game (its earliest lock); `/desporto/liga/dados` names both kinds of round and `/jogo-previsoes` the frozen ones. The dates in the files: an `mdNN.json` `timestamp` is its last regeneration, not its first publication; its `next_matchday` may differ from the game's record (md01, md03 and md04 by up to 0.2 pp in 2026-27) and may list only part of the round, which `/desporto/liga/dados` states, read from the files by `src/lib/football-next-matchday.ts`; and `game_fixtures.json` (its `published_at`, its frozen odds) is the record that counts.
- **One percentage rule** for every football figure: `formatPercent` / `formatPp` in `football-format.ts` (whole numbers from 10%, one decimal below, `<0,1%` and `>99%` at the ends so nothing non-zero reads 0% and nothing short of certain reads 100%, U+2212 for minus, pp for changes), grouped four-digit counts, and `matchLabel(home, away)` with an en dash ("Benfica – Vitória"). No `Math.round(p * 100)` in new code. Posteriors (`p_above_replacement`, `p_above_average`) go through `formatPosterior`, so 1.0 prints ">99%" and 0 "<0,1%"; `formatPercent`'s "100%" and "0%" are for exact shares of simulations only. Probability table twins (title race, relegation) list matchdays newest first, while the charts stay oldest first.
- **No probability bands** on the Liga title and relegation charts, club timelines, their table twins or the OG card (owner decision, October 2026): the published `p_champion_lo/hi` and `p_relegation_lo/hi` are the spread of 500-simulation blocks, not the model's uncertainty, and `/desporto/liga/dados` says so. The 90% final-points ranges stay. The title race carries the title-calibration caveat (`football.titleCalibrationCaveat`, read by the hub, `/modelo` and the methodology, linked to the methodology's `#quem-lidera-ganha-o-titulo-mais-vezes-do-que-o-modelo-diz`; `football-methodology-anchors.test.ts` checks every link into the methodology); the caveat quotes only the clean values (leaders given 63% on average, champions in 82%) and says the two cases with a data error are left out, while the methodology paragraph built from `TITLE_CALIBRATION` (`titleCalibrationParagraphs`) gives the 17 clean cases first and all 19 second; both must match `TITLE_CALIBRATION`'s clean values (`cellsClean`, `modelMeanClean`, `leadersWonClean`; a test checks both texts), and "despromoção" means 17th or 18th wherever it is shown (the 16th goes to a play-off and is not counted): table footnote, relegation caption, club pages, methodology, `/dados`. The page passes the two charts a trimmed history (`probabilityHistory()`), not every prediction in full.
- Match pages (`/jogo/{slug}`) cover the fixtures to come (`loadUpcomingFixtures`, postponed leftovers still in `next_matchday_scenarios` included, with `postponed: true` and a "jogo em atraso" label) and the season's played games (`loadPlayedFixtures`: the result plus the pre-match odds, only when they were published before kickoff); played pages stay online and are in the sitemap, dated by kickoff. The slug (`{home-away}`) has no season in it, so the 2027-28 fixtures would collide with this season's pages: move them to a season-scoped address before 2027-28 (plan in `docs/football-runbook.md`).
- The methodology page renders `src/content/football-methodology/{pt,en}.mdx` (MDX plus data-bound components; the `REVISED` date lives in `metodologia/page.tsx`).
- **Provenance**: the xG behind xPts (the md files' `xpts_table`, `review.json`) is FotMob's; results, shots on target and goalkeeper xGOT are SofaScore's, closing odds Pinnacle's and Bet365's via football-data.co.uk (which provider each past season's results field carries is producer ask 5 in `docs/football-producer-asks.md`). `/desporto/liga/dados` marks the third-party fields "Fora da licença" per file (see "Licences"), and `src/lib/football-provenance.test.ts` checks that `/dados`, `/2025-26` and the methodology name FotMob for every xG they attribute. The hub's source line (`football.xgAttribution`) names FotMob too; the test also reads `messages/pt.json` and `messages/en.json`.
- The published forecasts come from `bivcross` (bivariate Poisson with shots on target) since matchday 1 of 2026-27; md00 was `joint_sot`. Each md file names its model in `model`. Model codenames appear only on `/desporto/liga/dados`, never in reader-facing copy.
- Several older components in that folder (PositionHeatmap, CriticalPaths, PathsToVictory, PointsPace, MatchdayLive, ScheduleDifficulty) are imported by no page; do not build on them without checking.

### Election Chart Components (`src/components/charts/`)
- **HouseEffects.tsx**: Custom HTML/CSS matrix with no hover tooltip (an exception to the hover-tip rule above): each cell's `title` and the `<ChartTable>` twin carry the exact values; the cell colours come from `src/lib/election-heatmap.ts` (one forest ink on every cell, the red and blue ramps capped where it still reaches 4.5:1, `election-heatmap.test.ts` sweeps them)
- **CoalitionDotPlot.tsx**: the two blocs' seat totals as a dot histogram (stacked dots: `drawnSeatIndices`, every 12th model draw with its three emigration scenarios, 750 dots, about 200 on phones; never every k-th row, which drew only the 2024 scenario); the bloc colours are PS's and AD's (under 3:1 on white, so every row names its bloc)
- **DistrictSummary.tsx**: ENSC methodology for contested seats; each district card shows every party above 5% (`seatChangesOf`, `SEAT_CHANGE_SHOWN`) with "+1/−1 mandato ou mais"; the third tile is "Abaixo do limiar (ENSC ≤ 0,8)", with a watch line for districts between 0,4 and 0,8 (`districtsToWatch`); `CONTESTED_ENSC` and `WATCH_ENSC` live in `election-aggregates.ts`
- **PollingChart.tsx**: takes a columnar `TrendSeries` (`compactTrendSeries` in `election-aggregates.ts`) instead of long rows, so the page payload stays small
- **Numbers** (`src/lib/election-display.ts`): election probabilities print "menos de 1%" / "mais de 99%" ("under 1%" / "over 99%") everywhere, tables and twins included, never "<1%" or 0% and 100% (`formatElectionProbability`, `electionProbabilityParts` for a headline figure); counts group from four digits (`formatElectionNumber` uses `useGrouping: 'always'`: "9 000" with a no-break space in Portuguese, like `formatInteger` and `formatCount`), and the methodology MDX writes its counts the same way by hand ("9 000", "8 000", "1 000"). Dates: `formatElectionDate` for table columns ("09/01/2026", dd/mm/aaaa so the column lines up; "9 Jan 2026"), `formatElectionShortDate` for chart ticks and tips ("6 fev. 2026"), `formatElectionLongDate` for readouts and footers. `PARLIAMENTARY_PARTY_ORDER` (AD PS CH IL L CDU BE PAN) and `sortByPartyOrder` are the archive's one party order, so the left bloc reads PS + L + CDU + BE (`src/lib/config/blocs.ts` still lists it PS, BE, CDU, L: sort it before showing it). The round switch is choice boxes made of links (`choiceClass`, `?round=1`, `aria-current`; without JavaScript `?round=1` still shows round 2, a static export serves one file). The archived charts have no filters: every line is named at its end (the presidential lines with their last estimate and 90% interval; `PollingChart` draws every party, with bands on the three largest only), and the district map's readout sits beside the map (under it on a phone) in a live region present from load.
- **Sections with one chart**: an h2 finding (`src/lib/election-findings.ts`: "António José Seguro vencia a 2.ª volta em mais de 99% das simulações") or statement, then the `<DataCard>`, whose subtitle carries the explanation; no grey lede between them.
- The election methodology is its own page, `/eleicoes/metodologia` (`src/content/methodology/eleicoes/{pt,en}.mdx`, dated). Every h2 and h3 there and on `/economia/metodologia` gets a slug id (`headingSlug`, `headingText` in `src/lib/election-methodology.ts`), so keep heading texts unique; charts deep-link through `ELECTION_METHOD_ANCHORS` and `electionMethodHref(section, locale)`, and `election-methodology.test.ts` keeps the anchors and the MDX in step; the `/metodologia` page's elections row carries the old `#eleicoes` and `#segunda-volta-2026` anchors.

## Azure Static Web Apps Configuration

### staticwebapp.config.json
- 301 redirects: old URLs, locale-less section paths and the bare root (see "Route Structure")
- Rewrites: `/{locale}/populacao/freguesia/*` to the parish shell, after two exact rules that serve the shell's own RSC payload (`/{pt,en}/populacao/freguesia/_/index.txt`) as itself rather than as the shell's HTML; `/pt/populacao/v/*` and `/en/populacao/v/*` to each locale's consultation page, and the locale-less `/populacao/v/*` (the producer's `canonical_path`) to the Portuguese one
- Cache headers: `/_next/static/*` and the hashed `og-image-*-{hash}.png` cards immutable for a year, except the names matched first by exact routes, which revalidate (`max-age=0, must-revalidate`): the unversioned `og-image-{pt,en}.png` and every retained card name (see the OG paragraph below), whose routes `scripts/generate-og-images.mjs` writes just ahead of the `/og-image-*.png` wildcard; `/favicon.ico` a day; `/data/population/v*` immutable (a release never changes, its `manifest.json` included; there is no rule for anything else under `/data/population`, and `host-config.test.ts` keeps it that way); `/data/population-geography/*` a day; `/images/*`, `/brand/*`, `/branding/*` a week with stale-while-revalidate; everything else `max-age=0, must-revalidate`
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
- **Football**: Run `./scripts/sync-data.sh football` to copy from `~/code/estimador-football/output/`; it drops the model's `cards.json`, which is not a published feed. After a round's last game, sync and deploy the next `mdNN` within 24 hours: the reader's clock (`ClockSwitch`) covers the gap on the pages, but the static meta descriptions of that round's match pages keep the pre-match odds until the rebuild. Dates and the season's other chores: `docs/football-runbook.md`; asks for the model repository: `docs/football-producer-asks.md`
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
