'use client';

import { Action } from '@/components/brand/Action';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { CONTAINER_CLASS } from '@/components/brand/Container';

/** The 404's copy in one language, read from the messages by NotFoundBody. */
export interface NotFoundLabels {
  title: string;
  heading: string;
  lede: string;
  home: string;
  atlas: string;
}

/**
 * The 404's markup. A client component on purpose, with no state or effects,
 * for the reason SiteFooterView is one: Next serialises both not-found
 * boundaries, in both languages, into every page's RSC payload, and as a
 * client view each copy is a reference and its five strings instead of the
 * whole tree. The HTML is unchanged.
 *
 * The actions are plain anchors with the locale written out: the root 404
 * renders outside the locale layout, where next-intl's Link has no locale to
 * read.
 */
export function NotFoundBodyView({ locale, withTitle, labels }: { locale: 'pt' | 'en'; withTitle: boolean; labels: NotFoundLabels }) {
  return (
    <main id="main-content" tabIndex={-1} lang={locale}>
      {/* React hoists this into <head>. Only the root 404 needs it: inside a
          locale the page's own metadata names the document. */}
      {withTitle && <title>{labels.title}</title>}
      {/* No bottom rule: the footer draws the one rule below it. */}
      <section>
        {/* The shared container: the text starts where the header's logo does. */}
        <div className={`${CONTAINER_CLASS} grid gap-8 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-10 md:py-24`}>
          <div>
            <p className="mb-3 text-[12px] font-semibold text-graphite">404</p>
            <h1 className="max-w-xl text-4xl md:text-5xl">{labels.heading}</h1>
            <p className="mt-4 max-w-md text-lg text-stone-600">{labels.lede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Action href={`/${locale}/`} external>{labels.home}</Action>
              <Action href={`/${locale}/populacao/`} external variant="secondary" arrow>{labels.atlas}</Action>
            </div>
          </div>
          <EmptyStateMark size="lg" className="order-first md:order-none md:justify-self-center" />
        </div>
      </section>
    </main>
  );
}
