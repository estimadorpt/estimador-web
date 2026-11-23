'use client';

import { Link } from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { formatElectionNumber } from '@/lib/election-display';
import { ABSTENTION } from '@/lib/simulator/engine';
import {
  AGE_CHOICES, BLANK_NULL, EDU_CHOICES, MAX_GROUP_MOVES, SEX_CHOICES, groupSize,
  type AgeChoice, type EduChoice, type GroupData, type GroupMove, type SexChoice,
} from '@/lib/simulator/groups';
import { Disclosure } from '@/components/viz/Disclosure';
import { inList, listName, type Locale } from './copy';
import styles from './Simulator.module.css';

type Words = { pt: string; en: string };

/** The sentence's words for each choice: "Das pessoas de 18 a 34 anos com o ensino superior…". */
const SEX_WORDS: Record<SexChoice, Words> = {
  all: { pt: 'Das pessoas', en: 'Of people' },
  men: { pt: 'Dos homens', en: 'Of men' },
  women: { pt: 'Das mulheres', en: 'Of women' },
};
const AGE_WORDS: Record<AgeChoice, Words> = {
  all: { pt: 'de todas as idades', en: 'of all ages' },
  '18-24': { pt: 'de 18 a 24 anos', en: 'aged 18 to 24' },
  '25-34': { pt: 'de 25 a 34 anos', en: 'aged 25 to 34' },
  '18-34': { pt: 'de 18 a 34 anos', en: 'aged 18 to 34' },
  '35-44': { pt: 'de 35 a 44 anos', en: 'aged 35 to 44' },
  '45-54': { pt: 'de 45 a 54 anos', en: 'aged 45 to 54' },
  '55-64': { pt: 'de 55 a 64 anos', en: 'aged 55 to 64' },
  '65-74': { pt: 'de 65 a 74 anos', en: 'aged 65 to 74' },
  '75+': { pt: 'com 75 ou mais anos', en: 'aged 75 or over' },
  '65+': { pt: 'com 65 ou mais anos', en: 'aged 65 or over' },
};
const EDU_WORDS: Record<EduChoice, Words> = {
  all: { pt: 'com qualquer escolaridade', en: 'with any schooling' },
  basic: { pt: 'com o 3.º ciclo ou menos', en: 'with lower secondary or less' },
  secondary: { pt: 'com o secundário', en: 'with upper secondary' },
  tertiary: { pt: 'com o ensino superior', en: 'with a degree' },
};

function fromWords(o: string, locale: Locale): string {
  if (locale === 'pt') return o === ABSTENTION ? 'se abstiveram' : o === BLANK_NULL ? 'votaram branco ou nulo' : `votaram ${inList(o)}`;
  return o === ABSTENTION ? 'abstained' : o === BLANK_NULL ? 'voted blank or spoilt' : o === 'OUT' ? 'voted for other lists' : `voted ${listName(o, 'en')}`;
}

function toWords(o: string, locale: Locale): string {
  if (locale === 'pt') return o === ABSTENTION ? 'passam a abster-se' : o === BLANK_NULL ? 'passam a votar branco ou nulo' : `passam a votar ${inList(o)}`;
  return o === ABSTENTION ? 'now abstain' : o === BLANK_NULL ? 'now vote blank or spoilt' : o === 'OUT' ? 'now vote for other lists' : `now vote ${listName(o, 'en')}`;
}

/** Short names for the examples' groups. */
const EXAMPLE_GROUP: Record<string, Words> = {
  '18-34': { pt: '18–34 anos', en: '18–34' },
  '65+': { pt: '65 ou mais', en: '65+' },
  tertiary: { pt: 'Ensino superior', en: 'Degree' },
};

/** Ready-made moves to start from, in different directions. */
export const GROUP_EXAMPLES: GroupMove[] = [
  { sex: 'all', age: '18-34', edu: 'all', from: ABSTENTION, to: 'CH', share: 25 },
  { sex: 'all', age: 'all', edu: 'tertiary', from: 'AD', to: 'IL', share: 20 },
  { sex: 'all', age: '18-34', edu: 'all', from: 'PS', to: 'L', share: 20 },
  { sex: 'all', age: '65+', edu: 'all', from: 'PS', to: ABSTENTION, share: 10 },
];

/** A new move: everyone who abstained, nothing moved yet; the reader picks the rest. */
export const BLANK_MOVE: GroupMove = { sex: 'all', age: 'all', edu: 'all', from: ABSTENTION, to: 'AD', share: 0 };

/** "25% das pessoas de 18 a 34 anos que em 2025 se abstiveram passam a votar no Chega". */
export function groupMoveText(m: GroupMove, locale: Locale, share = m.share): string {
  const pct = `${formatElectionNumber(share, locale, Number.isInteger(share) ? 0 : 1)}%`;
  const age = m.age === 'all' ? '' : ` ${AGE_WORDS[m.age][locale]}`;
  const edu = m.edu === 'all' ? '' : ` ${EDU_WORDS[m.edu][locale]}`;
  if (locale === 'pt') {
    const who = m.sex === 'men' ? 'dos homens' : m.sex === 'women' ? 'das mulheres' : 'das pessoas';
    return `${pct} ${who}${age}${edu} que em 2025 ${fromWords(m.from, 'pt')} ${toWords(m.to, 'pt')}`;
  }
  const who = m.sex === 'men' ? 'men' : m.sex === 'women' ? 'women' : 'people';
  return `${pct} of ${who}${age}${edu} who ${fromWords(m.from, 'en')} in 2025 ${toWords(m.to, 'en')}`;
}

function exampleLabel(m: GroupMove, locale: Locale): string {
  const group = EXAMPLE_GROUP[m.age !== 'all' ? m.age : m.edu]?.[locale] ?? '';
  const name = (o: string) => (o === ABSTENTION ? (locale === 'pt' ? 'abstenção' : 'abstention') : listName(o, locale));
  return `${group}: ${name(m.from)} → ${name(m.to)}`;
}

function InlineSelect<T extends string>({ label, value, options, words, onChange }: {
  label: string;
  value: T;
  options: readonly T[];
  words: (o: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <span className={styles.choice}>
      <span aria-hidden="true">{words(value)}</span>
      <select aria-label={label} value={value} onChange={e => onChange(e.target.value as T)}>
        {options.map(o => <option key={o} value={o}>{words(o)}</option>)}
      </select>
    </span>
  );
}

/**
 * "Por grupo de eleitores": each move is a sentence the reader edits in place ("Das pessoas de 18 a 34
 * anos que em 2025 se abstiveram, 25% passam a votar no Chega"), and the seats follow as it
 * changes. Moves apply in order.
 */
export function GroupMovesPanel({ groups, options, moves, moved, onChange, onAdd, onRemove, onExample, locale, methodHref }: {
  groups: GroupData | null;
  /** The lists, BLANK_NULL and ABS, in the file's order. */
  options: string[];
  moves: GroupMove[];
  /** Votes each move actually moved (all circles together). */
  moved: number[];
  onChange: (i: number, m: GroupMove) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onExample: (m: GroupMove) => void;
  locale: Locale;
  /** The methodology's section on the group mode (no locale prefix). */
  methodHref?: string;
}) {
  const pt = locale === 'pt';
  const num = (v: number) => formatElectionNumber(v, locale);
  const roundVotes = (v: number) => (v >= 10000 ? Math.round(v / 1000) * 1000 : Math.round(v / 100) * 100);
  const blocks = useRef<Array<HTMLDivElement | null>>([]);
  const [focusMove, setFocusMove] = useState<number | null>(null);
  // After an add or a removal, focus the first control of the move now in that place.
  useEffect(() => {
    if (focusMove == null) return;
    blocks.current[Math.min(focusMove, moves.length - 1)]?.querySelector('select')?.focus();
    setFocusMove(null);
  }, [focusMove, moves.length]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0 text-[14px]">
        <span className="text-graphite">{pt ? 'Exemplos' : 'Examples'}</span>
        {GROUP_EXAMPLES.map(m => (
          <button
            key={`${m.age}-${m.edu}-${m.from}-${m.to}`}
            type="button"
            disabled={!groups}
            onClick={() => onExample(m)}
            aria-label={groupMoveText(m, locale)}
            className="tap-target min-h-11 whitespace-nowrap font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink disabled:text-graphite"
          >
            {exampleLabel(m, locale)}
          </button>
        ))}
      </div>

      <div className="border-t border-ink">
        {moves.map((m, i) => {
          const size = groups ? groupSize(groups, m) : null;
          const votes = moved[i];
          const set = (patch: Partial<GroupMove>) => onChange(i, { ...m, ...patch });
          return (
            <div key={i} ref={el => { blocks.current[i] = el; }} role="group" aria-label={pt ? `Mudança ${i + 1}` : `Move ${i + 1}`} className="border-b border-grid py-3">
              <p className="text-[16px] leading-[2.75rem] text-ink">
                <InlineSelect label={pt ? 'Sexo' : 'Sex'} value={m.sex} options={SEX_CHOICES} words={o => SEX_WORDS[o][locale]} onChange={sex => set({ sex })} />{' '}
                <InlineSelect label={pt ? 'Idade' : 'Age'} value={m.age} options={AGE_CHOICES} words={o => AGE_WORDS[o][locale]} onChange={age => set({ age })} />{' '}
                <InlineSelect label={pt ? 'Escolaridade' : 'Schooling'} value={m.edu} options={EDU_CHOICES} words={o => EDU_WORDS[o][locale]} onChange={edu => set({ edu })} />{' '}
                {pt ? 'que em 2025' : 'who in 2025'}{' '}
                <span className="whitespace-nowrap">
                  <InlineSelect label={pt ? 'O que fizeram em 2025' : 'What they did in 2025'} value={m.from} options={options} words={o => fromWords(o, locale)} onChange={from => set({ from })} />,
                </span>
              </p>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3">
                <div className={styles.slider}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={m.share}
                    disabled={!groups}
                    onChange={e => set({ share: Number(e.target.value) })}
                    aria-label={pt ? 'Que parte muda' : 'What share changes'}
                    aria-valuetext={`${num(m.share)}%`}
                    className={styles.range}
                  />
                </div>
                <span className="text-right text-[18px] font-bold tabular-nums text-ink" aria-hidden="true">{num(m.share)}%</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4">
                <p className="text-[16px] leading-[2.75rem] text-ink">
                  <InlineSelect label={pt ? 'O que passam a fazer' : 'What they do instead'} value={m.to} options={options} words={o => toWords(o, locale)} onChange={to => set({ to })} />
                </p>
                {moves.length > 1 && (
                  <button
                    type="button"
                    onClick={() => { onRemove(i); setFocusMove(Math.max(0, i - 1)); }}
                    className="inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-ink hover:bg-field"
                    aria-label={pt ? `Retirar: ${groupMoveText(m, locale)}` : `Remove: ${groupMoveText(m, locale)}`}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                    {pt ? 'Retirar' : 'Remove'}
                  </button>
                )}
              </div>
              <p className="mt-1 text-[13px] tabular-nums text-graphite">
                {m.from === m.to
                  ? (pt ? 'Escolhe outra opção.' : 'Pick another option.')
                  : size == null
                    ? (pt ? 'A carregar os grupos…' : 'Loading the groups…')
                    : pt
                      ? `Cerca de ${num(roundVotes(votes ?? 0))} votos mudam, de ${num(roundVotes(size))} pessoas neste grupo.`
                      : `About ${num(roundVotes(votes ?? 0))} votes change, of ${num(roundVotes(size))} people in this group.`}
              </p>
            </div>
          );
        })}
      </div>

      {moves.length < MAX_GROUP_MOVES && (
        <button
          type="button"
          onClick={() => { onAdd(); setFocusMove(moves.length); }}
          disabled={!groups}
          className="inline-flex min-h-11 items-center gap-2 border border-ink px-3 text-[14px] font-semibold text-ink hover:bg-field disabled:border-rule disabled:text-graphite"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {pt ? 'Juntar outra mudança' : 'Add another move'}
        </button>
      )}

      <Disclosure summary={pt ? 'De onde vêm os grupos e o que não sabem' : 'Where the groups come from, and what they miss'}>
        <div className="mt-1 max-w-[68ch] space-y-2 text-[14px] text-graphite">
          <p>
            {pt
              ? 'Os grupos são os cidadãos portugueses residentes com 18 ou mais anos (Censos 2021). Quanto votou cada grupo em cada lista vem do resultado de 2025 em cada círculo; as diferenças entre grupos vêm do Estudo Eleitoral Português 2024, um inquérito a cerca de 800 pessoas, por isso as dos partidos pequenos são pouco precisas, e a Madeira e os Açores usam as do continente.'
              : 'The groups are Portuguese citizens aged 18 and over living in Portugal (2021 census). How much each group voted for each list comes from the 2025 result in each circle; the gaps between groups come from the 2024 Portuguese Election Study, a survey of about 800 people, so those of small parties are imprecise, and Madeira and the Azores use the mainland’s.'}
          </p>
          <p>
            {pt
              ? 'Os votos movidos ficam nos círculos onde esse grupo vive e votou assim. As mudanças aplicam-se pela ordem da lista, cada uma sobre o que as anteriores deixaram. Votos que passam à abstenção ou a brancos e nulos deixam de contar para os mandatos. Os círculos da emigração ficam como em 2025.'
              : 'Votes moved stay in the circles where that group lives and voted that way. Moves apply in the order of the list, each to what the earlier ones left. Votes that go to abstention or to blank and spoilt no longer count towards seats. The emigration circles stay as in 2025.'}
            {methodHref && (
              <>
                {' '}
                <Link href={methodHref} locale={locale} className="font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">
                  {pt ? 'Como foi feita a tabela de grupos' : 'How the group table was made'}
                </Link>
              </>
            )}
          </p>
        </div>
      </Disclosure>
    </div>
  );
}
