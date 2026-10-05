import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { createPageMetadata } from '@/lib/metadata';
import { PRESIDENTIAL_2026, PRESIDENTIAL_2026_SECOND_ROUND_DATE, PARLIAMENTARY_2025 } from '@/lib/config/elections';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    path: '/eleicoes/arquivo',
    title: locale === 'pt' ? 'Como ler uma previsão arquivada' : 'How to read an archived forecast',
    description: locale === 'pt' ? 'Revisitar uma previsão, interpretar a incerteza e avaliar o que ela dizia.' : 'Revisit forecasts, interpret uncertainty and assess what they said.',
  });
}

export default async function Archive({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pt = locale === 'pt';
  const formatDate = (value: string) => new Date(value).toLocaleDateString(
    pt ? 'pt-PT' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  // One entry per archived forecast, naming its own election, round(s),
  // forecast cutoff and the kind of question it answers — so a visitor can
  // tell "winner/runoff" and "seats/majority" apart before opening either
  // (product-usability-diagnosis-2026-09-17 §7, §12 "Election scope").
  const entries = [
    {
      href: '/eleicoes/presidenciais',
      name: pt ? 'Presidenciais 2026' : 'Presidential 2026',
      rounds: pt
        ? `1.ª volta · ${formatDate(PRESIDENTIAL_2026.date)} — 2.ª volta · ${formatDate(PRESIDENTIAL_2026_SECOND_ROUND_DATE)}`
        : `1st round · ${formatDate(PRESIDENTIAL_2026.date)} — 2nd round · ${formatDate(PRESIDENTIAL_2026_SECOND_ROUND_DATE)}`,
      question: pt
        ? 'Pergunta de vencedor/segunda volta: quem venceria e se seria precisa uma segunda volta.'
        : 'A winner/runoff question: who would win, and whether a runoff would be needed.',
    },
    {
      href: '/eleicoes/legislativas',
      name: pt ? 'Legislativas 2025' : 'Parliamentary 2025',
      rounds: pt ? `Volta única · ${formatDate(PARLIAMENTARY_2025.date)}` : `Single round · ${formatDate(PARLIAMENTARY_2025.date)}`,
      question: pt
        ? 'Pergunta de mandatos/maioria: que partido teria mais mandatos e se uma coligação atingiria maioria — distinta da pergunta de vencedor.'
        : 'A seats/majority question: which party would win most seats and whether a coalition would reach a majority — a different question from a winner.',
    },
  ];
  const guide = pt
    ? [
      ['01 · Situa a previsão', 'De que data é?', 'Começa pela data da previsão e pela volta eleitoral. A informação disponível muda ao longo da campanha.'],
      ['02 · Lê a pergunta', 'Votos ou probabilidade de ganhar?', 'Uma estimativa de votos e uma probabilidade de vitória respondem a perguntas diferentes. Lê o título e a unidade antes de comparar.'],
      ['03 · Avalia com cuidado', 'Acertar no vencedor basta?', 'Não. Importam também a margem de erro e os intervalos. Uma só eleição não demonstra que probabilidades estejam bem calibradas.'],
    ]
    : [
      ['01 · Place the forecast', 'Which date?', 'Start with the forecast date and election round. Available information changes throughout the campaign.'],
      ['02 · Read the question', 'Votes or winning probability?', 'A vote estimate and a winning probability answer different questions. Read the title and unit before comparing.'],
      ['03 · Assess carefully', 'Is naming the winner enough?', 'No. Errors and intervals matter too. A single election does not establish that probabilities are well calibrated.'],
    ];

  return <div className="min-h-screen bg-paper">
    <Header />
    <PageHero
      width="5xl"
      compact
      illustration="elections"
      eyebrow={pt ? 'ELEIÇÕES · DEPOIS DO VOTO' : 'ELECTIONS · AFTER THE VOTE'}
      title={pt ? 'A eleição passou. O que dizia a previsão?' : 'The election is over. What did the forecast say?'}
      lede={pt ? 'Um arquivo permite voltar à informação disponível na altura. Não é uma página de resultados oficiais.' : 'An archive lets you revisit the information available at the time. It is not a page of official results.'}
    />
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10">
      <section aria-labelledby="archive-choice-title" className="border-y border-line py-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{pt ? 'COMEÇAR POR AQUI' : 'START HERE'}</p>
        <h2 id="archive-choice-title" className="mt-2 text-2xl">{pt ? 'Escolhe uma previsão' : 'Choose a forecast'}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{pt ? 'Abre a previsão que queres situar no tempo. Encontrarás a data, a volta e as estimativas então publicadas.' : 'Open the forecast you want to place in time. It contains the date, election round and estimates published then.'}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {entries.map((entry, index) => (
            <div key={entry.href} className="rounded-2xl border border-line bg-cream p-5">
              <h3 className="text-lg font-semibold text-ink">{entry.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-ink-muted">{entry.rounds}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{entry.question}</p>
              <div className="mt-4">
                <Action href={entry.href} locale={locale} variant={index === 0 ? 'primary' : 'secondary'} arrow>
                  {pt ? 'Ver a previsão' : 'View the forecast'}
                </Action>
              </div>
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
        <p>{pt ? 'Estes caminhos abrem as previsões arquivadas. Esta página não apresenta uma avaliação calculada contra os resultados oficiais; não atribui uma pontuação de desempenho ao modelo.' : 'These links open archived forecasts. This page does not present a calculated evaluation against official results or assign a performance score to the model.'}</p>
        <Action href="/metodologia" locale={locale} variant="text" arrow>{pt ? 'Como são construídas as previsões' : 'How the forecasts are built'}</Action>
      </section>
    </main>
    <SiteFooter locale={locale} />
  </div>;
}
