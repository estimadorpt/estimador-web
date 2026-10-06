import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import pt from '../../../messages/pt.json';
import en from '../../../messages/en.json';
import { BRAND_DESCRIPTOR, BRAND_LINE, brandDescriptor, brandLine } from './descriptor';

const ROOT = process.cwd();
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');

/**
 * CLAUDE.md promises one line and one descriptor, used identically wherever
 * they appear. Each surface that prints them is held to descriptor.json here.
 */
describe('brand descriptor', () => {
  it('has both locales, ending in a full stop', () => {
    for (const copy of [BRAND_LINE, BRAND_DESCRIPTOR]) {
      expect(copy.pt).toMatch(/\.$/);
      expect(copy.en).toMatch(/\.$/);
    }
    expect(brandLine('en')).toBe(BRAND_LINE.en);
    expect(brandDescriptor('xx')).toBe(BRAND_DESCRIPTOR.pt);
  });

  it('is the default meta description in both locales', () => {
    expect(pt.meta.defaultDescription).toBe(BRAND_DESCRIPTOR.pt);
    expect(en.meta.defaultDescription).toBe(BRAND_DESCRIPTOR.en);
  });

  it('is what the footer, the feed and the generators read, not a retyped copy', () => {
    const surfaces = {
      'src/components/SiteFooter.tsx': /brandDescriptor\(locale\)/,
      'src/app/[locale]/feed.xml/route.ts': /brandDescriptor\(locale\)/,
      'scripts/generate-og-images.mjs': /descriptor\.json/,
      'scripts/generate-social-kit.mjs': /descriptor\.json/,
    };
    for (const [file, reference] of Object.entries(surfaces)) {
      const source = read(file);
      expect(source, file).toMatch(reference);
      for (const copy of [BRAND_DESCRIPTOR.pt, BRAND_DESCRIPTOR.en, BRAND_LINE.pt, BRAND_LINE.en]) {
        expect(source, `${file} retypes "${copy}"`).not.toContain(copy);
      }
    }
    expect(read('scripts/generate-og-images.mjs')).toMatch(/brandStandfirst: BRAND_COPY\.descriptor\.pt/);
    expect(read('scripts/generate-og-images.mjs')).toMatch(/brandStandfirst: BRAND_COPY\.descriptor\.en/);
    expect(read('scripts/generate-social-kit.mjs')).toMatch(/descriptor: BRAND_COPY\.descriptor\.pt/);
    expect(read('scripts/generate-social-kit.mjs')).toMatch(/tagline: BRAND_COPY\.line\.pt/);
  });

  it('is printed verbatim in the README, in both locales', () => {
    const readme = read('README.md');
    expect(readme).toContain(BRAND_DESCRIPTOR.en);
    expect(readme).toContain(BRAND_DESCRIPTOR.pt);
  });

  it('is not retyped on /marca', () => {
    const marca = read('src/app/[locale]/marca/page.tsx');
    expect(marca).not.toContain(BRAND_DESCRIPTOR.pt);
    expect(marca).toContain('BRAND_DESCRIPTOR');
  });
});

describe('JSON-LD publisher logo', () => {
  it('declares the size of the file it points at', () => {
    const png = readFileSync(path.join(ROOT, 'public/logo.png'));
    // PNG IHDR: width and height are big-endian at bytes 16 and 20.
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const source = read('src/components/StructuredData.tsx');
    expect(source).toMatch(new RegExp(`url: "https://estimador\\.pt/logo\\.png",[\\s\\S]*?width: ${width},\\s*height: ${height},`));
  });
});
