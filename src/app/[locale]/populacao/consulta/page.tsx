import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { PermalinkResolver } from '@/components/population/consulta/PermalinkResolver';
import { createPageMetadata } from '@/lib/metadata';

/**
 * The shell the host serves for every canonical response link
 * (/populacao/v/{release}/q/{id}, rewritten here by staticwebapp.config.json).
 * It resolves on the client and must never be indexed itself.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: '/populacao/consulta',
    title: pt ? 'A abrir um resultado da população sintética' : 'Opening a synthetic population result',
    description: pt
      ? 'Ligação permanente para um resultado publicado da população sintética.'
      : 'Permanent link to a published result of the synthetic population.',
    index: false,
  });
}

export default async function PopulationPermalink({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pt = locale === 'pt';
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        width="4xl"
        compact
        back={{ href: '/populacao', label: pt ? 'População sintética' : 'Synthetic population', locale }}
        eyebrow={pt ? 'População sintética · ligação permanente' : 'Synthetic population · permanent link'}
        title={pt ? 'Ligação para um resultado' : 'Link to a result'}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <PermalinkResolver locale={pt ? 'pt' : 'en'} />
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
