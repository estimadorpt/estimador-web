import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Action } from '@/components/brand/Action';
import { HomeEconomyFreshness } from '@/components/economics/HomeEconomyFreshness';
import { fmtDate, fmtProbPct, fmtSignedPctValue } from '@/lib/utils/economy-format';
import type { EconomyDashboard } from '@/types/economy-dashboard';
import type { EconomyState } from '@/lib/config/economy-status';
import { SectionIllustration } from '@/components/brand/SectionIllustration';
import { HomePanel, Kicker, Status } from './HomePanel';

/**
 * The economy support panel. Live (published and fresh): one current read-out,
 * its date and the client-side freshness guard. In preparation (the editorial
 * flag in economy-status.json is off) or paused (published but stale, see
 * economy-time.ts): the section keeps its educational purpose, says which of
 * the two it is and routes to how the indicators are read. Never a loud error,
 * never a stale number.
 */
export async function EconomyPanel({ locale, economy, state, article }: { locale: string; economy: EconomyDashboard | null; state: EconomyState; article?: { slug: string; title: string } | null }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tSections = await getTranslations({ locale, namespace: 'sections' });
  const tiles = state === 'live' ? economy?.tiles : undefined;
  const pulse = tiles?.pulse?.anchor?.value;
  const recession = tiles?.recession?.probability;
  const live = state === 'live' && economy && typeof pulse === 'number' && typeof recession === 'number';
  const preparing = state === 'preparing';
  return (
    <HomePanel labelledBy="home-economy-title" className="home-media home-media--economy">
      <div className="min-w-0 p-5 md:p-6">
        <div>
          <Kicker pill={live ? undefined : tSections(preparing ? 'preparingSection' : 'pausedSection')}>{t('economyKicker')}</Kicker>
          <h2 id="home-economy-title" className="mt-2 text-xl md:text-[1.5rem] md:leading-[1.2]">{live ? t('economyTitleLive') : t('economyTitlePaused')}</h2>
        </div>
        {live ? (
          <>
            <p className="mt-2 text-[15px] font-semibold text-ink">{t('economyFinding', { pulse: fmtSignedPctValue(pulse, 1), recession: fmtProbPct(recession, 0) })}</p>
            <div className="mt-1.5"><HomeEconomyFreshness asOf={economy?.as_of} vintageDate={economy?.vintage_date} locale={locale} /></div>
            <div className="mt-4"><Action href="/economia" locale={locale} variant="secondary" arrow>{t('economyAction')}</Action></div>
          </>
        ) : (
          <>
            <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{t('economyPausedText')}</p>
            <div className="mt-3"><Action href="/economia#compreender" locale={locale} variant="secondary" arrow className="whitespace-nowrap">{t('economyMethodsAction')}</Action></div>
            {preparing
              ? <Status tone="paused">{t('economyPreparingStatus')}</Status>
              : economy?.vintage_date && <Status tone="paused">{t('economyPausedStatus', { date: fmtDate(economy.vintage_date, locale) })}</Status>}
          </>
        )}
        {article && (
          <p className="mt-3 text-[13px] text-stone-600">
            {t('moreArticle')}: <Link href={`/artigos/${article.slug}`} locale={locale} className="font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">{article.title}</Link>
          </p>
        )}
      </div>
      <SectionIllustration scene="economy" sizes="720px" className="home-media__art home-media__art--economy" />
    </HomePanel>
  );
}
