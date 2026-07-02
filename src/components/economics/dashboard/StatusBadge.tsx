// Epistemic-status badge rendered next to each tile's HEADLINE NUMBER — the
// four-badge taxonomy ("Dado oficial" / "Leitura" / "Estimativa indicativa" /
// "Previsão") plus its two compound variants. The mapping tile→badge is FIXED
// (see /economia/metodologia for the definitions); labels are bilingual via the
// message files and the badge links to the methodology's taxonomy section.
//
// Distinct styling from LabelBadge (which carries the producer's free-text
// maturity label at the card's top-right): this one is an outlined pill with a
// status dot, so the two never read as duplicates.

import { Link } from '@/i18n/routing';

export type BadgeKind =
  | 'reading' // Leitura — a read-out of published data
  | 'indicative' // Estimativa indicativa — model estimate, not authoritative
  | 'forecast' // Previsão (distribuição) — simulated distribution
  | 'officialCalls' // Dado oficial + as nossas chamadas — ledger of both
  | 'risk'; // Cenário de risco — conditional risk context

const KIND_STYLE: Record<BadgeKind, { border: string; text: string; dot: string }> = {
  reading: { border: 'border-[#1B4D5E]/30', text: 'text-[#1B4D5E]', dot: 'bg-[#1B4D5E]' },
  indicative: { border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-500' },
  forecast: { border: 'border-stone-300', text: 'text-stone-600', dot: 'bg-stone-400' },
  officialCalls: { border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  risk: { border: 'border-red-200', text: 'text-red-800', dot: 'bg-red-600' },
};

/** i18n message key (economics namespace) for each badge kind. */
export const BADGE_LABEL_KEY: Record<BadgeKind, string> = {
  reading: 'badgeReading',
  indicative: 'badgeIndicative',
  forecast: 'badgeForecast',
  officialCalls: 'badgeOfficialCalls',
  risk: 'badgeRisk',
};

export function StatusBadge({
  kind,
  label,
  title,
}: {
  kind: BadgeKind;
  /** Already-localized label (caller resolves via t(BADGE_LABEL_KEY[kind])). */
  label: string;
  /** Optional already-localized tooltip (the badge definition). */
  title?: string;
}) {
  const s = KIND_STYLE[kind];
  return (
    <Link
      href="/economia/metodologia"
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider no-underline hover:opacity-80 transition-opacity ${s.border} ${s.text}`}
    >
      <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </Link>
  );
}
