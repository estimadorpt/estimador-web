import type { ReactNode } from 'react';

type CalloutKind = 'context' | 'caveat' | 'method';

const TONE: Record<CalloutKind, string> = {
  // Dating and scope — "written in January, does not include what came after".
  context: 'border-stone-400 bg-stone-50 text-stone-600',
  // What the analysis cannot support. The load-bearing one on this site.
  caveat: 'border-amber-500 bg-amber-50 text-stone-700',
  // How a number was produced, for readers who want to check it.
  method: 'border-stone-800 bg-cream text-stone-700',
};

interface CalloutProps {
  children: ReactNode;
  kind?: CalloutKind;
  label?: string;
}

/**
 * The standing aside this site keeps writing by hand — a dating notice, a
 * limit on what the data supports, a method footnote. Making it a component
 * means every piece marks its caveats the same way instead of leaving them as
 * italics the reader can skim past.
 */
export function Callout({ children, kind = 'context', label }: CalloutProps) {
  return (
    <aside className={`my-6 border-l-2 py-4 pl-5 pr-4 font-sans text-sm leading-relaxed ${TONE[kind]}`}>
      {label && (
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      )}
      <div className="[&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}
