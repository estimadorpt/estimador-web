'use client';

// Collapsible "How to read this" disclosure for a tile's caveat. THE honesty
// mandate: the trigger is always visible (not buried); the full caveat opens on
// click. The `note` is passed already-localized — tiles resolve the payload's
// bilingual honesty_note_i18n via pickNote() and fall back to the i18n message
// files. The open state also links to /economia/metodologia ("read more") where
// the full methodology, badge taxonomy and evaluation caveats live.
//
// The site's one show/hide control (viz/Disclosure): a 44px sentence-case row
// with a turning chevron, not a bespoke 18px uppercase toggle (A11Y2-17).

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Disclosure } from '@/components/viz/Disclosure';

export function HonestyNote({
  note,
  defaultOpen = false,
}: {
  note?: string;
  defaultOpen?: boolean;
}) {
  const t = useTranslations('economics');

  if (!note) return null;

  return (
    <div className="mt-4 border-t border-line pt-1">
      <Disclosure summary={t('howToRead')} defaultOpen={defaultOpen}>
        <div className="mb-1 max-w-3xl">
          <p className="text-xs leading-relaxed text-stone-600">{note}</p>
          <Link
            href="/economia/metodologia"
            className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink"
          >
            {t('honestyMethodologyLink')}
          </Link>
        </div>
      </Disclosure>
    </div>
  );
}
