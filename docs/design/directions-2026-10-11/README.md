# Design directions, 11 October 2026

## Outcome

The owner chose **Instrumento** (finalist 1 below) on 11 October 2026, with four amendments:

1. **No name in the masthead or on share cards.** The owner's name stays in the footer's credit
   line and on `/sobre` only.
2. **The logo is revised, not replaced.** Its composition stays (caps on whiskers, a band, the
   name with ".pt" in grey), but the band became a square block with a median slot, the drawing
   the pages use for the model's margin. Eight revisions are in `logo/` (sheets and drop-in JSON
   in `variants/`); the owner picked "4. Median-slot mark + IBM Plex Sans 700".
3. **IBM Plex Sans, in one width.** The pick was made from seven type pairings in `type/`; the
   condensed display cut was dropped, so headlines, figures and text share one family.
4. **One decoration, from the instrument.** A ruler's edge under the header and on the footer's
   rule was proposed in place of the retired mosaic; it awaits the owner's call.

What shipped, and the rules that hold it, are documented in two places:
- `/marca`, the design system's reference page, built from the live components;
- the "Design Language" section of `CLAUDE.md`, for anyone changing the code.

The September system (cream, pine, Manrope, rounded cards, pills, uppercase kickers, paintings,
the mosaic and question headlines) is gone from every page, the share cards and the social kit.

Why: friends shared the site and called it "vibed", with a "Claude-ish aesthetic"; the owner agreed. This folder holds
the exploration that followed: eight directions, each mocked with real data, challenged, revised and judged, and
the three finalists in full.

## How it was run

One multi-agent workflow (58 agents):

1. **Research**: 15 reference publications (FiveThirtyEight, Economist, FT, Upshot, OWID, Pudding, El País, Público…),
   a checklist of 34 "AI tells" found on the live site, and an inventory of what estimador owns.
2. **Generate**: eight directions, each building `mock-home` and `mock-liga` at 1440 and 390px from the real md08 and
   population files.
3. **Challenge**: four adversarial critics per direction: the WhatsApp friends (AI-tell spotters), a newspaper
   graphics editor, the engineer who must ship it, and a Portuguese reader / brand strategist. Only two of the 32
   critiques said "keep"; every direction was sent back for revision.
4. **Revise**: each author answered its critics and re-rendered.
5. **Judge**: three judges (the friends, a design director, the owner) ranked all eight from the renders; Borda count;
   a selector picked three distinct finalists.
6. **Finalize**: each finalist added a parish page (Misericórdia), a link-preview card and an implementation plan.

Prototype A (the white/Inter re-skin on this branch) was judged "a re-skin, not a redesign": it removes the paintings,
cream and radii but keeps every structural and copy tell (question headlines, eyebrow → headline → lede, the 2×2
bento with an empty economy card, middle-dot status chains) and adds a zero-config Tailwind/shadcn neutral look.

## Ranking (Borda across 3 judges; scores out of 100)

| # | Direction | Borda | Scores (friends, design director, owner) |
|---|---|---|---|
| 1 | The instrument | 24 | 82, 81, 84 |
| 2 | Cartographic atlas | 19 | 79, 75, 79 |
| 3 | Plain white, done right | 18 | 76, 77, 77 |
| 4 | Broadsheet | 17 | 74, 74, 81 |
| 5 | Probability-native | 11 | 64, 73, 73 |
| 6 | Portuguese modernist | 10 | 68, 71, 71 |
| 7 | Swiss grid | 6 | 57, 61, 67 |
| 8 | Scoreboard | 3 | 57, 58, 62 |

Plain was left out as a near-duplicate of the instrument (same condensed-sans skeleton; it is the cheapest fallback,
about 14 days). Broadsheet was left out as a near-duplicate of the atlas (serif findings on white; the atlas adds the
map); it is the calmer alternate to the atlas. Probability fails the crop test (reads as prototype A plus dots).
Modernist was taken from sixth for spread: it is the only loud, coloured family left.

## The three finalists

### 1. Instrumento (o nónio): `instrument/`

A measuring instrument for Portugal: black on white, findings as headlines, and one grammar of three marks on every
page, printed as a legend in the masthead and footer.

- **Black square:** what already happened.
- **Yellow band #FFD400 between ink caps:** the model's 90% margin.
- **Lone tick:** a single run with no margin (every synthetic-population figure).

The logo is the same glyph: "estimador.pt" in condensed Archivo on a ruler with one reading drawn on it. Archivo
(condensed 800 for headlines and figures) plus Source Serif 4 only in the signed note; no monospace.

Signature content:
- "O que dissemos e o que aconteceu": 59 games, 14,2 draws expected, 14 happened.
- Club-side stakes: "Título do Porto: 55% se ganhar, 43% se empatar, 39% se perder".
- Backtests labelled as backtests.

Risks:
- Black, yellow and odds can read "apostas", so a five-reader test is a gate.
- The yellow never appears on parish pages, by design.

Effort: about 17 days for the switch, 43–48 for the whole site.

### 2. Carta (atlas): `atlas/`

A national atlas of estimates: the real CAOP 2021 lace of 3 092 parishes as the homepage hero.
- Açores and Madeira insets, coordinates on the neatline, water-lining.
- Today's four Freguesia misteriosa parishes overprinted in magenta #b0106a. Magenta means "the newest thing" and
  nothing else.

Where there is no geography (the Liga), a cartographer's data map: a Bertin proportional-square matrix of where each
club can finish. Spectral (findings, and the italic "hand" for annotations) over Encode Sans.

Risks:
- Off the maps it can drift to "a serif newspaper", Claude's second default. Rule: every page carries one vocabulary
  object (sheet, matrix, coupon, interval glyph, ringed record) on its first screen.
- The daily label placer needs a test over all 3 092 days.

Effort: 9–11 days for the first PR, 40–50 for the whole site.

### 3. Cartaz (Portuguese modernist): `modernist/`

A 1960s Portuguese two-colour print job: black ink plus one ochre #CC9A2E, used in exactly two places (the masthead
plate and the population plane with the parish lace). Every other colour belongs to the data.

Portuguese printed grammar:
- an ERC-style ficha técnica instead of status lines;
- Totobola 1·X·2 with no pick;
- numbered "Quadros" with a "Fonte:" line, as in the Anuário Estatístico;
- archive in hatch and live in colour;
- the interval as an architect's cota (dimension line).

Sofia Sans and Sofia Sans Condensed, with Source Serif 4 for the signed note.

Risks:
- The ochre is close in hue to the old gold, so the owner must see `ochre-vs-live-og.png` (in the scratch run).
- Club-colour strips need the same five-reader test.

Effort: 6–7 days for the first PR, about 28–32 for the whole site.

### Shared content (any skin)

The selector's set critique: all three finalists carry the same Liga content, and the choice is a skin, not a
product. That content should ship whatever is chosen:
- findings as headlines, with absolute Lisbon dates (no "hoje" in a static export);
- the published record against itself;
- club-side "em jogo" stakes;
- the model-vs-market difference drawn with its band;
- the title-calibration caveat tied to the case;
- no question headlines, eyebrows, pills or bento.

The signed matchday note only works if the owner writes it; otherwise the slot must disappear, not be generated.

## Files

- `comparisons/`: side-by-side sheets: `finalists-home-desktop.png`, `finalists-mobile.png`,
  `finalists-liga-mobile.png`, `finalists-parish-mobile.png`, `finalists-og.png`, and `eras-home.png` (May 2025 →
  Jan 2026 → live → prototype A).
- `<finalist>/final-{home,liga,parish}.html`: self-contained mocks (fonts from Google Fonts); open them in a browser.
- `<finalist>/final-*-{desktop,mobile}.png`: 1440×900 and 390×844@2x folds.
- `<finalist>/final-og.png`: the 1200×630 link-preview card.
- `others/`: the v2 homepage and Liga renders of the five directions not selected.
