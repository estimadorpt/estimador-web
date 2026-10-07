'use client';
/**
 * "Bate à porta": the parish page's village (loaded lazily by DoorKnock). Each
 * house is a private household generated for this parish, drawn from the
 * release's microdata by scripts/build-parish-samples.py, and its figures are
 * that household's people. A house opens on a click, a tap near it, Enter or
 * Space; the arrows walk the street. The drawing pieces are the miniatura's
 * (src/components/miniatura/parts.tsx); the scenery is decoration.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, Dices, Mountain, Pause, Play, Shuffle, X } from 'lucide-react';
import { Landscape } from '@/components/miniatura/Landscape';
import { houseShape, nearestPoint } from '@/components/miniatura/hit-test';
import { COLOURS, Figure, HouseArt, SKINS, ageBand } from '@/components/miniatura/parts';
import { NEIGHBOURHOODS, neighbourhoodPosition, type Neighbourhood } from '@/lib/miniatura/population';
import { decodeSamples, defaultLandscape, householdLine, personDetails, personHead, type Locale, type ParishSample, type SampleHousehold } from '@/lib/population/sample';
import styles from './village.module.css';

/** How far from a house a finger may land and still open it, in CSS pixels. */
const TAP_RADIUS_PX = 44;
/** Figures drawn in front of an open house (the card lists everyone). */
const OPEN_FIGURES = 6;
/** Figures waiting at a closed door. */
const DOOR_FIGURES = 2;
/** Below this width the street has four houses a row instead of six. */
const COMPACT_PX = 560;

const SCENERY: Record<Neighbourhood, Record<Locale, string>> = {
  village: { pt: 'aldeia', en: 'village' },
  town: { pt: 'beira-mar', en: 'seaside' },
  city: { pt: 'cidade', en: 'town' },
  hills: { pt: 'serra', en: 'hills' },
};
const AGE_LEGEND = ['0–17', '18–39', '40–64', '65+'];

/** Where house i stands, in the 1000 × 600 scenery. */
function slot(i: number, kind: Neighbourhood, compact: boolean) {
  // The explainer's city packs its blocks tight; a street of 24 to open one by one needs air.
  if (!compact && kind === 'city') {
    const col = i % 6, row = Math.floor(i / 6);
    return { x: 255 + col * 104 - row * 26, y: 150 + row * 84 + col * 14 };
  }
  if (!compact) return neighbourhoodPosition(i, kind);
  const col = i % 4, row = Math.floor(i / 4);
  const base = kind === 'town' ? 395 : 255;
  return { x: base + col * 118 + (row % 2) * 26 - (kind === 'city' ? row * 12 : 0), y: 135 + row * 76 + (kind === 'hills' ? Math.sin(col * 0.9) * 12 : 0) };
}

/** Where the k-th of `count` figures stands, relative to its house's anchor. */
function spot(k: number, count: number, open: boolean) {
  if (!open) return { x: 21 + k * 9, y: 22 - k * 4 };
  const offset = k - (count - 1) / 2;
  return { x: 20 + offset * 9.5, y: 25 - offset * 5.2 };
}

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export default function Village({ file, locale, region, municipality, censusPopulation }: { file: ParishSample; locale: Locale; region: string; municipality: string; censusPopulation: number }) {
  const pt = locale === 'pt';
  const samples = useMemo(() => decodeSamples(file), [file]);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [kind, setKind] = useState<Neighbourhood>(() => defaultLandscape(region, municipality, censusPopulation));
  const [width, setWidth] = useState(0);
  const [still, setStill] = useState(false);
  /** Bumped on every knock (replays "toc, toc" and the hop) and on every new street (replays the arrival). */
  const [knock, setKnock] = useState(0);
  const [street, setStreet] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const houseRefs = useRef<Array<SVGGElement | null>>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pointerType = useRef('');
  /** Set when an open should carry focus to the card (a house chosen in the scene). */
  const focusCard = useRef(false);

  const households = useMemo<SampleHousehold[]>(() => samples[sampleIndex] ?? [], [samples, sampleIndex]);
  const count = households.length;
  const compact = width > 0 && width < COMPACT_PX;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Each house: where it stands, which drawing it gets, its height (for the
  // bubble and the tap target). The drawing changes with the sample, so a new
  // street looks new.
  const houses = useMemo(() => households.map((household, i) => {
    // City blocks all get three floors (multiples of 3), so a tall tower never hides the street behind it.
    const art = kind === 'city' ? ((i + sampleIndex * 4) % 10) * 3 : (i * 7 + sampleIndex * 5) % 30;
    const { x, y } = slot(i, kind, compact);
    return { i, household, art, x, y, height: houseShape(art, kind).height };
  }), [households, kind, compact, sampleIndex]);

  const box = useMemo(() => {
    if (houses.length === 0) return { x: 0, y: 0, w: 1000, h: 600 };
    const left = Math.max(0, Math.min(...houses.map(h => h.x)) - 60);
    const right = Math.min(1000, Math.max(...houses.map(h => h.x)) + 70);
    const top = Math.max(kind === 'town' ? 36 : 0, Math.min(...houses.map(h => h.y - h.height)) - 78);
    const bottom = Math.min(600, Math.max(...houses.map(h => h.y)) + 52);
    return { x: left, y: top, w: right - left, h: bottom - top };
  }, [houses, kind]);
  /** Screen pixels per scene unit, so the bubble's words stay readable on a phone. */
  const scale = width > 0 ? width / box.w : 1;
  const bubbleFont = Math.max(15, 14 / scale);

  // An open house: the card comes into view and, when the house was chosen in
  // the scene, takes the focus (a screen reader hears who lives there).
  useEffect(() => {
    if (selected === null) return;
    const panel = panelRef.current;
    if (panel) {
      const rect = panel.getBoundingClientRect();
      if (rect.bottom > window.innerHeight || rect.top < 0) panel.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
    if (focusCard.current) {
      headingRef.current?.focus({ preventScroll: true });
      focusCard.current = false;
    }
  }, [selected, knock]);

  const open = (i: number, moveFocus: boolean) => {
    focusCard.current = moveFocus;
    setSelected(i);
    setFocusIndex(i);
    setKnock(k => k + 1);
  };
  const close = () => {
    const back = selected ?? focusIndex;
    setSelected(null);
    window.requestAnimationFrame(() => houseRefs.current[back]?.focus());
  };
  const knockAtRandom = () => {
    if (count === 0) return;
    let next = Math.floor(Math.random() * count);
    if (count > 1 && next === selected) next = (next + 1 + Math.floor(Math.random() * (count - 1))) % count;
    open(next, false);
  };
  const anotherSample = () => {
    setSampleIndex(s => (s + 1) % samples.length);
    setSelected(null);
    setFocusIndex(0);
    setStreet(s => s + 1);
  };
  const nextScenery = () => {
    setKind(k => NEIGHBOURHOODS[(NEIGHBOURHOODS.indexOf(k) + 1) % NEIGHBOURHOODS.length]);
    setStreet(s => s + 1);
  };

  const onHouseKey = (event: KeyboardEvent<SVGGElement>, i: number) => {
    const move = (j: number) => {
      event.preventDefault();
      const target = (j + count) % count;
      setFocusIndex(target);
      houseRefs.current[target]?.focus();
    };
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        open(i, true);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        move(i + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        move(i - 1);
        break;
      case 'Home':
        move(0);
        break;
      case 'End':
        move(count - 1);
        break;
      case 'Escape':
        if (selected !== null) { event.preventDefault(); close(); }
        break;
    }
  };

  const current = selected === null ? null : houses[selected] ?? null;
  const all = samples.length === 1;

  return (
    <div>
      <div ref={frameRef} className="overflow-hidden rounded-2xl border border-line bg-cream">
        <div className="relative">
          <svg
            className={styles.scene}
            data-open={selected !== null}
            data-still={still}
            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
            role="group"
            aria-label={pt
              ? `Rua com ${count} casas. Usa as setas para andar de casa em casa e Enter para bater à porta.`
              : `A street of ${count} houses. Use the arrow keys to walk from house to house and Enter to knock.`}
            onPointerDown={event => { pointerType.current = event.pointerType; }}
            onClick={event => {
              // A finger that lands between the houses opens the nearest one (houses are about 30px wide on a phone).
              if (pointerType.current !== 'touch' || (event.target as Element).closest('[data-house]')) return;
              const matrix = event.currentTarget.getScreenCTM();
              if (!matrix) return;
              const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
              const hit = nearestPoint(point, houses.map(h => ({ id: h.i, x: h.x + 3, y: h.y - h.height / 2 })), TAP_RADIUS_PX / matrix.a);
              if (hit !== null) open(hit, true);
            }}
          >
            <g aria-hidden="true">
              <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#f4f2e9" />
              <Landscape kind={kind} />
            </g>
            {/* Back to front, and the open house last: lifted out of the street, it is drawn over its neighbours. */}
            {[...houses].sort((a, b) => Number(a.i === selected) - Number(b.i === selected) || a.y - b.y || a.x - b.x).map((house, order) => {
              const isOpen = selected === house.i;
              const people = house.household.people;
              const shown = people.slice(0, isOpen ? OPEN_FIGURES : DOOR_FIGURES);
              return (
                <g key={`${street}-${house.i}`} transform={`translate(${house.x} ${house.y})`}>
                  <g className={styles.arrive} style={{ '--delay': `${order * 22}ms` } as CSSProperties}>
                    <g
                      ref={node => { houseRefs.current[house.i] = node; }}
                      data-house={house.i}
                      className={styles.house}
                      role="button"
                      tabIndex={house.i === focusIndex ? 0 : -1}
                      aria-pressed={isOpen}
                      aria-label={`${pt ? 'Casa' : 'House'} ${house.i + 1}: ${householdLine(house.household, locale)}`}
                      onClick={() => open(house.i, pointerType.current !== 'mouse')}
                      onKeyDown={event => onHouseKey(event, house.i)}
                      onFocus={() => setFocusIndex(house.i)}
                    >
                      <g className={styles.lift}>
                        <HouseArt id={house.art} neighbourhood={kind} selected={isOpen} glow="#bdc7e7" />
                        {shown.map((person, k) => {
                          const at = spot(k, shown.length, isOpen);
                          const size = (compact ? 1.8 : 1.55) * (person.age < 13 ? 0.74 : 1);
                          return (
                            <g key={`${k}-${isOpen ? knock : 0}`} transform={`translate(${at.x} ${at.y}) scale(${size})`}>
                              <g className={isOpen ? styles.hop : undefined} style={{ '--delay': `${120 + k * 70}ms` } as CSSProperties}>
                                <Figure colour={COLOURS[ageBand(person.age)]} skin={SKINS[(house.art + k) % 3]} grey={person.age >= 65} />
                              </g>
                            </g>
                          );
                        })}
                      </g>
                    </g>
                  </g>
                </g>
              );
            })}
            {current && (
              <g key={`knock-${knock}`} transform={`translate(${Math.min(Math.max(current.x - 2, box.x + bubbleFont * 2.7), box.x + box.w - bubbleFont * 2.7)} ${Math.max(current.y - current.height - 46, box.y + bubbleFont * 1.3)})`} aria-hidden="true">
                <g className={styles.knock}>
                  <rect x={-bubbleFont * 2.6} y={-bubbleFont * 1.15} width={bubbleFont * 5.2} height={bubbleFont * 1.7} rx={bubbleFont * 0.85} fill="#fcfbf5" stroke="#234c40" strokeWidth={1.2} />
                  <path d={`M-4 ${bubbleFont * 0.55} l4 ${bubbleFont * 0.5} l4 ${-bubbleFont * 0.5}Z`} fill="#fcfbf5" stroke="#234c40" strokeWidth={1.2} strokeLinejoin="round" />
                  <path d={`M-3.4 ${bubbleFont * 0.5}h6.8`} stroke="#fcfbf5" strokeWidth={2.4} />
                  <text y={bubbleFont * 0.12} textAnchor="middle" fontSize={bubbleFont} fontWeight={700} fill="#234c40" fontFamily="Manrope, system-ui, sans-serif">
                    {pt ? 'toc, toc' : 'knock, knock'}
                  </text>
                </g>
              </g>
            )}
          </svg>
          {selected === null && (
            <p className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-full border border-line bg-cream/95 px-3 py-1.5 text-[13px] font-semibold text-ink shadow-[0_1px_0_rgba(35,76,64,0.06)]">
              {pt ? 'Escolhe uma casa e bate à porta' : 'Pick a house and knock'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-3 sm:gap-3 sm:px-4">
          <button type="button" onClick={knockAtRandom} className="inline-flex min-h-11 grow basis-[9rem] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-ink px-3 text-[15px] font-semibold text-paper sm:grow-0 sm:basis-auto sm:px-4 transition-colors duration-150 hover:bg-ink-dark">
            <Dices aria-hidden="true" className="h-4 w-4" />
            {pt ? 'Porta ao calhas' : 'A random door'}
          </button>
          {!all && (
            <button type="button" onClick={anotherSample} className="inline-flex min-h-11 grow basis-[9rem] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-line bg-cream px-3 text-[15px] font-semibold text-ink sm:grow-0 sm:basis-auto sm:px-4 transition-colors duration-150 hover:bg-parchment">
              <Shuffle aria-hidden="true" className="h-4 w-4" />
              {pt ? 'Outra amostra' : 'Another sample'}
              <span className="hidden font-normal tabular-nums text-stone-500 sm:inline">{sampleIndex + 1}/{samples.length}</span>
            </button>
          )}
          <button type="button" onClick={nextScenery} className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2 text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
            <Mountain aria-hidden="true" className="h-4 w-4" />
            {pt ? 'Paisagem' : 'Scenery'}: {SCENERY[kind][locale]}
          </button>
          <button
            type="button"
            onClick={() => setStill(s => !s)}
            aria-pressed={still}
            aria-label={pt ? 'Parar a paisagem' : 'Pause the scenery'}
            title={pt ? 'Parar a paisagem' : 'Pause the scenery'}
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-stone-600 transition-colors duration-150 hover:bg-parchment hover:text-ink motion-reduce:hidden"
          >
            {still ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>

        <div aria-live="polite">
          {current && (
            <div
              ref={panelRef}
              key={`${sampleIndex}-${current.i}`}
              className={`${styles.panel} border-t border-line px-4 pb-4 pt-4 sm:px-5`}
              onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close(); } }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                    {pt ? `Casa ${current.i + 1} de ${count}` : `House ${current.i + 1} of ${count}`} · {householdLine(current.household, locale)}
                  </p>
                  <h3 ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-bold tracking-[-0.01em] text-ink outline-none">
                    {pt ? 'Quem vive aqui?' : 'Who lives here?'}
                  </h3>
                </div>
                <button type="button" onClick={close} aria-label={pt ? 'Fechar a casa' : 'Close the house'} className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-stone-600 hover:bg-parchment hover:text-ink">
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <ul className="mt-2 divide-y divide-line">
                {current.household.people.map((person, k) => {
                  const details = personDetails(person, locale);
                  return (
                    <li key={k} className="flex gap-3 py-2.5">
                      <span aria-hidden="true" className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOURS[ageBand(person.age)] }} />
                      <p className="text-[15px] leading-snug text-stone-700">
                        <strong className="font-semibold text-ink">{personHead(person, locale)}</strong>
                        {details.length > 0 && ` · ${details.join(' · ')}`}
                      </p>
                    </li>
                  );
                })}
              </ul>
              {count > 1 && (
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                  <button type="button" onClick={() => open((current.i - 1 + count) % count, false)} className="inline-flex min-h-11 items-center gap-1 rounded-[10px] px-2 text-sm font-semibold text-ink hover:bg-parchment">
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    {pt ? 'Casa anterior' : 'Previous house'}
                  </button>
                  <button type="button" onClick={() => open((current.i + 1) % count, false)} className="inline-flex min-h-11 items-center gap-1 rounded-[10px] px-2 text-sm font-semibold text-ink hover:bg-parchment">
                    {pt ? 'Casa seguinte' : 'Next house'}
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        <strong className="font-semibold text-ink">
          {all
            ? (pt ? `Todos os ${count} agregados gerados para esta freguesia.` : `All ${count} households generated for this parish.`)
            : (pt ? `Uma amostra de ${count} agregados gerados para esta freguesia.` : `A sample of ${count} households generated for this parish.`)}
          {' '}
          {pt ? 'São pessoas geradas, não reais.' : 'They are generated people, not real ones.'}
        </strong>
        {' '}
        {pt
          ? 'Só agregados familiares (sem lares nem outros alojamentos coletivos). A paisagem é decoração.'
          : 'Private households only (no care homes or other collective quarters). The scenery is decoration.'}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-stone-600">
        <span>{pt ? 'Cor de cada pessoa, pela idade:' : 'Each person’s colour, by age:'}</span>
        {AGE_LEGEND.map((label, band) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: COLOURS[band] }} />
            {label}
          </span>
        ))}
      </p>
    </div>
  );
}
