import type { ReactNode } from 'react';

type CalloutKind = 'context' | 'caveat' | 'method';

/** The rule over each kind of note and the colour of its lead word. No fill. */
const TONE: Record<CalloutKind, { rule: string; lead: string }> = {
  // Dating and scope — "written in January, does not include what came after".
  context: { rule: 'border-rule', lead: 'text-graphite' },
  // What the analysis cannot support. The load-bearing one on this site:
  // the caveat colour on its rule and its lead word, as a line and as text.
  caveat: { rule: 'border-amber-700', lead: 'text-amber-800' },
  // How a number was produced, for readers who want to check it.
  method: { rule: 'border-ink', lead: 'text-ink' },
};

interface CalloutProps {
  children: ReactNode;
  kind?: CalloutKind;
  /** The lead word ("Ressalva", "Método"), set before the note in its kind's tone. */
  label?: string;
}

/**
 * The standing aside this site keeps writing by hand — a dating notice, a
 * limit on what the data supports, a method footnote. Making it a component
 * means every piece marks its caveats the same way instead of leaving them as
 * italics the reader can skim past. Instrumento: a ruled note (a 1px rule
 * above, in the kind's tone), an optional lead word, no box and no fill.
 */
export function Callout({ children, kind = 'context', label }: CalloutProps) {
  const tone = TONE[kind];
  return (
    <div role="note" className={`my-6 border-t pt-3 font-sans text-sm leading-relaxed text-ink ${tone.rule}`}>
      {label && (
        <p className={`mb-1.5 text-[13px] font-semibold ${tone.lead}`}>{label}</p>
      )}
      <div className="[&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}
