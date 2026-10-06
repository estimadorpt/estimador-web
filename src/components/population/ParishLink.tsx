import type { ReactNode } from 'react';
import { POPULATION_ROUTES } from '@/lib/config/population';

export function parishHref(code: string, locale: string, anchor?: string): string {
  return `/${locale}${POPULATION_ROUTES.parish(code)}/${anchor ? `#${anchor}` : ''}`;
}

/**
 * A link to a parish page. Deliberately a plain anchor: the 3,092 parish pages
 * share one exported shell behind a host rewrite (staticwebapp.config.json),
 * so a client-side <Link> would fetch an RSC payload that does not exist, get
 * HTML back and fall into a hard navigation anyway, after prefetching it for
 * every link in view.
 */
export function ParishLink({ code, locale, anchor, className, children, ...rest }: {
  code: string;
  locale: string;
  anchor?: string;
  className?: string;
  children: ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <a href={parishHref(code, locale, anchor)} className={className} {...rest}>
      {children}
    </a>
  );
}
