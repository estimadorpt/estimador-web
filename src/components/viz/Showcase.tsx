'use client';

import { useState } from 'react';
import { DataCard, StatTile, KpiRow, RankedBars, OutcomeBar, PeopleGrid, Segmented, TrendChart, ColumnChart, SERIES, SERIES_DARK, SERIES_NAMES, STATUS } from '@/components/viz';

/**
 * Every visualisation type the system provides, on illustrative data. The
 * numbers are invented and say so; the components are the ones the site uses.
 */
export function VizShowcase({ pt }: { pt: boolean }) {
  const [scope, setScope] = useState('geral');
  const example = pt ? 'Exemplo ilustrativo' : 'Illustrative example';
  const months = Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(2025, 6 + i, 1)));
  const one = (v: number) => v.toFixed(1).replace('.', ',');
  const observed = (values: number[], band: number, widen: number) => values.map((v, i) => ({ x: months[i], y: v, lo: v - band - i * widen, hi: v + band + i * widen }));
  const projected = (values: number[], band: number) => values.map((v, i) => ({ x: months[12 + i], y: v, lo: v - band, hi: v + band, projected: true }));
  // The scope control switches the series, so the toggle does what it says.
  const scopes: Record<string, { name: string; subtitle: string; points: { x: Date; y: number; lo: number; hi: number; projected?: boolean }[]; format: (v: number) => string; yMin: number; yMax: number }> = {
    geral: { name: pt ? 'PIB (índice)' : 'GDP (index)', subtitle: pt ? 'PIB em volume, índice 2019 = 100, com banda de 80%' : 'GDP in volume, index 2019 = 100, with an 80% band', points: [...observed([100, 100.4, 100.9, 101.1, 101.6, 102, 102.3, 102.8, 103.1, 103.4, 103.9, 104.2], 0.6, 0.02), ...projected([104.6, 105.1], 1.1)], format: one, yMin: 98, yMax: 107 },
    trabalho: { name: pt ? 'Desemprego (%)' : 'Unemployment (%)', subtitle: pt ? 'Taxa de desemprego, dessazonalizada, com banda de 80%' : 'Unemployment rate, seasonally adjusted, with an 80% band', points: [...observed([6.6, 6.5, 6.5, 6.4, 6.4, 6.3, 6.3, 6.2, 6.2, 6.2, 6.1, 6.2], 0.15, 0.01), ...projected([6.2, 6.1], 0.35)], format: v => `${one(v)}%`, yMin: 5, yMax: 8 },
    precos: { name: pt ? 'Inflação homóloga (%)' : 'Year-on-year inflation (%)', subtitle: pt ? 'IPC, variação homóloga, com banda de 80%' : 'CPI, year-on-year change, with an 80% band', points: [...observed([2.6, 2.5, 2.3, 2.4, 2.2, 2.1, 2.2, 2, 2.1, 2.1, 2, 2.1], 0.2, 0.01), ...projected([2.1, 2], 0.5)], format: v => `${one(v)}%`, yMin: 0, yMax: 4 },
  };
  const current = scopes[scope] ?? scopes.geral;
  return (
    <div className="grid gap-4">
      <KpiRow>
        <StatTile label={pt ? 'Crescimento homólogo' : 'Year-on-year growth'} value="+1,8" unit="%" delta={{ text: '+0,3 pp', direction: 'up', good: true, period: pt ? 'vs. trimestre anterior' : 'vs. previous quarter' }} trend={[1.1, 1.3, 1.2, 1.5, 1.4, 1.6, 1.5, 1.7, 1.8]} note={example} />
        <StatTile label={pt ? 'Desemprego' : 'Unemployment'} value="6,2" unit="%" delta={{ text: '−0,1 pp', direction: 'down', good: false, period: pt ? 'em 3 meses' : 'over 3 months' }} note={example} />
        <StatTile label={pt ? 'Inflação' : 'Inflation'} value="2,1" unit="%" delta={{ text: '0,0 pp', direction: 'flat' }} note={example} />
        <StatTile label={pt ? 'Risco de recessão' : 'Recession risk'} value="8" unit="%" note={pt ? 'Probabilidade a dois trimestres · exemplo' : 'Two quarters ahead · example'} />
      </KpiRow>

      <DataCard title={pt ? 'Evolução ao longo do tempo' : 'Change over time'} subtitle={current.subtitle} badge={example}
        controls={<Segmented label={pt ? 'Âmbito' : 'Scope'} value={scope} onChange={setScope} options={[{ value: 'geral', label: pt ? 'Visão geral' : 'Overview' }, { value: 'trabalho', label: pt ? 'Trabalho' : 'Labour' }, { value: 'precos', label: pt ? 'Preços' : 'Prices' }]} />}
        source="Fonte: INE" updated={pt ? 'Atualização: 15 de março de 2026' : 'Updated: 15 March 2026'} methodologyHref="/economia/metodologia" methodologyLabel={pt ? 'Metodologia' : 'Methodology'}>
        <TrendChart key={scope} series={[{ name: current.name, points: current.points }]} format={current.format} yMin={current.yMin} yMax={current.yMax} locale={pt ? 'pt' : 'en'} tableCaption={current.name} />
      </DataCard>

      <div className="grid gap-4 md:grid-cols-2">
        <DataCard title={pt ? 'Probabilidade de ser campeão' : 'Title probability'} badge={example} source={pt ? 'Fonte: modelo estimador' : 'Source: estimador model'} updated={pt ? 'Jornada 5' : 'Matchday 5'} methodologyHref="/desporto/liga/metodologia" methodologyLabel={pt ? 'Metodologia' : 'Methodology'}>
          <RankedBars rows={[
            { label: 'Equipa A', value: 0.42, display: '42%', color: '#234c40' },
            { label: 'Equipa B', value: 0.28, display: '28%', color: '#697fc5' },
            { label: 'Equipa C', value: 0.2, display: '20%', color: '#a27d27' },
            { label: 'Equipa D', value: 0.1, display: '10%', color: '#ba6b4f' },
            { label: pt ? 'Outras' : 'Others', value: 0.0, display: '<1%', muted: true },
          ]} max={0.42} tableCaption={pt ? 'Probabilidade de ser campeão' : 'Title probability'} />
          <p className="mt-3 text-xs text-stone-500">{pt ? 'As cores são as das equipas; num ranking sem entidades com cor própria, uma só tinta.' : 'Colours belong to the teams; a ranking without owned colours uses one ink.'}</p>
        </DataCard>
        <DataCard title={pt ? 'Próximo jogo' : 'Next match'} subtitle="Equipa A · Equipa B" badge={example} source={pt ? 'Fonte: modelo estimador' : 'Source: estimador model'} updated={pt ? 'Jornada 5' : 'Matchday 5'} methodologyHref="/desporto/liga/metodologia" methodologyLabel={pt ? 'Metodologia' : 'Methodology'}>
          <OutcomeBar segments={[{ label: '1', value: 0.45, display: '45%' }, { label: 'X', value: 0.28, display: '28%' }, { label: '2', value: 0.27, display: '27%' }]} tableCaption={pt ? 'Próximo jogo' : 'Next match'} />
          <p className="mt-4 text-xs text-stone-500">{pt ? 'Três resultados, uma barra: cada segmento com o seu valor por baixo, para que nada dependa da cor.' : 'Three outcomes, one bar: each segment with its value below it, so nothing depends on colour.'}</p>
        </DataCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DataCard title={pt ? 'População residente por grupo etário' : 'Resident population by age group'} badge={example} source="Fonte: INE, Censos 2021" methodologyHref="/metodologia" methodologyLabel={pt ? 'Metodologia' : 'Methodology'}>
          <ColumnChart data={[{ label: '0–14', value: 1.3 }, { label: '15–24', value: 1.1 }, { label: '25–64', value: 5.6, highlight: true }, { label: '65+', value: 2.4 }]} emphasis tableCaption={pt ? 'População residente por grupo etário' : 'Resident population by age group'} xLabel={pt ? 'Grupo etário' : 'Age group'} format={v => `${v.toFixed(1).replace('.', ',')} M`} yLabel={pt ? 'milhões' : 'millions'} height={220} locale={pt ? 'pt' : 'en'} />
        </DataCard>
        <DataCard title={pt ? 'Cem pessoas' : 'One hundred people'} subtitle={pt ? 'Cada ponto é 1% do grupo' : 'Each dot is 1% of the group'} badge={example} source="Fonte: INE, Censos 2021" updated={pt ? 'Atualização: 15 de março de 2026' : 'Updated: 15 March 2026'} methodologyHref="/metodologia" methodologyLabel={pt ? 'Metodologia' : 'Methodology'}>
          <PeopleGrid shares={[{ label: '0–17', value: 0.16 }, { label: '18–39', value: 0.27 }, { label: '40–64', value: 0.35 }, { label: '65+', value: 0.22 }]} tableCaption={pt ? 'População por grupo etário' : 'Population by age group'} />
        </DataCard>
      </div>

      <DataCard title={pt ? 'Cores de série e de estado' : 'Series and status colours'} subtitle={pt ? 'Validadas sobre creme e sobre floresta: banda de luminosidade, croma, separação para daltonismo e contraste' : 'Validated on cream and on forest: lightness band, chroma, colour-vision separation and contrast'}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Séries, por esta ordem, sobre creme' : 'Series, in this order, on cream'}</p>
            <div className="flex gap-2">{SERIES.map((c, i) => <div key={c} className="flex flex-col items-center gap-1"><span className="h-10 w-14 rounded-md" style={{ backgroundColor: c }} /><span className="text-[11px] text-stone-500">{i + 1} · {SERIES_NAMES[i]}</span><span className="font-mono text-[11px] text-stone-500">{c}</span></div>)}</div>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Sobre floresta' : 'On forest'}</p>
            <div className="mt-1 flex gap-2 rounded-md bg-forest p-2">{SERIES_DARK.map(c => <span key={c} className="h-8 w-14 rounded-md" style={{ backgroundColor: c }} />)}</div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Estados, sempre com ícone e palavra' : 'Status, always with an icon and a word'}</p>
            <div className="flex gap-2">{Object.entries(STATUS).map(([k, c]) => <div key={k} className="flex flex-col items-center gap-1"><span className="h-10 w-14 rounded-md" style={{ backgroundColor: c }} /><span className="text-[11px] text-stone-500">{k}</span></div>)}</div>
            <p className="mt-3 text-xs leading-relaxed text-stone-600">{pt ? 'Nunca mais de quatro séries: a quinta dobra-se em "Outras" ou o gráfico divide-se. A cor segue a entidade, nunca a posição. O texto nunca usa a cor da série.' : 'Never more than four series: the fifth folds into "Others" or the chart is faceted. Colour follows the entity, never its rank. Text never wears the series colour.'}</p>
          </div>
        </div>
      </DataCard>
    </div>
  );
}
