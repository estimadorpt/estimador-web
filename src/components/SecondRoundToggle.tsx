"use client";

import { useCallback, useEffect, useState } from 'react';

export type Round = 1 | 2;

const ROUND_EVENT = 'estimador:round';

function roundFromLocation(): Round {
  return new URLSearchParams(window.location.search).get('round') === '1' ? 1 : 2;
}

/**
 * The round the presidential archive shows, kept in the URL (`?round=1`; the
 * runoff is the default and has no parameter). The server and the first
 * client render both show the runoff, so the static HTML and its date labels
 * always agree; the URL is read after mount (no useSearchParams, which would
 * need a Suspense fallback in the static export) and on Back/Forward.
 */
export function useRound(): [Round, (round: Round) => void] {
  const [round, setRound] = useState<Round>(2);
  useEffect(() => {
    const sync = () => setRound(roundFromLocation());
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener(ROUND_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(ROUND_EVENT, sync);
    };
  }, []);
  const choose = useCallback((next: Round) => {
    const url = new URL(window.location.href);
    if (next === 1) url.searchParams.set('round', '1');
    else url.searchParams.delete('round');
    window.history.pushState(null, '', url);
    window.dispatchEvent(new Event(ROUND_EVENT));
  }, []);
  return [round, choose];
}

interface SecondRoundToggleProps {
  translations: {
    firstRound: string;
    secondRound: string;
    label: string;
  };
}

/** The round switch. A plain segmented control: it never pulses or animates. */
export function SecondRoundToggle({ translations }: SecondRoundToggleProps) {
  const [currentRound, choose] = useRound();
  const button = (round: Round, label: string) => (
    <button
      type="button"
      onClick={() => choose(round)}
      aria-pressed={currentRound === round}
      className={`min-h-11 px-4 py-2 text-xs font-bold rounded-md transition-colors ${
        // Ink, not ink-muted: muted ink on parchment is 4.33:1 (A11Y-15).
        currentRound === round ? 'bg-ink text-cream' : 'text-ink hover:bg-cream'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label={translations.label} className="flex items-center gap-1 bg-parchment rounded-lg p-1">
      {button(1, translations.firstRound)}
      {button(2, translations.secondRound)}
    </div>
  );
}
