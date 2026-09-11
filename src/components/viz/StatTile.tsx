import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';

interface StatTileProps {
  /** Sentence case, no trailing colon. */
  label: string;
  value: string;
  unit?: string;
  /** Signed change against a named period. `good` says whether up is good; the colour follows direction × good. */
  delta?: { text: string; direction: 'up' | 'down' | 'flat'; good?: boolean; period?: string };
  note?: string;
  trend?: number[];
  /** The one number a view leads with, at 48px or more. Exactly one per view. */
  hero?: boolean;
  className?: string;
}

/**
 * The figure when the data is a number. Proportional figures at display size,
 * the delta with an icon and a period so colour never carries it alone, an
 * optional sparkline for context. Numbers stay on cream: no pastel behind a value.
 */
export function StatTile({ label, value, unit, delta, note, trend, hero = false, className = '' }: StatTileProps) {
  const positive = delta ? (delta.direction === 'flat' ? null : (delta.direction === 'up') === (delta.good ?? true)) : null;
  const deltaColor = positive === null ? 'text-stone-500' : positive ? 'text-tree' : 'text-terracotta';
  const Icon = delta?.direction === 'up' ? ArrowUpRight : delta?.direction === 'down' ? ArrowDownRight : Minus;
  return (
    <div className={`flex flex-col gap-1.5 rounded-2xl border border-line bg-cream p-5 ${className}`}>
      <span className="text-sm text-stone-500">{label}</span>
      <div className="flex items-end justify-between gap-4">
        <span className={`font-display font-extrabold leading-none tracking-[-0.03em] text-ink ${hero ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'}`}>
          {value}{unit && <span className="ml-1 text-[0.55em] font-bold text-stone-400">{unit}</span>}
        </span>
        {trend && <Sparkline points={trend} />}
      </div>
      {delta && (
        <span className={`inline-flex flex-wrap items-baseline gap-x-1 text-sm font-semibold ${deltaColor}`}>
          <Icon aria-hidden="true" className="h-4 w-4" />
          <span className="whitespace-nowrap">{delta.text}</span>{delta.period && <span className="font-normal text-stone-500"> {delta.period}</span>}
        </span>
      )}
      {note && <span className="text-xs leading-snug text-stone-500">{note}</span>}
    </div>
  );
}

/** A row of tiles: two to four headline numbers, never a bar chart of them. */
export function KpiRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>{children}</div>;
}
