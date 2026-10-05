import { loadLigaData } from '@/lib/utils/football-data-loader';
import { getTranslations } from 'next-intl/server';
import { Action } from '@/components/brand/Action';
import { buildClubOutlooks } from '@/components/football/club-outlook';
import { loadGameFixtures } from '@/components/football/load-game-fixtures';
import { SectionIllustration } from '@/components/brand/SectionIllustration';
import type { TeamDelta } from '@/types/football';
import { HomePanel, Kicker } from './HomePanel';
import { FootballClubPicker } from './FootballClubPicker';

export interface FootballSnapshot {
  matchday: number;
  timestamp?: string;
  top3: Array<{ team: string; p_champion: number }>;
}

/**
 * The Liga module: a labelled general outlook (dated title race) until a
 * visitor picks a club, after which every figure, label and link follows
 * that club — its relevant objective, dated baseline and its own supported
 * fixture's three-outcome stakes (diagnosis §4/§12). The per-club payload is
 * computed once here, server-side, for all 18 clubs; FootballClubPicker only
 * switches between precomputed answers. The illustration stays a narrow
 * accent beside the heading so the answer gets the space, not a full-width
 * banner ahead of it.
 */
export async function FootballPanel({ locale, variant, snapshot, deltas }: { locale: string; variant: 'secondary' | 'support'; snapshot: FootballSnapshot | null; deltas?: Record<string, TeamDelta> }) {
  const [t, latest, gameFixtures] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    snapshot ? loadLigaData() : Promise.resolve({ prediction: null, scenarios: null }),
    snapshot ? loadGameFixtures() : Promise.resolve(null),
  ]);
  const date = snapshot?.timestamp
    ? new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(snapshot.timestamp))
    : '';
  const rail = variant === 'secondary';
  const outlooks = latest.prediction
    ? buildClubOutlooks(locale === 'pt' ? 'pt' : 'en', latest.prediction, latest.scenarios, gameFixtures)
    : [];

  const copy = (
    <>
      <div className="flex items-start gap-3">
        <SectionIllustration scene="football" className="football-home-scene football-home-scene--accent shrink-0" />
        <div className="min-w-0">
          <Kicker>{t('footballKicker')}</Kicker>
          <h2 id="home-football-title" className={`mt-1 ${rail ? 'text-xl md:text-[1.5rem] md:leading-[1.15]' : 'text-lg md:text-[1.35rem] md:leading-[1.2]'}`}>
            {snapshot && outlooks.length ? (locale === 'pt' ? 'Quem fica com o título?' : 'Who takes the title?') : (locale === 'pt' ? 'Começa pela tua equipa' : 'Start with your club')}
          </h2>
          {snapshot ? (
            <p className="mt-1 text-[13px] font-semibold text-stone-600">{t('footballDate', { matchday: snapshot.matchday, date })}</p>
          ) : (
            <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{t('footballUnavailable')}</p>
          )}
        </div>
      </div>
      {snapshot && outlooks.length ? (
        <FootballClubPicker locale={locale} outlooks={outlooks} top3={snapshot.top3} deltas={deltas} />
      ) : !snapshot ? (
        <div className="mt-4">
          <Action href="/desporto/liga/metodologia" locale={locale} variant="secondary" arrow>{t('footballMethod')}</Action>
        </div>
      ) : null}
    </>
  );

  if (rail) {
    return (
      <HomePanel labelledBy="home-football-title" className="flex flex-col">
        <div className="flex flex-1 flex-col p-4 md:p-5">{copy}</div>
      </HomePanel>
    );
  }
  return (
    <HomePanel labelledBy="home-football-title" className="flex flex-col">
      <div className="min-w-0 p-5 md:p-6">{copy}</div>
    </HomePanel>
  );
}
