import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from '@/i18n/request-locale';
import { PageHero } from '@/components/PageHero';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { POPULATION_RELEASE } from '@/lib/config/population';
import { ECONOMY_PUBLISHED } from '@/lib/config/economy-status';

/** When this hub's wording was last checked against the sections it points to. */
const HUB_REVISED = '2026-10-06';

const DESCRIPTION = {
  pt: 'Como chegamos a cada resposta: população sintética, Liga Portugal, eleições e economia. Fontes, pressupostos e limites de cada secção.',
  en: 'How we arrive at each answer: the synthetic population, Liga Portugal, elections and the economy. The sources, assumptions and limits of each section.',
};

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
    path: '/metodologia',
    title: t('methodology.title'),
    description: locale === 'en' ? DESCRIPTION.en : DESCRIPTION.pt,
  });
}

type Area = { label: string; question: string; description: string; href: string; extra?: { href: string; label: string } };

/**
 * The methodology hub: one short, dated page that sends each reader to the
 * method of the section they are reading, in the order of what is live. Each
 * section's method lives with the section (the election methods under
 * /eleicoes/metodologia, with the archive they explain).
 */
export default async function MethodologyPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== 'en';
  const revised = new Intl.DateTimeFormat(pt ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${HUB_REVISED}T00:00:00Z`));

  const areas: Area[] = pt ? [
    {
      label: 'População',
      question: 'Como é gerada uma população sintética?',
      description: `Os dados de partida (Censos 2021), o ajuste às tabelas do INE, os níveis de qualidade e a privacidade da versão ${POPULATION_RELEASE}.`,
      href: '/populacao/metodologia',
      extra: { href: '/populacao/qualidade', label: 'Ver a qualidade de cada freguesia' },
    },
    {
      label: 'Liga Portugal',
      question: 'O que sustenta estas probabilidades?',
      description: 'O modelo, as simulações da época e os pressupostos, atualizados a cada jornada.',
      href: '/desporto/liga/metodologia',
      extra: { href: '/desporto/liga/modelo', label: 'Ver a avaliação publicada do modelo' },
    },
    {
      label: 'Eleições · arquivo',
      question: 'Como foram feitas as previsões eleitorais?',
      description: 'Como as sondagens foram combinadas e simuladas nas presidenciais de 2026 e nas legislativas de 2025. Previsões arquivadas, não atualizadas.',
      href: '/eleicoes/metodologia',
    },
    {
      label: ECONOMY_PUBLISHED ? 'Economia' : 'Economia · em preparação',
      question: 'Como vamos ler a economia?',
      description: 'As fontes, os selos que vão distinguir dados oficiais de estimativas, e como o protótipo foi avaliado. Ainda sem números publicados.',
      href: '/economia/metodologia',
    },
  ] : [
    {
      label: 'Population',
      question: 'How is a synthetic population generated?',
      description: `The inputs (2021 Census), the fit to the INE tables, the quality tiers and the privacy of release ${POPULATION_RELEASE}.`,
      href: '/populacao/metodologia',
      extra: { href: '/populacao/qualidade', label: 'See the quality of each parish' },
    },
    {
      label: 'Liga Portugal',
      question: 'What supports these probabilities?',
      description: 'The model, the season simulations and the assumptions, updated every matchday.',
      href: '/desporto/liga/metodologia',
      extra: { href: '/desporto/liga/modelo', label: 'See the published evaluation of the model' },
    },
    {
      label: 'Elections · archive',
      question: 'How were the election forecasts made?',
      description: 'How the polls were combined and simulated for the 2026 presidential and 2025 parliamentary elections. Archived forecasts, not updated.',
      href: '/eleicoes/metodologia',
    },
    {
      label: ECONOMY_PUBLISHED ? 'Economy' : 'Economy · in preparation',
      question: 'How will we read the economy?',
      description: 'The sources, the labels that will tell official data from estimates, and how the prototype was evaluated. No figures published yet.',
      href: '/economia/metodologia',
    },
  ];

  const principles = pt ? [
    'Cada número diz a data a que se refere e a fonte de onde vem.',
    'A incerteza aparece como intervalo ou probabilidade; quando não foi calculada, dizemo-lo.',
    'As previsões arquivadas ficam como foram publicadas, sem serem reescritas com o resultado.',
  ] : [
    'Every number states the date it refers to and the source it comes from.',
    'Uncertainty is shown as an interval or a probability; where none was calculated, we say so.',
    'Archived forecasts stay as they were published, never rewritten with the outcome.',
  ];

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="reading"
          compact
          eyebrow={pt ? 'Dados, modelos e limites' : 'Data, models and limits'}
          title={pt ? 'Como chegamos a cada resposta?' : 'How do we arrive at each answer?'}
          lede={pt ? 'Cada secção tem fontes, pressupostos e formas de verificar diferentes. Escolhe a que estás a explorar.' : 'Each section has its own sources, assumptions and ways to check the results. Choose the one you are exploring.'}
          meta={<span>{pt ? `Revisto a ${revised}` : `Revised ${revised}`}</span>}
        />
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 md:pb-16"><div className="max-w-3xl">
          <nav aria-label={pt ? 'Métodos por secção' : 'Methods by section'} className="my-8 divide-y divide-line border-y border-line">
            {areas.map(area => (
              <div key={area.href} id={area.href === '/eleicoes/metodologia' ? 'eleicoes' : undefined} className="py-5">
                {/* Old shared links (/metodologia#eleicoes, #segunda-volta-2026) land on the elections row. */}
                {area.href === '/eleicoes/metodologia' && <span id="segunda-volta-2026" className="block" />}
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{area.label}</p>
                <Link href={area.href} locale={locale} className="mt-2 inline-flex min-h-11 items-center text-lg font-bold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">
                  {area.question}&nbsp;<span aria-hidden="true">→</span>
                </Link>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{area.description}</p>
                {area.extra && (
                  <p className="mt-1 text-sm">
                    <Link href={area.extra.href} locale={locale} className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">{area.extra.label}</Link>
                  </p>
                )}
              </div>
            ))}
          </nav>
          <section aria-labelledby="methodology-principles">
            <h2 id="methodology-principles" className="text-xl md:text-2xl">{pt ? 'O que vale para todas as secções?' : 'What holds for every section?'}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-stone-700">
              {principles.map(line => <li key={line}>{line}</li>)}
            </ul>
            <p className="mt-6 text-sm text-stone-600">
              {pt ? 'Quem faz o site e o que está publicado hoje: ' : 'Who makes the site and what is published today: '}
              <Link href="/sobre" locale={locale} className="font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">{pt ? 'sobre o estimador.pt' : 'about estimador.pt'}</Link>.
            </p>
          </section>
        </div></div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
