'use client';

// L1 tabulator — client-side DuckDB-WASM cross-tab explorer (Builder A3).
//
// Lifecycle: the server renders a pre-baked featured table (instant first paint,
// SSR-safe). On mount we read ?q= (client-side URLSearchParams), decode it, and
// hydrate the live DuckDB-WASM engine. Every query edit updates the ?q= permalink
// (history.replaceState) and re-runs live; if WASM fails to init we fall back to
// the pre-baked featured JSON for that slug and surface an honest notice — the
// page never crashes and always shows numbers.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Link2, Copy, Check, Info, Download, Loader2 } from 'lucide-react';
import type { TabQuery, GeoLevel, PopulacaoManifest } from '@/types/populacao';
import { encodeQuery, decodeQuery } from '@/lib/populacao/permalink';
import { significanceGuard, claimIsSupported, hasInterval } from '@/lib/populacao/uncertainty';
import {
  runCrossTab,
  fetchFeaturedResult,
  manifestToSchema,
  type TabResult,
} from '@/lib/populacao/tabulate-engine';
import { makeLabelBook, type Loc } from './labels';
import { ResultTable } from './ResultTable';

const ACCENT = '#9A4A2E';

type EngineState = 'booting' | 'live' | 'fallback';

export function TabulatorExplorer({
  manifest,
  locale,
  initialQuery,
  initialResult,
}: {
  manifest: PopulacaoManifest;
  locale: Loc;
  initialQuery: TabQuery;
  initialResult: TabResult;
}) {
  const t = useTranslations('populacao');
  const schema = useMemo(() => manifestToSchema(manifest), [manifest]);
  const labels = useMemo(() => makeLabelBook(manifest, locale), [manifest, locale]);
  const minCell = manifest.min_cell ?? 10;

  const [query, setQuery] = useState<TabQuery>(initialQuery);
  const [result, setResult] = useState<TabResult>(initialResult);
  const [engineState, setEngineState] = useState<EngineState>('booting');
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  // Empty on server + first client render (avoids a hydration mismatch on the
  // permalink input); the full origin is filled in after mount.
  const [origin, setOrigin] = useState('');
  const reqId = useRef(0);

  const slug = useMemo(() => encodeQuery(query), [query]);

  // Run a query: live first, pre-baked featured JSON as fallback. Out-of-order
  // responses are dropped via the reqId guard.
  const applyQuery = useCallback(
    async (q: TabQuery, updateUrl: boolean) => {
      const id = ++reqId.current;
      const qSlug = encodeQuery(q);
      if (updateUrl && typeof window !== 'undefined') {
        window.history.replaceState(null, '', `?q=${qSlug}`);
      }
      setPending(true);
      try {
        const live = await runCrossTab(q, schema);
        if (id !== reqId.current) return;
        setResult(live);
        setEngineState('live');
      } catch {
        const fb = await fetchFeaturedResult(qSlug);
        if (id !== reqId.current) return;
        if (fb) setResult({ ...fb, source: 'static' });
        setEngineState('fallback');
      } finally {
        if (id === reqId.current) setPending(false);
      }
    },
    [schema],
  );

  // Mount: honour ?q=, then hydrate the live engine (even for the default view,
  // to confirm the pre-baked numbers and warm DuckDB).
  useEffect(() => {
    setOrigin(`${window.location.origin}${window.location.pathname}`);
    const params = new URLSearchParams(window.location.search);
    const q0 = params.get('q');
    const decoded = q0 ? decodeQuery(q0) : null;
    const effective = decoded ?? initialQuery;
    if (decoded) setQuery(decoded);
    void applyQuery(effective, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback(
    (next: TabQuery) => {
      setQuery(next);
      void applyQuery(next, true);
    },
    [applyQuery],
  );

  // ---- control handlers ----
  const rowDim = query.dims[0];
  const colDims = query.dims.slice(1);

  const setGeo = (value: string) => {
    const [level, code] = value.split(':') as [GeoLevel, string];
    update({ ...query, geoLevel: level, geo: code });
  };
  const setRow = (id: string) => {
    const cols = colDims.filter((c) => c !== id);
    update({ ...query, dims: [id, ...cols] });
  };
  const setCol = (idx: number, id: string) => {
    const cols = [...colDims];
    if (!id) cols.splice(idx);
    else cols[idx] = id;
    const dims = [rowDim, ...cols.filter((c, i, a) => c && c !== rowDim && a.indexOf(c) === i)];
    update({ ...query, dims });
  };
  const setMeasure = (measure: 'count' | 'share') => update({ ...query, measure });

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?q=${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the readonly input still shows the URL to copy */
    }
  };

  const permalinkUrl = `${origin}?q=${slug}`;

  // --- counting unit + honesty copy (bilingual; see note re: missing i18n keys) ---
  const unitLabel =
    result.entity === 'household'
      ? locale === 'en'
        ? 'households'
        : 'agregados'
      : locale === 'en'
        ? 'people'
        : 'pessoas';
  const mixedNote =
    result.entity === 'mixed'
      ? locale === 'en'
        ? 'Person-weighted: each person carries their household attributes (engine join).'
        : 'Ponderado por pessoa: cada pessoa recebe os atributos do seu agregado (junção no motor).'
      : null;
  const pointNoSepText =
    locale === 'en'
      ? "no replicates — we can't separate 1st from 2nd"
      : 'sem réplicas, não distinguimos o primeiro do segundo';

  // Provenance carried by the manifest (data-driven, ready for the national swap).
  const attribution = (
    manifest as PopulacaoManifest & {
      attribution?: {
        source_pt?: string;
        source_en?: string;
        disclaimer_pt?: string;
        disclaimer_en?: string;
        cite_as?: string;
      };
    }
  ).attribution;
  const license = (manifest as PopulacaoManifest & { license?: string }).license ?? 'CC BY 4.0';

  const downloadCsv = () => {
    // Provenance comment rows (#…) so a downloaded table never circulates without
    // its source, the synthetic disclaimer, the licence, the scope and the permalink.
    const scope =
      `${labels.varLabel(result.rowDim)}` +
      (result.colDims.length ? ' × ' + result.colDims.map((d) => labels.varLabel(d)).join(' × ') : '') +
      ` @ ${labels.geoLabel(query.geoLevel, query.geo) || query.geoLevel} (${t(`tabulator.${result.measure}`)})`;
    const src = locale === 'en' ? attribution?.source_en : attribution?.source_pt;
    const disc = locale === 'en' ? attribution?.disclaimer_en : attribution?.disclaimer_pt;
    const comments = [
      `# ${src ?? 'INE — Censos 2021'}`,
      `# ${disc ?? 'estimador.pt — synthetic population, not official INE microdata.'}`,
      `# ${license}${attribution?.cite_as ? ` · ${attribution.cite_as}` : ''}`,
      `# ${locale === 'en' ? 'Query' : 'Consulta'}: ${scope}`,
      `# Permalink: ${permalinkUrl}`,
    ];

    const rows: string[][] = [];
    const header = [labels.varLabel(result.rowDim)];
    if (result.colDims.length) {
      for (const ck of result.colKeys)
        header.push(ck.map((v, i) => labels.catLabel(result.colDims[i], v)).join(' / '));
      header.push(`Total (n ${unitLabel})`);
    } else {
      header.push(result.measure === 'share' ? '%' : `n ${unitLabel}`);
    }
    rows.push(header);
    result.rowKeys.forEach((rk, ri) => {
      const line = [labels.catLabel(result.rowDim, rk)];
      result.matrix[ri].forEach((cell) => {
        if (cell.suppressed) line.push(`<${result.minCell}`);
        else if (result.measure === 'share') line.push(((cell.share ?? 0) * 100).toFixed(2));
        else line.push(String(cell.count ?? 0));
      });
      if (result.colDims.length) line.push(String(result.rowTotals[ri]));
      rows.push(line);
    });
    const body = rows
      .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(','))
      .join('\n');
    const csv = comments.join('\n') + '\n' + body;
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `estimador-populacao-${slug.slice(0, 12)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ---- variable option groups ----
  const personVars = (manifest.variables ?? []).filter((v) => v.entity === 'person');
  const householdVars = (manifest.variables ?? []).filter((v) => v.entity === 'household');
  const geos = manifest.geographies ?? [];
  const byLevel = (lvl: string) => geos.filter((g) => g.level === lvl);

  // ---- significance-guard reading (demonstrates the guard on point estimates) ----
  const ranking = useMemo(() => {
    if (result.rowKeys.length < 2) return null;
    const useShare = result.measure === 'share' && result.colDims.length === 0;
    const items = result.rowKeys.map((rk, ri) => ({
      value: useShare ? (result.matrix[ri][0]?.share ?? 0) : result.rowTotals[ri],
      rk,
    }));
    const ranked = significanceGuard(items);
    const top = ranked[0];
    const runnerUp = ranked[1];
    if (!top || !runnerUp) return null;
    // Point regime = at least one of the top two carries no real replicate
    // interval. We must NOT claim a statistical *tie* then (that needs interval
    // evidence we don't have) — only say we cannot separate 1st from 2nd.
    const pointRegime = !hasInterval(top) || !hasInterval(runnerUp);
    const supported = claimIsSupported(top, runnerUp);
    return {
      topLabel: labels.catLabel(result.rowDim, (top as typeof items[number]).rk),
      runnerUpLabel: labels.catLabel(result.rowDim, (runnerUp as typeof items[number]).rk),
      pointRegime,
      supported,
    };
  }, [result, labels]);

  const geoValue = `${query.geoLevel}:${query.geo}`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 border-y border-stone-200 py-5">
        {/* Geo */}
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t('tabulator.geo')}
          </span>
          <select
            value={geoValue}
            onChange={(e) => setGeo(e.target.value)}
            className="mt-1 w-full border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
          >
            {byLevel('distrito').map((g) => (
              <option key={g.code} value={`distrito:${g.code}`}>
                {labels.geoLabel('distrito', g.code)}
              </option>
            ))}
            <optgroup label={locale === 'en' ? 'Municipalities' : 'Municípios'}>
              {byLevel('municipio').map((g) => (
                <option key={g.code} value={`municipio:${g.code}`}>
                  {labels.geoLabel('municipio', g.code)}
                </option>
              ))}
            </optgroup>
            <optgroup label={locale === 'en' ? 'Parishes' : 'Freguesias'}>
              {byLevel('freguesia').map((g) => (
                <option key={g.code} value={`freguesia:${g.code}`} disabled={g.suppressed}>
                  {labels.geoLabel('freguesia', g.code)}
                  {g.suppressed ? (locale === 'en' ? ' (suppressed)' : ' (suprimida)') : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        {/* Rows */}
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t('tabulator.rows')}
          </span>
          <select
            value={rowDim}
            onChange={(e) => setRow(e.target.value)}
            className="mt-1 w-full border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
          >
            <optgroup label={locale === 'en' ? 'People' : 'Pessoas'}>
              {personVars.map((v) => (
                <option key={v.id} value={v.id}>
                  {labels.varLabel(v.id)}
                </option>
              ))}
            </optgroup>
            <optgroup label={locale === 'en' ? 'Households' : 'Agregados'}>
              {householdVars.map((v) => (
                <option key={v.id} value={v.id}>
                  {labels.varLabel(v.id)}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        {/* Columns (up to two) */}
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t('tabulator.cols')}
          </span>
          <select
            value={colDims[0] ?? ''}
            onChange={(e) => setCol(0, e.target.value)}
            className="mt-1 w-full border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
          >
            <option value="">{locale === 'en' ? '— none —' : '— nenhuma —'}</option>
            <optgroup label={locale === 'en' ? 'People' : 'Pessoas'}>
              {personVars
                .filter((v) => v.id !== rowDim)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {labels.varLabel(v.id)}
                  </option>
                ))}
            </optgroup>
            <optgroup label={locale === 'en' ? 'Households' : 'Agregados'}>
              {householdVars
                .filter((v) => v.id !== rowDim)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {labels.varLabel(v.id)}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>

        {/* Measure toggle */}
        <div className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t('tabulator.measure')}
          </span>
          <div className="mt-1 flex border border-stone-300">
            {(['count', 'share'] as const).map((m) => {
              const active = query.measure === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMeasure(m)}
                  className={`flex-1 px-2 py-1.5 text-sm font-medium transition-colors ${
                    active ? 'text-white' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                  style={active ? { backgroundColor: ACCENT } : undefined}
                  aria-pressed={active}
                >
                  {t(`tabulator.${m}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured shortcuts */}
      {(manifest.featured ?? []).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t('tabulator.featured')}
          </span>
          {(manifest.featured ?? []).map((f) => {
            const active = f.slug === slug;
            return (
              <button
                key={f.slug}
                type="button"
                onClick={() => {
                  const q = decodeQuery(f.slug);
                  if (q) update(q);
                }}
                className={`border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-stone-400 bg-stone-100 text-stone-900'
                    : 'border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                {locale === 'en' ? f.label_en ?? f.label : f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Status line */}
      <div className="flex items-center gap-2 text-xs text-stone-500 min-h-[18px]">
        {pending && (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t('tabulator.loading')}
          </span>
        )}
        {!pending && engineState === 'fallback' && (
          <span className="inline-flex items-center gap-1.5 text-stone-600">
            <Info className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            {t('tabulator.wasmFallback')}
          </span>
        )}
      </div>

      {/* Result table */}
      <ResultTable
        result={result}
        labels={labels}
        locale={locale}
        emptyText={t('tabulator.empty')}
        totalText="Total"
        suppressedText={t('tabulator.minCell', { n: minCell })}
        unitLabel={unitLabel}
        mixedNote={mixedNote}
      />

      {/* Reading notes: min-cell suppression + point-estimate + significance guard */}
      <div className="space-y-1.5 text-xs text-stone-500">
        <p>{t('tabulator.minCell', { n: minCell })}</p>
        <p className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5"
            style={{ backgroundColor: ACCENT }}
            aria-hidden
          />
          {t('uncertainty.point')} — {t('uncertainty.aboutBody')}
        </p>
        {ranking && ranking.pointRegime ? (
          <p className="text-stone-500" title={t('uncertainty.aboutBody')}>
            {ranking.topLabel} · <span className="italic">{pointNoSepText}</span>
          </p>
        ) : ranking && !ranking.supported ? (
          <p className="text-stone-500" title={t('uncertainty.aboutBody')}>
            {ranking.topLabel} · <span className="italic">{t('uncertainty.tied')}</span>
          </p>
        ) : null}
      </div>

      {/* Permalink bar */}
      <div className="border-t border-stone-200 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          {t('tabulator.permalink')}
        </span>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 border border-stone-300 bg-stone-50 px-2 py-1.5 min-w-0">
            <Link2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              readOnly
              value={permalinkUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full min-w-0 bg-transparent text-xs text-stone-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('tabulator.linkCopied') : t('tabulator.copyLink')}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <Download className="w-3.5 h-3.5" />
              {t('tabulator.download')}
            </button>
          </div>
        </div>
      </div>

      {/* Methodology link */}
      <div className="pt-2">
        <Link
          href="/populacao/metodologia"
          className="text-sm font-semibold hover:underline"
          style={{ color: ACCENT }}
        >
          {t('methodologyLink')} →
        </Link>
      </div>
    </div>
  );
}
