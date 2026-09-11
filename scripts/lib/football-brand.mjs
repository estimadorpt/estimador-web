/**
 * Team colours and display names for the card generators.
 *
 * This mirrors `src/lib/config/football.ts`. The generators run as plain node
 * scripts outside the Next build and cannot import the TypeScript module, so
 * the values are duplicated here once rather than once per script — which is
 * what the two hand-written SVG generators used to do.
 */

export const TEAM_COLORS = {
  'Porto': '#003893',
  'Sporting CP': '#006B3F',
  'Benfica': '#E20E1B',
  'SC Braga': '#C41E3A',
  'Gil Vicente': '#D4121F',
  'Famalicao': '#1B3A6B',
  'Moreirense': '#006838',
  'Estoril': '#FFD700',
  'Santa Clara': '#C8102E',
  'Vitoria SC': '#000000',
  'Casa Pia': '#1C3E6E',
  'Rio Ave': '#006338',
  'Nacional': '#000000',
  'Arouca': '#FFD100',
  'Estrela Amadora': '#E30613',
  'AVS': '#1D428A',
  'Boavista': '#000000',
  'Tondela': '#006B3E',
  'Alverca': '#D4121F',
  'Maritimo': '#009655',
  'Academico Viseu': '#1A1A1A',
};

export const TEAM_NAMES = {
  'Porto': 'Porto',
  'Sporting CP': 'Sporting',
  'Benfica': 'Benfica',
  'SC Braga': 'Sp. Braga',
  'Gil Vicente': 'Gil Vicente',
  'Famalicao': 'Famalicão',
  'Moreirense': 'Moreirense',
  'Estoril': 'Estoril',
  'Santa Clara': 'Santa Clara',
  'Vitoria SC': 'Vitória',
  'Casa Pia': 'Casa Pia',
  'Rio Ave': 'Rio Ave',
  'Nacional': 'Nacional',
  'Arouca': 'Arouca',
  'Estrela Amadora': 'Estrela',
  'AVS': 'AVS',
  'Boavista': 'Boavista',
  'Tondela': 'Tondela',
  'Alverca': 'Alverca',
  'Maritimo': 'Marítimo',
  'Academico Viseu': 'Ac. Viseu',
};

export function teamName(team) {
  return TEAM_NAMES[team] ?? team;
}

/**
 * Two clubs play in black and two in near-white. On the light card ground the
 * black kits read as an unlabelled bar, so they get the stone ink the rest of
 * the site uses for a neutral series.
 */
export function teamColor(team) {
  const raw = TEAM_COLORS[team];
  if (!raw) return '#78716C';
  return raw === '#000000' || raw === '#1A1A1A' ? '#292524' : raw;
}
