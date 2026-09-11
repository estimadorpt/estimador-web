# Brand implementation review — 11 September 2026

Verdict: the logo implementation is correct; the broader design system rollout is incomplete.

## Verified

Built the current checkout in an isolated copy and inspected the fresh static export, not the older preview on port 3018. Production build passed, with lint warnings. All 257 tests passed.

Browser inspection covered the homepage, Portuguese brand guide, economy, Liga, population atlas and About; the English guide was also opened. Checked representative desktop and 390px-wide mobile layouts. Changed the guide's chart filter to Trabalho and opened its table disclosure successfully. Mobile homepage, economy, Liga and brand guide appeared coherent; no page-wide overflow was detected in the inspected guide, economy, Liga or atlas.

Logo geometry has the approved left-offset counter; the compact mark retains whiskers. Header, mobile icon, footer and guide share these components. Both social card generators read the shared geometry. Typography and paper/forest/pastel palette are present across the main pages. No tilted action buttons were found.

## Findings

1. **Mobile atlas controls overlap (high priority).** At 390px, the pause button occupies x24–51, y320–364, while the Portugal breadcrumb occupies x33–76, y330–348. The controls visibly collide. The toolbar wraps but the breadcrumb keeps an absolute top offset. Fix the mobile toolbar/breadcrumb layout together, rather than adjusting one hard-coded offset. See src/components/atlas/Atlas.tsx:49–50 and atlas.css toolbar/breadcrumb responsive rules.

2. **Chart system is a showcase rather than a completed rollout (medium priority).** Imports of the new src/components/viz public components are confined to viz/Showcase.tsx, which is used by /marca. Production dashboards continue to use separate implementations. Existing charts need not all be replaced, but they must meet the same presentation/accessibility contract before the guide can claim site-wide consistency. In particular, the guide promises a table, date and source for each chart; even its ranking, outcome and people examples do not all provide that complete contract. See src/components/viz/Showcase.tsx:39–62.

3. **Small text and old fonts remain (medium priority).** Economy SVG labels render at 9–10px, confirmed from computed browser styles, despite the 11px minimum. Examples include PulseTile.tsx:90–100, Gauge.tsx and AnnualOutlookTile.tsx. The miniature scene still explicitly uses Georgia for grouped headings and Arial for scene captions (Scene.tsx:68,86). These bypass the agreed Manrope interface typography.

4. **Control specifications disagree with implementations (lower priority).** /marca describes all actions as 48px tall, but its text action measures 44px. Segmented.tsx documents 44px targets but uses min-h-10 (40px). The older ui/button.tsx still exposes 32–40px variants, smaller corners and shadows, although no current JSX Button uses were found in the source search. Consolidate or clearly document exceptions so future pages do not reintroduce inconsistent controls.

## Scope

Review only: no website implementation files changed. This was representative page and component verification, not an exhaustive interaction audit of every route, chart or breakpoint. Colour-vision simulations and full accessibility certification were not performed.

## Follow-up — implemented 11 September 2026

Each finding was addressed in the working tree and verified against a fresh static export (all 330 smoke URLs, a 192-route crawl, and a scripted browser pass at 1440px and 390px).

1. **Mobile atlas controls.** On screens up to 720px the breadcrumb no longer floats at a fixed offset: it flows as a second toolbar row under the mode buttons, with the map's top margin and the profile drawer's offset adjusted together (`src/components/atlas/atlas.css`, final rule). Measured at 390px: pause button y320–364, breadcrumb y368–404, no intersection.

2. **Chart contract beyond the showcase.** The showcase's ranking, outcome and people examples now carry a table twin, a date, a source and a method link (`RankedBars`, `OutcomeBar` and `PeopleGrid` accept `tableCaption`). The same contract was rolled onto the production charts: title race, relegation, team timeline, polling, seat, coalition, presidential trend, head-to-head and the second-round beeswarm carry a `ChartTable` twin, the Plot charts a hover tip, the polling chart a permanent legend; the economy pulse and recession sparklines carry tables. Football Plot charts also take whole-matchday ticks, a localised axis label and Manrope at 12px instead of Plot's default 10px system font.

3. **Small text and old fonts.** Every `fontSize` of 7–10 in SVG and Plot marks was raised to 11 (economy tiles, gauge, story line chart, season review, Liga 2 table, election charts); the miniature scene uses Manrope in place of Georgia and Arial; the atlas's cinematic caption kicker goes from 7px to 11px. A browser pass finds no SVG text below 11px on the Liga, team, elections, economy, brand or miniature pages.

4. **Control specifications.** The text `Action` is 48px like the others; `Segmented` and the matchday picker chips are 44px; the unused `ui/button`, `ui/accordion`, `ui/tabs` and `ui/table` primitives were removed (`ui/card` and `ui/badge` remain, used by the district map page).

Also fixed on the way: English diagnostic labels on the players page and the English house-effects explainer now read in the page's language.

## Independent recheck — 11 September 2026

Rebuilt the current working tree in `/tmp/estimador-brand-followup` and served that export on port 3022. Production build passed; all 257 tests passed; the existing smoke script independently checked all 330 URLs successfully. These are local-export checks, not deployment verification.

- **Finding 1 closed.** At 390px, the pause button spans y320.08–364.08 and the breadcrumb y368.08–404.08: a 4px gap. Opened the profile drawer and visually checked it too.
- **Finding 3 closed for the checked pages.** Browser checks found no SVG text with computed sizes of 7–10px on the brand guide, economy, Liga, presidential elections and miniature at mobile width, or the Moreirense and parliamentary pages at desktop width. The miniature's explicit Georgia/Arial declarations have been replaced with Manrope. This verifies computed font sizes, not minimum physical glyph size after every possible SVG transform.
- **Finding 4 closed.** All four guide actions measure 48px; all three segmented buttons measure 44px. The unused primitives listed in the follow-up are absent. Changed the guide filter to Trabalho and opened its populated table successfully.
- **Finding 2 substantially addressed, but not fully closed.** New working table disclosures now exist on production pages (Liga: 2, economy: 2, parliamentary elections: 3, presidential elections: 1, Moreirense: 1) as well as all five chart examples in the guide. The English Liga table opens with English labels and populated matchday data. However, some tables are summaries rather than full chart alternatives: `TitleRaceChart.tsx:20` includes central estimates but omits the lower/upper bounds visibly drawn by its uncertainty bands; `TrendChart.tsx:109` likewise outputs only y values despite drawing bands. `PollingChart.tsx:30` reduces data to the last value per month and the latest 24 months; `PresidentialTrendChart.tsx:88` also takes month-end estimates. The guide's promise of the same information in a table is therefore still stronger than the implementation. Include uncertainty bounds and the plotted observations, or explicitly label summaries and provide a full-data alternative.

No page-wide horizontal overflow was detected in the sampled layouts. No implementation files were changed during this recheck. This does not independently repeat the claimed 192-route browser crawl; it combines the 330-URL smoke check with targeted browser and source verification of the four findings.

**Table twins as complete alternatives (later the same day).** The first pass summarised daily election series by month and dropped the bands the charts draw. The tables now carry every date in each chart's window and the bands in their own columns: title race and relegation cells read "55% (48–62%)"; the seat table lists P10, P25, mean, P75 and P90; the coalition and second-round tables add quartiles; the polling table lists every estimate in the two-year window with its low–high band (the chart's window now follows the data rather than today's date, and the page copy no longer claims bands the chart does not draw); the presidential trend table lists every date per candidate with the 50% and 90% bands, with a second table of the polls the chart dots (the legend now says 90%, which is what P5–P95 is); the guide's trend chart table carries the band and the projected flag. Long tables scroll inside their disclosure with a sticky header, and Portuguese pages use the comma.
