import type { ReactNode } from 'react';
import type { MDXComponents } from 'mdx/types';
import { Callout } from '@/components/mdx/Callout';
import { QualityBadge } from '@/components/population/QualityBadge';
import { Link } from '@/i18n/routing';
import { POPULATION_DOWNLOADS, POPULATION_ROUTES } from '@/lib/config/population';
import { DIMENSION_LABEL, HONESTY, TIER_COPY, type Locale } from '@/lib/population/labels';
import type { PopulationMeta, PopulationReleaseInfo, PopulationScorecard } from '@/types/population';
import { ACCIDENTAL_MATCHES, INTENDED_USES, LIMITATIONS, NON_USES, NOVELTY, formatCount } from './copy';

const FIELD_LABEL: Record<string, Record<Locale, string>> = {
  ...DIMENSION_LABEL,
  is_institutional: { pt: 'Alojamento coletivo', en: 'Collective living quarters' },
  living_alone: { pt: 'Vive sozinho', en: 'Lives alone' },
  multigenerational: { pt: 'Criança e pessoa de 65+ no agregado', en: 'Child and someone 65+ in the household' },
};

type Kind = 'grouped' | 'derived' | 'flag';

/**
 * The nine fields the site's answers use, in one vocabulary with the column
 * dictionary on /dados: each says which published column it is (or the rule
 * that builds it from published columns, for the three that are not in the
 * download) and whether an INE table in the fit checks it. The producer's
 * response metadata calls the first five "census_calibrated"; the dictionary
 * marks them D, because each is a grouping of a generated field whose table is
 * in the fit. Both are true; this table says so once.
 */
const FIELDS: Array<{ field: string; column: string | null; kind: Kind; rule: Record<Locale, string> }> = [
  { field: 'age_5y', column: 'age_5y (D)', kind: 'grouped', rule: { pt: 'Grupo de 5 anos da idade gerada. A tabela do INE por sexo e grupo de 5 anos entra no ajuste.', en: 'Five-year band of the generated age. INE’s sex × five-year-age table is in the fit.' } },
  { field: 'education_level_coarse5', column: 'education_level_coarse5 (D)', kind: 'grouped', rule: { pt: 'Cinco níveis a partir do código de escolaridade gerado (11 níveis). A tabela de escolaridade entra no ajuste.', en: 'Five levels from the generated education code (11 levels). The education table is in the fit.' } },
  { field: 'employment_status_coarse3', column: 'employment_status_coarse3 (D)', kind: 'grouped', rule: { pt: 'Empregado, desempregado ou inativo, a partir do código gerado (7 categorias). A condição perante o trabalho entra no ajuste.', en: 'Employed, unemployed or inactive, from the generated code (7 categories). Labour-force status is in the fit.' } },
  { field: 'hh_size_bin', column: 'hh_size_bin (D)', kind: 'grouped', rule: { pt: 'O número de pessoas do agregado, com 5 ou mais juntos. A tabela de pessoas por agregado entra no ajuste.', en: 'The household’s number of people, 5 or more together. The household-size table is in the fit.' } },
  { field: 'hh_type_top', column: 'hh_type_top (D)', kind: 'grouped', rule: { pt: 'O número de núcleos familiares, contado a partir das pessoas do agregado. A tabela de núcleos por agregado entra no ajuste.', en: 'The number of family nuclei, counted from the household’s people. The nuclei-per-household table is in the fit.' } },
  { field: 'is_institutional', column: 'is_institutional (flag)', kind: 'flag', rule: { pt: '1 para um alojamento coletivo acrescentado a partir das contagens do INE, 0 para um agregado privado.', en: '1 for a collective living quarter appended from INE’s counts, 0 for a private household.' } },
  { field: 'living_alone', column: null, kind: 'derived', rule: { pt: '«Sim» quando o agregado da pessoa tem uma só pessoa (hh_size = 1). Nenhuma tabela do ajuste o verifica.', en: '“Yes” when the person’s household has one person (hh_size = 1). No table in the fit checks it.' } },
  { field: 'multigenerational', column: null, kind: 'derived', rule: { pt: '«Sim» quando o agregado tem pelo menos uma pessoa com menos de 15 anos (age < 15) e outra com 65 ou mais (age ≥ 65). Nenhuma tabela do ajuste o verifica.', en: '“Yes” when the household has at least one person under 15 (age < 15) and another aged 65 or over (age ≥ 65). No table in the fit checks it.' } },
  { field: 'age_story_band', column: null, kind: 'derived', rule: { pt: 'Menos de 45, 45 a 64, 65 ou mais, a partir da idade (age).', en: 'Under 45, 45 to 64, 65 or over, from age.' } },
];

const KIND_LABEL: Record<Kind, Record<Locale, string>> = {
  grouped: { pt: 'Agrupamento de um campo ajustado', en: 'Grouping of a fitted field' },
  derived: { pt: 'Derivado, fora do ajuste', en: 'Derived, outside the fit' },
  flag: { pt: 'Indicador', en: 'Flag' },
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
    // The history paragraph lives once, on /dados (UXD-24); here, a pointer to it.
    Superseded: () => (
      <Callout kind="context">
        {pt
          ? <>Esta é a versão {meta.release_version}, que substituiu três versões do mesmo dia; a população gerada é a mesma em todas. <Link href={`${POPULATION_ROUTES.data}#versao`} locale={locale} className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink">O que mudou entre elas</Link>.</>
          : <>This is release {meta.release_version}, which replaced three releases of the same day; the generated population is the same in all of them. <Link href={`${POPULATION_ROUTES.data}#versao`} locale={locale} className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink">What changed between them</Link>.</>}
      </Callout>
    ),
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
    ProvenanceFields: () => {
      // Every field the release's responses declare, in this table's order; a field the table does not know yet still shows.
      const declared = Object.keys(meta.provenance.fields ?? {});
      const rows = [
        ...FIELDS.filter(row => declared.includes(row.field)),
        ...declared.filter(field => !FIELDS.some(row => row.field === field)).map(field => ({ field, column: null, kind: null, rule: null })),
      ];
      // A definition list, not a three-column table: on a phone a table hid the rule column behind a sideways scroll.
      return (
        <dl className="my-6 divide-y divide-line border-y border-line font-sans text-sm">
          {rows.map(row => (
            <div key={row.field} className="grid gap-1 py-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4">
              <dt className="text-ink">
                <span className="font-semibold">{FIELD_LABEL[row.field]?.[locale] ?? row.field}</span>
                {row.kind && <span className="block text-xs text-stone-600">{KIND_LABEL[row.kind][locale]}</span>}
              </dt>
              <dd className="leading-relaxed text-stone-700">
                {row.column
                  ? <code className="mr-1.5 text-xs text-ink">{row.column}</code>
                  : <span className="mr-1.5 text-xs font-semibold text-stone-600">{pt ? 'Não é uma coluna:' : 'Not a column:'}</span>}
                {row.rule?.[locale] ?? String(meta.provenance.fields[row.field])}
              </dd>
            </div>
          ))}
        </dl>
      );
    },
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
          {rules.length > 1 ? (
            <>
              <p className="mb-5">{pt ? 'Para cada pergunta, há uma de três decisões:' : 'For each question, one of these decisions is taken:'}</p>
              <ul className="mb-5 list-disc space-y-1.5 pl-6">
                {rules.map(rule => <li key={rule.title}><strong className="font-bold">{rule.title}</strong> {rule.body}</li>)}
              </ul>
            </>
          ) : (
            // One decision only (since v1.0.1): a sentence, not a one-item list.
            <p className="mb-5">
              {pt
                ? 'Nesta versão, todas as perguntas são respondidas com os números da própria freguesia, e a página de cada freguesia diz o seu nível de qualidade.'
                : 'In this release, every question is answered with the parish’s own figures, and each parish page states its quality tier.'}
            </p>
          )}
          {suppressed > 0 ? (
            <p className="mb-5">
              {pt
                ? `Dentro de um resultado publicado, uma categoria com menos de ${meta.minimum_cell} pessoas ou agregados gerados aparece como «Suprimido», nunca como zero.`
                : `Within a published result, a category with fewer than ${meta.minimum_cell} generated people or households shows as “Suppressed”, never as zero.`}
            </p>
          ) : (
            <p className="mb-5">
              {pt
                ? 'Nenhuma célula é suprimida: todas as categorias de uma pergunta aparecem, mesmo as vazias. '
                : 'No cell is suppressed: every category of a question appears, empty ones included. '}
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
            ? '. Uma réplica que reutiliza registos da amostra (a referência SA/CO, que a própria auditoria marca como não pronta para uso) chega a 99,1% das pessoas e 99,9% dos agregados. Não há sinal de inferência de pertença em excesso, nem vantagem na inferência de atributos. A auditoria foi aprovada.'
            : '. A replay that reuses sample records (the SA/CO benchmark, which the audit itself flags as not ready for use) reaches 99.1% of people and 99.9% of households. There is no excess membership-inference signal and no attribute-inference advantage. The audit passed.'}
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
