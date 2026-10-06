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
  // Not in the 2026-27 Primeira, but the market scorecard's past seasons name it.
  'Pacos Ferreira': 'Paços de Ferreira',
};

/** Get the Portuguese display name for a team (with accents, abbreviated). */
export function teamDisplayName(team: string): string {
  return ligaDisplayNames[team] ?? team;
}

/**
 * Clubs that take the feminine article in Portuguese ("a Oliveirense"). None
 * of the 2026-27 Primeira Liga does: every club there is "o Porto", "o Sp.
 * Braga", "o Casa Pia".
 */
const FEMININE_CLUBS = new Set(['Oliveirense', 'Sanjoanense', 'Academica', 'Ovarense']);

export type PtClubForm = 'o' | 'de' | 'a' | 'para' | 'contra' | 'em';

/**
 * A club's display name with the Portuguese article a sentence needs:
 * "o Porto", "do Benfica", "ao Sporting", "para o Sp. Braga", "contra o
 * Vitória", "no Casa Pia". A bare name after a preposition ("para Porto",
 * "de Benfica vencer") reads as machine-filled (audit CL2-01, UXD2-06).
 */
export function teamWithArticle(team: string, form: PtClubForm = 'o'): string {
  const name = teamDisplayName(team);
  const fem = FEMININE_CLUBS.has(team);
  const article = {
    o: fem ? 'a' : 'o',
    de: fem ? 'da' : 'do',
    a: fem ? 'à' : 'ao',
    para: fem ? 'para a' : 'para o',
    contra: fem ? 'contra a' : 'contra o',
    em: fem ? 'na' : 'no',
  }[form];
  return `${article} ${name}`;
}

/**
 * Names for the narrowest columns (the league table on a phone): a word a
 * reader recognises, never a three-letter code like "STC" or "EAM".
 */
const ligaPhoneNames: Record<string, string> = {
  'SC Braga': 'Braga',
  'Santa Clara': 'Sta. Clara',
  'Academico Viseu': 'Ac. Viseu',
  'Estrela Amadora': 'Estrela',
  'Gil Vicente': 'Gil Vicente',
};

export function teamPhoneName(team: string): string {
  return ligaPhoneNames[team] ?? teamDisplayName(team);
}

/* ------------------------------------------------- colours on the page --- */

/**
 * The one 1X2 encoding (audit UXD2-V06): home dark, draw pale, away mid, the
 * same on the hub cards and the match page. Club colours stay on the rule
 * above each club's number, never in the split bar (a black or white kit
 * would match the ink or the paper).
 */
export const OUTCOME_TONES = { home: '#434d48', draw: '#d6d8cc', away: '#8b9a8e' } as const;

/** The page ground the team colours are drawn on (globals.css --color-paper). */
const PAPER = '#f5f3ea';
const INK = '#234c40';

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return 1;
  const la = luminance(ra);
  const lb = luminance(rb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * A club's colour as it may be drawn on the page ground: unchanged when it
 * already reaches 3:1 against paper (the WCAG minimum for graphics), else
 * darkened step by step until it does. Estoril and Arouca's yellows
 * (1,3:1 as drawn) become a readable ochre; every other club keeps its own
 * colour. For bars, swatches, lines and borders — numbers stay in ink.
 */
export function teamColorOnPaper(team: string): string {
  const base = ligaTeamColors[team] ?? liga2TeamColors[team] ?? '#5f7062';
  const rgb = hexToRgb(base);
  if (!rgb) return '#5f7062';
  let current: [number, number, number] = rgb;
  for (let i = 0; i < 40 && contrastRatio(rgbToHex(current), PAPER) < 3; i++) {
    current = [current[0] * 0.92, current[1] * 0.92, current[2] * 0.92];
  }
  return rgbToHex(current);
}

/** Distance between two colours, in a rough perceptual (redmean) RGB space. */
function colourDistance(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return Infinity;
  const rmean = (ra[0] + rb[0]) / 2;
  const dr = ra[0] - rb[0];
  const dg = ra[1] - rb[1];
  const db = ra[2] - rb[2];
  return Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db);
}

/** Neutral line colours for a club whose own colour another line already uses (all ≥ 3:1 on paper). */
const LINE_FALLBACKS = ['#434d48', '#8a5a2b', '#4d5b8c', '#7a4a6a', INK, '#5f7062'];

/**
 * Line colours for several clubs on one chart: each club keeps its on-paper
 * colour unless an earlier club in the list already uses one too close to
 * tell apart (Marítimo and Rio Ave are both dark green; Nacional and Vitória
 * both black), in which case it takes a neutral fallback. The end labels
 * still name every line.
 */
export function distinctTeamColors(teams: string[], minDistance = 150): Record<string, string> {
  const out: Record<string, string> = {};
  const used: string[] = [];
  let fallback = 0;
  for (const team of teams) {
    let colour = teamColorOnPaper(team);
    if (used.some(u => colourDistance(u, colour) < minDistance)) {
      while (fallback < LINE_FALLBACKS.length && used.some(u => colourDistance(u, LINE_FALLBACKS[fallback]) < minDistance)) fallback++;
      colour = LINE_FALLBACKS[Math.min(fallback, LINE_FALLBACKS.length - 1)];
      fallback++;
    }
    out[team] = colour;
    used.push(colour);
  }
  return out;
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

/** Short badge text, two letters so it fits the badge: "LE" for Leixões, "PF" for Paços de Ferreira. */
export function liga2Initials(team: string): string {
  const name = liga2DisplayName(team);
  const words = name.split(/[\s.]+/).filter(w => w && !/^(de|da|do|dos|das|e)$/i.test(w));
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** True for reserve sides, which play in Liga 2 but cannot be promoted. */
export function isReserveSide(team: string): boolean {
  return team.endsWith(' B');
}
