'use client';

/**
 * PLACEHOLDER — the zoomable parish map (district → município → parish).
 * The agreed interface is below; the implementation replaces this file.
 */
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

export function PopulationMap({ locale, height = 560, className = '' }: PopulationMapProps) {
  return (
    <div className={`flex items-center justify-center rounded-2xl border border-line bg-cream text-sm text-stone-500 ${className}`} style={{ minHeight: height }}>
      {locale === 'pt' ? 'Mapa de freguesias' : 'Parish map'}
    </div>
  );
}
