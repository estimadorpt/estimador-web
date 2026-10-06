// The one line that dates a Liga forecast: which matchday it follows, when
// it was published and when the next one comes. "Jornada 7 · 25 de setembro"
// read like a match date (audit CL-M4); this says what the date is.

import { formatDateSpan, formatShortDate } from '@/lib/football-format';

export interface ForecastStatusInput {
  /** The matchday the forecast was run after (prediction.matchday). */
  matchday: number;
  /** prediction.timestamp. */
  timestamp: string;
  /** True when the forecast's matchday still has games to play. */
  inProgress: boolean;
  /** The round whose results trigger the next update; null at season's end. */
  nextRound: number | null;
  /** Kickoffs of that round's games (UTC ISO), for its date span. */
  nextRoundKickoffs: Array<string | null | undefined>;
}

/**
 * "Depois da jornada 7 · atualizado a 25 set. · próxima atualização após a
 * jornada 8 (9–12 out.)" / "After matchday 7 · updated 25 Sept · next update
 * after matchday 8 (9–12 Oct)". Every part comes from the data; the span is
 * dropped when no kickoff is known.
 */
export function forecastStatusLine(input: ForecastStatusInput, locale: string): string {
  const pt = locale !== 'en';
  const parts: string[] = [];
  parts.push(
    input.inProgress
      ? pt ? `Durante a jornada ${input.matchday}` : `During matchday ${input.matchday}`
      : pt ? `Depois da jornada ${input.matchday}` : `After matchday ${input.matchday}`,
  );
  const updated = formatShortDate(input.timestamp, locale);
  if (updated) parts.push(pt ? `atualizado a ${updated}` : `updated ${updated}`);
  if (input.nextRound == null) {
    parts.push(pt ? 'época terminada' : 'season finished');
  } else {
    const span = formatDateSpan(input.nextRoundKickoffs, locale, { short: true });
    const next = pt
      ? `próxima atualização após a jornada ${input.nextRound}`
      : `next update after matchday ${input.nextRound}`;
    parts.push(span ? `${next} (${span})` : next);
  }
  return parts.join(' · ');
}
