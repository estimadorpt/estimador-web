"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  ligaTeamColors,
  ligaTeamShortNames,
  teamDisplayName,
  teamLogoSrc,
} from "@/lib/config/football";
import { positionCodeEn, positionCodePt } from "@/lib/i18n/football-labels";
import {
  ratingDomain,
  ratingPct,
  rankMovement,
  type RatingEntry,
} from "@/lib/utils/player-ratings";

/**
 * One ranked list of players on one metric, with the credible interval drawn
 * on a shared diverging scale.
 *
 * It is deliberately metric-agnostic: goals prevented, contribution above
 * replacement and defensive plus-minus all live on different scales and can
 * all go negative, so the bar is anchored at a visible zero rather than at
 * the left edge. The caller supplies every string — this component holds no
 * copy of its own.
 */

const BAR = "#1c1917"; // stone-900
const BAR_NEG = "#a8a29e"; // stone-400 — below the reference level
const SOFT = "#a8a29e"; // stone-400 — interval whisker
const ZERO = "#d6d3d1"; // stone-300 — the reference line

export interface PlayerRatingListProps {
  entries: RatingEntry[];
  locale?: string;
  /** Decimal places for the headline value. */
  digits?: number;
  /** Header over the bar column (the metric's plain-language name). */
  metricHeader: string;
  /** Header over the numeric column (a short unit label). */
  valueHeader: string;
  /** Player name → player-page slug. Rows without a slug stay unlinked. */
  playerSlugs?: Record<string, string>;
  /** Extra rows for the expanded panel, already localised by the caller. */
  detailCells?: (entry: RatingEntry) => { label: string; value: string }[];
  /** Goals-only ranks, for the rank-movement column. */
  goalsRankByPlayer?: Record<string, number>;
  showMovement?: boolean;
  /** How many rows before the "show all" toggle. */
  initialCount?: number;
  /** Localised labels for the fixed chrome. */
  labels: {
    player: string;
    interval: string;
    noInterval: string;
    showAll: (n: number) => string;
    showLess: string;
    movement: string;
    newEntry: string;
    playerPage: string;
    openPlayer: (name: string) => string;
  };
}

export function PlayerRatingList({
  entries,
  locale = "pt",
  digits = 2,
  metricHeader,
  valueHeader,
  playerSlugs,
  detailCells,
  goalsRankByPlayer,
  showMovement = false,
  initialCount = 10,
  labels,
}: PlayerRatingListProps) {
  const pt = locale !== "en";
  const [showAll, setShowAll] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!entries.length) return null;

  const nf = (v: number, d = digits) =>
    v.toLocaleString(pt ? "pt-PT" : "en-GB", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  const int = (v: number) => Math.round(v).toLocaleString(pt ? "pt-PT" : "en-GB");
  const signed = (v: number, d = digits) => `${v > 0 ? "+" : ""}${nf(v, d)}`;

  const domain = ratingDomain(entries);
  const zeroPct = ratingPct(0, domain);
  const visible = showAll ? entries : entries.slice(0, initialCount);
  const posLabel = (p: string) => (pt ? positionCodePt[p] : positionCodeEn[p]) ?? p;

  return (
    <div>
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-200">
        <div className="w-6 flex-shrink-0" />
        <div className="w-32 sm:w-52 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {labels.player}
        </div>
        <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {metricHeader}
        </div>
        {showMovement && (
          <div className="w-10 flex-shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-stone-400 hidden sm:block">
            {labels.movement}
          </div>
        )}
        <div className="w-20 sm:w-28 flex-shrink-0 text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {valueHeader}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-stone-300 leading-tight">
            {labels.interval}
          </div>
        </div>
        <div className="w-6 flex-shrink-0" />
      </div>

      <div className="divide-y divide-stone-100">
        {visible.map((e) => {
          const isOpen = openKey === e.key;
          const slug = playerSlugs?.[e.player];
          const chip = (e.team && ligaTeamColors[e.team]) || "#78716c";
          const hasInterval = e.lo !== null && e.hi !== null;
          const move = showMovement ? rankMovement(e, goalsRankByPlayer) : null;

          const vPct = e.value === null ? null : ratingPct(e.value, domain);
          const loPct = e.lo === null ? null : ratingPct(e.lo, domain);
          const hiPct = e.hi === null ? null : ratingPct(e.hi, domain);
          const negative = (e.value ?? 0) < 0;

          const cells = detailCells?.(e) ?? [];

          return (
            <div key={e.key}>
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : e.key)}
                  aria-expanded={isOpen}
                  className="flex-1 min-w-0 flex items-center gap-2 py-1.5 text-left hover:bg-stone-50 transition-colors"
                >
                  <div className="w-6 flex-shrink-0 text-right text-xs font-bold tabular-nums text-stone-400">
                    {e.rank ?? ""}
                  </div>

                  <div className="w-32 sm:w-52 flex-shrink-0 min-w-0">
                    <div className="text-xs sm:text-sm font-semibold truncate text-stone-900">
                      {e.player}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {e.team && teamLogoSrc(e.team) ? (
                        <img
                          src={teamLogoSrc(e.team)}
                          alt=""
                          className="w-3 h-3 object-contain flex-shrink-0"
                        />
                      ) : (
                        <span
                          className="w-1 h-3 flex-shrink-0"
                          style={{ backgroundColor: chip }}
                        />
                      )}
                      {e.team && (
                        <>
                          <span className="text-[10px] text-stone-400 truncate sm:hidden">
                            {ligaTeamShortNames[e.team] || e.team}
                          </span>
                          <span className="text-[10px] text-stone-400 truncate hidden sm:inline">
                            {teamDisplayName(e.team)}
                          </span>
                        </>
                      )}
                      {e.position && (
                        <span className="text-[10px] text-stone-300 hidden sm:inline">
                          · {posLabel(e.position)}
                        </span>
                      )}
                      {e.minutes !== null && (
                        <span className="text-[10px] text-stone-300">
                          · {int(e.minutes)} min
                        </span>
                      )}
                      {e.minutes === null && e.shots !== null && (
                        <span className="text-[10px] text-stone-300">
                          · {int(e.shots)} {pt ? "remates" : "shots"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Diverging bar from the zero reference, with the 94%
                      credible interval drawn on top. */}
                  <div className="flex-1 h-6 relative">
                    <div className="absolute inset-y-0 left-0 right-0 bg-stone-50" />
                    <div
                      className="absolute inset-y-0 w-px"
                      style={{ left: `${zeroPct}%`, backgroundColor: ZERO }}
                    />
                    {vPct !== null && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-2.5"
                        style={{
                          left: `${Math.min(vPct, zeroPct)}%`,
                          width: `${Math.max(Math.abs(vPct - zeroPct), 0.4)}%`,
                          backgroundColor: negative ? BAR_NEG : BAR,
                          opacity: 0.85,
                        }}
                      />
                    )}
                    {hasInterval && loPct !== null && hiPct !== null && (
                      <>
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-px"
                          style={{
                            left: `${loPct}%`,
                            width: `${Math.max(hiPct - loPct, 0.4)}%`,
                            backgroundColor: SOFT,
                          }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-px h-3"
                          style={{ left: `${loPct}%`, backgroundColor: SOFT }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-px h-3"
                          style={{ left: `${hiPct}%`, backgroundColor: SOFT }}
                        />
                      </>
                    )}
                  </div>

                  {showMovement && (
                    <div className="w-10 flex-shrink-0 text-right hidden sm:block">
                      {move === null ? (
                        <span className="text-[10px] text-stone-300">
                          {labels.newEntry}
                        </span>
                      ) : move === 0 ? (
                        <span className="text-[11px] text-stone-300">=</span>
                      ) : (
                        <span
                          className={`text-[11px] font-semibold tabular-nums ${
                            move > 0 ? "text-emerald-700" : "text-stone-400"
                          }`}
                        >
                          {move > 0 ? "▲" : "▼"}
                          {Math.abs(move)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Value with its interval underneath. The interval is not
                      hidden behind a tap: a rating without uncertainty is the
                      thing this site exists not to publish. */}
                  <div className="w-20 sm:w-28 flex-shrink-0 text-right">
                    <span className="text-xs sm:text-sm font-bold tabular-nums text-stone-900">
                      {e.value === null ? "—" : signed(e.value)}
                    </span>
                    <div className="text-[9px] sm:text-[10px] tabular-nums text-stone-400 leading-tight">
                      {hasInterval ? (
                        `${signed(e.lo!)} … ${signed(e.hi!)}`
                      ) : (
                        <span className="italic">{labels.noInterval}</span>
                      )}
                    </div>
                  </div>
                </button>

                {slug ? (
                  <Link
                    href={`/desporto/liga/jogador/${slug}`}
                    locale={locale}
                    aria-label={labels.openPlayer(e.player)}
                    className="w-6 flex-shrink-0 flex items-center justify-center text-stone-300 hover:text-stone-800 hover:bg-stone-50 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="w-6 flex-shrink-0" />
                )}
              </div>

              {isOpen && (
                <div className="pl-8 pr-2 pb-3 pt-1 bg-stone-50/60">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-stone-400">
                        {labels.interval}
                      </div>
                      <div className="font-semibold tabular-nums text-stone-800">
                        {hasInterval ? (
                          `${signed(e.lo!)} – ${signed(e.hi!)}`
                        ) : (
                          <span className="font-normal text-stone-400">
                            {labels.noInterval}
                          </span>
                        )}
                      </div>
                    </div>
                    {cells.map((cell) => (
                      <div key={cell.label}>
                        <div className="text-[10px] uppercase tracking-wider text-stone-400">
                          {cell.label}
                        </div>
                        <div className="font-semibold tabular-nums text-stone-800">
                          {cell.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  {slug && (
                    <Link
                      href={`/desporto/liga/jogador/${slug}`}
                      locale={locale}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-800"
                    >
                      {labels.playerPage}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {entries.length > initialCount && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs font-medium text-blue-700 hover:text-blue-800"
        >
          {showAll ? labels.showLess : labels.showAll(entries.length)}
        </button>
      )}
    </div>
  );
}
