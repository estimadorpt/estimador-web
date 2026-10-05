"use client";

import { useEffect, useMemo, useState } from "react";
import { Action } from "@/components/brand/Action";
import { TitleProbabilities } from "@/components/football/TitleProbabilities";
import { FixtureStakes } from "@/components/football/FixtureStakes";
import type { ClubOutlookEntry } from "@/components/football/club-outlook";
import { readStoredClub, resolveInitialClub, writeStoredClub } from "@/components/football/club-preference";
import type { TeamDelta } from "@/types/football";

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
}: {
  locale: string;
  outlooks: ClubOutlookEntry[];
  top3: Array<{ team: string; p_champion: number }>;
  deltas?: Record<string, TeamDelta>;
}) {
  const pt = locale === "pt";
  const validSlugs = useMemo(() => outlooks.map((o) => o.slug), [outlooks]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  // True once a preference (query or stored) has been restored, so the
  // "A tua equipa · mudar" control only appears for a genuinely remembered
  // choice, not a selection just made interactively in this same visit.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get("club");
    const stored = readStoredClub();
    const resolved = resolveInitialClub(querySlug, stored, validSlugs);
    if (resolved) {
      setSelectedSlug(resolved);
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

  return (
    <div className="mt-3">
      <div aria-live="polite">
        {selected ? (
          <div>
            {restored && (
              <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-stone-500">
                <span>
                  {pt ? "A tua equipa" : "Your club"}: <span className="text-ink">{selected.label}</span>
                </span>
                <button type="button" onClick={() => handleSelect("")} className="text-ink underline-offset-4 hover:underline">
                  {pt ? "mudar" : "change"}
                </button>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <button type="button" onClick={handleForget} className="text-ink underline-offset-4 hover:underline">
                  {pt ? "esquecer" : "forget"}
                </button>
              </p>
            )}
            <h3 className="text-lg font-bold leading-snug text-ink md:text-xl">
              {selected.opponentLabel
                ? pt
                  ? `${selected.label}: o que muda contra ${selected.opponentLabel}?`
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
                className="mt-3 text-xs font-semibold text-stone-500 underline-offset-4 hover:underline"
              >
                {pt ? "escolher outra equipa" : "choose another club"}
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              {pt ? "Panorama geral" : "General outlook"}
            </p>
            <div className="mt-2">
              <TitleProbabilities teams={top3} deltas={deltas} locale={locale} compact />
            </div>
          </div>
        )}
      </div>

      <form id="escolher-equipa" className="mt-4 flex min-w-0 scroll-mt-24 items-end gap-2" onSubmit={(event) => event.preventDefault()}>
        <label className="min-w-0 flex-1 text-xs font-semibold text-ink-muted">
          {pt ? "Acompanha a tua equipa" : "Follow your club"}
          <select
            value={selectedSlug ?? ""}
            onChange={(event) => handleSelect(event.target.value)}
            className="mt-1 block min-h-10 w-full rounded-lg border border-line bg-paper px-2 text-sm font-medium text-ink"
          >
            <option value="">{pt ? "Escolhe a tua equipa" : "Choose your club"}</option>
            {outlooks.map((club) => (
              <option key={club.slug} value={club.slug}>{club.label}</option>
            ))}
          </select>
        </label>
      </form>
    </div>
  );
}
