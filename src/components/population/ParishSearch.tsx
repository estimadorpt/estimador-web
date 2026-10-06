'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { LocateFixed, Search, X } from 'lucide-react';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { fetchPlaces } from '@/lib/population/client';
import { formatCount } from '@/lib/population/format';
import {
  indexPlaces,
  NEARBY_KEY,
  NEAREST_MAX_KM,
  nearestParish,
  regionSlug,
  searchPlaces,
  type MunicipalityHit,
  type Parish,
  type PlaceHit,
  type PlaceIndex,
} from '@/lib/population/places';
import type { Locale } from '@/lib/population/labels';
import { parishHref } from './ParishLink';

interface ParishSearchProps {
  locale: Locale;
  /** Called with the chosen parish; without it, choosing navigates to the parish page. */
  onSelect?: (parish: Parish) => void;
  label?: string;
  placeholder?: string;
  /** Offer "use my location" (computed on the device, nothing is sent). */
  withLocation?: boolean;
  /** Parishes that cannot be chosen again (e.g. earlier guesses). */
  exclude?: Set<string>;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  /** Called once the reader focuses the field (the game closes its instructions then). */
  onFocus?: () => void;
}

/** "/pt/populacao/regiao/porto/#concelho-1312": a município's list of parishes on its region page. */
function municipalityHref(municipality: MunicipalityHit, locale: string): string {
  return `/${locale}${POPULATION_ROUTES.region(regionSlug(municipality.regionName))}/#concelho-${municipality.code}`;
}

/**
 * Find a parish by name, by any member of a "União das freguesias", by its
 * município or by its code, ignoring accents, case and the small words. A
 * combobox with a visible label, 48px tall, keyboard-operable. Typing a
 * município's exact name lists that município first (a link to its parishes)
 * and then its parishes. The place list (every parish) is fetched when the
 * field is first focused, not with the page.
 */
export function ParishSearch({ locale, onSelect, label, placeholder, withLocation, exclude, disabled, className = '', inputClassName = '', onFocus }: ParishSearchProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [locating, setLocating] = useState<'idle' | 'busy' | 'denied' | 'far'>('idle');
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const loading = useRef(false);

  const load = () => {
    if (index || loading.current) return;
    loading.current = true;
    setFailed(false);
    fetchPlaces()
      .then(data => setIndex(indexPlaces(data)))
      .catch(() => setFailed(true))
      .finally(() => { loading.current = false; });
  };

  const { hits, total } = useMemo(() => {
    if (!index) return { hits: [] as PlaceHit[], total: 0 };
    const found = searchPlaces(index, query, 12);
    const visible = found.hits.filter(hit => (hit.kind === 'municipality'
      // Choosing a place in the game means a parish; the município row only navigates.
      ? !onSelect
      : !exclude?.has(hit.parish.code)));
    return { hits: visible, total: found.total };
  }, [index, query, exclude, onSelect]);
  const shownParishes = hits.filter(hit => hit.kind === 'parish').length;

  // Keep the highlighted option in view as the arrow keys move it.
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (hit: PlaceHit) => {
    setOpen(false);
    if (hit.kind === 'municipality') {
      window.location.assign(municipalityHref(hit.municipality, locale));
      return;
    }
    setQuery('');
    if (onSelect) onSelect(hit.parish);
    else window.location.assign(parishHref(hit.parish.code, locale));
  };

  const locate = () => {
    load();
    if (!('geolocation' in navigator)) { setLocating('denied'); return; }
    setLocating('busy');
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const data = index ?? indexPlaces(await fetchPlaces());
          if (!index) setIndex(data);
          const parish = nearestParish(data, { lat: position.coords.latitude, lon: position.coords.longitude });
          if (!parish) { setLocating('far'); return; }
          setLocating('idle');
          try { window.sessionStorage.setItem(NEARBY_KEY, parish.code); } catch { /* private mode: the page just will not say so */ }
          choose({ kind: 'parish', parish, rank: 0, underMunicipality: false });
        } catch {
          setLocating('denied');
        }
      },
      () => setLocating('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };

  const t = locale === 'pt'
    ? {
      label: 'Procurar uma freguesia',
      placeholder: 'Freguesia ou concelho',
      none: 'Nenhuma freguesia nem concelho com esse nome.',
      noneNext: 'Experimenta o nome do concelho, só uma parte do nome, ou explora o mapa.',
      map: 'Ver o mapa das freguesias',
      loading: 'A carregar as freguesias…',
      error: 'Não foi possível carregar a lista de freguesias.',
      retry: 'Tentar de novo',
      locate: 'Usar a minha localização',
      locating: 'A localizar…',
      denied: 'Sem acesso à localização. Procura pelo nome.',
      far: `A tua localização fica a mais de ${NEAREST_MAX_KM} km de qualquer freguesia de Portugal. Procura pelo nome.`,
      privacy: 'A localização é usada só no teu dispositivo para encontrar a freguesia mais próxima.',
      clear: 'Limpar a pesquisa',
      municipality: (name: string) => `Concelho: ${name}`,
      municipalityCount: (n: number) => `${formatCount(n, 'pt')} ${n === 1 ? 'freguesia' : 'freguesias'} · ver a lista`,
      count: (shown: number, all: number) => (all === 0 ? '' : shown < all
        ? `${formatCount(shown, 'pt')} de ${formatCount(all, 'pt')} freguesias. Escreve mais para afinar.`
        : `${formatCount(all, 'pt')} ${all === 1 ? 'freguesia encontrada' : 'freguesias encontradas'}.`),
      underMunicipality: 'deste concelho',
    }
    : {
      label: 'Find a parish',
      placeholder: 'Parish or municipality',
      none: 'No parish or municipality with that name.',
      noneNext: 'Try the municipality’s name, part of the name, or explore the map.',
      map: 'See the parish map',
      loading: 'Loading parishes…',
      error: 'The parish list could not be loaded.',
      retry: 'Try again',
      locate: 'Use my location',
      locating: 'Locating…',
      denied: 'No access to your location. Search by name instead.',
      far: `Your location is more than ${NEAREST_MAX_KM} km from any parish in Portugal. Search by name instead.`,
      privacy: 'Your location is used only on your device, to find the nearest parish.',
      clear: 'Clear the search',
      municipality: (name: string) => `Municipality: ${name}`,
      municipalityCount: (n: number) => `${formatCount(n, 'en')} ${n === 1 ? 'parish' : 'parishes'} · see the list`,
      count: (shown: number, all: number) => (all === 0 ? '' : shown < all
        ? `${formatCount(shown, 'en')} of ${formatCount(all, 'en')} parishes. Type more to narrow it down.`
        : `${formatCount(all, 'en')} ${all === 1 ? 'parish found' : 'parishes found'}.`),
      underMunicipality: 'in this municipality',
    };

  const typed = query.trim().length >= 2;
  const showList = open && typed && index !== null && hits.length > 0;
  const showPanel = open && typed && !showList;
  const locationMessage = locating === 'denied' ? t.denied : locating === 'far' ? t.far : t.privacy;

  return (
    <div className={className}>
      <label htmlFor={`${id}-input`} className="mb-1.5 block text-sm font-semibold text-ink">{label ?? t.label}</label>
      <div className="flex flex-wrap items-stretch gap-2">
        {/* The suggestions open right under the field, over the location button. */}
        <div className="relative min-w-0 flex-1 basis-64">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            ref={input}
            id={`${id}-input`}
            type="search"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-describedby={`${id}-status`}
            aria-activedescendant={showList && hits[active] ? `${id}-opt-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            value={query}
            placeholder={placeholder ?? t.placeholder}
            onFocus={() => {
              load();
              setOpen(true);
              onFocus?.();
              // On a phone the keyboard takes half the screen: lift the field so the suggestions have room.
              if (window.matchMedia('(max-width: 640px)').matches) {
                window.setTimeout(() => input.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 250);
              }
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }}
            onKeyDown={event => {
              if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, Math.max(0, hits.length - 1))); }
              else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => Math.max(0, i - 1)); }
              else if (event.key === 'Enter' && showList && hits[active]) { event.preventDefault(); choose(hits[active]); }
              else if (event.key === 'Escape') { setOpen(false); }
            }}
            className={`parish-search h-12 w-full scroll-mt-20 rounded-[10px] border border-line bg-cream pl-10 pr-11 text-base text-ink placeholder:text-stone-500 sm:text-[15px] [&::-webkit-search-cancel-button]:appearance-none ${inputClassName}`}
          />
          {query && !disabled && (
            <button
              type="button"
              onClick={() => { setQuery(''); setActive(0); input.current?.focus(); }}
              className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink hover:bg-parchment"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">{t.clear}</span>
            </button>
          )}
          {showList && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-[10px] border border-line bg-cream shadow-[0_8px_24px_rgba(18,47,44,0.12)]">
            <ul
              ref={list}
              id={listId}
              role="listbox"
              aria-label={label ?? t.label}
              className="max-h-[min(20rem,45dvh)] overflow-auto py-1"
            >
              {hits.map((hit, i) => {
                const selected = i === active;
                const key = hit.kind === 'municipality' ? `m-${hit.municipality.code}` : hit.parish.code;
                return (
                  <li
                    key={key}
                    id={`${id}-opt-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={selected}
                    onMouseDown={event => { event.preventDefault(); choose(hit); }}
                    onMouseEnter={() => setActive(i)}
                    className={`relative cursor-pointer py-2.5 pr-4 ${hit.kind === 'parish' && hit.underMunicipality ? 'pl-7' : 'pl-4'} ${selected ? 'bg-parchment' : ''} ${hit.kind === 'municipality' ? 'border-b border-line' : ''}`}
                  >
                    {/* The active option carries an ink bar, not only a tint. */}
                    {selected && <span aria-hidden="true" className="absolute inset-y-1 left-0 w-1 rounded-r bg-ink" />}
                    {hit.kind === 'municipality' ? (
                      <>
                        <span className="block text-[15px] font-bold text-ink">{t.municipality(hit.municipality.name)}</span>
                        <span className="block text-xs text-stone-600">{hit.municipality.regionName} · {t.municipalityCount(hit.municipality.parishCount)}</span>
                      </>
                    ) : (
                      <>
                        <span className="block text-[15px] font-semibold text-ink">{hit.parish.name}</span>
                        <span className="block text-xs text-stone-500">
                          {hit.underMunicipality ? t.underMunicipality : `${hit.parish.municipalityName} · ${hit.parish.regionName}`}
                        </span>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            {shownParishes < total && (
              <p aria-hidden="true" className="border-t border-line px-4 py-2 text-xs text-stone-600">{t.count(shownParishes, total)}</p>
            )}
            </div>
          )}
          {showPanel && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-[10px] border border-line bg-cream px-4 py-3 text-sm text-stone-600 shadow-[0_8px_24px_rgba(18,47,44,0.12)]">
              {failed ? (
                <p>
                  {t.error}{' '}
                  <button type="button" onMouseDown={event => { event.preventDefault(); load(); }} className="font-semibold text-ink underline underline-offset-4">{t.retry}</button>
                </p>
              ) : !index ? (
                <p>{t.loading}</p>
              ) : (
                <>
                  <p className="font-semibold text-ink">{t.none}</p>
                  <p className="mt-1">{t.noneNext}</p>
                  <a href={`/${locale}${POPULATION_ROUTES.hub}/#mapa`} onMouseDown={event => event.preventDefault()} className="mt-1 inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4">{t.map}</a>
                </>
              )}
            </div>
          )}
        </div>
        {withLocation && (
          <button
            type="button"
            onClick={locate}
            disabled={disabled || locating === 'busy'}
            className="inline-flex min-h-12 items-center gap-2 rounded-[10px] border border-line bg-cream px-4 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-parchment disabled:opacity-50"
          >
            <LocateFixed aria-hidden="true" className="h-4 w-4" />
            {locating === 'busy' ? t.locating : t.locate}
          </button>
        )}
      </div>
      {/* One polite line for what the list holds, outside it, so it is announced. */}
      <p id={`${id}-status`} role="status" className="sr-only">
        {typed && index ? (hits.length === 0 ? t.none : t.count(shownParishes, total)) : ''}
      </p>
      {withLocation && (
        <p className={`mt-1.5 text-xs ${locating === 'far' || locating === 'denied' ? 'font-semibold text-ink' : 'text-stone-500'}`} aria-live="polite">{locationMessage}</p>
      )}
    </div>
  );
}
