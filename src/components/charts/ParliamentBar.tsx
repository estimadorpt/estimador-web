import { partyColors } from '@/lib/config/colors';

/** Narrower than this many seats, a segment's name goes in the key below instead of on the bar. */
const LABEL_MIN_SEATS = 14;

/** Ink on light party colours, white on dark ones: whichever has the higher contrast (WCAG relative luminance). */
function textOn(hex: string): string {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return (lum + 0.05) / 0.05 >= 1.05 / (lum + 0.05) ? '#111111' : '#ffffff';
}

/**
 * One parliament as a single bar: each party's seats in order, left to right,
 * and a line at the middle, where a majority starts. Pure markup, so it draws
 * on the server and scales with its column; the figures are printed on the
 * wide segments and in a key under the bar for the narrow ones.
 */
export function ParliamentBar({ seats, majority, label, majorityLabel, locale }: {
  seats: ReadonlyArray<{ party: string; seats: number }>;
  majority: number;
  /** The reading for screen readers: every party and its seats. */
  label: string;
  /** Printed beside the majority line ("116 para a maioria"). */
  majorityLabel: string;
  locale: string;
}) {
  const house = seats.reduce((sum, s) => sum + s.seats, 0);
  if (house === 0) return null;
  const share = (n: number) => `${(n / house) * 100}%`;
  const narrow = seats.filter(s => s.seats > 0 && s.seats < LABEL_MIN_SEATS);
  const majorityAt = share(majority - 0.5);
  return (
    <figure className="m-0" role="img" aria-label={label}>
      <div className="relative pb-2 pt-6">
        <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[12.5px] leading-4 text-ink" style={{ left: majorityAt }} aria-hidden="true">
          {majorityLabel}
        </span>
        <div className="flex h-11 w-full overflow-hidden" aria-hidden="true">
          {seats.filter(s => s.seats > 0).map(s => (
            <div
              key={s.party}
              className="flex h-full items-center justify-center border-r border-paper last:border-r-0"
              style={{ width: share(s.seats), background: partyColors[s.party as keyof typeof partyColors] }}
            >
              {s.seats >= LABEL_MIN_SEATS && (
                <span className="px-0.5 text-center text-[12.5px] font-semibold leading-4" style={{ color: textOn(partyColors[s.party as keyof typeof partyColors] ?? '#5e5e5e') }}>
                  {s.party}<br />{s.seats.toLocaleString(locale === 'en' ? 'en-GB' : 'pt-PT')}
                </span>
              )}
            </div>
          ))}
        </div>
        {/* The majority mark as ticks above and below the bar, so it never crosses a party's figures. */}
        <span className="absolute top-[17px] h-[7px] w-0 -translate-x-px border-l-2 border-ink" style={{ left: majorityAt }} aria-hidden="true" />
        <span className="absolute bottom-0 h-2 w-0 -translate-x-px border-l-2 border-ink" style={{ left: majorityAt }} aria-hidden="true" />
      </div>
      {narrow.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] leading-4 text-graphite" aria-hidden="true">
          {narrow.map(s => (
            <span key={s.party} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <i className="inline-block h-2.5 w-2.5" style={{ background: partyColors[s.party as keyof typeof partyColors] }} />
              {s.party} {s.seats}
            </span>
          ))}
        </p>
      )}
    </figure>
  );
}
