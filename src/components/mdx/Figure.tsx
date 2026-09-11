import type { ReactNode } from 'react';

interface FigureProps {
  children: ReactNode;
  /** What the reader should take from the chart, in a sentence. */
  caption?: string;
  /** Where the numbers came from. A chart in prose without this is an assertion. */
  source?: string;
  /**
   * The vintage of the data drawn. A note is frozen the day it publishes; the
   * figure beside it is not necessarily, and the reader is owed the difference.
   */
  asOf?: string;
}

/**
 * The editorial frame around anything visual inside a piece — a chart
 * component, a table, an image. It exists so that embedding a chart in prose
 * produces journalism rather than a dashboard tile that escaped.
 */
export function Figure({ children, caption, source, asOf }: FigureProps) {
  return (
    <figure className="my-8 border-y border-stone-200 py-6">
      <div className="not-prose font-sans">{children}</div>
      {(caption || source || asOf) && (
        <figcaption className="mt-4 font-sans text-sm leading-relaxed text-stone-500">
          {caption && <span className="block text-stone-700">{caption}</span>}
          {(source || asOf) && (
            <span className="mt-1 block text-xs">
              {source}
              {source && asOf ? ' · ' : ''}
              {asOf}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
