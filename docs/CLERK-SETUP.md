# Clerk sign-in for "Contra o Modelo"

The code is wired and dormant. Nothing below changes how the site behaves
until the two settings at the end exist; without them the game falls back to
the Static Web Apps GitHub login exactly as before.

## Why not Azure's built-in auth

Static Web Apps on the **Free** plan offers two identity providers: GitHub
and Microsoft. Google, Apple and Facebook need a custom OIDC provider, which
is a **Standard plan** feature (~$9/month). For a Portuguese football
audience, GitHub is close to the worst possible option.

Clerk gives Google/Apple/Facebook on a free tier far larger than this site
will use, so it is both cheaper and a better fit. The migration was done
while the leaderboard had **zero registered players**, so nothing had to be
migrated — a later switch would not be so cheap.

## What changed in the code

| Piece | What it does |
|---|---|
| `api/src/shared/clerk.ts` | Verifies the bearer token: RS256 only, signature against Clerk's JWKS, issuer pinned, expiry enforced |
| `api/src/shared/identity.ts` | `readAnyPrincipal()` — Clerk token if configured, else the SWA principal |
| `src/components/GameAuthProvider.tsx` | Mounts `ClerkProvider` on the game page only, publishes the token getter |
| `src/lib/utils/prediction-game-api.ts` | Attaches `Authorization: Bearer` when a token is available |

**The security note that matters.** Azure's `x-ms-client-principal` is
injected by the platform and cannot be forged from outside, so the API could
trust it blindly. A bearer token arrives from the client, so the API now
verifies the signature itself. That check is the thing standing between the
leaderboard and anyone who can type a JWT — `algorithms: ['RS256']` and the
pinned issuer are not optional decoration.

Identity is stored as `sha256(provider|userId)`, so a GitHub-linked season
and a Clerk-linked season are different credentials for the same human.
`POST /api/claim` is how a season moves between them. No email or login name
is read off the token or persisted.

## What you need to do

1. Create a Clerk application at <https://dashboard.clerk.com> and enable the
   providers you want (Google is the one that matters; Apple if you like).
2. Copy the **publishable key** (`pk_live_…`) and the **issuer** — the
   Frontend API URL, e.g. `https://clerk.estimador.pt` for a production
   instance or `https://<slug>.clerk.accounts.dev` while testing.
3. Add the publishable key to the **build**, since a static export bakes it
   in. In `.github/workflows/*.yml`, in the build step's `env:`:

   ```yaml
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
   ```

   and add `CLERK_PUBLISHABLE_KEY` to the repository secrets. It is a public
   value — a secret only to keep it out of the diff.

4. Add the issuer to the **API**, which reads it at runtime:

   ```bash
   az staticwebapp appsettings set -n portugal-election-forecast -g estimador \
       --setting-names CLERK_ISSUER=https://clerk.estimador.pt
   ```

   Optional: `CLERK_AUDIENCE`, only if your token template sets `aud`. Clerk
   session tokens use `azp` by default, so leaving it unset is normal —
   setting it wrongly rejects every valid token.

5. Redeploy. The account strip switches to Clerk's own buttons on its own.

## Checking it works

- The game page still loads and is playable **without** signing in.
- Signing in shows Clerk's user button; the season syncs across devices.
- `curl` the API with a junk bearer token and confirm it is treated as
  anonymous rather than accepted:

  ```bash
  curl -s https://estimador.pt/api/leaderboard \
       -H 'Authorization: Bearer not.a.real.token' | head -c 200
  ```

## Going back

Unset `CLERK_ISSUER` on the API and drop the publishable key from the build.
Both paths remain in the code, so the fallback is a config change rather than
a revert.
