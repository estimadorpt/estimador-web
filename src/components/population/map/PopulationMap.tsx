'use client';

/**
 * The parish map: Portugal → region → município → parish, one continuous
 * camera over the CAOP 2021 boundaries.
 *
 * What it shows is geography and one piece of metadata: a parish's quality
 * tier (A, B or C in places.json), which says how closely the generated
 * population follows INE's tables. Since v1.0.1 every parish shows its own
 * figures; a município fallback, which the contract can still express, is
 * named in the readout. No statistic is mapped, nothing is ranked, and no
 * person or home is drawn. The only number is a parish's resident count, labelled as
 * INE's (Censos 2021).
 *
 * Geometry is fetched per level (country, then the region's municípios, then
 * the município's parishes) once the map comes near the viewport.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, FocusEvent as ReactFocusEvent } from 'react';
import { interpolateZoom } from 'd3';
import { ArrowRight, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, Shuffle } from 'lucide-react';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { Legend } from '@/components/viz/Legend';
import { QualityBadge } from '@/components/population/QualityBadge';
import { parishHref } from '@/components/population/ParishLink';
import { fetchPlaces } from '@/lib/population/client';
import { formatCount } from '@/lib/population/format';
import { TIER_COPY } from '@/lib/population/labels';
import { indexPlaces, normaliseParishCode, regionTitle, type Parish, type PlaceIndex } from '@/lib/population/places';
import {
  cameraTransform, clampZoom, easeInOut, fitCamera, flightDuration, fromZoomView, sameCamera, toZoomView, zoomCamera,
  type Camera, type Viewport,
} from '@/lib/population/map/camera';
import { countryBounds, insetFrame, project, type Bounds, type MapShape } from '@/lib/population/map/geometry';
import {
  breadcrumb, byName, COUNTRY, geometryFiles, parentView, regionOfMunicipality, resolveInitialView, sameView, shortParishName, viewOfParish,
  type MapView,
} from '@/lib/population/map/levels';
import { placeLabels, type LabelCandidate } from '@/lib/population/map/placement';
import { loadShapes } from '@/lib/population/map/load';
import styles from './PopulationMap.module.css';

export interface PopulationMapProps {
  locale: 'pt' | 'en';
  /** Region to open on ("01"…"18", "azores", "madeira"); the whole country when absent. */
  initialRegion?: string;
  /** A parish to highlight and fly to (its code). */
  focusParish?: string;
  /** Called when a parish is chosen; without it, choosing navigates to the parish page. */
  onSelectParish?: (code: string) => void;
  /** Height in px of the map canvas on wide screens. */
  height?: number;
  className?: string;
}

type Kind = 'region' | 'municipality' | 'parish';
interface Subject { kind: Kind; code: string }

/**
 * Quality tier, as calm fills: A and B in two mint shades, C in the caveat
 * tint (amber means caveat on this site). The tier is metadata, not a statistic.
 */
const TIER_FILL = {
  A: 'var(--color-mint-soft)',
  B: 'color-mix(in srgb, var(--color-mint-soft) 45%, var(--color-cream))',
  C: 'var(--color-amber-200)',
} as const;
const MAX_ZOOM = 10;

const copy = {
  pt: {
    map: 'Mapa de freguesias',
    loading: 'A desenhar o mapa…',
    loadingLevel: 'A carregar…',
    failed: 'O mapa não carregou. A lista abaixo do mapa tem os mesmos lugares.',
    retry: 'Tentar novamente',
    up: 'Subir um nível',
    zoomIn: 'Aproximar',
    zoomOut: 'Afastar',
    reset: 'Repor o enquadramento',
    random: 'Uma freguesia ao acaso',
    region: (id: string) => (id === 'azores' || id === 'madeira' ? 'Região autónoma' : 'Distrito'),
    municipality: 'Concelho',
    parish: 'Freguesia',
    regions: (n: number) => `${n} distritos e regiões autónomas`,
    municipalities: (n: number) => `${n} ${n === 1 ? 'concelho' : 'concelhos'}`,
    parishes: (n: number) => `${n} ${n === 1 ? 'freguesia' : 'freguesias'}`,
    concelho: (name: string) => `Concelho de ${name}`,
    residents: 'Residentes',
    ine: 'INE, Censos 2021',
    tier: (tier: 'A' | 'B' | 'C') => `Qualidade ${tier}`,
    tierLegend: { A: 'A · ajuste próximo, 2 000 ou mais residentes', B: 'B · ajuste próximo, 500 ou mais residentes', C: 'C · freguesia pequena ou ajuste mais fraco' },
    fallback: 'Valores do concelho',
    fallbackLong: (name: string) => `O retrato mostra os números do concelho de ${name}: os da freguesia não têm qualidade para publicar.`,
    open: 'Ver a freguesia',
    choose: 'Escolher esta freguesia',
    tapAgain: 'Toca outra vez na freguesia, ou usa o botão, para a abrir.',
    hintCountry: 'Escolhe um distrito ou uma região autónoma.',
    hintRegion: 'Escolhe um concelho para ver as suas freguesias.',
    hintMunicipality: 'Escolhe uma freguesia para ver o seu retrato.',
    legendTitle: 'Qualidade do ajuste: A / B / C',
    list: 'Ver como lista',
    listCountry: 'Distritos e regiões autónomas',
    listRegion: (name: string) => `Concelhos: ${name}`,
    listMunicipality: (name: string) => `Freguesias de ${name}`,
    source: 'Limites: CAOP 2021 (DGT, CC BY 4.0). Residentes: INE, Censos 2021.',
    insets: 'Açores e Madeira em caixa; os Açores a uma escala menor.',
    selvagens: 'As ilhas Selvagens (Sé, Funchal) ficam fora do enquadramento.',
    showing: (name: string, what: string) => `${name}: ${what} no mapa.`,
    mapLabel: (name: string) => `Mapa: ${name}. Usa Tab para percorrer os lugares e Enter para escolher; Escape sobe um nível.`,
    breadcrumb: 'Onde estás no mapa',
    controls: 'Controlos do mapa',
  },
  en: {
    map: 'Parish map',
    loading: 'Drawing the map…',
    loadingLevel: 'Loading…',
    failed: 'The map did not load. The list below the map has the same places.',
    retry: 'Try again',
    up: 'Up one level',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset the view',
    random: 'A parish at random',
    region: (id: string) => (id === 'azores' || id === 'madeira' ? 'Autonomous region' : 'District'),
    municipality: 'Municipality',
    parish: 'Parish',
    regions: (n: number) => `${n} districts and autonomous regions`,
    municipalities: (n: number) => `${n} ${n === 1 ? 'municipality' : 'municipalities'}`,
    parishes: (n: number) => `${n} ${n === 1 ? 'parish' : 'parishes'}`,
    concelho: (name: string) => `Municipality of ${name}`,
    residents: 'Residents',
    ine: 'INE, 2021 Census',
    tier: (tier: 'A' | 'B' | 'C') => `Quality ${tier}`,
    tierLegend: { A: 'A · close fit, 2,000 or more residents', B: 'B · close fit, 500 or more residents', C: 'C · small parish or weaker fit' },
    fallback: 'Municipality figures',
    fallbackLong: (name: string) => `The portrait shows the figures for the municipality of ${name}: the parish’s own did not reach publication quality.`,
    open: 'See the parish',
    choose: 'Choose this parish',
    tapAgain: 'Tap the parish again, or use the button, to open it.',
    hintCountry: 'Choose a district or an autonomous region.',
    hintRegion: 'Choose a municipality to see its parishes.',
    hintMunicipality: 'Choose a parish to see its portrait.',
    legendTitle: 'Quality of fit: A / B / C',
    list: 'View as a list',
    listCountry: 'Districts and autonomous regions',
    listRegion: (name: string) => `Municipalities: ${name}`,
    listMunicipality: (name: string) => `Parishes of ${name}`,
    source: 'Boundaries: CAOP 2021 (DGT, CC BY 4.0). Residents: INE, 2021 Census.',
    insets: 'The Azores and Madeira are boxed; the Azores at a smaller scale.',
    selvagens: 'The Selvagens islands (Sé, Funchal) fall outside the frame.',
    showing: (name: string, what: string) => `${name}: ${what} on the map.`,
    mapLabel: (name: string) => `Map: ${name}. Use Tab to move between places and Enter to choose; Escape goes up a level.`,
    breadcrumb: 'Where you are on the map',
    controls: 'Map controls',
  },
} as const;

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PopulationMap({ locale, initialRegion, focusParish, onSelectParish, height = 560, className = '' }: PopulationMapProps) {
  const t = copy[locale];
  const uid = useId().replace(/:/g, '');

  // ---- state ---------------------------------------------------------------
  const [view, setView] = useState<MapView>(() => resolveInitialView({ initialRegion, focusParish }));
  const [focus, setFocus] = useState<string | null>(() => normaliseParishCode(focusParish));
  const [active, setActive] = useState<Subject | null>(null);
  const [preview, setPreview] = useState<{ code: string; touch: boolean } | null>(null);
  const [manual, setManual] = useState<Camera | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [moving, setMoving] = useState(false);
  const [near, setNear] = useState(false);
  const [shapes, setShapes] = useState<Record<string, MapShape[]>>({});
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [places, setPlaces] = useState<PlaceIndex | null>(null);
  const [width, setWidth] = useState(0);

  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cameraGroup = useRef<SVGGElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const lastViewport = useRef<string>('');
  const pointerType = useRef<string>('mouse');
  const drag = useRef<{ x: number; y: number; start: Camera; moved: boolean } | null>(null);
  const keyboardChoice = useRef(false);

  // Props that change after mount move the map (a search on the page, a region link).
  const firstProps = useRef(true);
  useEffect(() => {
    if (firstProps.current) { firstProps.current = false; return; }
    const code = normaliseParishCode(focusParish);
    const next = resolveInitialView({ initialRegion, focusParish });
    setView(previous => (sameView(previous, next) ? previous : next));
    setManual(null);
    setPreview(null);
    setFocus(code);
  }, [focusParish, initialRegion]);

  // ---- size and visibility ---------------------------------------------------
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '600px 0px' });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const compact = width > 0 && width < 640;
  const mapHeight = compact ? Math.round(Math.min(height, Math.max(360, width * 1.08))) : height;
  const viewport = useMemo<Viewport | null>(() => (width ? { width, height: mapHeight } : null), [width, mapHeight]);

  // ---- data ------------------------------------------------------------------
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    fetchPlaces().then(data => { if (!cancelled) setPlaces(indexPlaces(data)); }).catch(() => { /* names fall back to the geometry's own */ });
    return () => { cancelled = true; };
  }, [near]);

  const files = useMemo(() => geometryFiles(view), [view]);
  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    setFailed(false);
    for (const url of files) {
      loadShapes(url)
        .then(list => { if (!cancelled) setShapes(previous => (previous[url] ? previous : { ...previous, [url]: list })); })
        .catch(() => { if (!cancelled) setFailed(true); });
    }
    return () => { cancelled = true; };
  }, [files, near, attempt]);

  const countryShapes = shapes[files[0]];
  const municipalityShapes = files[1] ? shapes[files[1]] : undefined;
  const parishShapes = files[2] ? shapes[files[2]] : undefined;
  const loadingLevel = near && !failed && files.some(url => !shapes[url]);

  // ---- names -------------------------------------------------------------------
  const regionName = useCallback((id: string) => places?.regionById.get(id)?.name ?? countryShapes?.find(s => s.code === id)?.name, [places, countryShapes]);
  const municipalityName = useCallback((code: string) => places?.municipalityByCode.get(code)?.name ?? municipalityShapes?.find(s => s.code === code)?.name, [places, municipalityShapes]);
  const crumbs = useMemo(() => breadcrumb(view, { region: regionName, municipality: municipalityName }), [view, regionName, municipalityName]);
  const here = crumbs[crumbs.length - 1].label;

  // ---- camera ------------------------------------------------------------------
  const fitBounds = useMemo<Bounds | null>(() => {
    if (!countryShapes) return null;
    if (view.level === 'country') return countryBounds(countryShapes);
    const regionFit = countryShapes.find(s => s.code === view.region)?.fit ?? null;
    if (view.level === 'region') return regionFit;
    return municipalityShapes?.find(s => s.code === view.municipality)?.fit ?? regionFit;
  }, [countryShapes, municipalityShapes, view]);

  const padding = compact ? 16 : 28;
  const fit = useMemo(() => (fitBounds && viewport ? fitCamera(fitBounds, viewport, padding) : null), [fitBounds, viewport, padding]);
  const target = useMemo(() => manual ?? fit, [manual, fit]);

  const apply = useCallback((next: Camera) => {
    if (viewport && cameraGroup.current) cameraGroup.current.setAttribute('transform', cameraTransform(next, viewport));
  }, [viewport]);

  useEffect(() => {
    if (!target || !viewport) return;
    const from = cameraRef.current;
    const viewportKey = `${viewport.width}x${viewport.height}`;
    const resized = lastViewport.current !== viewportKey;
    lastViewport.current = viewportKey;
    if (!from || resized || prefersReducedMotion() || sameCamera(from, target)) {
      cameraRef.current = target;
      apply(target);
      setCamera(target);
      setMoving(false);
      return;
    }
    const interpolate = interpolateZoom(toZoomView(from, viewport), toZoomView(target, viewport));
    const duration = manual ? 180 : flightDuration(from, target, viewport);
    const start = performance.now();
    let frame = 0;
    setMoving(true);
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const next = fromZoomView(interpolate(easeInOut(progress)), viewport);
      cameraRef.current = next;
      apply(next);
      if (progress < 1) { frame = requestAnimationFrame(tick); return; }
      cameraRef.current = target;
      setCamera(target);
      setMoving(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, viewport, manual, apply]);

  const zoomBy = useCallback((factor: number, anchor?: [number, number]) => {
    const base = cameraRef.current;
    if (!base || !fit || !viewport) return;
    const next = clampZoom(zoomCamera(base, factor, viewport, anchor), fit, MAX_ZOOM);
    setManual(next.k <= fit.k * 1.001 ? null : next);
  }, [fit, viewport]);

  // ctrl/⌘ + wheel (and trackpad pinch) zooms about the pointer; a plain wheel scrolls the page.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const box = svg.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY * 0.01), [event.clientX - box.left, event.clientY - box.top]);
    };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => svg.removeEventListener('wheel', wheel);
  }, [zoomBy]);

  // ---- choosing ------------------------------------------------------------------
  // A new place starts from its own framing, with nothing hovered or previewed.
  const goTo = useCallback((next: MapView) => {
    setView(previous => (sameView(previous, next) ? previous : next));
    setManual(null);
    setActive(null);
    setPreview(null);
  }, []);

  const chooseParish = useCallback((code: string) => {
    setFocus(code);
    setPreview(null);
    if (onSelectParish) onSelectParish(code);
    else window.location.assign(parishHref(code, locale));
  }, [onSelectParish, locale]);

  const choose = useCallback((kind: Kind, code: string) => {
    if (kind === 'region') { goTo({ level: 'region', region: code }); return; }
    if (kind === 'municipality') { goTo({ level: 'municipality', region: regionOfMunicipality(code), municipality: code }); return; }
    if (pointerType.current === 'touch' && preview?.code !== code) { setPreview({ code, touch: true }); setActive(null); return; }
    chooseParish(code);
  }, [goTo, preview, chooseParish]);

  const up = useCallback(() => { const parent = parentView(view); if (parent) goTo(parent); }, [view, goTo]);

  const zoomOut = useCallback(() => {
    if (manual && fit && manual.k > fit.k * 1.05) { zoomBy(1 / 1.6); return; }
    if (manual) { setManual(null); return; }
    up();
  }, [manual, fit, zoomBy, up]);

  const random = useCallback(() => {
    if (!places?.parishes.length) return;
    const parish = places.parishes[Math.floor(Math.random() * places.parishes.length)];
    goTo(viewOfParish(parish.code));
    setFocus(parish.code);
    setPreview({ code: parish.code, touch: false });
  }, [places, goTo]);

  const subjectOf = (target: EventTarget | null): Subject | null => {
    const element = (target as Element | null)?.closest?.('[data-code]') as SVGElement | null;
    if (!element) return null;
    return { kind: element.dataset.kind as Kind, code: element.dataset.code! };
  };

  const onClick = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (drag.current?.moved) return;
    const subject = subjectOf(event.target);
    if (subject) choose(subject.kind, subject.code);
  };
  const onKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'Escape') {
      if (!parentView(view)) return;
      event.preventDefault();
      keyboardChoice.current = true;
      up();
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const subject = subjectOf(event.target);
    if (!subject) return;
    event.preventDefault();
    pointerType.current = 'keyboard';
    keyboardChoice.current = subject.kind !== 'parish';
    choose(subject.kind, subject.code);
  };
  const onFocus = (event: ReactFocusEvent<SVGSVGElement>) => { const subject = subjectOf(event.target); if (subject) setActive(subject); };
  const onBlur = () => setActive(null);
  const onPointerOver = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch' || drag.current?.moved) return;
    const subject = subjectOf(event.target);
    setActive(previous => (previous?.code === subject?.code && previous?.kind === subject?.kind ? previous : subject));
  };
  const onPointerLeave = () => setActive(null);

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    pointerType.current = event.pointerType || 'mouse';
    const current = cameraRef.current;
    if (event.button !== 0 || !current) return;
    // A touch drag pans only once zoomed in; otherwise the page scrolls as usual.
    if (event.pointerType !== 'mouse' && !manual) return;
    drag.current = { x: event.clientX, y: event.clientY, start: current, moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    if (!state.moved) { state.moved = true; setMoving(true); setActive(null); event.currentTarget.setPointerCapture(event.pointerId); }
    const next = { ...state.start, x: state.start.x - dx / state.start.k, y: state.start.y - dy / state.start.k };
    cameraRef.current = next;
    apply(next);
  };
  const endDrag = () => {
    const state = drag.current;
    if (state?.moved && cameraRef.current) { setManual(cameraRef.current); setMoving(false); }
    // Keep the flag through the click that follows a drag, then clear it.
    setTimeout(() => { drag.current = null; }, 0);
  };

  // After a keyboard choice, put focus on the first place of the new level.
  useEffect(() => {
    if (!keyboardChoice.current) return;
    const svg = svgRef.current;
    const first = svg?.querySelector<SVGElement>('[data-code][tabindex="0"]');
    if (first) { keyboardChoice.current = false; first.focus({ preventScroll: true }); }
  }, [view, countryShapes, municipalityShapes, parishShapes]);

  // ---- layers ------------------------------------------------------------------
  const parishByCode = places?.byCode;
  const currentRegion = view.level === 'country' ? null : view.region;
  const currentMunicipality = view.level === 'municipality' ? view.municipality : null;

  const regionLayer = useMemo(() => {
    if (!countryShapes) return null;
    const interactive = view.level === 'country';
    return byName(countryShapes, s => s.name).map(shape => {
      const current = shape.code === currentRegion;
      return (
        <path
          key={shape.code}
          d={shape.d}
          data-code={shape.code}
          data-kind="region"
          className={`${styles.shape} cursor-pointer ${interactive ? 'fill-cream stroke-stone-300 hover:fill-moss' : current ? 'fill-cream stroke-stone-300' : 'fill-paper stroke-line hover:fill-moss'}`}
          strokeWidth={interactive ? 1 : 0.75}
          vectorEffect="non-scaling-stroke"
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `${shape.name}, ${t.region(shape.code).toLowerCase()}` : undefined}
          aria-hidden={interactive ? undefined : true}
        />
      );
    });
  }, [countryShapes, view.level, currentRegion, t]);

  const municipalityLayer = useMemo(() => {
    if (!municipalityShapes || view.level === 'country') return null;
    const interactive = view.level === 'region';
    return byName(municipalityShapes, s => s.name).map(shape => {
      const current = shape.code === currentMunicipality;
      if (current && parishShapes) return null;
      return (
        <path
          key={shape.code}
          d={shape.d}
          data-code={shape.code}
          data-kind="municipality"
          className={`${styles.shape} cursor-pointer ${interactive || current ? 'fill-cream stroke-stone-300 hover:fill-moss' : 'fill-paper stroke-stone-300 hover:fill-moss'}`}
          strokeWidth={interactive ? 1 : 0.75}
          vectorEffect="non-scaling-stroke"
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `${shape.name}, ${t.municipality.toLowerCase()}` : undefined}
          aria-hidden={interactive ? undefined : true}
        />
      );
    });
  }, [municipalityShapes, parishShapes, view.level, currentMunicipality, t]);

  const parishLayer = useMemo(() => {
    if (!parishShapes || !currentMunicipality) return null;
    const centre = municipalityShapes?.find(s => s.code === currentMunicipality)?.label ?? parishShapes[0]?.label ?? [0, 0];
    const reach = Math.max(...parishShapes.map(s => Math.hypot(s.label[0] - centre[0], s.label[1] - centre[1])), 1e-6);
    return byName(parishShapes, s => s.name).map(shape => {
      const parish = parishByCode?.get(shape.code);
      const tier = parish?.tier;
      const fill = tier ? TIER_FILL[tier] : 'var(--color-cream)';
      // Parishes arrive as a ripple from the middle of the município (decorative, 0–220 ms).
      const delay = Math.round((Math.hypot(shape.label[0] - centre[0], shape.label[1] - centre[1]) / reach) * 220);
      return (
        <path
          key={shape.code}
          d={shape.d}
          data-code={shape.code}
          data-kind="parish"
          className={`${styles.shape} ${styles.parish} cursor-pointer stroke-cream`}
          style={{ fill, animationDelay: `${delay}ms` }}
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
          tabIndex={0}
          role={onSelectParish ? 'button' : 'link'}
          aria-label={`${shape.name}${tier ? ` — ${t.tier(tier)}` : ''}${parish?.level === 'municipality' ? `, ${t.fallback.toLowerCase()}` : ''}`}
        />
      );
    });
  }, [parishShapes, currentMunicipality, municipalityShapes, parishByCode, t, onSelectParish]);

  const currentOutline = useMemo(() => {
    if (!currentMunicipality || !parishShapes) return null;
    const shape = municipalityShapes?.find(s => s.code === currentMunicipality);
    return shape ? <path d={shape.d} fill="none" className="stroke-ink" strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none" /> : null;
  }, [currentMunicipality, parishShapes, municipalityShapes]);

  const insetFrames = useMemo(() => {
    if (!countryShapes || view.level !== 'country') return null;
    return (['azores', 'madeira'] as const).map(region => {
      const [[x0, y0], [x1, y1]] = insetFrame(region);
      return <path key={region} d={`M${x0} ${y0}H${x1}V${y1}H${x0}Z`} fill="none" className="stroke-stone-300" strokeWidth={1} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" pointerEvents="none" />;
    });
  }, [countryShapes, view.level]);

  const findShape = useCallback((subject: Subject | null): MapShape | undefined => {
    if (!subject) return undefined;
    const list = subject.kind === 'region' ? countryShapes : subject.kind === 'municipality' ? municipalityShapes : parishShapes;
    return list?.find(s => s.code === subject.code);
  }, [countryShapes, municipalityShapes, parishShapes]);

  const highlighted = findShape(active ?? (preview ? { kind: 'parish', code: preview.code } : null));
  const focused = focus && currentMunicipality && focus.startsWith(currentMunicipality) ? findShape({ kind: 'parish', code: focus }) : undefined;

  // ---- labels (drawn at real size once the camera settles) -------------------
  const labels = useMemo(() => {
    if (!camera || !viewport) return [];
    let candidates: LabelCandidate[] = [];
    if (view.level === 'country' && countryShapes) {
      candidates = countryShapes.map(shape => {
        if (shape.code === 'azores' || shape.code === 'madeira') {
          const frame = insetFrame(shape.code);
          const at: [number, number] = [(frame[0][0] + frame[1][0]) / 2, frame[0][1] + 14 / camera.k];
          return { code: shape.code, text: shape.name, at, bounds: frame };
        }
        return { code: shape.code, text: shape.name, at: shape.label, bounds: shape.bounds };
      });
    } else if (view.level === 'region' && municipalityShapes) {
      candidates = municipalityShapes.map(shape => ({ code: shape.code, text: shape.name, at: shape.label, bounds: shape.fit }));
    } else if (view.level === 'municipality' && parishShapes) {
      candidates = parishShapes.map(shape => {
        const parish = parishByCode?.get(shape.code);
        const at = parish ? project(parish.lon, parish.lat, shape.region) : shape.label;
        return { code: shape.code, text: shortParishName(shape.name), at, bounds: shape.fit };
      });
    }
    return placeLabels(candidates, camera, viewport);
  }, [camera, viewport, view.level, countryShapes, municipalityShapes, parishShapes, parishByCode]);

  // ---- readout -------------------------------------------------------------------
  const subject: Subject | null = active ?? (preview ? { kind: 'parish', code: preview.code } : null) ?? (focused ? { kind: 'parish', code: focused.code } : null);
  const readout = (() => {
    if (subject?.kind === 'parish') {
      const parish = parishByCode?.get(subject.code);
      const name = parish?.name ?? findShape(subject)?.name ?? subject.code;
      return { kind: 'parish' as const, code: subject.code, parish, name };
    }
    if (subject?.kind === 'municipality') return { kind: 'municipality' as const, code: subject.code, name: municipalityName(subject.code) ?? subject.code };
    if (subject?.kind === 'region') return { kind: 'region' as const, code: subject.code, name: regionName(subject.code) ?? subject.code };
    return null;
  })();

  const children = useMemo(() => {
    if (!places) return null;
    if (view.level === 'country') return { kind: 'region' as const, items: byName(places.regions.map(r => ({ code: r.id, name: r.name })), r => r.name) };
    if (view.level === 'region') return { kind: 'municipality' as const, items: byName(places.municipalities.filter(m => m.region === view.region).map(m => ({ code: m.code, name: m.name })), m => m.name) };
    return { kind: 'parish' as const, items: byName(places.parishes.filter(p => p.municipality === view.municipality), p => p.name) };
  }, [places, view]);

  const countOf = (kind: Kind, code: string): string | null => {
    if (!places) return null;
    if (kind === 'region') return t.municipalities(places.municipalities.filter(m => m.region === code).length);
    if (kind === 'municipality') return t.parishes(places.parishes.filter(p => p.municipality === code).length);
    return null;
  };

  const hint = view.level === 'country' ? t.hintCountry : view.level === 'region' ? t.hintRegion : t.hintMunicipality;
  const announce = children
    ? t.showing(here, view.level === 'country' ? t.regions(children.items.length) : view.level === 'region' ? t.municipalities(children.items.length) : t.parishes(children.items.length))
    : '';
  const canZoomOut = view.level !== 'country' || !!manual;
  const canZoomIn = !!fit && (!manual || manual.k < fit.k * MAX_ZOOM * 0.999);

  const parishAction = (code: string, label: string) => onSelectParish
    ? <button type="button" onClick={() => chooseParish(code)} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4">{label}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
    : <a href={parishHref(code, locale)} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4">{label}<ArrowRight aria-hidden="true" className="h-4 w-4" /></a>;

  return (
    <section className={`@container ${className}`} aria-label={t.map}>
      <div className="overflow-hidden rounded-2xl border border-line bg-cream">
        {/* Where you are, and a way back up */}
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-3 py-1.5 sm:px-4">
          <nav aria-label={t.breadcrumb} className="flex min-w-0 items-center gap-1">
            <button type="button" onClick={up} disabled={view.level === 'country'} aria-label={t.up} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-ink hover:bg-parchment disabled:pointer-events-none disabled:opacity-30">
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <ol className="flex min-w-0 flex-wrap items-center gap-x-1 text-sm">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <li key={crumb.label + index} className="flex min-w-0 items-center gap-1">
                    {index > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-stone-500" />}
                    {last
                      ? <span aria-current="location" className="truncate font-bold text-ink">{crumb.label}</span>
                      : <button type="button" onClick={() => goTo(crumb.view)} className="inline-flex min-h-11 items-center truncate text-stone-600 underline underline-offset-4 hover:text-ink">{crumb.label}</button>}
                  </li>
                );
              })}
            </ol>
          </nav>
          <button type="button" onClick={random} disabled={!places} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-2 text-sm font-semibold text-ink hover:bg-parchment disabled:opacity-50">
            <Shuffle aria-hidden="true" className="h-4 w-4" />
            {t.random}
          </button>
        </div>

        <div className="flex flex-col @3xl:flex-row">
          {/* The map */}
          <div ref={frameRef} className="relative min-w-0 flex-1 bg-parchment" style={{ height: mapHeight }}>
            {viewport && (
              <svg
                ref={svgRef}
                width={viewport.width}
                height={viewport.height}
                viewBox={`0 0 ${viewport.width} ${viewport.height}`}
                className={`block select-none ${moving ? styles.moving : ''}`}
                style={{ touchAction: manual ? 'none' : 'pan-y' }}
                role="group"
                aria-label={t.mapLabel(here)}
                onClick={onClick}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                onPointerOver={onPointerOver}
                onPointerLeave={onPointerLeave}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <g ref={cameraGroup} transform={camera ? cameraTransform(camera, viewport) : undefined} id={`${uid}-plane`}>
                  <g id={`${uid}-land`}>{regionLayer}</g>
                  {insetFrames}
                  <g>{municipalityLayer}</g>
                  <g key={currentMunicipality ?? 'none'}>{parishLayer}</g>
                  {currentOutline}
                  {focused && <path d={focused.d} fill="none" className="stroke-ink" strokeWidth={3} vectorEffect="non-scaling-stroke" pointerEvents="none" />}
                  {highlighted && (
                    <g pointerEvents="none">
                      <path d={highlighted.d} fill="none" className="stroke-cream" strokeWidth={5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                      <path d={highlighted.d} className="fill-ink/10 stroke-ink" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                    </g>
                  )}
                </g>
                <g className={styles.labels} pointerEvents="none" aria-hidden="true">
                  {labels.map(label => (
                    <text
                      key={label.code}
                      x={label.x}
                      y={label.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-ink"
                      style={{ fontSize: 12, fontWeight: 600, paintOrder: 'stroke', stroke: 'var(--color-cream)', strokeWidth: 3, strokeLinejoin: 'round' }}
                    >
                      {label.text}
                    </text>
                  ))}
                </g>
              </svg>
            )}

            {!countryShapes && !failed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-stone-600" role="status">
                <MarkLoading height={22} color="var(--color-ink)" ground="var(--color-parchment)" />
                {t.loading}
              </div>
            )}
            {countryShapes && loadingLevel && (
              <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-md bg-cream/90 px-2 py-1 text-xs text-stone-600" role="status">
                <MarkLoading height={12} color="var(--color-ink)" ground="var(--color-cream)" />
                {t.loadingLevel}
              </div>
            )}
            {failed && (
              <div className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-cream p-3 text-sm text-ink" role="alert">
                <span>{t.failed}</span>
                <button type="button" onClick={() => setAttempt(n => n + 1)} className="inline-flex min-h-11 items-center rounded-[10px] border border-line bg-cream px-4 font-semibold hover:bg-parchment">{t.retry}</button>
              </div>
            )}

            {/* Locator: where the current view sits in the country */}
            {countryShapes && view.level !== 'country' && !compact && (
              <button type="button" onClick={() => goTo(COUNTRY)} className="absolute bottom-3 left-3 rounded-xl border border-line bg-cream/90 p-1.5 hover:bg-cream" aria-label="Portugal">
                <Locator countryShapes={countryShapes} region={currentRegion} landId={`${uid}-land`} />
              </button>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-xl border border-line bg-cream" role="group" aria-label={t.controls}>
              <button type="button" onClick={() => zoomBy(1.6)} disabled={!canZoomIn} aria-label={t.zoomIn} className="inline-flex h-11 w-11 items-center justify-center text-ink hover:bg-parchment disabled:opacity-30">
                <Plus aria-hidden="true" className="h-5 w-5" />
              </button>
              <button type="button" onClick={zoomOut} disabled={!canZoomOut} aria-label={t.zoomOut} className="inline-flex h-11 w-11 items-center justify-center border-t border-line text-ink hover:bg-parchment disabled:opacity-30">
                <Minus aria-hidden="true" className="h-5 w-5" />
              </button>
              {manual && (
                <button type="button" onClick={() => setManual(null)} aria-label={t.reset} className="inline-flex h-11 w-11 items-center justify-center border-t border-line text-ink hover:bg-parchment">
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* What the pointer, the keyboard or a tap is on */}
          <aside className="flex flex-col gap-4 border-t border-line p-4 @3xl:w-80 @3xl:shrink-0 @3xl:border-l @3xl:border-t-0">
            <div className="min-h-[9.5rem]" aria-live="polite">
              {readout?.kind === 'parish' ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{t.parish}</p>
                  <p className="mt-1 font-display text-xl font-extrabold leading-tight text-ink">{readout.name}</p>
                  {readout.parish && (
                    <>
                      <p className="mt-1 text-sm text-stone-600">{t.concelho(readout.parish.municipalityName)}</p>
                      <p className="mt-2 text-sm text-ink">
                        {t.residents}: <span className="font-display font-extrabold tabular-nums">{formatCount(readout.parish.censusPopulation, locale)}</span>
                        <span className="text-stone-500"> · {t.ine}</span>
                      </p>
                      <TierLine parish={readout.parish} t={t} locale={locale} />
                    </>
                  )}
                  <div className="mt-1">{parishAction(readout.code, onSelectParish ? t.choose : t.open)}</div>
                  {preview?.code === readout.code && preview.touch && <p className="text-xs text-stone-500">{t.tapAgain}</p>}
                </>
              ) : readout ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{readout.kind === 'region' ? t.region(readout.code) : t.municipality}</p>
                  <p className="mt-1 font-display text-xl font-extrabold leading-tight text-ink">{readout.name}</p>
                  {readout.kind === 'municipality' && places && (
                    <p className="mt-1 text-sm text-stone-600">{regionTitle(regionOfMunicipality(readout.code), regionName(regionOfMunicipality(readout.code)) ?? '', locale)}</p>
                  )}
                  {countOf(readout.kind, readout.code) && <p className="mt-2 text-sm text-ink">{countOf(readout.kind, readout.code)}</p>}
                </>
              ) : (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{view.level === 'country' ? t.map : view.level === 'region' ? t.region(view.region) : t.municipality}</p>
                  <p className="mt-1 font-display text-xl font-extrabold leading-tight text-ink">{here}</p>
                  <p className="mt-2 text-sm text-stone-600">{hint}</p>
                </>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{t.legendTitle}</p>
              <Legend items={(['A', 'B', 'C'] as const).map(tier => ({ label: t.tierLegend[tier], color: TIER_FILL[tier], kind: 'rect' as const }))} />
            </div>

            <p className="mt-auto text-xs leading-relaxed text-stone-500">
              {t.source}{' '}
              {view.level === 'country' ? t.insets : currentRegion === 'madeira' ? t.selvagens : ''}
            </p>
            <p className="sr-only" aria-live="polite">{announce}</p>
          </aside>
        </div>

        {/* The table twin: the same places as a list */}
        <details className="border-t border-line px-3 sm:px-4">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-ink">{t.list}</summary>
          {children && (
            <div className="pb-4">
              <p className="mb-2 text-sm font-bold text-ink">
                {view.level === 'country' ? t.listCountry : view.level === 'region' ? t.listRegion(regionTitle(view.region, here, locale)) : t.listMunicipality(here)}
              </p>
              {children.kind === 'parish' && <p className="mb-2 text-xs text-stone-500">{t.residents}: {t.ine}.</p>}
              <ul className="grid max-h-[28rem] grid-cols-1 gap-x-6 overflow-auto @md:grid-cols-2 @3xl:grid-cols-3">
                {children.kind === 'parish'
                  ? (children.items as Parish[]).map(parish => (
                    <li key={parish.code} className="flex items-center justify-between gap-3 border-b border-line py-1.5 text-sm">
                      {onSelectParish
                        ? <button type="button" onClick={() => chooseParish(parish.code)} className="min-h-11 text-left text-ink underline underline-offset-4">{parish.name}</button>
                        : <a href={parishHref(parish.code, locale)} className="inline-flex min-h-11 items-center text-ink underline underline-offset-4">{parish.name}</a>}
                      <span className="shrink-0 text-right text-xs text-stone-500">
                        {t.tier(parish.tier)}{parish.level === 'municipality' ? ` · ${t.fallback}` : ''}
                        <span className="block tabular-nums">{t.residents}: {formatCount(parish.censusPopulation, locale)}</span>
                      </span>
                    </li>
                  ))
                  : (children.items as Array<{ code: string; name: string }>).map(item => (
                    <li key={item.code} className="border-b border-line py-1.5 text-sm">
                      <button
                        type="button"
                        onClick={() => goTo(children.kind === 'region' ? { level: 'region', region: item.code } : { level: 'municipality', region: regionOfMunicipality(item.code), municipality: item.code })}
                        className="inline-flex min-h-11 items-center text-left text-ink underline underline-offset-4"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </details>
      </div>
    </section>
  );
}

/** The parish's tier and what it means; município figures are named only when the parish actually falls back. */
function TierLine({ parish, t, locale }: { parish: Parish; t: (typeof copy)['pt'] | (typeof copy)['en']; locale: 'pt' | 'en' }) {
  const fallback = parish.level === 'municipality';
  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap gap-1.5">
        <QualityBadge kind={parish.tier} locale={locale} />
        {fallback && <QualityBadge kind="municipality" locale={locale} label={t.fallback} />}
      </div>
      <p className="text-xs leading-relaxed text-stone-600">{TIER_COPY[parish.tier].meaning[locale]}</p>
      {fallback && <p className="text-xs leading-relaxed text-stone-600">{t.fallbackLong(parish.municipalityName)}</p>}
    </div>
  );
}

/** A small Portugal with the current region marked; the country's paths are reused, not redrawn. */
function Locator({ countryShapes, region, landId }: { countryShapes: MapShape[]; region: string | null; landId: string }) {
  const bounds = countryBounds(countryShapes);
  const shape = region ? countryShapes.find(s => s.code === region) : undefined;
  if (!bounds) return null;
  const [[x0, y0], [x1, y1]] = bounds;
  const w = x1 - x0;
  const h = y1 - y0;
  return (
    <svg width={64} height={Math.round((64 * h) / w)} viewBox={`${x0} ${y0} ${w} ${h}`} aria-hidden="true" focusable="false" className="block" pointerEvents="none">
      <use href={`#${landId}`} />
      {shape && <path d={shape.d} className="fill-ink" />}
    </svg>
  );
}
