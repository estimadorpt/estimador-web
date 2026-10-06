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
`public/data/football/liga-2026-27/game_fixtures.json` (`matchdays[].fixtures[]`).

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
4. Keep the old addresses working: one 301 per current played or upcoming match (about 70
   per locale, roughly 7 KB). `staticwebapp.config.json` is about 16 KB of the host's 20 KB
   limit and SWA cannot reuse a wildcard capture, so if the list does not fit, keep the old
   addresses as small pages whose first script replaces the address (the 404's
   `locale-redirect` pattern) with a canonical to the new one.
