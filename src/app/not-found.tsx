import './globals.css';
import Link from 'next/link';
import { LogoHorizontal } from '@/components/Logo';
import { Mosaic } from '@/components/brand/Mosaic';

/**
 * The 404. It renders outside the locale layout, so it carries its own html
 * and body and speaks both languages at once. The one place on the site
 * where the mosaic is allowed the broadest humour.
 */
export default function NotFound() {
  return (
    <html lang="pt">
      <body className="antialiased">
        <div className="min-h-screen bg-paper text-ink">
          <header className="border-b border-line">
            <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
              <Link href="/pt" className="brand-link inline-block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" aria-label="estimador.pt">
                <LogoHorizontal size={22} />
              </Link>
            </div>
          </header>
          <main className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">404</p>
              <h1 className="max-w-xl text-4xl md:text-5xl">Este caminho não leva a lado nenhum.</h1>
              <p className="mt-4 max-w-md text-lg text-stone-600">A página que procuras não existe, mudou de sítio ou nunca foi estimada.</p>
              <p className="mt-1 max-w-md text-sm text-stone-500">This page does not exist. It may have moved, or it was never estimated.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/pt" className="inline-flex items-center rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">Voltar ao início</Link>
                <Link href="/pt/populacao" className="inline-flex items-center rounded-md border border-line bg-cream px-4 py-2.5 text-sm font-semibold text-ink hover:bg-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">Explorar o atlas</Link>
              </div>
            </div>
            <Mosaic variant="quarters" className="mx-auto w-full max-w-[320px]" />
          </main>
        </div>
      </body>
    </html>
  );
}
