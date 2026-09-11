import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

type Variant = 'primary' | 'secondary' | 'tint' | 'text';

interface ActionProps {
  href?: string;
  locale?: string;
  /** Plain `<a>` for anchors and external destinations. */
  external?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  /** Trailing arrow, for actions that lead somewhere. */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The site's actions: a pine main action, a
 * bordered secondary one on cream, a tinted third for soft entrances, and a
 * text action. All 48px tall with 10px corners; the keyboard focus ring is
 * global (globals.css). One main action per view.
 */
const base = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold leading-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: `${base} bg-ink text-paper hover:bg-ink-dark`,
  secondary: `${base} border border-line bg-cream text-ink hover:bg-parchment`,
  tint: `${base} bg-periwinkle-soft text-ink hover:bg-periwinkle`,
  text: 'inline-flex min-h-12 items-center gap-1.5 text-[15px] font-semibold text-ink underline-offset-4 hover:underline',
};

export function Action({ href, locale, external, onClick, type = 'button', variant = 'primary', arrow, className = '', children }: ActionProps) {
  const cls = `${variants[variant]} ${className}`;
  const content = (
    <>
      {children}
      {arrow && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
    </>
  );
  if (href && external) return <a href={href} className={cls}>{content}</a>;
  if (href) return <Link href={href} locale={locale} className={cls}>{content}</Link>;
  return <button type={type} onClick={onClick} className={cls}>{content}</button>;
}
