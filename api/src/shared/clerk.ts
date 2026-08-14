/**
 * Clerk sign-in, verified here rather than trusted from the platform.
 *
 * This is the one part of the auth swap that carries real risk. Static Web
 * Apps' `x-ms-client-principal` is injected by the platform and stripped from
 * inbound requests, so the API could trust it without checking anything. A
 * bearer token is the opposite: it arrives from the client, so if we do not
 * verify the signature ourselves, anybody can mint an identity by typing one.
 *
 * So: RS256 only (never accept `alg: none`, never accept a symmetric alg where
 * the public key would become the secret), signature checked against Clerk's
 * published JWKS, issuer pinned to our instance, expiry enforced by `jose`.
 * The JWKS is fetched lazily and cached by `jose`, which also handles key
 * rotation by refetching when it meets an unknown `kid`.
 *
 * Dormant until configured: with no `CLERK_ISSUER` set, `verifyClerkToken`
 * returns null and the caller falls back to the Static Web Apps principal, so
 * the game keeps working exactly as before while the Clerk application is
 * being set up.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { ClientPrincipal } from './identity';

/** Provider name recorded alongside the hashed user id. */
export const CLERK_PROVIDER = 'clerk';

/**
 * Issuer of our Clerk instance, e.g. `https://clerk.estimador.pt` or
 * `https://<slug>.clerk.accounts.dev`. Absent = Clerk disabled.
 */
function issuer(): string | null {
  const raw = process.env.CLERK_ISSUER?.trim();
  return raw ? raw.replace(/\/$/, '') : null;
}

/**
 * Optional audience pin. Clerk session tokens carry `azp` rather than `aud`
 * by default, so this stays opt-in: set `CLERK_AUDIENCE` only if the token
 * template sets one, otherwise the check would reject every valid token.
 */
function audience(): string | undefined {
  return process.env.CLERK_AUDIENCE?.trim() || undefined;
}

export function clerkEnabled(): boolean {
  return issuer() !== null;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksIssuer: string | null = null;

function keySet(iss: string) {
  // Rebuild only if the issuer changed; otherwise reuse so jose keeps its
  // key cache across invocations of a warm function instance.
  if (!jwks || jwksIssuer !== iss) {
    jwks = createRemoteJWKSet(new URL(`${iss}/.well-known/jwks.json`));
    jwksIssuer = iss;
  }
  return jwks;
}

/** Pull a bearer token out of the Authorization header. */
export function bearerToken(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/**
 * Verify a Clerk session token and return it in the same shape the rest of
 * the code already speaks. Never throws: an invalid, expired or forged token
 * is simply not a signed-in caller.
 */
export async function verifyClerkToken(
  token: string | null | undefined,
): Promise<ClientPrincipal | null> {
  const iss = issuer();
  if (!iss || !token) return null;

  try {
    const { payload } = await jwtVerify(token, keySet(iss), {
      issuer: iss,
      audience: audience(),
      algorithms: ['RS256'],
      clockTolerance: 60, // seconds; function hosts drift
    });
    const sub = payload.sub;
    if (typeof sub !== 'string' || !sub) return null;
    return {
      identityProvider: CLERK_PROVIDER,
      userId: sub,
      // Deliberately not lifting email or name off the token. The store keeps
      // a hash of `provider|userId` and a display name the player typed; the
      // less identity we copy out of the token, the less there is to leak.
    };
  } catch {
    return null;
  }
}
