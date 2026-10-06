'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { Lock } from 'lucide-react';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { readCells } from '@/lib/population/compact';
import { CLUE_ORDER } from '@/lib/population/game';
import { DIMENSION_LABEL, HONESTY, RECIPE_COPY, sourceLine, type Locale } from '@/lib/population/labels';
import type { CompactResponse, GameEntry, PopulationMeta, PortraitRecipe } from '@/types/population';
import { ResponseChart } from '../ResponseCard';
import { QualityBadge } from '../QualityBadge';
import { GAME_COPY } from './copy';
import { Reveal } from './Reveal';

/** Below Tailwind's sm: the phone layout, where the clue is kept short so the four choices follow it on one screen. */
const NARROW = '(max-width: 639px)';
const subscribeNarrow = (change: () => void) => {
  const query = window.matchMedia(NARROW);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};
const useNarrow = () => useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);

interface ClueDeckProps {
  entry: GameEntry;
  meta: PopulationMeta;
  locale: Locale;
  /** How many clues are open (1–6). */
  open: number;
  /** The parish and its município, once the game is over; null while it is a mystery. */
  revealed: { name: string; municipalityName: string } | null;
}

/**
 * The hidden parish's own published charts: one open at the start, one more
 * per wrong pick or "next clue". While the game runs nothing on a card names
 * the place, its code, its tier or its município; the numbers keep their
 * published form ("Suprimido", "—"). Only the mystery parish's figures are
 * shown: the other three on the board are names and places, never numbers.
 */
export function ClueDeck({ entry, meta, locale, open, revealed }: ClueDeckProps) {
  const t = GAME_COPY[locale];
  const id = useId();
  const [selected, setSelected] = useState(open - 1);
  const [fresh, setFresh] = useState<number | null>(null);
  // The clues on the board when the page arrives do not animate in (published
  // numbers stay still); a clue opened by a pick or picked from the tabs does.
  const [moved, setMoved] = useState(false);
  const previous = useRef(open);
  /** Set when the player opened a clue (a wrong pick, or "next clue"): its heading takes focus once drawn. */
  const focusNew = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const narrow = useNarrow();

  useEffect(() => {
    if (open > previous.current) {
      setSelected(open - 1);
      setMoved(true);
      // A new clue after a wrong pick or "next clue": say so, and move focus to it.
      if (revealed) setFresh(null);
      else {
        setFresh(open - 1);
        focusNew.current = true;
      }
    } else if (open < previous.current) {
      // Fewer clues than before (the same day played again, in practice): never
      // stay on a clue that is locked again; start from the newest open one.
      setSelected(open - 1);
      setFresh(null);
      setMoved(false);
    }
    previous.current = open;
  }, [open, revealed]);

  // Once the game is over nothing is "new": the badge from the last miss goes.
  useEffect(() => {
    if (revealed) setFresh(null);
  }, [revealed]);

  useEffect(() => {
    setSelected(open - 1);
    setFresh(null);
    setMoved(false);
    previous.current = open;
    // A different day: start from its newest open clue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.code]);

  // A locked clue is never on show, whatever the order of the updates above.
  const shown = Math.min(selected, open - 1);
  const recipes = CLUE_ORDER[shown] ?? CLUE_ORDER[0];
  const titleId = `${id}-clue-title`;

  // The clue just opened is drawn: its heading takes focus, so focus never
  // falls to the page when a pick disables its button or "next clue" goes. The
  // clue's card goes to the top of the screen (under the sticky header), so on
  // a phone the new clue and the four choices under it are in view together,
  // instead of the browser centring the heading and leaving the choices a
  // scroll away (GAME-V2-02). Below lg only, where the four follow the clue.
  useEffect(() => {
    if (!focusNew.current || shown !== open - 1) return;
    const frame = window.requestAnimationFrame(() => {
      focusNew.current = false;
      const heading = document.getElementById(titleId);
      // From lg the four sit beside the clue, and the browser's own scroll to the heading keeps both in view.
      if (!window.matchMedia('(max-width: 1023px)').matches) { heading?.focus(); return; }
      heading?.focus({ preventScroll: true });
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      panel.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [shown, open, titleId]);

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl text-ink md:text-2xl">{t.cluesTitle}</h2>
        {/* Said once for the deck: every published clue is the parish's own figures. A município fallback says so on its own clue. */}
        <p className="text-xs text-stone-500 sm:text-right">
          {revealed ? t.answerFigures(revealed.name) : t.mysteryFigures} {HONESTY.synthetic[locale]} · {t.sourceStamp}
        </p>
      </div>

      {/* Plain buttons that say which clue is on show (aria-pressed): a tab list would promise arrow-key moves. */}
      <div role="group" aria-label={t.cluesTitle} className="mb-4 grid grid-cols-6 gap-1.5 sm:gap-2">
        {CLUE_ORDER.map((clueRecipes, i) => {
          const unlocked = i < open;
          const active = i === shown;
          const label = clueRecipes.map(r => RECIPE_COPY[r].short[locale]).join(' · ');
          return (
            <button
              key={i}
              type="button"
              id={`${id}-tab-${i}`}
              aria-controls={`${id}-panel`}
              aria-pressed={active}
              disabled={!unlocked}
              title={unlocked ? label : t.clueLocked}
              onClick={() => { setSelected(i); setFresh(null); setMoved(true); }}
              className={`relative flex min-h-12 flex-col items-center justify-center rounded-[10px] border text-[15px] font-extrabold tabular-nums transition-colors duration-150 ${
                active
                  ? 'border-ink bg-ink text-paper'
                  : unlocked
                    ? 'border-line bg-cream text-ink hover:bg-parchment'
                    : 'cursor-not-allowed border-dashed border-line bg-parchment text-stone-500'
              }`}
            >
              {/* The numeral is for the eye; the sr-only line names the clue, so it is not read twice ("1 Pista 1", A11Y3-08). */}
              {unlocked ? <span aria-hidden="true">{i + 1}</span> : <Lock aria-hidden="true" className="h-4 w-4" />}
              <span className="sr-only">{unlocked ? `${t.clue(i + 1)}: ${label}` : `${t.clue(i + 1)}: ${t.clueLocked}`}</span>
              {fresh === i && !active && <span aria-hidden="true" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-coral" />}
            </button>
          );
        })}
      </div>

      <div ref={panel} id={`${id}-panel`} role="region" aria-labelledby={`${id}-tab-${shown}`}>
        <Reveal key={`${entry.code}-${shown}`} instant={!moved}>
          <ClueCard
            number={shown + 1}
            recipes={recipes}
            entry={entry}
            meta={meta}
            locale={locale}
            revealed={revealed}
            fresh={fresh === shown}
            titleId={titleId}
            compact={narrow}
          />
        </Reveal>
      </div>
    </div>
  );
}

function ClueCard({ number, recipes, entry, meta, locale, revealed, fresh, titleId, compact }: {
  number: number;
  recipes: readonly PortraitRecipe[];
  entry: GameEntry;
  meta: PopulationMeta;
  locale: Locale;
  revealed: ClueDeckProps['revealed'];
  fresh: boolean;
  titleId: string;
  compact: boolean;
}) {
  const t = GAME_COPY[locale];
  const single = recipes.length === 1;
  // "Pista 6 · Pessoas com 65+ que vivem sozinhas e agregados com…": one sentence, so only its first label keeps the capital.
  const title = `${t.clue(number)} · ${recipes.map((r, i) => {
    const label = RECIPE_COPY[r].short[locale];
    return i === 0 ? label : label.charAt(0).toLowerCase() + label.slice(1);
  }).join(locale === 'pt' ? ' e ' : ' and ')}`;
  return (
    <DataCard
      title={title}
      titleId={titleId}
      subtitle={single ? RECIPE_COPY[recipes[0]].population[locale] : undefined}
      badge={fresh ? t.newClue : undefined}
      source={sourceLine(recipes[0], locale)}
      methodologyHref={POPULATION_ROUTES.methodology}
      methodologyLabel={locale === 'pt' ? 'Como foi feito' : 'How it was made'}
      locale={locale}
    >
      <div className={single ? '' : 'grid gap-6 md:grid-cols-2'}>
        {recipes.map(recipe => (
          <div key={recipe} className="min-w-0">
            {!single && (
              <>
                <h4 className="text-base font-bold text-ink">{RECIPE_COPY[recipe].short[locale]}</h4>
                <p className="mb-3 mt-0.5 text-sm text-stone-500">{RECIPE_COPY[recipe].population[locale]}</p>
              </>
            )}
            <Clue recipe={recipe} record={entry.responses[recipe]} meta={meta} locale={locale} revealed={revealed} compact={compact} />
          </div>
        ))}
      </div>
    </DataCard>
  );
}

function Clue({ recipe, record, meta, locale, revealed, compact }: {
  recipe: PortraitRecipe;
  record: CompactResponse | undefined;
  meta: PopulationMeta;
  locale: Locale;
  revealed: ClueDeckProps['revealed'];
  compact: boolean;
}) {
  const t = GAME_COPY[locale];
  const definition = meta.recipes[recipe];
  if (!record || !definition || record.decision === 'refuse') {
    return (
      <div className="flex items-center gap-4 rounded-xl bg-parchment p-4">
        <EmptyStateMark surface="parchment" />
        <p className="text-sm text-stone-600">{t.refused}</p>
      </div>
    );
  }
  const cells = readCells(record, definition, locale);
  const where = revealed ? revealed.name : t.locatorAnswer;
  return (
    <>
      {record.decision === 'fallback' && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <QualityBadge kind="municipality" locale={locale} />
          <p className="text-sm text-stone-600">{revealed ? t.fallbackNamed(revealed.municipalityName) : t.fallbackHidden}</p>
        </div>
      )}
      <ResponseChart recipeName={recipe} recipe={definition} record={record} cells={cells} locale={locale} compact={compact} />
      <ChartTable
        caption={`${RECIPE_COPY[recipe].question[locale]} (${where})`}
        columns={[...definition.dimensions.map(d => DIMENSION_LABEL[d]?.[locale] ?? d), locale === 'pt' ? 'Percentagem' : 'Share']}
        rows={cells.map(cell => [...cell.labels, cell.display])}
      />
    </>
  );
}
