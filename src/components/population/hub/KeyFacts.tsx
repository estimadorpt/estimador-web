import { KpiRow, StatTile } from '@/components/viz/StatTile';
import { QualityBadge } from '@/components/population/QualityBadge';
import { Link } from '@/i18n/routing';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { HONESTY, TIER_COPY, type Locale } from '@/lib/population/labels';
import { formatCount } from './places';

const TIERS = ['A', 'B', 'C'] as const;

/**
 * What the release contains: the generated persons and households (the
 * release's own counts), the parishes, and how many parishes sit in each
 * quality tier (meta.counts.tiers: a count of places, not a statistic). Every
 * parish answers with its own numbers; the tier says how closely they follow
 * INE's tables. The generated total is not INE's resident count, so the row
 * says so and links to the gap on /dados (MR2-V02).
 */
export function KeyFacts({ locale, persons, households, parishes, municipalities, tiers }: {
  locale: Locale;
  persons: number;
  households: number;
  parishes: number;
  municipalities: number;
  tiers: Record<'A' | 'B' | 'C', number>;
}) {
  const pt = locale === 'pt';
  const n = (value: number) => formatCount(value, locale);
  return (
    <section aria-labelledby="population-facts">
      <h2 id="population-facts" className="sr-only">{pt ? 'O que tem esta versão' : 'What this release contains'}</h2>
      <p className="mb-3 text-sm text-stone-600">{HONESTY.synthetic[locale]}</p>
      <KpiRow className="lg:grid-cols-3!">
        <StatTile label={pt ? 'Pessoas geradas' : 'People generated'} value={n(persons)} note={pt ? 'Geradas a partir dos Censos 2021' : 'Generated from the 2021 Census'} />
        <StatTile label={pt ? 'Agregados gerados' : 'Households generated'} value={n(households)} note={pt ? 'Gerados; cada alojamento coletivo conta como um' : 'Generated; each collective quarter counts as one'} />
        <StatTile
          label={pt ? 'Freguesias' : 'Parishes'}
          value={n(parishes)}
          note={pt
            ? `Em ${n(municipalities)} concelhos, CAOP 2021. Todas com os seus próprios números.`
            : `In ${n(municipalities)} municipalities, CAOP 2021. Each with its own figures.`}
        />
      </KpiRow>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
        {pt
          ? 'O total de pessoas geradas não é o de residentes contados pelo INE: em parte das freguesias, os dois diferem. '
          : 'The total of generated people is not the resident count INE published: in some parishes the two differ. '}
        <Link href={`${POPULATION_ROUTES.data}#total-gerado`} locale={locale} className="font-semibold text-ink underline underline-offset-4">
          {pt ? 'Quanto difere' : 'By how much'}
        </Link>
      </p>
      <div className="mt-6">
        <h3 className="text-base font-bold text-ink">{pt ? 'Quão perto das tabelas do INE?' : 'How close to INE’s tables?'}</h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-600">
          {pt
            ? 'Cada freguesia tem um nível de qualidade, que junta o ajuste às tabelas do INE e o número de residentes. O nível não esconde nada: diz com que cuidado ler os números.'
            : 'Each parish has a quality tier, which combines the fit to INE’s tables and the number of residents. The tier hides nothing: it says how carefully to read the numbers.'}
        </p>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {TIERS.map(tier => (
            <li key={tier} className="rounded-2xl border border-line bg-cream p-4">
              <div className="flex flex-wrap items-center gap-3">
                <QualityBadge kind={tier} locale={locale} />
                <span className="font-display text-xl font-extrabold tabular-nums text-ink">
                  {n(tiers[tier])} <span className="text-sm font-semibold text-stone-600">{pt ? 'freguesias' : 'parishes'}</span>
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{TIER_COPY[tier].meaning[locale]}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
