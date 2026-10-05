'use client';

import { useId, useRef, useState } from 'react';
import { Action } from '@/components/brand/Action';
import { ResponseCard, type ResponseCardProps } from '@/components/population/ResponseCard';
import { formatDisplay } from '@/lib/population/compact';
import { clampGuess, formatGuess, GUESS_START, guessTarget, guessVerdict, VERDICT_COPY } from '@/lib/population/guess';
import { RECIPE_COPY, valueLabel, type Locale } from '@/lib/population/labels';

const PROMPT: Record<'elders_alone' | 'multigenerational', { pt: (where: string) => string; en: (where: string) => string }> = {
  elders_alone: {
    pt: where => `Em cada 100 pessoas com 65 ou mais anos ${where}, quantas vivem sozinhas?`,
    en: where => `Out of every 100 people aged 65 or over ${where}, how many live alone?`,
  },
  multigenerational: {
    pt: where => `Em cada 100 agregados ${where}, quantos juntam uma criança e uma pessoa com 65 ou mais anos?`,
    en: where => `Out of every 100 households ${where}, how many bring together a child and someone aged 65 or over?`,
  },
};

/**
 * A response card that asks for a guess before it shows the chart. The guess
 * is the reader's; the comparison comes back as a word ("Perto"), never as a
 * computed difference. Skippable, and never offered for a refused response or
 * a suppressed headline cell — then it is a plain card.
 */
export function GuessFirstCard(props: ResponseCardProps & { where: string }) {
  const { recipeName, record, recipe, locale, where, ...rest } = props;
  const target = guessTarget(recipeName, record, recipe);
  const [phase, setPhase] = useState<'guessing' | 'revealed' | 'skipped'>('guessing');
  const [guess, setGuess] = useState(GUESS_START);
  const result = useRef<HTMLDivElement>(null);
  const id = useId();

  if (!target || (recipeName !== 'elders_alone' && recipeName !== 'multigenerational')) {
    return <ResponseCard recipeName={recipeName} record={record} recipe={recipe} locale={locale} {...rest} />;
  }

  const t = copy(locale);
  const dimension = recipe.dimensions[0];
  const headlineValue = valueLabel(dimension, RECIPE_COPY[recipeName].headline?.[dimension] ?? '', locale);
  const published = formatDisplay(target.display, locale);
  const unit = recipe.unit === 'household' ? t.households : t.people;

  const reveal = (withGuess: boolean) => {
    setPhase(withGuess ? 'revealed' : 'skipped');
    // Move the reader to the answer, which replaces the control they were on.
    window.setTimeout(() => result.current?.focus(), 0);
  };

  const before = phase === 'guessing' ? (
    <div className="mb-2 rounded-xl border border-line bg-paper p-4 md:p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">{t.kicker}</p>
      <label htmlFor={`${id}-guess`} className="mt-1.5 block text-base font-semibold text-ink">
        {PROMPT[recipeName][locale](where)}
      </label>
      <div className="mt-4 flex items-center gap-4">
        <input
          id={`${id}-guess`}
          type="range"
          min={0}
          max={100}
          step={1}
          value={guess}
          aria-valuetext={`${formatGuess(guess)} ${unit}`}
          onChange={event => setGuess(clampGuess(Number(event.target.value)))}
          className="guess-range h-11 min-w-0 flex-1 cursor-pointer accent-[var(--color-ink)]"
        />
        <output htmlFor={`${id}-guess`} className="w-16 text-right font-display text-3xl font-extrabold tabular-nums text-ink" aria-hidden="true">
          {formatGuess(guess)}
        </output>
      </div>
      <GuessDots guess={guess} label={t.preview(formatGuess(guess), unit)} />
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
        <Action onClick={() => reveal(true)}>{t.reveal}</Action>
        <Action variant="text" onClick={() => reveal(false)}>{t.skip}</Action>
      </div>
    </div>
  ) : (
    <div ref={result} tabIndex={-1} aria-live="polite" className="mb-4 outline-none">
      {phase === 'revealed' && (
        <div className="flex flex-wrap items-stretch gap-3 rounded-xl border border-line bg-paper p-4">
          <div className="min-w-[8rem]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">{t.yours}</p>
            <p className="font-display text-3xl font-extrabold tabular-nums text-ink">{formatGuess(guess)}</p>
          </div>
          <div className="min-w-[8rem]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">{t.published}</p>
            <p className="font-display text-3xl font-extrabold tabular-nums text-ink">{published}</p>
            <p className="text-xs text-stone-500">{headlineValue}</p>
          </div>
          <p className="basis-full text-sm font-semibold text-ink sm:basis-auto sm:self-center">
            {VERDICT_COPY[guessVerdict(guess, target.share)][locale]}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <ResponseCard
      recipeName={recipeName}
      record={record}
      recipe={recipe}
      locale={locale}
      before={before}
      revealed={phase !== 'guessing'}
      {...rest}
    />
  );
}

/** The reader's guess as 100 dots: how many they think, filled as they slide. It is their number, not ours. */
function GuessDots({ guess, label }: { guess: number; label: string }) {
  return (
    <div className="mt-3" role="img" aria-label={label}>
      <div className="grid max-w-[260px] gap-[3px]" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
        {Array.from({ length: 100 }, (_, i) => (
          <span
            key={i}
            className={`aspect-square w-full rounded-full motion-safe:transition-colors motion-safe:duration-150 ${i < guess ? 'bg-ink' : 'bg-parchment'}`}
          />
        ))}
      </div>
    </div>
  );
}

function copy(locale: Locale) {
  return locale === 'pt'
    ? {
      kicker: 'Adivinha antes de ver',
      reveal: 'Ver o valor',
      skip: 'Mostrar sem adivinhar',
      yours: 'O teu palpite',
      published: 'Valor publicado',
      people: 'pessoas',
      households: 'agregados',
      preview: (value: string, unit: string) => `O teu palpite: ${value} dos ${unit}.`,
    }
    : {
      kicker: 'Guess before you look',
      reveal: 'Show the value',
      skip: 'Show without guessing',
      yours: 'Your guess',
      published: 'Published value',
      people: 'people',
      households: 'households',
      preview: (value: string, unit: string) => `Your guess: ${value} of ${unit}.`,
    };
}
