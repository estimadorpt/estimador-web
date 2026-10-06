import { Link } from "@/i18n/routing";
import { teamColorOnPaper, teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { byKickoff, type GameFixturesData } from "@/lib/football-fixtures";
import { formatKickoffShort, formatPercent } from "@/lib/football-format";

export interface ClubFixtureRow {
  matchday: number;
  opponent: string;
  venue: "H" | "A";
  kickoff: string | null;
  kickoffConfirmed: boolean;
  /** True for a game left over from an earlier round. */
  postponed: boolean;
  /** The club's own 1X2 for this game, when the model has priced it. */
  probs?: { win: number; draw: number; loss: number };
  href?: string;
}

/**
 * A club's games still to play, from game_fixtures.json (the only file that
 * holds every remaining fixture and its kickoff, postponed ones included),
 * in kickoff order. `probs` are attached by the caller for the games the
 * forecast prices (the next round).
 */
export function clubFixtureRows(
  team: string,
  manifest: GameFixturesData | null,
  currentRound: number,
): ClubFixtureRow[] {
  const rows: ClubFixtureRow[] = [];
  for (const md of manifest?.matchdays ?? []) {
    for (const fx of md.fixtures ?? []) {
      if (fx.home !== team && fx.away !== team) continue;
      if (typeof fx.home_goals === "number" && typeof fx.away_goals === "number") continue;
      rows.push({
        matchday: md.matchday,
        opponent: fx.home === team ? fx.away : fx.home,
        venue: fx.home === team ? "H" : "A",
        kickoff: fx.kickoff ?? null,
        kickoffConfirmed: fx.kickoff_confirmed === true,
        postponed: md.matchday < currentRound,
      });
    }
  }
  return byKickoff(rows);
}

export function ClubFixtures({ rows, locale, limit }: { rows: ClubFixtureRow[]; locale: string; limit?: number }) {
  const pt = locale !== "en";
  const shown = limit ? rows.slice(0, limit) : rows;
  if (shown.length === 0) return null;
  return (
    <ol className="divide-y divide-line rounded-2xl border border-line bg-cream px-4">
      {shown.map(r => {
        const when = r.kickoff
          ? formatKickoffShort(r.kickoff, locale, { confirmed: r.kickoffConfirmed })
          : "";
        const body = (
          <>
            <span className="w-24 shrink-0 text-xs tabular-nums text-stone-500 sm:w-36">
              {when || (pt ? "data por marcar" : "date to be set")}
              {r.kickoff && !r.kickoffConfirmed && (
                <span className="block text-[11px]">{pt ? "data provisória" : "provisional date"}</span>
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              {teamLogoSrc(r.opponent) ? (
                <img src={teamLogoSrc(r.opponent)} alt="" width={16} height={16} loading="lazy" decoding="async" className="h-4 w-4 shrink-0 object-contain" />
              ) : (
                <i aria-hidden="true" className="h-4 w-1 shrink-0" style={{ backgroundColor: teamColorOnPaper(r.opponent) }} />
              )}
              <span className="truncate text-sm font-medium text-ink">{teamDisplayName(r.opponent)}</span>
              <span className="shrink-0 text-[11px] text-stone-500">
                {r.venue === "H" ? (pt ? "em casa" : "home") : (pt ? "fora" : "away")} · {pt ? "J" : "MD"}{r.matchday}
              </span>
              {r.postponed && (
                <span className="shrink-0 rounded bg-parchment px-1 text-[11px] font-bold text-stone-600">
                  {pt ? "jogo em atraso" : "postponed"}
                </span>
              )}
            </span>
            {r.probs && (
              <span className="hidden shrink-0 text-xs tabular-nums text-stone-600 sm:inline">
                {pt ? "Vitória" : "Win"} <strong className="text-ink">{formatPercent(r.probs.win, locale)}</strong> · {pt ? "Empate" : "Draw"}{" "}
                <strong className="text-ink">{formatPercent(r.probs.draw, locale)}</strong> · {pt ? "Derrota" : "Loss"}{" "}
                <strong className="text-ink">{formatPercent(r.probs.loss, locale)}</strong>
              </span>
            )}
          </>
        );
        return (
          <li key={`${r.matchday}-${r.opponent}`}>
            {r.href ? (
              <Link href={r.href} locale={locale} className="flex min-h-11 items-center gap-3 py-2 hover:bg-parchment">
                {body}
              </Link>
            ) : (
              <div className="flex min-h-11 items-center gap-3 py-2">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
