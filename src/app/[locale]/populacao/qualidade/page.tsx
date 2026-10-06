import { setRequestLocale } from '@/i18n/request-locale';
import { ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Link } from '@/i18n/routing';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { DataCard } from '@/components/viz/DataCard';
import { QualityBadge } from '@/components/population/QualityBadge';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { FitBars } from '@/components/population/quality/FitBars';
import { PopulationUnavailable, Section, StatusItem } from '@/components/population/quality/parts';
import { bandReading } from '@/components/population/quality/band-reading';
import {
  ACCIDENTAL_MATCHES,
  FIT_EXPLAINED,
  FITTED_TABLES,
  GLOSSARY,
  LIMITATIONS,
  PRIVACY_FINDINGS,
  RELEASE_GATES,
  SCORED_ONLY_TABLES,
  SIZE_BAND,
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

/** How to read a parish of each tier: one concrete line each (the shared fact is said once, above the cards). */
const TIER_READING: Record<'A' | 'B' | 'C', { pt: string; en: string }> = {
  A: {
    pt: 'Lê os números como um retrato próximo das tabelas do INE para a freguesia.',
    en: 'Read the figures as a portrait close to INE’s tables for the parish.',
  },
  B: {
    pt: 'Também próximo das tabelas; numa freguesia com menos de 2 000 residentes, o B diz o tamanho, não um ajuste pior.',
    en: 'Also close to the tables; in a parish of under 2,000 residents, B says its size, not a weaker fit.',
  },
  C: {
    pt: 'Com poucas pessoas, uma ou duas mudam uma percentagem: lê com cuidado as categorias pequenas e evita tirar conclusões de uma só.',
    en: 'With few people, one or two shift a share: read the small categories with care and draw no conclusion from one alone.',
  },
};

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
    // Since v1.0.1 every tier answers with its own figures (said once, above the cards): a reading per tier instead.
    return TIER_READING[tier][locale];
  };

  // The size bands against their pre-registered ranges, in the producer's words.
  const bands = scorecard ? bandReading(scorecard, locale) : null;

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
                <details className="group mt-2">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" />
                    {pt ? 'Notas da ficha de avaliação (texto original)' : 'Scorecard notes (original wording)'}
                  </summary>
                  <p className="mb-2">
                    {pt
                      ? 'Escritas para o formato geral da ficha, que prevê várias execuções do modelo. Nesta versão, com uma só execução, não há intervalos; «R=1» quer dizer uma execução, e o estado «ok» quer dizer que a avaliação e a auditoria de privacidade foram aprovadas.'
                      : 'Written for the scorecard’s general format, which expects several model runs. In this release, with a single run, there are no intervals; “R=1” means one run, and the “ok” status means the evaluation and the privacy audit passed.'}
                  </p>
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
              {bands && (bands.reading || bands.notes.length > 0) && (
                <div className="mt-6 max-w-3xl rounded-2xl border border-line bg-cream p-5">
                  <h3 className="text-base font-bold text-ink">{pt ? 'Ficou onde se esperava?' : 'Did it land where expected?'}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-700">
                    {pt
                      ? 'Antes da avaliação nacional, cada classe de tamanho de freguesia tinha um intervalo de erro pré-registado: o erro que se esperava ver. '
                      : 'Before the national evaluation, each parish size band had a pre-registered error range: the error it was expected to show. '}
                    {bands.reading}
                  </p>
                  {bands.notes.length === 1 && bands.notes[0].label === null ? (
                    <p className="mt-2 text-sm leading-relaxed text-stone-700">
                      {pt ? 'Em todas as classes: ' : 'In every band: '}{bands.notes[0].note}
                    </p>
                  ) : (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-700">
                      {bands.notes.map(item => <li key={item.key}><span className="font-semibold text-ink">{item.label}:</span> {item.note}</li>)}
                    </ul>
                  )}
                </div>
              )}
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">
                {pt
                  ? 'Com poucas pessoas, cada uma pesa mais em cada tabela: por isso cada freguesia tem um nível de qualidade, mostrado no topo da sua página.'
                  : 'With few people, each one weighs more in every table: that is why every parish carries a quality tier, shown at the top of its page.'}
              </p>
              <div id="tabelas" className="mt-6 scroll-mt-24 rounded-2xl border border-line bg-cream p-5 md:p-6">
                <h3 className="text-base font-bold text-ink">{pt ? 'Que tabelas foram usadas?' : 'Which tables were used?'}</h3>
                <div className="mt-3 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Usadas no ajuste e avaliadas' : 'Fitted and scored'}</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700">
                      {FITTED_TABLES.map(item => <li key={item.en}>{item[locale]}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Só avaliadas, fora do ajuste' : 'Scored only, not fitted'}</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700">
                      {SCORED_ONLY_TABLES.map(item => <li key={item.en}>{item[locale]}</li>)}
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-stone-700">
                  {pt
                    ? 'A ficha de avaliação publica a mediana só das 12 tabelas de pessoas do gráfico. A «pior tabela» que decide o nível conta também a idade ano a ano, e na maior parte das freguesias é essa a pior: o ficheiro de qualidade traz, para cada freguesia, a pior tabela e o seu erro (worst_constraint).'
                    : 'The scorecard publishes a median only for the 12 person tables in the chart. The “worst table” that decides the tier also counts single-year age, and in most parishes that is the worst one: the quality file gives, for each parish, its worst table and that table’s error (worst_constraint).'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  {pt
                    ? 'Os erros dos gráficos são medidos nas tabelas usadas no ajuste: dizem quão perto o ajuste chegou. A ficha do modelo refere uma verificação independente, com uma tabela de agregados deixada de fora do ajuste, mas não publica o seu erro; quando for publicado, aparece aqui.'
                    : 'The errors in the charts are measured on the tables used in the fit: they say how close the fit came. The model card mentions an independent check, with a household table held out of the fit, but does not publish its error; when it is published, it appears here.'}
                </p>
              </div>
            </Section>

            <Section
              id="niveis"
              title={pt ? 'O que quer dizer qualidade A, B ou C?' : 'What do quality A, B and C mean?'}
              lede={<p>{pt
                ? 'Todas as freguesias são publicadas, e todas respondem com os seus próprios números; a página de cada uma mostra o nível no topo. O nível junta o ajuste às tabelas do INE e o número de residentes, e diz com que cuidado ler os números, mas não esconde nada. As contagens são as da versão publicada.'
                : 'Every parish is published, and every parish answers with its own figures; each parish page shows its tier at the top. The tier combines the fit to INE’s tables and the number of residents, and says how carefully to read the numbers, but it hides nothing. The counts are the published release’s.'}</p>}
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
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">
                {pt ? 'Esta é a versão 1.0.3, que substituiu três versões do mesmo dia. ' : 'This is release 1.0.3, which replaced three releases of the same day. '}
                <Link href={`${POPULATION_ROUTES.data}#versao`} locale={locale} className="font-semibold text-ink underline underline-offset-4">
                  {pt ? 'O que mudou entre elas' : 'What changed between them'}
                </Link>
              </p>
            </Section>

            <Section
              id="glossario"
              title={pt ? 'O que quer dizer cada termo?' : 'What does each term mean?'}
            >
              <dl className="divide-y divide-line border-y border-line">
                {GLOSSARY.map(entry => (
                  <div key={entry.term.en} className="grid gap-2 py-4 md:grid-cols-[240px_1fr]">
                    <dt className="font-bold text-ink">{entry.term[locale]}</dt>
                    <dd className="leading-relaxed text-stone-700">{entry.body[locale]}</dd>
                  </div>
                ))}
              </dl>
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
                ? `Limitações conhecidas da população gerada (a mesma da versão 1.0.0 à ${POPULATION_RELEASE}), declaradas em vez de escondidas. A próxima versão tem um plano para cada uma.`
                : `Known limitations of the generated population (the same from release 1.0.0 to ${POPULATION_RELEASE}), declared rather than hidden. The next release has a plan for each.`}</p>}
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
