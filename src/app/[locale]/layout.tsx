import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/routing';
import { ElectionProvider } from '@/contexts/ElectionContext';
import { PostHogProvider } from '../providers';
import '../globals.css';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

// Read OG image filename at build time (versioned filename for cache busting)
function getOgImageFilename(locale: string): string {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'og-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest.files?.[locale] || `og-image-${locale}.png`;
  } catch {
    return `og-image-${locale}.png`;
  }
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const ogImageFilename = getOgImageFilename(locale);
  const ogImageUrl = `https://estimador.pt/${ogImageFilename}`;
  
  return {
    metadataBase: new URL('https://estimador.pt'),
    title: t('meta.defaultTitle'),
    description: t('meta.defaultDescription'),
    keywords: ['eleições', 'portugal', 'previsões', 'sondagens', 'politics', 'elections', 'forecasting', 'polls'],
    authors: [{ name: 'Bernardo Caldas' }],
    creator: 'Bernardo Caldas',
    publisher: 'estimador.pt',
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    openGraph: {
      title: t('meta.defaultTitle'),
      description: t('meta.defaultDescription'),
      url: `https://estimador.pt/${locale}`,
      siteName: 'estimador.pt',
      locale: locale,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('meta.defaultTitle'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.defaultTitle'),
      description: t('meta.defaultDescription'),
      creator: '@estimadorpt',
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}`,
      languages: {
        'en': 'https://estimador.pt/en',
        'pt': 'https://estimador.pt/pt',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params
}: RootLayoutProps) {
  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <PostHogProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ElectionProvider>
              {children}
            </ElectionProvider>
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}