import { ChannelHead, NowGlyph } from '@/components/instrument';
import { Action } from '@/components/brand/Action';
import { formatCount } from '@/lib/population/format';
import { housingDate, loadHousingLicensing, loadHousingShortLets, yearsOverTwoYears } from '@/lib/housing-data';

/**
 * Habitação on the homepage, once the page publishes (housing-status.json):
 * the two readings as dated findings, each counted in records (the black
 * square), and the way into /habitacao. Renders nothing without its files.
 */
export function HousingPanel({ locale: given }: { locale: string }) {
  const licensing = loadHousingLicensing();
  const shortLets = loadHousingShortLets();
  if (!licensing || !shortLets) return null;
  const locale = given === 'en' ? 'en' : 'pt';
  const pt = locale === 'pt';
  const count = (n: number) => formatCount(n, locale);
  const run = yearsOverTwoYears(licensing.lisbon.by_alvara_year);
  const overall = licensing.lisbon.overall;
  const top = shortLets.parishes[0];
  const ratio = top.per_100_dwellings.toLocaleString(pt ? 'pt-PT' : 'en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <section aria-labelledby="home-housing">
      <ChannelHead
        id="home-housing"
        title={pt ? 'Habitação' : 'Housing'}
        href="/habitacao"
        locale={locale}
        serial="Lisboa"
        aside={pt
          ? `registos de ${housingDate(licensing.lisbon.snapshot, locale)} e ${housingDate(shortLets.snapshot, locale)}`
          : `records of ${housingDate(licensing.lisbon.snapshot, locale)} and ${housingDate(shortLets.snapshot, locale)}`}
      />
      <div className="mt-4 grid gap-x-10 gap-y-6 md:grid-cols-2">
        <div>
          <p className="disp text-[1.35rem] leading-tight">
            {pt
              ? `Desde ${run[0]?.year}, a mediana de uma licença de obra nova em Lisboa passa os dois anos`
              : `Since ${run[0]?.year}, the median new-build licence in Lisbon has taken more than two years`}
          </p>
          <p className="mt-2 flex gap-2 text-[15px] leading-relaxed">
            <NowGlyph className="mt-1" />
            <span>{pt
              ? `Mediana de ${count(overall.new_build.median_days)} dias da entrada ao alvará, em ${count(overall.new_build.alvaras)} alvarás de ${overall.years[0]} a ${overall.years[1]}. Só as licenças emitidas.`
              : `A median of ${count(overall.new_build.median_days)} days from entry to alvará, across ${count(overall.new_build.alvaras)} alvarás from ${overall.years[0]} to ${overall.years[1]}. Issued licences only.`}</span>
          </p>
        </div>
        <div>
          <p className="disp text-[1.35rem] leading-tight">
            {pt
              ? `Em ${top.name} há ${ratio} registos de alojamento local por cada 100 casas`
              : `${top.name} has ${ratio} short-let registrations for every 100 homes`}
          </p>
          <p className="mt-2 flex gap-2 text-[15px] leading-relaxed">
            <NowGlyph className="mt-1" />
            <span>{pt
              ? `${count(top.registrations)} registos para ${count(top.classic_dwellings)} alojamentos dos Censos 2021. Fonte: Turismo de Portugal, RNAL.`
              : `${count(top.registrations)} registrations for ${count(top.classic_dwellings)} Census 2021 dwellings. Source: Turismo de Portugal, RNAL.`}</span>
          </p>
        </div>
      </div>
      <div className="mt-4">
        <Action href="/habitacao" locale={locale} variant="text" arrow>{pt ? 'Ver as duas leituras' : 'See both readings'}</Action>
      </div>
    </section>
  );
}
