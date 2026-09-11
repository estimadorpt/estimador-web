interface Item { label: string; color: string; kind?: 'line' | 'rect' | 'dot' }

/** Present for two or more series; mirrors the mark: a stroke for lines, a rect for bars, a dot for dots. */
export function Legend({ items, className = '' }: { items: Item[]; className?: string }) {
  if (items.length < 2) return null;
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600 ${className}`}>
      {items.map(i => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.kind === 'rect' ? <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: i.color }} aria-hidden="true" />
            : i.kind === 'dot' ? <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} aria-hidden="true" />
            : <span className="inline-block h-[2px] w-4 rounded-full" style={{ backgroundColor: i.color }} aria-hidden="true" />}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
