import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/routing';
import { ElectionProvider } from '@/contexts/ElectionContext';
import { PostHogPageView } from '@/components/PostHogProvider';
import Script from 'next/script';
import '../globals.css';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

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

  const ogImageFilename = getOgImageFilename(locale);
  const ogImageUrl = `https://estimador.pt/${ogImageFilename}`;
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content={ogImageUrl} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {POSTHOG_KEY && (
          <Script
            id="posthog-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('${POSTHOG_KEY}', {
                  api_host: '${POSTHOG_HOST}',
                  person_profiles: 'identified_only',
                  capture_pageview: true,
                  capture_pageleave: true,
                  autocapture: true,
                  enable_heatmaps: true,
                  disable_session_recording: false,
                  capture_dead_clicks: true
                });
              `,
            }}
          />
        )}
        <PostHogPageView />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ElectionProvider>
            {children}
          </ElectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}