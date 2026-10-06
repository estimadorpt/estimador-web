import type { ReactNode } from 'react';
import { Link } from '@/i18n/routing';

/**
 * A standalone text link: "Metodologia", "Ver o jogo", "Dados abertos", a
 * link on a line of its own or in a card's footer, as opposed to a link
 * inside running prose. Ink with an underline at rest (CLAUDE.md, "Ink"), and
 * a 44px target whatever the font size, so a thumb can hit it (audit
 * UXM2-09). Inside a sentence, use a plain anchor: the paragraph's line
 * height is its target.
 *
 *   <TextLink href="/desporto/liga/metodologia">Metodologia</TextLink>
 *   <TextLink href="https://…" external>Fonte: INE</TextLink>
 */
export function TextLink({ href, locale, external = false, className = '', children }: {
  href: string;
  locale?: string;
  /** A plain <a>: another site, a file, an in-page anchor or the root 404. */
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cls = `inline-flex min-h-11 items-center font-semibold text-ink underline decoration-ink/40 underline-offset-4 transition-colors hover:decoration-ink ${className}`;
  if (external) return <a href={href} className={cls}>{children}</a>;
  return <Link href={href} locale={locale} className={cls}>{children}</Link>;
}
