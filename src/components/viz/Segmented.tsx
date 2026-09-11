'use client';

interface Option { value: string; label: string }

/**
 * A segmented control for scoping a chart or a view: one row, 44px targets,
 * the active segment in pine. It is a group of buttons, not tabs, because the
 * content below re-renders in place rather than switching panels.
 */
export function Segmented({ options, value, onChange, label, className = '' }: { options: Option[]; value: string; onChange: (value: string) => void; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`inline-flex rounded-[10px] border border-line bg-paper p-1 ${className}`}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" aria-pressed={active} onClick={() => onChange(o.value)}
            className={`min-h-11 rounded-[8px] px-3.5 text-sm font-semibold transition-colors duration-150 ${active ? 'bg-ink text-paper' : 'text-stone-600 hover:bg-parchment hover:text-ink'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
