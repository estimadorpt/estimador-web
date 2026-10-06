import { setRequestLocale } from '@/i18n/request-locale';
import { Header } from '@/components/Header';
import { Link } from '@/i18n/routing';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { DataCard } from '@/components/viz/DataCard';
import { Disclosure } from '@/components/viz/Disclosure';
import { QualityBadge } from '@/components/population/QualityBadge';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { FitBars } from '@/components/population/quality/FitBars';
import { PopulationUnavailable, Section, StatusItem } from '@/components/population/quality/parts';
import {
  ACCIDENTAL_MATCHES,
  FIT_EXPLAINED,
  FITTED_TABLES,
  GLOSSARY,
  LIMITATIONS,
  REPLACED,
  PRIVACY_FINDINGS,
  RELEASE_GATES,
  SCORED_ONLY_TABLES,
  SIZE_BAND,
  constraintLabel,
  formatCount,
  formatDay,
  formatFit,
} from '@/components/population/quality/copy';
import { POPULATION_DOWNLOADS, POPULATION_PUBLISHED, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import { HONESTY, RECIPE_COPY, TIER_COPY, type Locale } from '@/lib/population/labels';
import { loadPopulationMeta, loadPopulationPlaces, loadPopulationScorecard } from '@/lib/utils/population-data-loader';
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
    // "pode dizer só o tamanho": under 2,000 residents B is not always a size verdict; some of these parishes also miss A's fit (METH3-02, POP3-ACC-03).
    pt: 'Também próximo das tabelas; numa freguesia com menos de 2 000 residentes, o B pode dizer só o tamanho, não um ajuste pior.',
    en: 'Also close to the tables; in a parish of under 2,000 residents, B may reflect only its size, not a weaker fit.',
  },
  C: {
    pt: 'Com poucas pessoas, uma ou duas mudam uma percentagem: lê com cuidado as categorias pequenas e evita tirar conclusões de uma só.',
    en: 'With few people, one or two shift a share: read the small categories with care and draw no conclusion from one alone.',
  },
};

/**
 * Tier C holds two kinds of parish (MR2-03): small ones, C for their size, and
 * 500+ ones, C for their worst table, which in almost all of them is
 * single-year age (705 of 728 in quality.csv `worst_constraint`), or, in a
 * couple, for their typical error alone (POP3-ACC-06). The counts shown are
 * read from places.json (tier and the count the tier uses, publication_population),
 * and the lead says so: the size chart above counts INE's residents, which
 * puts one parish (160707) on the other side of 500 (POP3-ACC-04).
 */
function tierCReadings(small: number, large: number, locale: Locale): Array<{ key: string; lead: string; body: string }> {
  const pt = locale === 'pt';
  return [
    {
      key: 'small',
      lead: pt ? `Menos de 500 na contagem de publicação (${formatCount(small, locale)}):` : `Under 500 on the publication count (${formatCount(small, locale)}):`,
      body: pt
        ? 'são C pelo tamanho. Cada pergunta conta só o seu grupo (por exemplo, quem vive sozinho), que pode ser de poucas pessoas: uma ou duas mudam uma percentagem, e 100% pode ser uma ou duas. O topo da página de cada freguesia diz quantos residentes tem.'
        : 'they are C for their size. Each question counts only its own group (for example, those who live alone), which can be a handful of people: one or two shift a share, and 100% can be one or two. The top of each parish page says how many residents it has.',
    },
    {
      key: 'large',
      lead: pt ? `500 ou mais na contagem de publicação (${formatCount(large, locale)}):` : `500 or more on the publication count (${formatCount(large, locale)}):`,
      body: pt
        ? 'são C pela pior tabela (quase sempre a idade ano a ano) ou, em poucas, pelo erro típico. A idade ano a ano fica fora das 12 tabelas de pessoas do ajuste e as respostas do site não a usam: nessas freguesias, a cautela vale sobretudo para quem usar essa coluna dos microdados. O ficheiro de qualidade diz a pior tabela de cada uma, e a página de cada freguesia diz o que a pôs no nível C.'
        : 'they are C for their worst table (almost always single-year age) or, in a few, for their typical error. Single-year age sits outside the 12 fitted person tables and the site’s answers do not use it: in those parishes the caution applies mostly to anyone using that column of the microdata. The quality file names each one’s worst table, and each parish page says what put it in tier C.',
    },
  ];
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
  const [scorecard, meta, places] = await Promise.all([loadPopulationScorecard(), loadPopulationMeta(), loadPopulationPlaces()]);
  // Tier C by the count the tier uses (places.json publication_population): the two readings in the note under the tier cards.
  const tierC = places?.parishes.filter(row => row[3] === 'C') ?? [];
  const tierCLarge = tierC.filter(row => row[9] >= 500).length;
  const tierCSmall = tierC.length - tierCLarge;

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

  // No band verdict (MR2-02, round-1 M-15): the scorecard's pre-registered
  // ranges were set for an out-of-fit check with the earlier engine, and the
  // errors on this page are in-sample, so `band_reading`, `band_position` and
  // the strata notes are never rendered.

  const source = pt
    ? `Avaliação da versão ${POPULATION_RELEASE} · Censos 2021 (INE)`
    : `Evaluation of release ${POPULATION_RELEASE} · 2021 Census (INE)`;
  // The release's own date ("datada de", as on /dados); GitHub's upload day is said only there (FR3-09).
  const updated = pt ? `Versão de ${formatDay(POPULATION_PUBLISHED, locale)}` : `Release dated ${formatDay(POPULATION_PUBLISHED, locale)}`;
  // One scale for the two fit charts, so equal bars mean equal errors side by side (METH3-08).
  const fitValues = scorecard
    ? [...scorecard.strata.map(stratum => stratum.person_srmse_median.value), ...scorecard.constraints.map(table => table.srmse_median.value)]
    : [];
  const fitTop = Math.max(...fitValues, 0.0001);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="wide"
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

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-12"><div className="max-w-5xl space-y-12">
        {!scorecard || !meta ? (
          <PopulationUnavailable locale={locale} />
        ) : (
          <>
            <p className="max-w-3xl text-sm text-stone-600">{HONESTY.synthetic[locale]}</p>

            <section aria-labelledby="estado-title" className="space-y-6">
              <h2 id="estado-title" className="text-2xl text-ink md:text-[1.75rem]">
                {pt ? 'Esta versão passou nos critérios de publicação?' : 'Did this release pass its gates?'}
              </h2>
              <div role="note" className="max-w-3xl border-l-2 border-amber-500 bg-amber-50 py-4 pl-5 pr-4 text-sm leading-relaxed text-stone-700">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Antes de ler qualquer número' : 'Before reading any figure'}</p>
                <p className="font-semibold text-ink">{scorecard.honesty_notes[2]?.[locale]}</p>
                <p className="mt-1.5">
                  {pt
                    ? 'Na prática: lê cada número por si, sem o ordenar nem o comparar com outro como se a diferença fosse certa.'
                    : 'In practice: read each figure on its own, without ranking it or comparing it with another as if the difference were certain.'}
                </p>
                {/* The scorecard's other notes, verbatim; they are written for the producer's general format (intervals, status codes). */}
                <Disclosure className="mt-2" summary={pt ? 'Notas da ficha de avaliação (texto original)' : 'Scorecard notes (original wording)'}>
                  <p className="mb-2">
                    {pt
                      ? 'Escritas para o formato geral da ficha, que prevê várias execuções do modelo. Nesta versão, com uma só execução, não há intervalos; «R=1» quer dizer uma execução, e o estado «ok» quer dizer que a avaliação e a auditoria de privacidade foram aprovadas.'
                      : 'Written for the scorecard’s general format, which expects several model runs. In this release, with a single run, there are no intervals; “R=1” means one run, and the “ok” status means the evaluation and the privacy audit passed.'}
                  </p>
                  <ul className="mb-1 list-disc space-y-1 pl-5">
                    {scorecard.honesty_notes.slice(0, 2).map(note => <li key={note.en}>{note[locale]}</li>)}
                  </ul>
                </Disclosure>
              </div>
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
              {/* Stacked, each at its own height: 4 bars beside 12 left the shorter card
                  stretched around a blank band. One above the other, the two share the
                  card width, so the same bar length is the same error in both. */}
              <div className="grid gap-6">
                <DataCard
                  title={pt ? 'Erro do ajuste, por tamanho de freguesia' : 'Fit error, by parish size'}
                  subtitle={pt ? 'Mediana entre freguesias, todas as células das 12 tabelas de pessoas; classes pelos residentes do INE; mesma escala do gráfico abaixo' : 'Median across parishes, all cells of the 12 person tables; bands by INE’s residents; same scale as the chart below'}
                  source={source}
                  updated={updated}
                  methodologyHref={POPULATION_ROUTES.methodology}
                  methodologyLabel={pt ? 'Metodologia' : 'Methodology'}
                  locale={locale}
                >
                  <FitBars
                    caption={pt ? 'Erro do ajuste face às tabelas do INE, por tamanho de freguesia' : 'Fit error against INE’s tables, by parish size'}
                    columns={[pt ? 'Tamanho' : 'Size', pt ? 'Erro do ajuste' : 'Fit error']}
                    noteColumn={pt ? 'Freguesias' : 'Parishes'}
                    max={fitTop}
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
                  subtitle={pt ? 'Mediana entre freguesias do erro de cada uma das 12 tabelas de pessoas usadas no ajuste (as de agregados não têm mediana publicada); mesma escala do gráfico acima' : 'Median across parishes of the error of each of the 12 fitted person tables (the household tables have no published median); same scale as the chart above'}
                  source={source}
                  updated={updated}
                  methodologyHref={POPULATION_ROUTES.methodology}
                  methodologyLabel={pt ? 'Metodologia' : 'Methodology'}
                  locale={locale}
                >
                  <FitBars
                    caption={pt ? 'Erro típico face às tabelas do INE, por tabela' : 'Typical error against INE’s tables, by table'}
                    columns={[pt ? 'Tabela' : 'Table', pt ? 'Erro típico' : 'Typical error']}
                    max={fitTop}
                    rows={scorecard.constraints.map(table => ({
                      key: table.key,
                      label: constraintLabel(table.key, { pt: table.label, en: table.label_en }, locale),
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
              <div id="tabelas" className="mt-6 rounded-2xl border border-line bg-cream p-5 md:p-6">
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
                    ? 'A ficha de avaliação publica a mediana só das 12 tabelas de pessoas do gráfico. A idade ano a ano também é medida e entra na «pior tabela» que decide o nível (na maior parte das freguesias, é essa a pior), mas não é uma das 21 tabelas da cobertura nem das 12 tabelas de pessoas do ajuste. O ficheiro de qualidade traz, para cada freguesia, a pior tabela e o seu erro (worst_constraint); a página de dados diz que tabela é cada código.'
                    : 'The scorecard publishes a median only for the 12 person tables in the chart. Single-year age is also measured and counts towards the “worst table” that decides the tier (in most parishes it is the worst one), but it is not one of the 21 coverage tables nor of the 12 fitted person tables. The quality file gives, for each parish, its worst table and that table’s error (worst_constraint); the data page says which table each code is.'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  {pt
                    ? <>Os erros dos gráficos são medidos nas tabelas usadas no ajuste: dizem quão perto o ajuste chegou. A ficha do modelo refere uma verificação independente, com uma tabela de agregados deixada de fora do ajuste, mas não publica o seu erro (ver <a href="#retrodicao" className="font-semibold text-ink underline underline-offset-4">«Acerta no que não viu?»</a>).</>
                    : <>The errors in the charts are measured on the tables used in the fit: they say how close the fit came. The model card mentions an independent check, with a household table held out of the fit, but does not publish its error (see <a href="#retrodicao" className="font-semibold text-ink underline underline-offset-4">“Does it get right what it did not see?”</a>).</>}
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
              {/* The three cards hold the same four rows (badge, count, meaning, reading),
                  on one subgrid from lg, so their hairlines line up and they end together;
                  tier C's two size readings follow as one note under the row, instead of
                  making card C twice as tall as A and B. C's meaning is twice as long as
                  A's, so its column is wider: with equal thirds, A ended in a 50px band. */}
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr] lg:gap-y-0">
                {(['A', 'B', 'C'] as const).map(tier => (
                  <div key={tier} className="flex flex-col rounded-2xl border border-line bg-cream p-5 lg:row-span-4 lg:grid lg:grid-rows-subgrid">
                    <QualityBadge kind={tier} locale={locale} className="self-start justify-self-start" />
                    <div className="mt-4">
                      <p className="font-display text-3xl font-extrabold tabular-nums text-ink">{formatCount(meta.counts.tiers[tier], locale)}</p>
                      <p className="text-sm text-stone-500">{pt ? 'freguesias' : 'parishes'}</p>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-ink">{TIER_COPY[tier].meaning[locale]}</p>
                    <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-stone-600">
                      {tierOnPage(tier)}
                    </p>
                  </div>
                ))}
              </div>
              {!takesFallback && places && (
                <div className="mt-4 rounded-2xl bg-parchment p-5">
                  <QualityBadge kind="C" locale={locale} />
                  <ul className="mt-3 grid gap-x-8 gap-y-3 text-sm leading-relaxed text-stone-600 md:grid-cols-2">
                    {tierCReadings(tierCSmall, tierCLarge, locale).map(reading => (
                      <li key={reading.key}><span className="font-semibold text-ink">{reading.lead}</span> {reading.body}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">
                {pt ? 'Os limiares de cada nível: ' : 'Each tier’s thresholds: '}
                {pt
                  ? 'A, erro típico até 0,10, a pior tabela até 0,18 e 2 000 ou mais residentes; B, até 0,15 e 0,26 com 500 ou mais residentes; C, as restantes. Uma freguesia com menos de 500 residentes fica no nível C. Os limiares de 500 e 2 000 usam a contagem de publicação, a menor entre os residentes do INE e as pessoas geradas: uma freguesia em que o INE contou 500 pessoas pode ficar abaixo de 500 nessa contagem.'
                  : 'A, typical error up to 0.10, worst table up to 0.18 and 2,000 or more residents; B, up to 0.15 and 0.26 with 500 or more residents; C, the rest. A parish under 500 residents sits in tier C. The 500 and 2,000 thresholds use the publication count, the smaller of INE’s residents and the generated people: a parish where INE counted 500 people can fall below 500 on that count.'}
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
                {REPLACED[locale]}{' '}
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
                <strong>{ACCIDENTAL_MATCHES[locale]}</strong>
              </p>
            </Section>

            <Section
              id="limitacoes"
              title={pt ? 'Onde é que os dados são mais fracos?' : 'Where are the data weakest?'}
              lede={<p>{pt
                ? <>Limitações conhecidas da população gerada (a mesma da versão 1.0.0 à {POPULATION_RELEASE}), declaradas em vez de escondidas. A <a href={POPULATION_DOWNLOADS.modelCard} className="font-semibold text-ink underline underline-offset-4">ficha do modelo</a> remete o plano para as resolver para a próxima versão (a 1.1, uma versão corrigida da população sintética de 2021); cada correção fica registada nas <a href={POPULATION_DOWNLOADS.errata} className="font-semibold text-ink underline underline-offset-4">erratas</a>.</>
                : <>Known limitations of the generated population (the same from release 1.0.0 to {POPULATION_RELEASE}), declared rather than hidden. The <a href={POPULATION_DOWNLOADS.modelCard} className="font-semibold text-ink underline underline-offset-4">model card</a> leaves the plan to remove them to the next release (1.1, a corrected synthetic population for 2021); every correction is recorded in the <a href={POPULATION_DOWNLOADS.errata} className="font-semibold text-ink underline underline-offset-4">errata</a>.</>}</p>}
            >
              <ol className="grid gap-4 md:grid-cols-2">
                {LIMITATIONS.map(limitation => (
                  <li key={limitation.title.en} className="rounded-2xl border border-line bg-cream p-5">
                    <h3 className="text-base font-bold text-ink">{limitation.title[locale]}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-700">{limitation.body[locale]}</p>
                  </li>
                ))}
              </ol>
              {/* The out-of-fit check is not published yet: one paragraph here, not an empty section (FRESH-13). */}
              <div id="retrodicao" className="mt-6 max-w-3xl text-sm leading-relaxed text-stone-700">
                <h3 className="text-base font-bold text-ink">{pt ? 'Acerta no que não viu?' : 'Does it get right what it did not see?'}</h3>
                <p className="mt-2">
                  {scorecard.retrodiction.status === 'unavailable'
                    ? (pt
                      ? 'Ainda não se sabe: comparar a população gerada com números que o modelo não usou (a retrodição) aguarda um apuramento separado, e a ficha de avaliação marca-a como «ainda não disponível». Quando for feita, sai com uma versão nova da população.'
                      : 'Not yet known: comparing the generated population with figures the model did not use (retrodiction) awaits a separate tabulation, and the scorecard marks it “not yet available”. When it is done, it comes with a new release of the population.')
                    : (pt ? `Estado na ficha de avaliação: ${scorecard.retrodiction.status}.` : `Status in the scorecard: ${scorecard.retrodiction.status}.`)}
                </p>
                <p className="mt-2">
                  {pt
                    ? 'Antes de gerar esta população, o produtor registou intervalos de erro para essa verificação fora do ajuste, com o motor anterior. Os erros desta página são medidos nas tabelas do ajuste, por isso não se comparam com esses intervalos, e a página não diz se ficaram «dentro» ou «abaixo» deles.'
                    : 'Before generating this population, the producer registered error ranges for that out-of-fit check, with the earlier engine. The errors on this page are measured on the fitted tables, so they do not compare with those ranges, and the page does not say whether they landed “inside” or “below” them.'}
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
      </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
