import { Action } from '@/components/brand/Action';
import { POPULATION_DOWNLOADS, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import type { Locale } from '@/lib/population/labels';

interface Entry {
  key: string;
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
  return [
    {
      key: 'game',
      kicker: pt ? 'Freguesia misteriosa' : 'Mystery parish',
      title: pt ? 'Qual destas quatro é a freguesia de hoje?' : 'Which of these four is today’s parish?',
      text: pt
        ? 'Quatro freguesias por dia e as pistas de uma delas: as idades, os agregados, a escolaridade e o trabalho da sua população. Descobre qual é com o menor número de pistas. Amanhã há outras quatro.'
        : 'Four parishes a day and the clues to one of them: the ages, households, education and work of its population. Work out which it is with as few clues as you can. Tomorrow brings four more.',
      action: pt ? 'Joga a de hoje' : 'Play today’s',
      href: POPULATION_ROUTES.game,
      wide: true,
    },
    {
      key: 'quality',
      kicker: pt ? 'Qualidade' : 'Quality',
      title: pt ? 'A população gerada, medida contra o INE' : 'The generated population, measured against INE',
      text: pt
        ? 'A população gerada comparada com as tabelas que o INE publica, e o que quer dizer cada nível de qualidade.'
        : 'The generated population set against the tables INE publishes, and what each quality tier means.',
      action: pt ? 'Ver a qualidade' : 'See the quality',
      href: POPULATION_ROUTES.quality,
    },
    {
      key: 'data',
      kicker: pt ? 'Dados' : 'Data',
      title: pt ? 'Faz download da população' : 'Download the population',
      text: pt
        ? 'Os ficheiros de pessoas e agregados, com o dicionário de variáveis e os checksums, publicados no GitHub com licença CC BY-NC 4.0 (uso não comercial).'
        : 'The person and household files, with the variable dictionary and checksums, published on GitHub under a CC BY-NC 4.0 licence (non-commercial use).',
      action: pt ? `Abrir a versão ${POPULATION_RELEASE}` : `Open release ${POPULATION_RELEASE}`,
      href: POPULATION_DOWNLOADS.release,
      external: true,
    },
    {
      key: 'methodology',
      kicker: pt ? 'Metodologia' : 'Methodology',
      title: pt ? 'Como a população foi gerada' : 'How the population was generated',
      text: pt
        ? 'O modelo, os dados dos Censos 2021 em que foi calibrado e o que esta versão ainda não permite dizer.'
        : 'The model, the 2021 Census data it was calibrated to, and what this release cannot yet tell you.',
      action: pt ? 'Ler a metodologia' : 'Read the methodology',
      href: POPULATION_ROUTES.methodology,
    },
  ];
}

/**
 * Where to go next: the daily game first, then quality, data and method (the
 * explainer is linked from the hero, where a first-time reader starts). Each
 * is a ruled entry (a rule above, the name, a line, one action), not a card.
 * The game's title stays a question: it is the game's.
 */
export function EntryCards({ locale }: { locale: Locale }) {
  return (
    <ul className="grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
      {entries(locale).map(entry => (
        <li key={entry.key} className={`flex flex-col border-t ${entry.wide ? 'border-ink md:col-span-2' : 'border-rule'} pt-3`}>
          <p className="mb-1 text-[12px] text-graphite">{entry.kicker}</p>
          <h3 className={`text-ink ${entry.wide ? 'text-[24px] leading-7' : 'text-[19px] leading-6'}`}>{entry.title}</h3>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-graphite">{entry.text}</p>
          <div className="mt-auto pt-2">
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
