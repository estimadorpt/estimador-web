import { ChartTabs } from '@/components/instrument';
import { ChartTable } from '@/components/viz/ChartTable';
import { YearChart } from '@/components/housing/YearChart';
import { formatCount } from '@/lib/population/format';
import { TWO_YEARS_DAYS, housingDate, loadHousingLicensing, type LicensingFile } from '@/lib/housing-data';

/**
 * Lisbon's licence times as one instrument piece: the chart (median days from
 * entry to alvará by year, new builds and all licences), its table twin and the
 * source sentence with the caveats that must travel with it. Used by
 * /habitacao and by the licensing note in /artigos (reads
 * public/data/housing/licensing.json itself when no data are passed).
 */
export function LisbonLicenceTimes({ locale: given, data, id = 'licence-days', headingLevel = 3 }: {
  locale: string;
  data?: LicensingFile | null;
  id?: string;
  headingLevel?: 2 | 3;
}) {
  const licensing = data ?? loadHousingLicensing();
  if (!licensing) return null;
  const locale = given === 'en' ? 'en' : 'pt';
  const pt = locale === 'pt';
  const count = (n: number) => formatCount(n, locale);
  const days = (n: number | null) => (n === null ? '—' : count(n));
  const { lisbon } = licensing;
  const cml = licensing.sources.find(s => s.id === 'cml_rjue');
  const snapshot = housingDate(lisbon.snapshot, locale);
  const lastAlvara = cml?.last_alvara_date ? housingDate(cml.last_alvara_date, locale) : snapshot;
  const [firstYear, lastYear] = lisbon.overall.years;
  const partial = lisbon.by_alvara_year.find(y => y.partial_year);
  const newCounts = lisbon.by_alvara_year.filter(y => !y.partial_year).map(y => y.new_build.alvaras);
  const newRange = `${count(Math.min(...newCounts))} ${pt ? 'a' : 'to'} ${count(Math.max(...newCounts))}`;
  const simplex = housingDate(lisbon.simplex_date, locale);
  const simplexYear = Number(lisbon.simplex_date.slice(0, 4));
  const simplexAt = simplexYear + (Date.parse(`${lisbon.simplex_date}T00:00:00Z`) - Date.parse(`${simplexYear}-01-01T00:00:00Z`)) / (365 * 864e5);

  const chart = (
    <YearChart
      label={pt
        ? `Dias da entrada do processo ao alvará em Lisboa, mediana por ano, ${firstYear} a ${lastYear}`
        : `Days from a process entering Lisbon's câmara to its alvará, median by year, ${firstYear} to ${lastYear}`}
      yMax={1400}
      yTicks={[
        { value: 0, label: '0' },
        { value: 365, label: pt ? '1 ano' : '1 yr' },
        { value: 1095, label: pt ? '3 anos' : '3 yrs' },
      ]}
      references={[{ value: TWO_YEARS_DAYS, label: pt ? '2 anos' : '2 years' }]}
      markers={[{ at: simplexAt, label: 'Simplex' }]}
      series={[
        {
          key: 'all', label: pt ? 'Todas as licenças' : 'All licences', tone: 'graphite',
          points: lisbon.by_alvara_year.flatMap(y => y.all_licences.median_days === null ? [] : [{ year: y.year, value: y.all_licences.median_days, soft: y.partial_year }]),
        },
        {
          key: 'new', label: pt ? 'Construção nova' : 'New build', tone: 'ink',
          points: lisbon.by_alvara_year.flatMap(y => y.new_build.median_days === null ? [] : [{ year: y.year, value: y.new_build.median_days, soft: y.partial_year }]),
        },
      ]}
      xTicks={[2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023, 2025]}
      phoneXTicks={[2009, 2013, 2017, 2021, 2025]}
    />
  );
  const table = (
    <ChartTable
      caption={pt ? 'Lisboa: dias da entrada ao alvará, mediana por ano do alvará' : 'Lisbon: days from entry to alvará, median by year of the alvará'}
      columns={pt
        ? ['Ano', 'Construção nova, mediana (dias)', 'Alvarás', 'Todas as licenças, mediana (dias)', 'Alvarás']
        : ['Year', 'New build, median (days)', 'Alvarás', 'All licences, median (days)', 'Alvarás']}
      rows={[...lisbon.by_alvara_year].reverse().map(y => [
        y.partial_year ? `${y.year} (${pt ? 'até' : 'to'} ${lastAlvara})` : String(y.year),
        days(y.new_build.median_days), count(y.new_build.alvaras),
        days(y.all_licences.median_days), count(y.all_licences.alvaras),
      ])}
      align={['left', 'right', 'right', 'right', 'right']}
    />
  );
  return (
    <ChartTabs
      id={id}
      locale={locale}
      headingLevel={headingLevel}
      title={pt ? 'Dias da entrada do processo ao alvará, mediana por ano do alvará' : 'Days from entry to alvará, median by year of the alvará'}
      chart={chart}
      table={table}
      note={pt
        ? <>Fonte: Câmara Municipal de Lisboa, processos de obras abrangidos pelo RJUE e alvarás (CC0), registos de {snapshot}; cálculo estimador.pt. Só contam as licenças que chegaram a ser emitidas, cada processo uma vez, pelo primeiro alvará. O alvará vem depois da aprovação e do pedido e pagamento do requerente, por isso o tempo inclui o dele; a câmara não publica a data da decisão. {partial?.year} vai até {lastAlvara} (quadrados mais pequenos). Desde {simplex} (Simplex Urbanístico) muitas licenças deixaram de ter alvará: falta a câmara confirmar o que a data regista nesses casos. Há poucas obras novas por ano ({newRange} alvarás), por isso a mediana de um ano mexe muito.</>
        : <>Source: Câmara Municipal de Lisboa, building processes under the RJUE and alvarás (CC0), records of {snapshot}; estimador.pt&apos;s calculation. Only licences that were issued count, each process once, by its first alvará. The alvará comes after approval and after the applicant asks and pays for it, so the time includes the applicant&apos;s; the câmara publishes no decision date. {partial?.year} runs to {lastAlvara} (smaller squares). Since {simplex} (Simplex Urbanístico) many licences no longer get an alvará: what the date records for them is still to be confirmed with the câmara. New builds are few ({newRange} alvarás a year), so one year&apos;s median moves a lot.</>}
    />
  );
}
