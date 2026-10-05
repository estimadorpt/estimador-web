import type { ReactNode } from 'react';
import { BookOpen, Download, Puzzle, ShieldCheck, Shapes } from 'lucide-react';
import { Action } from '@/components/brand/Action';
import { POPULATION_DOWNLOADS, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import type { Locale } from '@/lib/population/labels';

interface Entry {
  key: string;
  icon: ReactNode;
  kicker: string;
  title: string;
  text: string;
  action: string;
  href: string;
  external?: boolean;
  wide?: boolean;
}

function entries(locale: Locale): Entry[] {
  const pt = locale === 'pt';
  const icon = (Icon: typeof Puzzle) => <Icon aria-hidden="true" className="h-4 w-4" />;
  return [
    {
      key: 'game',
      icon: icon(Puzzle),
      kicker: pt ? 'Freguesia misteriosa' : 'Mystery parish',
      title: pt ? 'Consegues adivinhar a freguesia de hoje?' : 'Can you guess today’s parish?',
      text: pt
        ? 'Uma freguesia por dia, escondida atrás das suas respostas. Revela as pistas uma a uma e tenta descobrir qual é. Amanhã há outra.'
        : 'One parish a day, hidden behind its answers. Reveal the clues one at a time and try to work out which it is. Tomorrow brings another.',
      action: pt ? 'Joga a de hoje' : 'Play today’s',
      href: POPULATION_ROUTES.game,
      wide: true,
    },
    {
      key: 'quality',
      icon: icon(ShieldCheck),
      kicker: pt ? 'Qualidade' : 'Quality',
      title: pt ? 'Como sabemos que funciona?' : 'How do we know it works?',
      text: pt
        ? 'A população gerada comparada com as tabelas que o INE publica, e o que quer dizer cada nível de qualidade.'
        : 'The generated population set against the tables INE publishes, and what each quality tier means.',
      action: pt ? 'Ver a qualidade' : 'See the quality',
      href: POPULATION_ROUTES.quality,
    },
    {
      key: 'data',
      icon: icon(Download),
      kicker: pt ? 'Dados' : 'Data',
      title: pt ? 'Descarrega a população' : 'Download the population',
      text: pt
        ? 'Os ficheiros de pessoas e agregados, com o dicionário de variáveis e as somas de verificação, publicados no GitHub com licença CC BY 4.0.'
        : 'The person and household files, with the variable dictionary and checksums, published on GitHub under a CC BY 4.0 licence.',
      action: pt ? `Abrir a versão ${POPULATION_RELEASE}` : `Open release ${POPULATION_RELEASE}`,
      href: POPULATION_DOWNLOADS.release,
      external: true,
    },
    {
      key: 'methodology',
      icon: icon(BookOpen),
      kicker: pt ? 'Metodologia' : 'Methodology',
      title: pt ? 'Como foi gerada?' : 'How was it generated?',
      text: pt
        ? 'O modelo, os dados dos Censos 2021 em que foi calibrado e o que esta versão ainda não permite dizer.'
        : 'The model, the 2021 Census data it was calibrated to, and what this release cannot yet tell you.',
      action: pt ? 'Ler a metodologia' : 'Read the methodology',
      href: POPULATION_ROUTES.methodology,
    },
    {
      key: 'explainer',
      icon: icon(Shapes),
      kicker: pt ? 'Explicador' : 'Explainer',
      title: pt ? 'Como se constrói uma população sintética?' : 'How is a synthetic population built?',
      text: pt
        ? 'Um bairro imaginado, com dados fictícios, mostra a ideia passo a passo.'
        : 'An imagined neighbourhood, with fictional data, shows the idea step by step.',
      action: pt ? 'Ver o explicador' : 'See the explainer',
      href: POPULATION_ROUTES.explainer,
    },
  ];
}

/** Where to go next: the daily game first, then quality, data, method and the explainer. */
export function EntryCards({ locale }: { locale: Locale }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {entries(locale).map(entry => (
        <li key={entry.key} className={`flex flex-col rounded-2xl border border-line bg-cream p-5 md:p-6 ${entry.wide ? 'md:col-span-2' : ''}`}>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
            {entry.icon}
            {entry.kicker}
          </p>
          <h3 className={`text-ink ${entry.wide ? 'text-2xl' : 'text-xl'}`}>{entry.title}</h3>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-stone-600">{entry.text}</p>
          <div className="mt-auto pt-4">
            <Action
              href={entry.href}
              locale={entry.external ? undefined : locale}
              external={entry.external}
              variant={entry.wide ? 'secondary' : 'text'}
              arrow
            >
              {entry.action}
            </Action>
          </div>
        </li>
      ))}
    </ul>
  );
}
