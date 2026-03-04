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
/eleicoes/mapa/                    → District map
/artigos/                          → Articles
/sobre/                            → About
/metodologia/                      → Methodology overview
```

Old URLs (`/forecast`, `/about`, `/methodology`, `/map`, `/articles`) redirect via 301 in `staticwebapp.config.json`.

## Architecture

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
4. **Editorial style**: Stone palette, dividers, no rounded cards

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

### Data Updates
- **Football**: Run `./scripts/sync-data.sh football` to copy from `~/code/football/output/`
- **Elections**: Manually update JSON files in `public/data/elections/`

### Portuguese Electoral Context
- **Parties**: AD (center-right), PS (center-left), CH (right), IL (liberal), BE (left), CDU (communist), L (green), PAN (animal rights)
- **System**: Proportional representation using D'Hondt method across multiple districts

### Liga Portugal Context
- **18 teams** in Primeira Liga
- **Bayesian model**: Attack/defense parameters, squad value priors, home advantage
- **Data**: Matchday predictions (md*.json) + scenarios (md*_scenarios.json)
- **Key metrics**: p_champion, p_top3, p_relegation, title_swing, win_uplift
