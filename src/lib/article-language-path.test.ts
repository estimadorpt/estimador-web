import { describe, expect, it } from 'vitest';
import { articleLanguagePath } from './article-language-path';

const articles = { 'so-pt': ['pt'], ambas: ['pt', 'en'] };

describe('articleLanguagePath', () => {
  it('sends an article missing in the target locale to the index', () => {
    expect(articleLanguagePath(articles, '/artigos/so-pt', 'en')).toBe('/artigos');
    expect(articleLanguagePath(articles, '/artigos/so-pt/', 'en')).toBe('/artigos');
  });

  it('keeps an article that exists in the target locale', () => {
    expect(articleLanguagePath(articles, '/artigos/so-pt', 'pt')).toBe('/artigos/so-pt');
    expect(articleLanguagePath(articles, '/artigos/ambas', 'en')).toBe('/artigos/ambas');
  });

  it('keeps pages under /artigos that are not articles', () => {
    expect(articleLanguagePath(articles, '/artigos/tema', 'en')).toBe('/artigos/tema');
    expect(articleLanguagePath(articles, '/artigos/tema/', 'pt')).toBe('/artigos/tema/');
    expect(articleLanguagePath(articles, '/artigos/tema/modelo', 'en')).toBe('/artigos/tema/modelo');
    expect(articleLanguagePath({}, '/artigos/tema', 'en')).toBe('/artigos/tema');
  });

  it('ignores inherited object keys and other paths', () => {
    expect(articleLanguagePath(articles, '/artigos/constructor', 'en')).toBe('/artigos/constructor');
    expect(articleLanguagePath(articles, '/artigos', 'en')).toBe('/artigos');
    expect(articleLanguagePath(articles, '/sobre', 'en')).toBe('/sobre');
  });
});
