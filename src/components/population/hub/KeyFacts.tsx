import { NoMargin } from '@/components/instrument';
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
 * says so and links to the gap on /dados (MR2-V02). The counts are a ruled
 * register of figures (a rule above each, the label, the figure), with the
 * sign of a single model run and the honesty line before them: no tiles.
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
  const figures = [
    { label: pt ? 'Pessoas geradas' : 'People generated', value: n(persons), note: pt ? 'Geradas a partir dos Censos 2021' : 'Generated from the 2021 Census' },
    { label: pt ? 'Agregados gerados' : 'Households generated', value: n(households), note: pt ? 'Gerados; cada alojamento coletivo conta como um' : 'Generated; each collective quarter counts as one' },
    {
      label: pt ? 'Freguesias' : 'Parishes',
      value: n(parishes),
      note: pt
        ? `Em ${n(municipalities)} concelhos, com os limites de 2021 (CAOP). Todas com os seus próprios números.`
        : `In ${n(municipalities)} municipalities, with the 2021 boundaries (CAOP). Each with its own figures.`,
    },
  ];
  return (
    <section aria-labelledby="population-facts">
      <h2 id="population-facts" className="sr-only">{pt ? 'O que tem esta versão' : 'What this release contains'}</h2>
      {/* One model run, so no margin: the sign and the caveat come before the first figure. */}
      <p className="mb-4 flex flex-col gap-1">
        <NoMargin locale={locale} />
        <span className="text-[14px] text-ink">{HONESTY.synthetic[locale]}</span>
      </p>
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
        {figures.map(figure => (
          <div key={figure.label} className="border-t border-rule pt-2">
            <dt className="text-[13px] text-graphite">{figure.label}</dt>
            <dd className="fig mt-1 text-[34px] leading-none text-ink md:text-[40px]">{figure.value}</dd>
            <dd className="mt-1.5 text-[12.5px] leading-snug text-graphite">{figure.note}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-graphite">
        {pt
          ? 'O total de pessoas geradas não é o de residentes contados pelo INE: em parte das freguesias, os dois diferem. '
          : 'The total of generated people is not the resident count INE published: in some parishes the two differ. '}
        <Link href={`${POPULATION_ROUTES.data}#total-gerado`} locale={locale} className="font-semibold text-ink underline underline-offset-4">
          {pt ? 'Quanto difere' : 'By how much'}
        </Link>
      </p>
      <div className="mt-8">
        <h3 className="text-[19px] leading-6 text-ink">{pt ? 'Três níveis de qualidade' : 'Three quality tiers'}</h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-graphite">
          {pt
            ? 'Cada freguesia tem um nível de qualidade, que junta o ajuste às tabelas do INE e o número de residentes. O nível não esconde nada: diz com que cuidado ler os números.'
            : 'Each parish has a quality tier, which combines the fit to INE’s tables and the number of residents. The tier hides nothing: it says how carefully to read the numbers.'}
        </p>
        <ul className="mt-3 grid gap-x-8 gap-y-5 md:grid-cols-3">
          {TIERS.map(tier => (
            <li key={tier} className="border-t border-ink pt-2">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <QualityBadge kind={tier} locale={locale} className="text-[15px]" />
                <span className="text-[13px] text-graphite">
                  <span className="fig text-[20px] text-ink">{n(tiers[tier])}</span> {pt ? 'freguesias' : 'parishes'}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-graphite">{TIER_COPY[tier].meaning[locale]}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
