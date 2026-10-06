import { setRequestLocale } from '@/i18n/request-locale';
import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { QualityBadge } from '@/components/population/QualityBadge';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { PopulationUnavailable, Section } from '@/components/population/quality/parts';
import { INTENDED_USES, NON_USES, SUPERSEDED, formatCount, formatDay } from '@/components/population/quality/copy';
import { ColumnDictionary, PROVENANCE_CODES } from '@/components/population/data/ColumnDictionary';
import { CopyButton } from '@/components/population/data/CopyButton';
import { formatBytes } from '@/components/population/data/format';
import { POPULATION_DOWNLOADS, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import { HONESTY, type Locale } from '@/lib/population/labels';
import { loadPopulationMeta, loadPopulationRelease } from '@/lib/utils/population-data-loader';
import { createPageMetadata } from '@/lib/metadata';
import { jsonLdScript, populationDatasetJsonLd } from '@/lib/population/structured-data';
import { ChevronRight } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: POPULATION_ROUTES.data,
    title: pt ? 'Posso usar os dados da população sintética?' : 'Can I use the synthetic population data?',
    description: pt
      ? `Descarregar a População Sintética de Portugal v${POPULATION_RELEASE}: licença CC BY 4.0, unidades, geografia, dicionário de colunas, qualidade, verificação e citação.`
      : `Download the Synthetic Population of Portugal v${POPULATION_RELEASE}: CC BY 4.0 licence, units, geography, column dictionary, quality, verification and citation.`,
  });
}

const FILE_COPY: Record<string, { pt: string; en: string }> = {
  package: {
    pt: 'Pacote completo: microdados por distrito e nacionais, qualidade, metadados, documentação e somas de verificação.',
    en: 'Full package: district and national microdata, quality, metadata, documentation and checksums.',
  },
  persons: { pt: 'Pessoas, ficheiro nacional (Parquet).', en: 'Persons, national file (Parquet).' },
  households: { pt: 'Agregados, ficheiro nacional (Parquet).', en: 'Households, national file (Parquet).' },
  quality: { pt: 'Qualidade: uma linha por freguesia (CSV).', en: 'Quality: one row per parish (CSV).' },
  metadata: {
    pt: 'Metadados: dicionário de colunas, mapas de códigos e proveniência (JSON).',
    en: 'Metadata: column dictionary, code label maps and provenance (JSON).',
  },
  checksums: { pt: 'Somas SHA-256 de cada ficheiro do pacote.', en: 'SHA-256 sums of every file in the package.' },
  sums: { pt: 'Somas SHA-256 dos ficheiros publicados na versão.', en: 'SHA-256 sums of the files published with the release.' },
};

type QualitySource = 'ine' | 'generated' | 'evaluation' | 'geographic' | 'release';

const QUALITY_SOURCE: Record<QualitySource, { pt: string; en: string }> = {
  ine: { pt: 'INE', en: 'INE' },
  generated: { pt: 'Gerado', en: 'Generated' },
  evaluation: { pt: 'Avaliação', en: 'Evaluation' },
  geographic: { pt: 'Geográfico', en: 'Geographic' },
  release: { pt: 'Versão', en: 'Release' },
};

/** quality.csv, column by column (pt-synthpop package; the producer's packager writes it). */
const QUALITY_COLUMNS: Array<{ name: string; source: QualitySource; meaning: { pt: string; en: string } }> = [
  { name: 'freguesia', source: 'geographic', meaning: { pt: 'Código DICOFRE da freguesia (6 caracteres, CAOP 2021). Lê-o como texto.', en: 'Parish DICOFRE code (6 characters, CAOP 2021). Read it as text.' } },
  { name: 'freguesia_name', source: 'geographic', meaning: { pt: 'Nome da freguesia, em maiúsculas.', en: 'Parish name, in capitals.' } },
  { name: 'municipio, municipio_name', source: 'geographic', meaning: { pt: 'Código do concelho (DDCC00) e nome segundo o INE (2021).', en: 'Municipality code (DDCC00) and INE’s (2021) name.' } },
  { name: 'district, nuts2', source: 'geographic', meaning: { pt: 'Distrito (2 dígitos) e região NUTS II de 2013 (corrigida na 1.0.3).', en: 'District (2 digits) and 2013 NUTS II region (corrected in 1.0.3).' } },
  { name: 'population', source: 'generated', meaning: { pt: 'Pessoas geradas na freguesia, incluindo quem vive em alojamentos coletivos. Somadas, dão as pessoas da versão.', en: 'People generated in the parish, residents of collective quarters included. Summed, they give the release’s persons.' } },
  { name: 'census_population', source: 'ine', meaning: { pt: 'Residentes segundo o INE (o total da tabela por sexo e idade dos Censos 2021). É a contagem que o site mostra como «residentes (INE)».', en: 'Residents according to INE (the total of the 2021 Census sex × age table). It is the count the site shows as “residents (INE)”.' } },
  { name: 'publication_population', source: 'evaluation', meaning: { pt: 'A menor das duas contagens anteriores: é a que decide os limiares de 500 e 2 000 residentes dos níveis. population e census_population não coincidem em todas as freguesias (a população gerada não reproduz exatamente o total do INE); o pacote não regista a razão freguesia a freguesia.', en: 'The smaller of the two counts above: it decides the tiers’ 500 and 2,000-resident thresholds. population and census_population do not agree in every parish (the generated population does not reproduce INE’s total exactly); the package does not record the reason parish by parish.' } },
  { name: 'n_households', source: 'generated', meaning: { pt: 'Agregados gerados, contando cada alojamento coletivo como um. Não é a contagem de agregados privados do INE.', en: 'Generated households, counting each collective living quarter as one. It is not INE’s count of private households.' } },
  { name: 'n_institutional_persons', source: 'generated', meaning: { pt: 'Pessoas em alojamentos coletivos, acrescentadas a partir das contagens do INE.', en: 'People in collective living quarters, appended from INE’s counts.' } },
  { name: 'pct_children_u15', source: 'generated', meaning: { pt: 'Proporção (de 0 a 1) de pessoas geradas com menos de 15 anos.', en: 'Share (from 0 to 1) of generated people under 15.' } },
  { name: 'quality_tier', source: 'evaluation', meaning: { pt: 'Nível de qualidade: A, B ou C.', en: 'Quality tier: A, B or C.' } },
  { name: 'person_srmse_median', source: 'evaluation', meaning: { pt: 'Erro típico da freguesia: a mediana do SRMSE nas 12 tabelas de pessoas do ajuste (0 seria igual às tabelas).', en: 'The parish’s typical error: the median SRMSE over the 12 fitted person tables (0 would match the tables).' } },
  { name: 'worst_constraint, worst_constraint_srmse', source: 'evaluation', meaning: { pt: 'A tabela de pessoas com o maior erro e esse erro (o segundo critério dos níveis). Na maior parte das freguesias é a idade ano a ano (srmse_p_age_single).', en: 'The person table with the largest error, and that error (the tiers’ second criterion). In most parishes it is single-year age (srmse_p_age_single).' } },
  { name: 'suppression_reason', source: 'release', meaning: { pt: 'Vazio em todas as freguesias: nenhuma é suprimida.', en: 'Empty for every parish: none is suppressed.' } },
  { name: 'fallback_geography', source: 'release', meaning: { pt: 'Nas freguesias de nível C, o código do concelho, para quem preferir agregar ao concelho. O site não o usa: todas as freguesias respondem com os seus próprios números.', en: 'For tier C parishes, the municipality code, for readers who prefer to aggregate to it. The site does not use it: every parish answers with its own figures.' } },
  { name: 'engine, model_version, run_date', source: 'release', meaning: { pt: 'O motor, a versão do modelo e a data da execução.', en: 'The engine, the model version and the run date.' } },
];

function Code({ children, label }: { children: string; label: string }) {
  return (
    // A scrollable region: focusable so a keyboard can scroll it, and named so a screen reader says what it holds.
    <pre role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-xl border border-line bg-parchment p-4 font-mono text-[13px] leading-relaxed text-ink">
      <code>{children}</code>
    </pre>
  );
}

function Facts({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-4 md:grid-cols-[220px_1fr] md:gap-4">
          <dt className="font-bold text-ink">{label}</dt>
          <dd className="leading-relaxed text-stone-700">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const link = 'font-semibold text-ink underline underline-offset-4';

export default async function PopulationData({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = raw === 'en' ? 'en' : 'pt';
  setRequestLocale(locale);
  const pt = locale === 'pt';
  const [release, meta] = await Promise.all([loadPopulationRelease(), loadPopulationMeta()]);
  const pkg = POPULATION_DOWNLOADS.files.find(file => file.key === 'package');
  const personsFile = `pt-synthpop-v${POPULATION_RELEASE}-persons.parquet`;
  const householdsFile = `pt-synthpop-v${POPULATION_RELEASE}-households.parquet`;
  // Pinned to the release's tag, like the model card and the errata.
  const citationUrl = `${POPULATION_DOWNLOADS.repository}/blob/v${POPULATION_RELEASE}/CITATION.cff`;
  // The release's cite line with a versioned locator (the release tag page).
  const citeWithLocator = release ? `${release.attribution.cite_as} ${POPULATION_DOWNLOADS.release}` : '';

  const duckdb = `-- DuckDB: ${pt ? 'pessoas por tamanho do agregado, numa freguesia' : 'persons by household size, in one parish'}
SELECT h.hh_size_bin, count(*) AS ${pt ? 'pessoas' : 'persons'}
FROM '${personsFile}' AS p
JOIN '${householdsFile}' AS h
  USING (freguesia, synthetic_hh_id)
WHERE p.freguesia = '060318'
GROUP BY h.hh_size_bin
ORDER BY h.hh_size_bin;`;

  const python = `# Python (pandas + pyarrow)
import pandas as pd

persons = pd.read_parquet("${personsFile}")
households = pd.read_parquet("${householdsFile}")

# ${pt ? 'synthetic_hh_id só é único dentro de cada freguesia' : 'synthetic_hh_id is unique only within a parish'}
merged = persons.merge(
    households, on=["freguesia", "synthetic_hh_id"], suffixes=("", "_hh")
)`;

  const verify = `# ${pt ? '1. Os ficheiros descarregados, contra SHA256SUMS' : '1. The downloaded files, against SHA256SUMS'}
sha256sum -c SHA256SUMS --ignore-missing

# ${pt ? '2. O conteúdo do pacote, na pasta que contém checksums.sha256' : '2. The package contents, in the folder holding checksums.sha256'}
sha256sum -c checksums.sha256

# ${pt ? '3. A lista de somas é a publicada: deve imprimir' : '3. The list of sums is the published one: it should print'}
# ${release?.checksums_sha256 ?? ''}
sha256sum checksums.sha256`;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        width="5xl"
        compact
        back={{ href: POPULATION_ROUTES.hub, label: pt ? 'População sintética' : 'Synthetic population', locale }}
        eyebrow={pt ? `População sintética · dados · versão ${POPULATION_RELEASE}` : `Synthetic population · data · release ${POPULATION_RELEASE}`}
        title={pt ? 'Posso usar estes dados?' : 'Can I use these data?'}
        lede={pt
          ? 'Os microdados completos estão publicados, com licença aberta. Esta página diz o que contêm, para que servem e para que não servem, como verificar os ficheiros e como citar.'
          : 'The full microdata are published under an open licence. This page says what they contain, what they are and are not for, how to verify the files and how to cite them.'}
        actions={pkg && <Action external href={pkg.url} arrow>{pt ? 'Descarregar o pacote completo' : 'Download the full package'}</Action>}
        meta={pkg && <span>{pkg.name} · {formatBytes(pkg.bytes, locale)} · GitHub</span>}
      />
      <PopulationSectionNav current="data" locale={locale} />
      {release && (
        // schema.org Dataset, so dataset search can list the release.
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(populationDatasetJsonLd(release, locale)) }} />
      )}

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 md:py-12">
        {!release || !meta ? (
          <PopulationUnavailable locale={locale} />
        ) : (
          <>
            <Section id="versao" title={pt ? 'Que versão é esta?' : 'Which release is this?'}>
              <Facts rows={[
                [pt ? 'Versão' : 'Release', <>{release.name} {release.version}, {pt ? 'publicada a' : 'published'} {formatDay(release.published, locale)}</>],
                [pt ? 'Ano de referência' : 'Reference year', pt ? '2021: gerada a partir dos Censos 2021 do INE.' : '2021: generated from INE’s 2021 Census.'],
                [pt ? 'Modelo' : 'Model', <><span>{pt ? 'Motor' : 'Engine'} {release.engine}, {pt ? 'uma única execução' : 'a single run'}. </span><span className="break-all font-mono text-[13px]">sha256 {release.model_sha256}</span></>],
                [pt ? 'Código' : 'Code', <span key="c" className="font-mono text-[13px]">{release.code_commit.slice(0, 7)}</span>],
                [pt ? 'Versões anteriores' : 'Previous releases', <>
                  {pt ? 'A 1.0.3 substituiu três versões do mesmo dia; a população gerada é a mesma em todas. ' : '1.0.3 replaced three releases of the same day; the generated population is the same in all of them. '}
                  {/* The history, said once on the site (UXD-24): the other trust pages link here. */}
                  <details className="group mt-2">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" />
                      {pt ? 'O que mudou entre as versões' : 'What changed between releases'}
                    </summary>
                    <p className="mt-1">
                      {SUPERSEDED[locale]}{' '}
                      {pt
                        ? <>Os ficheiros das versões 1.0.0 e 1.0.1 continuam no GitHub, como registo, na <a className={link} href={POPULATION_DOWNLOADS.releases}>lista de versões</a>; a 1.0.2 não chegou a ser publicada lá.</>
                        : <>The files of releases 1.0.0 and 1.0.1 stay on GitHub, as a record, in the <a className={link} href={POPULATION_DOWNLOADS.releases}>list of releases</a>; 1.0.2 was never published there.</>}
                    </p>
                  </details>
                </>],
              ]} />
            </Section>

            <Section
              id="licenca"
              title={pt ? 'Posso usar e partilhar?' : 'May I use and share them?'}
              lede={<p>{pt
                ? <>Sim. Os dados são publicados com a licença <a className={link} href="https://creativecommons.org/licenses/by/4.0/deed.pt">CC BY 4.0</a>: podes usá-los, transformá-los e redistribuí-los, incluindo para fins comerciais, desde que incluas a atribuição indicada mais abaixo. Não são microdados oficiais do INE.</>
                : <>Yes. The data are published under the <a className={link} href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> licence: you may use, adapt and redistribute them, including commercially, as long as you include the attribution given below. They are not official INE microdata.</>}</p>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: pt ? 'Serve para…' : 'Suitable for…', items: INTENDED_USES },
                  { title: pt ? 'Não serve para…' : 'Not suitable for…', items: NON_USES },
                ].map(group => (
                  <div key={group.title} className="rounded-2xl border border-line bg-cream p-5">
                    <h3 className="text-base font-bold text-ink">{group.title}</h3>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-stone-700">
                      {group.items.map(item => <li key={item.en}>{item[locale]}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-5 max-w-3xl leading-relaxed text-ink">
                {pt
                  ? 'Se, depois de ler esta página, concluíres que estes dados não servem o teu estudo, a visita valeu na mesma: é melhor saber agora do que depois de tirar conclusões.'
                  : 'If, after reading this page, you conclude that these data do not suit your study, the visit was still worth it: better to know now than after drawing conclusions.'}
              </p>
            </Section>

            <Section id="unidades" title={pt ? 'O que é cada linha?' : 'What is each row?'} lede={<p>{HONESTY.synthetic[locale]}</p>}>
              <Facts rows={[
                [pt ? 'Pessoas' : 'Persons', pt
                  ? `${formatCount(release.counts.persons, locale)} linhas, uma por pessoa gerada, incluindo quem vive em alojamentos coletivos (is_institutional = 1, registos parciais).`
                  : `${formatCount(release.counts.persons, locale)} rows, one per generated person, including residents of collective quarters (is_institutional = 1, partial records).`],
                [pt ? 'Agregados' : 'Households', pt
                  ? `${formatCount(release.counts.households, locale)} linhas, uma por agregado gerado. Cada alojamento coletivo conta como um agregado (is_institutional = 1). As perguntas do site sobre agregados contam só os agregados privados (is_institutional = 0).`
                  : `${formatCount(release.counts.households, locale)} rows, one per generated household. Each collective living quarter counts as one household (is_institutional = 1). The site’s household questions count private households only (is_institutional = 0).`],
                [pt ? 'Ligação' : 'Join', pt
                  ? 'Pessoas e agregados ligam-se por (freguesia, synthetic_hh_id): o identificador do agregado só é único dentro de cada freguesia.'
                  : 'Persons and households join on (freguesia, synthetic_hh_id): the household id is unique only within a parish.'],
              ]} />
            </Section>

            <Section id="geografia" title={pt ? 'Que geografia cobre?' : 'What geography does it cover?'}>
              <Facts rows={[
                [pt ? 'Freguesias' : 'Parishes', pt
                  ? `${formatCount(release.counts.parishes_published, locale)} freguesias publicadas, nenhuma suprimida pelo tamanho. As pequenas levam um nível de qualidade em vez de serem retiradas.`
                  : `${formatCount(release.counts.parishes_published, locale)} parishes published, none suppressed for size. Small ones carry a quality tier instead of being withheld.`],
                [pt ? 'Códigos' : 'Codes', pt
                  ? 'Códigos DICOFRE de 6 caracteres da CAOP 2021 (as freguesias dos Censos 2021). Oito códigos de Barcelos têm letras (0302FA a 0302FH): lê a coluna como texto, não como número. No pacote, os nomes dos concelhos vêm da geografia dos Censos 2021 do INE; o site usa os da CAOP 2021. Junta tabelas pelo código (municipio), nunca pelo nome: há nomes de concelho repetidos (Calheta, Lagoa).'
                  : '6-character DICOFRE codes from CAOP 2021 (the 2021 Census parishes). Eight Barcelos codes contain letters (0302FA to 0302FH): read the column as text, not as a number. In the package, municipality names come from INE’s 2021 Census geography; the site uses CAOP 2021’s. Join tables on the code (municipio), never on the name: some municipality names repeat (Calheta, Lagoa).'],
                [pt ? 'Regiões' : 'Regions', pt
                  ? 'A coluna nuts2 é a região NUTS II (2013) da freguesia. Até à versão 1.0.2 era um agrupamento por distrito; a 1.0.3 corrigiu-a (ver as erratas).'
                  : 'The nuts2 column is the parish’s NUTS II (2013) region. Up to release 1.0.2 it was a district grouping; 1.0.3 corrected it (see the errata).'],
                [pt ? 'Concelhos' : 'Municipalities', pt
                  ? `${formatCount(meta.counts.municipalities, locale)} concelhos, com o código no formato DDCC00.`
                  : `${formatCount(meta.counts.municipalities, locale)} municipalities, coded as DDCC00.`],
                [pt ? 'Partição' : 'Partitioning', pt
                  ? 'No pacote, os microdados estão divididos por distrito (os dois primeiros dígitos do código da freguesia), com uma cópia nacional consolidada.'
                  : 'In the package the microdata are partitioned by district (the first two digits of the parish code), with a consolidated national copy.'],
              ]} />
            </Section>

            <Section id="descarregar" title={pt ? 'Onde descarrego?' : 'Where do I download them?'} lede={<p>{pt
              ? <>Os ficheiros estão numa <a className={link} href={POPULATION_DOWNLOADS.release}>versão publicada no GitHub</a>, num repositório público de dados.</>
              : <>The files are in a <a className={link} href={POPULATION_DOWNLOADS.release}>release published on GitHub</a>, in a public data repository.</>}</p>}>
              <div className="overflow-x-auto rounded-2xl border border-line bg-cream">
                <table className="min-w-full border-collapse text-sm">
                  <caption className="sr-only">{pt ? 'Ficheiros da versão' : 'Release files'}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="border-b-2 border-ink px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">{pt ? 'Ficheiro e conteúdo' : 'File and contents'}</th>
                      <th scope="col" className="border-b-2 border-ink px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-stone-600">{pt ? 'Tamanho' : 'Size'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {POPULATION_DOWNLOADS.files.map(file => (
                      <tr key={file.key} className="align-top">
                        <th scope="row" className="border-b border-line px-4 py-3 text-left font-normal">
                          <a href={file.url} className="font-mono text-[13px] font-semibold text-ink underline underline-offset-4 [overflow-wrap:anywhere]">{file.name}</a>
                          <span className="mt-1 block leading-relaxed text-stone-700">{FILE_COPY[file.key]?.[locale]}</span>
                        </th>
                        <td className="whitespace-nowrap border-b border-line px-4 py-3 text-right tabular-nums text-ink">{formatBytes(file.bytes, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="mt-8 text-lg font-bold text-ink">{pt ? 'Primeiros passos' : 'First steps'}</h3>
              <p className="mt-2 max-w-3xl leading-relaxed text-stone-600">
                {pt
                  ? 'Dois exemplos que ligam pessoas a agregados. Se publicares tabelas feitas com estes dados, segue as regras do site: diz o nível de qualidade de cada freguesia, lê com mais cuidado as categorias com poucas pessoas e as freguesias de nível C, e não faças ordenações nem comparações «mais do que» a partir de uma única execução.'
                  : 'Two examples that join persons to households. If you publish tables made from these data, follow the site’s rules: state each parish’s quality tier, read categories with few people and tier C parishes with more care, and make no rankings or “more than” comparisons from a single run.'}
              </p>
              {/* Stacked, full width: side by side the longer lines were clipped with no cue that they scroll. */}
              <div className="mt-4 grid gap-4">
                <Code label="DuckDB">{duckdb}</Code>
                <Code label="Python">{python}</Code>
              </div>
            </Section>

            <Section
              id="dicionario"
              title={pt ? 'Que colunas tem?' : 'What columns does it have?'}
              lede={<p>{pt
                ? <>O dicionário da própria versão. As descrições estão em inglês, tal como no ficheiro de metadados; os mapas de códigos para etiquetas (por exemplo, o nível de escolaridade) estão no mesmo ficheiro, em <code className="font-mono text-[13px]">label_maps</code>.</>
                : <>The release’s own dictionary. The code-to-label maps (education level, for example) are in the metadata file, under <code className="font-mono text-[13px]">label_maps</code>.</>}</p>}
            >
              <h3 className="text-base font-bold text-ink">{pt ? 'De onde vem cada coluna' : 'Where each column comes from'}</h3>
              <dl className="mt-3 grid gap-x-6 gap-y-3 md:grid-cols-2">
                {PROVENANCE_CODES.map(entry => (
                  <div key={entry.code} className="flex gap-3">
                    <dt className="w-12 shrink-0 font-mono text-sm font-bold text-ink">{entry.code}</dt>
                    <dd className="text-sm leading-relaxed text-stone-700"><span className="font-semibold text-ink">{entry.name[locale]}.</span> {entry.meaning[locale]}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <ColumnDictionary dictionary={release.column_dictionary} locale={locale} />
              </div>
            </Section>

            <Section
              id="qualidade"
              title={pt ? 'Quão bons são os dados de cada freguesia?' : 'How good are each parish’s data?'}
              lede={<p>{pt
                ? 'O ficheiro de qualidade tem uma linha por freguesia, com a sua população de publicação e o seu nível. Lê-o antes de usar uma freguesia isolada: abaixo de 500 residentes nenhuma chega ao nível A ou B.'
                : 'The quality file has one row per parish, with its publication population and its tier. Read it before using a single parish on its own: below 500 residents none reaches tier A or B.'}</p>}
            >
              <ul className="flex flex-wrap gap-3">
                {(['A', 'B', 'C'] as const).map(tier => (
                  <li key={tier} className="flex items-center gap-2 rounded-2xl border border-line bg-cream px-4 py-3">
                    <QualityBadge kind={tier} locale={locale} />
                    <span className="text-sm tabular-nums text-ink">{formatCount(meta.counts.tiers[tier], locale)} {pt ? 'freguesias' : 'parishes'}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 text-lg font-bold text-ink">{pt ? 'O que diz cada coluna do ficheiro de qualidade' : 'What each column of the quality file says'}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">
                {pt
                  ? <>O ficheiro <code className="font-mono text-[13px]">quality.csv</code>, que o README do pacote manda ler primeiro. Origem: INE (contagem publicada), gerado (contado na população gerada), avaliação (medido contra as tabelas do INE) ou geográfico.</>
                  : <>The <code className="font-mono text-[13px]">quality.csv</code> file, which the package README says to read first. Source: INE (a published count), generated (counted in the generated population), evaluation (measured against INE’s tables) or geographic.</>}
              </p>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-cream">
                <table className="min-w-full border-collapse text-sm">
                  <caption className="sr-only">{pt ? 'Colunas do ficheiro de qualidade' : 'Columns of the quality file'}</caption>
                  <thead>
                    <tr>
                      {[pt ? 'Coluna' : 'Column', pt ? 'Origem' : 'Source', pt ? 'O que é' : 'What it is'].map(header => (
                        <th key={header} scope="col" className="border-b-2 border-ink px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {QUALITY_COLUMNS.map(column => (
                      <tr key={column.name} className="align-top">
                        <th scope="row" className="whitespace-nowrap border-b border-line px-3 py-2 text-left font-mono text-[13px] font-normal text-ink">{column.name}</th>
                        <td className="whitespace-nowrap border-b border-line px-3 py-2 text-ink">{QUALITY_SOURCE[column.source][locale]}</td>
                        <td className="min-w-[18rem] border-b border-line px-3 py-2 leading-relaxed text-stone-700">{column.meaning[locale]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                <Action href={POPULATION_ROUTES.quality} locale={locale} variant="text" arrow>{pt ? 'Como sabemos que funciona?' : 'How do we know it works?'}</Action>
              </p>
            </Section>

            <Section
              id="verificar"
              title={pt ? 'Como verifico os ficheiros?' : 'How do I verify the files?'}
              lede={<p>{pt
                ? <>A soma SHA-256 da lista de somas do pacote (<code className="font-mono text-[13px]">checksums.sha256</code>) é <code className="break-all font-mono text-[13px] text-ink">{release.checksums_sha256}</code>. Se coincidir, cada ficheiro do pacote pode ser verificado contra essa lista.</>
                : <>The SHA-256 of the package’s list of sums (<code className="font-mono text-[13px]">checksums.sha256</code>) is <code className="break-all font-mono text-[13px] text-ink">{release.checksums_sha256}</code>. If it matches, every file in the package can be checked against that list.</>}</p>}
            >
              <Code label={pt ? 'Comandos de verificação' : 'Verification commands'}>{verify}</Code>
              <p className="mt-3 text-sm text-stone-600">
                {pt ? 'No macOS, usa ' : 'On macOS, use '}<code className="font-mono text-[13px]">shasum -a 256</code>{pt ? ' em vez de ' : ' instead of '}<code className="font-mono text-[13px]">sha256sum</code>.
              </p>
            </Section>

            <Section id="citar" title={pt ? 'Como cito?' : 'How do I cite them?'} lede={<p>{pt
              ? 'A licença exige esta atribuição, tal como está, em qualquer uso ou redistribuição.'
              : 'The licence requires this attribution, as it stands, in any use or redistribution.'}</p>}>
              <div className="space-y-5">
                {(locale === 'pt' ? (['pt', 'en'] as const) : (['en', 'pt'] as const)).map(language => (
                  <div key={language} className="rounded-2xl border border-line bg-cream p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      {language === 'pt' ? (pt ? 'Atribuição em português' : 'Attribution in Portuguese') : (pt ? 'Atribuição em inglês' : 'Attribution in English')}
                    </p>
                    <p lang={language} className="mt-2 leading-relaxed text-ink">{release.attribution[language]}</p>
                    <div className="mt-4">
                      <CopyButton text={release.attribution[language]} label={pt ? 'Copiar atribuição' : 'Copy attribution'} locale={locale} />
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-line bg-cream p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Citar como' : 'Cite as'}</p>
                  <p className="mt-2 leading-relaxed text-ink">{citeWithLocator}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <CopyButton text={citeWithLocator} label={pt ? 'Copiar citação' : 'Copy citation'} locale={locale} />
                    <a href={citationUrl} className={`${link} inline-flex min-h-11 items-center text-sm`}>{`CITATION.cff (v${POPULATION_RELEASE})`}</a>
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    {pt
                      ? 'A ligação da citação é a página da versão no GitHub, que não muda. Ainda não há DOI.'
                      : 'The citation’s link is the release page on GitHub, which does not change. There is no DOI yet.'}
                  </p>
                </div>
              </div>
            </Section>

            <Section id="erratas" title={pt ? 'Encontraste um erro?' : 'Found an error?'}>
              <p className="max-w-3xl leading-relaxed text-stone-700">
                {pt
                  ? <>As correções a esta versão ficam registadas nas <a className={link} href={POPULATION_DOWNLOADS.errata}>erratas</a>. Para reportar um problema, abre uma <a className={link} href={POPULATION_DOWNLOADS.issues}>questão no GitHub</a> ou escreve para <a className={link} href="mailto:info@estimador.pt">info@estimador.pt</a>. A <a className={link} href={POPULATION_DOWNLOADS.modelCard}>ficha do modelo</a> tem a descrição técnica completa.</>
                  : <>Corrections to this release are recorded in the <a className={link} href={POPULATION_DOWNLOADS.errata}>errata</a>. To report a problem, open a <a className={link} href={POPULATION_DOWNLOADS.issues}>GitHub issue</a> or write to <a className={link} href="mailto:info@estimador.pt">info@estimador.pt</a>. The <a className={link} href={POPULATION_DOWNLOADS.modelCard}>model card</a> has the full technical account.</>}
              </p>
              <p className="mt-4">
                <Action href={POPULATION_ROUTES.methodology} locale={locale} variant="text" arrow>{pt ? 'Como foi feita a população' : 'How the population was made'}</Action>
              </p>
            </Section>
          </>
        )}
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
