import type { ReactNode } from 'react';

/**
 * A hero's kicker without the part its back link already says (CL3-07):
 * "← Liga Portugal" above "Liga Portugal · Jogadores" names the section twice
 * in 40px, three times with a section tab row. The kicker's " · " segments
 * that repeat the back link's label go ("Jogadores"; "Dados · versão 1.0.3"),
 * and a kicker that was only the section name goes whole. The pattern /modelo
 * and /metodologia already follow ("← Liga Portugal", then "Metodologia"),
 * applied in one place so a new page cannot repeat it. Text only: a kicker or
 * label built from elements is left as it is.
 */
export function kickerWithoutBack(eyebrow: ReactNode, backLabel: ReactNode): ReactNode {
  if (typeof eyebrow !== 'string' || typeof backLabel !== 'string') return eyebrow;
  const same = (a: string, b: string) => a.trim().toLocaleLowerCase('pt') === b.trim().toLocaleLowerCase('pt');
  const segments = eyebrow.split(' · ');
  const kept = segments.filter(segment => !same(segment, backLabel));
  if (kept.length === segments.length) return eyebrow;
  if (!kept.length) return null;
  const rest = kept.join(' · ').trim();
  return rest.charAt(0).toLocaleUpperCase('pt') + rest.slice(1);
}
