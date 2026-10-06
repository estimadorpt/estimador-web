'use client';

import { useState, type ReactNode } from 'react';
import { Link2 } from 'lucide-react';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { TextLink } from '@/components/brand/TextLink';
import { methodologyAnchorForRecipe } from '@/components/population/quality/anchors';
import { POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import { isWhole, readCells } from '@/lib/population/compact';
import { DIMENSION_LABEL, RECIPE_CAVEAT, RECIPE_COPY, REASON_COPY, sourceLine, type Locale } from '@/lib/population/labels';
import { responsePermalink } from '@/lib/population/permalink';
import type { CompactResponse, PopulationRecipe, PortraitRecipe } from '@/types/population';
import { AgeColumns, HundredPeople, ShareBars } from './charts';
import { emptyBand, groupByBand, NOBODY_ALONE, twinRows } from './twin-rows';
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
  /** The reader's guess (0–100), outlined on the 100 dots once revealed (guess-first, VUXD-07). */
  guess?: number;
  /** Draw the shares as bars even where a 100-dot grid would fit (the page already has that grid). */
  bars?: boolean;
  /** Briefly marks the card a shared link pointed to. */
  highlight?: boolean;
  /**
   * The place the figures are for, as a line at the top of the card: a shared
   * link lands on one card with the page's title scrolled away, and a
   * screenshot of it must still say where the figures are from (PRO3-V01).
   * Shown on the parish's own figures only.
   */
  place?: string;
  className?: string;
}

/**
 * One approved response as a card: the question, who is counted, where the
 * figures are from (parish, or the município when the bundle falls back), the
 * chart, its table twin, the source (how the field was made) and a versioned
 * link to the response. A refused response is a designed empty state with the
 * reason and nothing that looks like a number.
 */
export function ResponseCard({ recipeName, recipe, record, locale, placeName, fallbackName, bare, before, revealed = true, guess, bars = false, highlight = false, place, className = '' }: ResponseCardProps) {
  const copy = RECIPE_COPY[recipeName];
  const cells = readCells(record, recipe, locale);
  const status = statusLine(record, locale, placeName, fallbackName);
  const anchor = copy.anchor;
  const title = bare ? copy.short[locale] : copy.question[locale];
  const caveat = RECIPE_CAVEAT[recipeName]?.[locale];

  return (
    <div
      id={anchor}
      data-rail
      className={`rounded-2xl outline-offset-4 motion-safe:transition-[outline-color] motion-safe:duration-300 ${highlight ? 'outline-2 outline-ink outline-solid' : 'outline-2 outline-transparent outline-solid'} ${className}`}
    >
      {/* The footer is drawn here rather than by DataCard so the copy-link action can sit in it, out of the way of the question. */}
      <DataCard title={title} subtitle={copy.population[locale]} locale={locale}>
        {/* Only on the parish's own figures: a município fallback names its município in the status line. */}
        {place && record.decision === 'publish' && <p className="-mt-1 mb-4 text-xs font-semibold leading-relaxed text-stone-600">{place}</p>}
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
            {revealed && <ResponseChart recipeName={recipeName} recipe={recipe} record={record} cells={cells} locale={locale} bars={bars} guess={guess} />}
            {revealed && (
              <ChartTable
                caption={`${copy.question[locale]} ${status.where}`}
                columns={[...recipe.dimensions.map(dimension => DIMENSION_LABEL[dimension]?.[locale] ?? dimension), locale === 'pt' ? 'Percentagem' : 'Share']}
                rows={twinRows(recipeName, cells, locale)}
              />
            )}
          </>
        )}
        {/* A caveat we owe a correction for (POP3-ACC-01): set apart from the source line, in the caveat colour. */}
        {caveat && record.decision !== 'refuse' && (
          <p role="note" className="mt-4 border-l-2 border-amber-500 pl-3 text-xs leading-relaxed text-stone-700">{caveat}</p>
        )}
        <CardFooter source={sourceLine(recipeName, locale, { withCaveat: false })} id={bare ? null : record.id} question={copy.question[locale]} recipe={recipeName} locale={locale} />
      </DataCard>
    </div>
  );
}

/**
 * A card's footer, in the same two rows on every card whatever the source's
 * length (UXD2-12): the source sentence on its own; then "Como foi feito",
 * which opens the methodology at the row of the field this card groups or
 * derives and names the card's question to a screen reader (MR2-10,
 * PRO2-11), on the left, and the release with the full result id (the one a
 * permalink resolves, PRO2-01) and "Copiar link" on the right.
 */
export function CardFooter({ source, id, question, recipe, locale }: { source: string; id: string | null; question: string; recipe: string; locale: Locale }) {
  return (
    <footer className="mt-4 border-t border-line pt-2 text-xs text-stone-500">
      <p className="pt-1">{source}</p>
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <TextLink href={`${POPULATION_ROUTES.methodology}#${methodologyAnchorForRecipe(recipe, locale)}`} locale={locale}>
          {locale === 'pt' ? 'Como foi feito' : 'How it was made'}
          <span className="sr-only">: {question}</span>
        </TextLink>
        {id && (
          <span className="inline-flex flex-wrap items-center justify-end gap-x-3">
            <span className="font-mono text-[11px] text-stone-500 [overflow-wrap:anywhere]">v{POPULATION_RELEASE} · {id}</span>
            <CopyPermalink id={id} question={question} locale={locale} />
          </span>
        )}
      </div>
    </footer>
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
  // Every answer since v1.0.1 is the parish's own: the page states that and the tier
  // once, at the top, so a published card carries no status line of its own.
  return { badge: null, text: null, where: `(${placeName})` };
}

/**
 * "Quem vive sozinho trabalha?": each age band has its own percentages. A band
 * with nobody living alone in it has every share at zero: it gets a sentence
 * instead of three empty bars, and one row in the table twin.
 */
function AloneByAge({ cells, locale }: { cells: ReturnType<typeof readCells>; locale: Locale }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {[...groupByBand(cells).entries()].map(([band, rows]) => {
        const nobody = emptyBand(rows);
        return (
          <div key={band}>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{band}</h4>
            {nobody ? (
              <p className="rounded-xl bg-parchment px-3 py-2.5 text-sm text-stone-600">{NOBODY_ALONE[locale]}</p>
            ) : (
              <ShareBars cells={rows} locale={locale} stacked />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The chart a response gets: the same choice on the parish page and in the game's clues. */
export function ResponseChart({ recipeName, recipe, record, cells, locale, bars = false, guess, compact = false }: {
  recipeName: PortraitRecipe;
  recipe: PopulationRecipe;
  record: CompactResponse;
  cells: ReturnType<typeof readCells>;
  locale: Locale;
  bars?: boolean;
  /** The reader's guess, outlined on the 100 dots (guess-first cards only). */
  guess?: number;
  /** A shorter age chart with no hint line and a smaller dot grid: the game's clue on a phone, where the four choices must stay close. */
  compact?: boolean;
}) {
  if (recipeName === 'age') return <AgeColumns cells={cells} locale={locale} height={compact ? 160 : 200} hint={!compact} />;
  if (recipeName === 'who_lives_alone') return <AloneByAge cells={cells} locale={locale} />;
  const whole = isWhole(record) && cells.filter(cell => cell.state === 'published').length <= 4;
  if (!bars && whole && (recipeName === 'elders_alone' || recipeName === 'multigenerational' || recipeName === 'employment')) {
    return <HundredPeople cells={cells.filter(cell => cell.state !== 'absent')} locale={locale} unit={recipe.unit === 'household' ? 'households' : 'people'} guess={guess} compact={compact} />;
  }
  return <ShareBars cells={cells} locale={locale} />;
}

function Refused({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-parchment p-4">
      <EmptyStateMark surface="parchment" />
      <p className="text-sm text-stone-600">
        {locale === 'pt'
          ? 'Sem resposta publicada para esta freguesia na versão 1.0. Não mostramos um número que não passou o controlo de qualidade.'
          : 'No published answer for this parish in release 1.0. We do not show a number that did not pass the quality check.'}
      </p>
    </div>
  );
}

/**
 * Copies the response's versioned link (/populacao/v/{release}/q/{id}): it
 * names the release and resolves to this card on its parish page. The button
 * names its card for a screen reader, and the result is announced.
 */
function CopyPermalink({ id, question, locale }: { id: string; question: string; locale: Locale }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const pt = locale === 'pt';
  const url = () => responsePermalink(window.location.origin, locale, id);
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      <span role="status" className="text-xs text-stone-600">
        {state === 'copied' ? (pt ? 'Link copiado.' : 'Link copied.') : state === 'failed' ? url() : ''}
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url());
            setState('copied');
            window.setTimeout(() => setState('idle'), 2400);
          } catch {
            setState('failed');
          }
        }}
        className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-ink"
      >
        <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
        {pt ? 'Copiar link' : 'Copy link'}
        <span className="sr-only">{pt ? ` para «${question}»` : ` to “${question}”`}</span>
      </button>
    </span>
  );
}
