'use client';

// Minimal expand/collapse disclosure. Used to keep the prominent disclaimer to a
// short always-visible lead while the full audited text stays one click away.

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function ReadMore({
  moreLabel,
  lessLabel,
  children,
}: {
  moreLabel: string;
  lessLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      {open && (
        <div className="mb-2 text-xs leading-relaxed text-stone-600 max-w-4xl">
          {children}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-800 transition-colors"
      >
        {open ? lessLabel : moreLabel}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}
