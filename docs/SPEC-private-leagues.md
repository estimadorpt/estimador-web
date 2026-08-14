# Spec: private leagues for "Contra o Modelo"

Status: **proposed**, not built. Written 2026-08-14.

## The problem this solves

The global leaderboard is the wrong social unit. Against a national table a
newcomer is anonymous and probably mid-pack forever, and there is no reason
to come back on a Tuesday. Against six colleagues there is a reason every
week. The game's actual competitive hook is *"I beat Miguel"*, not *"I am
1,447th"*.

It also fixes the cold start structurally rather than cosmetically: a league
of five that starts today is a full league, not an empty one.

## Non-goals

- **Not a new scoring system.** A league is a *view* over scores that already
  exist. Mean RPS, the model row, everything — unchanged. If a league changed
  how points worked, two tables would disagree about who is better and both
  would be right, which is worse than not shipping it.
- **Not chat, not comments.** Moderation burden on a project with no
  moderators.
- **Not public-directory leagues.** Invite-only, so there is nothing to
  crawl, nothing to spam, and no name to police.

## Model

A league is a named set of players plus a join code. Scores stay per player
per season; a league standing is a filtered, re-ranked read of the same
`StandingEntity` rows the global board already uses.

That single decision — **filter, never recompute** — is what keeps this
small. No new scoring path, no risk of divergence, no backfill: a league
created at matchday 30 immediately shows its members' whole season.

### Storage — two new tables, matching existing conventions

```
gameLeagues        partitionKey = seasonKey(season)      rowKey = leagueId
  leagueId, name, code, ownerPlayerId, createdAt, memberCount

gameLeagueMembers  partitionKey = `${seasonKey}_${leagueId}`   rowKey = playerId
  displayName, joinedAt
```

Plus one lookup so a code resolves in a single point-read rather than a scan:

```
gameLeagueCodes    partitionKey = seasonKey(season)      rowKey = code
  leagueId, createdAt
```

Notes that matter:

- **Season-partitioned like everything else.** A league belongs to a season;
  next season starts clean, which is the same rule the rest of the game
  follows and avoids a "who is still in this?" migration every August.
- **`memberCount` is denormalised** so the list view does not need a query
  per league. It can drift; treat it as display-only and recount on the
  detail view.
- **Code format**: 6 characters, `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` —
  no `I/O/0/1`, because these get read aloud and retyped. 32^6 ≈ 1e9, and
  codes are checked for collision on create.
- Member rows carry `displayName` at join time only as a fallback; the
  standing row is the source of truth for the current name.

### Endpoints — four, all thin

| Method | Path | Auth | Does |
|---|---|---|---|
| `POST` | `/api/leagues` | player | create; returns `{leagueId, code}` |
| `POST` | `/api/leagues/join` | player | body `{code}`; idempotent |
| `GET` | `/api/leagues` | player | leagues I am in, with my rank in each |
| `GET` | `/api/leagues/{id}` | player, member | the league's standings |

All four use the existing `resolvePlayer()`, so anonymous players get leagues
too — no account required, consistent with the rest of the game.

`GET /api/leagues/{id}` is the only one with real logic, and it is small:
read the member ids, read the season's standings partition (already a single
query the global board makes), keep the intersection, re-rank with the
**existing** `compareLeaderboard`, and insert the model row so a league can
be collectively behind the model. That last part is deliberate — the model
belongs in every table or the game loses its spine.

### Limits, chosen to be boring

- 20 leagues per player, 200 members per league, 3 leagues created per player
  per day. Enough for real use, small enough that abuse is pointless.
- Names: 3–40 chars, trimmed, no control characters. Displayed to members
  only, so no profanity filter — an invite-only room polices itself.
- Anyone can leave; the owner leaving passes ownership to the
  earliest-joined remaining member; last member out deletes the league.

## UI

Three surfaces, on the existing game page — no new route until there is
demand.

1. **Below the global table**: "As tuas ligas" — a card per league with your
   rank, the member count, and whether you are above the model. Empty state
   is two buttons: *Criar liga* / *Entrar com código*.
2. **League detail**: the same table component the global board uses, with
   the member list, the code, and a share button. The code is the product —
   make it big and copyable.
3. **Share text**: reuse the existing share card, plus
   `Junta-te à minha liga: CÓDIGO` and the URL. A `?liga=CODE` query
   parameter should prefill the join box, since that link is how leagues
   actually spread.

## Effort and risk

Roughly a session: ~2 hours API (four endpoints, two tables, the join-code
generator, tests for code collision, idempotent join, non-member access,
ownership transfer), ~2 hours UI, ~1 hour polish.

The risk worth naming is scope creep: leagues invite chat, avatars,
head-to-head history, weekly digests. Ship the four endpoints and the two
buttons, then see whether anyone creates a second league.

## What would make this fail

Nobody creates a league because nobody has anyone to invite. Leagues do not
solve distribution — they multiply it. The prerequisite is roadmap item 9,
distribution: `social.json` already generates matchday posts every week and
publishes them nowhere. **If only one of the two gets built, build
distribution.** Leagues are the right second step, not the first.
