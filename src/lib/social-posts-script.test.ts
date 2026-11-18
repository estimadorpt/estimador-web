import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatPp } from '@/lib/football-format';
import * as social from '../../scripts/lib/social-posts.mjs';

/**
 * The social posts (scripts/social-post.mjs) are written by templates from the
 * published files. These hold them to the site's numbers and voice, and to
 * each network's length, over every forecast of the current season.
 */
const footballDir = path.join(process.cwd(), 'public', 'data', 'football');
const season = fs.readdirSync(footballDir).filter(name => /^liga-\d{4}-\d{2}$/.test(name)).sort().pop()!;
const dir = path.join(footballDir, season);
const matchdays = fs.readdirSync(dir).map(file => /^md(\d+)\.json$/.exec(file)?.[1]).filter(Boolean).sort();
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));

const posts = matchdays.flatMap((md, index) => {
  const scenariosFile = `md${md}_scenarios.json`;
  const args = {
    current: read(`md${md}.json`),
    previous: index > 0 ? read(`md${matchdays[index - 1]}.json`) : null,
    scenarios: fs.existsSync(path.join(dir, scenariosFile)) ? read(scenariosFile) : null,
  };
  return [social.ligaPost({ ...args, locale: 'pt' }), social.ligaPost({ ...args, locale: 'en' })];
});

describe('the social posts', () => {
  it('print changes in points the way the site does', () => {
    for (let i = -400; i <= 400; i++) {
      const delta = i / 1000;
      expect(social.formatPp(delta, 'pt')).toBe(formatPp(delta, 'pt'));
      expect(social.formatPp(delta, 'en')).toBe(formatPp(delta, 'en'));
    }
  });

  it('fit Bluesky and X for every forecast this season, keeping the finding and the link', () => {
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      const x = social.fitTo('x', post);
      const bluesky = social.fitTo('bluesky', post);
      expect(social.xLength(x)).toBeLessThanOrEqual(280);
      expect(social.blueskyLength(bluesky)).toBeLessThanOrEqual(300);
      for (const text of [x, bluesky]) {
        expect(text.startsWith(post.text.split('\n\n')[0])).toBe(true);
        expect(text.endsWith(post.link)).toBe(true);
      }
    }
  });

  it('keep the site’s voice: no emoji, no exclamation, no question to the reader, minus as U+2212', () => {
    for (const post of posts) {
      expect(post.text).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(post.text).not.toMatch(/[!?]/);
      expect(post.text).not.toMatch(/\(-\d/);
      expect(post.text).not.toMatch(/\bvocê/i);
    }
  });

  it('mark the link for Bluesky at its UTF-8 byte range', () => {
    const text = 'Época à vista.\n\nhttps://estimador.pt/pt/desporto/liga/';
    const [facet] = social.linkFacets(text);
    const bytes = new TextEncoder().encode(text);
    expect(new TextDecoder().decode(bytes.slice(facet.index.byteStart, facet.index.byteEnd))).toBe('https://estimador.pt/pt/desporto/liga/');
  });
});

describe('the X request signature', () => {
  it('matches the OAuth 1.0a worked example in X’s documentation', async () => {
    const { oauthHeader } = await import('../../scripts/social-post.mjs');
    const header = oauthHeader('POST', 'https://api.twitter.com/1.1/statuses/update.json', {
      apiKey: 'xvz1evFS4wEEPTGEFPHBog',
      apiSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
      accessToken: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
      accessSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
    }, {
      nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
      timestamp: 1318622958,
      signed: { include_entities: 'true', status: 'Hello Ladies + Gentlemen, a signed OAuth request!' },
    });
    expect(header).toContain('oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"');
  });
});
