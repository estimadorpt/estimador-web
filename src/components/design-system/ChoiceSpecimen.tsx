'use client';

import { useState } from 'react';
import { ChoiceGroup, type ChoiceOption } from '@/components/brand/Choice';

type View = 'a' | 'b' | 'c';

/**
 * A live ChoiceGroup for /marca: the row, its choice, and the readout it
 * changes, beside it, in a live region that is there from the first paint.
 * Generic options, so a screenshot never reads as a forecast.
 */
export function ChoiceSpecimen({ pt }: { pt: boolean }) {
  const options: ChoiceOption<View>[] = pt
    ? [{ value: 'a', label: 'Primeira vista' }, { value: 'b', label: 'Segunda vista' }, { value: 'c', label: 'Terceira vista' }]
    : [{ value: 'a', label: 'First view' }, { value: 'b', label: 'Second view' }, { value: 'c', label: 'Third view' }];
  const [value, setValue] = useState<View>('a');
  const label = options.find(o => o.value === value)?.label;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <ChoiceGroup label={pt ? 'Vista do exemplo' : 'Example view'} options={options} value={value} onChange={setValue} />
      <p aria-live="polite" className="text-[14px] text-graphite">
        {pt ? 'A mostrar: ' : 'Showing: '}<b className="font-semibold text-ink">{label}</b>
      </p>
    </div>
  );
}
