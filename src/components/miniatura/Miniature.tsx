'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChoiceGroup } from '@/components/brand/Choice';
import { HOUSEHOLDS, VIEWS, bySize, type View } from '@/lib/miniatura/population';
import { HouseholdInspector } from './HouseholdInspector';
import { COMPACT_QUERY, type Layout } from './layout';
import { Scene } from './Scene';
import { COLOURS } from './scene-palette';
import './miniatura.css';

type Locale = 'pt' | 'en';

const VIEW_LABELS: Record<Locale, Record<View, string>> = {
  pt: { homes: 'Casas', age: 'Por idade', size: 'Por tamanho' },
  en: { homes: 'Homes', age: 'By age', size: 'By household size' },
};

/** The legend's age groups, short enough for one line on a phone (AGE_BANDS in full in the tables). */
const AGE_SHORT = ['0–14', '15–24', '25–64', '65+'];
const ALONE = bySize()[0].length;
const IN_FIVES = bySize()[4].length;

/** What each view shows, stated, and how to read it. */
const READOUT: Record<Locale, Record<View, { title: string; text: string }>> = {
  pt: {
    homes: { title: 'Cada casa é um agregado', text: '30 agregados e 100 pessoas, todos inventados. Escolhe uma casa para ver quem lá vive.' },
    age: { title: 'As mesmas 100 pessoas, por idade', text: 'Cada figura saiu de casa e juntou-se às da sua idade. São contagens como estas que se comparam com as tabelas do INE.' },
    size: { title: 'As mesmas 100 pessoas, por tamanho do agregado', text: `As mesmas figuras, agora ao lado de quem vive em agregados do mesmo tamanho: ${ALONE} vivem sozinhas, ${IN_FIVES} em agregados de cinco pessoas.` },
  },
  en: {
    homes: { title: 'Each home is a household', text: '30 households and 100 people, all invented. Choose a home to see who lives there.' },
    age: { title: 'The same 100 people, by age', text: 'Each figure has left home and joined the people of its age. Counts like these are what gets compared with INE’s tables.' },
    size: { title: 'The same 100 people, by household size', text: `The same figures, now beside the people in households of the same size: ${ALONE} live alone, ${IN_FIVES} in households of five.` },
  },
};

/**
 * The explainer's interactive part: the scene, the choice of view beside it,
 * the readout of what is shown (a live region on the page from load) and, once
 * a home is chosen, who lives there. On a phone the scene comes first, right
 * under the hero, and the view boxes sit under it, so a change of view happens
 * in sight. `children` are the table twins, rendered by the page.
 */
export function Miniature({ locale, children }: { locale: Locale; children?: ReactNode }) {
  const pt = locale === 'pt';
  const [view, setView] = useState<View>('homes');
  const [layout, setLayout] = useState<Layout>('wide');
  // Figures glide to their new spots only on a change of view, never on the first switch to the phone drawing.
  const [motion, setMotion] = useState(false);
  const [house, setHouse] = useState<number | null>(null);
  const [person, setPerson] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const update = () => { setMotion(false); setLayout(query.matches ? 'compact' : 'wide'); };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  function chooseView(next: View) {
    setMotion(true);
    setView(next);
  }
  function chooseHouse(id: number | null) {
    setHouse(id);
    setPerson(id === null ? null : HOUSEHOLDS[id].people[0].id);
  }
  // "Limpar" removes the panel the focus was in: hand it back to the homes (or, in a grouped view, the view boxes).
  function clear() {
    chooseHouse(null);
    requestAnimationFrame(() => {
      const target = root.current?.querySelector<HTMLElement | SVGElement>('.mini-house[tabindex="0"], .mini-controls button[aria-pressed="true"]');
      target?.focus();
    });
  }

  const readout = READOUT[locale][view];
  const chosen = house === null ? null : HOUSEHOLDS[house];
  const members = chosen?.people.length ?? 0;
  const selection = chosen === null ? null : view === 'homes'
    ? (pt ? `Em destaque, o agregado ${chosen.id + 1}: ${members} ${members === 1 ? 'pessoa' : 'pessoas'}.` : `Highlighted: household ${chosen.id + 1}, ${members} ${members === 1 ? 'person' : 'people'}.`)
    : (pt ? `As ${members === 1 ? 'pessoa' : `${members} pessoas`} do agregado ${chosen.id + 1} continuam em destaque.` : `The ${members === 1 ? 'person' : `${members} people`} of household ${chosen.id + 1} stay highlighted.`);

  return (
    <section ref={root} aria-labelledby="mini-explorer-title" className="mini-explorer">
      <h2 id="mini-explorer-title" className="sr-only">{pt ? 'O bairro inventado' : 'The invented neighbourhood'}</h2>
      <figure className="mini-figure">
        {/* Without a script the wide drawing stays, so its box keeps the wide proportions on a phone too. */}
        <noscript><style>{'.mini-scene{aspect-ratio:1000/540}'}</style></noscript>
        <Scene view={view} layout={layout} locale={locale} motion={motion} selectedHouse={house} selectedPerson={person} onHouseSelect={chooseHouse} />
        <figcaption className="mt-2 text-[13px] leading-snug text-graphite">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink" aria-label={pt ? 'Cor das figuras: a idade' : 'Figure colour: age'}>
            <li aria-hidden="true" className="text-graphite">{pt ? 'Idade' : 'Age'}</li>
            {AGE_SHORT.map((label, i) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-3 w-2.5" style={{ background: COLOURS[i] }} />
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-1">{pt ? 'Bairro inventado: nenhuma destas pessoas existe.' : 'An invented neighbourhood: none of these people exists.'}</p>
        </figcaption>
      </figure>

      <div className="mini-controls">
        <p aria-hidden="true" className="mb-1.5 text-[12px] text-graphite">{pt ? 'Mostrar as pessoas' : 'Show the people'}</p>
        <ChoiceGroup
          label={pt ? 'Mostrar as pessoas' : 'Show the people'}
          value={view}
          onChange={chooseView}
          options={VIEWS.map(v => ({ value: v, label: VIEW_LABELS[locale][v] }))}
        />
        <div aria-live="polite" className="mini-readout mt-3">
          <p className="font-display text-[19px] font-bold leading-6 text-ink">{readout.title}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{readout.text}</p>
          {selection && (
            <p className="mt-1 text-[15px] leading-relaxed text-ink">
              {selection}{' '}
              <a href="#mini-agregado" className="font-semibold text-ink underline underline-offset-4 lg:hidden">{pt ? 'Ver quem lá vive' : 'See who lives there'}</a>
            </p>
          )}
        </div>
      </div>

      <div className="mini-side">
        {house !== null && (
          <HouseholdInspector
            household={house}
            person={person}
            locale={locale}
            onPerson={setPerson}
            onHousehold={chooseHouse}
            onClear={clear}
          />
        )}
      </div>

      {children && <div className="mini-twins">{children}</div>}
    </section>
  );
}
