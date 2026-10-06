import type { ReactNode } from 'react';
import { Action } from './Action';

/**
 * The explainer teaser that follows the useful data on a dashboard: one soft
 * field, a question as its title, one action. It never sits above the data.
 * No mosaic: it follows a dashboard's numbers, and the mosaic is for brand
 * material, the 404 and empty states only (CLAUDE.md, header table).
 */
export function TeaserBand({ field = 'mint', title, children, href, locale, action, className = '' }: { field?: 'mint' | 'periwinkle' | 'coral' | 'mustard'; title: string; children: ReactNode; href: string; locale: string; action: string; className?: string }) {
  return (
    <section className={`field-${field} relative overflow-hidden rounded-2xl ${className}`}>
      <div className="relative flex flex-col gap-4 p-6 md:max-w-[62%] md:p-8">
        <h2 className="text-2xl md:text-3xl">{title}</h2>
        <p className="max-w-xl text-base leading-relaxed text-ink">{children}</p>
        <div><Action href={href} locale={locale} arrow>{action}</Action></div>
      </div>
    </section>
  );
}
