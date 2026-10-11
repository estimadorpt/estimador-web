'use client';

import { useId, useRef, useState } from 'react';
import { Action } from '@/components/brand/Action';
import { ResponseCard, type ResponseCardProps } from '@/components/population/ResponseCard';
import { GuessGrid } from '@/components/population/charts';
import { formatDisplay } from '@/lib/population/compact';
import { clampGuess, formatGuess, GUESS_START, guessTarget } from '@/lib/population/guess';
import { RECIPE_COPY, VALUES, valueLabel, type Locale } from '@/lib/population/labels';
import { distanceSentence, publishedPoints, revealSentence } from './guess-reveal';

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
 * is the reader's, and is drawn as one: hollow ink squares on an empty 10×10
 * grid, never solid dots, which on this site mean something that happened.
 * Nothing is drawn, and "Ver o valor" stays off, until the slider moves: the
 * slider has to start somewhere, and that start is not a guess. The reveal
 * states the published value as a sentence ("Cerca de 39 em cada 100…") and
 * how far the guess was from it, in whole points (guess-reveal.ts). Skippable,
 * and never offered for a refused response or a suppressed headline cell —
 * then it is a plain card.
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
  // reader's guess can be drawn on the same cells after the reveal (VUXD-07).
  const headlineFirst = VALUES[dimension]?.[0]?.value === RECIPE_COPY[recipeName].headline?.[dimension];
  const value = clampGuess(guess);
  // The published value as printed on the card ("17,5%"), which the sentences round.
  const points = publishedPoints(target.display, target.share);

  const reveal = (withGuess: boolean) => {
    setPhase(withGuess ? 'revealed' : 'skipped');
    // Move the reader to the answer, which replaces the control they were on.
    window.setTimeout(() => result.current?.focus(), 0);
  };

  const before = phase === 'guessing' ? (
    <div className="mb-2 border-t border-grid pt-3">
      <p className="text-[12px] text-graphite">{t.kicker}</p>
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
          aria-valuetext={touched ? t.valueText(value, unit) : t.noGuessYet}
          aria-describedby={`${id}-hint`}
          onChange={event => { setGuess(clampGuess(Number(event.target.value))); setTouched(true); }}
          className="guess-range h-11 w-full min-w-0 flex-none cursor-pointer accent-[var(--color-ink)] sm:flex-1"
        />
        {/* The reader's number, not a published one: labelled, in a dashed (hollow) field, and empty until they move the slider. */}
        <div className="w-24 shrink-0 self-start border border-dashed border-ink px-2 py-1 text-right sm:self-auto" aria-hidden="true">
          <p className="text-[11px] text-graphite">{t.yours}</p>
          <output htmlFor={`${id}-guess`} className={`fig block text-2xl ${touched ? 'text-ink' : 'text-graphite'}`}>
            {touched ? formatGuess(guess) : '—'}
          </output>
        </div>
      </div>
      <div className="mt-3">
        <GuessGrid guess={touched ? value : null} label={touched ? t.preview(value, unit) : t.noGuessYet} />
      </div>
      <p id={`${id}-hint`} className="mt-3 text-[13px] text-graphite">{touched ? t.preview(value, unit) : t.hint}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
        {/* Off until the slider moves: revealing from the starting point would score a guess nobody made.
            The fieldset carries the disabled state, so the button keeps the site's Action look. */}
        <fieldset disabled={!touched} className="contents">
          <Action onClick={() => reveal(true)}>{t.reveal}</Action>
        </fieldset>
        <Action variant="text" onClick={() => reveal(false)}>{t.skip}</Action>
      </div>
    </div>
  ) : phase === 'open' ? null : (
    // Focus moves here after a reveal or a skip, so the result is read once (no live region on top
    // of it) and a keyboard reader sees where they are: the global ring on a visible block (A11Y3-12).
    <div ref={result} tabIndex={-1} className="mb-4 border-t border-grid pt-3">
      <div className="flex flex-wrap items-stretch gap-x-8 gap-y-3">
        <div className="min-w-[8rem]">
          <p className="text-[12px] text-graphite">{t.published}</p>
          <p className="fig text-3xl text-ink">{published}</p>
          <p className="text-[12px] text-graphite">{headlineValue}</p>
        </div>
        {phase === 'revealed' && (
          <div className="min-w-[8rem]">
            <p className="text-[12px] text-graphite">{t.yours}</p>
            <p className="fig text-3xl text-ink">{formatGuess(guess)}</p>
          </div>
        )}
      </div>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink">
        {revealSentence(recipeName, points, where, locale)}
        {phase === 'revealed' && <> <b className="font-semibold">{distanceSentence(value, points, locale)}</b></>}
      </p>
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
      guess={phase === 'revealed' && headlineFirst ? value : undefined}
      inkHeadline={headlineFirst}
      {...rest}
    />
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
      hint: 'Move o cursor para dares o teu palpite; depois, «Ver o valor».',
      noGuessYet: 'Ainda sem palpite',
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
      hint: 'Move the slider to make your guess, then “Show the value”.',
      noGuessYet: 'No guess yet',
      preview: (value: number, unit: string) => `Your guess: ${value} in every 100 ${unit}.`,
      valueText: (value: number, unit: string) => `${value} in every 100 ${unit}`,
    };
}
