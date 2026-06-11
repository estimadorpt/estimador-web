'use client';

// Collapsible "How to read this" disclosure for a tile's caveat. THE honesty
// mandate: the trigger is always visible (not buried); the full caveat opens on
// click. The `note` is passed already-localized (all display strings live in the
// i18n message files, keyed off the data feed's identifiers).

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Info } from 'lucide-react';

export function HonestyNote({
  note,
  defaultOpen = false,
}: {
  note?: string;
  defaultOpen?: boolean;
}) {
  const t = useTranslations('economics');
  const [open, setOpen] = useState(defaultOpen);

  if (!note) return null;

  return (
    <div className="mt-4 border-t border-stone-100 pt-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-800 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        {t('howToRead')}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-stone-600">
          {note}
        </p>
      )}
    </div>
  );
}
