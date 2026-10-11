/**
 * Team colours and display names for the card generators.
 *
 * This mirrors `src/lib/config/football.ts` and `src/lib/football-finding.ts`.
 * The generators run as plain node scripts outside the Next build and cannot
 * import the TypeScript modules, so the values are duplicated here once
 * rather than once per script; src/lib/football-brand-script.test.ts holds
 * the names and the finding to the site's.
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
  'Pacos Ferreira': 'Paços de Ferreira',
};

export function teamName(team) {
  return TEAM_NAMES[team] ?? team;
}

const hexToRgb = hex => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = ([r, g, b]) => `#${[r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const luminance = hex => {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * A club's colour on the white card, as teamColorOnPaper draws it on the
 * site: its own colour when that reaches 3:1 against white, else darkened
 * step by step until it does (Estoril's and Arouca's yellows become an ochre,
 * so a swatch never reads as the model's yellow band). For swatches and bars;
 * numbers stay in ink.
 */
export function teamColor(team) {
  const rgb = hexToRgb(TEAM_COLORS[team] ?? '#5c5c5c');
  if (!rgb) return '#5c5c5c';
  let current = rgb;
  for (let i = 0; i < 40 && contrast(rgbToHex(current), '#ffffff') < 3; i++) {
    current = [current[0] * 0.92, current[1] * 0.92, current[2] * 0.92];
  }
  return rgbToHex(current);
}

/* ------------------------------------------------------------ findings --- */

// Mirrors teamWithArticle and FEMININE_CLUBS in src/lib/config/football.ts and
// the finding in src/lib/football-finding.ts; football-brand.test.ts holds the
// two copies together.
const FEMININE_CLUBS = new Set(['Oliveirense', 'Sanjoanense', 'Academica', 'Ovarense']);

/** "o Porto", "a Oliveirense": Portuguese copy never writes a club without its article. */
export function teamWithArticle(team) {
  return `${FEMININE_CLUBS.has(team) ? 'a' : 'o'} ${teamName(team)}`;
}

const PT_TENTHS = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const EN_TENTHS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** A title share as a share of the simulated seasons ("em metade das épocas simuladas"). */
export function seasonShareWords(p, locale) {
  const pt = locale !== 'en';
  if (p >= 0.995) return pt ? 'em quase todas as épocas simuladas' : 'in almost every simulated season';
  if (p >= 0.95) return pt ? 'em mais de nove de cada dez épocas simuladas' : 'in more than nine in ten simulated seasons';
  if (p < 0.05) return pt ? 'em menos de uma de cada vinte épocas simuladas' : 'in fewer than one in twenty simulated seasons';
  const k = Math.min(9, Math.max(1, Math.round(p * 10)));
  const diff = p - k / 10;
  const qualifier = Math.abs(diff) < 0.02 ? '' : diff > 0 ? (pt ? 'pouco mais de ' : 'just over ') : (pt ? 'pouco menos de ' : 'just under ');
  if (k === 5) return pt ? `em ${qualifier}metade das épocas simuladas` : `in ${qualifier}half of the simulated seasons`;
  return pt
    ? `em ${qualifier}${PT_TENTHS[k]} de cada dez épocas simuladas`
    : `in ${qualifier}${EN_TENTHS[k]} in ten simulated seasons`;
}

/** "O Porto ganha a Liga em metade das épocas simuladas", without the full stop. */
export function titleFinding(team, pChampion, locale) {
  if (locale === 'en') return `${teamName(team)} win the league ${seasonShareWords(pChampion, locale)}`;
  const name = teamWithArticle(team);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ganha a Liga ${seasonShareWords(pChampion, locale)}`;
}

/** The count of simulated seasons a club wins the title in (titleSeasons). */
export function titleSeasons(team, pChampion, nSims, victoryPaths) {
  const path = victoryPaths?.[team];
  if (path && path.target === 'champion' && typeof path.n_target === 'number' && path.n_sims === nSims) return path.n_target;
  return Math.round(pChampion * nSims);
}
