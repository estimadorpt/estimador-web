'use client';

import { useEffect } from 'react';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { AgeColumns } from '@/components/population/charts';
import { CardFooter } from '@/components/population/ResponseCard';
import { DIMENSION_LABEL, HONESTY, type Locale } from '@/lib/population/labels';
import type { ReadCell } from '@/lib/population/compact';

/**
 * The national age response: nineteen five-year columns with their table
 * twin. Only the producer's own cells and display strings, in age order. Its
 * footer carries the result id and "Copiar ligação", as parish cards do; a
 * permalink to it (/populacao/#idade) puts focus on the section heading.
 */
export function NationalAgeCard({ cells, locale, id, headingId }: { cells: ReadCell[]; locale: Locale; id: string | null; headingId: string }) {
  const pt = locale === 'pt';
  const title = pt ? 'Idade das pessoas geradas, em Portugal' : 'Age of the generated people, Portugal';
  useEffect(() => {
    if (window.location.hash !== '#idade') return;
    const frame = window.requestAnimationFrame(() => document.getElementById(headingId)?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [headingId]);
  return (
    <DataCard
      title={title}
      subtitle={pt
        ? 'Todas as pessoas da população sintética, por grupo de cinco anos de idade. Censos 2021.'
        : 'Everyone in the synthetic population, in five-year age groups. 2021 Census.'}
      locale={locale}
    >
      <AgeColumns cells={cells} locale={locale} height={220} />
      <ChartTable
        caption={title}
        columns={[DIMENSION_LABEL.age_5y[locale], pt ? 'Percentagem' : 'Share']}
        rows={cells.map(cell => [cell.labels[0], cell.display])}
      />
      <CardFooter source={HONESTY.source[locale]} id={id} question={pt ? 'Que idade tem Portugal?' : 'How old is Portugal?'} locale={locale} />
    </DataCard>
  );
}
