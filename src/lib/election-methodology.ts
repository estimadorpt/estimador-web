import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { isValidElement, type ReactNode } from 'react';

/** A heading's text, whatever MDX wrapped it in (strong, code, links). */
export function headingText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(headingText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return headingText(node.props.children);
  return '';
}

/**
 * A stable anchor from a heading's text, as the Liga methodology makes them:
 * "Método de Hondt e atribuição de mandatos" → metodo-de-hondt-e-atribuicao-de-mandatos.
 * The election and economy methodologies give every h2 and h3 one, so a
 * chart's "Metodologia" link can open at its own method (METH3-16).
 */
export function headingSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * The election methodology sections the archive charts link to, per locale
 * (the anchors come from each file's own headings). election-methodology.test.ts
 * checks every one against the MDX.
 */
export const ELECTION_METHOD_ANCHORS = {
  /** Legislativas: the three trends, the polling chart's method. */
  trend: { pt: 'estrutura-do-modelo', en: 'model-structure' },
  houseEffects: { pt: 'efeitos-das-empresas-de-sondagens', en: 'pollster-house-effects' },
  seats: { pt: 'metodo-de-hondt-e-atribuicao-de-mandatos', en: 'd-hondt-method-and-seat-allocation' },
  /** Blocs, majorities and the ENSC: what the legislativas page shows. */
  pageShows: { pt: 'o-que-a-pagina-mostra', en: 'what-the-page-shows' },
  /** The 2025 result's last seat in each circle (from the official count, not the forecast). */
  lastSeats: { pt: 'o-ultimo-mandato-de-cada-circulo', en: 'each-circle-s-last-seat' },
  /** "Mover votos": the seat simulator on the 2025 map. */
  simulator: { pt: 'o-simulador-mover-votos', en: 'the-move-votes-simulator' },
  /** "Por grupo de eleitores": the simulator's group mode (Censos 2021 groups, EEP 2024 gaps). */
  simulatorGroups: { pt: 'mover-votos-por-grupos', en: 'moving-votes-by-group' },
} as const;

export function electionMethodHref(section: keyof typeof ELECTION_METHOD_ANCHORS, locale: string): string {
  return `/eleicoes/metodologia#${ELECTION_METHOD_ANCHORS[section][locale === 'en' ? 'en' : 'pt']}`;
}

/**
 * The election methodology (/eleicoes/metodologia), one MDX file per locale in
 * src/content/methodology/eleicoes/. The /metodologia hub keeps the old
 * #eleicoes and #segunda-volta-2026 anchors on its elections row.
 */
export const ELECTION_METHODOLOGY_REVISED = '2026-11-23';

export function electionMethodologySource(locale: string): string {
  const file = (l: string) => path.join(process.cwd(), 'src/content/methodology/eleicoes', `${l}.mdx`);
  const own = file(locale === 'en' ? 'en' : 'pt');
  return readFileSync(existsSync(own) ? own : file('pt'), 'utf8');
}
