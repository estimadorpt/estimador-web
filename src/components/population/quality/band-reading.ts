/**
 * How the size bands sit against their pre-registered error ranges, in the
 * producer's words (scorecard v1.0.2 onwards: `headline.band_reading` and each
 * stratum's `band_position` + `note_pt` / `note_en`).
 *
 * The ranges are informational: they never decided the release, and a band
 * below its range fits *better* than expected. So the page quotes the
 * producer's sentences and never turns `in_band` or `coverage_in_band` into a
 * pass or a fail (those fields read "not in band" for a better fit).
 */
import type { Locale } from '@/lib/population/labels';
import type { PopulationScorecard } from '@/types/population';
import { SIZE_BAND } from './copy';

export interface BandReading {
  /** The headline sentence, e.g. "100% das freguesias estão em classes …". */
  reading: string | null;
  /**
   * The bands' notes: one entry with no label when every band says the same
   * thing, otherwise one per band, in the scorecard's order.
   */
  notes: Array<{ key: string; label: string | null; note: string }>;
}

export function bandReading(scorecard: PopulationScorecard, locale: Locale): BandReading {
  const reading = scorecard.headline.band_reading?.[locale] ?? null;
  // Only notes written for readers: before v1.0.2 note_pt held a status code
  // ("stop_and_investigate"), and those strata carry no band_position.
  const strata = scorecard.strata.filter(stratum => stratum.band_position && stratum.note_pt && stratum.note_en);
  const noteOf = (stratum: (typeof strata)[number]) => (locale === 'pt' ? stratum.note_pt! : stratum.note_en!);
  const distinct = [...new Set(strata.map(noteOf))];
  let notes: BandReading['notes'] = [];
  if (strata.length > 0 && strata.length === scorecard.strata.length && distinct.length === 1) {
    notes = [{ key: 'all', label: null, note: distinct[0] }];
  } else {
    notes = strata.map(stratum => ({
      key: stratum.key,
      label: SIZE_BAND[stratum.key]?.[locale] ?? (locale === 'pt' ? stratum.label : stratum.label_en),
      note: noteOf(stratum),
    }));
  }
  return { reading, notes };
}
