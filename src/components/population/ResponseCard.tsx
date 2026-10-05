'use client';

import { useState, type ReactNode } from 'react';
import { Link2 } from 'lucide-react';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { Mosaic } from '@/components/brand/Mosaic';
import { Link } from '@/i18n/routing';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { isWhole, readCells } from '@/lib/population/compact';
import { DIMENSION_LABEL, HONESTY, RECIPE_COPY, REASON_COPY, type Locale } from '@/lib/population/labels';
import type { CompactResponse, PopulationRecipe, PortraitRecipe } from '@/types/population';
import { AgeColumns, HundredPeople, ShareBars } from './charts';
import { QualityBadge } from './QualityBadge';

export interface ResponseCardProps {
  recipeName: PortraitRecipe;
  recipe: PopulationRecipe;
  record: CompactResponse;
  locale: Locale;
  /** The parish's display name. */
  placeName: string;
  /** The município whose figures a fallback shows. */
  fallbackName?: string | null;
  /** Hide the question (when the surrounding page already asks it, e.g. a game clue). */
  bare?: boolean;
  /** Slot above the chart, e.g. a guess-before-you-look control. */
  before?: ReactNode;
  /** Hides the chart until true (guess-first). */
  revealed?: boolean;
  className?: string;
}

/**
 * One approved response as a card: the question, who is counted, where the
 * figures are from (parish, or the município when the bundle falls back), the
 * chart, its table twin, and the source. A refused response is a designed
 * empty state with the reason and nothing that looks like a number.
 */
export function ResponseCard({ recipeName, recipe, record, locale, placeName, fallbackName, bare, before, revealed = true, className = '' }: ResponseCardProps) {
  const copy = RECIPE_COPY[recipeName];
  const cells = readCells(record, recipe, locale);
  const status = statusLine(record, locale, placeName, fallbackName);
  const anchor = copy.anchor;
  const title = bare ? copy.short[locale] : copy.question[locale];

  return (
    <div id={anchor} className={`scroll-mt-24 ${className}`}>
      {/* The footer is drawn here rather than by DataCard so the copy-link action can sit in it, out of the way of the question. */}
      <DataCard title={title} subtitle={copy.population[locale]} locale={locale}>
        {(status.badge || status.text) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {status.badge}
            {status.text && <p className="text-sm text-stone-600">{status.text}</p>}
          </div>
        )}
        {record.decision === 'refuse' ? (
          <Refused locale={locale} />
        ) : (
          <>
            {before}
            {revealed && <ResponseChart recipeName={recipeName} recipe={recipe} record={record} cells={cells} locale={locale} />}
            {revealed && (
              <ChartTable
                caption={`${copy.question[locale]} ${status.where}`}
                columns={[...recipe.dimensions.map(dimension => DIMENSION_LABEL[dimension]?.[locale] ?? dimension), locale === 'pt' ? 'Percentagem' : 'Share']}
                rows={cells.map(cell => [...cell.labels, cell.display])}
              />
            )}
          </>
        )}
        <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-stone-500">
          <span>{HONESTY.source[locale]}</span>
          <Link href={POPULATION_ROUTES.methodology} locale={locale} className="font-semibold text-ink underline-offset-4 hover:underline">
            {locale === 'pt' ? 'Como foi feito' : 'How it was made'}
          </Link>
          {!bare && <CopyAnchor anchor={anchor} locale={locale} />}
        </footer>
      </DataCard>
    </div>
  );
}

function statusLine(record: CompactResponse, locale: Locale, placeName: string, fallbackName?: string | null) {
  if (record.decision === 'refuse') {
    return {
      badge: <QualityBadge kind="refused" locale={locale} />,
      text: REASON_COPY.use_municipio_or_wait_for_v1_1[locale],
      where: placeName,
    };
  }
  if (record.decision === 'fallback') {
    const name = fallbackName ?? (locale === 'pt' ? 'concelho' : 'municipality');
    return {
      badge: <QualityBadge kind="municipality" locale={locale} label={locale === 'pt' ? `Concelho de ${name}` : `${name} municipality`} />,
      text: locale === 'pt'
        ? `Valores do concelho, que inclui ${placeName}. ${REASON_COPY.joint_not_publication_grade.pt}`
        : `Figures for the municipality, which includes ${placeName}. ${REASON_COPY.joint_not_publication_grade.en}`,
      where: locale === 'pt' ? `(concelho de ${name})` : `(${name} municipality)`,
    };
  }
  // Every v1.0.1 answer is the parish's own: the page states that and the tier
  // once, at the top, so a published card carries no status line of its own.
  return { badge: null, text: null, where: `(${placeName})` };
}

/** The chart a response gets: the same choice on the parish page and in the game's clues. */
export function ResponseChart({ recipeName, recipe, record, cells, locale }: {
  recipeName: PortraitRecipe;
  recipe: PopulationRecipe;
  record: CompactResponse;
  cells: ReturnType<typeof readCells>;
  locale: Locale;
}) {
  if (recipeName === 'age') return <AgeColumns cells={cells} locale={locale} />;
  if (recipeName === 'who_lives_alone') {
    // Row-normalised: each age band has its own percentages.
    const bands = new Map<string, typeof cells>();
    for (const cell of cells) bands.set(cell.labels[0], [...(bands.get(cell.labels[0]) ?? []), cell]);
    return (
      <div className="grid gap-5 sm:grid-cols-3">
        {[...bands.entries()].map(([band, rows]) => (
          <div key={band}>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{band}</h4>
            <ShareBars cells={rows} locale={locale} stacked />
          </div>
        ))}
      </div>
    );
  }
  const whole = isWhole(record) && cells.filter(cell => cell.state === 'published').length <= 4;
  if (whole && (recipeName === 'elders_alone' || recipeName === 'multigenerational' || recipeName === 'employment')) {
    return <HundredPeople cells={cells.filter(cell => cell.state !== 'absent')} locale={locale} unit={recipe.unit === 'household' ? 'households' : 'people'} />;
  }
  return <ShareBars cells={cells} locale={locale} />;
}

function Refused({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-parchment p-4">
      <Mosaic variant="corner" className="h-14 w-14 shrink-0" />
      <p className="text-sm text-stone-600">
        {locale === 'pt'
          ? 'Sem resposta publicada para esta freguesia na versão 1.0. Não mostramos um número que não passou o controlo de qualidade.'
          : 'No published answer for this parish in release 1.0. We do not show a number that did not pass the quality check.'}
      </p>
    </div>
  );
}

function CopyAnchor({ anchor, locale }: { anchor: string; locale: Locale }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          window.location.hash = anchor;
        }
      }}
      className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-ink"
    >
      <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
      {copied ? (locale === 'pt' ? 'Ligação copiada' : 'Link copied') : (locale === 'pt' ? 'Copiar ligação' : 'Copy link')}
    </button>
  );
}
