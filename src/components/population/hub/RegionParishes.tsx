import { ParishLink } from '@/components/population/ParishLink';
import { QualityBadge } from '@/components/population/QualityBadge';
import { HONESTY, TIER_COPY, type Locale } from '@/lib/population/labels';
import { formatCount, type MunicipalityListing } from './places';

/**
 * A region's parishes, município by município (both alphabetical), each with
 * its INE resident count and its quality tier (every parish page shows the
 * parish's own figures; a município fallback, which the contract can still
 * express, is flagged). Residents are INE's Census 2021 counts, never summed.
 */
export function RegionParishes({ municipalities, locale }: { municipalities: MunicipalityListing[]; locale: Locale }) {
  const pt = locale === 'pt';
  const residents = pt ? 'Residentes (INE, Censos 2021)' : 'Residents (INE, 2021 Census)';
  return (
    <div>
      <nav aria-label={pt ? 'Concelhos' : 'Municipalities'} className="mb-6">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">{pt ? 'Ir para o concelho' : 'Jump to a municipality'}</h2>
        <ul className="flex flex-wrap gap-2">
          {municipalities.map(m => (
            <li key={m.code}>
              <a href={`#concelho-${m.code}`} className="inline-flex min-h-11 items-center rounded-[10px] border border-line bg-cream px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-parchment">
                {m.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mb-6 max-w-3xl space-y-2 text-sm leading-relaxed text-stone-600">
        <p>
          {pt
            ? 'Cada freguesia abre a sua página com as respostas da população sintética, com os seus próprios números. A qualidade diz quão perto a população gerada fica das tabelas do INE: A e B de perto; C numa freguesia pequena ou com um ajuste mais fraco, a ler com mais cuidado.'
            : 'Each parish opens its own page with the synthetic population’s answers, in its own figures. The quality tier says how close the generated population sits to INE’s tables: A and B closely; C in a small parish or one with a weaker fit, to read with more care.'}
        </p>
        <p>
          {pt
            ? 'Os residentes são a contagem do INE nos Censos 2021. '
            : 'Residents are INE’s 2021 Census count. '}
          {HONESTY.synthetic[locale]}
        </p>
      </div>

      <div className="space-y-6">
        {municipalities.map(m => (
          <section key={m.code} id={`concelho-${m.code}`} aria-labelledby={`concelho-${m.code}-title`} className="scroll-mt-24 rounded-2xl border border-line bg-cream p-4 md:p-5">
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id={`concelho-${m.code}-title`} className="text-xl text-ink">{m.name}</h2>
              <p className="text-sm text-stone-500">
                {m.parishes.length === 1
                  ? (pt ? '1 freguesia' : '1 parish')
                  : (pt ? `${formatCount(m.parishes.length, locale)} freguesias` : `${formatCount(m.parishes.length, locale)} parishes`)}
              </p>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  {pt ? `Freguesias do concelho de ${m.name}` : `Parishes of ${m.name} municipality`}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="border-b-2 border-ink px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">{pt ? 'Freguesia' : 'Parish'}</th>
                    <th scope="col" className="border-b-2 border-ink px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wider text-stone-600">{residents}</th>
                    <th scope="col" className="border-b-2 border-ink px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">{pt ? 'Qualidade do ajuste' : 'Quality of fit'}</th>
                  </tr>
                </thead>
                <tbody>
                  {m.parishes.map(parish => (
                    <tr key={parish.code} className="border-b border-line last:border-b-0">
                      <th scope="row" className="px-2 py-2 text-left font-semibold">
                        <ParishLink code={parish.code} locale={locale} className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                          {parish.name}
                        </ParishLink>
                      </th>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-ink">{formatCount(parish.censusPopulation, locale)}</td>
                      <td className="px-2 py-2">
                        <span className="flex flex-wrap gap-1.5">
                          <QualityBadge kind={parish.tier} locale={locale} title={TIER_COPY[parish.tier].meaning[locale]} className="whitespace-nowrap" />
                          {parish.level === 'municipality' && <QualityBadge kind="municipality" locale={locale} className="whitespace-nowrap" />}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
