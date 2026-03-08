// Liga Portugal team configuration

export const ligaTeamColors: Record<string, string> = {
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
};

export const ligaTeamShortNames: Record<string, string> = {
  'Porto': 'POR',
  'Sporting CP': 'SCP',
  'Benfica': 'SLB',
  'SC Braga': 'BRA',
  'Gil Vicente': 'GIL',
  'Famalicao': 'FAM',
  'Moreirense': 'MOR',
  'Estoril': 'EST',
  'Santa Clara': 'STC',
  'Vitoria SC': 'VSC',
  'Casa Pia': 'CPA',
  'Rio Ave': 'RIO',
  'Nacional': 'NAC',
  'Arouca': 'ARO',
  'Estrela Amadora': 'EAM',
  'AVS': 'AVS',
  'Boavista': 'BOA',
  'Tondela': 'TON',
};

export const ligaTeamSlugs: Record<string, string> = {
  'Porto': 'porto',
  'Sporting CP': 'sporting',
  'Benfica': 'benfica',
  'SC Braga': 'braga',
  'Gil Vicente': 'gil-vicente',
  'Famalicao': 'famalicao',
  'Moreirense': 'moreirense',
  'Estoril': 'estoril',
  'Santa Clara': 'santa-clara',
  'Vitoria SC': 'vitoria',
  'Casa Pia': 'casa-pia',
  'Rio Ave': 'rio-ave',
  'Nacional': 'nacional',
  'Arouca': 'arouca',
  'Estrela Amadora': 'estrela',
  'AVS': 'avs',
  'Boavista': 'boavista',
  'Tondela': 'tondela',
  'Alverca': 'alverca',
};

// Display names: Portuguese-friendly names with proper accents
// Data keys use ASCII names without accents; this maps to proper display names
export const ligaDisplayNames: Record<string, string> = {
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
};

/** Get the Portuguese display name for a team (with accents, abbreviated). */
export function teamDisplayName(team: string): string {
  return ligaDisplayNames[team] ?? team;
}

// Reverse lookup: slug → team name
export const ligaSlugToTeam: Record<string, string> = Object.fromEntries(
  Object.entries(ligaTeamSlugs).map(([team, slug]) => [slug, team])
);

// Team logo path helper
export function teamLogoSrc(team: string): string {
  const slug = ligaTeamSlugs[team];
  return slug ? `/images/teams/${slug}.png` : '';
}

// Current season
export const CURRENT_LIGA_SEASON = '2025-26';
