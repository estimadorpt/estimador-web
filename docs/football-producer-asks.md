# Liga Portugal: asks for estimador-football (2026-10-06)

Found while fixing the Liga pages in round 3. None blocks a publication; each says what
the website does meanwhile and what would let it stop.

1. **Per-club conditionals for the decisive matches.** `decisive_matches` keeps, for each
   game, only the club whose title chances swing most (the loop in
   `src/liga_predict/analysis/scenarios.py`, about lines 128–144, computes H/D/A
   conditionals for every contender and keeps the best). Emit them for each contender, so a
   club page can list its own decisive games: Sporting's two games with Porto (J12 away,
   J29 at home) are missing from Sporting's page today (FA2-02). *Web:* a club page lists
   only the games whose `most_affected_team` is that club (`titleDecisive` /
   `relegationDecisive` in `src/components/charts/football/DecisiveMatches.tsx`), else its
   own games that swing another club's race.
2. **Immutable matchday snapshots, and a `probs_source` that resolves to one.** An
   `mdNN.json` is regenerated in place, so its `timestamp` is the last regeneration, not the
   first publication, and `probs_source` (`md07.json@10877c9`) names a commit, not a file a
   reader can fetch. Publish each version under its own name (for example
   `md07-10877c9.json`) and point `probs_source` at it (FRESH-02, FA2-04). *Web:* treats
   `game_fixtures.json`'s `published_at` as the record of when a round's odds went out.
3. **Freeze a round's odds only after the previous round's last game.** In 2026-27 the odds
   of matchdays 3, 5, 6 and 7 were frozen while the previous round was still being played,
   so they miss up to half of its results (FA2-04). *Web:* names those rounds on
   `/desporto/liga/dados` and `/jogo-previsoes` (`frozenBeforePreviousRoundEnded` in
   `src/lib/utils/prediction-game-record.ts`), and the game scores them as frozen.
4. **Fill `probs_source` for matchdays 1 and 2.** Both rounds have published odds but no
   source on any game. *Web:* says so on `/desporto/liga/dados` (`roundsWithoutSource`).
5. **Name the third-party fields in each file, and confirm the xG provider.** The site
   now publishes its own model outputs under CC BY-NC 4.0 and marks, per file on
   `/desporto/liga/dados`, the fields it cannot license ("Fora da licença": SofaScore match
   statistics and results, FotMob xG, Transfermarkt injuries and values, bookmaker-derived
   market fields), from the provenance it knows (PRO3-03). The xG behind `xpts_table` (md
   files and `review.json`) is now named as FotMob's everywhere on the site, as the model
   code says (`analysis/xpts.py` reads `xg_data.parquet`, which `cli/predict.py` rebuilds
   with `data/fotmob.build_xg_dataset`): please confirm. Results are named as SofaScore's;
   past seasons' rows in `liga_portugal.parquet` come from football-data.co.uk's CSVs, with
   SofaScore results appended during the season, so say which provider each published
   results field carries. A `sources` block per file (field → provider) would let the page
   read the marks instead of keeping them by hand. *Web:* `FILE_DOCS[].thirdParty`,
   `licenceThirdParty` and `provenance` in `src/app/[locale]/desporto/liga/dados/page.tsx`;
   the xPts source lines on `/desporto/liga/2025-26`, the methodology's xPts paragraph and
   the hub's `football.xgAttribution`.
6. **Freeze `next_matchday` with the game record, or drop it.** In 2026-27 the
   `next_matchday` of md01, md03 and md04 differs from `game_fixtures.json` by up to
   0.2 pp, and md03, md04 and md05 list 6, 7 and 8 of the next round's 9 games (FA3-06).
   *Web:* `/desporto/liga/dados` states both, read from the files
   (`src/lib/football-next-matchday.ts`), and treats the game record as the one that counts.
7. **Re-issue the title-calibration leader table after the matchday-label fix.** The
   assessment of 25 September 2026 (§94) found two matchday-one cells that are data
   artefacts (Famalicão 2019-20, Santa Clara 2020-21). *Web:* leads with the 17 clean cells
   (63% given, 82% won) and gives the 19 second (`TITLE_CALIBRATION` in
   `src/lib/football-model-evaluation.ts`, METH3-15); a re-run would replace both.
8. **Reader-facing caveats.** The player feeds' caveats are English, name internal fields
   (`positional_distribution`) and files, and Portuguese readers get them verbatim behind a
   labelled disclosure (FA3-10). A `caveats_pt` list (or one keyed translation per caveat)
   would let `/pt/desporto/liga/jogadores` show them in Portuguese. *Web:*
   `stripInternalRefs` in `src/lib/utils/player-ratings.ts` drops ADR numbers and file names
   and reads `positional_distribution` as words.
9. **Posteriors with enough precision.** `p_above_replacement` is rounded to four decimals,
   so several players publish exactly 1.0. *Web:* prints a posterior of 1.0 as ">99%" and 0
   as "<0,1%" (`formatPosterior`, FA3-04); a value such as 0.99997 would say the same thing
   without the special case.

Added in round 4 (2026-10-06):

10. **Player names with their accents in every ratings file.** `contested_ratings.json` (twice)
   and `def_ratings.json` (once) spell Nacional's "Ze Vitor", without the accents of
   "Zé Vítor" (audit FA3-13). Fix the name at the source (estimador-data's player table),
   so every file writes it the same way. *Web:* renders the name as published on `/jogadores`; no
   display-name map exists, and one would only hide the mismatch.
11. **Optionally, decisive matches at fixed strengths.** Each simulation draws the clubs'
   strengths as well as the results, so splitting the simulations by one game's result
   mixes the effect of its points with what the result says about the clubs' strength
   (audit METH3-V02). A variant that conditions on the result with the strengths held at
   their posterior means would isolate the points. *Web:* says so in the methodology
   (`#jogos-decisivos`), and the swings stay a conditional reading.
