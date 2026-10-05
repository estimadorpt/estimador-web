import { Header } from '@/components/Header';
import { NotFoundBody } from '@/components/NotFoundBody';
import { NotFoundByLocale } from '@/components/NotFoundSwitch';
import { SiteFooter } from '@/components/SiteFooter';

/**
 * The 404 inside a locale: what a page that calls notFound() renders, such as
 * the placeholder /artigos/sem-artigos/ the export writes while nothing is
 * published. Unknown addresses never reach it on Azure; they get the root
 * not-found. A not-found receives no params, so it renders both languages and
 * the provider picks one.
 */
export default function LocaleNotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <NotFoundByLocale
        pt={<><NotFoundBody locale="pt" /><SiteFooter locale="pt" /></>}
        en={<><NotFoundBody locale="en" /><SiteFooter locale="en" /></>}
      />
    </div>
  );
}
