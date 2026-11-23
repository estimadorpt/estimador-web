'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChoiceGroup } from '@/components/brand/Choice';
import { Action } from '@/components/brand/Action';
import { Disclosure } from '@/components/viz/Disclosure';
import { BRAND } from '@/lib/brand';
import { formatElectionNumber, formatElectionPercent } from '@/lib/election-display';
import { formatSignedNumber } from '@/lib/typography';
import {
  ABSTENTION, decodeShares, encodeShares, isScenarioHash, nextHash, presetShares, presetVotes, runScenario, sameShares, setShare,
  sharesToVotes, type ScenarioResult, type Shares, type SimulatorData,
} from '@/lib/simulator/engine';
import {
  BLANK_NULL, MAX_GROUP_MOVES, decodeGroupMoves, encodeGroupMoves, isGroupData, runGroupScenario, type GroupData, type GroupMove,
} from '@/lib/simulator/groups';
import { BLANK_MOVE, GroupMovesPanel } from './GroupMovesPanel';
import { Hemicycle, SEAT_ORDER } from './Hemicycle';
import { LastSeatsTable, type LastSeatRow } from './LastSeatsTable';
import { PartySliders } from './PartySliders';
import { CirclePanel, RingKey, SeatMap } from './SeatMap';
import { listColor, listName, type Locale } from './copy';
import { useSettled } from './use-settled';
import { circleName } from '@/lib/simulator/circle-names';
import { circleChanges } from '@/lib/simulator/seat-map';

const MAJORITY = 116;
const TOTAL_SEATS = 230;
/** The group file, fetched when the reader first opens the groups (about 40 KB): public/data/elections/parliamentary-2025/simulator-groups.json, which validate-data checks. */
const GROUPS_URL = '/data/elections/parliamentary-2025/simulator-groups.json';
/** The address and the screen-reader summary wait this long after the last change (a dragged slider fires many). */
const SETTLE_MS = 400;
type Mode = 'parties' | 'groups';
/** What the column beside the controls draws: the parliament, or the seats circle by circle. */
type View = 'parliament' | 'map';

/** The archive's blocs, and the arithmetic of AD with Chega (seat sums, not governments). */
const BLOCS: Array<{ key: string; lists: string[] }> = [
  { key: 'right', lists: ['AD', 'IL'] },
  { key: 'adch', lists: ['AD', 'CH'] },
  { key: 'left', lists: ['PS', 'L', 'CDU', 'BE'] },
];

/**
 * A bloc's seats on a 0–230 ruler: the scenario as a hollow bar (a what-if is drawn hollow),
 * 2025 as a black square (what happened), the 116 line.
 */
function BlocBar({ value, before }: { value: number; before: number }) {
  const width = 150;
  const x = (v: number) => 1 + (Math.min(v, TOTAL_SEATS) / TOTAL_SEATS) * (width - 2);
  return (
    <svg className="block shrink-0" width={width} height={16} viewBox={`0 0 ${width} 16`} aria-hidden="true" focusable="false">
      <line x1={1} x2={width - 1} y1={14.5} y2={14.5} stroke={BRAND.faint} />
      {value > 0 && <rect x={1.5} y={3.5} width={Math.max(1, x(value) - 2)} height={8} fill={BRAND.paper} stroke={BRAND.ink} strokeWidth={1.25} />}
      <rect x={x(before) - 3} y={4.5} width={6} height={6} fill={BRAND.ink} />
      <line x1={x(MAJORITY)} x2={x(MAJORITY)} y1={0} y2={16} stroke={BRAND.ink} strokeWidth={1.5} />
    </svg>
  );
}

/** The parliament in one thin row, for the phone's bar that stays in view under the controls. */
function SeatStrip({ seats }: { seats: Record<string, number> }) {
  let x = 0;
  return (
    <svg viewBox={`0 0 ${TOTAL_SEATS} 10`} preserveAspectRatio="none" className="block h-2.5 w-full" aria-hidden="true" focusable="false">
      {SEAT_ORDER.map(list => {
        const n = seats[list] ?? 0;
        const r = <rect key={list} x={x} y={0} width={n} height={10} fill={listColor(list)} />;
        x += n;
        return r;
      })}
      <line x1={TOTAL_SEATS / 2} x2={TOTAL_SEATS / 2} y1={0} y2={10} stroke={BRAND.paper} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * "Mover votos": the reader changes the 2025 vote, by party (a share per list) or by group
 * (a share of a group of voters, abstainers included), and the parliament beside the controls
 * follows. `anchorId` is the page section's id: a shared scenario link scrolls there, and
 * going back to 2025 leaves it in the address.
 */
export function MoveVotes({ data, locale, anchorId, groupsMethodHref }: {
  data: SimulatorData;
  locale: Locale;
  anchorId?: string;
  /** The methodology's section on the group mode, linked under the group controls. */
  groupsMethodHref?: string;
}) {
  const pt = locale === 'pt';
  const base2025 = useMemo(() => presetShares(data, '2025'), [data]);
  const [mode, setMode] = useState<Mode>('parties');
  const [shares, setShares] = useState<Shares>(base2025);
  const [groups, setGroups] = useState<GroupData | null>(null);
  const [groupsFailed, setGroupsFailed] = useState(false);
  const [groupMoves, setGroupMoves] = useState<GroupMove[]>([BLANK_MOVE]);
  const [view, setView] = useState<View>('parliament');
  const [circle, setCircle] = useState<string | null>(null);
  const groupOptions = useMemo(() => [...data.movable, ...data.fixed, data.others, BLANK_NULL, ABSTENTION], [data]);
  // Set once the address has been read. State, not a ref: the write below must not run in the
  // mount commit, when the scenario is still the default and would wipe the reader's address.
  const [loaded, setLoaded] = useState(false);

  // The scenario lives in the address. It is read after mount only, so the exported HTML
  // (and the first render) is always 2025's result; a static export serves one file. It is read
  // again when the reader pastes or edits a scenario link in the same tab (the page's own writes
  // use replaceState, which fires no hashchange; a jump to a plain anchor changes nothing).
  useEffect(() => {
    const read = (onLoad: boolean) => {
      const hash = window.location.hash;
      if (!onLoad && !isScenarioHash(hash)) return;
      const g = new URLSearchParams(hash.replace(/^#/, '')).get('g');
      if (g != null) {
        setMode('groups');
        const moves = decodeGroupMoves(g, groupOptions);
        setGroupMoves(moves.length ? moves : [BLANK_MOVE]);
      } else {
        const fromHash = decodeShares(hash, data);
        if (fromHash) {
          setMode('parties');
          setShares(fromHash);
        }
      }
      // A scenario link replaces the section's anchor, so bring the section into view.
      if (anchorId && isScenarioHash(hash)) document.getElementById(anchorId)?.scrollIntoView();
    };
    read(true);
    setLoaded(true);
    const onHash = () => read(false);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [data, anchorId, groupOptions]);
  // The group file is fetched once, the first time the groups are opened.
  useEffect(() => {
    if (mode !== 'groups' || groups || groupsFailed) return;
    let live = true;
    fetch(GROUPS_URL)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((g: unknown) => {
        if (!live) return;
        if (isGroupData(g, data)) setGroups(g);
        else setGroupsFailed(true);
      })
      .catch(() => { if (live) setGroupsFailed(true); });
    return () => { live = false; };
  }, [mode, groups, groupsFailed, data]);

  const activeMoves = groupMoves.filter(m => m.share > 0 && m.from !== m.to);
  const ownHash = mode === 'groups'
    ? (activeMoves.length ? `#g=${encodeGroupMoves(activeMoves)}` : '')
    : encodeShares(data, shares);
  // Browsers limit how often the address may change (Safari: 100 times in 30 seconds), and a
  // dragged slider changes it on every step: write it once the scenario has settled.
  const settledHash = useSettled(ownHash, SETTLE_MS);
  useEffect(() => {
    if (!loaded) return;
    const hash = nextHash(settledHash, window.location.hash, anchorId);
    if (hash == null) return;
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    } catch { /* the address is a convenience */ }
  }, [settledHash, loaded, anchorId]);

  const base = useMemo(() => runScenario(data, presetVotes(data, '2025')), [data]);
  const partyResult = useMemo(() => runScenario(data, sharesToVotes(data, shares)), [data, shares]);
  // The file's shape was checked when it arrived; a scenario that still fails shows the same
  // message as a failed fetch instead of taking the section down.
  const groupRun = useMemo(() => {
    if (!groups) return { result: null, failed: false };
    try {
      return { result: runGroupScenario(data, groups, groupMoves), failed: false };
    } catch {
      return { result: null, failed: true };
    }
  }, [data, groups, groupMoves]);
  const groupResult = groupRun.result;
  const groupsUnavailable = groupsFailed || groupRun.failed;
  // Until the group file is in, the groups show 2025's result.
  const result: ScenarioResult = mode === 'groups' ? groupResult ?? base : partyResult;

  const pct = (v: number) => formatElectionPercent(v, locale);
  const num = (v: number) => formatElectionNumber(v, locale);
  const signed = (v: number) => formatSignedNumber(v, locale);
  const seatsOf = (r: ScenarioResult, list: string) => r.totals[list] ?? 0;
  const partyRows = [...data.movable, ...data.fixed];

  const changedCircles = result.circles
    .map((c, i) => ({ name: c.name, diff: circleChanges(c, base.circles[i]) }))
    .filter(c => c.diff.length > 0);

  const lastSeatRows: LastSeatRow[] = result.circles.map((c, i) => ({
    circle: c.name,
    seats: c.seats,
    list: c.lastSeat.list,
    runnerUp: c.lastSeat.runnerUp,
    fixed: c.fixed,
    changed: c.lastSeat.list !== base.circles[i].lastSeat.list,
  }));

  const seatText = (p: string) => {
    const d = seatsOf(result, p) - seatsOf(base, p);
    return `${listName(p, locale)} ${num(seatsOf(result, p))}${d ? ` (${signed(d)})` : ''}`;
  };
  const shown = SEAT_ORDER.filter(p => seatsOf(result, p) > 0 || seatsOf(base, p) > 0);
  const summary = `${pt ? 'Mandatos com estes votos' : 'Seats with these votes'}: ${partyRows.filter(p => seatsOf(result, p) > 0 || seatsOf(base, p) > 0).map(seatText).join(', ')}.`;
  const settledSummary = useSettled(summary, SETTLE_MS);
  const changes = shown.filter(p => seatsOf(result, p) !== seatsOf(base, p));

  const changed = mode === 'groups' ? activeMoves.length > 0 : !sameShares(shares, base2025);
  const reset = () => (mode === 'groups' ? setGroupMoves([BLANK_MOVE]) : setShares(base2025));
  const presetOptions = [
    { value: '2025', label: '2025' },
    ...Object.keys(data.presets).sort().reverse().map(y => ({ value: y, label: y })),
  ];
  const preset = presetOptions.find(o => sameShares(shares, presetShares(data, o.value)))?.value ?? '';

  const changeMove = (i: number, m: GroupMove) => setGroupMoves(list => list.map((x, j) => (j === i ? { ...m, share: Math.min(100, Math.max(0, m.share)) } : x)));
  const addMove = () => setGroupMoves(list => [...list, BLANK_MOVE].slice(0, MAX_GROUP_MOVES));
  const removeMove = (i: number) => setGroupMoves(list => (list.length > 1 ? list.filter((_, j) => j !== i) : [BLANK_MOVE]));
  // An example replaces moves that move nothing yet, and otherwise joins them.
  const example = (m: GroupMove) => setGroupMoves(list => (list.every(x => !(x.share > 0)) ? [m] : [...list, m].slice(0, MAX_GROUP_MOVES)));

  const labelClass = 'mb-1 block text-[12px] font-semibold text-graphite';

  // The lists' colours with their seats: under the parliament, or under the seat map.
  const legend = (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[14px] tabular-nums">
      {shown.map(p => {
        const d = seatsOf(result, p) - seatsOf(base, p);
        return (
          <li key={p} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5" style={{ backgroundColor: listColor(p) }} />
            <span className="text-ink">{listName(p, locale)}</span>
            <span className="font-bold text-ink">{num(seatsOf(result, p))}</span>
            {d !== 0 && <span className="font-semibold text-ink">{signed(d)}</span>}
          </li>
        );
      })}
    </ul>
  );

  // Seat sums and the circles that change: under the parliament from 1024px, after the controls on a phone.
  const details = (
    <>
      <div>
        <p className="border-b border-ink pb-1 text-[12px] font-semibold text-graphite">
          {pt ? `Somas de mandatos (maioria: ${MAJORITY})` : `Seat sums (majority: ${MAJORITY})`}
        </p>
        <ul className="divide-y divide-grid">
          {BLOCS.map(b => {
            const now = b.lists.reduce((a, p) => a + seatsOf(result, p), 0);
            const before = b.lists.reduce((a, p) => a + seatsOf(base, p), 0);
            return (
              <li key={b.key} className="flex min-h-10 items-center justify-between gap-3 text-[14px] tabular-nums">
                <span className="min-w-0 text-ink">{b.lists.map(p => listName(p, locale)).join(' + ')}</span>
                <span className="flex items-center gap-3">
                  <span className="text-right">
                    <span className="font-bold text-ink">{num(now)}</span>
                    {now >= MAJORITY && <span className="ml-1 font-semibold text-ink">{pt ? 'maioria' : 'majority'}</span>}
                  </span>
                  <BlocBar value={now} before={before} />
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-1 text-[12px] text-graphite">
          {pt ? 'Somas, não governos. Barra vazada: cenário; quadrado: 2025; traço: 116.' : 'Sums, not governments. Hollow bar: scenario; square: 2025; line: 116.'}
        </p>
      </div>

      <div>
        <p className="border-b border-ink pb-1 text-[12px] font-semibold text-graphite">{pt ? 'Onde mudam os mandatos' : 'Where the seats change'}</p>
        {changedCircles.length === 0 ? (
          <p className="py-2 text-[14px] text-graphite">{pt ? 'Em nenhum círculo: os mandatos são os de 2025.' : 'In no circle: the seats are 2025’s.'}</p>
        ) : (
          <ul className="divide-y divide-grid text-[14px] tabular-nums">
            {changedCircles.map(c => (
              <li key={c.name} className="flex flex-wrap gap-x-3 py-1.5">
                <span className="min-w-[7.5rem] font-semibold text-ink">{circleName(c.name, locale)}</span>
                <span className="text-ink">{c.diff.map(x => `${listName(x.list, locale)} ${signed(x.d)}`).join(', ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={labelClass} aria-hidden="true">{pt ? 'Mudar o voto' : 'Change the vote'}</p>
          <ChoiceGroup
            label={pt ? 'Mudar o voto' : 'Change the vote'}
            options={[
              { value: 'parties' as Mode, label: pt ? 'Por partido' : 'By party' },
              { value: 'groups' as Mode, label: pt ? 'Por grupo de eleitores' : 'By group of voters' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>
        {changed && <Action variant="secondary" onClick={reset}>{pt ? 'Voltar a 2025' : 'Back to 2025'}</Action>}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12 xl:grid-cols-2">
        {/* The parliament: first on a phone, beside the controls (and in view while they
            scroll) from 1024px. */}
        <div className="min-w-0 lg:order-2">
          <div className="space-y-5 lg:sticky lg:top-20">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-[12px] font-semibold text-graphite">{pt ? 'Com estes votos' : 'With these votes'}</p>
                <ChoiceGroup
                  label={pt ? 'Ver os mandatos' : 'Show the seats'}
                  options={[
                    { value: 'parliament' as View, label: pt ? 'Parlamento' : 'Parliament' },
                    { value: 'map' as View, label: pt ? 'Por círculo' : 'By circle' },
                  ]}
                  value={view}
                  onChange={setView}
                />
              </div>
              {view === 'parliament' ? (
                <div className="mx-auto mt-2 max-w-[26rem]">
                  <Hemicycle seats={result.totals} majority={MAJORITY} caption={pt ? 'para a maioria' : 'for a majority'} />
                </div>
              ) : (
                <div className="mt-3 xl:grid xl:grid-cols-[328px_minmax(0,1fr)] xl:gap-5">
                  <div className="mx-auto w-full max-w-[344px] xl:max-w-none">
                    <SeatMap result={result} base={base} selected={circle} onSelect={setCircle} locale={locale} />
                    {legend}
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-graphite">
                      <RingKey />
                      {pt ? 'Anel: mandato que muda de partido face a 2025.' : 'Ring: a seat that changes party against 2025.'}
                    </p>
                  </div>
                  <div className="mt-4 xl:mt-0">
                    <CirclePanel result={result} base={base} selected={circle} onSelect={setCircle} locale={locale} />
                  </div>
                </div>
              )}
              {view === 'parliament' && legend}
              {/* What a screen reader hears once the scenario settles; the drawing above is hidden from it. */}
              <p aria-live="polite" className="sr-only">{settledSummary}</p>
            </div>

            {view === 'parliament' && <div className="hidden space-y-5 lg:block">{details}</div>}
          </div>
        </div>

        {/* The controls. */}
        <div className="min-w-0 lg:order-1">
          {mode === 'groups' ? (
            groupsUnavailable ? (
              <p className="max-w-[72ch] text-[14px] text-graphite">
                {pt ? 'Não foi possível carregar os grupos. Tenta recarregar a página.' : 'The groups could not be loaded. Try reloading the page.'}
              </p>
            ) : (
              <GroupMovesPanel
                groups={groups}
                options={groupOptions}
                moves={groupMoves}
                moved={groupResult?.moved ?? []}
                onChange={changeMove}
                onAdd={addMove}
                onRemove={removeMove}
                onExample={example}
                locale={locale}
                methodHref={groupsMethodHref}
              />
            )
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[14px] text-graphite">{pt ? 'Partir dos votos de' : 'Start from the vote of'}</span>
                <ChoiceGroup
                  label={pt ? 'Partir dos votos de' : 'Start from the vote of'}
                  options={presetOptions}
                  value={preset}
                  onChange={p => setShares(presetShares(data, p))}
                />
              </div>
              <PartySliders
                lists={data.movable}
                others={data.others}
                shares={shares}
                base={base2025}
                seats={result.totals}
                seatsBase={base.totals}
                onChange={(list, v) => setShares(s => setShare(data, s, list, v))}
                locale={locale}
              />
              <p className="max-w-[68ch] text-[13px] text-graphite">
                {pt
                  ? 'Quando um partido sobe, os outros descem na proporção do que têm. O JPP fica como em 2025 (1 mandato, na Madeira); as outras listas nunca recebem mandatos.'
                  : 'When one party goes up, the others go down in proportion to what they have. JPP stays as in 2025 (1 seat, in Madeira); the other lists never get seats.'}
                {preset && preset !== '2025' && (pt
                  ? ` Os votos de ${preset} são as percentagens nacionais desse ano sobre a geografia de 2025, não o resultado de ${preset}.`
                  : ` The ${preset} vote is that year's national shares on 2025's geography, not the ${preset} result.`)}
              </p>
              <Disclosure summary={pt ? 'Como o voto nacional se distribui pelos círculos' : 'How the national vote is spread over the circles'}>
                <p className="mt-1 max-w-[68ch] text-[14px] text-graphite">
                  {pt
                    ? 'Cada mudança nacional é distribuída pelos 20 círculos do território nacional metade em proporção ao peso de cada partido em 2025, metade por igual, e os mandatos saem do método de Hondt em cada círculo. Mesmo com o voto nacional certo, esta regra deu a outro partido entre 3 e 8 dos 226 mandatos do território nacional em cada eleição de 2019 a 2025. Os círculos da emigração ficam como em 2025.'
                    : 'Each national change is spread over the 20 circles in Portugal half in proportion to each party’s weight there in 2025, half evenly, and the seats come from the D’Hondt method in each circle. Even given the right national vote, this rule gave between 3 and 8 of the 226 seats in Portugal to another party in each election from 2019 to 2025. The emigration circles stay as in 2025.'}
                </p>
              </Disclosure>
            </div>
          )}

          {/* On a phone the parliament is above the controls: this line keeps its changes in
              view while the reader works below it. */}
          <div className="sticky bottom-0 z-10 mt-4 border-t border-ink bg-paper py-2 lg:hidden" aria-hidden="true">
            <SeatStrip seats={result.totals} />
            <p className="mt-1 text-[13px] tabular-nums text-ink">
              {changes.length === 0
                ? (pt ? 'Mandatos como em 2025' : 'Seats as in 2025')
                : changes.map(p => `${listName(p, locale)} ${num(seatsOf(result, p))} (${signed(seatsOf(result, p) - seatsOf(base, p))})`).join(' · ')}
            </p>
          </div>
        </div>
        <div className="min-w-0 space-y-5 lg:hidden">{details}</div>
      </div>

      <div className="space-y-1 border-t border-rule pt-2">
        <Disclosure summary={pt ? 'Tabela: votos e mandatos por partido' : 'Table: votes and seats by party'}>
          <div className="scroll-cue mt-2 overflow-x-auto" tabIndex={0} role="region" aria-label={pt ? 'Votos e mandatos por partido' : 'Votes and seats by party'}>
            <table className="min-w-full border-collapse text-sm tabular-nums">
              <caption className="sr-only">{pt ? 'Votos e mandatos por partido, em 2025 e com estes votos' : 'Votes and seats by party, in 2025 and with these votes'}</caption>
              <thead>
                <tr className="border-b-2 border-ink text-[12px] font-semibold text-graphite">
                  <th scope="col" className="py-2 pr-3 text-left">{pt ? 'Partido' : 'Party'}</th>
                  <th scope="col" className="px-2 py-2 text-right">{pt ? '% em 2025' : '% in 2025'}</th>
                  <th scope="col" className="px-2 py-2 text-right">{pt ? '% no cenário' : '% in scenario'}</th>
                  <th scope="col" className="px-2 py-2 text-right">{pt ? 'Mandatos em 2025' : 'Seats in 2025'}</th>
                  <th scope="col" className="py-2 pl-2 text-right">{pt ? 'Mandatos no cenário' : 'Seats in scenario'}</th>
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
                      <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">{listName(p, locale)}</th>
                      <td className="px-2 py-2 text-right text-graphite">{isFixed ? '—' : pct(base.national[p])}</td>
                      <td className="px-2 py-2 text-right">{isFixed ? '—' : pct(result.national[p])}</td>
                      <td className="px-2 py-2 text-right text-graphite">{isOthers ? '—' : num(before)}</td>
                      <td className="py-2 pl-2 text-right font-semibold">
                        {isOthers ? '—' : <>{num(now)}{now !== before && <span className="ml-1 font-normal">({signed(now - before)})</span>}</>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12.5px] text-graphite">
            {pt
              ? 'Percentagens dos votos em listas no território nacional. O JPP e os dois círculos da emigração ficam como em 2025.'
              : 'Shares of the vote for lists in Portugal. JPP and the two emigration circles stay as in 2025.'}
          </p>
        </Disclosure>
        <Disclosure summary={pt ? 'O último mandato de cada círculo, com estes votos' : 'Each circle’s last seat, with these votes'}>
          <div className="mt-2">
            <LastSeatsTable
              rows={lastSeatRows}
              locale={locale}
              caption={pt ? 'O último mandato de cada círculo, com estes votos' : 'Each circle’s last seat, with these votes'}
              votesHeading={pt ? 'Votos que faltariam' : 'Votes it would need'}
              restLabel={pt ? 'Ver os outros círculos' : 'Show the other circles'}
              fixedNote={pt ? 'como em 2025' : 'as in 2025'}
            />
          </div>
        </Disclosure>
      </div>
    </div>
  );
}
