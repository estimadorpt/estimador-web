'use client';

import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { AgeColumns } from '@/components/population/charts';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { DIMENSION_LABEL, HONESTY, type Locale } from '@/lib/population/labels';
import type { ReadCell } from '@/lib/population/compact';

/**
 * The national age response: nineteen five-year columns with their table
 * twin. Only the producer's own cells and display strings, in age order.
 */
export function NationalAgeCard({ cells, locale }: { cells: ReadCell[]; locale: Locale }) {
  const pt = locale === 'pt';
  const title = pt ? 'Idade das pessoas geradas, em Portugal' : 'Age of the generated people, Portugal';
  return (
    <DataCard
      title={title}
      subtitle={pt
        ? 'Todas as pessoas da população sintética, por grupo de cinco anos de idade. Censos 2021.'
        : 'Everyone in the synthetic population, in five-year age groups. 2021 Census.'}
      source={HONESTY.source[locale]}
      methodologyHref={POPULATION_ROUTES.methodology}
      methodologyLabel={pt ? 'Como foi feito' : 'How it was made'}
      locale={locale}
    >
      <AgeColumns cells={cells} locale={locale} height={220} />
      <ChartTable
        caption={title}
        columns={[DIMENSION_LABEL.age_5y[locale], pt ? 'Percentagem' : 'Share']}
        rows={cells.map(cell => [cell.labels[0], cell.display])}
      />
    </DataCard>
  );
}
