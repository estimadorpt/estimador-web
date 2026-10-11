'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import { FONT_STACK } from '@/lib/brand';
import { AGE_BANDS, HOUSEHOLDS, PEOPLE, SIZES, byAge, bySize, type View } from '@/lib/miniatura/population';
import { nearestHouse } from './hit-test';
import { SCENE, arrangement, columns, houseCell, housePosition, streets, type Layout } from './layout';
import { COLOURS, FIELD, GRAPHITE, INK, LINE, PAPER, RULE } from './scene-palette';

/** How far from a house a finger may land and still choose it, in CSS pixels. */
const TAP_RADIUS_PX = 44;

type Locale = 'pt' | 'en';

/** Each group's name and count, as the grouped views label their rows. */
export function groupLabels(view: Exclude<View, 'homes'>, locale: Locale): Array<{ name: string; detail: string }> {
  const pt = locale === 'pt';
  const people = (n: number) => (pt ? `${n} ${n === 1 ? 'pessoa' : 'pessoas'}` : `${n} ${n === 1 ? 'person' : 'people'}`);
  if (view === 'age') return byAge().map((members, i) => ({ name: AGE_BANDS[locale][i], detail: people(members.length) }));
  return bySize().map((members, i) => {
    const homes = HOUSEHOLDS.filter(h => h.people.length === SIZES[i]).length;
    return {
      name: pt ? `Agregados de ${SIZES[i]}` : `Households of ${SIZES[i]}`,
      detail: pt ? `${homes} ${homes === 1 ? 'agregado' : 'agregados'}, ${people(members.length)}` : `${homes} ${homes === 1 ? 'household' : 'households'}, ${people(members.length)}`,
    };
  });
}

/** One home: a front-on house, ink lines on white; the chosen one filled with ink, like a chosen box. */
function HouseGlyph({ selected }: { selected: boolean }) {
  return <>
    <path d="M0 -30 L28 -52 L56 -30 Z" fill={selected ? INK : FIELD} {...LINE} />
    <rect x={4} y={-30} width={48} height={30} fill={selected ? INK : PAPER} {...LINE} />
    <rect x={10} y={-24} width={9} height={8} fill={PAPER} {...LINE} />
    <rect x={37} y={-24} width={9} height={8} fill={PAPER} {...LINE} />
    <rect x={22.5} y={-17} width={11} height={17} fill={selected ? PAPER : RULE} {...LINE} />
  </>;
}

/**
 * The invented neighbourhood: 30 homes and the 100 people who live in them,
 * then the same people regrouped by age or by household size. The figures
 * move between the views (CSS transitions, off under reduced motion); a
 * chosen household's members stay in full ink in every view, the others fade.
 * The homes are one tab stop: the arrow keys move between them (a roving
 * tabindex), Enter or Space chooses one. A finger that lands between houses
 * chooses the nearest within TAP_RADIUS_PX.
 */
export function Scene({ view, layout, locale, motion, selectedHouse, selectedPerson, onHouseSelect }: {
  view: View;
  layout: Layout;
  locale: Locale;
  /** Animate the move to new spots (a change of view, not of layout). */
  motion: boolean;
  selectedHouse: number | null;
  selectedPerson: number | null;
  onHouseSelect: (id: number) => void;
}) {
  const pt = locale === 'pt';
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const houses = useRef<Array<SVGGElement | null>>([]);
  const pointerType = useRef('');
  const [focusIndex, setFocusIndex] = useState(0);
  useEffect(() => { if (selectedHouse !== null) setFocusIndex(selectedHouse); }, [selectedHouse]);

  const { width, height } = SCENE[layout];
  const { spots, labels, rules } = arrangement(view, layout);
  const homes = view === 'homes';
  const names = homes ? [] : groupLabels(view, locale);
  const wide = layout === 'wide';

  const chosen = selectedHouse === null ? null : HOUSEHOLDS[selectedHouse];
  const description = homes
    ? (pt ? '30 casas e 100 pessoas inventadas, cada pessoa junto da sua casa.' : '30 homes and 100 invented people, each beside their home.')
    : `${view === 'age' ? (pt ? 'As 100 pessoas por idade: ' : 'The 100 people by age: ') : (pt ? 'As 100 pessoas por tamanho do agregado: ' : 'The 100 people by household size: ')}${names.map(n => `${n.name}, ${n.detail}`).join('; ')}.`;
  const highlight = chosen ? (pt ? ` Em destaque, as pessoas do agregado ${chosen.id + 1}.` : ` Highlighted: the people of household ${chosen.id + 1}.`) : '';

  function move(event: KeyboardEvent<SVGGElement>, from: number) {
    const cols = columns(layout);
    const last = HOUSEHOLDS.length - 1;
    const next = ({ ArrowRight: from + 1, ArrowLeft: from - 1, ArrowDown: from + cols, ArrowUp: from - cols, Home: 0, End: last } as Record<string, number>)[event.key];
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onHouseSelect(from);
      return;
    }
    if (next === undefined) return;
    event.preventDefault();
    if (next < 0 || next > last) return;
    setFocusIndex(next);
    houses.current[next]?.focus();
  }

  // A tap that lands between the houses (UXM2V-05): a finger chooses the nearest one within TAP_RADIUS_PX.
  // A house's own click has already been handled.
  function tapNearest(event: MouseEvent<SVGSVGElement>) {
    if (!homes || pointerType.current !== 'touch') return;
    if ((event.target as Element).closest('.mini-house')) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const house = nearestHouse(point, layout, TAP_RADIUS_PX / matrix.a);
    if (house !== null) onHouseSelect(house);
  }

  return (
    <svg
      className="mini-scene"
      viewBox={`0 0 ${width} ${height}`}
      data-view={view}
      data-layout={layout}
      data-motion={motion ? 'on' : 'off'}
      role="group"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      onPointerDown={event => { pointerType.current = event.pointerType; }}
      onClick={tapNearest}
      fontFamily={FONT_STACK}
    >
      <title id={`${id}-title`}>{pt ? 'O bairro inventado' : 'The invented neighbourhood'}</title>
      <desc id={`${id}-desc`}>{description}{highlight}</desc>

      <g className="mini-homes" aria-hidden={homes ? undefined : true}>
        {streets(layout).map(s => <line key={s.y} x1={s.x1} x2={s.x2} y1={s.y} y2={s.y} stroke={RULE} strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
        <g role="group" aria-label={pt ? 'As 30 casas: setas para mudar de casa, Enter para a escolher' : 'The 30 homes: arrow keys to move, Enter to choose'}>
          {HOUSEHOLDS.map(home => {
            const selected = selectedHouse === home.id;
            const cell = houseCell(home.id, layout);
            const at = housePosition(home.id, layout);
            const n = home.people.length;
            return (
              <g
                key={home.id}
                ref={node => { houses.current[home.id] = node; }}
                className="mini-house"
                role={homes ? 'button' : undefined}
                tabIndex={homes ? (home.id === focusIndex ? 0 : -1) : undefined}
                aria-pressed={homes ? selected : undefined}
                aria-label={homes ? (pt ? `Agregado ${home.id + 1}, ${n} ${n === 1 ? 'pessoa' : 'pessoas'}` : `Household ${home.id + 1}, ${n} ${n === 1 ? 'person' : 'people'}`) : undefined}
                onClick={homes ? () => onHouseSelect(home.id) : undefined}
                onKeyDown={homes ? event => move(event, home.id) : undefined}
                onFocus={() => setFocusIndex(home.id)}
              >
                <rect className="mini-house-hit" x={cell.x} y={cell.y} width={cell.width} height={cell.height} fill="transparent" />
                <g transform={`translate(${at.x} ${at.y}) scale(${at.scale})`}><HouseGlyph selected={selected} /></g>
                {/* The chosen home's number over its roof; on a phone the rows are too close for it, and the readout says it. */}
                {selected && wide && <text x={at.x + 28} y={at.y - 58} textAnchor="middle" fontSize={18} fontWeight={700} fill={INK}>{home.id + 1}</text>}
              </g>
            );
          })}
        </g>
      </g>

      {!homes && (
        <g className="mini-groups" aria-hidden="true">
          {rules.map(r => <line key={`${r.x1}-${r.y}`} x1={r.x1} x2={r.x2} y1={r.y} y2={r.y} stroke={RULE} strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
          {labels.map(l => wide ? (
            <g key={l.group}>
              <text x={l.x} y={l.y - 8} fontSize={21} fontWeight={700} fill={INK}>{names[l.group].name}</text>
              <text x={l.x} y={l.y + 22} fontSize={19} fill={GRAPHITE}>{names[l.group].detail}</text>
            </g>
          ) : (
            <text key={l.group} x={l.x} y={l.y + 12} fontSize={16}>
              <tspan fontWeight={700} fill={INK}>{names[l.group].name}</tspan>
              <tspan dx={8} fill={GRAPHITE}>{names[l.group].detail}</tspan>
            </text>
          ))}
        </g>
      )}

      <g className="mini-people" aria-hidden="true">
        {PEOPLE.map(person => {
          const spot = spots[person.id];
          const dim = selectedHouse !== null && person.household !== selectedHouse;
          return (
            <g
              key={person.id}
              className="mini-person"
              style={{ transform: `translate(${spot.x}px, ${spot.y}px) scale(${spot.scale})`, opacity: dim ? 0.16 : 1, '--i': person.id } as CSSProperties}
            >
              {selectedPerson === person.id && <ellipse cy={-11} rx={7.5} ry={14.5} fill="none" stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
              <path d="M-1.6 -5.5 L-2.6 0 M1.6 -5.5 L2.6 0" stroke={INK} strokeWidth={1.4} strokeLinecap="square" fill="none" />
              <rect x={-3.5} y={-15.5} width={7} height={10} fill={COLOURS[person.band]} />
              <circle cy={-19.5} r={3.3} fill={INK} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
