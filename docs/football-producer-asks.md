# Liga Portugal: asks for estimador-football (2026-10-06)

Found while fixing the Liga pages in round 3. None blocks a publication; each says what
the website does meanwhile and what would let it stop.

1. **Per-club conditionals for the decisive matches.** `decisive_matches` keeps, for each
   game, only the club whose title chances swing most (the loop in
   `src/liga_predict/analysis/scenarios.py`, about lines 128–144, computes H/D/A
   conditionals for every contender and keeps the best). Emit them for each contender, so a
   club page can list its own decisive games: Sporting's J12 and J29 at Porto are missing
   from Sporting's page today (FA2-02). *Web:* a club page lists only the games whose
   `most_affected_team` is that club (`titleDecisive` / `relegationDecisive` in
   `src/components/charts/football/DecisiveMatches.tsx`), else its own games that swing
   another club's race.
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
