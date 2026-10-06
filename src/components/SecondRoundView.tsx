"use client";

import type { ReactNode } from 'react';
import { useRound } from './SecondRoundToggle';

/**
 * Shows the part of the presidential archive that belongs to the selected
 * round: the round's content, or its date line. Both versions are rendered on
 * the server and passed in. The runoff is the default, so the static HTML is
 * the runoff (content and dates agree on first paint) and `?round=1` swaps in
 * the first round after hydration.
 */
export function RoundSwitch({ firstRound, secondRound }: { firstRound: ReactNode; secondRound: ReactNode }) {
  const [round] = useRound();
  return <>{round === 1 ? firstRound : secondRound}</>;
}
