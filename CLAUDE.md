# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**estimador.pt** is a multi-domain data analysis platform for Portugal, built with Next.js. It provides data-driven forecasts and analysis across different domains (football, elections, and more), with a professional editorial-style interface and interactive visualizations.

### Active Sections
- **Liga Portugal** (`/desporto/liga/`) — Bayesian football league forecasts
- **Presidential Elections 2026** (`/eleicoes/presidenciais/`) — Presidential election forecast
- **Parliamentary Elections 2025** (`/eleicoes/legislativas/`) — Parliamentary election results (archive)

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production (static export)
npm run start        # Start production server
npm run lint         # Run ESLint
./scripts/sync-data.sh           # Sync all data from model projects
./scripts/sync-data.sh football  # Sync football data only
```

### Deployment
The project deploys automatically to Azure Static Web Apps via GitHub Actions when pushing to `main`. The deployment uses:
- `AZURE_DEPLOYMENT_TOKEN` secret for Azure authentication
- Static export configuration (`output: 'export'` in next.config.js)
- Builds to `out/` directory

## Route Structure

```
/                                  → Hub homepage (section summaries)
/desporto/liga/                    → Liga Portugal forecast
/desporto/liga/metodologia/        → Liga Portugal methodology
/eleicoes/presidenciais/           → Presidential 2026 forecast
/eleicoes/legislativas/            → Parliamentary 2025 forecast
/eleicoes/legislativas/mapa/       → District map (parliamentary 2025)
/artigos/                          → Articles
/sobre/                            → About
/metodologia/                      → Methodology overview
```

Old URLs (`/forecast`, `/about`, `/methodology`, `/map`, `/articles`) redirect via 301 in `staticwebapp.config.json`.

## Architecture

## Design Language

The site's identity is the interval mark and the atlas palette. Everything lives in `src/app/globals.css` (tokens), `src/lib/brand/index.ts` (mark paths and hex values for SVG and canvas code) and `src/components/Logo.tsx`; the living guide, with downloadable files, is `/marca` (`src/app/[locale]/marca/page.tsx`, not indexed).

- **Mark**: a credible interval drawn as one path in one colour. `<Mark>` from 24px up, `<MarkSmall>` below; `<LogoHorizontal>` is the only signature (Manrope 800 wordmark, no serif or stacked version). Pine on light, paper on dark. Never a coloured band, never inside a chart. Assets in `public/brand/`; regenerate them with the brand script in the session scratchpad or by hand from `src/lib/brand`.
- **Surfaces**: `bg-paper` (page ground), `bg-cream` (cards, panels, table rows), `bg-parchment` (sunken areas, hovers), `border-line` (hairlines). Dark surfaces use `bg-forest`.
- **Ink**: `text-ink` for text and primary actions, `text-stone-500` for secondary text. Links are ink with an underline, never blue.
- **Pastels in two strengths**: data (`mint`, `mustard`, `coral`, `periwinkle`) for chart categoricals and the atlas's people; surface (`mint-soft`, `mustard-soft`, `coral-soft`, `periwinkle-soft`) for the mosaic, covers and backgrounds. Neither does the other's job. Party and team colours stay as they are; gold/amber means "caveat", never emphasis.
- **Retuned Tailwind ramps**: `stone`, `amber`/`yellow`, `emerald`/`green`, `red` and `blue` are redefined in `@theme`, so existing utilities keep their meaning but sit on paper. Do not use `gray`, `slate` or `bg-white`.
- **Type**: one family, Manrope (`--font-sans`, `--font-display`): h1 800, h2/h3 700, text 400/500, uppercase kickers 700, headline numbers `font-display font-extrabold tabular-nums`. Newsreader (`--font-serif`) is the reading face and appears only inside `.article-body` (articles, methodology, about, privacy). No italics as decoration. Nothing below 11px.
- **Mosaic** (`src/components/brand/Mosaic.tsx`): quarter-circles are shares, circles people, dot grids populations, rounded blocks places; bands stay in the mark. Allowed on brand and explainer covers, hero art of pages without data (`<PageHero art>`), empty states, the 404 and avatars. Never beside a club or party number, never encoding information.
- **Motion**: the interval opens on hover of a `.brand-link`; `<MarkLoading>` only where something is genuinely loading. Both stop under prefers-reduced-motion. A published forecast never animates.
- **Three levels of expression** (docs/design/design-system-proposal.md): entrances, explainers and empty states are the most playful (a soft field, a mosaic, one invitation); dashboards and forecasts are restrained (a compact tinted introduction via `<PageHero field>`, then cream tables and plots, decoration outside the plotting areas); articles and methodology are editorial. One colour field per page at most.
- **Primitives**: actions are `<Action>` (`src/components/brand/Action.tsx`: primary pine, secondary bordered cream, tint, text; 48px, 10px corners, one main action per view); keyboard focus is the global double ring in globals.css, so components do not declare their own; inputs and selectors are 44 to 48px with a visible label; cards use `rounded-2xl`, a thin border and no shadow; motion is 140 to 200ms feedback and 200 to 300ms panels. `<TeaserBand>` is the explainer teaser that follows a dashboard's data. Empty states get a small mosaic and a specific next step, and missing data is never shown as zero.
- **Visualisations** (`src/components/viz`, showcased as section 08 of `/marca`): `<DataCard>` (title, source, date, methodology link) frames every chart; `<StatTile>`/`<KpiRow>` for headline numbers with optional sparkline and delta; `<TrendChart>` (2px line, 80% band wash, dashed projected segment, end labels, crosshair tip); `<ColumnChart>` (24px caps, one highlighted column); `<RankedBars>`; `<OutcomeBar>` for 1X2; `<PeopleGrid>` (100 dots); `<Segmented>` filters; `<Legend>`; `<ChartTable>` (the table twin every chart carries). Series colours live in `theme.ts` (`SERIES`/`SERIES_DARK`, mirrored as `--color-series-1..4` and `--color-series-dark-1..4` tokens): fixed order teal, gold, periwinkle, coral; never cycled, never on text, at most four (the fifth folds into "other"). `STATUS` colours are reserved for state and always ship with an icon and a word. Team and party colours keep their own maps. The data pastels are for the atlas's people and categorical fills, not for line series. Chart text is Manrope (`FURNITURE.font`), never Inter. The same contract applies to the older Plot and SVG charts: the title race, relegation, team timeline, polling, seat, coalition, presidential trend and head-to-head charts and the economy sparklines carry a `<ChartTable>` twin and a hover tip, so a new chart must too. A table twin is a complete alternative: every point the chart draws at the chart's own resolution, with its bands or quantiles in their own columns, in the page's number format; long tables scroll inside the disclosure. Nothing in an SVG is below 11px.
- **Chrome**: every page opens with `<PageHero>` and closes with `<SiteFooter locale={locale} />`. OG cards come from `scripts/lib/og-cards.mjs` (Manrope via `@fontsource/manrope`; the mosaic only on the brand card and explainer covers).
- **Communications**: one line ("Dados para compreender Portugal."), one descriptor ("Previsões e análises com a incerteza à vista: economia, Liga Portugal, eleições e população.") and two bios, used identically in `messages/*.json` meta, the OG brand card, the feed, the READMEs and the social kit. `npm run brand` regenerates every logo, icon and social asset (`scripts/generate-brand-identity.mjs` + `scripts/generate-social-kit.mjs`, outputs under `public/brand`, `public/branding`, `public/images/brand`); the Liga matchday card is `scripts/generate-social-images.mjs`. Voice: sentence case, questions as headings, uncertainty stated with interval, date and source, one action per piece, no emoji or exclamation marks. The kit and the voice rules are on `/marca`.

### Data Organization
```
public/data/
  elections/
    presidential-2026/          # Presidential forecast data (18 files)
    parliamentary-2025/         # Parliamentary forecast data (8 files)
  football/
    liga-2025-26/               # Liga Portugal predictions (matchday JSONs + scenarios)
```

### Data Flow
- **Static Data**: Lives in `public/data/{section}/{subsection}/` as JSON files
- **Data Loaders**: `src/lib/utils/data-loader.ts` (elections), `src/lib/utils/football-data-loader.ts` (football)
- **Chart Components**: Observable Plot + D3 in `src/components/charts/` (elections) and `src/components/charts/football/` (football)
- **Section Config**: `src/lib/config/sections.ts` — drives homepage and navigation

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
- **Section registry**: `src/lib/config/sections.ts` — defines all platform sections
- **Election config**: `src/lib/config/elections.ts` — election types and contestants
- **Party colors**: `src/lib/config/colors.ts` — political party styling
- **Team colors**: `src/lib/config/football.ts` — Liga Portugal team styling
- **Types**: `src/types/index.ts` (elections), `src/types/football.ts` (football)

### ElectionContext Scoping
`ElectionProvider` is scoped to `/eleicoes/` routes via `src/app/[locale]/eleicoes/layout.tsx`. It is NOT in the root layout.

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
- **PositionHeatmap.tsx** — 18×18 position probability matrix (custom HTML/CSS)
- **DecisiveMatches.tsx** — Title-swinging upcoming matches
- **CriticalPaths.tsx** — Key remaining fixtures per team

### Election Chart Components (`src/components/charts/`)
- **HouseEffects.tsx**: Custom HTML/CSS matrix
- **CoalitionDotPlot.tsx**: Samples large datasets for performance
- **DistrictSummary.tsx**: ENSC methodology for contested seats
- **PollingChart.tsx**: `Plot.dodgeY` for label collision avoidance

## Azure Static Web Apps Configuration

### staticwebapp.config.json
- 301 redirects for old URLs (`/forecast` → `/eleicoes/legislativas`, etc.)
- Explicit serve rules for all new routes
- MIME types for `.json` and `.txt` (RSC files)
- Navigation fallback excludes static assets
- Cache headers for optimal performance

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

**Feeds:** `/pt/feed.xml` and `/en/feed.xml` are generated by
`src/app/[locale]/feed.xml/route.ts`; every page advertises its locale feed via
`createPageMetadata`. `/feed.xml` redirects to the Portuguese one.

**Email:** the subscribe card reads `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` (a
`NEWSLETTER_ENDPOINT` GitHub secret in CI). Unset, it renders the feed link
only and no email field. Before setting it, name the sending service in
`src/content/privacy/{pt,en}.mdx` — the section is written but the processor is
left blank on purpose.

### Data Updates
- **Football**: Run `./scripts/sync-data.sh football` to copy from `~/code/estimador-football/output/`
- **Elections**: Manually update JSON files in `public/data/elections/`
- **Economics**: Run `./scripts/sync-data.sh economics` to copy from `~/code/estimador-economics/output/`

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
