import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRAND, MARK_FULL } from './index';
import { WORDMARK_BASELINE, WORDMARK_HEIGHT, WORDMARK_NAME, WORDMARK_TLD, WORDMARK_WIDTH, WORDMARK_X } from './wordmark';

const logo = (file: string) => readFileSync(path.join(process.cwd(), 'public/brand', file), 'utf8');

/**
 * The outlined wordmark in wordmark-paths.json is a copy of the approved logo's
 * paths (scripts/generate-brand-identity.mjs preserves those and only redraws
 * the mark), so a change to either shows up here.
 */
describe('outlined wordmark', () => {
  it('is the drawing in the published logo, ".pt" in BRAND.muted', () => {
    const svg = logo('estimador-logo.svg');
    expect(svg).toContain(`viewBox="0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}"`);
    expect(svg).toContain(`<path d="${MARK_FULL}" fill="${BRAND.ink}"/>`);
    expect(svg).toContain(`<g transform="translate(${WORDMARK_X} ${WORDMARK_BASELINE})">`);
    expect(svg).toContain(`<path d="${WORDMARK_NAME}" fill="${BRAND.ink}"/>`);
    expect(svg).toContain(`<path d="${WORDMARK_TLD}" fill="${BRAND.muted}"/>`);
  });

  it('is the same drawing in the paper version', () => {
    const svg = logo('estimador-logo-paper.svg');
    expect(svg).toContain(`d="${WORDMARK_NAME}"`);
    expect(svg).toContain(`d="${WORDMARK_TLD}"`);
  });
});
