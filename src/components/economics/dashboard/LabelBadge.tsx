// Small uppercase badge used to surface each tile's `label` (e.g. "preliminary",
// "risk context, not a forecast"). Pure presentational server component.

export type Tone = 'neutral' | 'amber' | 'red' | 'emerald' | 'teal';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-600',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  teal: 'bg-[#1B4D5E]/10 text-[#1B4D5E]',
};

export function LabelBadge({
  children,
  tone = 'neutral',
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  title?: string;
}) {
  if (children == null || children === '') return null;
  return (
    <span
      title={title}
      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

// Pick a sensible tone from a free-text data label.
export function toneForLabel(label?: string): Tone {
  const l = (label ?? '').toLowerCase();
  if (l.includes('preliminary') || l.includes('early') || l.includes('unreliable'))
    return 'amber';
  if (l.includes('risk')) return 'neutral';
  return 'neutral';
}
