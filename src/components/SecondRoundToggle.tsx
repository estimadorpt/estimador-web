"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SecondRoundToggleProps {
  currentRound: 1 | 2;
  translations: {
    firstRound: string;
    secondRound: string;
  };
}

export function SecondRoundToggle({ currentRound, translations }: SecondRoundToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleRoundChange = (round: 1 | 2) => {
    const params = new URLSearchParams(searchParams.toString());
    if (round === 1) {
      params.set('round', '1');
    } else {
      // Second round is default, so remove the param
      params.delete('round');
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };

  return (
    <div className="flex items-center gap-1 bg-parchment rounded-lg p-1">
      <button
        onClick={() => handleRoundChange(1)}
        aria-pressed={currentRound === 1}
        className={`min-h-11 px-4 py-2 text-xs font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          currentRound === 1
            ? 'bg-ink text-cream'
            : 'text-ink-muted hover:text-ink'
        }`}
      >
        {translations.firstRound}
      </button>
      <button
        onClick={() => handleRoundChange(2)}
        aria-pressed={currentRound === 2}
        className={`min-h-11 px-4 py-2 text-xs font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          currentRound === 2
            ? 'bg-ink text-cream'
            : 'text-ink-muted hover:text-ink'
        }`}
      >
        {translations.secondRound}
      </button>
    </div>
  );
}
