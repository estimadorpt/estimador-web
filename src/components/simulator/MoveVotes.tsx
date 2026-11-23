'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ChoiceGroup } from '@/components/brand/Choice';
import { Action } from '@/components/brand/Action';
import { BRAND } from '@/lib/brand';
import { formatElectionNumber, formatElectionPercent } from '@/lib/election-display';
import { formatSignedNumber } from '@/lib/typography';
import {
  ABSTENTION, MAX_TRANSFERS, MAX_TRANSFER_POINTS, applyTransfers, baseVotes, decodeScenario, encodeScenario, isScenarioHash, nextHash,
  presetVotes, runScenario, swingLists, type Scenario, type SimulatorData, type Transfer,
} from '@/lib/simulator/engine';
import {
  BLANK_NULL, MAX_GROUP_MOVES, decodeGroupMoves, encodeGroupMoves, runGroupScenario, type GroupData, type GroupMove,
} from '@/lib/simulator/groups';
import { GroupMovesPanel } from './GroupMovesPanel';
import { LastSeatsTable, type LastSeatRow } from './LastSeatsTable';
import { listColor, listName, type Locale } from './copy';

const MAJORITY = 116;
/** The group file, fetched when the reader first opens "Por grupos" (about 40 KB). */
const GROUPS_URL = '/data/elections/parliamentary-2025/simulator-groups.json';
type Mode = 'parties' | 'groups';

/** Ready-made transfers to start from: one move each, the reader edits from there. */
const EXAMPLES: Transfer[] = [
  { from: 'PS', to: 'L', points: 3 },
  { from: 'AD', to: 'CH', points: 3 },
  { from: ABSTENTION, to: 'CH', points: 2 },
];

/** The archive's blocs, and the arithmetic of AD with Chega (seat sums, not governments). */
const BLOCS: Array<{ key: string; lists: string[] }> = [
  { key: 'right', lists: ['AD', 'IL'] },
  { key: 'adch', lists: ['AD', 'CH'] },
  { key: 'left', lists: ['PS', 'L', 'CDU', 'BE'] },
];

/**
 * One row's seats on a ruler: the scenario as a hollow bar (a what-if is drawn hollow), 2025
 * as a black square (what happened), and, for blocs, the 116 line.
 */
function SeatBar({ value, before, max, majority }: { value: number; before: number; max: number; majority?: number }) {
  const width = 160;
  const x = (v: number) => 1 + (Math.min(v, max) / max) * (width - 2);
  return (
    <svg className="block" width={width} height={16} viewBox={`0 0 ${width} 16`} aria-hidden="true" focusable="false">
      {value > 0 && <rect x={1.5} y={3.5} width={Math.max(1, x(value) - 2)} height={8} fill={BRAND.paper} stroke={BRAND.ink} strokeWidth={1.25} />}
      <rect x={x(before) - 3} y={4.5} width={6} height={6} fill={BRAND.ink} />
      {majority != null && <line x1={x(majority)} x2={x(majority)} y1={0} y2={16} stroke={BRAND.ink} strokeWidth={1.5} />}
      <line x1={1} x2={width - 1} y1={14.5} y2={14.5} stroke={BRAND.faint} />
    </svg>
  );
}

/**
 * `anchorId` is the page section's id: a shared scenario link scrolls there, and going back to
 * 2025 leaves it in the address.
 */
export function MoveVotes({ data, locale, anchorId, groupsMethodHref }: {
  data: SimulatorData;
  locale: Locale;
  anchorId?: string;
  /** The methodology's section on the group mode, linked under the group controls. */
  groupsMethodHref?: string;
}) {
  const pt = locale === 'pt';
  const id = useId();
  const swing = swingLists(data);
  const sources = [...swing, ABSTENTION];
  const [scenario, setScenario] = useState<Scenario>({ preset: '2025', transfers: [] });
  const [mode, setMode] = useState<Mode>('parties');
  const [groups, setGroups] = useState<GroupData | null>(null);
  const [groupsFailed, setGroupsFailed] = useState(false);
  const [groupMoves, setGroupMoves] = useState<GroupMove[]>([]);
  const groupOptions = useMemo(() => [...data.movable, ...data.fixed, data.others, BLANK_NULL, ABSTENTION], [data]);
  const [draft, setDraft] = useState<Transfer>({ from: 'PS', to: 'L', points: 2 });
  // Set once the address has been read. State, not a ref: the write below must not run in the
  // mount commit, when the scenario is still the default and would wipe the reader's address.
  const [loaded, setLoaded] = useState(false);
  const removeButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const fromSelect = useRef<HTMLSelectElement>(null);
  const [focusAfterRemove, setFocusAfterRemove] = useState<number | null>(null);

  // The scenario lives in the address. It is read after mount only, so the exported HTML
  // (and the first render) is always 2025's result; a static export serves one file.
  useEffect(() => {
    const hash = window.location.hash;
    const g = new URLSearchParams(hash.replace(/^#/, '')).get('g');
    if (g != null) {
      setMode('groups');
      setGroupMoves(decodeGroupMoves(g, groupOptions));
    } else {
      const fromHash = decodeScenario(hash, data);
      if (fromHash.preset !== '2025' || fromHash.transfers.length) setScenario(fromHash);
    }
    setLoaded(true);
    // A scenario link replaces the section's anchor, so bring the section into view.
    if (anchorId && isScenarioHash(hash)) document.getElementById(anchorId)?.scrollIntoView();
  }, [data, anchorId, groupOptions]);
  // The group file is fetched once, the first time the groups are opened.
  useEffect(() => {
    if (mode !== 'groups' || groups || groupsFailed) return;
    let live = true;
    fetch(GROUPS_URL)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((g: GroupData) => { if (live) setGroups(g); })
      .catch(() => { if (live) setGroupsFailed(true); });
    return () => { live = false; };
  }, [mode, groups, groupsFailed]);
  const ownHash = mode === 'groups'
    ? (groupMoves.length ? `#g=${encodeGroupMoves(groupMoves)}` : '')
    : encodeScenario(scenario);
  useEffect(() => {
    if (!loaded) return;
    const hash = nextHash(ownHash, window.location.hash, anchorId);
    if (hash == null) return;
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    } catch { /* the address is a convenience */ }
  }, [ownHash, loaded, anchorId]);
  // After a removal, focus the move now in that place, the one before it, or the form.
  useEffect(() => {
    if (focusAfterRemove == null) return;
    const n = scenario.transfers.length;
    const target = n > 0 ? removeButtons.current[Math.min(focusAfterRemove, n - 1)] : fromSelect.current;
    target?.focus();
    setFocusAfterRemove(null);
  }, [focusAfterRemove, scenario.transfers.length]);

  const base = useMemo(() => runScenario(data, presetVotes(data, '2025')), [data]);
  // One point in votes, rounded to the thousand for the help line.
  const pointVotes = useMemo(() => Math.round(Object.values(baseVotes(data)).reduce((a, b) => a + b, 0) / 100 / 1000), [data]);
  const { result: partyResult, moved } = useMemo(() => {
    const start = presetVotes(data, scenario.preset);
    const applied = applyTransfers(data, start, scenario.transfers);
    return { result: runScenario(data, applied.votes), moved: applied.moved };
  }, [data, scenario]);
  const groupResult = useMemo(() => (groups ? runGroupScenario(data, groups, groupMoves) : null), [data, groups, groupMoves]);
  // Until the group file is in, the groups show 2025's result.
  const result = mode === 'groups' ? groupResult ?? base : partyResult;

  const pct = (v: number) => formatElectionPercent(v, locale);
  const num = (v: number) => formatElectionNumber(v, locale);
  const signed = (v: number) => formatSignedNumber(v, locale);
  const pts = (v: number) => formatElectionNumber(v, locale, Number.isInteger(v) ? 0 : 1);
  const seatsOf = (r: typeof result, list: string) => r.totals[list] ?? 0;

  const partyRows = [...data.movable, ...data.fixed];
  const maxSeats = Math.max(100, ...partyRows.map(p => seatsOf(result, p)));
  const changedCircles = result.circles
    .map((c, i) => {
      const before = base.circles[i].won;
      const lists = Array.from(new Set([...Object.keys(before), ...Object.keys(c.won)]));
      const diff = lists.map(p => ({ p, d: (c.won[p] ?? 0) - (before[p] ?? 0) })).filter(x => x.d !== 0);
      return { name: c.name, diff };
    })
    .filter(c => c.diff.length > 0);

  const lastSeatRows: LastSeatRow[] = result.circles.map((c, i) => ({
    circle: c.name,
    seats: c.seats,
    list: c.lastSeat.list,
    runnerUp: c.lastSeat.runnerUp,
    fixed: c.fixed,
    changed: c.lastSeat.list !== base.circles[i].lastSeat.list,
  }));

  const summary = partyRows
    .filter(p => seatsOf(result, p) > 0 || seatsOf(base, p) > 0)
    .map(p => {
      const d = seatsOf(result, p) - seatsOf(base, p);
      return `${listName(p, locale)} ${num(seatsOf(result, p))}${d ? ` (${signed(d)})` : ''}`;
    })
    .join(', ');

  const update = (next: Scenario) => setScenario(next);
  const addTransfer = (t: Transfer) => {
    if (t.from === t.to || !(t.points > 0)) return;
    update({ ...scenario, transfers: [...scenario.transfers, { ...t, points: Math.min(MAX_TRANSFER_POINTS, t.points) }].slice(0, MAX_TRANSFERS) });
  };
  const removeTransfer = (i: number) => {
    update({ ...scenario, transfers: scenario.transfers.filter((_, j) => j !== i) });
    setFocusAfterRemove(i);
  };
  const reset = () => (mode === 'groups' ? setGroupMoves([]) : update({ preset: '2025', transfers: [] }));
  const addGroupMove = (m: GroupMove) => {
    if (m.from === m.to || !(m.share > 0)) return;
    setGroupMoves(list => [...list, { ...m, share: Math.min(100, m.share) }].slice(0, MAX_GROUP_MOVES));
  };
  const removeGroupMove = (i: number) => setGroupMoves(list => list.filter((_, j) => j !== i));
  const changed = mode === 'groups' ? groupMoves.length > 0 : scenario.transfers.length > 0 || scenario.preset !== '2025';

  const presetOptions = [
    { value: '2025', label: pt ? 'Resultado de 2025' : '2025 result' },
    ...Object.keys(data.presets).sort().reverse().map(y => ({ value: y, label: pt ? `Votos de ${y}` : `${y} votes` })),
  ];

  const selectClass = 'min-h-11 w-full border border-ink bg-paper px-2 text-base font-medium text-ink sm:text-sm';
  const labelClass = 'mb-1 block text-[12px] font-semibold text-graphite';
  const transferText = (t: Transfer, done: number) => {
    const amount = pts(done);
    const what = pt
      ? `${amount} ${done === 1 ? 'ponto' : 'pontos'} ${t.from === ABSTENTION ? 'da abstenção' : `de ${listName(t.from, locale)}`} para ${t.to === ABSTENTION ? 'a abstenção' : listName(t.to, locale)}`
      : `${amount} ${done === 1 ? 'point' : 'points'} from ${t.from === ABSTENTION ? 'abstention' : listName(t.from, locale)} to ${t.to === ABSTENTION ? 'abstention' : listName(t.to, locale)}`;
    const short = done + 1e-9 < t.points
      ? (pt ? ` (pedidos ${pts(t.points)}; não havia mais)` : ` (${pts(t.points)} asked; there was no more)`)
      : '';
    return what + short;
  };

  return (
    <div className="space-y-8">
      {/* Controls: the kind of move, then (between parties) the starting point and the moves,
          or (by groups) who changes. */}
      <div className="space-y-5">
        <div>
          <p className={labelClass} aria-hidden="true">{pt ? 'Mover votos' : 'Move votes'}</p>
          <ChoiceGroup
            label={pt ? 'Mover votos' : 'Move votes'}
            options={[
              { value: 'parties' as Mode, label: pt ? 'Entre partidos' : 'Between parties' },
              { value: 'groups' as Mode, label: pt ? 'Por grupos' : 'By group' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>

        {mode === 'groups' ? (
          groupsFailed ? (
            <p className="max-w-[72ch] text-[14px] text-graphite">
              {pt ? 'Não foi possível carregar os grupos. Tenta recarregar a página.' : 'The groups could not be loaded. Try reloading the page.'}
            </p>
          ) : (
            <GroupMovesPanel
              groups={groups}
              options={groupOptions}
              moves={groupMoves}
              moved={groupResult?.moved ?? []}
              onAdd={addGroupMove}
              onRemove={removeGroupMove}
              locale={locale}
              methodHref={groupsMethodHref}
            />
          )
        ) : (
        <>
        <div>
          <p className={labelClass} aria-hidden="true">{pt ? 'Ponto de partida' : 'Starting point'}</p>
          <ChoiceGroup
            label={pt ? 'Ponto de partida' : 'Starting point'}
            options={presetOptions}
            value={scenario.preset}
            onChange={preset => update({ ...scenario, preset })}
          />
          {scenario.preset !== '2025' && (
            <p className="mt-2 max-w-[72ch] text-[14px] text-graphite">
              {pt
                ? `A percentagem nacional de cada partido em ${scenario.preset}, distribuída pelos círculos a partir da geografia de 2025. Não é o resultado de ${scenario.preset}: o mapa e os eleitores mudaram.`
                : `Each party's national share in ${scenario.preset}, spread over the circles from 2025's geography. It is not the ${scenario.preset} result: the map and the voters changed.`}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-[15px] font-semibold text-ink">{pt ? 'De um partido para outro' : 'From one party to another'}</legend>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr_7rem_auto] sm:items-end">
            <div>
              <label htmlFor={`${id}-from`} className={labelClass}>{pt ? 'De' : 'From'}</label>
              <select ref={fromSelect} id={`${id}-from`} className={selectClass} value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })}>
                {sources.map(p => <option key={p} value={p}>{listName(p, locale)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-to`} className={labelClass}>{pt ? 'Para' : 'To'}</label>
              <select id={`${id}-to`} className={selectClass} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })}>
                {sources.map(p => <option key={p} value={p}>{listName(p, locale)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-pts`} className={labelClass}>{pt ? 'Pontos' : 'Points'}</label>
              <input
                id={`${id}-pts`}
                type="number"
                inputMode="decimal"
                min={0.5}
                max={MAX_TRANSFER_POINTS}
                step={0.5}
                value={Number.isFinite(draft.points) ? draft.points : ''}
                onChange={e => setDraft({ ...draft, points: Number(e.target.value) })}
                className={`${selectClass} tabular-nums`}
              />
            </div>
            <Action variant="secondary" onClick={() => addTransfer(draft)} disabled={draft.from === draft.to || !(draft.points > 0)}>
              {pt ? 'Mover' : 'Move'}
            </Action>
          </div>
          <p className="mt-2 max-w-[72ch] text-[13px] text-graphite">
            {pt
              ? `Um ponto é 1% dos votos em listas no território nacional em 2025 (cerca de ${num(pointVotes)} mil votos). Da abstenção, os votos somam-se; para a abstenção, perdem-se.`
              : `A point is 1% of the 2025 vote for lists in Portugal (about ${num(pointVotes * 1000)} votes). From abstention, votes are added; to abstention, they are lost.`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
            <span className="text-graphite">{pt ? 'Exemplos:' : 'Examples:'}</span>
            {EXAMPLES.map(t => (
              <button key={`${t.from}-${t.to}`} type="button" onClick={() => addTransfer(t)} className="tap-target min-h-11 font-semibold text-ink underline underline-offset-4 hover:decoration-2">
                {transferText(t, t.points)}
              </button>
            ))}
          </div>
        </fieldset>

        {scenario.transfers.length > 0 && (
          <div>
            <p className={labelClass}>{pt ? 'Votos movidos' : 'Votes moved'}</p>
            <ul className="divide-y divide-grid border-y border-grid">
              {scenario.transfers.map((t, i) => (
                <li key={i} className="flex min-h-11 items-center justify-between gap-3 text-[15px] text-ink">
                  <span>{transferText(t, moved[i] ?? 0)}</span>
                  <button ref={el => { removeButtons.current[i] = el; }} type="button" onClick={() => removeTransfer(i)} className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink hover:bg-field" aria-label={pt ? `Retirar: ${transferText(t, moved[i] ?? 0)}` : `Remove: ${transferText(t, moved[i] ?? 0)}`}>
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        </>
        )}
        {changed && (
          <Action variant="text" onClick={reset}>{pt ? 'Voltar a 2025' : 'Back to 2025'}</Action>
        )}
      </div>

      {/* The readout: present from load, announced when it changes. */}
      <p aria-live="polite" className="max-w-[72ch] border-l-2 border-ink pl-3 text-[15px] text-ink">
        <span className="font-semibold">{pt ? 'Mandatos com estes votos: ' : 'Seats with these votes: '}</span>
        {summary}.
      </p>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="min-w-0">
          <h4 className="mb-2 text-[16px] font-semibold text-ink">{pt ? 'Votos e mandatos por partido' : 'Votes and seats by party'}</h4>
          <div className="scroll-cue overflow-x-auto" tabIndex={0} role="region" aria-label={pt ? 'Votos e mandatos por partido' : 'Votes and seats by party'}>
            <table className="min-w-full border-collapse text-sm tabular-nums">
              <caption className="sr-only">{pt ? 'Votos e mandatos por partido, em 2025 e com estes votos' : 'Votes and seats by party, in 2025 and with these votes'}</caption>
              <thead>
                <tr className="border-b-2 border-ink text-[12px] font-semibold text-graphite">
                  <th scope="col" className="py-2 pr-3 text-left">{pt ? 'Partido' : 'Party'}</th>
                  <th scope="col" className="px-2 py-2 text-right">{pt ? '% em 2025' : '% in 2025'}</th>
                  <th scope="col" className="px-2 py-2 text-right">{pt ? '% no cenário' : '% in scenario'}</th>
                  <th scope="col" className="px-2 py-2 text-right">{pt ? 'Mandatos em 2025' : 'Seats in 2025'}</th>
                  <th scope="col" className="px-2 py-2 text-right">{pt ? 'Mandatos no cenário' : 'Seats in scenario'}</th>
                  <th scope="col" className="py-2 pl-2 text-left"><span className="sr-only">{pt ? 'Gráfico' : 'Chart'}</span></th>
                </tr>
              </thead>
              <tbody>
                {[...partyRows, data.others].map(p => {
                  const isOthers = p === data.others;
                  const isFixed = data.fixed.includes(p);
                  const now = seatsOf(result, p);
                  const before = seatsOf(base, p);
                  return (
                    <tr key={p} className="border-b border-grid">
                      <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ backgroundColor: listColor(p) }} />
                          {listName(p, locale)}
                        </span>
                      </th>
                      <td className="px-2 py-2 text-right text-graphite">{isFixed ? '—' : pct(base.national[p])}</td>
                      <td className="px-2 py-2 text-right">{isFixed ? '—' : pct(result.national[p])}</td>
                      <td className="px-2 py-2 text-right text-graphite">{isOthers ? '—' : num(before)}</td>
                      <td className="px-2 py-2 text-right font-semibold">
                        {isOthers ? '—' : <>{num(now)}{now !== before && <span className="ml-1 font-normal">({signed(now - before)})</span>}</>}
                      </td>
                      <td className="py-2 pl-2">{!isOthers && <SeatBar value={now} before={before} max={maxSeats} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12.5px] text-graphite">
            {pt
              ? 'Percentagens dos votos em listas no território nacional. O JPP e os dois círculos da emigração ficam como em 2025. As outras listas nunca recebem mandatos: são muitas e nenhuma chegou perto de um em 2025.'
              : 'Shares of the vote for lists in Portugal. JPP and the two emigration circles stay as in 2025. The other lists never get seats: they are many, and none came close to one in 2025.'}
          </p>
        </div>

        <div className="min-w-0 space-y-8">
          <div>
            <h4 className="mb-2 text-[16px] font-semibold text-ink">{pt ? `Somas de mandatos e a maioria de ${MAJORITY}` : `Seat sums and the ${MAJORITY}-seat majority`}</h4>
            <div className="scroll-cue overflow-x-auto" tabIndex={0} role="region" aria-label={pt ? 'Somas de mandatos' : 'Seat sums'}>
            <table className="min-w-full border-collapse text-sm tabular-nums">
              <caption className="sr-only">{pt ? 'Somas de mandatos, em 2025 e com estes votos' : 'Seat sums, in 2025 and with these votes'}</caption>
              <thead>
                <tr className="border-b-2 border-ink text-[12px] font-semibold text-graphite">
                  <th scope="col" className="py-2 pr-3 text-left">{pt ? 'Partidos' : 'Parties'}</th>
                  <th scope="col" className="px-2 py-2 text-right">2025</th>
                  <th scope="col" className="px-2 py-2 text-right">{pt ? 'Cenário' : 'Scenario'}</th>
                  <th scope="col" className="py-2 pl-2 text-left"><span className="sr-only">{pt ? 'Gráfico' : 'Chart'}</span></th>
                </tr>
              </thead>
              <tbody>
                {BLOCS.map(b => {
                  const now = b.lists.reduce((a, p) => a + seatsOf(result, p), 0);
                  const before = b.lists.reduce((a, p) => a + seatsOf(base, p), 0);
                  return (
                    <tr key={b.key} className="border-b border-grid">
                      <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">{b.lists.map(p => listName(p, locale)).join(' + ')}</th>
                      <td className="px-2 py-2 text-right text-graphite">{num(before)}</td>
                      <td className="px-2 py-2 text-right font-semibold">
                        {num(now)}
                        {now >= MAJORITY && <span className="ml-1 font-normal">{pt ? '(maioria)' : '(majority)'}</span>}
                      </td>
                      <td className="py-2 pl-2"><SeatBar value={now} before={before} max={230} majority={MAJORITY} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <p className="mt-2 text-[12.5px] text-graphite">
              {pt
                ? 'Somas de mandatos, não governos. Barra vazada: o cenário; quadrado preto: 2025; traço vertical: 116 mandatos.'
                : 'Seat sums, not governments. Hollow bar: the scenario; black square: 2025; vertical line: 116 seats.'}
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-[16px] font-semibold text-ink">{pt ? 'Círculos onde os mandatos mudam' : 'Circles where seats change'}</h4>
            {changedCircles.length === 0 ? (
              <p className="text-[14px] text-graphite">{pt ? 'Nenhum: os mandatos são os de 2025.' : 'None: the seats are 2025’s.'}</p>
            ) : (
              <ul className="divide-y divide-grid border-y border-grid text-[14px] tabular-nums">
                {changedCircles.map(c => (
                  <li key={c.name} className="flex flex-wrap gap-x-3 py-2">
                    <span className="min-w-[8rem] font-medium text-ink">{c.name}</span>
                    <span className="text-ink">{c.diff.sort((a, b) => b.d - a.d).map(x => `${listName(x.p, locale)} ${signed(x.d)}`).join(', ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[16px] font-semibold text-ink">{pt ? 'O último mandato de cada círculo, com estes votos' : 'Each circle’s last seat, with these votes'}</h4>
        <LastSeatsTable
          rows={lastSeatRows}
          locale={locale}
          caption={pt ? 'O último mandato de cada círculo, com estes votos' : 'Each circle’s last seat, with these votes'}
          votesHeading={pt ? 'Votos que faltariam' : 'Votes it would need'}
          restLabel={pt ? 'Ver os outros círculos' : 'Show the other circles'}
          fixedNote={pt ? 'como em 2025' : 'as in 2025'}
        />
      </div>
    </div>
  );
}
