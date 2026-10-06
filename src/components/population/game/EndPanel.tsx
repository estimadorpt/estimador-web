'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, RotateCcw, Share2 } from 'lucide-react';
import { Action } from '@/components/brand/Action';
import { Disclosure } from '@/components/viz/Disclosure';
import { ACCENT, FURNITURE } from '@/components/viz/theme';
import { formatCount } from '@/lib/population/format';
import { CLUE_COUNT, formatCountdown, msUntilNextLisbonMidnight, type GameRecord, type GameStats, type ShareMessage } from '@/lib/population/game';
import { regionTitle, type Parish } from '@/lib/population/places';
import { tierMeaningFor, type Locale } from '@/lib/population/labels';
import type { GameIndex } from '@/types/population';
import { ParishLink } from '../ParishLink';
import { QualityBadge } from '../QualityBadge';
import { ofMunicipality } from '../parish/place-words';
import { GAME_COPY } from './copy';
import { Locator } from './Locator';

const SECONDARY = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-line bg-cream px-5 text-[15px] font-semibold leading-none text-ink transition-colors duration-150 hover:bg-parchment';

/**
 * The end of a game: the parish named, then straight away the share button and
 * a link to its portrait (UXD3-13, PUB3-03), then its quality tier in one plain
 * line with the meaning behind "Porquê?", then the map with the four (the
 * answer ringed, the wrong picks crossed) and the player's stats.
 * "Copied" shows in the share button itself, where the reader is looking (PUB3-08).
 */
export function EndPanel({ record, answer, choices, ruledOut, tier, errors, stats, share, index, locale, practice, onReplay }: {
  record: GameRecord;
  answer: Parish;
  /** The four, in the order of the list. */
  choices: Parish[];
  ruledOut: ReadonlySet<string>;
  tier: 'A' | 'B' | 'C';
  errors: number;
  stats: GameStats;
  share: ShareMessage;
  index: GameIndex;
  locale: Locale;
  practice: boolean;
  /** Play the same day again as practice (not stored, not counted); null while already replaying. */
  onReplay?: (() => void) | null;
}) {
  const t = GAME_COPY[locale];
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const geography = index.geography as { source_license_url?: string; source_url?: string };

  // The clipboard gets one line of text; a share sheet gets the address as its own link.
  const shareBlock = `${share.text} ${share.url}`;
  const onShare = async () => {
    try {
      const touch = window.matchMedia('(pointer: coarse)').matches;
      if (touch && typeof navigator.share === 'function') {
        await navigator.share({ title: share.title, text: share.text, url: share.url });
        return;
      }
      await navigator.clipboard.writeText(shareBlock);
      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 2400);
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(shareBlock);
        setShareState('copied');
        window.setTimeout(() => setShareState('idle'), 2400);
      } catch {
        setShareState('failed');
      }
    }
  };

  return (
    <section aria-labelledby="misteriosa-end" className="rounded-2xl border border-line bg-cream p-5 md:p-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:gap-8">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{t.wonKicker(record.cluesOpened, errors)}</p>
          {/* Focus lands here when a pick ends the game (MysteryGame), so the result is the next thing read. */}
          <h2 id="misteriosa-end" tabIndex={-1} className="mt-2 text-base font-bold text-stone-600 outline-none">{t.revealHeading}</h2>
          <p className="mt-1 font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl md:text-4xl">{answer.name}</p>
          <p className="mt-1 text-[15px] text-stone-600">
            {locale === 'pt' ? `Concelho ${ofMunicipality(answer.municipalityName)}` : `${answer.municipalityName} municipality`} · {regionTitle(answer.region, answer.regionName, locale)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Action onClick={onShare}>
              {shareState === 'copied' ? <Check aria-hidden="true" className="h-4 w-4" /> : <Share2 aria-hidden="true" className="h-4 w-4" />}
              {shareState === 'copied' ? t.copied : t.share}
            </Action>
            <ParishLink code={answer.code} locale={locale} className={SECONDARY}>
              {t.seePortrait}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </ParishLink>
            {onReplay && (
              <button type="button" onClick={onReplay} className="inline-flex min-h-12 items-center gap-2 px-1 text-[15px] font-semibold text-ink underline underline-offset-4">
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                {t.replay}
              </button>
            )}
          </div>
          {/* Spoken either way; seen only on a failure (the button itself says "copied"). */}
          <p className={shareState === 'failed' ? 'mt-2 text-sm text-stone-600' : 'sr-only'} aria-live="polite">
            {shareState === 'copied' ? t.copied : shareState === 'failed' ? t.shareFailed : ''}
          </p>
          {shareState === 'failed' && (
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-parchment p-3 font-sans text-sm text-ink">{shareBlock}</pre>
          )}

          {/* The tier, stated once, in one plain line; what it means, one tap away. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-600">
            <QualityBadge kind={tier} locale={locale} />
            <span>{t.tierShort[tier]}</span>
          </div>
          <Disclosure className="mt-1" summary={t.tierWhy}>
            <p className="max-w-2xl pb-1 text-sm leading-relaxed text-stone-600">{tierMeaningFor(tier, answer.publicationPopulation, answer.censusPopulation)[locale]}</p>
          </Disclosure>
          <p className="mt-1 text-sm text-stone-600">{t.residents}: <strong className="tabular-nums text-ink">{formatCount(answer.censusPopulation, locale)}</strong></p>
        </div>

        <div className="min-w-0">
          <Locator choices={choices} ruledOut={ruledOut} answer={answer} locale={locale} withKey className="bg-paper" />
        </div>
      </div>

      <Stats stats={stats} locale={locale} highlight={!practice ? record.cluesOpened : null} countdown={!practice} />

      <div className="mt-6 border-t border-line pt-4 text-sm text-stone-600">
        <p>{locale === 'pt' ? index.honesty.message_pt : index.honesty.message_en}</p>
        <p className="mt-1 text-xs text-stone-500">
          {t.attribution}{' '}
          <a href={geography.source_license_url ?? 'https://creativecommons.org/licenses/by/4.0/'} className="font-semibold text-ink underline underline-offset-2">CC BY 4.0</a>
          {geography.source_url && <> · <a href={geography.source_url} className="font-semibold text-ink underline underline-offset-2">CAOP</a></>}
        </p>
      </div>
    </section>
  );
}

function Countdown({ locale }: { locale: Locale }) {
  const t = GAME_COPY[locale];
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilNextLisbonMidnight(new Date()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <p className="rounded-xl bg-parchment px-4 py-3 text-sm text-stone-600">
      {t.next}{' '}
      <strong className="font-display text-lg font-extrabold tabular-nums text-ink" suppressHydrationWarning>{ms === null ? '··:··:··' : formatCountdown(ms)}</strong>
    </p>
  );
}

function Stats({ stats, locale, highlight, countdown }: { stats: GameStats; locale: Locale; highlight: number | null; countdown: boolean }) {
  const t = GAME_COPY[locale];
  const tiles: Array<[string, number]> = [
    [t.played, stats.played],
    [t.currentStreak, stats.currentStreak],
  ];
  const top = Math.max(1, ...stats.distribution);
  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="text-base font-bold text-ink">{t.statsTitle}</h3>
      <p className="text-xs text-stone-500">{t.statsNote}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,18rem)]">
        <dl className="grid grid-cols-2 gap-2 sm:w-56">
          {tiles.map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col-reverse rounded-xl border border-line bg-paper px-2 py-2.5 text-center">
              <dt className="mt-0.5 text-[11px] font-semibold leading-tight text-stone-500">{label}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <table className="w-full border-collapse text-sm">
          <caption className="mb-1 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500">{t.distributionTitle}</caption>
          <tbody>
            {stats.distribution.slice(0, CLUE_COUNT).map((value, i) => (
              <tr key={i}>
                <th scope="row" className="w-20 py-0.5 pr-2 text-left text-xs font-semibold tabular-nums text-ink">{t.distributionRow(i + 1)}</th>
                <td className="py-0.5">
                  <span className="flex items-center gap-2">
                    <span className="block h-4 rounded-r-[4px]" style={{ width: `${Math.max(2, (value / top) * 85)}%`, backgroundColor: highlight === i + 1 ? ACCENT : value ? FURNITURE.axis : FURNITURE.track }} aria-hidden="true" />
                    <span className="text-xs font-bold tabular-nums text-ink">{value}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {countdown && <div className="sm:col-span-2 lg:col-span-1"><Countdown locale={locale} /></div>}
      </div>
    </div>
  );
}
