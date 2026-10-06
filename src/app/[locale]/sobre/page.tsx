import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from '@/i18n/request-locale';
import { PageHero } from '@/components/PageHero';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/mdx-components';
import { loadEconomyDashboard } from '@/lib/utils/data-loader';
import { loadLigaPlayers, loadLigaSummary } from '@/lib/utils/football-data-loader';
import { formatLongDate } from '@/lib/football-format';
import { ECONOMY_PUBLISHED, economyState, type EconomyState } from '@/lib/config/economy-status';
import { Link } from '@/i18n/routing';
import { fmtDate } from '@/lib/utils/economy-format';
import { POPULATION_RELEASE } from '@/lib/config/population';
import { HONESTY } from '@/lib/population/labels';

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
    description: t('meta.aboutDescription'),
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
 * The one status list on /sobre (`<EstadoAtual />` in the MDX): every section
 * in the order of what is live, each with its status, what it is and where its
 * method is explained. Only the economy's status is derived (`economyState`:
 * the editorial flag, then the staleness guard /economia itself uses), so that
 * line cannot drift from what the section shows. The Liga's player cut-off
 * is read from players.json, the season its fit ends with (audit CL2-02), and
 * its status names the latest forecast's round and date (FR3V-M3). The
 * rest is stable editorial fact (CLAUDE.md, "Sections"), not something a
 * loader here can compute.
 */
function EstadoAtual({
  economyNow,
  economyDateLabel,
  playerSeason,
  ligaLatest,
  locale,
}: {
  economyNow: EconomyState;
  economyDateLabel: string | null;
  /** The last season in the player models' fit ("2025-26"), or null. */
  playerSeason: string | null;
  /** The latest Liga forecast: the round it follows and when it was updated, or null. */
  ligaLatest: { matchday: number; updated: string } | null;
  locale: string;
}) {
  const pt = locale !== 'en';
  // Dated like the population row: which forecast is live, and from when
  // (FR3V-M3), read from the file the Liga page reads.
  const ligaStatus = ligaLatest
    ? (pt
        ? `Em publicação contínua · última previsão depois da jornada ${ligaLatest.matchday}, atualizada a ${ligaLatest.updated}.`
        : `Published on a continuing basis · latest forecast after matchday ${ligaLatest.matchday}, updated ${ligaLatest.updated}.`)
    : (pt
        ? 'Em publicação contínua · previsões atualizadas a cada jornada da época em curso.'
        : 'Published on a continuing basis · forecasts updated every matchday of the current season.');
  const economyStatus = economyNow === 'preparing'
    ? (pt ? 'Em preparação · ainda sem leituras da economia publicadas.' : 'In preparation · no readings of the economy published yet.')
    : economyNow === 'paused'
    ? (pt
        ? `Em pausa${economyDateLabel ? ` · última leitura a ${economyDateLabel}` : ''}.`
        : `Paused${economyDateLabel ? ` · last reading ${economyDateLabel}` : ''}.`)
    : (pt
        ? `Publicada${economyDateLabel ? ` · atualizada a ${economyDateLabel}` : ''}.`
        : `Published${economyDateLabel ? ` · updated ${economyDateLabel}` : ''}.`);

  const items: { label: string; href: string; status: string; text: string; method: { href: string; label: string } }[] = [
    {
      label: pt ? 'População' : 'Population',
      href: '/populacao',
      status: pt
        ? `Publicada · população sintética v${POPULATION_RELEASE} (Censos 2021), de 5 de outubro de 2026.`
        : `Released · synthetic population v${POPULATION_RELEASE} (2021 Census), 5 October 2026.`,
      // The producer's positioning sentence verbatim (HONESTY.positioning), then
      // which parishes "every parish" means, as a sentence of its own.
      text: pt
        ? `${HONESTY.positioning.pt} São as 3 092 freguesias dos Censos 2021 (limites da CAOP 2021). Pessoas e agregados gerados, não pessoas, famílias ou moradas reais. Podes procurar a tua freguesia, jogar a Freguesia misteriosa do dia e descarregar os microdados.`
        : `${HONESTY.positioning.en} That is the 3,092 parishes of the 2021 Census (CAOP 2021 boundaries). Generated people and households, not real people, families or addresses. You can look up your parish, play the daily Mystery parish and download the microdata.`,
      method: { href: '/populacao/metodologia', label: pt ? 'Metodologia da população' : 'Population methodology' },
    },
    {
      label: 'Liga Portugal',
      href: '/desporto/liga',
      status: ligaStatus,
      text: pt
        ? `Um modelo bayesiano que simula milhares de épocas possíveis para estimar a classificação final, as probabilidades de título e de despromoção e o peso de cada jogo nessas contas.${playerSeason ? ` Modelos bayesianos próprios medem também os jogadores, um por dimensão; os de finalização e de contribuição ofensiva vão até ao fim da época ${playerSeason}.` : ''}`
        : `A Bayesian model that simulates thousands of possible seasons to estimate the final table, the title and relegation probabilities and what each match does to them.${playerSeason ? ` Dedicated Bayesian models also rate the players, one per dimension; the finishing and attacking contribution models run to the end of the ${playerSeason} season.` : ''}`,
      method: { href: '/desporto/liga/metodologia', label: pt ? 'Metodologia da Liga Portugal' : 'Liga Portugal methodology' },
    },
    {
      label: pt ? 'Eleições presidenciais 2026' : 'Presidential election 2026',
      href: '/eleicoes/presidenciais',
      status: pt ? 'Arquivo · previsão preservada tal como foi publicada.' : 'Archive · forecast preserved as published.',
      text: pt
        ? 'As previsões que publicámos para as duas voltas, com a informação disponível à data: as sondagens desse ciclo, a evolução estimada de cada candidato e as probabilidades das duas voltas. Os efeitos das empresas de sondagens foram estimados, mas ficaram muito perto de zero e não são mostrados. Não são atualizadas nem reescritas com o resultado.'
        : 'The forecasts we published for both rounds, with the information available at the time: that cycle\'s polls, each candidate\'s estimated trend and the probabilities for both rounds. The pollster house effects were estimated but came out very close to zero and are not shown. They are not updated, nor rewritten with the outcome.',
      method: { href: '/eleicoes/metodologia', label: pt ? 'Metodologia das eleições' : 'Election methodology' },
    },
    {
      label: pt ? 'Eleições legislativas 2025' : 'Parliamentary election 2025',
      href: '/eleicoes/legislativas',
      status: pt ? 'Arquivo · não é atualizado com novos resultados.' : 'Archive · not updated with new results.',
      text: pt
        ? 'As projeções nacionais de mandatos, simuladas distrito a distrito pelo método de Hondt, os distritos com mandatos em disputa e os efeitos das empresas de sondagens estimados nessa altura.'
        : 'The national seat projections, simulated district by district with the D’Hondt method, the districts with seats in play and the pollster house effects estimated at the time.',
      method: { href: '/eleicoes/metodologia', label: pt ? 'Metodologia das eleições' : 'Election methodology' },
    },
    {
      label: pt ? 'Economia' : 'Economy',
      href: '/economia',
      status: economyStatus,
      text: pt
        ? 'Uma leitura de indicadores económicos portugueses: atividade, mercado de trabalho e inflação. Quando for publicada, cada número vai dizer se é um valor oficial ou uma estimativa nossa, o período a que se refere e a data de publicação. Até lá ficam as explicações sobre como ler os indicadores.'
        : 'A read of Portuguese economic indicators: activity, the labour market and inflation. Once published, each figure will say whether it is an official value or our estimate, the period it refers to and its publication date. Until then, the explanations of how to read the indicators are available.',
      method: { href: '/economia/metodologia', label: pt ? 'Metodologia da economia' : 'Economy methodology' },
    },
  ];

  // One rule between items and none doubled at the end: the MDX's "---"
  // closes the list (CL2-11). The id is the mission paragraph's link target.
  return (
    <ul id="o-que-esta-publicado" className="mb-5 list-none divide-y divide-line border-t border-line pl-0">
      {items.map(item => (
        // Full width, so each rule between items is as long as the list's own (CL2-11).
        <li key={item.href} className="max-w-none py-5">
          {/* Stand-alone links, so a thumb-sized target on a phone (UXM3-07). */}
          <h3 className="m-0 text-lg">
            <Link href={item.href} locale={locale} className="tap-target text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">{item.label}</Link>
          </h3>
          <p className="mt-1 font-sans text-sm font-semibold text-stone-600">{item.status}</p>
          <p className="mt-2">{item.text}</p>
          <p className="mt-1 font-sans text-sm">
            <Link href={item.method.href} locale={locale} className="tap-target text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">{item.method.label}</Link>
          </p>
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

  // The one status this page derives rather than restates: the economy's,
  // with the guard /economia uses. Everything else is editorial fact.
  // The feed is not shipped while the section is in preparation.
  const economyData = ECONOMY_PUBLISHED ? await loadEconomyDashboard() : null;
  const economyDateIso = economyData?.as_of ?? economyData?.vintage_date;
  const economyNow = economyState(economyDateIso);
  const economyDateLabel = economyData?.vintage_date ? fmtDate(economyData.vintage_date, locale) : null;
  // The player models' cut-off, the same season /desporto/liga/jogadores and
  // the Liga methodology name (CL2-02).
  const [players, ligaSummary] = await Promise.all([loadLigaPlayers(), loadLigaSummary()]);
  const playerSeason = players?.generated_from?.seasons?.at(-1) ?? null;
  // The latest forecast's round and update date, as the Liga page's status line has them.
  const ligaUpdated = ligaSummary?.timestamp ? formatLongDate(ligaSummary.timestamp, locale) : '';
  const ligaLatest = ligaSummary && ligaUpdated ? { matchday: ligaSummary.matchday, updated: ligaUpdated } : null;

  const components = getMDXComponents({
    EstadoAtual: () => (
      <EstadoAtual economyNow={economyNow} economyDateLabel={economyDateLabel} playerSeason={playerSeason} ligaLatest={ligaLatest} locale={locale} />
    ),
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        {/* The lede says who makes the site; the descriptor is already in
            this page's footer, so it is not stated a third time (CL2-16). */}
        <PageHero
          measure="reading"
          compact
          title={t('about.title')}
          lede={locale === 'en'
            ? 'An independent project by Bernardo Caldas: data and models about Portugal, with the uncertainty in view.'
            : 'Um projeto independente de Bernardo Caldas: dados e modelos sobre Portugal, com a incerteza à vista.'}
        />

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 md:pb-12 md:pt-6"><div className="max-w-3xl">
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

        {/* The first heading sits under the hero's rule at the section gap,
            not at a heading's full top margin (CL2-11). */}
        <article className="article-body max-w-none [&>:first-child]:!mt-0" lang={actualLocale}>
          <MDXRemote source={mdxContent} components={components} />
        </article>
        </div></div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
