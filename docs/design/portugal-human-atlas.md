# Portugal: the human atlas

The national entry point is `/pt/populacao/` (also English). It replaces the miniature link in the main navigation and homepage CTA. The miniature remains available at its existing route.

## Delivered journey

- Mainland districts plus Açores and Madeira, using the existing repository TopoJSON. Island geometry is repositioned in that source; the interface states this. Point locations are deterministic illustrative placements within boundaries, never home coordinates.
- Select a district or autonomous region to zoom and highlight its fictional population. The native place selector provides an alternative to map interaction.
- Switch territory → people: persistent identities animate to age, education, employment or transport groups. The mobile distribution uses two columns.
- Compare any two districts/regions or Portugal using normalized 100-dot crowds and percentage bars, with explicit denominators and rounding notes. These crowds summarize distributions; they are not individual identities.
- Combine age, employment and living-alone filters. Zero-match states show no household link. The three story prompts set complete, consistent perspectives.
- Open a matching household at the selected person; return to the exact atlas perspective, including filters and comparison. Saved URLs carry and validate the fixture revision.
- Pause ambient map motion; respect reduced-motion preferences. Copy the current perspective to share.

## Data boundary

This is an interface preview, not a publication of the generated national population. The 1,004 fictional atlas people are distinct region-scoped copies of complete existing demo households, selected deterministically without regional census inputs. Regional totals and differences must never be presented as findings. Fixture-only fields are isolated in `src/lib/atlas/population.ts`.

The miniature fixture revision is now `miniatura-demo-v2`: singleton ages span young adulthood through old age, allowing the older-people-living-alone story to return meaningful invented examples. Old revision links show the existing version notice instead of silently substituting changed data.

Inspected the producer output schema and public query contract. Geographic schema fields include district, município, freguesia and NUTS2, but the current public contract names Portugal, município and freguesia. District aggregates and arbitrary combined filters will need producer-owned release responses and quality/publication rules before connecting real data. The frontend fixture filters are not a proposed authorization mechanism.

The next integration requires approved release metadata and public aggregates, validated geographic joins, allowed filter combinations, suppression/fallback handling, and a separately authorized illustrative household mechanism. No unpublished microdata, release decisions or generation jobs were touched. Municipality and parish boundary drill-down is implemented with the public CAOP 2021 geometry. Local population statistics remain unconnected; the illustrative profiles and comparisons explicitly remain at district level.

## Verification

Automated checks cover complete households, unique region-scoped identities, national total conservation, combined filters, zero results, normalized distributions, input validation and perspective round-trips. Browser checks cover desktop and phone layouts, district zoom, map-to-distribution transitions, comparison, zero matches, the older-person story, household navigation and return, and saved state.

## Geographic hierarchy

The source is the public DGT CAOP 2021 shapefile collection already present in the microsynthesis repository, aligned to the census vintage. `scripts/build-atlas-geography.py` dissolves multipart records into 3,092 unique parishes and 308 municipalities, simplifies the boundaries for the browser, and exports district-sized municipality files and municipality-sized parish files. It reads no population records.

District/region → municipality → parish works through both map clicks and cascading selectors. Parent changes clear descendants. Breadcrumbs navigate back. Saved links and household return links retain the validated full path. Açores and Madeira are supported as autonomous regions. Administrative names and unions are explicitly the 2021 vintage, not asserted as current boundaries.

Municipalities with distant parcels (notably Funchal) initially frame the main cluster; a visible control includes the complete territory. All source parts remain in the exported geometry. Local maps show actual boundaries, while population filters and comparison retain explicitly labelled district-level fixture scope.

## Living zoom

The local boundary view now retains the selected district's demo residents throughout municipality and parish exploration. These are explicitly the same illustrative cohort following the camera, not invented parish population estimates. Stable person keys and deterministic home anchors preserve identity across views. At parish scale dots become walking figures and buildings; houses open inline household details and focus the camera without leaving the atlas. The national map remains mounted behind the local scene during its entrance. Loading a child boundary retains the previous scene rather than clearing its residents.

Movement, window lights, roofs and connecting paths are illustrative. Home anchors are sampled inside the public geographic polygon; they are not addresses, observed settlements or inferred commuting routes. Pause and reduced-motion settings cover residents and windows. The inline household inspector navigates only the homes in the illustrated cohort.

## Camera-led revision

The local journey uses a single Mercator coordinate space across district, municipality and parish boundaries. A 1.4-second interpolated camera flight changes the viewport instead of replacing each map with an independently fitted drawing. Parent municipality geometry stays in the scene for orientation. Household selection moves the camera to the selected home, and direct dragging pans the local view. Reduced-motion preferences skip camera flights.

The territory view now occupies the full exploration surface; place selectors and profile details live in an optional drawer. A visible scale indicator follows district, municipality, parish and home. Demo resident dots are sampled independently, replacing the old lines of household dots. Fine background marks are decorative geographic texture, not population counts or settlement-density estimates. Homes, paths and walking figures emerge at parish scale; their placement remains fictional. The country-to-district handoff still uses a separate national layer; only the local hierarchy shares the fixed coordinate space.

Browser checks caught and fixed invisible home hit targets intercepting municipality clicks and browser focus outlines expanding with the map. Desktop checks covered Lisboa → Lumiar → household details; the phone layout and drawer were also inspected. Camera tests verify framing for tall, wide and degenerate extents and centering a home at geographic coordinates.

## One-world revision (10 September)

The territory journey now uses a single persistent map from country through district, municipality and parish to household. Country outlines are dissolved from the same CAOP exports, with islands at their geographic coordinates. Camera translation and scale change; parish homes do not get resampled, resized to the current parish extent, or faded between levels. Parish scenes are prepared when a municipality loads and retained while navigating out. Off-screen scenes are culled; details smaller than a few pixels are simplified at the same coordinates. Building drawing units are shared across all parishes.

“Conhece um agregado” opens the existing household inspector in the atlas and focuses a home in the current parish. If no parish has been selected, it chooses a documented illustrative destination in the matching region (first municipality/parish in the geographic index). It does not assert a real residence. Household and person selection are included in the atlas URL. Old miniature links containing a valid parish return perspective redirect to that atlas household. The standalone miniature remains available for independent demo links. The separate People and Compare charts retain their statistical purpose.

Scenery profiles cover all 3,092 CAOP entries and are generated by `scripts/build-atlas-scenery.py` from INE’s public Censos 2021 section-summary workbook. Parish total rows are used once, not summed with section totals. Urban design: >=1,500 residents/km² or >=55% buildings with 3+ dwellings; rural design: <300 residents/km² and <20% such buildings; town otherwise. These are explicit illustration rules, not official TIPAU classifications. Building heights use the share of 5+ floor buildings. Warmer rural colours south of 39.5° are an art direction rule, not measured vegetation or climate. Coastal proximity is independent of settlement type, approximately 500m from the derived water layer; estuaries are included.

Water context uses Natural Earth 1:10 million land v5.1.1, unioned with all exported Portuguese parish polygons so coarse coastline geometry cannot flood parish land. This is approximate regional context, not surveyed shorelines. Houses, streets, vegetation and walking routines are illustrative, not addresses or land-cover observations. Scene-level source disclosure links to [INE BGRI 2021](https://mapas.ine.pt/download/index2021.phtml) and [Natural Earth land](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/). No synthetic release or private microdata is exported.

Checks cover profile coverage, example urban/rural/coastal matches, land/water exclusion for mainland and island sample points, consistent world units and home positions, and camera framing. Browser checks observed a changing camera transform while the same home transform and scene opacity remained fixed, verified household URL continuity and old-link redirects, and inspected desktop and phone scenes.

## First-visit and camera performance revision

`build-atlas-scenes.mjs` bakes parish home positions and greenery into municipality-sized assets, plus lightweight district overviews. Runtime scene preparation no longer performs rejection sampling or reconstructs every previously visited parish. The district overview uses exactly the same home coordinates as the close-up, verified for all 3,092 parishes. Overview marks remain illustrative households, not actual dwelling locations or density estimates.

Camera animation writes the parent SVG transform directly; React commits the settled view instead of rerendering the world on every frame. Geometry paths are cached by feature identity. Distant views use overview marks, with detailed buildings drawn only at visible scales. Labels and ambient ornament animations are suspended during flights. Debug frame counts and maximum frame intervals are recorded on the camera group for browser verification.

The opening camera now frames mainland Portugal. Separate Açores and Madeira shortcuts travel to the islands at their real coordinates; “Ver todo o território” restores the full geographic extent. This avoids shrinking the mainland merely to include the Atlantic distances.

Production-preview verification: a fresh Bragança visit displayed 226 parish overview groups before loading any detailed parish scene. The district-to-municipality camera recorded 131 animation callbacks with a maximum interval of 15ms on the test machine. This is a local measurement, not a cross-device performance guarantee. Mainland framing, return navigation and the Açores shortcut were inspected in the browser; 251 tests and the static production build passed.

### Tagus shoreline correction — 10 September 2026

The previous Natural Earth water backdrop and CAOP administrative land did not share a coastline. At Lisbon scale this produced dark wedges around the south bank, while administrative areas extending into the river looked like solid ground. The Tagus context now uses paired land/water geometry derived from OpenStreetMap coastline ways (snapshot 2026-09-10). Water is the exact complement of simplified physical land inside the context extent. Administrative parish outlines remain unchanged and can legitimately extend into water.

`build-tagus-context.py` creates the context and dry-land scene overrides; `build-atlas-scenes.mjs` applies the overrides to the affected parish illustrations and district household previews. Homes retain identical positions between overview and close-up. Detailed coastal backdrops recede continuously at wide camera scales so their rectangular coverage is not presented as geography.

The context, dry-land overrides, and affected derived scene geometry contain OpenStreetMap data, © OpenStreetMap contributors, under ODbL 1.0. See `scripts/data/README-tagus.md` for reproduction and attribution. Regression checks cover known land/water locations, complementary coverage, and all affected prepared household positions.

### Transition performance — 10 September 2026

A production-browser check at Olivais (110633) found 20,301 SVG descendants and a 1,542 ms maximum frame gap on zoom-out. Neighbouring parishes no longer instantiate fully animated residents, trees and detailed architecture; compact buildings retain facades, windows and roof shapes. Detailed life remains in the selected parish. Camera flights now update the CSS transform, ignore identical destinations and take 650–1,350 ms according to travel distance (previously 1,800–3,200 ms). The same production zoom-out measured a 15 ms maximum gap; zoom-in measured 28 ms before the compact facade refinement. These are local browser measurements, not device-independent guarantees.

Final production retest with compact facades: Olivais → Lisbon maximum frame gap 25 ms (67 frames); Lisbon → Olivais 42 ms (64 frames); parish → household 83 ms (33 frames). Household drawer, roof opening, and member details verified visually. All 256 tests, targeted lint, and production build pass. The household transition still has more work than geographic zoom, but the previous multi-second stall was not reproduced.

### Display boundaries on physical land

The parish-selection outlines now reuse the prepared dry-land scene paths. This removes administrative water extensions from the visible/clickable parish outline without changing the source administrative files or moving any coordinates. Original Belém CAOP geometry (EPSG:3763, reprojected to EPSG:4326) has approximately 46.3% overlap with the Tagus water mask; its browser-export polygon has 98.946% intersection-over-union with the source and only 0.0000476 degrees centroid displacement from simplification. The apparent offshore shift is present in the administrative source, not introduced by a separate camera transform. Verified the corrected Lisboa view in the production preview; lint and production build pass.
