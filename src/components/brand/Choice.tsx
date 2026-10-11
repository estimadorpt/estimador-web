import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

/**
 * The site's one way to choose one of several when the choice changes what is
 * shown in place (a round, a view, a club's frame, a game's pick): square boxes
 * on one ink-ruled frame, the chosen one filled with ink and checked, the
 * others white. An underline never means "chosen": it is kept for navigation
 * (links, the header, section tabs). A long list (clubs) is a select that acts
 * on change instead; places use the search.
 *
 * `ChoiceGroup` is the ready-made row. `choiceClass` and `CHOICE_GROUP_CLASS`
 * give the same look to markup of its own (a 1X2 pick with figures inside, a
 * round switch made of links so it can be shared): put `aria-pressed` on
 * buttons, `aria-current` on links, and draw `<ChoiceCheck />` in the chosen one.
 *
 * The module has no 'use client' of its own: the class helpers and the check
 * are plain values, so a server component (the /marca reference, a static
 * row of links) can use them too. `ChoiceGroup` takes an onChange, so only a
 * client component can render it.
 */

/** The row: boxes share their 1px ink borders and wrap on a phone. */
export const CHOICE_GROUP_CLASS = 'flex max-w-full flex-wrap pl-px pt-px';

/** One box: 44px tall, square; the chosen one in ink with white text. */
export function choiceClass(selected: boolean, extra = ''): string {
  return `-ml-px -mt-px inline-flex min-h-11 items-center justify-center gap-1.5 border border-ink px-3.5 text-[14px] font-semibold leading-5 transition-colors duration-150 disabled:cursor-not-allowed disabled:text-graphite aria-disabled:cursor-not-allowed aria-disabled:text-graphite forced-colors:aria-pressed:outline-2 forced-colors:aria-pressed:outline-offset-2 forced-colors:aria-pressed:outline-solid forced-colors:aria-[current]:outline-2 forced-colors:aria-[current]:outline-offset-2 forced-colors:aria-[current]:outline-solid ${selected ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-field disabled:hover:bg-paper aria-disabled:hover:bg-paper'} ${extra}`;
}

/** The check drawn in the chosen box, so the choice never rests on fill alone. */
export function ChoiceCheck() {
  return <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />;
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export function ChoiceGroup<T extends string>({ options, value, onChange, label, className = '' }: {
  options: ChoiceOption<T>[];
  value: T;
  /** Takes the options' type, so a useState setter can be passed as it is. */
  onChange: (value: NoInfer<T>) => void;
  /** The group's accessible name, e.g. "Volta". */
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`${CHOICE_GROUP_CLASS} ${className}`}>
      {options.map(o => {
        const selected = o.value === value;
        return (
          <button key={o.value} type="button" aria-pressed={selected} disabled={o.disabled}
            onClick={() => onChange(o.value)} className={choiceClass(selected)}>
            {selected && <ChoiceCheck />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
