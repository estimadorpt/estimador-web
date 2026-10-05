'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { Mosaic } from '@/components/brand/Mosaic';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { isWhole, readCells } from '@/lib/population/compact';
import { CLUE_ORDER } from '@/lib/population/game';
import { DIMENSION_LABEL, HONESTY, RECIPE_COPY, type Locale } from '@/lib/population/labels';
import type { CompactResponse, GameEntry, PopulationMeta, PortraitRecipe } from '@/types/population';
import { AgeColumns, HundredPeople, ShareBars } from '../charts';
import { QualityBadge } from '../QualityBadge';
import { GAME_COPY } from './copy';
import { Reveal } from './Reveal';

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
 * The hidden parish's own published charts, one clue per miss. While the
 * game runs nothing on a card names the place, its code, its tier or its
 * município; the numbers keep their published form ("Suprimido", "—").
 */
export function ClueDeck({ entry, meta, locale, open, revealed }: ClueDeckProps) {
  const t = GAME_COPY[locale];
  const id = useId();
  const [selected, setSelected] = useState(open - 1);
  const [fresh, setFresh] = useState<number | null>(null);
  // The clues on the board when the page arrives do not animate in (published
  // numbers stay still); a clue opened by a miss or picked from the tabs does.
  const [moved, setMoved] = useState(false);
  const previous = useRef(open);
  const deck = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open > previous.current) {
      setSelected(open - 1);
      setMoved(true);
      // A new clue after a miss: say so, and bring it into view on a small screen.
      if (revealed) setFresh(null);
      else {
        setFresh(open - 1);
        const top = deck.current?.getBoundingClientRect().top ?? 0;
        if (top < 0) deck.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
    }
    previous.current = open;
  }, [open, revealed]);

  useEffect(() => {
    setSelected(open - 1);
    setFresh(null);
    setMoved(false);
    previous.current = open;
    // A different day: start from its newest open clue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.code]);

  const recipes = CLUE_ORDER[selected] ?? CLUE_ORDER[0];

  return (
    <div ref={deck} className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl text-ink md:text-2xl">{t.cluesTitle}</h2>
        <p className="text-xs text-stone-500">{HONESTY.synthetic[locale]} · {t.sourceStamp}</p>
      </div>

      <div role="tablist" aria-label={t.cluesTitle} className="mb-4 grid grid-cols-6 gap-1.5 sm:gap-2">
        {CLUE_ORDER.map((clueRecipes, i) => {
          const unlocked = i < open;
          const active = i === selected;
          const label = clueRecipes.map(r => RECIPE_COPY[r].short[locale]).join(' · ');
          return (
            <button
              key={i}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-controls={`${id}-panel`}
              aria-selected={active}
              aria-disabled={!unlocked}
              disabled={!unlocked}
              title={unlocked ? label : t.clueLocked(i)}
              onClick={() => { setSelected(i); setFresh(null); setMoved(true); }}
              className={`relative flex min-h-12 flex-col items-center justify-center rounded-[10px] border text-[15px] font-extrabold tabular-nums transition-colors duration-150 ${
                active
                  ? 'border-ink bg-ink text-paper'
                  : unlocked
                    ? 'border-line bg-cream text-ink hover:bg-parchment'
                    : 'cursor-not-allowed border-dashed border-line bg-parchment text-stone-500'
              }`}
            >
              {unlocked ? i + 1 : <Lock aria-hidden="true" className="h-4 w-4" />}
              <span className="sr-only">{unlocked ? `${t.clue(i + 1)}: ${label}` : `${t.clue(i + 1)}: ${t.clueLocked(i)}`}</span>
              {fresh === i && !active && <span aria-hidden="true" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-coral" />}
            </button>
          );
        })}
      </div>

      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${selected}`}>
        <Reveal key={`${entry.code}-${selected}`} instant={!moved}>
          <ClueCard
            number={selected + 1}
            recipes={recipes}
            entry={entry}
            meta={meta}
            locale={locale}
            revealed={revealed}
            fresh={fresh === selected}
          />
        </Reveal>
      </div>
    </div>
  );
}

function ClueCard({ number, recipes, entry, meta, locale, revealed, fresh }: {
  number: number;
  recipes: readonly PortraitRecipe[];
  entry: GameEntry;
  meta: PopulationMeta;
  locale: Locale;
  revealed: ClueDeckProps['revealed'];
  fresh: boolean;
}) {
  const t = GAME_COPY[locale];
  const single = recipes.length === 1;
  const title = `${t.clue(number)} · ${recipes.map(r => RECIPE_COPY[r].short[locale]).join(locale === 'pt' ? ' e ' : ' and ')}`;
  return (
    <DataCard
      title={title}
      subtitle={single ? RECIPE_COPY[recipes[0]].population[locale] : undefined}
      badge={fresh ? t.newClue : undefined}
      source={HONESTY.source[locale]}
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
            <Clue recipe={recipe} record={entry.responses[recipe]} meta={meta} locale={locale} revealed={revealed} tier={entry.tier} />
          </div>
        ))}
      </div>
    </DataCard>
  );
}

function Clue({ recipe, record, meta, locale, revealed, tier }: {
  recipe: PortraitRecipe;
  record: CompactResponse | undefined;
  meta: PopulationMeta;
  locale: Locale;
  revealed: ClueDeckProps['revealed'];
  tier: 'A' | 'B';
}) {
  const t = GAME_COPY[locale];
  const definition = meta.recipes[recipe];
  if (!record || !definition || record.decision === 'refuse') {
    return (
      <div className="flex items-center gap-4 rounded-xl bg-parchment p-4">
        <Mosaic variant="corner" className="h-14 w-14 shrink-0" />
        <p className="text-sm text-stone-600">{t.refused}</p>
      </div>
    );
  }
  const cells = readCells(record, definition, locale);
  const status = record.decision === 'fallback'
    ? (revealed ? t.fallbackNamed(revealed.municipalityName) : t.fallbackHidden)
    : (revealed ? t.answerFigures(revealed.name) : t.mysteryFigures);
  const where = revealed ? revealed.name : t.locatorAnswer;
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {record.decision === 'fallback' && <QualityBadge kind="municipality" locale={locale} />}
        {record.decision === 'publish' && revealed && <QualityBadge kind={record.resolved_tier === 'A' || record.resolved_tier === 'B' ? record.resolved_tier : tier} locale={locale} />}
        <p className="text-sm text-stone-600">{status}</p>
      </div>
      <ClueChart recipe={recipe} record={record} cells={cells} locale={locale} unit={definition.unit} />
      <ChartTable
        caption={`${RECIPE_COPY[recipe].question[locale]} (${where})`}
        columns={[...definition.dimensions.map(d => DIMENSION_LABEL[d]?.[locale] ?? d), locale === 'pt' ? 'Percentagem' : 'Share']}
        rows={cells.map(cell => [...cell.labels, cell.display])}
      />
    </>
  );
}

/** The same chart choice as the parish page's ResponseCard. */
function ClueChart({ recipe, record, cells, locale, unit }: {
  recipe: PortraitRecipe;
  record: CompactResponse;
  cells: ReturnType<typeof readCells>;
  locale: Locale;
  unit: 'person' | 'household';
}) {
  if (recipe === 'age') return <AgeColumns cells={cells} locale={locale} />;
  const whole = isWhole(record) && cells.filter(cell => cell.state === 'published').length <= 4;
  if (whole && (recipe === 'elders_alone' || recipe === 'multigenerational' || recipe === 'employment')) {
    return <HundredPeople cells={cells.filter(cell => cell.state !== 'absent')} locale={locale} unit={unit === 'household' ? 'households' : 'people'} />;
  }
  return <ShareBars cells={cells} locale={locale} />;
}
