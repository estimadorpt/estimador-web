"use client";

/**
 * Clerk, mounted only when a publishable key was baked into the build.
 *
 * The game is playable with no account at all — a name in local storage is
 * enough — so this exists purely so a season can follow you to another
 * device. That is why it wraps one page rather than the whole app: no reader
 * of a forecast page should pay for an auth bundle they never use.
 *
 * With no key the component is a pass-through and the game falls back to
 * Static Web Apps' built-in login, so the site behaves identically before
 * the Clerk application exists.
 */

import { useEffect } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import { CLERK_KEY, setAuthTokenGetter, usesClerk } from "@/lib/utils/prediction-game-api";

/** Publishes Clerk's token getter to the API layer for as long as it mounts. */
function TokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

export function GameAuthProvider({ children }: { children: React.ReactNode }) {
  if (!usesClerk()) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/">
      <TokenBridge />
      {children}
    </ClerkProvider>
  );
}

/**
 * The sign-in control for the season card. Renders nothing without Clerk —
 * the caller keeps its own link to the Static Web Apps login in that case.
 */
export function GameSignIn({
  signInLabel,
  signedInLabel,
}: {
  signInLabel: string;
  signedInLabel: string;
}) {
  if (!usesClerk()) return null;
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline">
            {signInLabel}
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <span className="inline-flex items-center gap-2 text-emerald-800">
          <UserButton afterSignOutUrl="/" />
          {signedInLabel}
        </span>
      </SignedIn>
    </>
  );
}
