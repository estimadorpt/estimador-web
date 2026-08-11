# Contra o Modelo — season API

Azure Static Web Apps *managed functions* backing the season-long version of
the prediction game at `/[locale]/desporto/liga/jogo-previsoes`.

The weekly game works entirely in the browser and always will. This API adds
what localStorage cannot give: a season that survives a cleared browser or a
new phone, and a leaderboard with the model in it.

**Nothing here is required for the site to work.** With no
`GAME_STORAGE_CONNECTION_STRING`, `/api/health` answers `configured: false`,
every other endpoint answers `503 not_configured`, and the page silently stays
in local-only mode.

---

## Provisioning

1. **Create a storage account** (any region; Standard LRS is enough — the game
   writes a few KB per matchday and Table Storage has no free-tier trap).
2. **Copy the connection string** (*Storage account → Security + networking →
   Access keys → Connection string*).
3. **Add the app settings** in the Azure portal, under *Static Web App →
   Settings → Environment variables*:

   | Setting | Value | Purpose |
   | --- | --- | --- |
   | `GAME_STORAGE_CONNECTION_STRING` | the connection string | turns the backend on |
   | `GAME_ADMIN_TOKEN` | a long random string | authorises `POST /api/score` |
   | `GAME_SEASON` | *(optional)* e.g. `2026-27` | overrides the season read from the bundled manifest |

4. **Enable GitHub sign-in.** Nothing to configure: Static Web Apps ships
   `/.auth/login/github` and `/.auth/me` on every site. Signing in is optional
   for players.
5. **Score each matchday** from the model repo, after the usual update:

   ```bash
   cd ~/code/estimador-football
   export GAME_ADMIN_TOKEN=...            # the same value as the app setting
   uv run python scripts/export_game_fixtures.py \
       --api-dir ~/code/estimador-web/api/data \
       --post-score
   ```

   That writes `game_fixtures.json` next to the matchday predictions, refreshes
   the copy bundled with this API, and POSTs the manifest to `/api/score`, which
   stores it and re-scores every player.

Tables (`gamePlayers`, `gameAuthLinks`, `gamePicks`, `gameScores`,
`gameStandings`, `gameManifest`) are created on first use. There is nothing to
provision beyond the storage account itself.

---

## What is stored about a player

Deliberately close to nothing.

| Field | Example | Why |
| --- | --- | --- |
| `playerId` | `a3f1…` (random, 24 hex) | identifies a season entry |
| `displayName` | `Bernardo` | shown on the leaderboard; typed by the player |
| `secretHash` | sha256 of a random secret | proves the browser owns the entry |
| `authHash` | sha256 of `github\|<userId>` | resolves a signed-in player to their entry |
| `authProvider` | `github` | so the UI can say how you signed in |
| `createdAt` / `updatedAt` | ISO timestamps | housekeeping |

Plus, per matchday: the probabilities submitted, the RPS scored, and the
matchday number.

**Not stored, ever:** email address, GitHub username or profile, IP address,
the anonymous secret in plaintext, the provider's raw user id. Static Web Apps
puts a `userDetails` field (usually the GitHub login) in the principal header
on every authenticated request; this API reads the `userId` from it, hashes it,
and discards the rest.

The display name is the only free-text field, and it is the player's own
choice. It is trimmed, stripped of control characters and capped at 24
characters. Names are not checked for uniqueness.

---

## Identity: play now, keep it later

1. **Play immediately.** The first `POST /api/picks` (or `POST /api/player`)
   mints `{playerId, secret}`. The browser stores both; the server stores the
   id and a hash. No account, no email, no sign-in.
2. **Insure the season.** `/.auth/login/github` → the site calls
   `POST /api/claim` with both the principal and the anonymous credentials →
   the anonymous entry becomes the signed-in entry.
3. **Second device.** Sign in; `POST /api/claim` with no anonymous credentials
   resolves to the entry already linked to that identity. The season and its
   picks come with it.

If an identity is *already* linked to a different entry, the existing one wins
and is returned untouched. Merging two seasons would destroy one of them, and
only the human can say which was meant — the response reports
`supersededPlayerId` so the site can say so.

---

## Endpoints

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | the probe; always 200, reports `configured` |
| `GET` | `/api/picks?season=&matchday=` | player | your picks, the fixtures, the season history |
| `POST` | `/api/picks` | player (created if absent) | submit picks for one matchday |
| `GET` | `/api/player` | player | who the server thinks you are |
| `POST` | `/api/player` | player (created if absent) | set your leaderboard name |
| `GET` | `/api/leaderboard?season=` | — | season standings, model included |
| `POST` | `/api/claim` | SWA principal | link an anonymous season to an identity |
| `POST` | `/api/score` | `x-game-admin-token` | ingest the manifest and settle every pick |

Player credentials travel as `x-game-player-id` and `x-game-secret`.

### What the server refuses

Validation never trusts the request. Each fixture in a submission is checked
against the manifest and the server's own clock, and the response lists what
was refused and why:

- `locked` — `locks_at` has passed, or the fixture already has a result. A
  client-supplied deadline is ignored entirely; there is no field for one.
- `unknown_fixture` — not a fixture of that matchday.
- `not_priced` — the model has not published this round, so there is nothing to
  compete against.
- `invalid_probabilities` — not three finite non-negative numbers with positive
  mass. Accepted vectors are renormalised server-side.

Picks already stored for a fixture that has since locked are kept verbatim; a
later request cannot rewrite them.

---

## Scoring

`api/src/shared/scoring.ts` mirrors `rps_single` in the model repo
(`estimador-football/src/liga_predict/model/evaluate.py`):

```
RPS = ½ · Σ_{k=1..2} (cumP_k − cumO_k)²
```

Lower is better. The mirror is pinned to values printed by the Python function
itself in `api/src/shared/scoring.test.ts`, which the site's own test run
executes:

```bash
npm test        # from the repo root — covers src/ and api/src/
```

A player is scored on the fixtures they picked; the model is scored on **the
same subset**, so a partial entry is still a fair head-to-head. The model's own
leaderboard row is its score over every completed, priced fixture of the season.

The table is sorted by **mean** RPS. Sorting on the total would reward sitting
matchdays out. Ties break towards whoever played more matchdays.

---

## Local development

```bash
cd api
npm install
npm run build

# Table Storage emulator
npx azurite --location /tmp/azurite-data --tablePort 10102

# Functions host (needs azure-functions-core-tools)
GAME_STORAGE_CONNECTION_STRING="UseDevelopmentStorage=true" \
GAME_ADMIN_TOKEN=dev \
npm start
```

`npm run dev` at the repo root serves the site with no API, which is exactly
the local-only path the fallback is built for.

---

## Notes and known limits

- **Programming model.** These are v3-model functions (`function.json` per
  folder, compiled JS under `dist/`). Chosen over the v4 code-first model
  because it is what Static Web Apps managed functions have always supported.
  The workflow's `api_build_command: "npm run build"` is what compiles
  `src/` into the `dist/` those `function.json` files point at.
- **Round vs fixture locks.** The server locks each fixture at its own kickoff.
  The site's UI closes a whole round at the first kickoff, so it is stricter
  than the server. That is deliberate: the server's job is to never accept a
  pick after kickoff, not to reproduce the UI.
- **Model probabilities are public.** They ship in the matchday JSON the page
  already downloads, so a determined player can read them before picking. This
  API does not make that worse — `GET /api/picks` withholds them until a
  fixture locks — but it cannot fix it from here.
- **Names are not unique.** Two players may share one. Fixing that needs a
  decision about whether to disambiguate or to reject.
- **No rate limiting on player creation.** Anyone can mint anonymous players in
  a loop. Table Storage absorbs that cheaply and a player with no scored picks
  never reaches the leaderboard, so the cost is storage rows rather than a
  polluted table — but it is a known property, not an oversight. A per-IP cap
  would need `x-forwarded-for` and a counter table.
- **A player is only created when someone acts** — submits a pick or chooses a
  name. Merely being signed in and loading the page creates nothing.
- **Pre-existing local picks are not migrated.** A player who has been playing
  locally keeps their local history; picks made before the backend existed are
  pushed to the server only for the currently open round.
