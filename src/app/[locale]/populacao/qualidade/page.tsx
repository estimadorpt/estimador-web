import { setRequestLocale } from '@/i18n/request-locale';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { DataCard } from '@/components/viz/DataCard';
import { QualityBadge } from '@/components/population/QualityBadge';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { FitBars } from '@/components/population/quality/FitBars';
import { PopulationUnavailable, Section, StatusItem } from '@/components/population/quality/parts';
import {
  ACCIDENTAL_MATCHES,
  FIT_EXPLAINED,
  LIMITATIONS,
  PRIVACY_FINDINGS,
  RELEASE_GATES,
  SIZE_BAND,
  SUPERSEDED,
  formatCount,
  formatDay,
  formatFit,
} from '@/components/population/quality/copy';
import { POPULATION_DOWNLOADS, POPULATION_PUBLISHED, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import { HONESTY, RECIPE_COPY, TIER_COPY, type Locale } from '@/lib/population/labels';
import { loadPopulationMeta, loadPopulationScorecard } from '@/lib/utils/population-data-loader';
import { createPageMetadata } from '@/lib/metadata';
import type { PortraitRecipe } from '@/types/population';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: POPULATION_ROUTES.quality,
    title: pt ? 'Como sabemos que a população sintética funciona?' : 'How do we know the synthetic population works?',
    description: pt
      ? `Critérios de publicação, ajuste às tabelas do INE por tamanho de freguesia, níveis de qualidade, privacidade e limitações conhecidas da versão ${POPULATION_RELEASE}.`
      : `Release gates, fit to INE’s tables by parish size, quality tiers, privacy and the known limitations of release ${POPULATION_RELEASE}.`,
  });
}

const TIER_PAGE: Record<'A' | 'B' | 'C', { pt: string; en: string }> = {
  A: {
    pt: 'Na página da freguesia, todas as perguntas são respondidas com os números da própria freguesia, e o nível aparece no topo.',
    en: 'On the parish page, every question is answered with the parish’s own figures, and the tier is shown at the top.',
  },
  B: {
    pt: 'Os números são os da própria freguesia, mas os cruzamentos mais finos são recusados:',
    en: 'The figures are the parish’s own, but the finest cross-tabulations are refused:',
  },
  C: {
    pt: 'A página mostra os números do concelho, e diz qual é. Nunca são apresentados como sendo da freguesia.',
    en: 'The page shows the municipality’s figures, and names it. They are never presented as the parish’s.',
  },
};

export default async function PopulationQuality({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = raw === 'en' ? 'en' : 'pt';
  setRequestLocale(locale);
  const pt = locale === 'pt';
  const [scorecard, meta] = await Promise.all([loadPopulationScorecard(), loadPopulationMeta()]);

  // Only A-tier questions: the cross-tabulations a B parish does not get.
  const aOnly = meta
    ? meta.recipe_order.filter(recipe => meta.recipes[recipe]?.minimum_tier === 'A').map(recipe => RECIPE_COPY[recipe as PortraitRecipe].short[locale])
    : [];

  // What a tier means for its parish page, from this release's own decisions:
  // a fallback or a refusal is only described when the release takes one
  // (none has since v1.0.1: every parish answers with its own figures).
  const takesFallback = (meta?.counts.decisions.fallback ?? 0) > 0;
  const tierOnPage = (tier: 'A' | 'B' | 'C'): string => {
    if (tier === 'B' && aOnly.length > 0) return `${TIER_PAGE.B[locale]} ${aOnly.join(', ').toLowerCase()}.`;
    if (tier === 'C' && takesFallback) return TIER_PAGE.C[locale];
    return TIER_PAGE.A[locale];
  };

  const source = pt
    ? `Avaliação da versão ${POPULATION_RELEASE} · Censos 2021 (INE)`
    : `Evaluation of release ${POPULATION_RELEASE} · 2021 Census (INE)`;
  const updated = pt ? `Publicada a ${formatDay(POPULATION_PUBLISHED, locale)}` : `Published ${formatDay(POPULATION_PUBLISHED, locale)}`;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        width="5xl"
        compact
        back={{ href: POPULATION_ROUTES.hub, label: pt ? 'População sintética' : 'Synthetic population', locale }}
        eyebrow={pt ? `População sintética · versão ${POPULATION_RELEASE}` : `Synthetic population · release ${POPULATION_RELEASE}`}
        title={pt ? 'Como sabemos que funciona?' : 'How do we know it works?'}
        lede={pt
          ? 'O que verificámos antes de publicar, quão perto a população gerada fica das tabelas dos Censos, o que fizemos pela privacidade e onde os dados são mais fracos.'
          : 'What we checked before publishing, how close the generated population comes to the Census tables, what we did for privacy, and where the data are weakest.'}
        meta={<><span>{pt ? 'Censos 2021 (INE)' : '2021 Census (INE)'}</span><span>{updated}</span></>}
      />
      <PopulationSectionNav current="quality" locale={locale} />

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 md:py-12">
        {!scorecard || !meta ? (
          <PopulationUnavailable locale={locale} />
        ) : (
          <>
            <p className="max-w-3xl text-sm text-stone-600">{HONESTY.synthetic[locale]}</p>

            <section aria-labelledby="estado-title" className="space-y-6">
              <h2 id="estado-title" className="text-2xl text-ink md:text-[1.75rem]">
                {pt ? 'Esta versão passou nos critérios de publicação?' : 'Did this release pass its gates?'}
              </h2>
              <aside className="max-w-3xl border-l-2 border-amber-500 bg-amber-50 py-4 pl-5 pr-4 text-sm leading-relaxed text-stone-700">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Antes de ler qualquer número' : 'Before reading any figure'}</p>
                <p className="font-semibold text-ink">{scorecard.honesty_notes[2]?.[locale]}</p>
                <p className="mt-1.5">
                  {pt
                    ? 'Na prática: lê cada número por si, sem o ordenar nem o comparar com outro como se a diferença fosse certa.'
                    : 'In practice: read each figure on its own, without ranking it or comparing it with another as if the difference were certain.'}
                </p>
                {/* The scorecard's other notes, verbatim; they are written for the producer's general format (intervals, status codes). */}
                <details className="mt-2">
                  <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-ink">
                    {pt ? 'Notas da ficha de avaliação (texto original)' : 'Scorecard notes (original wording)'}
                  </summary>
                  <ul className="mb-1 list-disc space-y-1 pl-5">
                    {scorecard.honesty_notes.slice(0, 2).map(note => <li key={note.en}>{note[locale]}</li>)}
                  </ul>
                </details>
              </aside>
              <div className="grid gap-4 md:grid-cols-3">
                <StatusItem
                  tone={scorecard.headline.passes_gate && scorecard.status === 'ok' ? 'pass' : 'caveat'}
                  label={pt ? 'Critérios de publicação' : 'Release gates'}
                  value={scorecard.headline.passes_gate && scorecard.status === 'ok' ? (pt ? 'Aprovados' : 'Passed') : (pt ? 'Por confirmar' : 'Not confirmed')}
                >
                  {pt ? 'Decisões que bloqueiam a publicação se falharem.' : 'Fail-closed decisions the release depends on.'}
                </StatusItem>
                <StatusItem
                  tone="caveat"
                  label={pt ? 'Execuções do modelo' : 'Model runs'}
                  value={scorecard.provenance.n_replicates === 1 ? (pt ? 'Uma única execução' : 'A single run') : formatCount(scorecard.provenance.n_replicates, locale)}
                >
                  {pt ? 'Sem amplitude entre execuções: nada aqui é um intervalo, nem uma ordenação.' : 'No across-run range: nothing here is an interval, nor a ranking.'}
                </StatusItem>
                <StatusItem
                  tone={scorecard.privacy.status === 'pass' ? 'pass' : 'caveat'}
                  label={pt ? 'Auditoria de privacidade' : 'Privacy audit'}
                  value={scorecard.privacy.status === 'pass' ? (pt ? 'Aprovada' : 'Passed') : (pt ? 'Por confirmar' : 'Not confirmed')}
                >
                  {pt
                    ? `Auditoria nacional, feita sobre a população da versão 1.0.0, a mesma da versão ${POPULATION_RELEASE}.`
                    : `A national audit, run on the release 1.0.0 population, which release ${POPULATION_RELEASE} keeps unchanged.`}
                </StatusItem>
              </div>
              <div className="rounded-2xl border border-line bg-cream p-5 md:p-6">
                <h3 className="text-lg font-bold text-ink">{pt ? 'Os critérios que decidem a publicação' : 'The gates the release depends on'}</h3>
                <p className="mt-1 text-sm text-stone-500">{pt ? `Da ficha do modelo, versão ${POPULATION_RELEASE}` : `From the model card, release ${POPULATION_RELEASE}`}</p>
                <ul className="mt-4 space-y-2.5">
                  {RELEASE_GATES.map(gate => (
                    <li key={gate.en} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                      <span>{gate[locale]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <Section
              id="ajuste"
              title={pt ? 'Quão perto ficam das tabelas do INE?' : 'How close do they come to INE’s tables?'}
              lede={<p>{FIT_EXPLAINED[locale]}</p>}
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <DataCard
                  title={pt ? 'Erro típico, por tamanho de freguesia' : 'Typical error, by parish size'}
                  subtitle={pt ? 'Mediana por freguesia, 12 tabelas de pessoas' : 'Median per parish, 12 person tables'}
                  source={source}
                  updated={updated}
                  methodologyHref={POPULATION_ROUTES.methodology}
                  methodologyLabel={pt ? 'Metodologia' : 'Methodology'}
                  locale={locale}
                >
                  <FitBars
                    caption={pt ? 'Erro típico face às tabelas do INE, por tamanho de freguesia' : 'Typical error against INE’s tables, by parish size'}
                    columns={[pt ? 'Tamanho' : 'Size', pt ? 'Erro típico' : 'Typical error']}
                    noteColumn={pt ? 'Freguesias' : 'Parishes'}
                    rows={scorecard.strata.map(stratum => ({
                      key: stratum.key,
                      label: SIZE_BAND[stratum.key]?.[locale] ?? (pt ? stratum.label : stratum.label_en),
                      note: pt ? `${formatCount(stratum.n_parishes, locale)} freguesias` : `${formatCount(stratum.n_parishes, locale)} parishes`,
                      value: stratum.person_srmse_median.value,
                      display: formatFit(stratum.person_srmse_median.value, locale),
                    }))}
                  />
                </DataCard>
                <DataCard
                  title={pt ? 'Erro típico, por tabela' : 'Typical error, by table'}
                  subtitle={pt ? 'Mediana por freguesia, nas tabelas usadas para ajustar' : 'Median per parish, over the tables used for fitting'}
                  source={source}
                  updated={updated}
                  methodologyHref={POPULATION_ROUTES.methodology}
                  methodologyLabel={pt ? 'Metodologia' : 'Methodology'}
                  locale={locale}
                >
                  <FitBars
                    caption={pt ? 'Erro típico face às tabelas do INE, por tabela' : 'Typical error against INE’s tables, by table'}
                    columns={[pt ? 'Tabela' : 'Table', pt ? 'Erro típico' : 'Typical error']}
                    rows={scorecard.constraints.map(table => ({
                      key: table.key,
                      label: pt ? table.label : table.label_en,
                      value: table.srmse_median.value,
                      display: formatFit(table.srmse_median.value, locale),
                    }))}
                  />
                </DataCard>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">
                {pt
                  ? 'Com poucas pessoas, cada uma pesa mais em cada tabela: por isso cada freguesia tem um nível de qualidade, mostrado no topo da sua página.'
                  : 'With few people, each one weighs more in every table: that is why every parish carries a quality tier, shown at the top of its page.'}
              </p>
            </Section>

            <Section
              id="niveis"
              title={pt ? 'O que quer dizer qualidade A, B ou C?' : 'What do quality A, B and C mean?'}
              lede={<p>{pt
                ? 'Todas as freguesias são publicadas, e todas respondem com os seus próprios números. Cada uma tem um nível de qualidade: diz quão perto a população gerada fica das tabelas do INE e com que cuidado ler os números, mas não esconde nada. As contagens são as da versão publicada.'
                : 'Every parish is published, and every parish answers with its own figures. Each carries a quality tier: it says how close the generated population sits to INE’s tables and how carefully to read the numbers, but it hides nothing. The counts are the published release’s.'}</p>}
            >
              <div className="grid gap-4 md:grid-cols-3">
                {(['A', 'B', 'C'] as const).map(tier => (
                  <div key={tier} className="flex flex-col rounded-2xl border border-line bg-cream p-5">
                    <QualityBadge kind={tier} locale={locale} className="self-start" />
                    <p className="mt-4 font-display text-3xl font-extrabold tabular-nums text-ink">{formatCount(meta.counts.tiers[tier], locale)}</p>
                    <p className="text-sm text-stone-500">{pt ? 'freguesias' : 'parishes'}</p>
                    <p className="mt-4 text-sm leading-relaxed text-ink">{TIER_COPY[tier].meaning[locale]}</p>
                    <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-stone-600">
                      {tierOnPage(tier)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">
                {pt ? 'Os limiares de cada nível: ' : 'Each tier’s thresholds: '}
                {pt
                  ? 'A, erro típico até 0,10, a pior tabela até 0,18 e 2 000 ou mais residentes; B, até 0,15 e 0,26 com 500 ou mais residentes; C, as restantes. Uma freguesia com menos de 500 residentes fica no nível C.'
                  : 'A, typical error up to 0.10, worst table up to 0.18 and 2,000 or more residents; B, up to 0.15 and 0.26 with 500 or more residents; C, the rest. A parish under 500 residents sits in tier C.'}
              </p>
              {meta.counts.suppressed_cells > 0 ? (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
                  {pt
                    ? `Em qualquer nível, uma categoria com menos de ${meta.minimum_cell} pessoas ou agregados gerados aparece como «Suprimido», nunca como zero.`
                    : `At any tier, a category with fewer than ${meta.minimum_cell} generated people or households shows as “Suppressed”, never as zero.`}
                </p>
              ) : (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">{HONESTY.zero[locale]}</p>
              )}
              <div className="mt-6 max-w-3xl rounded-2xl border border-line bg-cream p-5">
                <h3 className="text-base font-bold text-ink">{pt ? 'Porque é que a versão 1.0.1 substituiu a 1.0.0?' : 'Why did release 1.0.1 replace 1.0.0?'}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">{SUPERSEDED[locale]}</p>
              </div>
            </Section>

            <Section
              id="privacidade"
              title={pt ? 'Estes dados protegem quem respondeu aos Censos?' : 'Do these data protect the people who answered the Census?'}
              lede={<p>{pt
                ? 'Os registos são gerados: não têm nomes nem moradas, e não há uma ligação registo a registo a quem respondeu. A auditoria nacional de privacidade, feita sobre a população publicada, foi aprovada. A amostra de que se fala é o Ficheiro de Uso Público dos Censos 2021, de onde o modelo aprendeu as relações entre atributos.'
                : 'The records are generated: they carry no names or addresses, and there is no record-to-record link to respondents. The national privacy audit, run on the published population, passed. The sample referred to is the Census 2021 Public Use File, from which the model learned how attributes relate.'}</p>}
            >
              <dl className="divide-y divide-line border-y border-line">
                {PRIVACY_FINDINGS.map(finding => (
                  <div key={finding.title.en} className="grid gap-2 py-5 md:grid-cols-[240px_1fr]">
                    <dt className="font-bold text-ink">{finding.title[locale]}</dt>
                    <dd className="leading-relaxed text-stone-700">{finding.body[locale]}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 max-w-3xl leading-relaxed text-ink">
                {pt
                  ? 'Algumas pessoas geradas partilham combinações comuns de atributos com registos da amostra, porque essas combinações são frequentes. '
                  : 'Some generated people share common attribute combinations with sample records, because those combinations are frequent. '}
                <strong>{ACCIDENTAL_MATCHES[locale]}</strong>
              </p>
            </Section>

            <Section
              id="limitacoes"
              title={pt ? 'Onde é que os dados são mais fracos?' : 'Where are the data weakest?'}
              lede={<p>{pt
                ? `Limitações conhecidas da população gerada (a mesma nas versões 1.0.0 e ${POPULATION_RELEASE}), declaradas em vez de escondidas. A próxima versão tem um plano para cada uma.`
                : `Known limitations of the generated population (the same in releases 1.0.0 and ${POPULATION_RELEASE}), declared rather than hidden. The next release has a plan for each.`}</p>}
            >
              <ol className="grid gap-4 md:grid-cols-2">
                {LIMITATIONS.map(limitation => (
                  <li key={limitation.title.en} className="rounded-2xl border border-line bg-cream p-5">
                    <h3 className="text-base font-bold text-ink">{limitation.title[locale]}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-700">{limitation.body[locale]}</p>
                  </li>
                ))}
              </ol>
            </Section>

            <Section
              id="retrodicao"
              title={pt ? 'Acerta no que não viu?' : 'Does it get right what it did not see?'}
            >
              <div className="max-w-3xl rounded-2xl border border-line bg-cream p-5">
                <p className="inline-flex items-center rounded-md bg-parchment px-2 py-1 text-xs font-bold uppercase tracking-wider text-stone-600">
                  {scorecard.retrodiction.status === 'unavailable' ? (pt ? 'Ainda não disponível' : 'Not yet available') : scorecard.retrodiction.status}
                </p>
                <p className="mt-3 leading-relaxed text-stone-700">
                  {pt
                    ? 'Comparar a população gerada com números que o modelo não usou (a retrodição) aguarda um apuramento separado. Quando estiver feito, o resultado aparece aqui; até lá, não há número para mostrar.'
                    : 'Comparing the generated population with figures the model did not use (retrodiction) awaits a separate tabulation. When it is done, the result appears here; until then there is no figure to show.'}
                </p>
              </div>
            </Section>

            <section aria-label={pt ? 'Para saber mais' : 'Further reading'} className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-8">
              <Action href={POPULATION_ROUTES.methodology} locale={locale} arrow>{pt ? 'Como foi feita a população' : 'How the population was made'}</Action>
              <Action external href={POPULATION_DOWNLOADS.modelCard} variant="text" arrow>{pt ? 'Ficha do modelo (GitHub, em inglês)' : 'Model card (GitHub)'}</Action>
              <Action href={POPULATION_ROUTES.data} locale={locale} variant="text" arrow>{pt ? 'Descarregar os dados' : 'Download the data'}</Action>
            </section>
          </>
        )}
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
