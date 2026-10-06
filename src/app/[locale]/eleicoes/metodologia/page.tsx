import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { Link } from '@/i18n/routing';
import { getMDXComponents } from '@/mdx-components';
import { createPageMetadata } from '@/lib/metadata';
import { setRequestLocale } from '@/i18n/request-locale';
import { RevisedDate } from '@/components/brand/RevisedDate';
import { ELECTION_METHODOLOGY_REVISED, electionMethodologySource } from '@/lib/election-methodology';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: '/eleicoes/metodologia',
    title: pt ? 'Como foram feitas as previsões eleitorais' : 'How the election forecasts were made',
    description: pt
      ? 'Os modelos das previsões arquivadas das legislativas de 2025 e das presidenciais de 2026: sondagens usadas e até quando, simulações, intervalos e limites.'
      : 'The models behind the archived forecasts of the 2025 parliamentary and 2026 presidential elections: which polls, up to when, simulations, intervals and limits.',
  });
}

const linkClass = 'text-ink underline underline-offset-4 hover:text-ink-muted';
/** A link on a line of its own in the hero: a 44px target at the text's own size (UXM2-09). */
const standaloneLinkClass = `inline-flex min-h-11 items-center ${linkClass}`;
/** The in-page anchors: 44px on a phone or a coarse pointer (`.tap-target`, globals.css). */
const anchorClass = `tap-target ${linkClass}`;

/**
 * The election methods, moved out of /metodologia (which is now the hub of
 * every section's methods). Dated, with each model's poll cut-off in the
 * hero, and written in the past tense: both forecasts are archives.
 */
export default async function ElectionMethodologyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="reading"
          compact
          eyebrow={pt ? 'Eleições · arquivo' : 'Elections · archive'}
          title={pt ? 'Como foram feitas as previsões eleitorais?' : 'How were the election forecasts made?'}
          lede={pt
            ? 'Os modelos das previsões arquivadas, tal como correram: as legislativas de 2025, com sondagens até 15 de maio de 2025, e as presidenciais de 2026, com sondagens até 15 de janeiro (1.ª volta) e 6 de fevereiro de 2026 (2.ª volta).'
            : 'The models behind the archived forecasts, as they ran: the 2025 parliamentary election, with polls up to 15 May 2025, and the 2026 presidential election, with polls up to 15 January (first round) and 6 February 2026 (runoff).'}
          meta={
            <>
              <RevisedDate date={ELECTION_METHODOLOGY_REVISED} locale={locale} />
              <Link href="/eleicoes/arquivo" locale={locale} className={standaloneLinkClass}>{pt ? 'Todas as eleições (arquivo)' : 'All elections (archive)'}</Link>
              <Link href="/metodologia" locale={locale} className={standaloneLinkClass}>{pt ? 'Métodos das outras áreas' : 'Methods of the other areas'}</Link>
            </>
          }
        />
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 md:pb-16"><div className="max-w-3xl">
          <nav aria-label={pt ? 'Nesta página' : 'On this page'} className="my-8 flex flex-wrap gap-x-5 gap-y-2 border-y border-line py-4 text-sm">
            <a href="#legislativas" className={anchorClass}>{pt ? 'Legislativas 2025' : 'Parliamentary 2025'}</a>
            <a href="#presidenciais" className={anchorClass}>{pt ? 'Presidenciais 2026: 1.ª volta' : 'Presidential 2026: first round'}</a>
            <a href="#segunda-volta-2026" className={anchorClass}>{pt ? '2.ª volta' : 'Runoff'}</a>
          </nav>
          <article className="article-body max-w-none" lang={pt ? 'pt' : 'en'}>
            <MDXRemote source={electionMethodologySource(locale)} components={getMDXComponents()} />
          </article>
        </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
