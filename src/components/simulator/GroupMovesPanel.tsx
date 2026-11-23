'use client';

import { Link } from '@/i18n/routing';
import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Action } from '@/components/brand/Action';
import { formatElectionNumber } from '@/lib/election-display';
import { ABSTENTION } from '@/lib/simulator/engine';
import {
  AGE_CHOICES, BLANK_NULL, EDU_CHOICES, MAX_GROUP_MOVES, SEX_CHOICES, groupSize,
  type AgeChoice, type EduChoice, type GroupData, type GroupMove, type SexChoice,
} from '@/lib/simulator/groups';
import { inList, listName, type Locale } from './copy';

const SEX_LABEL: Record<SexChoice, { pt: string; en: string }> = {
  all: { pt: 'Homens e mulheres', en: 'Men and women' },
  men: { pt: 'Homens', en: 'Men' },
  women: { pt: 'Mulheres', en: 'Women' },
};
const AGE_LABEL: Record<AgeChoice, { pt: string; en: string }> = {
  all: { pt: 'Todas as idades', en: 'All ages' },
  '18-24': { pt: '18 a 24 anos', en: '18 to 24' },
  '25-34': { pt: '25 a 34 anos', en: '25 to 34' },
  '18-34': { pt: '18 a 34 anos', en: '18 to 34' },
  '35-44': { pt: '35 a 44 anos', en: '35 to 44' },
  '45-54': { pt: '45 a 54 anos', en: '45 to 54' },
  '55-64': { pt: '55 a 64 anos', en: '55 to 64' },
  '65-74': { pt: '65 a 74 anos', en: '65 to 74' },
  '75+': { pt: '75 ou mais anos', en: '75 and over' },
  '65+': { pt: '65 ou mais anos', en: '65 and over' },
};
const EDU_LABEL: Record<EduChoice, { pt: string; en: string }> = {
  all: { pt: 'Qualquer escolaridade', en: 'Any schooling' },
  basic: { pt: 'Até ao 3.º ciclo', en: 'Up to lower secondary' },
  secondary: { pt: 'Secundário', en: 'Upper secondary' },
  tertiary: { pt: 'Ensino superior', en: 'Degree' },
};

/** Ready-made moves to start from, in different directions. */
export const GROUP_EXAMPLES: GroupMove[] = [
  { sex: 'all', age: '18-34', edu: 'all', from: ABSTENTION, to: 'CH', share: 25 },
  { sex: 'all', age: 'all', edu: 'tertiary', from: 'AD', to: 'IL', share: 20 },
  { sex: 'all', age: '65+', edu: 'all', from: 'PS', to: ABSTENTION, share: 10 },
];

export function optionName(o: string, locale: Locale): string {
  return listName(o, locale);
}

/** "25% das pessoas de 18 a 34 anos que se abstiveram passam a votar no Chega". */
export function groupMoveText(m: GroupMove, locale: Locale, share = m.share): string {
  const pct = `${formatElectionNumber(share, locale, Number.isInteger(share) ? 0 : 1)}%`;
  if (locale === 'pt') {
    const who = m.sex === 'men' ? 'dos homens' : m.sex === 'women' ? 'das mulheres' : 'das pessoas';
    const age = m.age === 'all' ? '' : m.age === '75+' || m.age === '65+' ? ` com ${AGE_LABEL[m.age].pt}` : ` de ${AGE_LABEL[m.age].pt}`;
    const edu = m.edu === 'all' ? '' : m.edu === 'basic' ? ' com o 3.º ciclo ou menos' : m.edu === 'secondary' ? ' com o secundário' : ' com o ensino superior';
    const from = m.from === ABSTENTION ? 'se abstiveram' : m.from === BLANK_NULL ? 'votaram branco ou nulo' : `votaram ${inList(m.from)}`;
    const to = m.to === ABSTENTION ? 'passam a abster-se' : m.to === BLANK_NULL ? 'passam a votar branco ou nulo' : `passam a votar ${inList(m.to)}`;
    return `${pct} ${who}${age}${edu} que em 2025 ${from} ${to}`;
  }
  const who = m.sex === 'men' ? 'men' : m.sex === 'women' ? 'women' : 'people';
  const age = m.age === 'all' ? '' : ` aged ${AGE_LABEL[m.age].en}`;
  const edu = m.edu === 'all' ? '' : m.edu === 'basic' ? ' with lower secondary schooling or less' : m.edu === 'secondary' ? ' with upper secondary schooling' : ' with a degree';
  const from = m.from === ABSTENTION ? 'abstained' : m.from === BLANK_NULL ? 'voted blank or spoilt' : `voted ${listName(m.from, 'en')}`;
  const to = m.to === ABSTENTION ? 'now abstain' : m.to === BLANK_NULL ? 'now vote blank or spoilt' : `now vote ${listName(m.to, 'en')}`;
  return `${pct} of ${who}${age}${edu} who ${from} in 2025 ${to}`;
}

/**
 * The controls of "Por grupos": who (sex, age, schooling), what they did in 2025, what they do
 * now, and what share of them. The state lives in MoveVotes; this draws the form and the list.
 */
export function GroupMovesPanel({ groups, options, moves, moved, onAdd, onRemove, locale, methodHref }: {
  groups: GroupData | null;
  /** The lists, BLANK_NULL and ABS, in the file's order. */
  options: string[];
  moves: GroupMove[];
  /** Votes each move actually moved (all circles together). */
  moved: number[];
  onAdd: (m: GroupMove) => void;
  onRemove: (i: number) => void;
  locale: Locale;
  /** The methodology's section on the group mode (no locale prefix). */
  methodHref?: string;
}) {
  const pt = locale === 'pt';
  const id = useId();
  const [draft, setDraft] = useState<GroupMove>(GROUP_EXAMPLES[0]);
  const removeButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const firstSelect = useRef<HTMLSelectElement>(null);
  const [focusAfterRemove, setFocusAfterRemove] = useState<number | null>(null);
  useEffect(() => {
    if (focusAfterRemove == null) return;
    const n = moves.length;
    const target = n > 0 ? removeButtons.current[Math.min(focusAfterRemove, n - 1)] : firstSelect.current;
    target?.focus();
    setFocusAfterRemove(null);
  }, [focusAfterRemove, moves.length]);

  const num = (v: number) => formatElectionNumber(v, locale);
  const roundVotes = (v: number) => (v >= 10000 ? Math.round(v / 1000) * 1000 : Math.round(v / 100) * 100);
  const selectClass = 'min-h-11 w-full border border-ink bg-paper px-2 text-base font-medium text-ink sm:text-sm';
  const labelClass = 'mb-1 block text-[12px] font-semibold text-graphite';
  const valid = draft.from !== draft.to && draft.share > 0 && draft.share <= 100;
  const preview = groups && valid ? groupSize(groups, draft) * (draft.share / 100) : null;
  const label = (o: string) => optionName(o, locale);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-[15px] font-semibold text-ink">{pt ? 'Quem muda' : 'Who changes'}</legend>
        <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor={`${id}-sex`} className={labelClass}>{pt ? 'Sexo' : 'Sex'}</label>
            <select ref={firstSelect} id={`${id}-sex`} className={selectClass} value={draft.sex} onChange={e => setDraft({ ...draft, sex: e.target.value as SexChoice })}>
              {SEX_CHOICES.map(s => <option key={s} value={s}>{SEX_LABEL[s][locale]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-age`} className={labelClass}>{pt ? 'Idade' : 'Age'}</label>
            <select id={`${id}-age`} className={selectClass} value={draft.age} onChange={e => setDraft({ ...draft, age: e.target.value as AgeChoice })}>
              {AGE_CHOICES.map(a => <option key={a} value={a}>{AGE_LABEL[a][locale]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-edu`} className={labelClass}>{pt ? 'Escolaridade' : 'Schooling'}</label>
            <select id={`${id}-edu`} className={selectClass} value={draft.edu} onChange={e => setDraft({ ...draft, edu: e.target.value as EduChoice })}>
              {EDU_CHOICES.map(e => <option key={e} value={e}>{EDU_LABEL[e][locale]}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr_7rem_auto] sm:items-end">
          <div>
            <label htmlFor={`${id}-from`} className={labelClass}>{pt ? 'Em 2025' : 'In 2025'}</label>
            <select id={`${id}-from`} className={selectClass} value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })}>
              {options.map(o => <option key={o} value={o}>{label(o)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-to`} className={labelClass}>{pt ? 'Passam a' : 'Now'}</label>
            <select id={`${id}-to`} className={selectClass} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })}>
              {options.map(o => <option key={o} value={o}>{label(o)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-share`} className={labelClass}>{pt ? 'Que parte (%)' : 'Share (%)'}</label>
            <input
              id={`${id}-share`}
              type="number"
              inputMode="decimal"
              min={1}
              max={100}
              step={1}
              value={Number.isFinite(draft.share) ? draft.share : ''}
              onChange={e => setDraft({ ...draft, share: Number(e.target.value) })}
              className={`${selectClass} tabular-nums`}
            />
          </div>
          <Action variant="secondary" onClick={() => onAdd(draft)} disabled={!valid || !groups || moves.length >= MAX_GROUP_MOVES}>
            {pt ? 'Mover' : 'Move'}
          </Action>
        </div>
        {/* The group's size beside the control, so a reader sees how many votes a share is. */}
        <p aria-live="polite" className="mt-2 max-w-[72ch] text-[13px] text-graphite">
          {!groups
            ? (pt ? 'A carregar os grupos…' : 'Loading the groups…')
            : preview == null
              ? (pt ? 'Escolhe de onde e para onde.' : 'Choose from where and to where.')
              : pt
                ? `${groupMoveText(draft, locale)}: cerca de ${num(roundVotes(preview))} pessoas.`
                : `${groupMoveText(draft, locale)}: about ${num(roundVotes(preview))} people.`}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
          <span className="text-graphite">{pt ? 'Exemplos:' : 'Examples:'}</span>
          {GROUP_EXAMPLES.map(m => (
            <button key={`${m.age}-${m.edu}-${m.from}-${m.to}`} type="button" disabled={!groups} onClick={() => onAdd(m)} className="tap-target min-h-11 text-left font-semibold text-ink underline underline-offset-4 hover:decoration-2 disabled:text-graphite">
              {groupMoveText(m, locale)}
            </button>
          ))}
        </div>
      </fieldset>

      {moves.length > 0 && (
        <div>
          <p className={labelClass}>{pt ? 'Votos movidos' : 'Votes moved'}</p>
          <ul className="divide-y divide-grid border-y border-grid">
            {moves.map((m, i) => {
              const text = groupMoveText(m, locale);
              const votes = moved[i];
              return (
                <li key={i} className="flex min-h-11 items-center justify-between gap-3 py-1 text-[15px] text-ink">
                  <span>
                    {text}
                    {votes != null && <span className="text-graphite">{pt ? ` (cerca de ${num(roundVotes(votes))} votos)` : ` (about ${num(roundVotes(votes))} votes)`}</span>}
                  </span>
                  <button ref={el => { removeButtons.current[i] = el; }} type="button" onClick={() => { onRemove(i); setFocusAfterRemove(i); }} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-ink hover:bg-field" aria-label={pt ? `Retirar: ${text}` : `Remove: ${text}`}>
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="max-w-[72ch] text-[13px] text-graphite">
        {pt
          ? 'Os grupos são os cidadãos portugueses residentes com 18 ou mais anos (Censos 2021). Quanto votou cada grupo vem do resultado de 2025 em cada círculo; as diferenças entre grupos vêm do Estudo Eleitoral Português 2024, um inquérito a cerca de 800 pessoas, por isso as dos partidos pequenos são pouco precisas, e as ilhas usam as do continente. Os votos movidos ficam nos círculos onde esse grupo vive e votou assim.'
          : 'The groups are Portuguese citizens aged 18 and over living in Portugal (2021 census). How much each group voted comes from the 2025 result in each circle; the gaps between groups come from the 2024 Portuguese Election Study, a survey of about 800 people, so those of small parties are imprecise, and the islands use the mainland’s. Votes moved stay in the circles where that group lives and voted that way.'}
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
  );
}
