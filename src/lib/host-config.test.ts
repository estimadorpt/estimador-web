import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALE_SECTIONS } from './locale-redirect';

interface Route { route: string; redirect?: string; statusCode?: number; headers?: Record<string, string>; rewrite?: string }
const config: { routes: Route[] } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'staticwebapp.config.json'), 'utf8'));
const routes = config.routes;

/** Azure Static Web Apps: the first rule whose pattern matches wins; `*` matches the rest. */
function firstMatch(url: string): Route | undefined {
  return routes.find(rule => {
    const pattern = new RegExp(`^${rule.route.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}/?$`);
    return pattern.test(url);
  });
}

describe('host config', () => {
  it('sends clubs that left the first tier somewhere real (FR-02)', () => {
    for (const locale of ['pt', 'en']) {
      expect(firstMatch(`/${locale}/desporto/liga/avs/`)?.redirect).toBe(`/${locale}/desporto/liga/2025-26/`);
      expect(firstMatch(`/${locale}/desporto/liga/tondela`)?.redirect).toBe(`/${locale}/desporto/liga/2025-26/`);
      expect(firstMatch(`/${locale}/desporto/liga/boavista/`)?.redirect).toBe(`/${locale}/desporto/liga/`);
      expect(firstMatch(`/${locale}/desporto/liga/avs/`)?.statusCode).toBe(301);
    }
  });

  it('answers the shareable pages typed without a locale with a 301 (SP-12)', () => {
    for (const page of ['/populacao/misteriosa', '/populacao/dados', '/desporto/liga/simulador', '/marca']) {
      const rule = firstMatch(page);
      expect(rule?.redirect, page).toBe(`/pt${page}/`);
      expect(rule?.statusCode, page).toBe(301);
      // Each target is an exported page.
      expect(fs.existsSync(path.join(process.cwd(), 'src/app/[locale]', page, 'page.tsx')), page).toBe(true);
    }
  });

  it('lets the 404 script cover every top-level section the export has', () => {
    const sections = fs.readdirSync(path.join(process.cwd(), 'src/app/[locale]'), { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('[') && entry.name !== 'feed.xml')
      .map(entry => entry.name);
    for (const section of sections) expect(LOCALE_SECTIONS, section).toContain(section);
  });

  it('caches versioned population data for good and the rest sensibly (SP-19, SP-M6)', () => {
    expect(firstMatch('/data/population/v1.0.3/parish/010103.json')?.headers?.['cache-control']).toContain('immutable');
    expect(firstMatch('/data/population/manifest.json')?.headers?.['cache-control']).toContain('max-age=300');
    expect(firstMatch('/data/population-geography/country.json')?.headers?.['cache-control']).toBe('public, max-age=86400');
    for (const asset of ['/images/sections/football.webp', '/brand/estimador-logo.svg', '/branding/logo-horizontal.svg']) {
      expect(firstMatch(asset)?.headers?.['cache-control'], asset).toMatch(/max-age=604800/);
    }
  });
});
