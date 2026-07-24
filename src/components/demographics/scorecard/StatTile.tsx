// A single headline stat, editorial style: a vertical color bar + tabular-nums
// number (NO rounded card, NO shadow). Renders an honest "—" when the value is
// missing so the grid never collapses on a partial feed.

import type { ReactNode } from 'react';

export function StatTile({
  label,
  value,
  unit,
  chip,
  caveat,
  accent = false,
}: {
  label: string;
  value: string | null;
  unit?: string;
  chip?: ReactNode;
  caveat?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="border-l-2 border-stone-200 pl-4 py-1"
      style={accent ? { borderLeftColor: '#9A4A2E' } : undefined}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums text-stone-900">
          {value ?? '—'}
        </span>
        {unit && value != null && (
          <span className="text-base font-semibold text-stone-500">{unit}</span>
        )}
      </div>
      {chip && <div className="mt-1.5">{chip}</div>}
      {caveat && <p className="mt-1.5 text-xs leading-snug text-stone-500">{caveat}</p>}
    </div>
  );
}
