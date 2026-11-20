// Why a host gave no HTTP answer, and a quick way to find out before asking it
// for hundreds of URLs (scripts/smoke-check.mjs, scripts/check-freshness.mjs).
//
// On 18 November 2026 estimador.pt's DNS stopped answering. The smoke check
// then reported "fetch failed" 587 times, or sat for 47 minutes while every
// lookup timed out in turn, and the freshness alert said only "did not answer".
// A check that cannot reach the site must say so at once, and say why.

/**
 * Every string `code` on an error and on what caused it. `fetch` reports a
 * network failure as "fetch failed" and keeps the socket's own error in
 * `cause`; a connection tried on several addresses carries one error each in
 * `errors`.
 */
export function failureCodes(error) {
  const codes = [];
  const seen = new Set();
  const walk = value => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (typeof value.code === 'string' && !codes.includes(value.code)) codes.push(value.code);
    if (Array.isArray(value.errors)) value.errors.forEach(walk);
    walk(value.cause);
  };
  walk(error);
  return codes;
}

const NAME = ['ENOTFOUND', 'EAI_AGAIN', 'EAI_FAIL', 'EAI_NODATA', 'EAI_NONAME'];
const TIMED_OUT = ['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT'];
const REFUSED = ['ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH'];
const CLOSED = ['ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET'];
const isCertificate = code => /CERT|SELF_SIGNED|UNABLE_TO_VERIFY|ERR_TLS|ERR_SSL/.test(code);

/**
 * Why a request got no HTTP answer, as `{ kind, text }`. `kind` is `dns`,
 * `timeout`, `refused`, `closed`, `certificate` or `other`; `text` finishes the
 * sentence "… did not answer: " and names the code it was read from.
 */
export function describeFailure(error) {
  const codes = failureCodes(error);
  const first = list => codes.find(code => list.includes(code));
  const name = first(NAME);
  if (name) {
    return {
      kind: 'dns',
      text:
        name === 'ENOTFOUND'
          ? 'its name does not resolve (ENOTFOUND: the DNS has no such name)'
          : `its name does not resolve (${name}: the DNS servers gave no usable answer)`,
    };
  }
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError' || first(TIMED_OUT)) {
    return { kind: 'timeout', text: `no answer in time (${first(TIMED_OUT) ?? 'the request timed out'})` };
  }
  const refused = first(REFUSED);
  if (refused) return { kind: 'refused', text: `nothing accepted the connection (${refused})` };
  const closed = first(CLOSED);
  if (closed) return { kind: 'closed', text: `the connection was closed before an answer came (${closed})` };
  const certificate = codes.find(isCertificate);
  if (certificate) return { kind: 'certificate', text: `its certificate was not accepted (${certificate})` };
  // Keep whatever the runtime said: an unknown failure is still a clue.
  const said = [error?.message, error?.cause?.message].filter(Boolean).join(': ') || 'an unknown error';
  return { kind: 'other', text: codes.length ? `${said} (${codes.join(', ')})` : said };
}

/**
 * Does the host answer at all? Asks for one URL, a few times, a few seconds
 * apart, and stops at the first HTTP answer. Any status is an answer: judging
 * statuses is the caller's job. Returns `{ ok: true, status }`, or
 * `{ ok: false, kind, reason }` with the last failure in words.
 */
export async function reach(
  url,
  { attempts = 3, waitMs = 10_000, timeoutMs = 20_000, fetchImpl = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {},
) {
  let failure = { kind: 'other', text: 'it was never asked' };
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt) await sleep(waitMs);
    try {
      const response = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
      // Let the connection go: the body is not what was asked.
      await response.body?.cancel?.().catch(() => {});
      return { ok: true, status: response.status };
    } catch (error) {
      failure = describeFailure(error);
    }
  }
  return { ok: false, kind: failure.kind, reason: failure.text };
}
