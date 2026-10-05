'use client';

import { parishHref } from '@/components/population/ParishLink';
import { QualityBadge } from '@/components/population/QualityBadge';
import { formatCount } from '@/lib/population/format';
import { HONESTY, TIER_COPY, type Locale } from '@/lib/population/labels';
import type { RegionTable } from './places';
import styles from './RegionParishes.module.css';

/**
 * A region's parishes, município by município (both alphabetical), each with
 * its INE resident count and its quality tier (every parish page shows the
 * parish's own figures; a município fallback, which the contract can still
 * express, is flagged). Residents are INE's Census 2021 counts, never summed.
 *
 * It takes the compact rows of `regionTables` and draws lean rows (classes
 * live on the table, see the CSS module): the largest district lists ~350
 * parishes, and a server-rendered row would travel twice, as HTML and again in
 * the page's RSC payload. Links are plain anchors (`parishHref`).
 */
export function RegionParishes({ municipalities, locale }: { municipalities: RegionTable[]; locale: Locale }) {
  const pt = locale === 'pt';
  // Short, so the parish names keep the width on a phone; the paragraph above says the count is INE's, Censos 2021.
  const residents = pt ? 'Residentes (INE)' : 'Residents (INE)';
  const municipalityWord = pt ? 'Concelho' : 'Municipality';
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

      <div className="mb-6 max-w-3xl space-y-3 text-sm leading-relaxed text-stone-600">
        <p>
          {pt
            ? 'Cada freguesia abre a sua página, com as respostas da população sintética nos números da própria freguesia. A qualidade diz quão perto a população gerada fica das tabelas do INE:'
            : 'Each parish opens its own page, with the synthetic population’s answers in the parish’s own figures. The quality tier says how close the generated population sits to INE’s tables:'}
        </p>
        <ul className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
          {(['A', 'B', 'C'] as const).map(tier => (
            <li key={tier} className="col-span-2 grid grid-cols-subgrid items-start">
              <QualityBadge kind={tier} locale={locale} className="whitespace-nowrap" />
              <span className="pt-0.5">{TIER_COPY[tier].meaning[locale]}</span>
            </li>
          ))}
        </ul>
        <p>
          {pt ? 'Os residentes são a contagem do INE nos Censos 2021. ' : 'Residents are INE’s 2021 Census count. '}
          {HONESTY.synthetic[locale]}
        </p>
      </div>

      <div className="space-y-6">
        {municipalities.map(m => (
          <section key={m.code} id={`concelho-${m.code}`} aria-labelledby={`concelho-${m.code}-title`} className="scroll-mt-24 rounded-2xl border border-line bg-cream p-4 md:p-5">
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id={`concelho-${m.code}-title`} className="text-xl text-ink">{m.name}</h2>
              <p className="text-sm text-stone-500">
                {m.rows.length === 1
                  ? (pt ? '1 freguesia' : '1 parish')
                  : (pt ? `${formatCount(m.rows.length, locale)} freguesias` : `${formatCount(m.rows.length, locale)} parishes`)}
              </p>
            </header>
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <caption className="sr-only">
                  {pt ? `Freguesias do concelho de ${m.name}` : `Parishes of ${m.name} municipality`}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{pt ? 'Freguesia' : 'Parish'}</th>
                    <th scope="col">{residents}</th>
                    <th scope="col">{pt ? 'Qualidade' : 'Quality'}</th>
                  </tr>
                </thead>
                <tbody>
                  {m.rows.map(([code, name, count, tier, municipalityFigures]) => (
                    <tr key={code}>
                      <th scope="row"><a href={parishHref(code, locale)}>{name}</a></th>
                      <td>{formatCount(count, locale)}</td>
                      <td>
                        <span data-t={tier}>{tier}</span>
                        {municipalityFigures === 1 && <> <span data-t="M">{municipalityWord}</span></>}
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
