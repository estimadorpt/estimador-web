import type { ReactNode } from 'react';

/**
 * A reading's register ("ficha"): at most a handful of facts (edition, date,
 * simulations, source) stated once, as a ruled definition list. It replaces
 * status pills and middle-dot chains.
 */
export function Register({ items, title, className = '' }: {
  items: Array<{ label: ReactNode; value: ReactNode }>;
  title?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {title && <p className="mb-1.5 text-[13px] font-bold">{title}</p>}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] border-t border-ink text-[13px] leading-[18px]">
        {items.map((item, i) => (
          <div key={i} className="contents">
            <dt className="border-b border-grid py-1.5 pr-4 text-graphite">{item.label}</dt>
            <dd className="border-b border-grid py-1.5 font-semibold tnum">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
