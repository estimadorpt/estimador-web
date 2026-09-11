import { Header } from '@/components/Header';
import { NotFoundBody } from '@/components/NotFoundBody';

/**
 * The 404 inside a locale: it inherits the locale layout (html lang, site
 * chrome, messages), so it speaks one language. Paths outside /pt and /en
 * fall through to the bilingual root not-found.
 */
export default function LocaleNotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <NotFoundBody />
    </div>
  );
}
