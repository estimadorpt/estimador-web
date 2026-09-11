import { getTranslations } from 'next-intl/server';
import { Action } from '@/components/brand/Action';
import { ligaTeamColors, teamDisplayName } from '@/lib/config/football';
import type { TeamDelta } from '@/types/football';
import { HomeArt } from './HomeArt';
import { HomePanel, Kicker } from './HomePanel';

export interface FootballSnapshot {
  matchday: number;
  timestamp?: string;
  top3: Array<{ team: string; p_champion: number }>;
}

/**
 * The Liga rail: one dated finding from the latest published matchday, the
 * three title probabilities from that same snapshot, and the way into the
 * simulator. Club colours are a small accent, never the panel. Without data it
 * routes to the method instead of inventing a number.
 */
export async function FootballPanel({ locale, variant, snapshot, deltas }: { locale: string; variant: 'secondary' | 'support'; snapshot: FootballSnapshot | null; deltas?: Record<string, TeamDelta> }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const date = snapshot?.timestamp
    ? new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(snapshot.timestamp))
    : '';
  const chips = snapshot?.top3.slice(0, 3).map(team => ({
    team: team.team,
    name: teamDisplayName(team.team),
    p: Math.round(team.p_champion * 100),
    delta: deltas?.[team.team]?.p_champion_delta,
    color: ligaTeamColors[team.team] ?? '#5f7062',
  })) ?? [];
  const rail = variant === 'secondary';
  const fmtDelta = (d: number) => new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 1, signDisplay: 'always' }).format(d).replace('-', '−');

  const numbers = snapshot && chips.length === 3 ? (
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">{t('footballChampionLabel')}</p>
      <ul className="mt-2 grid grid-cols-3 gap-2">
        {chips.map(chip => (
          <li key={chip.team} className="rounded-xl border border-line bg-paper px-2 py-2 text-center" style={{ borderTopWidth: 3, borderTopColor: chip.color }}>
            <span className="block truncate text-[12px] font-semibold text-stone-700">{chip.name}</span>
            <span className="block font-display text-2xl font-extrabold tabular-nums leading-tight text-ink">{chip.p}<span className="text-sm font-bold text-stone-500">%</span></span>
            {chip.delta != null && Math.abs(chip.delta) >= 1 && (
              <span className="block text-[11px] font-semibold tabular-nums text-stone-600">{fmtDelta(chip.delta)} pp</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  const copy = (
    <>
      <Kicker>{t('footballKicker')}</Kicker>
      <h2 id="home-football-title" className={`mt-2 ${rail ? 'text-2xl' : 'text-xl md:text-2xl'}`}>{t('footballTitle')}</h2>
      {snapshot ? (
        <p className="mt-1.5 text-[13px] font-semibold text-stone-600">{t('footballDate', { matchday: snapshot.matchday, date })}</p>
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{t('footballUnavailable')}</p>
      )}
      {numbers}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        {snapshot ? (
          <>
            <Action href="/desporto/liga/simulador" locale={locale} arrow>{t('footballAction')}</Action>
            <Action href="/desporto/liga" locale={locale} variant="text" arrow>{t('footballLink')}</Action>
          </>
        ) : (
          <Action href="/desporto/liga/metodologia" locale={locale} variant="secondary" arrow>{t('footballMethod')}</Action>
        )}
      </div>
    </>
  );

  if (rail) {
    return (
      <HomePanel labelledBy="home-football-title" className="flex flex-col p-5 md:p-6">
        <HomeArt name="football" priority sizes="(min-width: 1100px) 30vw, (min-width: 768px) 50vw, 100vw" className="mx-auto h-[130px] w-full max-w-[240px] md:h-[150px]" />
        <div className="mt-4">{copy}</div>
      </HomePanel>
    );
  }
  return (
    <HomePanel labelledBy="home-football-title" className="grid gap-4 p-5 md:grid-cols-[minmax(120px,38%)_1fr] md:items-center md:gap-6 md:p-6">
      <HomeArt name="football" sizes="(min-width: 768px) 22vw, 100vw" className="mx-auto h-[120px] w-full max-w-[220px] md:h-[150px]" />
      <div className="min-w-0">{copy}</div>
    </HomePanel>
  );
}
