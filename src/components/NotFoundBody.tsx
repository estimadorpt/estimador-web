'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Mosaic } from '@/components/brand/Mosaic';

/**
 * Body of the 404 inside a locale. A client component on purpose: while a
 * not-found prerenders in the static export the request locale is unset, and
 * only the provider knows which locale this page belongs to.
 */
export function NotFoundBody() {
  const locale = useLocale();
  const pt = locale !== 'en';
  const action =
    'inline-flex items-center rounded-md px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
  return (
    <main className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">404</p>
        <h1 className="max-w-xl text-4xl md:text-5xl">
          {pt ? 'Este caminho não leva a lado nenhum.' : 'This path leads nowhere.'}
        </h1>
        <p className="mt-4 max-w-md text-lg text-stone-600">
          {pt
            ? 'A página que procuras não existe, mudou de sítio ou nunca foi estimada.'
            : 'The page you are looking for does not exist, has moved, or was never estimated.'}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" locale={locale} className={`${action} bg-ink text-paper hover:bg-ink-dark`}>
            {pt ? 'Voltar ao início' : 'Back to the start'}
          </Link>
          <Link href="/populacao" locale={locale} className={`${action} border border-line bg-cream text-ink hover:bg-parchment`}>
            {pt ? 'Explorar o atlas' : 'Explore the atlas'}
          </Link>
        </div>
      </div>
      <Mosaic variant="quarters" className="mx-auto w-full max-w-[320px]" />
    </main>
  );
}
