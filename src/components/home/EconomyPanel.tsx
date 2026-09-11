import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Action } from '@/components/brand/Action';
import { HomeEconomyFreshness } from '@/components/economics/HomeEconomyFreshness';
import { fmtDate, fmtProbPct, fmtSignedPctValue } from '@/lib/utils/economy-format';
import type { EconomyDashboard } from '@/types/economy-dashboard';
import { HomeArt } from './HomeArt';
import { HomePanel, Kicker, Status } from './HomePanel';

/**
 * The economy support panel. With fresh data: one current read-out, its date
 * and the client-side freshness guard. Paused (see economy-time.ts): the
 * section keeps its educational purpose, states the pause honestly and routes
 * to how the indicators are read. Never a loud error, never a stale number.
 */
export async function EconomyPanel({ locale, economy, paused, article }: { locale: string; economy: EconomyDashboard | null; paused: boolean; article?: { slug: string; title: string } | null }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tSections = await getTranslations({ locale, namespace: 'sections' });
  const tiles = paused ? undefined : economy?.tiles;
  const pulse = tiles?.pulse?.anchor?.value;
  const recession = tiles?.recession?.probability;
  const live = !paused && economy && typeof pulse === 'number' && typeof recession === 'number';
  return (
    <HomePanel labelledBy="home-economy-title" className="grid md:grid-cols-[minmax(200px,42%)_1fr]">
      <HomeArt name="economy" shape="square" sizes="(min-width: 1100px) 22vw, (min-width: 768px) 40vw, 100vw" className="h-[200px] w-full md:h-full md:min-h-[260px]" />
      <div className="min-w-0 p-5 md:p-6">
        <Kicker pill={live ? undefined : tSections('pausedSection')}>{t('economyKicker')}</Kicker>
        {live ? (
          <>
            <h2 id="home-economy-title" className="mt-2 text-xl md:text-[1.5rem] md:leading-[1.2]">{t('economyTitleLive')}</h2>
            <p className="mt-2 text-[15px] font-semibold text-ink">{t('economyFinding', { pulse: fmtSignedPctValue(pulse, 1), recession: fmtProbPct(recession, 0) })}</p>
            <div className="mt-1.5"><HomeEconomyFreshness asOf={economy?.as_of} vintageDate={economy?.vintage_date} locale={locale} /></div>
            <div className="mt-4"><Action href="/economia" locale={locale} variant="secondary" arrow>{t('economyAction')}</Action></div>
          </>
        ) : (
          <>
            <h2 id="home-economy-title" className="mt-2 text-xl md:text-[1.5rem] md:leading-[1.2]">{t('economyTitlePaused')}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{t('economyPausedText')}</p>
            <div className="mt-3"><Action href="/economia/metodologia" locale={locale} variant="secondary" arrow>{t('economyMethodsAction')}</Action></div>
            {economy?.vintage_date && <Status tone="paused">{t('economyPausedStatus', { date: fmtDate(economy.vintage_date, locale) })}</Status>}
          </>
        )}
        {article && (
          <p className="mt-3 text-[13px] text-stone-600">
            {t('moreArticle')}: <Link href={`/artigos/${article.slug}`} locale={locale} className="font-semibold text-ink underline-offset-4 hover:underline">{article.title}</Link>
          </p>
        )}
      </div>
    </HomePanel>
  );
}
