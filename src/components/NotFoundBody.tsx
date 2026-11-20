import { getTranslations } from 'next-intl/server';
import { NotFoundBodyView } from '@/components/NotFoundBodyView';

/**
 * The 404, in one language: the hero is the page, with the empty instrument
 * (EmptyStateMark) at its larger size, capped so it never fills a phone
 * screen: 112px wide above the text on phones, 200px beside it from md
 * (every other empty or error state carries the 72px one). Both
 * not-found files render it twice, once per locale, and let a client switch
 * pick one (NotFoundSwitch): the export prerenders a not-found with no request
 * locale, so the server cannot choose.
 *
 * This reads the copy; NotFoundBodyView draws the page and owns its
 * main landmark.
 */
export async function NotFoundBody({ locale, withTitle = false }: { locale: 'pt' | 'en'; withTitle?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'notFound' });
  return (
    <NotFoundBodyView
      locale={locale}
      withTitle={withTitle}
      labels={{ title: t('title'), heading: t('heading'), lede: t('lede'), home: t('home'), atlas: t('atlas') }}
    />
  );
}
