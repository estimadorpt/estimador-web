import { getTranslations } from 'next-intl/server';
import { Action } from '@/components/brand/Action';
import { Mosaic } from '@/components/brand/Mosaic';

/**
 * The 404, in one language: the hero is the page, with the mosaic beside it
 * (the one place CLAUDE.md gives the mosaic its broadest licence). Both
 * not-found files render it twice, once per locale, and let a client switch
 * pick one (NotFoundSwitch): the export prerenders a not-found with no request
 * locale, so the server cannot choose.
 *
 * The actions are plain anchors with the locale written out: the root 404
 * renders outside the locale layout, where next-intl's Link has no locale to
 * read.
 */
export async function NotFoundBody({ locale, withTitle = false }: { locale: 'pt' | 'en'; withTitle?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'notFound' });
  return (
    <main id="main-content" tabIndex={-1} lang={locale}>
      {/* React hoists this into <head>. Only the root 404 needs it: inside a
          locale the page's own metadata names the document. */}
      {withTitle && <title>{t('title')}</title>}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">404</p>
            <h1 className="max-w-xl text-4xl md:text-5xl">{t('heading')}</h1>
            <p className="mt-4 max-w-md text-lg text-stone-600">{t('lede')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Action href={`/${locale}/`} external>{t('home')}</Action>
              <Action href={`/${locale}/populacao/`} external variant="secondary" arrow>{t('atlas')}</Action>
            </div>
          </div>
          <Mosaic variant="quarters" className="mx-auto w-full max-w-[320px]" />
        </div>
      </section>
    </main>
  );
}
