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
    <div className="flex items-center gap-1 bg-stone-700/50 rounded-full p-0.5">
      <button
        onClick={() => handleRoundChange(1)}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
          currentRound === 1
            ? 'bg-white text-stone-900'
            : 'text-stone-300 hover:text-white'
        }`}
      >
        {translations.firstRound}
      </button>
      <button
        onClick={() => handleRoundChange(2)}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
          currentRound === 2
            ? 'bg-white text-stone-900'
            : 'text-stone-300 hover:text-white'
        }`}
      >
        {translations.secondRound}
      </button>
    </div>
  );
}
