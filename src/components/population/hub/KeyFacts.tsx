import { KpiRow, StatTile } from '@/components/viz/StatTile';
import { HONESTY, type Locale } from '@/lib/population/labels';
import { formatCount } from './places';

/**
 * What the release contains: the generated persons and households (the
 * release's own counts), the parishes, and how many parishes show their own
 * figures or their município's (a count of places, not a statistic).
 */
export function KeyFacts({ locale, persons, households, parishes, municipalities, parishLevel, municipalityLevel }: {
  locale: Locale;
  persons: number;
  households: number;
  parishes: number;
  municipalities: number;
  parishLevel: number;
  municipalityLevel: number;
}) {
  const pt = locale === 'pt';
  const n = (value: number) => formatCount(value, locale);
  return (
    <section aria-labelledby="population-facts">
      <h2 id="population-facts" className="sr-only">{pt ? 'O que tem esta versão' : 'What this release contains'}</h2>
      <p className="mb-3 text-sm text-stone-600">{HONESTY.synthetic[locale]}</p>
      <KpiRow>
        <StatTile label={pt ? 'Pessoas geradas' : 'People generated'} value={n(persons)} note={pt ? 'Calibradas nos Censos 2021' : 'Calibrated to the 2021 Census'} />
        <StatTile label={pt ? 'Agregados gerados' : 'Households generated'} value={n(households)} note={pt ? 'Calibrados nos Censos 2021' : 'Calibrated to the 2021 Census'} />
        <StatTile label={pt ? 'Freguesias' : 'Parishes'} value={n(parishes)} note={pt ? `Em ${n(municipalities)} concelhos, CAOP 2021` : `In ${n(municipalities)} municipalities, CAOP 2021`} />
        <StatTile
          label={pt ? 'Freguesias com valores próprios' : 'Parishes with their own figures'}
          value={n(parishLevel)}
          note={pt
            ? `Nas outras ${n(municipalityLevel)}, mostramos os valores do concelho e dizemo-lo.`
            : `For the other ${n(municipalityLevel)}, we show the municipality’s figures and say so.`}
        />
      </KpiRow>
    </section>
  );
}
