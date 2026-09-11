import type { MDXComponents } from 'mdx/types';
import { CoalitionDotPlot } from '@/components/charts/CoalitionDotPlot';
import { PollingChart } from '@/components/charts/PollingChart';
import { SeatChart } from '@/components/charts/SeatChart';
import { HouseEffects } from '@/components/charts/HouseEffects';
import { DistrictSummary } from '@/components/charts/DistrictSummary';
import { Figure } from '@/components/mdx/Figure';
import { Callout } from '@/components/mdx/Callout';

/**
 * Element styling for long-form pages. The reading face, measure and rhythm
 * come from `.article-body` in globals.css; these set the per-element
 * treatment, in the same stone palette the rest of the site uses.
 *
 * Headings stay sans while the body is serif — the page should read as an
 * article without looking like it was lifted off another site.
 */
export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    // Editorial primitives.
    Figure,
    Callout,

    // Chart components, callable from MDX with inline data:
    //   <Figure caption="…" source="…"><SeatChart data={[…]} /></Figure>
    CoalitionDotPlot,
    PollingChart,
    SeatChart,
    HouseEffects,
    DistrictSummary,

    // Articles put the title in the page header, but the standalone pages
    // (about, methodology, privacy) open their MDX with one.
    h1: ({ children }) => (
      <h1 className="text-3xl md:text-4xl text-stone-900 mb-6 tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl text-stone-900 mt-12 mb-3 tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg text-stone-900 mt-8 mb-2">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500 mt-8 mb-2">
        {children}
      </h4>
    ),
    p: ({ children }) => <p className="mb-5 text-stone-800">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-1.5 text-stone-800">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-1.5 text-stone-800">{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-stone-900">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-10 border-0 border-t border-stone-200" />,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-stone-800 pl-5 text-stone-600 [&>p]:mb-2 [&>p:last-child]:mb-0">
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      // Inside a <pre> the highlighter owns the styling; only inline code needs it.
      if (className?.includes('language-')) return <code className={className}>{children}</code>;
      return (
        <code className="bg-stone-100 px-1.5 py-0.5 font-mono text-[0.85em] text-stone-800">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-6 overflow-x-auto bg-stone-800 p-4 font-mono text-sm text-stone-100 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    table: ({ children }) => (
      <div className="my-8 overflow-x-auto">
        <table className="min-w-full border-collapse font-sans text-sm tabular-nums">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b-2 border-stone-800 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-stone-200 px-3 py-2 text-stone-800">{children}</td>
    ),
    details: ({ children }) => (
      <details className="my-6 border border-stone-200 font-sans text-sm [&[open]>summary]:border-b [&[open]>summary]:border-stone-200">
        {children}
      </details>
    ),
    summary: ({ children }) => (
      <summary className="cursor-pointer bg-stone-50 px-4 py-3 font-medium text-stone-800 hover:bg-stone-100">
        {children}
      </summary>
    ),

    ...components,
  }
}
// Next requires this export; server pages use the pure helper above.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components);
}
