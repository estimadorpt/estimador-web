#!/usr/bin/env node
/**
 * Posts the latest Liga Portugal forecast to Bluesky and X, through a GitHub
 * issue that is both the approval step and the record of what went out.
 *
 *   node scripts/social-post.mjs --dry-run [--matchday 11] [--out dir]
 *       Print each network's text and write the card. Needs nothing.
 *   node scripts/social-post.mjs --draft
 *       Open a "social" issue for the latest forecast, unless one exists for
 *       it already (open or closed) or the forecast is older than MAX_AGE_DAYS.
 *       With SOCIAL_MODE=auto it then publishes straight away.
 *   node scripts/social-post.mjs --publish --issue 123
 *       Post what issue 123 drafted, comment the links, close the issue.
 *
 * The words come from lib/social-posts.mjs (templates, the site's own figures)
 * and the image from lib/liga-social-card.mjs. A network without its secrets
 * is skipped with a note, so Bluesky can go live before X has credits.
 *
 * Env: GITHUB_TOKEN, GITHUB_REPOSITORY (owner/name), SOCIAL_MODE (draft|auto),
 * BLUESKY_HANDLE, BLUESKY_APP_PASSWORD, X_API_KEY, X_API_SECRET,
 * X_ACCESS_TOKEN, X_ACCESS_SECRET.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadForecast, renderMatchdayCard, CARD_HEIGHT } from './lib/liga-social-card.mjs';
import { CARD_WIDTH } from './lib/og-cards.mjs';
import { ligaPost, fitTo, linkFacets } from './lib/social-posts.mjs';

const MAX_AGE_DAYS = 7;
const LABEL = 'social';
const MARKER = /<!-- social-post: (\{.*?\}) -->/;

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}
const has = (name) => process.argv.includes(name);

function buildPost(matchday) {
  const forecast = loadForecast(matchday);
  const post = ligaPost({ ...forecast, locale: 'pt' });
  return { forecast, post, texts: { bluesky: fitTo('bluesky', post), x: fitTo('x', post) } };
}

/* ------------------------------------------------------------- GitHub --- */

async function github(method, route, body) {
  const url = route.startsWith('/search/') ? `https://api.github.com${route}` : `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${route}`;
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`GitHub ${method} ${route}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

/** An earlier draft for this post, open or closed, found by its exact title (not its label). */
async function findIssue(id) {
  const title = `Social post: ${id}`;
  const q = encodeURIComponent(`repo:${process.env.GITHUB_REPOSITORY} is:issue in:title "${title}"`);
  const { items } = await github('GET', `/search/issues?q=${q}&per_page=20`);
  return items.find(issue => issue.title === title) ?? null;
}

function issueBody({ forecast, post, texts }) {
  const marker = JSON.stringify({ kind: 'liga', season: forecast.current.season, matchday: forecast.matchday, id: post.id });
  return [
    `Draft post for the Liga Portugal forecast of matchday ${forecast.matchday}. Add the \`approved\` label to post it to Bluesky and X; close the issue to drop it.`,
    '',
    '**Bluesky**',
    '```text', texts.bluesky, '```',
    '**X**',
    '```text', texts.x, '```',
    '**LinkedIn** (paste by hand on the estimador.pt page, with the card)',
    '```text', post.text, '```',
    `The card: \`node scripts/generate-social-images.mjs --matchday ${forecast.matchday}\`, also attached to this run's artifacts. Alt text: ${post.alt}`,
    '',
    `<!-- social-post: ${marker} -->`,
  ].join('\n');
}

/** A JSON response, or an error that names the call and its status. */
async function json(label, response) {
  const body = await response.text();
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status} ${body.slice(0, 300)}`);
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`${label}: HTTP ${response.status}, not JSON: ${body.slice(0, 300)}`);
  }
}

/* ------------------------------------------------------------ Bluesky --- */

async function postToBluesky(text, png, alt) {
  const { BLUESKY_HANDLE: identifier, BLUESKY_APP_PASSWORD: password } = process.env;
  if (!identifier || !password) return { skipped: 'no BLUESKY_HANDLE / BLUESKY_APP_PASSWORD secret' };
  const base = 'https://bsky.social/xrpc';
  const session = await json('Bluesky sign-in', await fetch(`${base}/com.atproto.server.createSession`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier, password }),
  }));
  if (!session.accessJwt) throw new Error(`Bluesky sign-in failed: ${JSON.stringify(session)}`);
  const auth = { authorization: `Bearer ${session.accessJwt}` };
  const upload = await json('Bluesky upload', await fetch(`${base}/com.atproto.repo.uploadBlob`, {
    method: 'POST', headers: { ...auth, 'content-type': 'image/png' }, body: png,
  }));
  if (!upload.blob) throw new Error(`Bluesky upload failed: ${JSON.stringify(upload)}`);
  const record = {
    $type: 'app.bsky.feed.post',
    text,
    langs: ['pt'],
    facets: linkFacets(text),
    createdAt: new Date().toISOString(),
    embed: { $type: 'app.bsky.embed.images', images: [{ alt, image: upload.blob, aspectRatio: { width: CARD_WIDTH, height: CARD_HEIGHT } }] },
  };
  const created = await json('Bluesky post', await fetch(`${base}/com.atproto.repo.createRecord`, {
    method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
  }));
  if (!created.uri) throw new Error(`Bluesky post failed: ${JSON.stringify(created)}`);
  return { url: `https://bsky.app/profile/${session.handle}/post/${created.uri.split('/').pop()}` };
}

/* ------------------------------------------------------------------ X --- */

const encode = (value) => encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * OAuth 1.0a user-context header. JSON and multipart bodies are not signed;
 * `signed` holds query or form parameters that are.
 */
export function oauthHeader(method, url, keys, { nonce = crypto.randomBytes(16).toString('hex'), timestamp = Math.floor(Date.now() / 1000), signed = {} } = {}) {
  const params = {
    oauth_consumer_key: keys.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(timestamp),
    oauth_token: keys.accessToken,
    oauth_version: '1.0',
  };
  const all = { ...signed, ...params };
  const parameterString = Object.keys(all).sort().map(key => `${encode(key)}=${encode(all[key])}`).join('&');
  const base = [method.toUpperCase(), encode(url), encode(parameterString)].join('&');
  const signingKey = `${encode(keys.apiSecret)}&${encode(keys.accessSecret)}`;
  params.oauth_signature = crypto.createHmac('sha1', signingKey).update(base).digest('base64');
  return 'OAuth ' + Object.keys(params).sort().map(key => `${encode(key)}="${encode(params[key])}"`).join(', ');
}

async function postToX(text, png, alt) {
  const keys = {
    apiKey: process.env.X_API_KEY, apiSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN, accessSecret: process.env.X_ACCESS_SECRET,
  };
  if (Object.values(keys).some(value => !value)) return { skipped: 'no X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET secret' };

  const uploadUrl = 'https://api.x.com/2/media/upload';
  const form = new FormData();
  form.append('media', new Blob([png], { type: 'image/png' }), 'card.png');
  form.append('media_category', 'tweet_image');
  const upload = await json('X upload', await fetch(uploadUrl, { method: 'POST', headers: { authorization: oauthHeader('POST', uploadUrl, keys) }, body: form }));
  const mediaId = upload?.data?.id ?? upload?.media_id_string;
  if (!mediaId) throw new Error(`X upload failed: ${JSON.stringify(upload)}`);

  const metadataUrl = 'https://api.x.com/2/media/metadata';
  await json('X alt text', await fetch(metadataUrl, {
    method: 'POST',
    headers: { authorization: oauthHeader('POST', metadataUrl, keys), 'content-type': 'application/json' },
    body: JSON.stringify({ id: mediaId, metadata: { alt_text: { text: alt.slice(0, 1000) } } }),
  }));

  const tweetUrl = 'https://api.x.com/2/tweets';
  const tweet = await json('X post', await fetch(tweetUrl, {
    method: 'POST',
    headers: { authorization: oauthHeader('POST', tweetUrl, keys), 'content-type': 'application/json' },
    body: JSON.stringify({ text, media: { media_ids: [mediaId] } }),
  }));
  if (!tweet?.data?.id) throw new Error(`X post failed: ${JSON.stringify(tweet)}`);
  return { url: `https://x.com/i/status/${tweet.data.id}` };
}

/* -------------------------------------------------------------- modes --- */

/** Networks an earlier run already posted this issue to, read from its own comments. */
async function alreadyPosted(issueNumber) {
  const comments = await github('GET', `/issues/${issueNumber}/comments?per_page=100`);
  const done = new Set();
  for (const comment of comments) {
    for (const match of (comment.body ?? '').matchAll(/^- (Bluesky|X): https:\/\//gm)) done.add(match[1]);
  }
  return done;
}

/** Bluesky refuses a blob over about 1 MB: fall back to the 1200×675 card. */
const BLUESKY_MAX_BYTES = 950_000;

async function publish(issueNumber) {
  const issue = await github('GET', `/issues/${issueNumber}`);
  if (issue.state !== 'open') {
    console.log(`#${issueNumber} is closed; not posting again.`);
    return;
  }
  const match = MARKER.exec(issue.body ?? '');
  if (!match) throw new Error(`Issue #${issueNumber} has no social-post marker`);
  const draft = JSON.parse(match[1]);
  const built = buildPost(draft.matchday);
  if (built.post.id !== draft.id) throw new Error(`Issue #${issueNumber} drafted ${draft.id}, but main now builds ${built.post.id} from the same matchday: the forecast files changed after the draft. Close this draft; the next deploy drafts again.`);
  const png = await renderMatchdayCard(built.forecast);
  const blueskyPng = png.length > BLUESKY_MAX_BYTES ? await renderMatchdayCard(built.forecast, { scale: 1 }) : png;

  const done = await alreadyPosted(issueNumber);
  const lines = [];
  let failed = false;
  const networks = [
    ['Bluesky', () => postToBluesky(built.texts.bluesky, blueskyPng, built.post.alt)],
    ['X', () => postToX(built.texts.x, png, built.post.alt)],
  ];
  for (const [network, send] of networks) {
    if (done.has(network)) {
      lines.push(`- ${network}: already posted, see above`);
      continue;
    }
    try {
      const result = await send();
      const line = result.url ? `- ${network}: ${result.url}` : `- ${network}: skipped, ${result.skipped}`;
      lines.push(line);
      // Recorded at once, so a retry after a later failure never posts this network twice.
      if (result.url) await github('POST', `/issues/${issueNumber}/comments`, { body: `Posted:\n${line}` });
    } catch (error) {
      failed = true;
      lines.push(`- ${network}: failed, ${error.message}`);
    }
  }
  const retry = failed ? '\n\nThe issue stays open. Remove and add `approved` again to retry; networks already posted are skipped.' : '';
  await github('POST', `/issues/${issueNumber}/comments`, { body: `Summary:\n${lines.join('\n')}${retry}` });
  if (!failed) await github('PATCH', `/issues/${issueNumber}`, { state: 'closed', state_reason: 'completed' });
  console.log(lines.join('\n'));
  if (failed) process.exit(1);
}

async function draft() {
  const built = buildPost(null);
  const ageDays = (Date.now() - new Date(built.forecast.current.timestamp).getTime()) / 86_400_000;
  if (ageDays > MAX_AGE_DAYS) {
    console.log(`${built.post.id} is ${ageDays.toFixed(1)} days old; not drafting.`);
    return;
  }
  if (await findIssue(built.post.id)) {
    console.log(`${built.post.id} already has an issue; nothing to do.`);
    return;
  }
  const issue = await github('POST', '/issues', {
    title: `Social post: ${built.post.id}`,
    body: issueBody(built),
    labels: [LABEL],
  });
  console.log(`Drafted #${issue.number} for ${built.post.id}`);
  const outDir = arg('--out');
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${built.post.id}.png`), await renderMatchdayCard(built.forecast));
  }
  if (process.env.SOCIAL_MODE === 'auto') await publish(issue.number);
}

async function dryRun() {
  const requested = arg('--matchday');
  const built = buildPost(requested === null ? null : Number(requested));
  for (const [network, text] of Object.entries(built.texts)) console.log(`--- ${network}\n${text}\n`);
  console.log(`--- alt\n${built.post.alt}`);
  const outDir = arg('--out');
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `${built.post.id}.png`);
    fs.writeFileSync(file, await renderMatchdayCard(built.forecast));
    console.log(`\nCard: ${file}`);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const run = has('--publish') ? () => publish(Number(arg('--issue'))) : has('--draft') ? draft : dryRun;
  run().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
