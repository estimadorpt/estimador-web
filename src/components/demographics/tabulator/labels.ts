// Bilingual label resolution for the tabulator, driven entirely by the manifest
// (no hardcoded strings — the manifest carries PT + EN for every variable,
// category and geography). Builder A3.

import type { PopulacaoManifest, ManifestVariable, ManifestGeo } from '@/types/populacao';

export type Loc = 'pt' | 'en';

export interface LabelBook {
  varLabel: (id: string) => string;
  catLabel: (dimId: string, code: string) => string;
  geoLabel: (level: string, code: string) => string;
  variable: (id: string) => ManifestVariable | undefined;
  geo: (level: string, code: string) => ManifestGeo | undefined;
}

export function makeLabelBook(manifest: PopulacaoManifest, locale: Loc): LabelBook {
  const varById = new Map<string, ManifestVariable>();
  for (const v of manifest.variables ?? []) varById.set(v.id, v);

  const catByDim = new Map<string, Map<string, { pt: string; en: string }>>();
  for (const v of manifest.variables ?? []) {
    const m = new Map<string, { pt: string; en: string }>();
    for (const c of v.categories ?? []) m.set(c.code, { pt: c.label, en: c.label_en ?? c.label });
    catByDim.set(v.id, m);
  }

  const geoByKey = new Map<string, ManifestGeo>();
  for (const g of manifest.geographies ?? []) geoByKey.set(`${g.level}:${g.code}`, g);

  const pick = (pt: string, en?: string) => (locale === 'en' ? (en ?? pt) : pt);

  return {
    variable: (id) => varById.get(id),
    geo: (level, code) => geoByKey.get(`${level}:${code}`),
    varLabel: (id) => {
      const v = varById.get(id);
      return v ? pick(v.label, v.label_en) : id;
    },
    catLabel: (dimId, code) => {
      const c = catByDim.get(dimId)?.get(code);
      return c ? pick(c.pt, c.en) : code;
    },
    geoLabel: (level, code) => {
      const g = geoByKey.get(`${level}:${code}`);
      // freguesia display: prefer the title-cased name where present
      const anyG = g as (ManifestGeo & { name_display?: string }) | undefined;
      return anyG ? anyG.name_display ?? anyG.name : code;
    },
  };
}
