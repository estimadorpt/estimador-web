'use client';

import { useMemo, useState } from 'react';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { Segmented } from '@/components/viz/Segmented';
import { DEEMPHASIS, SERIES } from '@/components/viz/theme';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { isWhole, readCells, type ReadCell } from '@/lib/population/compact';
import { DIMENSION_LABEL, sourceLine, type Locale } from '@/lib/population/labels';
import type { ParishRecord, PopulationMeta, PortraitRecipe } from '@/types/population';
import { inScope, isLongName, ofScope, scopeSubject, THIS_PARISH, type Scope } from './place-words';

/**
 * The responses that can be drawn as 100 dots, in the order the control
 * offers them. Only questions the page does not ask the reader to guess: the
 * "65+ alone" and "generations" answers stay behind their guess cards, so this
 * section would give them away (and the work grid lives here, not twice: the
 * employment card below draws bars).
 */
const CANDIDATES: PortraitRecipe[] = ['employment'];

interface Option {
  recipe: PortraitRecipe;
  cells: ReadCell[];
  fallback: boolean;
}

/**
 * The options for "Se … fosse 100 pessoas": responses with nothing suppressed
 * (isWhole) and at most four published categories, so the dots add up to the
 * response's own whole and never draw a suppressed remainder.
 */
export function hundredOptions(record: ParishRecord, meta: PopulationMeta, locale: Locale): Option[] {
  const options: Option[] = [];
  for (const recipe of CANDIDATES) {
    const response = record.responses[recipe];
    if (!response || !isWhole(response)) continue;
    const cells = readCells(response, meta.recipes[recipe], locale).filter(cell => cell.state === 'published');
    if (cells.length === 0 || cells.length > 4) continue;
    options.push({ recipe, cells, fallback: response.decision === 'fallback' });
  }
  return options;
}

/** Dots per category by largest remainder, so they always add to 100. Only drawn, never printed. */
function dotCounts(cells: ReadCell[]): number[] {
  const raw = cells.map(cell => (cell.share ?? 0) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((value, i) => [value - floors[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) { if (left <= 0) break; floors[i] += 1; left -= 1; }
  return floors;
}

export function HundredSection({ record, meta, locale, name, fallbackName }: {
  record: ParishRecord;
  meta: PopulationMeta;
  locale: Locale;
  name: string;
  fallbackName: string | null;
}) {
  const options = useMemo(() => hundredOptions(record, meta, locale), [record, meta, locale]);
  const [selected, setSelected] = useState<PortraitRecipe | null>(null);
  const [active, setActive] = useState<number | null>(null);
  if (options.length === 0) return null;
  const option = options.find(item => item.recipe === selected) ?? options[0];
  const pt = locale === 'pt';
  const scope: Scope = option.fallback ? { name: fallbackName ?? name, municipality: true } : { name, municipality: false };
  const counts = dotCounts(option.cells);
  const dots = counts.flatMap((count, i) => Array.from({ length: count }, () => i));
  const unit = meta.recipes[option.recipe].unit;
  // A union's name already fills the h1; below it the page says "esta freguesia".
  const long = !option.fallback && isLongName(name);
  const subjectWords = long ? THIS_PARISH.subject[locale] : scopeSubject(scope, locale);
  const ofWords = long ? THIS_PARISH.of[locale] : ofScope(scope, locale);
  const inWords = long ? THIS_PARISH.in[locale] : inScope(scope, locale);

  const segments: Record<string, { label: string; heading: string; title: string; who: string }> = pt
    ? {
      employment: {
        label: 'Trabalho',
        heading: `Se ${subjectWords} fosse 100 pessoas`,
        title: 'Condição perante o trabalho',
        who: 'Em cada 100 pessoas, de todas as idades. Crianças, estudantes e reformados contam como inativos.',
      },
      elders_alone: {
        label: '65+ sozinhos',
        heading: `Se as pessoas com 65 ou mais anos ${ofWords} fossem 100`,
        title: 'Quantas vivem sozinhas?',
        who: 'Em cada 100 pessoas com 65 ou mais anos em agregados privados. Quem vive num lar não entra nesta conta.',
      },
      multigenerational: {
        label: 'Gerações',
        heading: `Se os agregados ${ofWords} fossem 100`,
        title: 'Quantos juntam uma criança e uma pessoa com 65 ou mais anos?',
        who: 'Em cada 100 agregados privados: pelo menos uma pessoa com menos de 15 anos e outra com 65 ou mais. Não são necessariamente avós e netos.',
      },
    }
    : {
      employment: {
        label: 'Work',
        heading: `If ${subjectWords} were 100 people`,
        title: 'Employment status',
        who: 'Out of every 100 people of all ages. Children, students and retired people count as inactive.',
      },
      elders_alone: {
        label: '65+ alone',
        heading: `If the people aged 65 or over ${inWords} were 100`,
        title: 'How many live alone?',
        who: 'Out of every 100 people aged 65 or over in private households. Care-home residents are not counted here.',
      },
      multigenerational: {
        label: 'Generations',
        heading: `If the households ${inWords} were 100`,
        title: 'How many bring together a child and someone aged 65 or over?',
        who: 'Out of every 100 private households: at least one person under 15 and another aged 65 or over. Not necessarily grandparents and grandchildren.',
      },
    };
  const segment = segments[option.recipe];
  const heading = segment.heading;
  // The page says once, at the top, that its figures are the parish's own; only município figures need a line here.
  const whose = option.fallback
    ? (pt ? `Valores do concelho de ${scope.name}, que inclui ${name}.` : `Figures for ${scope.name} municipality, which includes ${name}.`)
    : null;
  const readout = active === null ? null : option.cells[active];

  return (
    <section id="cem" aria-labelledby="cem-title">
      <h2 id="cem-title" className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">{heading}</h2>
      <p className="mt-1 max-w-2xl text-[15px] text-stone-600">
        {pt
          ? `Uma forma de ler as percentagens publicadas: cem pontos repartidos pelas categorias da resposta.${options.length > 1 ? ' Escolhe a pergunta.' : ''}`
          : `One way to read the published shares: a hundred dots split across the categories of the answer.${options.length > 1 ? ' Pick the question.' : ''}`}
      </p>
      <DataCard
        className="mt-4"
        title={segment.title}
        subtitle={segment.who}
        source={sourceLine(option.recipe, locale)}
        methodologyHref={POPULATION_ROUTES.methodology}
        methodologyLabel={pt ? 'Como foi feito' : 'How it was made'}
        locale={locale}
        controls={options.length > 1 ? (
          // One row on a phone: the labels never wrap inside their buttons; a narrow screen scrolls the row instead.
          <div className="-m-1 max-w-full overflow-x-auto p-1">
            <Segmented
              className="whitespace-nowrap"
              label={pt ? 'Pergunta' : 'Question'}
              value={option.recipe}
              onChange={value => { setSelected(value as PortraitRecipe); setActive(null); }}
              options={options.map(item => ({ value: item.recipe, label: segments[item.recipe].label }))}
            />
          </div>
        ) : undefined}
      >
        {whose && <p className="mb-4 text-sm text-stone-600">{whose}</p>}
        <div className="grid gap-6 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)] sm:items-center">
          <div
            role="img"
            aria-label={option.cells.map(cell => `${cell.labels.at(-1)} ${cell.display}`).join(', ')}
            className="grid w-full max-w-[320px] grid-cols-10 gap-[6px]"
            onMouseLeave={() => setActive(null)}
          >
            {dots.map((series, i) => (
              <span
                key={i}
                onMouseEnter={() => setActive(series)}
                className="aspect-square w-full rounded-full motion-safe:transition-[background-color,opacity] motion-safe:duration-200"
                style={{
                  backgroundColor: SERIES[series] ?? DEEMPHASIS,
                  opacity: active === null || active === series ? 1 : 0.22,
                }}
              />
            ))}
          </div>
          <div>
            <p className="mb-3 min-h-6 text-sm text-stone-600" aria-live="polite">
              {readout
                ? <><span className="font-semibold text-ink">{readout.labels.at(-1)}</span>: <span className="font-bold tabular-nums text-ink">{readout.display}</span></>
                : (pt ? 'Toca, passa o cursor ou foca uma categoria para a destacar.' : 'Tap, hover over or focus a category to pick it out.')}
            </p>
            <ul className="flex flex-col gap-1">
              {option.cells.map((cell, i) => (
                <li key={cell.values.join('|')}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    aria-pressed={active === i}
                    className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-2 text-left transition-colors duration-150 hover:bg-parchment"
                  >
                    <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: SERIES[i] ?? DEEMPHASIS }} aria-hidden="true" />
                    <span className="flex-1 text-[15px] text-ink">{cell.labels.at(-1)}</span>
                    <span className="font-display text-xl font-extrabold tabular-nums text-ink">{cell.display}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone-500">
              {unit === 'household'
                ? (pt ? 'Cada ponto, cerca de 1 agregado em cada 100.' : 'Each dot, about 1 household in 100.')
                : (pt ? 'Cada ponto, cerca de 1 pessoa em cada 100.' : 'Each dot, about 1 person in 100.')}
            </p>
          </div>
        </div>
        <ChartTable
          caption={`${heading}. ${segment.title}`}
          columns={[DIMENSION_LABEL[meta.recipes[option.recipe].dimensions[0]]?.[locale] ?? '', pt ? 'Percentagem' : 'Share']}
          rows={option.cells.map(cell => [cell.labels.at(-1) ?? '', cell.display])}
        />
      </DataCard>
    </section>
  );
}
