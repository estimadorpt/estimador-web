'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { LocateFixed, Search } from 'lucide-react';
import { fetchPlaces } from '@/lib/population/client';
import { indexPlaces, nearestParish, searchParishes, type Parish, type PlaceIndex } from '@/lib/population/places';
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
}

/**
 * Find a parish by name, by any member of a "União das freguesias", or by its
 * município, ignoring accents and case. A combobox with a visible label,
 * 48px tall, keyboard-operable.
 */
export function ParishSearch({ locale, onSelect, label, placeholder, withLocation, exclude, disabled, className = '', inputClassName = '' }: ParishSearchProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [locating, setLocating] = useState<'idle' | 'busy' | 'denied'>('idle');
  const input = useRef<HTMLInputElement>(null);

  const load = () => {
    if (index || failed) return;
    fetchPlaces().then(data => setIndex(indexPlaces(data))).catch(() => setFailed(true));
  };
  useEffect(() => {
    // Warm the place list shortly after mount so the first keystroke has it.
    const timer = window.setTimeout(load, 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hits = useMemo(() => {
    if (!index) return [];
    return searchParishes(index, query, 12).filter(hit => !exclude?.has(hit.parish.code));
  }, [index, query, exclude]);

  const choose = (parish: Parish) => {
    setOpen(false);
    setQuery('');
    if (onSelect) onSelect(parish);
    else window.location.assign(parishHref(parish.code, locale));
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
          setLocating('idle');
          if (parish) choose(parish);
        } catch {
          setLocating('denied');
        }
      },
      () => setLocating('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };

  const t = locale === 'pt'
    ? { label: 'Procurar uma freguesia', placeholder: 'Nome da freguesia ou do concelho', none: 'Nenhuma freguesia com esse nome.', loading: 'A carregar as freguesias…', error: 'Não foi possível carregar a lista de freguesias.', locate: 'Usar a minha localização', locating: 'A localizar…', denied: 'Sem acesso à localização. Procura pelo nome.', privacy: 'A localização é usada só no teu dispositivo para encontrar a freguesia mais próxima.' }
    : { label: 'Find a parish', placeholder: 'Parish or municipality name', none: 'No parish with that name.', loading: 'Loading parishes…', error: 'The parish list could not be loaded.', locate: 'Use my location', locating: 'Locating…', denied: 'No access to your location. Search by name instead.', privacy: 'Your location is used only on your device, to find the nearest parish.' };

  const showList = open && query.trim().length >= 2;

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={`${id}-input`} className="mb-1.5 block text-sm font-semibold text-ink">{label ?? t.label}</label>
      <div className="flex flex-wrap items-stretch gap-2">
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
            aria-activedescendant={showList && hits[active] ? `${id}-opt-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            value={query}
            placeholder={placeholder ?? t.placeholder}
            onFocus={() => { load(); setOpen(true); }}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }}
            onKeyDown={event => {
              if (event.key === 'ArrowDown') { event.preventDefault(); setActive(i => Math.min(i + 1, Math.max(0, hits.length - 1))); }
              else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => Math.max(0, i - 1)); }
              else if (event.key === 'Enter' && hits[active]) { event.preventDefault(); choose(hits[active].parish); }
              else if (event.key === 'Escape') { setOpen(false); }
            }}
            className={`h-12 w-full rounded-[10px] border border-line bg-cream pl-10 pr-3 text-[15px] text-ink placeholder:text-stone-500 ${inputClassName}`}
          />
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
      {withLocation && (
        <p className="mt-1.5 text-xs text-stone-500" aria-live="polite">{locating === 'denied' ? t.denied : t.privacy}</p>
      )}
      {showList && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-[10px] border border-line bg-cream py-1 shadow-[0_8px_24px_rgba(18,47,44,0.12)]">
          {!index && <li className="px-4 py-3 text-sm text-stone-500">{failed ? t.error : t.loading}</li>}
          {index && hits.length === 0 && <li className="px-4 py-3 text-sm text-stone-500">{t.none}</li>}
          {hits.map((hit, i) => (
            <li
              key={hit.parish.code}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={event => { event.preventDefault(); choose(hit.parish); }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-2.5 ${i === active ? 'bg-parchment' : ''}`}
            >
              <span className="block text-[15px] font-semibold text-ink">{hit.parish.name}</span>
              <span className="block text-xs text-stone-500">{hit.parish.municipalityName} · {hit.parish.regionName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
