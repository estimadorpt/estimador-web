// Shared shell for every dashboard tile. Structurally guarantees the two
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
    // An instrument under an ink rule, no box or fill; the series accent, when
    // a tile has one, is a short swatch on that rule.
    <section
      className={`relative border-t border-ink ${
        hero ? 'pt-4 pb-2' : 'pt-3 pb-2'
      } ${className}`}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-0.5 w-12"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[12px] text-graphite mb-2">
              {eyebrow}
            </div>
          )}
          <h2
            className={`font-bold text-ink ${
              hero ? 'text-2xl' : 'text-xl'
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
