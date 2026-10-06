import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * The election methodology (/eleicoes/metodologia), one MDX file per locale in
 * src/content/methodology/eleicoes/. The /metodologia hub keeps the old
 * #eleicoes and #segunda-volta-2026 anchors on its elections row.
 */
export const ELECTION_METHODOLOGY_REVISED = '2026-10-06';

export function electionMethodologySource(locale: string): string {
  const file = (l: string) => path.join(process.cwd(), 'src/content/methodology/eleicoes', `${l}.mdx`);
  const own = file(locale === 'en' ? 'en' : 'pt');
  return readFileSync(existsSync(own) ? own : file('pt'), 'utf8');
}
