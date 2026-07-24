'use client';

// Collapsible "How to read this" disclosure for a tile's caveat. THE honesty
// mandate: the trigger is always visible (not buried); the full caveat opens on
// click. The `note` is passed already-localized — tiles resolve the payload's
// bilingual honesty_note_i18n via pickNote() and fall back to the i18n message
// files. The open state also links to /economia/metodologia ("read more") where
// the full methodology, badge taxonomy and evaluation caveats live.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Info } from 'lucide-react';
import { Link } from '@/i18n/routing';

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
        <div className="mt-2 max-w-3xl">
          <p className="text-xs leading-relaxed text-stone-600">{note}</p>
          <Link
            href="/economia/metodologia"
            className="mt-1.5 inline-block text-[11px] font-semibold text-[#1B4D5E] hover:underline"
          >
            {t('honestyMethodologyLink')} →
          </Link>
        </div>
      )}
    </div>
  );
}
