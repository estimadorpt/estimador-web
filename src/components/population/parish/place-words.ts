/**
 * Prepositions for parish and município names in Portuguese. A "União das
 * freguesias" takes the feminine article ("na União…", "da União…"); a
 * município fallback is "o concelho de X", with the article the name takes
 * ("do Porto", "da Amadora"). Other names keep the bare preposition ("em
 * Aguada de Cima"), which is correct for most and never wrong-sounding for the
 * rest.
 */
import type { Locale } from '@/lib/population/labels';

export interface Scope {
  /** The parish name, or the município's when the figures are the município's. */
  name: string;
  municipality: boolean;
}

export const isUnion = (name: string) => /^União (das|de) freguesias/i.test(name);

/**
 * Município names that take an article in Portuguese ("concelho do Porto").
 * Only names where the usage is settled; everything else takes a bare "de".
 */
const MUNICIPALITY_ARTICLE: Record<string, 'o' | 'a'> = {
  Porto: 'o', Funchal: 'o', Barreiro: 'o', Seixal: 'o', Montijo: 'o', Entroncamento: 'o', Fundão: 'o',
  Cartaxo: 'o', Bombarral: 'o', Cadaval: 'o', Crato: 'o', Sabugal: 'o', Redondo: 'o', Corvo: 'o',
  Nordeste: 'o', 'Porto Santo': 'o', 'Peso da Régua': 'o',
  Amadora: 'a', Guarda: 'a', Maia: 'a', Trofa: 'a', Moita: 'a', Nazaré: 'a', Batalha: 'a', Lourinhã: 'a',
  Covilhã: 'a', 'Figueira da Foz': 'a', 'Marinha Grande': 'a', 'Póvoa de Varzim': 'a', 'Póvoa de Lanhoso': 'a',
  Mealhada: 'a', Lousã: 'a', Golegã: 'a', Chamusca: 'a', Azambuja: 'a', Horta: 'a', 'Ribeira Grande': 'a',
  'Ribeira Brava': 'a', 'Ponta do Sol': 'a', 'Praia da Vitória': 'a', Calheta: 'a', Madalena: 'a', Murtosa: 'a',
  Sertã: 'a', Vidigueira: 'a', 'Pampilhosa da Serra': 'a', Mêda: 'a',
};

/** "do Porto", "da Amadora", "de Lisboa". */
export function ofMunicipality(name: string): string {
  const article = MUNICIPALITY_ARTICLE[name];
  return article === 'o' ? `do ${name}` : article === 'a' ? `da ${name}` : `de ${name}`;
}

/** "concelho do Porto" / "Porto municipality". */
export function municipalityPhrase(name: string, locale: Locale): string {
  return locale === 'pt' ? `concelho ${ofMunicipality(name)}` : `${name} municipality`;
}

export function inScope(scope: Scope, locale: Locale): string {
  if (locale === 'en') return scope.municipality ? `in ${scope.name} municipality` : `in ${scope.name}`;
  if (scope.municipality) return `no ${municipalityPhrase(scope.name, locale)}`;
  return isUnion(scope.name) ? `na ${scope.name}` : `em ${scope.name}`;
}

export function ofScope(scope: Scope, locale: Locale): string {
  if (locale === 'en') return scope.municipality ? `of ${scope.name} municipality` : `of ${scope.name}`;
  if (scope.municipality) return `do ${municipalityPhrase(scope.name, locale)}`;
  return isUnion(scope.name) ? `da ${scope.name}` : `de ${scope.name}`;
}

/** The subject of a sentence: "Aguada de Cima", "a União das freguesias de …", "o concelho de Águeda". */
export function scopeSubject(scope: Scope, locale: Locale): string {
  if (locale === 'en') return scope.municipality ? `${scope.name} municipality` : scope.name;
  if (scope.municipality) return `o ${municipalityPhrase(scope.name, locale)}`;
  return isUnion(scope.name) ? `a ${scope.name}` : scope.name;
}

/**
 * Whether a name is long enough that repeating it in every heading would fill
 * a phone's screen (a union of three or four parishes): after the h1, such a
 * page says "esta freguesia".
 */
export function isLongName(name: string): boolean {
  return isUnion(name) || name.length > 36;
}

/** "esta freguesia" scopes, for the headings and prompts below the h1 of a long-named parish. */
export const THIS_PARISH = {
  in: { pt: 'nesta freguesia', en: 'in this parish' },
  of: { pt: 'desta freguesia', en: 'of this parish' },
  subject: { pt: 'esta freguesia', en: 'this parish' },
} as const;
