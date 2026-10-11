"use client";

import { useCallback, useEffect, useState } from 'react';
import { CHOICE_GROUP_CLASS, ChoiceCheck, choiceClass } from '@/components/brand/Choice';

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

/** The address of a round's view: `?round=1` for the first, no parameter for the runoff. */
const roundHref = (round: Round) => (round === 1 ? '?round=1' : '?');

/**
 * The round switch: two choice boxes (choiceClass), the chosen one in ink and
 * checked. They are links, so a round can be opened in a new tab or shared
 * (`?round=1`); with JavaScript a click swaps the view in place. The static
 * HTML marks the runoff as current, as the page shows it first. Without
 * JavaScript `?round=1` still shows the runoff: a static export serves one
 * HTML file whatever the query string, and only a script can read it.
 */
export function SecondRoundToggle({ translations }: SecondRoundToggleProps) {
  const [currentRound, choose] = useRound();
  const link = (round: Round, label: string) => {
    const current = currentRound === round;
    return (
      <a
        href={roundHref(round)}
        aria-current={current ? 'true' : undefined}
        onClick={event => {
          // A modified click (a new tab or window) keeps the browser's own behaviour.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          if (!current) choose(round);
        }}
        className={choiceClass(current)}
      >
        {current && <ChoiceCheck />}
        {label}
      </a>
    );
  };
  return (
    <div role="group" aria-label={translations.label} className={CHOICE_GROUP_CLASS}>
      {link(1, translations.firstRound)}
      {link(2, translations.secondRound)}
    </div>
  );
}
