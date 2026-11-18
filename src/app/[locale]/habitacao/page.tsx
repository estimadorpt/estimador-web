import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { ChannelHead, ChartTabs, NowGlyph } from '@/components/instrument';
import { ChartTable } from '@/components/viz/ChartTable';
import { Disclosure } from '@/components/viz/Disclosure';
import { RevisedDate } from '@/components/brand/RevisedDate';
import { TextLink } from '@/components/brand/TextLink';
import { YearChart } from '@/components/housing/YearChart';
import { LisbonLicenceTimes } from '@/components/housing/LisbonLicenceTimes';
import { ShortLetsBars } from '@/components/housing/ShortLetsBars';
import { createPageMetadata } from '@/lib/metadata';
import { HOUSING_PUBLISHED } from '@/lib/config/housing-status';
import { formatCount } from '@/lib/population/format';
import {
  RMAL_THRESHOLDS,
  loadHousingLicensing,
  loadHousingShortLets,
  housingDate,
  niceCeiling,
  oneDecimal,
  TWO_YEARS_DAYS,
  yearsOverTwoYears,
  runHoldsFinding,
} from '@/lib/housing-data';
import { setRequestLocale } from '@/i18n/request-locale';
import { COPY_REVISED } from '@/lib/sitemap-dates';

/** When this page's wording was last checked. */
const REVISED = COPY_REVISED['/habitacao'];

type L = 'pt' | 'en';
const lang = (locale: string): L => (locale === 'en' ? 'en' : 'pt');

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = lang(locale) === 'pt';
  return createPageMetadata({
    locale,
    path: '/habitacao',
    title: pt ? 'Habitação: licenças e alojamento local em Lisboa' : 'Housing: licences and short lets in Lisbon',
    description: pt
      ? 'Quanto tempo demora uma licença de construção em Lisboa, e quantos registos de alojamento local há por cada 100 casas em cada freguesia. Só registos.'
      : 'How long a building licence takes in Lisbon, and how many short-let registrations there are per 100 homes in each parish. Records only.',
    // A draft until src/lib/config/housing-status.json says otherwise.
    index: HOUSING_PUBLISHED,
  });
}

function Standfirst({ children }: { children: ReactNode }) {
  return <p className="mt-2 max-w-[68ch] text-[16px] leading-relaxed text-ink">{children}</p>;
}

function Finding({ children }: { children: ReactNode }) {
  return <p className="disp mt-4 max-w-[30ch] text-[1.6rem] leading-[1.1] md:text-[2rem]">{children}</p>;
}

export default async function HabitacaoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: given } = await params;
  setRequestLocale(given);
  const locale = lang(given);
  const pt = locale === 'pt';
  const licensing = loadHousingLicensing();
  const shortLets = loadHousingShortLets();
  if (!licensing || !shortLets) notFound();

  const count = (n: number) => formatCount(n, locale);

  // ---- Lisbon licence times ----
  const { lisbon, national } = licensing;
  const ine = licensing.sources.find(s => s.id === 'ine_0008309');
  const snapshot = housingDate(lisbon.snapshot, locale);
  const run = yearsOverTwoYears(lisbon.by_alvara_year);
  const runDays = run.map(y => y.new_build.median_days as number);
  const runLow = run.find(y => y.new_build.median_days === Math.min(...runDays));
  const runHigh = run.find(y => y.new_build.median_days === Math.max(...runDays));
  const overall = lisbon.overall;
  const [firstYear, lastYear] = overall.years;

  // ---- National licences and completions ----
  const lastNational = national[national.length - 1];
  const twoBefore = national.find(n => n.year === lastNational.year - 2);
  const listYears = (ys: number[], l: string) => new Intl.ListFormat(l === 'pt' ? 'pt-PT' : 'en-GB', { type: 'conjunction' }).format(ys.map(String));
  const provisional = national.filter(n => n.completed_provisional).map(n => n.year);
  const allOutrun = national.every(n => n.licensed > n.completed);
  const nationalMax = niceCeiling(national.flatMap(n => [n.licensed, n.completed]));
  const nationalChart = (
    <YearChart
      label={pt
        ? `Fogos licenciados e concluídos em construções novas para habitação familiar, Portugal, ${national[0].year} a ${lastNational.year}`
        : `Dwellings licensed and completed in new family housing, Portugal, ${national[0].year} to ${lastNational.year}`}
      yMax={nationalMax}
      yTicks={Array.from({ length: Math.floor(nationalMax / 10000) + 1 }, (_, i) => i * 10000).map(v => ({ value: v, label: v === 0 ? '0' : `${v / 1000}${pt ? ' mil' : 'k'}` }))}
      series={[
        { key: 'licensed', label: pt ? 'Licenciados' : 'Licensed', tone: 'ink', points: national.map(n => ({ year: n.year, value: n.licensed })) },
        { key: 'completed', label: pt ? 'Concluídos' : 'Completed', tone: 'graphite', points: national.map(n => ({ year: n.year, value: n.completed, soft: n.completed_provisional })) },
      ]}
      xTicks={national.filter(n => n.year % 2 === 1).map(n => n.year)}
      phoneXTicks={national.filter(n => n.year % 4 === 1).map(n => n.year)}
    />
  );
  const nationalTable = (
    <ChartTable
      caption={pt ? 'Portugal: fogos licenciados e concluídos por ano' : 'Portugal: dwellings licensed and completed per year'}
      columns={pt
        ? ['Ano', 'Licenciados', 'Concluídos', 'Concluídos por 100 licenciados dois anos antes']
        : ['Year', 'Licensed', 'Completed', 'Completed per 100 licensed two years before']}
      rows={[...national].reverse().map(n => [
        String(n.year),
        count(n.licensed),
        n.completed_provisional ? `${count(n.completed)} (${pt ? 'estimativa' : 'estimate'})` : count(n.completed),
        n.completed_per_licensed_two_years_before === null ? '—' : count(Math.round(n.completed_per_licensed_two_years_before * 100)),
      ])}
      align={['left', 'right', 'right', 'right']}
    />
  );

  // ---- Short lets ----
  const top = shortLets.parishes[0];
  // "passam de": strictly above each threshold.
  const above5 = shortLets.parishes.filter(p => p.per_100_dwellings > RMAL_THRESHOLDS.relative);
  const above10 = shortLets.parishes.filter(p => p.per_100_dwellings > RMAL_THRESHOLDS.absolute);
  const lx = shortLets.municipality;
  const rnalDate = housingDate(shortLets.snapshot, locale);
  const shortLetsBars = (
    <ShortLetsBars
      parishes={shortLets.parishes}
      municipality={{ ...lx, name: pt ? 'Lisboa, concelho' : 'Lisbon, municipality' }}
      max={Math.max(RMAL_THRESHOLDS.absolute, Math.ceil(top.per_100_dwellings / 5) * 5)}
      thresholds={[
        { value: RMAL_THRESHOLDS.relative, label: '5' },
        { value: RMAL_THRESHOLDS.absolute, label: '10' },
      ]}
      phoneKey={pt ? 'Traços finos: os limiares de 5 e 10 registos por 100 casas.' : 'Thin ticks: the thresholds of 5 and 10 registrations per 100 homes.'}
      format={v => oneDecimal(v, locale)}
      label={pt ? 'Registos de alojamento local por cada 100 casas, por freguesia de Lisboa' : 'Short-let registrations per 100 homes, by Lisbon parish'}
    />
  );
  const shortLetsTable = (
    <ChartTable
      caption={pt ? 'Lisboa: registos de alojamento local e alojamentos dos Censos 2021, por freguesia' : 'Lisbon: short-let registrations and Census 2021 dwellings, by parish'}
      columns={pt
        ? ['Freguesia', 'Registos de AL', 'Alojamentos clássicos (Censos 2021)', 'Registos por 100', 'Acima do limiar']
        : ['Parish', 'Short-let registrations', 'Classic dwellings (Census 2021)', 'Registrations per 100', 'Above the threshold']}
      rows={[...shortLets.parishes, { ...lx, name: pt ? 'Lisboa, concelho' : 'Lisbon, municipality' }].map(p => [
        p.name, count(p.registrations), count(p.classic_dwellings), oneDecimal(p.per_100_dwellings, locale),
        p.per_100_dwellings > RMAL_THRESHOLDS.absolute ? (pt ? 'passa de 10' : 'above 10')
          : p.per_100_dwellings > RMAL_THRESHOLDS.relative ? (pt ? 'passa de 5' : 'above 5') : '—',
      ])}
      align={['left', 'right', 'right', 'right', 'left']}
    />
  );

  const dataLink = (file: string, text: string) => (
    <TextLink href={`/data/housing/${file}`} external>{text}</TextLink>
  );

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="wide"
          eyebrow={pt ? 'Habitação' : 'Housing'}
          title={overall.new_build.median_days > TWO_YEARS_DAYS
            ? (pt ? 'Em Lisboa, a licença de uma obra nova demora mais de dois anos' : 'In Lisbon, a licence for a new building takes more than two years')
            : (pt ? 'Quanto tempo demora uma licença de construção em Lisboa' : 'How long a building licence takes in Lisbon')}
          lede={pt
            ? 'Duas leituras feitas só com registos: quanto tempo a câmara de Lisboa leva da entrada de um processo ao alvará, e quantos registos de alojamento local há por cada 100 casas em cada freguesia. Nada nesta página é um modelo ou uma previsão.'
            : "Two readings made from records alone: how long Lisbon's câmara takes from a process entering to its alvará, and how many short-let registrations there are per 100 homes in each parish. Nothing on this page is a model or a forecast."}
          meta={<>
            <RevisedDate date={REVISED} locale={locale} />
            <span className="inline-flex items-center gap-1.5">
              <NowGlyph />
              {pt ? 'o que já aconteceu: cada número foi contado em registos, por isso não há margem' : 'what has already happened: every figure was counted in records, so there is no margin'}
            </span>
          </>}
        />

        <div className="mx-auto w-full max-w-7xl px-4 pb-12">
          {/* ---- Instrument 1: licences ---- */}
          <section aria-labelledby="licencas" className="pt-8">
            <ChannelHead
              id="licencas"
              title={pt ? 'Licenças de construção' : 'Building licences'}
              serial="Lisboa"
              aside={pt ? `registos da câmara de ${snapshot}` : `the câmara's records of ${snapshot}`}
            />
            <div className="max-w-5xl">
              <Finding>
                {runHoldsFinding(run)
                  ? (pt ? `Desde ${run[0].year}, a mediana de cada ano passa os dois anos` : `Since ${run[0].year}, every year's median has passed two years`)
                  : (pt ? `A mediana foi de ${count(overall.new_build.median_days)} dias da entrada ao alvará` : `The median was ${count(overall.new_build.median_days)} days from entry to alvará`)}
              </Finding>
              <Standfirst>
                {pt
                  ? <>Nos {count(overall.new_build.alvaras)} alvarás de construção nova emitidos de {firstYear} a {lastYear}, a mediana foi de {count(overall.new_build.median_days)} dias entre a entrada do processo na câmara e o alvará.{runLow && runHigh && <> De {run[0].year} a {lastYear}, a mediana de cada ano ficou entre {count(runLow.new_build.median_days ?? 0)} dias ({runLow.year}) e {count(runHigh.new_build.median_days ?? 0)} ({runHigh.year}{runHigh.partial_year ? ', ano incompleto' : ''}).</>} <strong>Só contam as licenças que chegaram a ser emitidas</strong>: um processo ainda à espera, recusado ou desistido não tem alvará e fica de fora.</>
                  : <>Across the {count(overall.new_build.alvaras)} new-build alvarás issued from {firstYear} to {lastYear}, the median time from a process entering the câmara to its alvará was {count(overall.new_build.median_days)} days.{runLow && runHigh && <> From {run[0].year} to {lastYear}, each year&apos;s median was between {count(runLow.new_build.median_days ?? 0)} days ({runLow.year}) and {count(runHigh.new_build.median_days ?? 0)} ({runHigh.year}{runHigh.partial_year ? ', a partial year' : ''}).</>} <strong>Only licences that were issued count</strong>: a process still waiting, refused or withdrawn has no alvará and is left out.</>}
              </Standfirst>
              <LisbonLicenceTimes locale={locale} data={licensing} />
              <p className="mt-3 max-w-[84ch] text-[12.5px] leading-[17px] text-graphite">
                {pt
                  ? <>Outra leitura dos mesmos registos da câmara: o <a href="https://flatin.pt/pt/barometro-construcao/" className="underline underline-offset-2">barómetro da construção do flatin.pt</a> (fixado a 8 de novembro de 2026) dá 940 dias para a construção nova nos 12 meses até 29 de outubro de 2026, em 35 títulos. Aqui está a série de cada ano desde 2009.</>
                  : <>Another reading of the same câmara records: <a href="https://flatin.pt/pt/barometro-construcao/" className="underline underline-offset-2">flatin.pt&apos;s construction barometer</a> (fixed on 8 November 2026) gives 940 days for new builds in the 12 months to 29 October 2026, on 35 titles. This page gives the series for each year since 2009.</>}
              </p>

              <h3 className="mt-12 max-w-[40ch] text-[1.35rem] leading-tight">
                {allOutrun
                  ? (pt ? `Em Portugal licenciam-se mais casas do que se concluem, todos os anos desde ${national[0].year}` : `In Portugal more homes are licensed than completed, every year since ${national[0].year}`)
                  : (pt ? 'Casas licenciadas e concluídas em Portugal' : 'Homes licensed and completed in Portugal')}
              </h3>
              <Standfirst>
                {pt
                  ? <>Em {lastNational.year}, {count(lastNational.licensed)} fogos licenciados e {count(lastNational.completed)} concluídos{lastNational.completed_provisional ? ' (estimativa do INE)' : ''}. {twoBefore && lastNational.completed_per_licensed_two_years_before !== null && <>Uma obra leva anos a acabar: os {count(lastNational.completed)} concluídos em {lastNational.year} equivalem a {count(Math.round(lastNational.completed_per_licensed_two_years_before * 100))} por cada 100 licenciados em {twoBefore.year} ({count(twoBefore.licensed)}). São duas contagens, não as mesmas casas.</>}</>
                  : <>In {lastNational.year}, {count(lastNational.licensed)} dwellings licensed and {count(lastNational.completed)} completed{lastNational.completed_provisional ? ' (an INE estimate)' : ''}. {twoBefore && lastNational.completed_per_licensed_two_years_before !== null && <>A building takes years to finish: the {count(lastNational.completed)} completed in {lastNational.year} come to {count(Math.round(lastNational.completed_per_licensed_two_years_before * 100))} for every 100 licensed in {twoBefore.year} ({count(twoBefore.licensed)}). These are two counts, not the same homes.</>}</>}
              </Standfirst>
              <ChartTabs
                id="licensed-completed"
                locale={locale}
                title={pt ? 'Fogos em construções novas para habitação familiar, por ano' : 'Dwellings in new buildings for family housing, per year'}
                chart={nationalChart}
                table={nationalTable}
                note={pt
                  ? <>Fonte: INE, fogos licenciados (0008309) e concluídos (0013249) em construções novas para habitação familiar, recolhidos a {ine?.retrieved_at ? housingDate(ine.retrieved_at, locale) : '—'}. {provisional.length > 0 && <>Os concluídos de {listYears(provisional, locale)} são estimativas do INE (quadrados mais pequenos).</>}</>
                  : <>Source: INE, dwellings licensed (0008309) and completed (0013249) in new buildings for family housing, collected on {ine?.retrieved_at ? housingDate(ine.retrieved_at, locale) : '—'}. {provisional.length > 0 && <>Completions for {listYears(provisional, locale)} are INE estimates (smaller squares).</>}</>}
              />
            </div>
          </section>

          {/* ---- Instrument 2: short lets ---- */}
          <section aria-labelledby="alojamento-local" className="pt-14">
            <ChannelHead
              id="alojamento-local"
              title={pt ? 'Alojamento local' : 'Short lets'}
              serial="Lisboa"
              aside={pt ? `registo nacional a ${rnalDate}` : `national register on ${rnalDate}`}
            />
            <div className="max-w-5xl">
              <Finding>
                {pt
                  ? `A freguesia de ${top.name} tem ${oneDecimal(top.per_100_dwellings, locale)} registos de alojamento local por cada 100 casas`
                  : `${top.name} has ${oneDecimal(top.per_100_dwellings, locale)} short-let registrations for every 100 homes`}
              </Finding>
              <Standfirst>
                {pt
                  ? <>{count(top.registrations)} registos ativos para {count(top.classic_dwellings)} alojamentos familiares clássicos dos Censos 2021. Em {above5.length} das {shortLets.parishes.length} freguesias passam de {RMAL_THRESHOLDS.relative} por cada 100, e em {above10.length} de {RMAL_THRESHOLDS.absolute}; no concelho, {oneDecimal(lx.per_100_dwellings, locale)} ({count(lx.registrations)} registos). Um registo não é uma casa: pode ser um quarto, um apartamento ou um hostel.</>
                  : <>{count(top.registrations)} active registrations for {count(top.classic_dwellings)} classic dwellings in the Census 2021. {above5.length} of the {shortLets.parishes.length} parishes pass {RMAL_THRESHOLDS.relative} per 100, and {above10.length} pass {RMAL_THRESHOLDS.absolute}; the municipality as a whole, {oneDecimal(lx.per_100_dwellings, locale)} ({count(lx.registrations)} registrations). A registration is not a home: it can be a room, a flat or a hostel.</>}
              </Standfirst>
              <ChartTabs
                id="short-lets"
                locale={locale}
                title={pt ? 'Registos de alojamento local por cada 100 alojamentos familiares clássicos' : 'Short-let registrations per 100 classic dwellings'}
                chart={shortLetsBars}
                table={shortLetsTable}
                note={pt
                  ? <>Fonte: Turismo de Portugal, RNAL (registos ativos a {rnalDate}); INE, Censos 2021 (CC BY 4.0); cálculo estimador.pt. As marcas em 5 e 10 são os limiares de contenção relativa e absoluta do regulamento municipal de alojamento local (em vigor desde 6 de dezembro de 2025), que usa esta mesma razão. Em 2026 a câmara cancelou cerca de {count(6765)} registos por falta de prova de seguro; os números da própria câmara do fim de 2025, anteriores a esses cancelamentos, são mais altos.</>
                  : <>Source: Turismo de Portugal, RNAL (active registrations on {rnalDate}); INE, Census 2021 (CC BY 4.0); estimador.pt&apos;s calculation. The marks at 5 and 10 are the relative and absolute containment thresholds of Lisbon&apos;s short-let regulation (in force since 6 December 2025), which uses this same ratio. In 2026 the câmara cancelled about {count(6765)} registrations for missing proof of insurance; the câmara&apos;s own late-2025 figures, from before those cancellations, are higher.</>}
              />
            </div>
          </section>

          {/* ---- Reading notes and data ---- */}
          <section aria-labelledby="dados-habitacao" className="mt-14 max-w-3xl border-t border-ink pt-4">
            <h2 id="dados-habitacao" className="text-[22px] leading-7">{pt ? 'Os dados desta página' : "This page's data"}</h2>
            <p className="mt-2 text-[15px] leading-relaxed">
              {pt
                ? 'Cada ficheiro diz de onde vêm os números, a licença de cada fonte, a data da recolha e o que conta. Os cálculos do estimador.pt são CC BY-NC 4.0; os dados de terceiros mantêm a sua licença.'
                : "Each file says where its figures come from, each source's licence, the date they were collected and what they count. estimador.pt's calculations are CC BY-NC 4.0; third-party data keep their own licences."}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-6">
              {dataLink('licensing.json', pt ? 'Licenças (JSON)' : 'Licences (JSON)')}
              {dataLink('short-lets-lisbon.json', pt ? 'Alojamento local (JSON)' : 'Short lets (JSON)')}
            </div>
            <Disclosure summary={pt ? 'O que estes números não dizem' : 'What these figures do not say'} className="mt-4">
              <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
                {pt ? <>
                  <li>Quanto esperam os processos que ainda não têm alvará: as medianas só contam os que o receberam.</li>
                  <li>Quanto tempo é da câmara e quanto é do requerente: Lisboa não publica a data da decisão.</li>
                  <li>Se as licenças atrasam a construção: aqui só há contagens e datas, nenhum teste de causa.</li>
                  <li>Quantas casas são alojamento local: um registo pode ser um quarto ou um edifício, e os alojamentos são os de 2021.</li>
                  <li>Outros concelhos: só Lisboa publica as duas datas de cada processo.</li>
                </> : <>
                  <li>How long processes without an alvará wait: the medians count only those that received one.</li>
                  <li>How much of the time is the câmara&apos;s and how much the applicant&apos;s: Lisbon publishes no decision date.</li>
                  <li>Whether licences hold back building: this page has counts and dates, no test of cause.</li>
                  <li>How many homes are short lets: a registration can be a room or a building, and the dwellings are those of 2021.</li>
                  <li>Other municipalities: only Lisbon publishes both dates for each process.</li>
                </>}
              </ul>
            </Disclosure>
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
