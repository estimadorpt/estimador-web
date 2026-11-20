import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeFailure, failureCodes, reach } from '../../scripts/lib/reach.mjs';

/** What `fetch` throws when the socket fails: "fetch failed", with the socket's error as its cause. */
const fetchFailed = (code: string, message = code) =>
  new TypeError('fetch failed', { cause: Object.assign(new Error(message), { code }) });

/** What `AbortSignal.timeout` rejects a fetch with. Its `code` is a number, not a string. */
const timedOut = () => new DOMException('The operation was aborted due to timeout', 'TimeoutError');

describe('reaching a host: why there was no HTTP answer', () => {
  it('reads the code fetch hides behind "fetch failed"', () => {
    expect(failureCodes(fetchFailed('EAI_AGAIN'))).toEqual(['EAI_AGAIN']);
    expect(failureCodes(new Error('plain'))).toEqual([]);
    expect(failureCodes(null)).toEqual([]);
    expect(failureCodes(timedOut())).toEqual([]);
  });

  it('reads every address a connection was tried on, once each', () => {
    const tried = new AggregateError(
      [Object.assign(new Error('v6'), { code: 'ENETUNREACH' }), Object.assign(new Error('v4'), { code: 'ETIMEDOUT' })],
      'all failed',
    );
    Object.assign(tried, { code: 'ETIMEDOUT' });
    expect(failureCodes(new TypeError('fetch failed', { cause: tried }))).toEqual(['ETIMEDOUT', 'ENETUNREACH']);
  });

  it('survives an error that is its own cause', () => {
    const loop: Error & { cause?: unknown } = new Error('loop');
    loop.cause = loop;
    expect(failureCodes(loop)).toEqual([]);
    expect(describeFailure(loop).kind).toBe('other');
  });

  it('names a DNS failure as one: 18 November 2026 was EAI_AGAIN', () => {
    const refusedByTheZone = describeFailure(fetchFailed('EAI_AGAIN', 'getaddrinfo EAI_AGAIN estimador.pt'));
    expect(refusedByTheZone.kind).toBe('dns');
    expect(refusedByTheZone.text).toBe('its name does not resolve (EAI_AGAIN: the DNS servers gave no usable answer)');
    const noSuchName = describeFailure(fetchFailed('ENOTFOUND'));
    expect(noSuchName.kind).toBe('dns');
    expect(noSuchName.text).toContain('ENOTFOUND: the DNS has no such name');
  });

  it('tells a timeout, a refusal, a dropped connection and a bad certificate apart', () => {
    expect(describeFailure(timedOut())).toEqual({ kind: 'timeout', text: 'no answer in time (the request timed out)' });
    expect(describeFailure(fetchFailed('UND_ERR_CONNECT_TIMEOUT')).text).toBe('no answer in time (UND_ERR_CONNECT_TIMEOUT)');
    expect(describeFailure(fetchFailed('ECONNREFUSED'))).toEqual({
      kind: 'refused',
      text: 'nothing accepted the connection (ECONNREFUSED)',
    });
    expect(describeFailure(fetchFailed('ECONNRESET')).kind).toBe('closed');
    expect(describeFailure(fetchFailed('CERT_HAS_EXPIRED'))).toEqual({
      kind: 'certificate',
      text: 'its certificate was not accepted (CERT_HAS_EXPIRED)',
    });
    expect(describeFailure(fetchFailed('ERR_TLS_CERT_ALTNAME_INVALID')).kind).toBe('certificate');
  });

  it('keeps what the runtime said when it does not know the failure', () => {
    expect(describeFailure(fetchFailed('EWHATEVER', 'something new'))).toEqual({
      kind: 'other',
      text: 'fetch failed: something new (EWHATEVER)',
    });
    expect(describeFailure(new TypeError('fetch failed', { cause: new Error('bad port') })).text).toBe(
      'fetch failed: bad port',
    );
    expect(describeFailure(undefined).text).toBe('an unknown error');
  });
});

describe('reaching a host: one question before the hundreds', () => {
  const noWait = async () => {};

  it('takes any HTTP status for an answer, at the first try', async () => {
    let asked = 0;
    const fetchImpl = async () => {
      asked += 1;
      return new Response('not found', { status: 404 });
    };
    expect(await reach('https://example.test/', { fetchImpl, sleep: noWait })).toEqual({ ok: true, status: 404 });
    expect(asked).toBe(1);
  });

  it('asks without following a redirect, and with a time limit', async () => {
    const seen: RequestInit[] = [];
    const fetchImpl = async (_url: string, init: RequestInit) => {
      seen.push(init);
      return new Response(null, { status: 301, headers: { location: '/pt/' } });
    };
    expect(await reach('https://example.test/', { fetchImpl, sleep: noWait })).toEqual({ ok: true, status: 301 });
    expect(seen[0].redirect).toBe('manual');
    expect(seen[0].signal).toBeInstanceOf(AbortSignal);
  });

  it('tries again after a failure, and waits between tries', async () => {
    const waits: number[] = [];
    let asked = 0;
    const fetchImpl = async () => {
      asked += 1;
      if (asked < 3) throw fetchFailed('ECONNRESET');
      return new Response('ok');
    };
    const sleep = async (ms: number) => {
      waits.push(ms);
    };
    expect(await reach('https://example.test/', { fetchImpl, sleep, waitMs: 7 })).toEqual({ ok: true, status: 200 });
    expect(asked).toBe(3);
    expect(waits).toEqual([7, 7]);
  });

  it('gives up after its tries and says why, in the words of the last failure', async () => {
    let asked = 0;
    const fetchImpl = async () => {
      asked += 1;
      throw fetchFailed('EAI_AGAIN');
    };
    expect(await reach('https://example.test/', { fetchImpl, sleep: noWait, attempts: 2 })).toEqual({
      ok: false,
      kind: 'dns',
      reason: 'its name does not resolve (EAI_AGAIN: the DNS servers gave no usable answer)',
    });
    expect(asked).toBe(2);
  });

  it('stops a request that never answers at its time limit', async () => {
    const never = (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    const started = Date.now();
    const answer = await reach('https://example.test/', { fetchImpl: never, sleep: noWait, attempts: 1, timeoutMs: 30 });
    expect(answer).toEqual({ ok: false, kind: 'timeout', reason: 'no answer in time (the request timed out)' });
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe('reaching a host: the checks that use it', () => {
  const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

  it('the smoke check asks the host once before the walk, and limits every request', () => {
    const script = read('scripts/smoke-check.mjs');
    const preflight = script.indexOf('await reach(');
    expect(preflight).toBeGreaterThan(-1);
    // The first walk comes after the preflight, or a dead host is asked 587 times first.
    expect(preflight).toBeLessThan(script.indexOf('await runAll(checks)'));
    expect(script).toContain('process.exit(3)');
    expect(script).toContain('signal: AbortSignal.timeout(TIMEOUT_MS)');
  });

  it('the deploy job and its smoke step cannot run for hours', () => {
    const workflow = read('.github/workflows/azure-static-web-apps.yml');
    const job = workflow.slice(workflow.indexOf('build_and_deploy_job:'), workflow.indexOf('close_pull_request_job:'));
    expect(job).toMatch(/\n    timeout-minutes: \d+\n/);
    const smoke = job.slice(job.indexOf('- name: Smoke check the deployed site'));
    expect(smoke).toMatch(/\n        timeout-minutes: \d+\n/);
  });
});
