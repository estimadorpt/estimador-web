'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, Share2 } from 'lucide-react';
import { Action } from '@/components/brand/Action';
import { ACCENT, FURNITURE } from '@/components/viz/theme';
import { formatCount } from '@/lib/population/format';
import { MAX_GUESSES, formatCountdown, msUntilNextLisbonMidnight, type GameRecord, type GameStats } from '@/lib/population/game';
import { regionTitle, type Parish } from '@/lib/population/places';
import { tierMeaningFor, type Locale } from '@/lib/population/labels';
import type { GameIndex } from '@/types/population';
import { ParishLink } from '../ParishLink';
import { QualityBadge } from '../QualityBadge';
import { ofMunicipality } from '../parish/place-words';
import { GAME_COPY } from './copy';

const SECONDARY = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-line bg-cream px-5 text-[15px] font-semibold leading-none text-ink transition-colors duration-150 hover:bg-parchment';

/**
 * The end of a game: the parish named, a link to its portrait, the share
 * text, the honesty line and the geography's attribution, the player's stats
 * and the time to the next parish.
 */
export function EndPanel({ record, answer, tier, stats, share, index, locale, practice, onReplay }: {
  record: GameRecord;
  answer: Parish;
  tier: 'A' | 'B' | 'C';
  stats: GameStats;
  share: string;
  index: GameIndex;
  locale: Locale;
  practice: boolean;
  /** Play the same parish again as practice (not stored, not counted); null while already replaying. */
  onReplay?: (() => void) | null;
}) {
  const t = GAME_COPY[locale];
  const won = record.status === 'won';
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const geography = index.geography as { source_license_url?: string; source_url?: string };

  const onShare = async () => {
    try {
      const touch = window.matchMedia('(pointer: coarse)').matches;
      if (touch && typeof navigator.share === 'function') {
        await navigator.share({ text: share });
        return;
      }
      await navigator.clipboard.writeText(share);
      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 2400);
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(share);
        setShareState('copied');
      } catch {
        setShareState('failed');
      }
    }
  };

  return (
    <section aria-labelledby="misteriosa-end" className="rounded-2xl border border-line bg-cream p-5 md:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{won ? t.wonKicker(record.guesses.length) : t.lostKicker}</p>
      {/* Focus lands here when a guess ends the game (MysteryGame), so the result is the next thing read. */}
      <h2 id="misteriosa-end" tabIndex={-1} className="mt-2 text-base font-bold text-stone-600 outline-none">{t.revealHeading}</h2>
      <p className="mt-1 font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl md:text-4xl">{answer.name}</p>
      <p className="mt-1 text-[15px] text-stone-600">
        {locale === 'pt' ? `Concelho ${ofMunicipality(answer.municipalityName)}` : `${answer.municipalityName} municipality`} · {regionTitle(answer.region, answer.regionName, locale)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-600">
        <QualityBadge kind={tier} locale={locale} />
        <span>{t.residents}: <strong className="tabular-nums text-ink">{formatCount(answer.censusPopulation, locale)}</strong></span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{tierMeaningFor(tier, answer.publicationPopulation)[locale]}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Action onClick={onShare}>
          <Share2 aria-hidden="true" className="h-4 w-4" />
          {t.share}
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
      <p className="mt-2 min-h-5 text-sm text-stone-600" aria-live="polite">
        {shareState === 'copied' ? t.copied : shareState === 'failed' ? t.shareFailed : ''}
      </p>
      {shareState === 'failed' && (
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-parchment p-3 font-sans text-sm text-ink">{share}</pre>
      )}

      <div className="mt-4 border-t border-line pt-4 text-sm text-stone-600">
        <p>{locale === 'pt' ? index.honesty.message_pt : index.honesty.message_en}</p>
        <p className="mt-1 text-xs text-stone-500">
          {t.attribution}{' '}
          <a href={geography.source_license_url ?? 'https://creativecommons.org/licenses/by/4.0/'} className="font-semibold text-ink underline underline-offset-2">CC BY 4.0</a>
          {geography.source_url && <> · <a href={geography.source_url} className="font-semibold text-ink underline underline-offset-2">CAOP</a></>}
        </p>
      </div>

      {!practice && <Countdown locale={locale} />}

      <Stats stats={stats} locale={locale} highlight={!practice && won ? record.guesses.length : null} />
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
    <p className="mt-4 rounded-xl bg-parchment px-4 py-3 text-sm text-stone-600">
      {t.next}{' '}
      <strong className="font-display text-lg font-extrabold tabular-nums text-ink" suppressHydrationWarning>{ms === null ? '··:··:··' : formatCountdown(ms)}</strong>
    </p>
  );
}

function Stats({ stats, locale, highlight }: { stats: GameStats; locale: Locale; highlight: number | null }) {
  const t = GAME_COPY[locale];
  const tiles: Array<[string, number]> = [
    [t.played, stats.played],
    [t.won, stats.won],
    [t.currentStreak, stats.currentStreak],
    [t.bestStreak, stats.bestStreak],
  ];
  const rows: Array<{ label: string; value: number; mark: boolean }> = [
    ...stats.distribution.map((value, i) => ({ label: String(i + 1), value, mark: highlight === i + 1 })),
    { label: t.distributionLost, value: stats.lost, mark: false },
  ];
  const top = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="mt-5">
      <h3 className="text-base font-bold text-ink">{t.statsTitle}</h3>
      <p className="text-xs text-stone-500">{t.statsNote}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col-reverse rounded-xl border border-line bg-paper px-2 py-2.5 text-center">
            <dt className="mt-0.5 text-[11px] font-semibold leading-tight text-stone-500">{label}</dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <h4 className="mt-4 text-[11px] font-bold uppercase tracking-wider text-stone-500">{t.distributionTitle}</h4>
      <table className="mt-2 w-full border-collapse text-sm">
        <caption className="sr-only">{t.distributionTitle}</caption>
        <tbody>
          {rows.map(row => (
            <tr key={row.label}>
              <th scope="row" className={`w-20 py-0.5 pr-2 text-left text-xs font-semibold tabular-nums ${row.label.length > 1 ? 'text-stone-500' : 'text-ink'}`}>{row.label.length > 1 ? row.label : `${row.label}/${MAX_GUESSES}`}</th>
              <td className="py-0.5">
                <span className="flex items-center gap-2">
                  <span className="block h-4 rounded-r-[4px]" style={{ width: `${Math.max(2, (row.value / top) * 85)}%`, backgroundColor: row.mark ? ACCENT : row.value ? FURNITURE.axis : FURNITURE.track }} aria-hidden="true" />
                  <span className="text-xs font-bold tabular-nums text-ink">{row.value}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
