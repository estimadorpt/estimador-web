import type { ReactNode } from 'react';
import { Link } from '@/i18n/routing';

/**
 * The head of an instrument: its name (an h2, a link when the instrument has
 * a page of its own), an optional serial ("J8", "v1.0.3", "arquivo") and,
 * on the right, the reading's date, over a 1px ink rule.
 */
export function ChannelHead({ id, title, href, locale, serial, aside, className = '' }: {
  id: string;
  title: ReactNode;
  href?: string;
  locale?: string;
  serial?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-ink pb-2 ${className}`}>
      <h2 id={id} className="text-[26px] leading-7 md:text-[27px]">
        {href ? (
          <Link href={href} locale={locale} className="inline-flex min-h-8 items-center no-underline hover:underline hover:decoration-2 underline-offset-4 max-sm:min-h-11">
            {title}
          </Link>
        ) : title}
      </h2>
      {serial && <span className="disp text-[15px] leading-4">{serial}</span>}
      {aside && <span className="basis-full text-[13px] text-graphite sm:ml-auto sm:basis-auto">{aside}</span>}
    </div>
  );
}
