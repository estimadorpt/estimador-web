import type { MDXComponents } from 'mdx/types';
import { CoalitionDotPlot } from '@/components/charts/CoalitionDotPlot';
import { PollingChart } from '@/components/charts/PollingChart';
import { SeatChart } from '@/components/charts/SeatChart';
import { HouseEffects } from '@/components/charts/HouseEffects';
import { DistrictSummary } from '@/components/charts/DistrictSummary';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom chart components available in all MDX files
    CoalitionDotPlot,
    PollingChart,
    SeatChart,
    HouseEffects,
    DistrictSummary,
    
    // Enhanced HTML elements with styling
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold text-green-dark mt-8 mb-4 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold text-green-dark mt-6 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-green-dark mt-4 mb-2">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 text-gray-700 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mb-1 text-gray-700">
        {children}
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-green-dark">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic">
        {children}
      </em>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-green-medium pl-4 my-4 italic text-gray-600">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto mb-4">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        className="text-green-medium hover:text-green-dark hover:underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border border-gray-200">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-300 px-4 py-2">
        {children}
      </td>
    ),
    
    ...components,
  }
}