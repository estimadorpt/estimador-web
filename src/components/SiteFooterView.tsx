'use client';

import { Rss } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LogoHorizontal } from './Logo';
import { RulerEdge } from '@/components/instrument/RulerEdge';
import { CONTAINER_CLASS } from '@/components/brand/Container';
import { ReadingRule } from '@/components/instrument/ReadingRule';

// Links are ink with an underline at rest (CLAUDE.md); keyboard focus is the
// global double ring in globals.css, so nothing here declares its own.
// Each link is a 44px target on a phone (audit UXM2-09) and tightens to the
// text's own height where a pointer is precise.
const linkStyle = 'inline-flex min-h-11 items-center text-ink underline underline-offset-4 decoration-ink/40 transition-colors hover:decoration-ink md:min-h-8';

export interface FooterItem {
  href: string;
  label: string;
}

// A link that wraps onto two lines keeps the same air above and below it as
// a one-line link, so two wrapped entries never read as one (UXM3-09).
const listStyle = 'space-y-1.5 md:space-y-0.5';

function FooterColumn({ heading, items, locale }: { heading: string; items: FooterItem[]; locale: string }) {
  return (
    <div>
      <h2 className="font-sans tracking-normal mb-2 text-[13px] font-bold not-italic leading-5">{heading}</h2>
      <ul className={listStyle}>
        {items.map(item => (
          <li key={item.href}>
            <Link href={item.href} locale={locale} className={linkStyle}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The footer's copy, read from the messages and the brand file by SiteFooter. */
export interface FooterLabels {
  line: string;
  descriptor: string;
  products: string;
  project: string;
  contact: string;
  developer: string;
}

/**
 * The footer's markup. A client component on purpose, with no state or
 * effects: a page's RSC payload carries every server-rendered tree in full,
 * and each page holds five footers (its own, and one per language in each of
 * the two not-found boundaries Next serialises into every page). As a client
 * view each of them is a reference and these props, about 1 KB, where the
 * tree and its links were about 7 KB: some 30 KB less in every page's
 * payload, twice (the .txt and the copy inlined in the HTML), which is what
 * keeps the export inside its budget (November 2026). The HTML is unchanged.
 */
export function SiteFooterView({ locale, labels, sections, project, hasArticles, year }: {
  locale: string;
  labels: FooterLabels;
  sections: FooterItem[];
  project: FooterItem[];
  hasArticles: boolean;
  year: number;
}) {
  const pt = locale === 'pt';
  return (
    <footer className="mt-16 border-t-2 border-ink bg-paper">
      {/* The ruler's edge hangs from the footer's rule, away from the page above. */}
      <div className={CONTAINER_CLASS}><RulerEdge direction="down" /></div>
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-[33px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" locale={locale} className="brand-link inline-flex min-h-11 items-center" aria-label={pt ? 'estimador.pt — página inicial' : 'estimador.pt — home'}>
              <LogoHorizontal size={20} />
            </Link>
            {/* The line on its own, then the descriptor: set as one paragraph
                they read "Dados… Dados… Portugal… Portugal" (CL3-16). */}
            <p className="mt-3 text-sm font-semibold text-ink">{labels.line}</p>
            <p className="mt-1 text-sm leading-relaxed text-graphite">{labels.descriptor}</p>
            {/* The site's three marks, explained once for every page. */}
            <p className="mt-4 text-[13px] leading-5 text-ink">
              <ReadingRule locale={locale} className="flex-col !items-start" />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm sm:grid-cols-3">
            <FooterColumn heading={labels.products} items={sections} locale={locale} />
            <FooterColumn heading={labels.project} items={project} locale={locale} />
            <div>
              <h2 className="font-sans tracking-normal mb-2 text-[13px] font-bold leading-5">{labels.contact}</h2>
              <ul className={listStyle}>
                <li>
                  <a href="mailto:info@estimador.pt" className={`${linkStyle} [overflow-wrap:anywhere]`}>info@estimador.pt</a>
                </li>
                {/* A way to follow the project between visits (audit CL2-15):
                    the organisation's public repositories, where each data
                    release is published. The one account the site can vouch
                    for (structured-data.ts sameAs). */}
                <li>
                  <a href="https://github.com/estimadorpt" rel="me" className={linkStyle}>
                    {pt ? 'GitHub (versões dos dados)' : 'GitHub (data releases)'}
                  </a>
                </li>
                {hasArticles && (
                  <li>
                    <a href={`/${locale}/feed.xml`} className={`inline-flex items-center gap-1.5 ${linkStyle}`}>
                      <Rss aria-hidden="true" className="h-3.5 w-3.5" />
                      RSS
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-rule pt-5 text-xs text-graphite sm:flex-row sm:items-center sm:justify-between">
          <p>{labels.developer}</p>
          <p>© {year} estimador.pt</p>
        </div>
      </div>
    </footer>
  );
}
