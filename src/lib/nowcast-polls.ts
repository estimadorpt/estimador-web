/**
 * Who published a poll, read from its source link: only when the link is the outlet's own
 * site (a poll reported by an aggregator or another paper names no outlet).
 */
const OUTLETS: Array<[RegExp, string, string]> = [
  // host, Portuguese with its article, English
  [/(^|\.)cnnportugal\.iol\.pt$/, 'a CNN Portugal', 'CNN Portugal'],
  [/(^|\.)tvi\.iol\.pt$/, 'a TVI', 'TVI'],
  [/(^|\.)rtp\.pt$/, 'a RTP', 'RTP'],
  [/(^|\.)sicnoticias\.pt$/, 'a SIC', 'SIC'],
  [/(^|\.)publico\.pt$/, 'o Público', 'Público'],
  [/(^|\.)expresso\.pt$/, 'o Expresso', 'Expresso'],
  [/(^|\.)dn\.pt$/, 'o DN', 'DN'],
  [/(^|\.)jn\.pt$/, 'o JN', 'JN'],
  [/(^|\.)cmjornal\.pt$/, 'o Correio da Manhã', 'Correio da Manhã'],
  [/(^|\.)observador\.pt$/, 'o Observador', 'Observador'],
  [/(^|\.)rr\.pt$/, 'a Renascença', 'Renascença'],
  [/(^|\.)tsf\.pt$/, 'a TSF', 'TSF'],
  [/(^|\.)jornaldenegocios\.pt$/, 'o Jornal de Negócios', 'Jornal de Negócios'],
];

export function pollOutlet(url: string | null | undefined): { pt: string; en: string } | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  const hit = OUTLETS.find(([re]) => re.test(host));
  return hit ? { pt: hit[1], en: hit[2] } : null;
}
