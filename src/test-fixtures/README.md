# Test fixtures

Frozen copies of published data that tests pin exact numbers to. The live files
under `public/data` are re-published by the model pipelines (the 25 September
md07 sync rewrote md06), so a test that pins a worked example must read a
frozen copy, not the live feed.

- `liga-2026-27/md06.json`, `md06_scenarios.json`, `game_fixtures.json`: the
  matchday 6 bundle as published on 2026-09-13 (commit ad8cc65), the basis of
  the 2026-09-17 usability diagnosis's Sporting CP–Arouca worked example.
