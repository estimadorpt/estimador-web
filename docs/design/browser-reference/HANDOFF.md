# Estimador — browser design reference

13 September 2026. This runnable prototype is the visual reference for the economy, football and election sections. Read alongside the existing production requirements; it does not replace data sources or modelling logic.

## Open and use

From the repository root:

```sh
python3 -m http.server 3033 --bind 127.0.0.1 --directory docs/design/browser-reference
```

Open http://127.0.0.1:3033/#economia and use the navigation for football and elections. No build or network dependency is needed for the prototype itself. External archive/methodology links require internet access.

## Instructions for Claude

Use the rendered HTML/CSS, supplied images and working interaction states as the reference. Do not reinterpret earlier image mockups as more authoritative. Preserve existing production routes, data provenance, accessibility and application behaviour when adapting these layouts. The prototype banner and three-link navigation are review scaffolding, not replacements for the production navigation.

- Reuse the supplied Manrope fonts and approved whiskered logo. Do not redraw or rotate the mark or controls.
- Use the exact images in assets; do not substitute an icon, regenerate a generic character or invent another palette. These are proposed illustration assets, subject to the user's visual review.
- Preserve compact illustration sizes. Do not turn the sections into illustrated magazine covers. Tables, tools and archive access are the main content.
- Keep warm paper, deep pine text, restrained sage and blue panels. Colour conveys emphasis, not arbitrary section branding or party affiliation.
- Adapt existing production components rather than copying the entire static document into the app. Preserve responsive relationships and measured spacing from style.css.

## Page-specific decisions

### Economy: explain before presenting indicators

A frontal neighbourhood shop gives prices and activity a concrete setting. The art is confined to the introduction. A broad explanation panel with topic tabs sits beside a quieter reading checklist. Keep the distinction between price levels and inflation, and the other explanatory topics.

The paused table deliberately contains no invented values. Connect real indicators only through the existing supported data path; preserve dates, sources and paused/error states. Do not ship the prototype's paused statement as a claim about the current production feed without checking it.

### Football: recognisable place, functional centre

The small stadium illustration includes pitch, goal, stand and rail. It replaces the ambiguous isolated-seat motif. The two-column working area shows choices and consequences together. On mobile, choices precede results; the illustration becomes a 125px-high landscape crop.

The local exercise uses fictional teams and simple points for one matchday. It is NOT the production forecasting model. Carry the layout and interaction feedback into the actual simulator while retaining its model, loading, error and result states. Never label this example arithmetic as a probability forecast. Changed selections clear stale results; reset clears selections and comparison.

### Elections: a dated archive, not live coverage

A polling place is recognisable without relying on miniature parliament architecture. The archive uses a year rail, institution names, specific election names and clear archive actions. Do not use party colours for decorative election illustration. Dates and links must come from production archive records.

The quieter explanation panel uses a real explanatory interval diagram, not decorative seats. It explicitly compares the same scale and coverage, and does not imply that a narrow interval proves model quality. Actual election detail pages should prioritise estimates, uncertainty, dates and methods over repeating the hero illustration.

## Shared measurements

The source of truth is style.css. Principal values:

| Element | Value |
|---|---|
| Content maximum | 1240px |
| Outer gutters | 24px desktop; 16px phone |
| Paper / panel | #f5f3ea / #fcfbf5 |
| Pine / secondary text | #234c40 / #5f7062 |
| Sage / blue / clay | #e1e9df / #dce8e9 / #f1e0d4 |
| Panel radius | 16px |
| Main art column | 295px desktop; football 240px |
| Mobile art height | 145px; football 125px landscape crop |
| Mobile heading | 32px |
| Main button height | at least 48px |
| Phone stacking breakpoint | 760px |

On information-heavy detail pages, use fragments sparingly: a window, awning or stand edge may introduce a section, but should not compete with a chart. Do not repeat whole scenes inside cards merely to fill space. Article and methodology content can remain almost entirely typographic.

## Verification and acceptance

Browser checks performed on 13 September 2026:

- Desktop and mobile screenshots visually inspected across all three pages; tablet archive also inspected.
- All three pages checked for horizontal overflow at 320px and 768px: none.
- 390px election and football layouts inspected; supplied images loaded.
- Economy click and keyboard arrow navigation changed explanatory content correctly.
- Empty football comparison prompted for missing selections.
- Home/draw/away test produced points 3,0,1,1,0,3 and differences +2,-1,0,0,-1,+2.
- Changing a selection cleared stale results; reset returned to zero selected matches.
- Election interval disclosure opened correctly.
- No browser warnings or errors during these checks.
- Fixed a missing heading space and mobile football image size after visual inspection.

Before calling the production port complete: compare at 320, 390, 768 and 1440px; check keyboard focus and reduced-motion support; verify real data states and archive destinations; ensure artwork never covers controls or values. The prototype tests do not certify the live data/model or all external destinations.

## Production integration — 13 September 2026

The visual implementation now lives in the actual application, not only this prototype:

- Public illustration assets: public/images/sections.
- Shared SectionIllustration component and optional PageHero illustration property. Existing mosaic-based heroes retain their old treatment.
- Illustrated economy, league, simulator, legislative and both presidential-round headers.
- Bilingual paused-economy reading tabs and comparison checklist. Existing feed pause rules remain unchanged.
- Simulator choice/results panels, mobile stacked matches, full phone labels, accessible selected-state labels. Existing probability calculations remain unchanged.
- Brand-page illustration examples, downloads and placement rules.
- Brand visualization showcase uses constrained grid columns and wrapping swatches on phones.

Verified in the local Next application: desktop/mobile rendering; economy click and arrow-key tabs; real simulator selection and reset; PT and EN copy; loaded illustrations. TypeScript passed; lint reported no errors (existing image/unused-variable warnings remain). This is not a deployment or an audit of forecast mathematics. Earlier prototype fictional match arithmetic must not replace the production simulator.

## Football journey refinement

The homepage football panel and league page now share TitleProbabilities, including numeric hierarchy, small club-colour identifiers and changes explicitly labelled in percentage points. Both entrances and the simulator use the same stadium asset. Football page content aligns to a 1160px maximum width.

Historical title/relegation charts use readable minimum phone heights, percentage ticks and neutral end-label text. Underlying series, bands and team colours are unchanged. The league table's intrusive first-row bubble has become a quiet hint above the table. Fixture charts have matching legend swatches and a two-column desktop arrangement.

Simulator bars now show the baseline forecast as a vertical marker after selection. Bar widths are rendered directly rather than spring-animated. Choice buttons use consistent pine, while team colours remain in the charts. At widths below 400px, team names sit above bars so the scale remains usable. Calculations and thresholds have not changed.

Browser verification: homepage/league/simulator at desktop and 320–390px, English simulator, historical chart labels, fixture layout, selection and reset including marker removal. Typecheck and targeted lint passed with existing img warnings. Homepage configuration and prediction-game tests: 57 passed. This completes the football reference journey; economy/election component consolidation remains a separate design pass.

## Economy and elections refinement — 14 September 2026

Implemented:
- Homepage economy/elections use the same section illustrations as their destinations. Images stay within their own space, with consistent mobile heights.
- Paused homepage economy action now opens the economy explanations; the methodology remains accessible there.
- Economy tile headings and status wrapping tightened; unavailable tiles no longer show decorative mosaics. The reading checklist has explicit small headings.
- Economy story charts render a separate narrow composition with the same values and scale. A clearly fictional working example on /marca/#economia-componentes exercises the real TileCard and StoryLineChart while the production feed is paused.
- Election summaries use quiet numeric typography and separators. Candidate colours identify candidates without colouring the main probability figures.
- Presidential archive controls are consistent pine buttons with selected states and adequate touch targets. Both rounds have archival headlines, preserving probabilities in the evidence below.
- Legislative archive context is explicit; polling charts use quieter, consistent grids and heights.
- Presidential interval chart removed an untranslated leader label, uses its provided interval translation and corrects the midpoint scale label. Its domain now accommodates intervals above 60% rather than clipping them at that ceiling.

Verification: desktop and 320/390px browser reviews, PT/EN pages, homepage-to-economy action, click/arrow-key topic changes, presidential round switching, polling chart and fictional economy chart render. No horizontal overflow in the tested 320px homepage/economy/election pages. Typecheck passed; focused lint had no errors; seven homepage configuration tests passed. The complete live economy dashboard could not be reviewed in a fresh-feed state because the real feed remains paused. No data was fabricated to bypass that guard.

Critical assessment:
- Stronger continuity now comes from common data hierarchy, control states and repeated visual subjects, not only the palette.
- The population cutaway and football ground still differ in detail and saturation. This is tolerable subject variation but not a perfectly uniform commissioned illustration family.
- Several long forecast pages remain dense and require better prioritisation of information. Adding illustrations or more card borders will not fix that.
- Methodology/long-form pages should remain quieter. Do not spread whole scenes into every panel.
- This pass is a coherent practical system, not a claim that every bespoke chart across the repository has been redesigned or independently validated.
