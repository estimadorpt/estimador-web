/**
 * Prepositions for parish names in Portuguese. A "União das freguesias" takes
 * the feminine article ("na União…", "da União…"); a município fallback is
 * always "o concelho de X". Other names keep the bare preposition ("em Aguada
 * de Cima"), which is correct for most and never wrong-sounding for the rest.
 */
import type { Locale } from '@/lib/population/labels';

export interface Scope {
  /** The parish name, or the município's when the figures are the município's. */
  name: string;
  municipality: boolean;
}

const isUnion = (name: string) => /^União das freguesias/i.test(name);

export function inScope(scope: Scope, locale: Locale): string {
  if (locale === 'en') return scope.municipality ? `in ${scope.name} municipality` : `in ${scope.name}`;
  if (scope.municipality) return `no concelho de ${scope.name}`;
  return isUnion(scope.name) ? `na ${scope.name}` : `em ${scope.name}`;
}

export function ofScope(scope: Scope, locale: Locale): string {
  if (locale === 'en') return scope.municipality ? `of ${scope.name} municipality` : `of ${scope.name}`;
  if (scope.municipality) return `do concelho de ${scope.name}`;
  return isUnion(scope.name) ? `da ${scope.name}` : `de ${scope.name}`;
}

/** The subject of a sentence: "Aguada de Cima", "a União das freguesias de …", "o concelho de Águeda". */
export function scopeSubject(scope: Scope, locale: Locale): string {
  if (locale === 'en') return scope.municipality ? `${scope.name} municipality` : scope.name;
  if (scope.municipality) return `o concelho de ${scope.name}`;
  return isUnion(scope.name) ? `a ${scope.name}` : scope.name;
}
