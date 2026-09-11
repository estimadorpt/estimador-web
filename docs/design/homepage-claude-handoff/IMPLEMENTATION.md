# Implement the illustrated Estimador homepage

## Decision and scope

Implement the approved **first image / variation 2B** hierarchy: a large population feature, a narrower football panel, then smaller economy and election entrances. Do not implement four equal tiles, a magazine cover, or a full-screen scene. Keep the established logo, palette, typography, header and footer.

The reference image is `layout-reference-2b.png`. It establishes hierarchy, NOT authoritative copy, data, controls or branding. Use the simpler illustrations supplied in `assets/`, not the detailed pictures embedded in that reference.

The user explicitly wants the hierarchy to change during election coverage. Make placement editorially configurable without rebuilding the homepage architecture. Default to normal mode now. Do not switch simply because an old election is present in the data.

Population is a synthetic-data foundation for research, teaching and future microsimulation. Do not describe it solely as finding people like yourself. Do not imply that a policy simulation engine, representative national dataset or downloadable microdata is available until the actual application supports those capabilities.

## Existing code to inspect and reuse

- `src/app/[locale]/page.tsx`: current server-side homepage, loaders, dated Liga lead and repeated summary. Preserve useful loading/formatting logic; replace its composition.
- `src/components/miniatura/HomeMiniature.tsx`: currently owns the oversized village-led introduction. Remove its use from the new homepage; preserve it and the standalone atlas/miniature experience for other uses.
- `src/components/Header.tsx`, `src/components/SiteFooter.tsx`, `src/components/Logo.tsx`: reuse unchanged.
- `src/components/brand/Action.tsx`: 48px actions, appropriate existing variants.
- `src/lib/brand/geometry.json`, `src/lib/brand/index.ts`, `src/app/globals.css`: existing identity and tokens. Never redraw the logo from the image.
- `src/lib/utils/football-data-loader.ts`: `loadLigaSummary`, `loadLigaWithDeltas` and existing data readiness.
- `src/lib/utils/data-loader.ts`: `loadEconomyDashboard`.
- `src/lib/utils/economy-time.ts`, `src/components/economics/HomeEconomyFreshness.tsx`: retain paused/stale handling, including the client-side freshness guard where needed.
- `src/lib/config/sections.ts`, `src/lib/config/elections.ts`: existing section/election metadata. Do not equate a generic section `isActive` value with current data availability.
- `src/lib/mdx-articles.ts`: actual published, locale-specific articles only.
- `messages/pt.json`, `messages/en.json`, existing i18n Link and metadata helpers.

Use a small set of homepage-specific components if that improves clarity. Do not introduce a new general-purpose design system, charting library, CMS, animation framework or dependency for this change. Preserve other work in this dirty checkout.

## Composition

At >=1100px:

- Reuse existing header (about 68px), then 24–32px breathing room. No new giant slogan/hero above the main features.
- Centred max-width about 1280px, 24px side gutters. First row is approximately **2fr 1fr**, with a 24px gap. Population should clearly be the main feature. Aim for a first-row height around 430–490px with real copy; allow content to determine height rather than clipping it.
- Population feature: content left ~55%, illustration right ~45%. Title, short description, one main action, one secondary route. Never put text on top of the picture.
- Football rail: compact stadium art (roughly 120–150px high, whole object contained), a current question/finding, actual probabilities/date, and a strong scenario action.
- Second row: two equal smaller horizontal panels, economy and elections, roughly 210–260px high at desktop. Within each, small art and text sit side by side. These panels are equal to each other, not to the first-row panels.
- A short research/methods link or real published article may follow. Do not add filler to lengthen the page.
- Reuse footer. No repeated full-width Liga lead plus repeated top-three cards: express the current finding once inside the football panel.

At 768–1099px:

- Keep the asymmetry only while text/control widths remain comfortable. Otherwise stack the lead above the rail; the rail can become a horizontal panel.
- Smaller panels may remain in two columns if neither text nor controls is cramped.

At <=767px:

- One column in semantic order: lead, secondary, supporting sections.
- 16px outer gutters, 16–20px panel gaps, 20px panel padding.
- Use one concise title/description and keep the lead action visible without scrolling through a tall illustration. Place a contained 140–180px-high illustration alongside or immediately after the opening text; do not shrink an entire busy scene.
- Football art 100–140px. Lower illustrations 100–140px or compact side-by-side at widths where text still fits.
- No fixed panel heights, horizontal page overflow, hover-only meaning, or desktop CSS order that disagrees with keyboard order.

## Mode model

Add one explicit, typed configuration, for example `src/lib/config/homepage.ts`:

- `mode: 'standard' | 'election'`
- Standard: lead population, secondary football, supports economy + elections.
- Election: lead elections, secondary population, supports football + economy.
- Election mode identifies an existing election by its actual configured ID. Never infer a new route, election year or date.
- A current election feature requires valid source data and explicit editorial activation. If its data are absent/stale, show an honest unavailable/archive state or fall back to standard layout; never style an old archive as live.
- Reuse the same section components with lead/secondary/support presentation variants. This is a placement change, not two unrelated page implementations.
- No public mode switch: it is an editorial setting. A test fixture or local preview may exercise the other mode.
- The user can later change the mode with one documented config edit. Explain how in a short code comment/README.

## Content and actions

### Population

Suggested PT title: **“Um país de pessoas. Uma base para investigar.”**

Suggested description: “Explora a população sintética e conhece os dados e métodos que preparam futuras microssimulações.”

- Main action: “Explorar população” → existing `/populacao` route, locale-aware.
- Secondary: “Dados e métodos”. Verify an appropriate existing destination. If no population-specific methods/research page exists, use an inline disclosure with accurate current scope, synthetic-data status and future intent, plus the existing methodology link. Do not create a dead link or route people silently to an unrelated methods page.
- Keep a readable status: “Demonstração · microssimulação em desenvolvimento” while this is true.
- Distinguish synthetic households from actual individuals; do not imply real addresses or identifiable residents.
- Avoid decorative “Pessoas / Agregados / Territórios” or “Explorar / Investigar” tabs unless they actually alter the preview or navigate into a supported state. Two honest routes are better than duplicate inert controls.

### Football

- Use one actual, dated finding from existing published data. Reuse current safe lead logic, but shorten it to fit the rail.
- Clearly label `p_champion` as **probability of being champion**, never next-match win probability. The prototype 2A got this wrong; do not copy it.
- If using three club values, derive all of them from the same snapshot and preserve club identity colours only as small data accents, not panel-wide branding.
- “Experimentar resultados” → existing `/desporto/liga/simulador`; optional quieter link to `/desporto/liga`.
- No hard-coded 55/22/22, fixtures, dates, scores or movement numbers. The reference image's bottom score/update was invented by image generation and must not be used.
- Avoid a club selector unless it really updates relevant visible data and/or passes a supported state to the destination.
- Missing source data: show a graceful route into methodology/archive with no invented numeric output.

### Economy

- Keep the market illustration even if the current dashboard is paused. The section has an educational purpose as well as a data status.
- If fresh data exist: one actual current finding + update date + link to `/economia`.
- If paused: meaningful title such as **“Perceber a economia, para lá do número.”**, compact honest pause status and “Como lemos os indicadores” → `/economia/metodologia`.
- Do not advertise an inflation explainer or interactive price calculator unless it has actually been published/implemented. If a relevant real article exists, select it through the article loader.
- Preserve all existing protections that prevent stale values appearing current. Do not turn a pause into a loud error panel that dominates the homepage.

### Elections

- Standard mode: title such as **“Dos votos aos lugares.”**; short archive invitation; clearly dated existing 2025/2026 links, using configured elections.
- Confirm whether a destination contains results or forecasts and label it accurately. “Arquivo de previsões” must not become “Resultados” simply because voting has ended.
- Election mode: lead with the selected current election, real update time, carefully labelled forecast/results state, and a single strong action. Reuse the same illustration at a larger contained size. Keep methodological uncertainty visible.
- Do not fabricate an election calendar, live result, candidate, constituency or outcome. Do not infer party seat totals from the decorative assembly illustration.

## Illustration asset contract

Four supplied PNG masters are named `population.png`, `football.png`, `economy.png`, `elections.png` under `assets/`. Check `assets/manifest.json` for actual dimensions when available.

- These are simple editorial artwork, not screenshots. No UI text should be embedded or recreated from images.
- Copy source masters to an appropriate project asset location and generate responsive WebP/AVIF versions using the existing Sharp dependency. The masters can remain in this handoff folder; do not ship unnecessarily large PNGs to every browser.
- Use explicit width/height or aspect-ratio to prevent layout shift. Use `object-fit: contain`; never stretch. Preserve the safe margin and entire meaningful subject. Keep the cream field visually continuous with the panel.
- Start with ~480px and ~960px widths; inspect output quality and choose the smallest usable files. Target roughly <=150KB per desktop derivative where practical; do not destroy clean edges to reach an arbitrary number. Avoid requesting all four largest files on mobile.
- First-row lead art can load eagerly; load lower art lazily. Avoid giving every image high fetch priority.
- Artwork is decorative when adjacent text gives the same section meaning: empty alt in that case. If the image itself conveys indispensable information, provide concise localized alternative text.
- Do not animate an entire raster illustration, add fake charts over it, or make it pretend to show model results. No perpetual wiggle/bounce. Real user-driven transitions may use 150–220ms, respecting reduced motion.
- Retain the approved existing vector logo, exact palette and real club assets. Do not derive logos or icons from image-generator approximations.

## Design rules

- Paper page, cream panels, 16px corners, thin line borders, minimal/no shadows.
- Manrope throughout interface. Titles 700/800, body 400/500, small labels >=11px; body normally 15–16px.
- Actions use the existing Action component; 48px targets; segmented controls only if functional, >=44px.
- Supporting text must remain legible. Do not make important status, source, time or action text faint merely to look refined.
- Four subjects receive equal illustration quality, but intentionally unequal area.
- Keep the page website-like: straightforward reading order, concise text, obvious links, fresh previews, no giant poster headline, handwriting, scattered marginalia or magazine-like overlapping elements.
- Keep semantics, headings, main landmark, skip link and keyboard focus intact. The live homepage currently has an oversized HomeMiniature; removing it must not remove the page h1/main target. Give the new homepage exactly one meaningful h1 (the lead heading can serve) and a stable main-content ID.

## Acceptance checklist

1. Normal mode clearly has a 2:1 hierarchy; all four subjects receive visible illustrations. No repeated football story.
2. Population explicitly includes research and future microsimulation, with honest current readiness and valid actions.
3. All visible numbers come from current loaders; dates and forecast/result labels are accurate; stale economy behaviour remains intact.
4. Election mode can be activated through one explicit config value and a valid election ID. Verify both modes with fixtures, including no-data fallback.
5. PT and EN render complete copy; all links work; no generic placeholder controls, fabricated articles, scores or missing routes.
6. Check 1440, 1024, 768 and 390px widths, and 320px for overflow. Verify real images, cropping, long English labels, focus order, keyboard activation, reduced motion, and slow-loading images.
7. Run typecheck, lint, tests and production build. Add focused tests for mode/data-state selection where useful; do not test decorative class strings.
8. Verify the built export in the browser, not a stale server directory. Click the main population/research, football, economy and election paths. Check browser console and missing assets.
9. Run the existing smoke check against that fresh preview. Report exactly what was checked and any remaining limits.
10. Implementation scope is the homepage and reusable pieces required by it. Do not redesign all destination dashboards or deploy without a deployment request.

## Suggested execution order

Inspect source and readiness → prepare responsive assets → implement section variants and explicit mode config → compose standard mode → exercise election mode → localize and audit destinations → run checks → browser verification → report concise results.
