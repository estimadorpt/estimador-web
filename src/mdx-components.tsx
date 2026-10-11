import type { MDXComponents } from 'mdx/types';
import { Figure } from '@/components/mdx/Figure';
import { Callout } from '@/components/mdx/Callout';
import { MdxPre, MdxTable } from '@/components/mdx/ScrollBlocks';

/**
 * Element styling for long-form pages. The reading face, measure and rhythm
 * come from `.article-body` in globals.css; these set the per-element
 * treatment in the instrument's ink, graphite and rules.
 *
 * Headings stay sans while the body is serif — the page should read as an
 * article without looking like it was lifted off another site.
 */
export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    // Editorial primitives.
    Figure,
    Callout,

    // The chart components are added by the article page only
    // (src/components/mdx/article-charts.ts), so the prose pages skip Plot and d3.

    // Articles put the title in the page header, but the standalone pages
    // (about, methodology, privacy) open their MDX with one.
    h1: ({ children }) => (
      <h1 className="text-3xl md:text-4xl text-ink mb-6">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl text-ink mt-12 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg text-ink mt-8 mb-2">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="font-sans text-[12px] font-semibold text-graphite mt-8 mb-2">
        {children}
      </h4>
    ),
    p: ({ children }) => <p className="mb-5 text-ink">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-1.5 text-ink">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-1.5 text-ink">{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-10 border-0 border-t border-rule" />,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-ink pl-5 text-graphite [&>p]:mb-2 [&>p:last-child]:mb-0">
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      // Inside a <pre> the highlighter owns the styling; only inline code needs it.
      if (className?.includes('language-')) return <code className={className}>{children}</code>;
      // A long path ("/pt/desporto/liga/jogador/joao-silva/") breaks where it
      // must, so the page never scrolls sideways at 320px (A11Y3-06, WCAG 1.4.10).
      // break-word, not anywhere: a table cell keeps its code whole and the
      // table scrolls in its own region instead of splitting every key.
      return (
        <code className="bg-field px-1 font-mono text-[0.85em] text-ink break-words">
          {children}
        </code>
      );
    },
    pre: ({ children }) => <MdxPre>{children}</MdxPre>,
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
    table: ({ children }) => <MdxTable>{children}</MdxTable>,
    th: ({ children }) => (
      <th className="border-b border-ink px-3 py-2 text-left text-[12px] font-semibold text-graphite">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-rule px-3 py-2 text-ink">{children}</td>
    ),

    // No `details` or `summary` here. Markdown has no syntax for them, and MDX 3
    // does not pass a hand-written <details> or <summary> through this map (it
    // compiles them to the plain element), so entries here never ran and only
    // contradicted the real look. That look lives once, in `.article-body
    // details` in globals.css: the <Disclosure> control (viz/Disclosure.tsx) on
    // a ruled block, with a 44px summary in ink, a left chevron that turns when
    // open and no native marker.

    ...components,
  }
}
// Next requires this export; server pages use the pure helper above.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components);
}
