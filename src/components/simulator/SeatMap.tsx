'use client';

import type { MouseEvent } from 'react';
import { BRAND, FONT_STACK } from '@/lib/brand';
import { formatElectionNumber, formatElectionPercent } from '@/lib/election-display';
import { formatSignedNumber } from '@/lib/typography';
import type { CircleResult, ScenarioResult } from '@/lib/simulator/engine';
import { circleLabel, circleName } from '@/lib/simulator/circle-names';
import {
  DOT_R, LABEL_SIZE, SEAT_MAP, SEAT_MAP_CIRCLES, circleBox, circleChanges, circleSeats, nearestSeat,
} from '@/lib/simulator/seat-map';
import { listColor, listName, type Locale } from './copy';
import styles from './Simulator.module.css';
import { useSettled } from './use-settled';

/** How far (in the drawing's units) a tap off every district may land from a seat and still choose its circle. */
const TAP_REACH = 12;
/** A seat that changed hands: a smaller dot inside an ink ring, with paper between them, so the ring reads on dark lists too; the ring reaches 3.8 units out, and seats are at least 7.6 apart (seat-map.test.ts). */
const GAINED_R = 2;
const RING_R = 3.3;
const RING_W = 1;
/** The islands and the emigration circles, drawn in the column on the left: a box takes their taps. */
const INSETS = new Set(['Açores', 'Madeira', 'Europa', 'Fora da Europa']);

/**
 * The seat map: mainland Portugal's districts grown towards their seats, with the islands and
 * the emigration circles on the left (`src/lib/simulator/seat-map.ts`). Each dot is a seat,
 * coloured by the list that holds it under the scenario, the lists filling a district from west
 * to east in the parliament's order. A seat that changed hands against 2025 has an ink ring, and
 * the circle's name turns ink. A tap or click on a district chooses it; the drawing is hidden
 * from screen readers, which choose a circle with the select in the panel beside it
 * (`CirclePanel`) and hear the same figures there.
 */
export function SeatMap({ result, base, selected, onSelect, locale }: {
  result: ScenarioResult;
  base: ScenarioResult;
  selected: string | null;
  onSelect: (circle: string) => void;
  locale: Locale;
}) {
  const circles = result.circles.map((c, i) => {
    const at = SEAT_MAP_CIRCLES[c.name];
    const seats = circleSeats(c.won, base.circles[i].won);
    return { name: c.name, at, label: circleLabel(c.name, locale), seats, changed: seats.some(s => s.gained) };
  }).filter(c => c.at);
  const pick = (e: MouseEvent<SVGSVGElement>) => {
    const hit = (e.target as Element).closest?.('[data-circle]');
    const named = hit?.getAttribute('data-circle');
    if (named) {
      onSelect(named);
      return;
    }
    const ctm = e.currentTarget.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const name = nearestSeat(p.x, p.y, SEAT_MAP_CIRCLES, TAP_REACH);
    if (name) onSelect(name);
  };
  const chosen = circles.find(c => c.name === selected);
  const chosenBox = chosen && INSETS.has(chosen.name) ? circleBox(chosen.at) : null;
  return (
    <svg
      viewBox={`0 0 ${SEAT_MAP.width} ${SEAT_MAP.height}`}
      className={`block h-auto w-full ${styles.seatMap} ${styles.inkMarks}`}
      aria-hidden="true"
      focusable="false"
      onClick={pick}
    >
      {/* The districts: what a tap hits, and their borders. */}
      {circles.filter(c => !INSETS.has(c.name)).map(c => (
        <path
          key={c.name}
          data-circle={c.name}
          className={`${styles.area} ${styles.border}`}
          d={c.at.path}
          fill="transparent"
          stroke={BRAND.line}
          strokeWidth={0.75}
          strokeLinejoin="round"
        />
      ))}
      {/* The islands and the emigration circles: a box each, and the islands' outlines. */}
      {circles.filter(c => INSETS.has(c.name)).map(c => {
        const b = circleBox(c.at);
        return (
          <g key={c.name}>
            <rect data-circle={c.name} className={styles.area} x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} fill="transparent" />
            {c.at.path && <path className={`${styles.passive} ${styles.border}`} d={c.at.path} fill="none" stroke={BRAND.line} strokeWidth={0.75} strokeLinejoin="round" />}
          </g>
        );
      })}
      {chosen && (chosenBox ? (
        <rect className={styles.passive} x={chosenBox.x0} y={chosenBox.y0} width={chosenBox.x1 - chosenBox.x0} height={chosenBox.y1 - chosenBox.y0} fill="none" stroke={BRAND.ink} strokeWidth={1.5} />
      ) : (
        <path className={styles.passive} d={chosen.at.path} fill="none" stroke={BRAND.ink} strokeWidth={1.5} strokeLinejoin="round" />
      ))}
      <g className={styles.passive}>
        {circles.map(c => c.seats.map((s, i) => {
          const [x, y] = c.at.dots[i] ?? [0, 0];
          return s.gained ? (
            <g key={`${c.name}-${i}`}>
              <circle cx={x} cy={y} r={RING_R} fill="none" stroke={BRAND.ink} strokeWidth={RING_W} />
              <circle className={styles.dot} cx={x} cy={y} r={GAINED_R} fill={listColor(s.list)} />
            </g>
          ) : (
            <circle key={`${c.name}-${i}`} className={styles.dot} cx={x} cy={y} r={DOT_R} fill={listColor(s.list)} />
          );
        }))}
        {circles.map(c => {
          const strong = c.changed || c.name === selected;
          return (
            <text
              key={c.name}
              className={styles.halo}
              x={c.at.label.x}
              y={c.at.label.y}
              textAnchor={c.at.label.anchor}
              fontFamily={FONT_STACK}
              fontSize={LABEL_SIZE}
              fontWeight={strong ? 700 : 400}
              fill={strong ? BRAND.ink : BRAND.muted}
              stroke={BRAND.paper}
              strokeWidth={3}
            >
              {c.label}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

/** The ring's key: one seat with its ink ring, as the map draws a seat that changed hands. */
export function RingKey() {
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" className={`inline-block shrink-0 align-[-1px] ${styles.inkMarks}`} aria-hidden="true" focusable="false">
      <circle cx={6} cy={6} r={5} fill="none" stroke={BRAND.ink} strokeWidth={1.4} />
      <circle cx={6} cy={6} r={3.1} fill={BRAND.muted} />
    </svg>
  );
}

/**
 * The chosen circle's figures, beside the map: its lists' shares and seats under the scenario
 * against 2025, and who takes its last seat and how close the next list is. The select chooses
 * the circle for the keyboard and screen readers; with none chosen, the panel lists the circles
 * whose seats change.
 */
export function CirclePanel({ result, base, selected, onSelect, locale }: {
  result: ScenarioResult;
  base: ScenarioResult;
  selected: string | null;
  onSelect: (circle: string | null) => void;
  locale: Locale;
}) {
  const pt = locale === 'pt';
  const num = (v: number) => formatElectionNumber(v, locale);
  const signed = (v: number) => formatSignedNumber(v, locale);
  const names = result.circles.map(c => c.name).sort((a, b) => circleName(a, locale).localeCompare(circleName(b, locale), locale));
  const i = selected == null ? -1 : result.circles.findIndex(c => c.name === selected);
  const now = i >= 0 ? result.circles[i] : null;
  const before = i >= 0 ? base.circles[i] : null;
  const changes = (n: CircleResult, b: CircleResult) => circleChanges(n, b).map(x => `${listName(x.list, locale)} ${signed(x.d)}`).join(', ');
  const changed = result.circles
    .map((c, j) => ({ name: c.name, text: changes(c, base.circles[j]) }))
    .filter(c => c.text);
  // What a screen reader hears once the circle or the scenario settles; the figures below are
  // read when the reader moves into them.
  const summary = now && before ? circleSummary(now, before, locale) : '';
  const settledSummary = useSettled(summary, 400);

  const choose = pt ? 'Escolhe um círculo' : 'Choose a circle';
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-2 border-b border-ink text-[15px]">
        <span className="text-[12px] font-semibold text-graphite">{pt ? 'Círculo' : 'Circle'}</span>
        <span className={styles.choice}>
          <span aria-hidden="true">{now ? circleName(now.name, locale) : choose}</span>
          <select
            aria-label={pt ? 'Círculo eleitoral' : 'Electoral circle'}
            value={selected ?? ''}
            onChange={e => onSelect(e.target.value || null)}
          >
            <option value="">{choose}</option>
            {names.map(n => <option key={n} value={n}>{circleName(n, locale)}</option>)}
          </select>
        </span>
        {now && <span className="text-[14px] tabular-nums text-graphite">{pt ? `${num(now.seats)} mandatos` : `${num(now.seats)} seats`}</span>}
      </div>

      <p aria-live="polite" className="sr-only">{settledSummary}</p>
      <div>
        {now && before ? (
          <CircleFigures now={now} before={before} locale={locale} />
        ) : (
          <div className="pt-2 text-[14px]">
            <p className="text-graphite">
              {pt ? 'Toca num círculo do mapa, ou escolhe-o aqui, para ver os seus votos e o último mandato.' : 'Tap a circle on the map, or choose it here, to see its votes and its last seat.'}
            </p>
            <p className="mt-2 font-semibold text-ink">{pt ? 'Onde mudam os mandatos' : 'Where the seats change'}</p>
            {changed.length === 0 ? (
              <p className="text-graphite">{pt ? 'Em nenhum círculo: os mandatos são os de 2025.' : 'In no circle: the seats are 2025’s.'}</p>
            ) : (
              <ul className="tabular-nums">
                {changed.map(c => (
                  <li key={c.name}>
                    <span className="font-semibold text-ink">{circleName(c.name, locale)}</span>
                    <span className="text-ink">: {c.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** One circle in a sentence: "Lisboa, 48 mandatos: AD 15, PS 12 (−1), Chega 11 (+1)… Último mandato: Chega; a seguir, PS, a 1 234 votos." */
function circleSummary(now: CircleResult, before: CircleResult, locale: Locale): string {
  const pt = locale === 'pt';
  const num = (v: number) => formatElectionNumber(v, locale);
  const signed = (v: number) => formatSignedNumber(v, locale);
  const lists = Object.keys(now.won).sort((a, b) => (now.won[b] ?? 0) - (now.won[a] ?? 0));
  const seats = lists.map(p => {
    const d = (now.won[p] ?? 0) - (before.won[p] ?? 0);
    return `${listName(p, locale)} ${num(now.won[p])}${d ? ` (${signed(d)})` : ''}`;
  });
  const lost = circleChanges(now, before).filter(x => !now.won[x.list]).map(x => `${listName(x.list, locale)} 0 (${signed(x.d)})`);
  const head = `${circleName(now.name, locale)}, ${num(now.seats)} ${pt ? 'mandatos' : 'seats'}: ${[...seats, ...lost].join(', ')}.`;
  if (now.fixed) return `${head} ${pt ? 'Como em 2025.' : 'As in 2025.'}`;
  const r = now.lastSeat.runnerUp;
  const last = pt
    ? `Último mandato: ${listName(now.lastSeat.list, locale)}${r ? `; a seguir, ${listName(r.list, locale)}, a ${num(r.votes)} votos` : ''}.`
    : `Last seat: ${listName(now.lastSeat.list, locale)}${r ? `; next in line, ${listName(r.list, locale)}, ${num(r.votes)} votes short` : ''}.`;
  return `${head} ${last}`;
}

function CircleFigures({ now, before, locale }: { now: CircleResult; before: CircleResult; locale: Locale }) {
  const pt = locale === 'pt';
  const pct = (v: number) => formatElectionPercent(v, locale);
  const num = (v: number) => formatElectionNumber(v, locale);
  const signed = (v: number) => formatSignedNumber(v, locale);
  const total = (c: CircleResult) => Object.values(c.votes).reduce((a, b) => a + b, 0) || 1;
  const tNow = total(now);
  const tBefore = total(before);
  const runner = now.lastSeat.runnerUp;
  // The lists that hold a seat here, now or in 2025, and the next one in line for the last seat.
  const lists = Array.from(new Set([
    ...Object.keys(now.won), ...Object.keys(before.won), ...(runner ? [runner.list] : []),
  ])).sort((a, b) => (now.votes[b] ?? 0) - (now.votes[a] ?? 0));
  const changes = circleChanges(now, before);

  return (
    <div className="pt-1">
      <table className="w-full border-collapse text-[14px] tabular-nums">
        <caption className="sr-only">
          {pt ? `${now.name}: votos e mandatos com estes votos e em 2025` : `${circleName(now.name, locale)}: votes and seats with these votes and in 2025`}
        </caption>
        <thead>
          <tr className="border-b border-grid text-[12px] font-semibold text-graphite">
            <th scope="col" className="py-1 pr-2 text-left">{pt ? 'Lista' : 'List'}</th>
            <th scope="col" className="px-2 py-1 text-right">%</th>
            <th scope="col" className="px-2 py-1 text-right">2025</th>
            <th scope="col" className="py-1 pl-2 text-right">{pt ? 'Mandatos' : 'Seats'}</th>
          </tr>
        </thead>
        <tbody>
          {lists.map(list => {
            const s = now.won[list] ?? 0;
            const d = s - (before.won[list] ?? 0);
            return (
              <tr key={list} className="border-b border-grid">
                <th scope="row" className="py-1 pr-2 text-left font-medium text-ink">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ backgroundColor: listColor(list) }} />
                    {listName(list, locale)}
                  </span>
                </th>
                <td className="px-2 py-1 text-right text-ink">{pct((now.votes[list] ?? 0) / tNow)}</td>
                <td className="px-2 py-1 text-right text-graphite">{pct((before.votes[list] ?? 0) / tBefore)}</td>
                <td className="py-1 pl-2 text-right">
                  <span className="font-bold text-ink">{num(s)}</span>
                  {d !== 0 && <span className="ml-1 text-[13px] font-semibold text-ink">{signed(d)}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[14px] text-ink">
        {now.fixed
          ? (pt ? 'Como em 2025: o simulador não mexe nos círculos da emigração.' : 'As in 2025: the simulator leaves the emigration circles alone.')
          : (
            <>
              <span className="font-semibold">{pt ? 'Último mandato' : 'Last seat'}: {listName(now.lastSeat.list, locale)}</span>
              {runner
                ? (pt
                  ? `. A seguir, ${listName(runner.list, locale)}, a ${num(runner.votes)} votos.`
                  : `. Next in line, ${listName(runner.list, locale)}, ${num(runner.votes)} votes short.`)
                : '.'}
            </>
          )}
      </p>
      {!now.fixed && (
        <p className="mt-1 text-[13px] text-graphite">
          {changes.length
            ? `${pt ? 'Face a 2025' : 'Against 2025'}: ${changes.map(x => `${listName(x.list, locale)} ${signed(x.d)}`).join(', ')}.`
            : (pt ? 'Os mesmos mandatos que em 2025.' : 'The same seats as in 2025.')}
        </p>
      )}
    </div>
  );
}
