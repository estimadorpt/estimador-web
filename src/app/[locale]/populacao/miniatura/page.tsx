import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { Miniature } from '@/components/miniatura/Miniature';
import { createPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return createPageMetadata({ locale, path: '/populacao/miniatura',
    title: locale === 'pt' ? 'Portugal em miniatura — demonstração interativa' : 'Portugal in miniature — interactive demo',
    description: locale === 'pt' ? 'Explora um bairro imaginado: 100 pessoas, 30 agregados e três perspetivas. Demonstração com dados fictícios.' : 'Explore an imagined neighbourhood: 100 people, 30 households and three perspectives. A demo with fictional data.',
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <><Header /><Miniature locale={locale === 'en' ? 'en' : 'pt'} /><SiteFooter locale={locale} /></>;
}
