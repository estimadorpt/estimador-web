'use client';

import { useId, useRef, useState } from 'react';
import { Action } from '@/components/brand/Action';
import { ResponseCard, type ResponseCardProps } from '@/components/population/ResponseCard';
import { formatDisplay } from '@/lib/population/compact';
import { clampGuess, formatGuess, GUESS_START, guessTarget, guessVerdict, VERDICT_COPY } from '@/lib/population/guess';
import { RECIPE_COPY, VALUES, valueLabel, type Locale } from '@/lib/population/labels';

const PROMPT: Record<'elders_alone' | 'multigenerational', { pt: (where: string) => string; en: (where: string) => string }> = {
  elders_alone: {
    pt: where => `Em cada 100 pessoas com 65 ou mais anos em agregados privados ${where}, quantas vivem sozinhas?`,
    en: where => `Out of every 100 people aged 65 or over in private households ${where}, how many live alone?`,
  },
  multigenerational: {
    pt: where => `Em cada 100 agregados privados ${where}, quantos juntam uma criança e uma pessoa com 65 ou mais anos?`,
    en: where => `Out of every 100 private households ${where}, how many bring together a child and someone aged 65 or over?`,
  },
};

/**
 * A response card that asks for a guess before it shows the chart. The guess
 * is the reader's; the comparison comes back as a word ("Perto"), never as a
 * computed difference. Skippable, and never offered for a refused response or
 * a suppressed headline cell — then it is a plain card.
 */
export function GuessFirstCard(props: ResponseCardProps & { where: string; initiallyRevealed?: boolean }) {
  const { recipeName, record, recipe, locale, where, initiallyRevealed = false, ...rest } = props;
  const target = guessTarget(recipeName, record, recipe);
  // A shared link to this card opens it with the answer showing: the reader came for the value.
  const [phase, setPhase] = useState<'guessing' | 'revealed' | 'skipped' | 'open'>(initiallyRevealed ? 'open' : 'guessing');
  const [guess, setGuess] = useState(GUESS_START);
  const [touched, setTouched] = useState(false);
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
  // The 100 dots fill the headline category first ("vivem sozinhas", natural order), so the
  // reader's guess can be outlined on the same dots after the reveal (VUXD-07).
  const headlineFirst = VALUES[dimension]?.[0]?.value === RECIPE_COPY[recipeName].headline?.[dimension];

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
      {/*
        On a phone the reader's number sits above a full-width slider (UXM2-11); side by side from sm.
        The slider keeps its 44px height in the column (flex-none): flex-1 there sets a zero basis,
        which shrank it to its 16px track (UXM3-06, A11Y3-03).
      */}
      <div className="mt-4 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
        <input
          id={`${id}-guess`}
          type="range"
          min={0}
          max={100}
          step={1}
          value={guess}
          aria-valuetext={t.valueText(clampGuess(guess), unit)}
          onChange={event => { setGuess(clampGuess(Number(event.target.value))); setTouched(true); }}
          className="guess-range h-11 w-full min-w-0 flex-none cursor-pointer accent-[var(--color-ink)] sm:flex-1"
        />
        {/* The reader's number, not a published one: labelled, in a bordered field, and muted until they move the slider. */}
        <div className="w-24 shrink-0 self-start rounded-[10px] border border-dashed border-line px-2 py-1 text-right sm:self-auto" aria-hidden="true">
          <p className="text-[11px] font-semibold text-stone-500">{t.yours}</p>
          <output htmlFor={`${id}-guess`} className={`block font-display text-2xl font-extrabold tabular-nums ${touched ? 'text-ink' : 'text-stone-500'}`}>
            {formatGuess(guess)}
          </output>
        </div>
      </div>
      <GuessDots guess={guess} label={t.preview(clampGuess(guess), unit)} />
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
        <Action onClick={() => reveal(true)}>{t.reveal}</Action>
        <Action variant="text" onClick={() => reveal(false)}>{t.skip}</Action>
      </div>
    </div>
  ) : phase === 'open' ? null : (
    // Focus moves here after a reveal or a skip, so the result is read once (no live region on top
    // of it) and a keyboard reader sees where they are: the global ring on a visible block (A11Y3-12).
    <div ref={result} tabIndex={-1} className="mb-4 flex flex-wrap items-stretch gap-3 rounded-xl border border-line bg-paper p-4">
      {phase === 'revealed' && (
        <div className="min-w-[8rem]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">{t.yours}</p>
          <p className="font-display text-3xl font-extrabold tabular-nums text-ink">{formatGuess(guess)}</p>
        </div>
      )}
      <div className="min-w-[8rem]">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">{t.published}</p>
        <p className="font-display text-3xl font-extrabold tabular-nums text-ink">{published}</p>
        <p className="text-xs text-stone-500">{headlineValue}</p>
      </div>
      {phase === 'revealed' && (
        <p className="basis-full text-sm font-semibold text-ink sm:basis-auto sm:self-center">
          {VERDICT_COPY[guessVerdict(guess, target.share)][locale]}
        </p>
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
      guess={phase === 'revealed' && headlineFirst ? clampGuess(guess) : undefined}
      {...rest}
    />
  );
}

/**
 * The reader's guess as 100 dots: how many they think, filled as they slide. It is their
 * number, not ours. Ten by ten, the geometry of the published value's 100 dots (HundredPeople),
 * so the two can be compared by shape (VUXD-07).
 */
function GuessDots({ guess, label }: { guess: number; label: string }) {
  return (
    <div className="mt-3" role="img" aria-label={label}>
      <div className="grid max-w-[220px] grid-cols-10 gap-[5px]">
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
      preview: (value: number, unit: string) => `O teu palpite: ${value} em cada 100 ${unit}.`,
      valueText: (value: number, unit: string) => `${value} em cada 100 ${unit}`,
    }
    : {
      kicker: 'Guess before you look',
      reveal: 'Show the value',
      skip: 'Show without guessing',
      yours: 'Your guess',
      published: 'Published value',
      people: 'people',
      households: 'households',
      preview: (value: number, unit: string) => `Your guess: ${value} in every 100 ${unit}.`,
      valueText: (value: number, unit: string) => `${value} in every 100 ${unit}`,
    };
}
