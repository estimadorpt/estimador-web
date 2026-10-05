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
  'Alverca': '#D4121F',
  'Maritimo': '#009655',
  'Academico Viseu': '#1A1A1A',
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
  'Alverca': 'ALV',
  'Maritimo': 'MAR',
  'Academico Viseu': 'ACV',
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
  'Maritimo': 'maritimo',
  'Academico Viseu': 'academico-viseu',
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
  'Maritimo': 'Marítimo',
  'Academico Viseu': 'Ac. Viseu',
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
export const CURRENT_LIGA_SEASON = '2026-27';

/* ------------------------------------------------------------- Liga 2 ---- */
//
// The second tier passes ~39 clubs through six seasons, most of which have
// never played in the Primeira and so carry no entry above. Two deliberate
// restraints here:
//
//   * Colours are only listed for clubs whose identity we actually know
//     (mostly ones that have been up). Everyone else falls back to a neutral
//     stone, rather than a confidently-wrong brand colour.
//   * Logos exist for a handful of clubs only, so `liga2LogoSrc` returns null
//     instead of a path to a 404, and components draw an initials badge.

export const liga2TeamColors: Record<string, string> = {
  'Chaves': '#0B3C8C',
  'Farense': '#1F1F1F',
  'Feirense': '#0B5CAB',
  'Leixoes': '#C8102E',
  'Pacos Ferreira': '#F4C300',
  'Portimonense': '#1F1F1F',
  'Torreense': '#1B7A43',
  'Benfica B': '#E20E1B',
  'Porto B': '#003893',
  'Sporting CP B': '#006B3F',
};

/** Portuguese display names for clubs that only appear in the second tier. */
export const liga2DisplayNames: Record<string, string> = {
  'Academica': 'Académica',
  'Belenenses': 'Belenenses',
  'Belenenses SAD': 'Belenenses SAD',
  'Benfica B': 'Benfica B',
  'Chaves': 'Desp. Chaves',
  'Cova da Piedade': 'Cova da Piedade',
  'Covilha': 'Sp. Covilhã',
  'Leixoes': 'Leixões',
  'Pacos Ferreira': 'Paços de Ferreira',
  'Porto B': 'FC Porto B',
  'Sporting CP B': 'Sporting B',
  'Uniao Leiria': 'U. Leiria',
  'Vilafranquense': 'Vilafranquense',
  'Vilaverdense': 'Vilaverdense',
};

/** Display name for a Liga 2 club, falling back to the Primeira map. */
export function liga2DisplayName(team: string): string {
  return liga2DisplayNames[team] ?? ligaDisplayNames[team] ?? team;
}

/** Accent colour for a Liga 2 club; neutral stone when we do not know it. */
export function liga2TeamColor(team: string): string {
  return liga2TeamColors[team] ?? ligaTeamColors[team] ?? '#78716c';
}

/** Logo path, or null when no file exists for this club. */
export function liga2LogoSrc(team: string): string | null {
  const slug = ligaTeamSlugs[team];
  return slug ? `/images/teams/${slug}.png` : null;
}

/** Short badge text: first three letters of a one-word name, else initials. */
export function liga2Initials(team: string): string {
  const name = liga2DisplayName(team);
  const words = name.split(/[\s.]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

/** True for reserve sides, which play in Liga 2 but cannot be promoted. */
export function isReserveSide(team: string): boolean {
  return team.endsWith(' B');
}
