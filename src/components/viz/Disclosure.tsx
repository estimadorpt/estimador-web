import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DisclosureProps {
  /** Sentence case, a verb first: "Ver como tabela", "Como se joga?". */
  summary: ReactNode;
  /**
   * Read by assistive technology after the visible summary, so several
   * identical "Ver como tabela" toggles on one page are still told apart.
   */
  srSuffix?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** Extra classes for the summary row (spacing, colour), never its size. */
  summaryClassName?: string;
}

/**
 * The one show/hide control: a native <details> with a 44px summary, a chevron
 * that turns when open, and a sentence-case label in ink. It needs no
 * JavaScript, works in server components, and keeps the browser's own keyboard
 * and find-in-page behaviour. Use it for table twins, map lists and FAQs
 * rather than a bespoke toggle, so readers meet one control for one action.
 */
export function Disclosure({ summary, srSuffix, children, defaultOpen = false, className = '', summaryClassName = '' }: DisclosureProps) {
  return (
    <details className={`group/disclosure ${className}`} open={defaultOpen || undefined}>
      <summary
        className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden ${summaryClassName}`}
      >
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-150 group-open/disclosure:rotate-180 motion-reduce:transition-none" />
        <span>{summary}</span>
        {srSuffix && <span className="sr-only">: {srSuffix}</span>}
      </summary>
      {children}
    </details>
  );
}
