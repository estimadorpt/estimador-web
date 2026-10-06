# Section illustrations

One painting family, four pictures: the three section scenes of 13 September 2026 and the
refined population house. Owner decision of 6 October 2026: finish the 13 September
direction, use nothing else. The governing art direction is
`docs/design/original-illustration-refinement/README.md` ("Latest revision — 13 September
2026") and `docs/design/browser-reference/HANDOFF.md`.

They are generated illustrations, not photographs of real people or places. They show a
generic setting for a section and must never be presented as geographical or documentary
evidence. None of them encodes data.

## The family

| Picture | What it shows | Files | Drawn by |
|---|---|---|---|
| Football | Pitch, goal and stand | `public/images/sections/football.webp` (720px), `football-360.webp` | `SectionIllustration scene="football"` |
| Elections | Polling place and ballot box | `public/images/sections/elections.webp`, `elections-360.webp` | `SectionIllustration scene="elections"` |
| Economy | Frontal neighbourhood shop | `public/images/sections/economy.webp`, `economy-360.webp` | `SectionIllustration scene="economy"` |
| Population | The house, with neighbours and trees | `public/images/home/population-{lead,square}-{size}.{avif,webp}` | `HomeArt name="population"` |

The three scenes came from the reviewed browser-reference prototype
(`docs/design/browser-reference/assets`); this note lived in `public/images/sections/` and
moved out so it is not published with the site. Each scene ships at 720px and at 360px for
phones (`sharp(src).resize({ width: 360 }).webp({ quality: 82 })`).

The house is the refined 13 September master,
`docs/design/original-illustration-refinement/03-people-v2.png`, saved as `population.png` in
`docs/design/homepage-claude-handoff/assets`. Both folders' PNGs are git-ignored (only
`manifest.json` is tracked), so the master lives in the owner's checkout.
`node scripts/generate-home-art.mjs` cuts it into the lead and square crops in
`public/images/home`; check that every crop keeps the house whole and centred when the master
changes. The 12 September homepage paintings (football, economy, elections) were deleted on
6 October 2026 and are in git history only.

## Where each one is used

| Picture | Page headers (`<PageHero illustration>`, eager) | Elsewhere |
|---|---|---|
| Football | Liga hub `/desporto/liga`, Liga simulator `/desporto/liga/simulador` | Homepage football panel, as an 80px accent |
| Elections | `/eleicoes/arquivo`, `/eleicoes/legislativas`, `/eleicoes/presidenciais` | Homepage elections panel |
| Economy | none: `/economia` is a page with a mint field | Homepage economy panel; a 96px accent beside the answer in the `/economia` explainer's reading card (from 640px up) |
| Population | none: population pages are data pages with a periwinkle field | Homepage population panel only (the lead column from 768px and a 90px thumbnail on phones; in election mode a 200px square, 72px on phones) |

Every other page goes without a painting, following the header table in CLAUDE.md ("Three
levels of expression") and on `/marca#ilustracao`. Data pages, dashboards and tools get a
compact tinted field. Reference, methodology and editorial pages are plain paper.
`/populacao/miniatura` has its own drawing, the village. Empty and error states, the 404
and brand material use the mosaic.

## Rules

- Keep pictures outside data panels: no estimate, label or control sits on an image, and a
  picture never sits beside a chart.
- No painted residents on population data pages: the house appears on the homepage and on
  `/marca`, nowhere else.
- A painted hero is the page's largest paint: `<PageHero illustration>` passes `priority`,
  which preloads the image and loads it eagerly at high priority. Sizes and phone crops are
  in `globals.css` (`.section-illustration`, `.illustrated-hero`).
- Downloads and usage guidance for the family are on `/pt/marca/#ilustracao` and
  `/en/marca/#ilustracao`.
