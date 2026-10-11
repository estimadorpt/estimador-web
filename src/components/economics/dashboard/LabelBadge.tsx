// The tile's `label` (e.g. "preliminary", "risk context, not a forecast") as a
// word in the label's tone, sentence case, no chip or fill. Pure presentational
// server component.

export type Tone = 'neutral' | 'amber' | 'red' | 'emerald' | 'teal';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'text-graphite',
  amber: 'text-amber-800',
  red: 'text-red-800',
  emerald: 'text-emerald-800',
  teal: 'text-teal',
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
      className={`inline-block text-[12px] font-semibold ${TONE_CLASSES[tone]}`}
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
