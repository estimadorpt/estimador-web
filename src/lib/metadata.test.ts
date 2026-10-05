import { describe, expect, it } from 'vitest';
import { createPageMetadata, siteTitle, TITLE_SUFFIX } from './metadata';

describe('page titles', () => {
  it('appends the one site suffix to a bare title', () => {
    expect(siteTitle('Metodologia da economia')).toBe('Metodologia da economia | estimador.pt');
  });

  it('replaces every suffix variant the catalogue still types', () => {
    for (const typed of [
      'Previsões Liga Portugal - estimador.pt',
      'Previsões Liga Portugal | estimador.pt',
      'Previsões Liga Portugal | Estimador',
      'Previsões Liga Portugal — estimador.pt',
      'Previsões Liga Portugal · estimador.pt',
    ]) {
      expect(siteTitle(typed), typed).toBe(`Previsões Liga Portugal${TITLE_SUFFIX}`);
    }
  });

  it('is idempotent', () => {
    const once = siteTitle('Temas — Artigos');
    expect(siteTitle(once)).toBe(once);
  });

  it('leaves a title that already names the site as written', () => {
    expect(siteTitle('estimador.pt — Dados para compreender Portugal')).toBe('estimador.pt — Dados para compreender Portugal');
    expect(siteTitle('Sobre o estimador.pt')).toBe('Sobre o estimador.pt');
  });

  it('keeps a dash that belongs to the title itself', () => {
    expect(siteTitle('Temas — Artigos | estimador.pt')).toBe('Temas — Artigos | estimador.pt');
  });

  it('is what createPageMetadata emits for the document and the share card', () => {
    const metadata = createPageMetadata({ locale: 'pt', path: '/economia', title: 'Economia (em preparação)', description: 'y' });
    expect(metadata.title).toBe('Economia (em preparação) | estimador.pt');
    expect(metadata.openGraph?.title).toBe('Economia (em preparação) | estimador.pt');
  });

  it('marks a page noindex when asked', () => {
    const metadata = createPageMetadata({ locale: 'pt', path: '/economia', title: 'x', description: 'y', index: false });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
