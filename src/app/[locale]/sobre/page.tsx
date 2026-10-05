import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from '@/i18n/request-locale';
import { PageHero } from '@/components/PageHero';
import { brandDescriptor } from '@/lib/brand/descriptor';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/mdx-components';
import { loadEconomyDashboard } from '@/lib/utils/data-loader';
import { economyState, type EconomyState } from '@/lib/config/economy-status';
import { fmtDate } from '@/lib/utils/economy-format';
import { POPULATION_RELEASE } from '@/lib/config/population';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return createPageMetadata({
    locale,
    path: '/sobre',
    title: t('meta.aboutTitle'),
    description: brandDescriptor(locale),
  });
}

function getAboutPath(locale: string): string {
  return path.join(process.cwd(), 'src/content/about', `${locale}.mdx`);
}

function getAboutContent(locale: string): { content: string; actualLocale: string } {
  // Try preferred locale first
  let mdxPath = getAboutPath(locale);

  if (existsSync(mdxPath)) {
    return {
      content: readFileSync(mdxPath, 'utf8'),
      actualLocale: locale
    };
  }

  // Fallback to Portuguese
  if (locale !== 'pt') {
    mdxPath = getAboutPath('pt');
    if (existsSync(mdxPath)) {
      return {
        content: readFileSync(mdxPath, 'utf8'),
        actualLocale: 'pt'
      };
    }
  }

  // Fallback to English
  mdxPath = getAboutPath('en');
  if (existsSync(mdxPath)) {
    return {
      content: readFileSync(mdxPath, 'utf8'),
      actualLocale: 'en'
    };
  }

  throw new Error('No about content found');
}

/**
 * "Estado atual" list embedded in the About MDX (`<EstadoAtual />`). Only the
 * economy line is derived (`economyState`: the editorial flag, then the same
 * staleness guard the economy page itself uses) so that line cannot drift from
 * what /economia actually shows. Population, football and elections status is stable
 * editorial fact — see CLAUDE.md's "Active Sections" and "Population section" —
 * not something a loader in this file's scope can safely compute.
 */
function EstadoAtual({
  economyNow,
  economyDateLabel,
  locale,
}: {
  economyNow: EconomyState;
  economyDateLabel: string | null;
  locale: string;
}) {
  const pt = locale !== 'en';
  const economyStatus = economyNow === 'preparing'
    ? (pt
        ? 'Em preparação — sem números publicados; as explicações sobre como ler os indicadores estão disponíveis.'
        : 'In preparation — no figures published; the explanations of how to read the indicators are available.')
    : economyNow === 'paused'
    ? (pt
        ? `Painel em pausa${economyDateLabel ? ` — última leitura: ${economyDateLabel}` : ''}. As explicações continuam disponíveis.`
        : `Dashboard paused${economyDateLabel ? ` — last reading: ${economyDateLabel}` : ''}. The explanations remain available.`)
    : (pt
        ? `Leitura ativa${economyDateLabel ? ` — atualizada a ${economyDateLabel}` : ''}.`
        : `Active reading${economyDateLabel ? ` — updated ${economyDateLabel}` : ''}.`);

  const items: { label: string; status: string }[] = [
    { label: pt ? 'Economia' : 'Economy', status: economyStatus },
    {
      label: pt ? 'População' : 'Population',
      status: pt
        ? `Publicada — população sintética v${POPULATION_RELEASE} (Censos 2021), lançada a 5 de outubro de 2026: cada freguesia com os seus próprios números e o seu nível de qualidade. Pessoas e agregados gerados, não pessoas reais.`
        : `Released — synthetic population v${POPULATION_RELEASE} (2021 Census), published 5 October 2026: every parish with its own figures and its quality tier. Generated people and households, not real people.`,
    },
    {
      label: pt ? 'Liga Portugal' : 'Liga Portugal',
      status: pt
        ? 'Em publicação contínua — previsões atualizadas a cada jornada da época em curso.'
        : 'Published on a continuing basis — forecasts updated every matchday of the current season.',
    },
    {
      label: pt ? 'Eleições presidenciais 2026' : 'Presidential elections 2026',
      status: pt ? 'Arquivo — previsão preservada tal como foi publicada.' : 'Archive — forecast preserved as published.',
    },
    {
      label: pt ? 'Eleições legislativas 2025' : 'Parliamentary elections 2025',
      status: pt ? 'Arquivo — não é atualizado com novos resultados.' : 'Archive — not updated with new results.',
    },
  ];

  return (
    <ul className="mb-5 list-none space-y-3 pl-0">
      {items.map(item => (
        <li key={item.label} className="flex flex-col gap-0.5 border-b border-stone-100 pb-3 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="shrink-0 font-bold text-stone-900 sm:w-56">{item.label}</span>
          <span className="text-stone-600">{item.status}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const { content: mdxContent, actualLocale } = getAboutContent(locale);

  // The one status this page can derive rather than restate: whether the
  // economy dashboard is currently paused, using the exact same guard
  // /economia uses. Everything else is stable editorial fact (see EstadoAtual).
  const economyData = await loadEconomyDashboard();
  const economyDateIso = economyData?.as_of ?? economyData?.vintage_date;
  const economyNow = economyState(economyDateIso);
  const economyDateLabel = economyData?.vintage_date ? fmtDate(economyData.vintage_date, locale) : null;

  const components = getMDXComponents({
    EstadoAtual: () => (
      <EstadoAtual economyNow={economyNow} economyDateLabel={economyDateLabel} locale={locale} />
    ),
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero width="3xl" compact title={t('about.title')} lede={brandDescriptor(locale)} />

        <div className="max-w-3xl mx-auto px-4 py-10 md:py-12">
        {/* Locale Notice (if fallback) */}
        {actualLocale !== locale && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {locale === 'en'
                ? `This page is only available in Portuguese. Showing Portuguese version.`
                : `Esta página apenas está disponível em português.`
              }
            </p>
          </div>
        )}

        <article className="article-body max-w-none" lang={actualLocale}>
          <MDXRemote source={mdxContent} components={components} />
        </article>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
