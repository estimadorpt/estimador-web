"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Action } from "@/components/brand/Action";
import { TitleProbabilities } from "@/components/football/TitleProbabilities";
import { FixtureStakes } from "@/components/football/FixtureStakes";
import type { ClubOutlookEntry } from "@/components/football/club-outlook";
import { readStoredClub, resolveInitialClub, writeStoredClub } from "@/components/football/club-preference";
import type { TeamDelta } from "@/types/football";
import { teamColorOnPaper, teamDisplayName, teamWithArticle } from "@/lib/config/football";
import { formatPercent } from "@/lib/football-format";

export interface FootballClubOption {
  label: string;
  slug: string;
}

/**
 * The homepage football module's interactive half (diagnosis §4/§12, "Club
 * continuity"): before a club is chosen, the general dated title race; after,
 * every figure, label and link follows that club — computed server-side by
 * FootballPanel/buildClubOutlooks, so this component only switches between
 * precomputed answers, never recomputes anything from rounded text.
 *
 * Server render always shows the general outlook with the select on its
 * "Escolhe a tua equipa" placeholder (never a preselected club); a stored or
 * shared-link preference is restored client-side after mount, progressively.
 */
export function FootballClubPicker({
  locale,
  outlooks,
  top3,
  deltas,
  generalLabels,
  relegation,
}: {
  locale: string;
  outlooks: ClubOutlookEntry[];
  top3: Array<{ team: string; p_champion: number }>;
  deltas?: Record<string, TeamDelta>;
  /** The general outlook's visible caption and its link to the Liga page. */
  generalLabels?: { champion: string; change: string | null; link: string };
  /** The other end of the table, from the same forecast: the three likeliest to go down. */
  relegation?: { label: string; teams: Array<{ team: string; p_relegation: number }> };
}) {
  const pt = locale === "pt";
  const validSlugs = useMemo(() => outlooks.map((o) => o.slug), [outlooks]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  // True once a preference (query or stored) has been restored, so the
  // "A tua equipa · mudar" control only appears for a genuinely remembered
  // choice, not a selection just made interactively in this same visit.
  const [restored, setRestored] = useState(false);
  // The select only proposes; "Ver" commits. Arrowing through the list with
  // a keyboard never swaps the panel under the reader (audit A11Y-14).
  const [pending, setPending] = useState("");
  const [hint, setHint] = useState(false);
  const selectId = useId();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get("club");
    const stored = readStoredClub();
    const resolved = resolveInitialClub(querySlug, stored, validSlugs);
    if (resolved) {
      setSelectedSlug(resolved);
      setPending(resolved);
      setRestored(true);
    }
    // Restore once, from the URL/storage present when the module first
    // mounts; outlooks/validSlugs don't change within a page's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!outlooks.length) return null;

  const selected = selectedSlug ? outlooks.find((o) => o.slug === selectedSlug) ?? null : null;

  function handleSelect(slug: string) {
    if (!slug) {
      setSelectedSlug(null);
      setPending("");
      setRestored(false);
      return;
    }
    setSelectedSlug(slug);
    setRestored(false);
    writeStoredClub(slug);
  }

  function handleForget() {
    writeStoredClub(null);
    setSelectedSlug(null);
    setRestored(false);
  }

  // The club selector follows the outlook directly (CL3-02): pinned to the
  // card's last line it left a band of empty cream in the middle of the rail
  // whenever the population card set a taller row.
  return (
    <div className="mt-3 flex flex-1 flex-col">
      <div aria-live="polite">
        {selected ? (
          <div>
            {restored && (
              <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-stone-500">
                <span>
                  {pt ? "A tua equipa" : "Your club"}: <span className="text-ink">{selected.label}</span>
                </span>
                <button type="button" onClick={() => handleSelect("")} className="inline-flex min-h-11 items-center text-ink underline underline-offset-4">
                  {pt ? "mudar" : "change"}
                </button>
                <span aria-hidden="true" className="text-stone-500">·</span>
                <button type="button" onClick={handleForget} className="inline-flex min-h-11 items-center text-ink underline underline-offset-4">
                  {pt ? "esquecer" : "forget"}
                </button>
              </p>
            )}
            <h3 className="text-lg font-bold leading-snug text-ink md:text-xl">
              {selected.opponentLabel
                ? pt
                  ? `${selected.label}: o que muda ${selected.opponent ? teamWithArticle(selected.opponent, "contra") : `contra ${selected.opponentLabel}`}?`
                  : `${selected.label}: what changes against ${selected.opponentLabel}?`
                : pt
                  ? `${selected.label}: qual é o panorama?`
                  : `${selected.label}: what's the outlook?`}
            </h3>
            <div className="mt-2">
              <FixtureStakes locale={pt ? "pt" : "en"} entry={selected} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Action href={selected.matchHref ?? selected.clubHref} locale={locale} variant="primary" arrow>
                {selected.matchHref ? (pt ? "Ver a análise do jogo" : "See the match analysis") : (pt ? "Ver a equipa" : "See the club")}
              </Action>
              {selected.matchHref && (
                <Action href={selected.clubHref} locale={locale} variant="text">
                  {pt ? "Ver a equipa" : "See the club"}
                </Action>
              )}
            </div>
            {!restored && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-ink underline underline-offset-4"
              >
                {pt ? "escolher outra equipa" : "choose another club"}
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              {generalLabels?.champion ?? (pt ? "Panorama geral" : "General outlook")}
              {generalLabels?.change ? ` · ${generalLabels.change}` : ""}
            </p>
            <div className="mt-2">
              <TitleProbabilities teams={top3} deltas={generalLabels?.change ? deltas : undefined} locale={locale} compact />
            </div>
            {/* "Como pode acabar" has two ends: the title above, the drop here,
                smaller, from the same dated forecast (CL3-02: real content,
                not a hole, where the rail is as tall as the population card). */}
            {relegation && relegation.teams.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{relegation.label}</p>
                <ul className="mt-1.5 grid grid-cols-3 gap-x-3 gap-y-1">
                  {relegation.teams.map(team => (
                    <li key={team.team} className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[12px] leading-tight text-stone-600">
                        <i aria-hidden="true" className="inline-block h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: teamColorOnPaper(team.team) }} />
                        <span className="min-w-0 break-words">{teamDisplayName(team.team)}</span>
                      </span>
                      <span className="block font-display text-lg font-extrabold tabular-nums text-ink">{formatPercent(team.p_relegation, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {generalLabels && (
              <div className="mt-4">
                <Action href="/desporto/liga" locale={locale} variant="secondary" arrow>
                  {generalLabels.link}
                </Action>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        id="escolher-equipa"
        className="flex min-w-0 flex-wrap items-end gap-2 pt-5"
        onSubmit={(event) => {
          event.preventDefault();
          // The button is never disabled (it looked broken, audit CL2-04):
          // with no club chosen it points at the select instead.
          if (!pending) {
            setHint(true);
            document.getElementById(selectId)?.focus();
            return;
          }
          setHint(false);
          handleSelect(pending);
        }}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <label htmlFor={selectId} className="text-sm font-semibold text-ink-muted">
            {pt ? "Acompanha a tua equipa" : "Follow your club"}
          </label>
          <select
            id={selectId}
            value={pending}
            aria-describedby={hint ? `${selectId}-hint` : undefined}
            onChange={(event) => {
              setPending(event.target.value);
              if (event.target.value) setHint(false);
            }}
            className="mt-1 block min-h-11 w-full rounded-[10px] border border-line bg-paper px-2 text-base font-medium text-ink sm:text-sm"
          >
            <option value="">{pt ? "Escolhe a tua equipa" : "Choose your club"}</option>
            {outlooks.map((club) => (
              <option key={club.slug} value={club.slug}>{club.label}</option>
            ))}
          </select>
        </span>
        {/* Secondary: the card keeps one primary action (CL2-04). */}
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-[10px] border border-line bg-cream px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-parchment"
        >
          {pt ? "Ver" : "Show"}
        </button>
        {hint && (
          <p id={`${selectId}-hint`} role="status" className="w-full text-sm text-stone-600">
            {pt ? "Escolhe primeiro um clube na lista." : "Choose a club from the list first."}
          </p>
        )}
      </form>
    </div>
  );
}
