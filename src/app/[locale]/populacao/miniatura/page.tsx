import { setRequestLocale } from '@/i18n/request-locale';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { Miniature } from '@/components/miniatura/Miniature';
import { createPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return createPageMetadata({ locale, path: '/populacao/miniatura',
    title: locale === 'pt' ? 'Como se lê uma população sintética?' : 'How do you read a synthetic population?',
    description: locale === 'pt' ? '100 pessoas e 30 agregados inventados, num bairro imaginado, para mostrar como se lê e se constrói uma população sintética. Nenhum número é de Portugal.' : '100 invented people and 30 households in an imagined neighbourhood, to show how a synthetic population is read and built. No number is about Portugal.',
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <><Header /><Miniature locale={locale === 'en' ? 'en' : 'pt'} /><SiteFooter locale={locale} /></>;
}
