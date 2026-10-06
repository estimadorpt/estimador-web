# Liga Portugal: runbook, 2026-27

The routine is in CLAUDE.md ("Data Updates"); this file keeps the dates and the chores
that come once a season.

## After each round

Sync and deploy the next `mdNN` within 24 hours of a round's last game
(`./scripts/sync-data.sh football`, then the usual build and deploy). Until then the
reader's clock (`ClockSwitch`) says on the pages that the round was played and a new
forecast is in preparation, but the static meta descriptions of that round's match pages
still carry the pre-match odds, and that is what search results and link previews show.

A round's last kickoff is the latest `kickoff` among its fixtures in
`public/data/football/liga-2026-27/game_fixtures.json` (`matchdays[].fixtures[]`),
leaving out postponed leftovers: a game that kicks off after the next round has begun is
not the end of its round (J2's SC Braga – Gil Vicente on 19 October, after J8; J3's
Estrela Amadora – SC Braga on 10 September, after J4 began on 28 August). Taken literally,
the latest kickoff would put the sync weeks late. `frozenBeforePreviousRoundEnded` in
`src/lib/utils/prediction-game-record.ts` applies the same rule.

- **Matchday 8** ends with Famalicão – Alverca on Monday 12 October 2026 at 20:15 Lisbon
  time (19:15 UTC): md08 should be live by Tuesday 13 October, 20:15.

## Before 2027-28: season-scoped match addresses

Deferred in round 3 (audit SP2-07).

Match pages live at `/desporto/liga/jogo/{home-away}/` (`fixtureSlug` in
`src/lib/config/fixtures.ts`). The slug has no season, and played pages stay online and in
the sitemap, so the 2027-28 fixtures would take this season's addresses. Before the new
season's first fixtures are published:

1. Move match pages to `/desporto/liga/{season}/jogo/{home-away}/` (or a season-suffixed
   slug) and update every link builder (`fixtureHref`; `loadUpcomingFixtures` and
   `loadPlayedFixtures` in `src/lib/utils/football-data-loader.ts`).
2. Update `src/app/sitemap.ts` and the match-page grouping in `scripts/smoke-check.mjs`.
3. Check the share card: `NO_SECTION_CARD` in `src/lib/metadata.ts` excludes
   `/desporto/liga/\d{4}-\d{2}` (the season reviews) from the Liga card, so a season in the
   path would drop match pages to the general card unless the pattern changes.
4. Keep the old addresses working with small pages at the old paths: each answers 200,
   carries a canonical to the new address and has a first script that replaces the address
   (the 404's `locale-redirect` pattern). A 301 per match does not fit, at any point in the
   season: SWA cannot reuse a wildcard capture, so it takes one route per match and locale,
   about 170 bytes each in the config's own formatting (`JSON.stringify(config, null, 2)`,
   as `generate-og-images.mjs` writes it). The 72 fixtures of J1–J8 are 144 routes, about
   24 KB; a full season is 306 per locale, 612 routes, about 100 KB. The host's limit is
   20 KB and `staticwebapp.config.json` is already 16 KB, so about 4 KB are left. No
   shorter formatting saves it: the old and new paths alone are about 80 bytes a route,
   some 50 KB for a season. Letting the old paths fall to `/404.html` and its redirect
   script is not the same: a stub answers 200 with a canonical, so the played pages keep
   their standing in search; a 404 does not.
