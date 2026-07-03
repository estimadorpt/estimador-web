// Shared card shell for every "data story" module. Structurally guarantees the
// honesty affordances each module must carry: the epistemic-status badge (from
// the payload's badge taxonomy: official / official_calc / scenario), the
// as-of date chip, the rule-generated headline sentence (payload, localized),
// and the collapsible "Como ler isto" honesty note (payload, verbatim).
//
// No number in this section comes from a model — the payload badge says how
// each number was produced and the badge links to /economia/metodologia.

import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { HonestyNote } from '../dashboard/HonestyNote';
import { StatusBadge, storyBadgeKind, BADGE_LABEL_KEY } from '../dashboard/StatusBadge';
import { pickText, type StoryBadge, type LocalizedText } from '@/types/economy-stories';
import { fmtPeriodLoc } from '@/lib/utils/story-format';

export async function StoryCard({
  title,
  badge,
  asOf,
  headline,
  honesty,
  locale,
  className = '',
  children,
}: {
  title?: LocalizedText;
  badge?: StoryBadge | null;
  asOf?: string;
  headline?: LocalizedText;
  /** Already-localized honesty note (callers resolve via pickText). */
  honesty?: string;
  locale: string;
  className?: string;
  children: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });

  const badgeKind = storyBadgeKind(badge?.kind);
  // Prefer the payload's own bilingual badge label; fall back to the message file.
  const badgeLabel = pickText(locale, badge?.label) ?? t(BADGE_LABEL_KEY[badgeKind]);
  const badgeDef = t(`${BADGE_LABEL_KEY[badgeKind]}Def`);

  return (
    <section
      className={`relative overflow-hidden rounded-lg border border-stone-200 bg-white p-5 md:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base md:text-lg font-bold tracking-tight text-stone-900 min-w-0">
          {pickText(locale, title) ?? '—'}
        </h3>
        {badge != null && (
          <StatusBadge kind={badgeKind} label={badgeLabel} title={badgeDef} />
        )}
      </div>

      {asOf && (
        <p className="mt-0.5 text-[10px] text-stone-400">
          {t('asOf')} {fmtPeriodLoc(asOf, locale)}
        </p>
      )}

      {/* Rule-generated headline sentence — the payload's own words, verbatim. */}
      {pickText(locale, headline) && (
        <p className="mt-2 text-sm leading-relaxed text-stone-700 max-w-prose">
          {pickText(locale, headline)}
        </p>
      )}

      <div className="mt-4">{children}</div>

      <HonestyNote note={honesty} />
    </section>
  );
}
