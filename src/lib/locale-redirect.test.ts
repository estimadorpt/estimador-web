import { describe, expect, it } from 'vitest';
import { LOCALE_REDIRECT_SCRIPT } from './locale-redirect';

/** Runs the inline script against a fake address; returns where it sent the reader, if anywhere. */
function run(pathname: string, search = '', hash = ''): string | null {
  let target: string | null = null;
  const window = { location: { pathname, search, hash, replace: (to: string) => { target = to; } } };
  new Function('window', LOCALE_REDIRECT_SCRIPT)(window);
  return target;
}

describe('404 locale redirect', () => {
  it('sends a locale-less section address to the Portuguese page', () => {
    expect(run('/populacao/misteriosa')).toBe('/pt/populacao/misteriosa/');
    expect(run('/populacao/freguesia/0302FA/')).toBe('/pt/populacao/freguesia/0302FA/');
    expect(run('/desporto/liga/benfica', '?x=1', '#cenario')).toBe('/pt/desporto/liga/benfica/?x=1#cenario');
    expect(run('/marca')).toBe('/pt/marca/');
    expect(run('/eleicoes/legislativas/mapa/')).toBe('/pt/eleicoes/legislativas/mapa/');
  });

  it('leaves files without a trailing slash', () => {
    expect(run('/populacao/dados/ficheiro.csv')).toBe('/pt/populacao/dados/ficheiro.csv');
  });

  it('never touches a localised address or an unknown one', () => {
    expect(run('/pt/populacao/naoexiste/')).toBeNull();
    expect(run('/en/desporto/liga/avs/')).toBeNull();
    expect(run('/qualquer-coisa')).toBeNull();
    expect(run('/populacaoextra')).toBeNull();
    expect(run('/')).toBeNull();
  });
});
