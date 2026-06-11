// Shared card shell for every dashboard tile. Structurally guarantees the two
// honesty affordances every tile must carry: the `label` badge (top-right) and
// the collapsible honesty_note (footer). Tiles render their own headline value,
// chart, and short inline caveat as children.

import type { ReactNode } from 'react';
import { LabelBadge, type Tone } from './LabelBadge';
import { HonestyNote } from './HonestyNote';

export function TileCard({
  title,
  eyebrow,
  label,
  labelTone = 'neutral',
  labelTitle,
  honesty,
  honestyDefaultOpen = false,
  accent,
  hero = false,
  className = '',
  children,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  label?: string;
  labelTone?: Tone;
  labelTitle?: string;
  honesty?: string;
  honestyDefaultOpen?: boolean;
  accent?: string;
  hero?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-lg border border-stone-200 bg-white ${
        hero ? 'p-6 md:p-8' : 'p-5 md:p-6'
      } ${className}`}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              {eyebrow}
            </div>
          )}
          <h2
            className={`font-bold tracking-tight text-stone-900 ${
              hero ? 'text-xl md:text-2xl' : 'text-base md:text-lg'
            }`}
          >
            {title}
          </h2>
        </div>
        {label && (
          <LabelBadge tone={labelTone} title={labelTitle}>
            {label}
          </LabelBadge>
        )}
      </div>

      {children}

      <HonestyNote note={honesty} defaultOpen={honestyDefaultOpen} />
    </section>
  );
}
