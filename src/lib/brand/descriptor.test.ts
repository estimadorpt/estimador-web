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

  it('is the /sobre subtitle in both locales', () => {
    expect(pt.about.subtitle).toBe(BRAND_DESCRIPTOR.pt);
    expect(en.about.subtitle).toBe(BRAND_DESCRIPTOR.en);
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
