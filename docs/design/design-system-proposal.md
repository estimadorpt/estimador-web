# estimador.pt design system: proposal

Status: applied to the website on 2026-09-11 (see `/marca` and CLAUDE.md, Design Language). Originally visual prototypes and an implementation specification. Builds on the current `/pt/marca/` identity and the approved second application study. All buttons, badges, cards, illustrations and tiles remain level: no rotation or tilted decoration.

## Keep the recognisable core

Keep the existing single-colour interval mark, `estimador.pt` signature, Manrope UI family, Newsreader article body, and current palette. The mark remains pine on light surfaces and paper on forest. Colour inside the logo is not needed to make the site inviting.

## Three levels of expression

| Context | Expression | Practical change |
| --- | --- | --- |
| Entrances, explainers, empty states | Most playful | Give the mosaic enough space to form a composition; use a single pastel field and a direct invitation. |
| Dashboards, results, forecasts | Restrained | Compact pastel introduction, then cream tables and plots. Keep decoration outside the plotting and numerical areas. |
| Articles, methodology, stories | Editorial | Illustrated cover, varied text weights, comfortable reading column, occasional quiet margin note. |

The website needs variation in rhythm more than more decorative elements. Avoid repeating a huge illustrated hero above every page, especially dashboards whose useful information should appear immediately.

## Proposed shared primitives

| Element | Proposed rule |
| --- | --- |
| Main action | Pine background, cream text, 48 px minimum height, 10 px corners, horizontal label and optional arrow. |
| Secondary action | Paper/cream background, pine text, visible border. No colour-filled competition with the main action. |
| Text action | Clear label with underline on hover and visible keyboard focus. |
| Keyboard focus | Two-part outline: paper separation ring and pine outer ring, readable on dark and pastel surfaces. |
| Inputs and selectors | Persistent label above, 48 px minimum height, visible boundary and focus. Errors use text plus an icon, never colour alone. |
| Content cards | 16 px corners; thin border, no default drop shadow. Charts and dense tables can sit in a shared rectangular panel rather than many nested cards. |
| Spacing | 4 px base; 8/12 within controls, 16/24 within components, 32/48/64 between sections. |
| Typography | Manrope 700 for most headings, 800 reserved for the main message or key figure, 500 for conversational supporting copy, 400 for body. Keep tabular numbers in tables. |
| Reading | Newsreader for article prose only; approximately 60–70 characters per line and 1.6 line height. Sans-serif headlines, labels and charts. |
| Labels | Sentence case by default. Small uppercase text is limited to occasional editorial categories, rather than every component. |
| Icons | One consistent simple line-icon family for actions; illustrations serve storytelling, not control identification. |
| Motion | 140–200 ms feedback, 200–300 ms panel changes. Opacity and colour transitions; no rotations, bouncing controls, or layout jumps. Honour reduced motion. |

## Colour use

Keep neutral surfaces dominant. Periwinkle, mint, coral and soft mustard are a small supporting vocabulary, not an automatic colour assigned to every card. Give a page one leading decorative field and at most one supporting accent. Foreground text remains dark pine on pale surfaces. Verify all final colour pairs at implementation size, including muted labels and focus indicators.

Do not recolour party or club identities. Keep warning, error, positive and negative states distinct from decoration. Pastel chart series still need labels, usable contrast and a stable legend; brand colour must never imply a data conclusion.

## Visualisation components

Implemented in `src/components/viz` and shown as section 08 of `/marca` on illustrative data. Form first, colour last: a single number is a `StatTile` (with optional sparkline and delta), change over time is a `TrendChart` (2 px line, 80 % band wash, dashed projected segment, end labels, crosshair tip), magnitude across categories is a `ColumnChart` or `RankedBars`, three outcomes are one `OutcomeBar`, a population is a `PeopleGrid`. Every chart sits in a `DataCard` with title, source, date and methodology link, carries a `Legend` when it has two or more series, and ships its `ChartTable` twin. Filters are one `Segmented` row above the chart.

Series colours are a fixed, validated order (teal, gold, periwinkle, coral: `--color-series-1..4`, with a dark set for forest surfaces); never cycled, never on text, never more than four. Status colours are reserved for state and always come with an icon and a word. Team and party colours keep their own maps. The data pastels stay on the atlas's people and categorical fills: they are too light to carry a line series on cream.

## Apply across the website

- Homepage: use a periwinkle exploration entrance, one clear action, and an orderly mosaic composition. Keep the living village as the real interactive feature rather than replacing it with static decorative art.
- Economy: compact mint editorial introduction; strongest finding first, related metrics grouped together, source/date visible, chart explanation close to the figure, explainer teaser after the useful data.
- Football: compact exploration invitation, prominent scenario entry, stable team colours and numerical alignment, fewer nested containers, clear separation of forecast and observed result.
- Elections: use the same compact dashboard structure; leave party colours and probabilities intact. Put explanatory mosaic graphics in methodology or onboarding, not behind bars or maps.
- Articles: visual cover with a small coherent mosaic, readable prose, quiet annotations, source-aware embedded charts and related reading after the story.
- Atlas: preserve the continuous geographic zoom and persistent homes. Consolidate place/profile controls, keep navigation stable through levels, and use decorative colour around the map rather than across geography or household data.
- About/methodology: warmer questions as section headings, a short summary before the detail, a restrained illustrated introduction, and a clear path to deeper technical material.
- Empty/error/loading states: a small orderly mosaic and a specific next step. Keep the current interval loading motion and distinguish missing data from a value of zero.

## Responsive and verification criteria

Collapse controls into a labelled panel on narrow screens. Make primary actions at least 44 px in both interactive dimensions where applicable, avoid chart clipping, and keep sources and legends available. Test keyboard navigation, reduced motion, text contrast, long Portuguese labels and touch interaction. Verify that illustrations do not delay primary content or make map transitions slower.

Generated boards are illustrative design studies, not authoritative data or pixel-accurate implementations. The implementation should preserve existing routes, filtering, data semantics and real content.
