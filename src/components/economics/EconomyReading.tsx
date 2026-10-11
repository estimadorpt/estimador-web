'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { Link2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Disclosure } from '@/components/viz/Disclosure';

// The "prices" statement below is the site's one canonical phrasing of the
// inflation distinction — the home economy panel (EconomyPanel.tsx,
// home.economyTitlePaused and home.economyPausedText) and this component must
// say the same thing, so a reader who arrives from either place reads the same.
// Each topic is stated, not asked (findings, not questions); the FAQ
// disclosures under them stay questions, since the reader opens them to ask.
const topics = [
  {
    id: 'prices', label: ['Preços', 'Prices'],
    title: ['Inflação mais baixa não quer dizer preços mais baixos', 'Lower inflation does not mean lower prices'],
    body: ['Inflação mais baixa significa que os preços sobem mais devagar. Não significa, por si só, que estejam a descer.', 'Lower inflation means prices are rising more slowly. It does not, by itself, mean prices are falling.'],
    insight: ['O nível dos preços e a velocidade a que mudam são coisas diferentes.', 'The level of prices and the speed at which they change are different things.'],
    question: ['O que entra no cabaz?', 'What goes into the basket?'],
    answer: ['O índice combina bens e serviços com pesos diferentes. A experiência de cada família depende daquilo que consome; não é necessariamente igual à média.', 'The index combines goods and services with different weights. Each household’s experience depends on what it consumes; it is not necessarily the same as the average.'],
  },
  {
    id: 'work', label: ['Trabalho', 'Work'],
    title: ['Menos desemprego nem sempre quer dizer mais emprego', 'Lower unemployment does not always mean more employment'],
    body: ['A taxa de desemprego depende também de quem está a trabalhar ou à procura de trabalho. Uma mudança na população ativa pode alterar a leitura.', 'The unemployment rate also depends on who is working or looking for work. A change in the labour force can change the picture.'],
    insight: ['Olha para emprego, desemprego e participação em conjunto.', 'Look at employment, unemployment and participation together.'],
    question: ['Quem faz parte da população ativa?', 'Who is in the labour force?'],
    answer: ['Reúne pessoas empregadas e desempregadas. Estar sem emprego não basta para ser classificado como desempregado: contam também os critérios de procura e disponibilidade.', 'It includes employed and unemployed people. Being without a job is not enough to be classified as unemployed: job-search and availability criteria also matter.'],
  },
  {
    id: 'activity', label: ['Atividade', 'Activity'],
    title: ['Crescer em valor não é o mesmo que crescer em volume', 'Growth in value is not the same as growth in volume'],
    body: ['O crescimento nominal inclui alterações nos preços. As medidas em volume procuram separar esse efeito da mudança na atividade económica.', 'Nominal growth includes price changes. Volume measures aim to separate that effect from changes in economic activity.'],
    insight: ['Mais euros não significam necessariamente mais produção.', 'More euros do not necessarily mean more production.'],
    question: ['Porque são revistos os dados?', 'Why are data revised?'],
    answer: ['As primeiras estimativas usam informação ainda incompleta. Quando chegam novas fontes, as séries podem ser revistas. A versão e a data de publicação fazem parte da interpretação.', 'Early estimates use incomplete information. As new sources arrive, series may be revised. The version and publication date are part of the interpretation.'],
  },
];

/**
 * The three readings of /economia: one statement per topic, its explanation,
 * the point to keep and a question the reader can open. Typographic tabs over
 * a rule, no boxes, no fills, no painting.
 */
export function EconomyReading({
  locale,
  status,
}: {
  locale: string;
  /** Paused/unavailable/live status + last-reading date, rendered right beside
   * the question and answer — never as a separate section above them. */
  status?: ReactNode;
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
      setNotice(lang === 0 ? 'Link para este tema copiado.' : 'Link to this topic copied.');
    } catch {
      setNotice(lang === 0 ? 'O link deste tema está na barra de endereços.' : 'This topic’s link is in the address bar.');
    }
  }

  return (
    <section id="compreender" style={{ scrollMarginTop: 90 }} aria-label={lang === 0 ? 'Compreender a economia' : 'Understanding the economy'} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
      <Tabs.Root value={topicId} onValueChange={chooseTopic} activationMode="automatic" className="min-w-0">
        <Tabs.List aria-label={lang === 0 ? 'Tema da economia' : 'Economy topic'} className="mb-5 flex gap-x-6 border-b border-rule">
          {topics.map(topic => <Tabs.Trigger key={topic.id} value={topic.id} className="-mb-px min-h-12 min-w-0 border-b-2 border-transparent text-[15px] text-graphite hover:text-ink data-[state=active]:border-ink data-[state=active]:font-semibold data-[state=active]:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink forced-colors:data-[state=active]:outline-2 forced-colors:data-[state=active]:outline-solid">{topic.label[lang]}</Tabs.Trigger>)}
        </Tabs.List>
        {/* No id on the panels: Radix names them, and each tab's
            aria-controls points at that name. */}
        {topics.map(topic => (
          <Tabs.Content key={topic.id} value={topic.id} className="focus-visible:outline-2 focus-visible:outline-ink">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <p className="text-[12px] text-graphite">{lang === 0 ? 'Ler um indicador' : 'Reading an indicator'}</p>
              {status && <div className="text-[12px] text-graphite">{status}</div>}
            </div>
            <div className="mt-2 min-w-0">
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-4"><h2 className="text-2xl leading-tight">{topic.title[lang]}</h2><button type="button" onClick={() => shareTopic(topic.id)} className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-ink underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"><Link2 aria-hidden="true" size={15}/>{lang === 0 ? 'Partilhar' : 'Share'}</button></div>
              <p className="mt-3 max-w-[68ch] leading-relaxed text-ink-muted">{topic.body[lang]}</p>
            </div>
            {/* The point to keep: a ruled line in semibold ink, no tinted box. */}
            <p className="mt-6 mb-4 max-w-[68ch] border-t border-rule pt-3 text-[15px] font-semibold leading-relaxed text-ink">{topic.insight[lang]}</p>
            <Disclosure className="border-t border-line pt-2" summary={topic.question[lang]}><p className="mt-2 text-sm leading-relaxed text-ink-muted">{topic.answer[lang]}</p></Disclosure>
          </Tabs.Content>
        ))}
      </Tabs.Root>
      {/* A checklist of three labels, each with its reason: ruled, no card. */}
      <div className="border-t border-ink pt-3">
        <h2 className="text-xl">{lang === 0 ? 'Antes de comparar' : 'Before comparing'}</h2>
        <ol className="mt-3 text-sm text-ink-muted">
          {(lang === 0 ? [
            ['O mesmo período', 'Um mês, um trimestre e um ano contam histórias diferentes.'],
            ['A mesma unidade', 'Euros, percentagens e índices não são medidas equivalentes.'],
            ['A mesma versão', 'Os dados podem ser revistos depois da primeira publicação.'],
          ] : [
            ['The same period', 'A month, a quarter and a year tell different stories.'],
            ['The same unit', 'Euros, percentages and indices are not equivalent measures.'],
            ['The same version', 'Data may be revised after their first publication.'],
          ]).map(([title, body], i) => <li key={title} className="flex gap-3 border-b border-grid py-3"><span className="disp pt-px text-[13px] text-ink" aria-hidden="true">{i + 1}</span><div><h3 className="text-sm leading-snug font-semibold text-ink">{title}</h3><p className="mt-1 leading-relaxed">{body}</p></div></li>)}
        </ol>
      </div>
      <p className="sr-only" role="status">{notice}</p>
    </section>
  );
}
