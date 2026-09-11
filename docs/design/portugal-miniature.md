# Portugal em miniatura

Implemented in the existing Next.js application at `/pt/populacao/miniatura/` and `/en/populacao/miniatura/`. The homepage and navigation link to it. No national records were imported, no microsynthesis jobs were changed, and nothing was published externally.

## Experience

- Thirty individually selectable homes and 100 persistent fictional people.
- Four Portuguese landscapes: Alentejo countryside, Atlantic coast, urban blocks and a mountain village. Each has distinct terrain, architecture and movement (windmill, sailing boat, tram, stream and birds). These change buildings and positions, not the population or its statistical distributions; they are not geographic estimates.
- Household selection focuses the camera and lifts the roof. Members can be inspected independently. Household selection is also available through a keyboard-friendly native selector.
- Bounded camera dragging, zoom controls, reset, pause, reduced-motion support, and a guided transformation sequence.
- Age, education, employment and transport lenses. Distribution buttons highlight the same people in the neighbourhood and in grouped views. Household-size grouping uses the same membership records.
- Household and person details; no inferred household head, family relationship or daily routine.
- PNG and self-contained animated SVG postcards. The selected view, neighbourhood, lens, household and distribution group are represented in the scene. Links retain the selected view, layout, lens, household and group, plus the demonstration revision. Files retain fictional-data labels.
- Responsive grouped views and a non-animated table alternative.

## Field mapping and publication boundary

Inspected the sibling microsynthesis repository's `docs/STATE.md`, `docs/public/model_card.md`, `docs/public/public_query_contract.md`, and `src/portugal_synthpop/synthesis/output_schema.py` on 8 September 2026. The national release remained deferred. Schema presence is not a guarantee that a field will survive release packaging, have a non-null value, or support a particular public query.

| Interface concept | Producer schema concept | Current implementation |
| --- | --- | --- |
| Age, sex | `age`, `sex` | Invented, deterministic fixtures |
| Education | `education_level`, `education_level_coarse5` | Simplified invented categories; school-age grouping is a presentation category |
| Employment | `employment_status`, `employment_status_coarse3` | Invented employed / unemployed / inactive categories |
| Transport | `transport_mode_code` | Invented grouped labels with a not-applicable category |
| Marital status | `marital_status_code` | Invented labels; no relationship inference |
| Work location type | `work_location_type_code` | Invented labels; not applicable for non-employed people |
| Household membership and size | `synthetic_hh_id`, `hh_size` | Persistent fixture IDs and exact membership |
| Rooms | `n_divisions` | Invented values |
| Tenure | `tenure_status_code` | Invented owned / rented labels |
| Building period | `building_period_code` | Invented broad periods; buildings are schematic |
| Heating, elevator, accessibility | `heating_type_code`, `elevator_code`, `accessibility_code` | Invented labels; final national availability not asserted |

The visual attributes are not producer code-label mappings. A production adapter must read the final released dictionary, preserve unknown and unavailable values, and validate the release-pinned public response before supplying any real population statistic. Record-level access needs the released microdata policy; aggregate query approval alone does not authorize arbitrary individual drill-down. Institutional residents have partial records and must not silently receive fixture defaults.

Do not infer names, addresses, coordinates, commuting paths, family ties or real daily behavior. Do not claim rankings, trends, or causal effects from this demonstration. No donor/seed records or internal source identifiers are exposed.

## Verification

Tests cover population conservation, household membership, all distribution partitions, compact chart bounds, neighbourhood/member alignment, unsupported saved views, and workplace applicability. Browser checks cover household selection, member changes, housing detail, distribution highlighting, responsive layouts, saved views, English navigation, postcard previews, and downloads. The full application test suite is also run before delivery.
