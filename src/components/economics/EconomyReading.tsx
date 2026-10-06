'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { Link2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { SectionIllustration } from '@/components/brand/SectionIllustration';

// The "prices" question/answer below is the site's one canonical phrasing of
// the inflation distinction — the home economy panel (EconomyPanel.tsx) and
// this component must say the same thing, so a reader who arrives from either
// place gets the identical answer.
const topics = [
  {
    id: 'prices', label: ['Preços', 'Prices'],
    title: ['Inflação mais baixa significa preços mais baixos?', 'Does lower inflation mean lower prices?'],
    body: ['Não necessariamente: inflação mais baixa significa que os preços sobem mais devagar. Não significa, por si só, que estejam a descer.', 'Not necessarily: lower inflation means prices are rising more slowly. It does not, by itself, mean prices are falling.'],
    insight: ['O nível dos preços e a velocidade a que mudam são coisas diferentes.', 'The level of prices and the speed at which they change are different things.'],
    question: ['O que entra no cabaz?', 'What goes into the basket?'],
    answer: ['O índice combina bens e serviços com pesos diferentes. A experiência de cada família depende daquilo que consome; não é necessariamente igual à média.', 'The index combines goods and services with different weights. Each household’s experience depends on what it consumes; it is not necessarily the same as the average.'],
  },
  {
    id: 'work', label: ['Trabalho', 'Work'],
    title: ['Menos desemprego significa mais emprego?', 'Does lower unemployment mean more employment?'],
    body: ['Nem sempre. A taxa de desemprego depende também de quem está a trabalhar ou à procura de trabalho. Uma mudança na população ativa pode alterar a leitura.', 'Not always. The unemployment rate also depends on who is working or looking for work. A change in the labour force can change the picture.'],
    insight: ['Olha para emprego, desemprego e participação em conjunto.', 'Look at employment, unemployment and participation together.'],
    question: ['Quem faz parte da população ativa?', 'Who is in the labour force?'],
    answer: ['Reúne pessoas empregadas e desempregadas. Estar sem emprego não basta para ser classificado como desempregado: contam também os critérios de procura e disponibilidade.', 'It includes employed and unemployed people. Being without a job is not enough to be classified as unemployed: job-search and availability criteria also matter.'],
  },
  {
    id: 'activity', label: ['Atividade', 'Activity'],
    title: ['A economia cresceu. Em volume ou em valor?', 'The economy grew. In volume or in value?'],
    body: ['O crescimento nominal inclui alterações nos preços. As medidas em volume procuram separar esse efeito da mudança na atividade económica.', 'Nominal growth includes price changes. Volume measures aim to separate that effect from changes in economic activity.'],
    insight: ['Mais euros não significam necessariamente mais produção.', 'More euros do not necessarily mean more production.'],
    question: ['Porque são revistos os dados?', 'Why are data revised?'],
    answer: ['As primeiras estimativas usam informação ainda incompleta. Quando chegam novas fontes, as séries podem ser revistas. A versão e a data de publicação fazem parte da interpretação.', 'Early estimates use incomplete information. As new sources arrive, series may be revised. The version and publication date are part of the interpretation.'],
  },
];

export function EconomyReading({
  locale,
  status,
  showIllustration = false,
}: {
  locale: string;
  /** Paused/unavailable/live status + last-reading date, rendered right beside
   * the question and answer — never as a separate section above them. */
  status?: ReactNode;
  /** The small companion illustration. Off by default; the paused/unavailable
   * branches (where this is the page's lead content) turn it on. It never
   * renders on narrow phones, so it cannot push the answer below the fold. */
  showIllustration?: boolean;
}) {
  const lang = locale === 'pt' ? 0 : 1;
  const [topicId, setTopicId] = useState('prices');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('topic');
    if (topics.some(topic => topic.id === fromUrl)) setTopicId(fromUrl!);
    const onPopState = () => {
      const next = new URLSearchParams(window.location.search).get('topic');
      if (topics.some(topic => topic.id === next)) setTopicId(next!);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function chooseTopic(value: string) {
    setTopicId(value);
    const url = new URL(window.location.href);
    url.searchParams.set('topic', value);
    url.hash = 'compreender';
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  async function shareTopic(topic: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('topic', topic);
    url.hash = 'compreender';
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    try {
      await navigator.clipboard.writeText(url.toString());
      setNotice(lang === 0 ? 'Ligação para esta pergunta copiada.' : 'Link to this question copied.');
    } catch {
      setNotice(lang === 0 ? 'A ligação desta pergunta está na barra de endereços.' : 'This question’s link is in the address bar.');
    }
  }

  return (
    <section id="compreender" style={{ scrollMarginTop: 90 }} aria-label={lang === 0 ? 'Compreender a economia' : 'Understanding the economy'} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
      <Tabs.Root value={topicId} onValueChange={chooseTopic} activationMode="automatic" className="min-w-0">
        <Tabs.List aria-label={lang === 0 ? 'Tema da economia' : 'Economy topic'} className="mb-4 flex rounded-xl bg-moss/60 p-1">
          {topics.map(topic => <Tabs.Trigger key={topic.id} value={topic.id} className="min-h-12 min-w-0 flex-1 rounded-lg px-2 text-sm font-bold text-ink data-[state=active]:bg-ink data-[state=active]:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">{topic.label[lang]}</Tabs.Trigger>)}
        </Tabs.List>
        {/* No id on the panels: Radix names them, and each tab's
            aria-controls points at that name. */}
        {topics.map(topic => (
          <Tabs.Content key={topic.id} value={topic.id} className="rounded-2xl border border-line bg-cream p-6 md:p-7 focus-visible:outline-2 focus-visible:outline-ink">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">{lang === 0 ? 'Ler um indicador' : 'Reading an indicator'}</p>
              {status && <div className="text-[11px] font-semibold text-ink-muted">{status}</div>}
            </div>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-4"><h2 className="text-2xl leading-tight">{topic.title[lang]}</h2><button type="button" onClick={() => shareTopic(topic.id)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-ink underline underline-offset-4 hover:bg-moss/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"><Link2 aria-hidden="true" size={15}/>{lang === 0 ? 'Partilhar' : 'Share'}</button></div>
                <p className="mt-4 leading-relaxed text-ink-muted">{topic.body[lang]}</p>
              </div>
              {/* The shop illustration: a small companion beside the answer on
                  wider screens, never a section above it, never shown on a
                  narrow phone where every pixel goes to the answer. */}
              {showIllustration && (
                <SectionIllustration
                  scene="economy"
                  className="hidden sm:block shrink-0 self-start !h-[84px] !w-[96px] !p-0 [&_img]:h-full [&_img]:w-full [&_img]:object-contain"
                />
              )}
            </div>
            <p className="my-6 rounded-lg bg-[#dce8e9] p-4 text-sm font-bold leading-relaxed text-ink">{topic.insight[lang]}</p>
            <details className="border-t border-line pt-4"><summary className="cursor-pointer py-2 text-sm font-bold text-ink">{topic.question[lang]}</summary><p className="mt-3 text-sm leading-relaxed text-ink-muted">{topic.answer[lang]}</p></details>
          </Tabs.Content>
        ))}
      </Tabs.Root>
      <aside className="rounded-2xl border border-line bg-cream p-6">
        <h2 className="text-xl">{lang === 0 ? 'Antes de comparar' : 'Before comparing'}</h2>
        <ol className="mt-5 space-y-6 text-sm text-ink-muted">
          {(lang === 0 ? [
            ['O mesmo período?', 'Um mês, um trimestre e um ano contam histórias diferentes.'],
            ['A mesma unidade?', 'Euros, percentagens e índices não são medidas equivalentes.'],
            ['A mesma versão?', 'Os dados podem ser revistos depois da primeira publicação.'],
          ] : [
            ['The same period?', 'A month, a quarter and a year tell different stories.'],
            ['The same unit?', 'Euros, percentages and indices are not equivalent measures.'],
            ['The same version?', 'Data may be revised after their first publication.'],
          ]).map(([title, body], i) => <li key={title} className="flex gap-3"><span className="pt-1 text-[11px] font-bold" aria-hidden="true">0{i+1}</span><div><h3 className="text-sm leading-snug font-bold text-ink">{title}</h3><p className="mt-2 leading-relaxed">{body}</p></div></li>)}
        </ol>
      </aside>
      <p className="sr-only" role="status">{notice}</p>
    </section>
  );
}
