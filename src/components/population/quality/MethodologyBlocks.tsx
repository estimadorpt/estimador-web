import type { ReactNode } from 'react';
import type { MDXComponents } from 'mdx/types';
import { Callout } from '@/components/mdx/Callout';
import { QualityBadge } from '@/components/population/QualityBadge';
import { POPULATION_DOWNLOADS } from '@/lib/config/population';
import { DIMENSION_LABEL, HONESTY, TIER_COPY, type Locale } from '@/lib/population/labels';
import type { PopulationMeta, PopulationReleaseInfo, PopulationScorecard } from '@/types/population';
import { ACCIDENTAL_MATCHES, INTENDED_USES, LIMITATIONS, NON_USES, NOVELTY, SUPERSEDED, formatCount } from './copy';

const FIELD_LABEL: Record<string, Record<Locale, string>> = {
  ...DIMENSION_LABEL,
  is_institutional: { pt: 'Alojamento coletivo', en: 'Collective living quarters' },
};

const PROVENANCE_CLASS: Record<string, Record<Locale, string>> = {
  census_calibrated: { pt: 'Calibrado nos Censos', en: 'Census-calibrated' },
  derived: { pt: 'Derivado', en: 'Derived' },
  modelled: { pt: 'Modelado', en: 'Modelled' },
  carried_forward: { pt: 'Transportado de 2021', en: 'Carried forward' },
  unvalidated: { pt: 'Não validado', en: 'Unvalidated' },
};

/**
 * The data-bound pieces of the methodology MDX. Every quotation that must stay
 * verbatim (the positioning sentence, the attribution, the novelty figures)
 * is rendered from its source rather than retyped in the prose.
 */
export function methodologyBlocks({ locale, meta, release, scorecard }: {
  locale: Locale;
  meta: PopulationMeta;
  release: PopulationReleaseInfo;
  scorecard: PopulationScorecard;
}): MDXComponents {
  const pt = locale === 'pt';
  return {
    // The release the page describes, from the data it serves.
    Release: () => <>{meta.release_version}</>,
    Superseded: () => <Callout kind="context">{SUPERSEDED[locale]}</Callout>,
    Positioning: () => (
      <blockquote className="my-6 border-l-2 border-ink pl-5 text-ink">
        <p className="mb-0">{HONESTY.positioning[locale]}</p>
      </blockquote>
    ),
    Synthetic: () => <Callout kind="caveat">{HONESTY.synthetic[locale]}</Callout>,
    SingleRun: () => (
      <Callout kind="caveat">
        <p>{scorecard.honesty_notes[2]?.[locale] ?? HONESTY.singleRun[locale]}</p>
      </Callout>
    ),
    ProvenanceFields: () => (
      <div className="my-6 overflow-x-auto font-sans">
        <table className="min-w-full border-collapse text-sm">
          <caption className="sr-only">{pt ? 'Origem de cada campo usado no site' : 'Provenance of each field used on the site'}</caption>
          <thead>
            <tr>
              <th scope="col" className="border-b-2 border-ink px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">{pt ? 'Campo' : 'Field'}</th>
              <th scope="col" className="border-b-2 border-ink px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">{pt ? 'Origem' : 'Provenance'}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(meta.provenance.fields ?? {}).map(([field, kind]) => (
              <tr key={field}>
                <td className="border-b border-line px-3 py-2 text-ink">
                  {FIELD_LABEL[field]?.[locale] ?? field} <code className="ml-1 text-xs text-stone-500">{field}</code>
                </td>
                <td className="border-b border-line px-3 py-2 text-ink">{PROVENANCE_CLASS[String(kind)]?.[locale] ?? String(kind)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    Tiers: () => (
      <ul className="my-6 list-none space-y-4 pl-0 font-sans">
        {(['A', 'B', 'C'] as const).map(tier => (
          <li key={tier} className="max-w-none rounded-2xl border border-line bg-cream p-4 text-base">
            <div className="flex flex-wrap items-center gap-3">
              <QualityBadge kind={tier} locale={locale} />
              <span className="text-sm font-semibold tabular-nums text-ink">
                {formatCount(meta.counts.tiers[tier], locale)} {pt ? 'freguesias' : 'parishes'}
              </span>
            </div>
            <p className="mb-0 mt-2 text-[15px] leading-relaxed text-stone-700">{TIER_COPY[tier].meaning[locale]}</p>
          </li>
        ))}
      </ul>
    ),
    // Which decisions this release actually takes, read from its own counts, so
    // the page never describes a fallback or a suppression the data do not use.
    PublicationRules: () => {
      const { decisions, suppressed_cells: suppressed } = meta.counts;
      const rules = [
        {
          show: true,
          title: pt ? 'Publicar.' : 'Publish.',
          body: pt
            ? 'O resultado da freguesia passa as regras de qualidade e é mostrado com o seu nível.'
            : 'The parish result passes the quality rules and is shown with its tier.',
        },
        {
          show: (decisions.fallback ?? 0) > 0,
          title: pt ? 'Usar o concelho.' : 'Use the municipality.',
          body: pt
            ? 'Quando o resultado da freguesia é demasiado fraco, mostramos o do concelho, e dizemos sempre qual é. Nunca o apresentamos como sendo da freguesia.'
            : 'When the parish result is too weak, we show the municipality’s, and always say which one. We never present it as the parish’s.',
        },
        {
          show: (decisions.refuse ?? 0) > 0,
          title: pt ? 'Recusar.' : 'Refuse.',
          body: pt
            ? 'Quando nem um nem outro é suportado, não mostramos número nenhum, e a página explica porquê.'
            : 'When neither is supported, we show no figure at all, and the page explains why.',
        },
      ].filter(rule => rule.show);
      return (
        <>
          <p className="mb-5">
            {rules.length > 1
              ? (pt ? 'Para cada pergunta, há uma de três decisões:' : 'For each question, one of these decisions is taken:')
              : (pt ? 'Nesta versão, todas as perguntas são respondidas com os números da própria freguesia:' : 'In this release, every question is answered with the parish’s own figures:')}
          </p>
          <ul className="mb-5 list-disc space-y-1.5 pl-6">
            {rules.map(rule => <li key={rule.title}><strong className="font-bold">{rule.title}</strong> {rule.body}</li>)}
          </ul>
          {suppressed > 0 ? (
            <p className="mb-5">
              {pt
                ? `Dentro de um resultado publicado, uma categoria com menos de ${meta.minimum_cell} pessoas ou agregados gerados aparece como «Suprimido», nunca como zero.`
                : `Within a published result, a category with fewer than ${meta.minimum_cell} generated people or households shows as “Suppressed”, never as zero.`}
            </p>
          ) : (
            <p className="mb-5">
              {pt
                ? 'Nenhuma célula é suprimida. Todas as categorias de uma pergunta aparecem; '
                : 'No cell is suppressed. Every category of a question appears; '}
              {HONESTY.zero[locale]}
            </p>
          )}
        </>
      );
    },
    Novelty: () => (
      <>
        <p className="mb-5">
          {pt ? 'Na auditoria nacional, ' : 'In the national audit, '}
          {NOVELTY[locale]}
          {pt
            ? '. Uma réplica que reutiliza registos da amostra chega a 99,1% das pessoas e 99,9% dos agregados. Não há sinal de inferência de pertença em excesso, nem vantagem na inferência de atributos. A auditoria foi aprovada.'
            : '. A replay that reuses sample records reaches 99.1% of people and 99.9% of households. There is no excess membership-inference signal and no attribute-inference advantage. The audit passed.'}
        </p>
        <p className="mb-5 font-semibold">{ACCIDENTAL_MATCHES[locale]}</p>
      </>
    ),
    Uses: () => (
      <div className="my-6 grid gap-4 font-sans md:grid-cols-2">
        {[
          { title: pt ? 'Serve para' : 'Suitable for', items: INTENDED_USES },
          { title: pt ? 'Não serve para' : 'Not suitable for', items: NON_USES },
        ].map(group => (
          <div key={group.title} className="rounded-2xl border border-line bg-cream p-5">
            <h3 className="mt-0 text-base font-bold text-ink">{group.title}</h3>
            <ul className="mb-0 mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-stone-700">
              {group.items.map(item => <li key={item.en}>{item[locale]}</li>)}
            </ul>
          </div>
        ))}
      </div>
    ),
    Limitations: () => (
      <ol className="my-6 list-decimal space-y-3 pl-6">
        {LIMITATIONS.map(limitation => (
          <li key={limitation.title.en}>
            <strong className="font-bold">{limitation.title[locale]}.</strong> {limitation.body[locale]}
          </li>
        ))}
      </ol>
    ),
    Attribution: () => (
      <blockquote className="my-6 border-l-2 border-ink pl-5 text-[0.95em] text-stone-700">
        <p className="mb-0">{release.attribution[locale]}</p>
      </blockquote>
    ),
    CiteAs: () => <code className="bg-parchment px-1.5 py-0.5 font-mono text-[0.85em] text-ink">{release.attribution.cite_as}</code>,
    ModelCardLink: ({ children }: { children?: ReactNode }) => (
      <a href={POPULATION_DOWNLOADS.modelCard} className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink">{children}</a>
    ),
    ErrataLink: ({ children }: { children?: ReactNode }) => (
      <a href={POPULATION_DOWNLOADS.errata} className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink">{children}</a>
    ),
  };
}
