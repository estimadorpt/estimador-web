import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { createPageMetadata, siteTitle } from '@/lib/metadata';
import { OFFICIAL_RESULTS, PRESIDENTIAL_2026, PRESIDENTIAL_2026_SECOND_ROUND_DATE, PARLIAMENTARY_2025, PARLIAMENTARY_2025_FORECAST_CUTOFF } from '@/lib/config/elections';
import { formatElectionLongDate } from '@/lib/election-display';
import { loadSecondRoundData, loadPresidentialData } from '@/lib/utils/data-loader';
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return createPageMetadata({
    locale,
    path: '/eleicoes/arquivo',
    title: siteTitle(locale === 'pt' ? 'Como ler uma previsão arquivada' : 'How to read an archived forecast'),
    description: locale === 'pt'
      ? 'As previsões das presidenciais de 2026 e das legislativas de 2025, guardadas com a informação disponível à data, e como lê-las sem as confundir com resultados.'
      : 'The 2026 presidential and 2025 parliamentary forecasts, kept with the information available at the time, and how to read them without mistaking them for results.',
  });
}

const linkClass = 'text-ink underline underline-offset-4 hover:text-ink-muted';

export default async function Archive({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  const date = (value: string) => formatElectionLongDate(value, locale);
  const [first, second] = await Promise.all([loadPresidentialData(), loadSecondRoundData()]);
  const forecastOf = (value?: string | null) => (value ? (pt ? `previsão de ${date(value)}` : `forecast of ${date(value)}`) : null);
  // One entry per archived forecast, naming its own election, round(s),
  // forecast date and the kind of question it answers — so a visitor can
  // tell "winner/runoff" and "seats/majority" apart before opening either
  // (product-usability-diagnosis-2026-09-17 §7, §12 "Election scope").
  const entries = [
    {
      href: '/eleicoes/presidenciais',
      name: pt ? 'Presidenciais 2026' : 'Presidential 2026',
      rounds: [
        `${pt ? '1.ª volta' : '1st round'} · ${date(PRESIDENTIAL_2026.date)}${forecastOf(first.forecast.updated_at) ? ` · ${forecastOf(first.forecast.updated_at)}` : ''}`,
        `${pt ? '2.ª volta' : '2nd round'} · ${date(PRESIDENTIAL_2026_SECOND_ROUND_DATE)}${forecastOf(second.forecast.updated_at) ? ` · ${forecastOf(second.forecast.updated_at)}` : ''}`,
      ],
      question: pt
        ? 'Pergunta de vencedor e segunda volta: quem venceria e se seria precisa uma segunda volta.'
        : 'A winner and runoff question: who would win, and whether a runoff would be needed.',
      results: OFFICIAL_RESULTS['presidential-2026'],
    },
    {
      href: '/eleicoes/legislativas',
      name: pt ? 'Legislativas 2025' : 'Parliamentary 2025',
      rounds: [`${pt ? 'Volta única' : 'Single round'} · ${date(PARLIAMENTARY_2025.date)} · ${forecastOf(PARLIAMENTARY_2025_FORECAST_CUTOFF)}`],
      question: pt
        ? 'Pergunta de mandatos e maioria: que partido teria mais mandatos e se um bloco atingiria a maioria. É uma pergunta diferente da de um vencedor.'
        : 'A seats and majority question: which party would win most seats and whether a bloc would reach a majority. It is a different question from a winner.',
      results: OFFICIAL_RESULTS['parliamentary-2025'],
    },
  ];
  const guide = pt
    ? [
      ['01 · Situa a previsão', 'De que data é?', 'Começa pela data da previsão e pela volta eleitoral. A informação disponível muda ao longo da campanha.'],
      ['02 · Lê a pergunta', 'Votos ou probabilidade de ganhar?', 'Uma estimativa de votos e uma probabilidade de vitória respondem a perguntas diferentes. Lê o título e a unidade antes de comparar.'],
      ['03 · Avalia com cuidado', 'Acertar no vencedor basta?', 'Não. Importam também a margem de erro e os intervalos. Uma só eleição não demonstra que as probabilidades estejam bem calibradas.'],
    ]
    : [
      ['01 · Place the forecast', 'Which date?', 'Start with the forecast date and election round. Available information changes throughout the campaign.'],
      ['02 · Read the question', 'Votes or winning probability?', 'A vote estimate and a winning probability answer different questions. Read the title and unit before comparing.'],
      ['03 · Assess carefully', 'Is naming the winner enough?', 'No. Errors and intervals matter too. A single election does not establish that probabilities are well calibrated.'],
    ];

  return <div className="min-h-screen bg-paper">
    <Header />
    <main id="main-content" tabIndex={-1}>
    <PageHero
      width="5xl"
      compact
      illustration="elections"
      eyebrow={pt ? 'Eleições · depois do voto' : 'Elections · after the vote'}
      title={pt ? 'A eleição passou. O que dizia a previsão?' : 'The election is over. What did the forecast say?'}
      lede={pt ? 'Um arquivo permite voltar à informação disponível na altura. Não é uma página de resultados oficiais.' : 'An archive lets you revisit the information available at the time. It is not a page of official results.'}
    />
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section aria-labelledby="archive-choice-title" className="border-y border-line py-7">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{pt ? 'Começar por aqui' : 'Start here'}</p>
        <h2 id="archive-choice-title" className="mt-2 text-2xl">{pt ? 'Escolhe uma previsão' : 'Choose a forecast'}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{pt ? 'Abre a previsão que queres situar no tempo. Encontrarás a data, a volta e as estimativas então publicadas.' : 'Open the forecast you want to place in time. It contains the date, election round and estimates published then.'}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {entries.map((entry, index) => (
            <div key={entry.href} className="rounded-2xl border border-line bg-cream p-5">
              <h3 className="text-lg font-semibold text-ink">{entry.name}</h3>
              {entry.rounds.map(line => <p key={line} className="mt-1 text-sm text-ink-muted">{line}</p>)}
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{entry.question}</p>
              <div className="mt-4">
                <Action href={entry.href} locale={locale} variant={index === 0 ? 'primary' : 'secondary'} arrow>
                  {pt ? 'Ver a previsão' : 'View the forecast'}
                </Action>
              </div>
              <p className="mt-3 flex flex-wrap gap-x-3 text-sm text-ink-muted">
                <span>{pt ? 'Resultados oficiais (SGMAI)' : 'Official results (SGMAI)'}:</span>
                {entry.results.map(r => (
                  <a key={r.href} href={r.href} className={linkClass} rel="noopener noreferrer">
                    {r.round === 1 ? (pt ? '1.ª volta' : '1st round') : r.round === 2 ? (pt ? '2.ª volta' : '2nd round') : (pt ? 'resultados' : 'results')} ↗
                  </a>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="archive-guide-title" className="mt-10">
        <h2 id="archive-guide-title" className="text-2xl">{pt ? 'Antes de tirar conclusões' : 'Before drawing conclusions'}</h2>
        <div className="mt-5 grid gap-8 md:grid-cols-3">
          {guide.map(([label, title, body]) => <section key={label} className="border-t border-line pt-5">
            <p className="text-xs font-semibold text-ink-muted">{label}</p>
            <h3 className="mt-3 text-xl">{title}</h3>
            <p className="mt-3 leading-relaxed text-ink-muted">{body}</p>
          </section>)}
        </div>
      </section>

      <section className="mt-8 max-w-3xl border-t border-line pt-6 text-sm leading-relaxed text-ink-muted">
        <p>{pt
          ? 'Ainda não publicámos uma avaliação destas previsões contra os resultados oficiais, por isso esta página não atribui uma pontuação ao modelo. A única avaliação publicada no site é a do modelo de futebol.'
          : 'We have not yet published an evaluation of these forecasts against the official results, so this page does not score the model. The only published evaluation on the site is the football model’s.'}</p>
        <div className="mt-2 flex flex-wrap gap-x-6">
          <Action href="/metodologia#eleicoes" locale={locale} variant="text" arrow>{pt ? 'Como foram construídas as previsões' : 'How the forecasts were built'}</Action>
          <Action href="/desporto/liga/modelo" locale={locale} variant="text" arrow>{pt ? 'A avaliação do modelo de futebol' : 'The football model’s evaluation'}</Action>
        </div>
      </section>
    </div>
    </main>
    <SiteFooter locale={locale} />
  </div>;
}
