// L0 scorecard section (server component). Renders the PopulacaoScorecard feed:
// headline stats (person median / marital / child deficit / coverage), the gate
// result, per-district strata, per-constraint medians, the retrodiction and
// external-check blocks (from the feed, unavailable as fallback), a novelty note
// and any honesty_notes the feed carries. Every block is null-safe; a whole-feed
// failure is handled by the caller (page renders scorecard.unavailable).
//
// Numbers go through adaptivePrecision() (from @/lib/populacao/uncertainty) so the
// single-run point estimates render without a spurious interval and carry the
// 'point' confidence chip; when R>=2 replicates land, intervals light up with no
// change here. The confidence chip is A4's shared component (barrel import).

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import {
  adaptivePrecision,
  type Confidence,
} from '@/lib/populacao/uncertainty';
import type {
  PopulacaoScorecard,
  ReplicateInterval,
  ScorecardConstraint,
  ScorecardExternalCheck,
  ScorecardRetrodiction,
  ScorecardStratum,
} from '@/types/populacao';
import { ConfidenceChip } from '@/components/demographics/uncertainty';
import { StatTile } from './StatTile';

const ACCENT = '#9A4A2E';

export async function ScorecardSection({
  scorecard,
  locale,
}: {
  scorecard: PopulacaoScorecard;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'populacao' });
  const loc: 'pt' | 'en' = locale === 'en' ? 'en' : 'pt';
  const intlLoc = loc === 'en' ? 'en-GB' : 'pt-PT';

  // SRMSE headline: the adaptivePrecision display + its confidence chip.
  const srmse = (iv?: ReplicateInterval) => {
    if (!iv || !Number.isFinite(iv.value)) return null;
    const a = adaptivePrecision(iv, loc);
    return { display: a.display, confidence: a.confidence };
  };
  // Percentage-flavoured headline (coverage). Still runs the value through
  // adaptivePrecision to derive the honest confidence chip.
  const pct = (value?: number, decimals = 1) => {
    if (value == null || !Number.isFinite(value)) return null;
    const a = adaptivePrecision({ value, n_replicates: 1 }, loc);
    const display = new Intl.NumberFormat(intlLoc, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
    return { display, confidence: a.confidence };
  };

  const pickNote = (pt?: string, en?: string) =>
    (loc === 'en' ? en ?? pt : pt ?? en) ?? undefined;

  const scope = loc === 'en' ? scorecard.scope_en ?? scorecard.scope : scorecard.scope;

  const h = scorecard.headline;
  const personOwn = srmse(h?.person_srmse_own);
  const marital = srmse(h?.marital_srmse);
  // child_deficit is intentionally absent for the reference scope (a apurar) —
  // render an honest pending tile rather than importing a second run's value.
  const coverage = pct(h?.coverage_in_band, 0);
  const coverageConf: Confidence = 'point';

  const gate = h?.gate_threshold;
  const gateDisplay =
    gate != null
      ? new Intl.NumberFormat(intlLoc, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(gate)
      : null;

  const constraints = (scorecard.constraints ?? []).filter((c) => c.srmse_median);
  const constraintCap = Math.max(
    0.16,
    ...constraints.map((c) => c.srmse_median?.value ?? 0),
  );

  const fmtSrmseValue = (iv?: ReplicateInterval) =>
    iv && Number.isFinite(iv.value) ? adaptivePrecision(iv, loc).display : '—';

  // Retrodiction + external checks: driven by the feed so the national run lights
  // them up with no code change.
  const retro = scorecard.retrodiction as ScorecardRetrodiction | undefined;
  const retroOk = !!retro && retro.status !== 'unavailable';
  const retroHeadline = retro
    ? pickNote(retro.headline_pt, retro.headline)
    : undefined;
  const checks: ScorecardExternalCheck[] = scorecard.external_checks ?? [];

  return (
    <section className="border-t border-stone-200 pt-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          {t('scorecard.title')}
        </h2>
        <p className="mt-1 text-stone-600 max-w-2xl">{t('scorecard.subtitle')}</p>
        {/* Scope + status */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {scope && (
            <span className="text-[11px] text-stone-500">
              <span className="font-bold uppercase tracking-wider text-stone-400">
                {t('scorecard.scopeLabel')}:
              </span>{' '}
              <span className="text-stone-700">{scope}</span>
            </span>
          )}
          {scorecard.status === 'preliminary' && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A4A2E]">
              {t('scorecard.preliminaryNote')}
            </span>
          )}
        </div>
      </div>

      {/* Headline grid */}
      {h ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatTile
              accent
              label={t('scorecard.personMedian')}
              value={personOwn?.display ?? null}
              chip={personOwn && <ConfidenceChip confidence={personOwn.confidence} />}
            />
            <StatTile
              label={t('scorecard.marital')}
              value={marital?.display ?? null}
              chip={marital && <ConfidenceChip confidence={marital.confidence} />}
            />
            <StatTile
              label={t('scorecard.childDeficit')}
              value={null}
              caveat={t('scorecard.pending')}
            />
            <StatTile
              label={t('scorecard.coverage')}
              value={coverage?.display ?? null}
              chip={coverage && <ConfidenceChip confidence={coverageConf} />}
            />
          </div>

          {/* Gate result */}
          {personOwn && gateDisplay && (
            <p className="mt-5 text-sm text-stone-600">
              <span className="tabular-nums font-semibold text-stone-900">
                {personOwn.display}
              </span>{' '}
              <span className="text-stone-400">{h.passes_gate ? '≤' : '>'}</span>{' '}
              <span className="tabular-nums">{gateDisplay}</span>{' '}
              <span
                className="font-semibold"
                style={{ color: h.passes_gate ? ACCENT : '#b91c1c' }}
              >
                · {h.passes_gate ? t('scorecard.gatePass') : t('scorecard.gateFail')}
              </span>
              {typeof h.n_failures === 'number' && h.n_failures > 0 && (
                <span className="text-stone-400"> · {h.n_failures}</span>
              )}
            </p>
          )}

          {/* Uncertainty explainer link — explains the "estimativa pontual" chips. */}
          <Link
            href="/populacao/incerteza"
            className="mt-3 inline-block text-xs font-semibold hover:underline"
            style={{ color: ACCENT }}
          >
            {t('uncertainty.aboutTitle')} →
          </Link>
        </>
      ) : null}

      {/* Strata */}
      {scorecard.strata && scorecard.strata.length > 0 && (
        <div className="mt-10">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-3">
            {t('scorecard.strataTitle')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {scorecard.strata.map((s: ScorecardStratum) => {
                  const label = loc === 'en' ? s.label_en ?? s.label : s.label;
                  return (
                    <tr key={s.key} className="border-b border-stone-100">
                      <td className="py-2 pr-4 text-stone-800">{label}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-stone-500">
                        {s.n_parishes ?? '—'}
                      </td>
                      <td className="py-2 pl-4 text-right tabular-nums font-semibold text-stone-900">
                        {fmtSrmseValue(s.person_srmse_median)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Constraints */}
      {constraints.length > 0 && (
        <div className="mt-10">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-3">
            {t('scorecard.constraintsTitle')}
          </h3>
          <ul className="space-y-2">
            {constraints.map((c: ScorecardConstraint) => {
              const label = loc === 'en' ? c.label_en ?? c.label : c.label;
              const v = c.srmse_median?.value ?? 0;
              const width = Math.max(2, Math.min(100, (v / constraintCap) * 100));
              return (
                <li key={c.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4">
                  <div className="min-w-0">
                    <div className="text-sm text-stone-800 truncate">{label}</div>
                    <div className="mt-1 h-1 bg-stone-100">
                      <div
                        className="h-1"
                        style={{ width: `${width}%`, backgroundColor: ACCENT }}
                        aria-hidden
                      />
                    </div>
                  </div>
                  <span className="tabular-nums text-sm font-semibold text-stone-900">
                    {fmtSrmseValue(c.srmse_median)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Retrodiction + external checks — from the feed, unavailable as fallback. */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-l-2 border-stone-200 pl-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
            {t('scorecard.retrodiction')}
          </h3>
          {retroOk && retroHeadline ? (
            <p className="text-sm text-stone-700">{retroHeadline}</p>
          ) : (
            <p className="text-sm text-stone-500">{t('scorecard.unavailable')}</p>
          )}
        </div>
        <div className="border-l-2 border-stone-200 pl-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
            {t('scorecard.externalChecks')}
          </h3>
          {checks.length > 0 ? (
            <ul className="space-y-1.5">
              {checks.map((c) => {
                const label = loc === 'en' ? c.label_en ?? c.label : c.label;
                return (
                  <li key={c.key} className="text-sm text-stone-700 flex justify-between gap-3">
                    <span>{label}</span>
                    {typeof c.rel_error === 'number' && (
                      <span className="tabular-nums text-stone-500">
                        {new Intl.NumberFormat(intlLoc, {
                          style: 'percent',
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                          signDisplay: 'exceptZero',
                        }).format(c.rel_error)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">{t('scorecard.unavailable')}</p>
          )}
        </div>
      </div>

      {/* Novelty */}
      {scorecard.novelty &&
        (() => {
          const note = pickNote(scorecard.novelty.note_pt, scorecard.novelty.note);
          if (!note) return null;
          return (
            <p
              className="mt-8 text-sm leading-relaxed text-stone-600 max-w-3xl border-l-2 pl-4"
              style={{ borderLeftColor: ACCENT }}
            >
              {note}
            </p>
          );
        })()}

      {/* Honesty notes */}
      {scorecard.honesty_notes && scorecard.honesty_notes.length > 0 && (
        <ul className="mt-6 space-y-2 max-w-3xl">
          {scorecard.honesty_notes.map((n, i) => {
            const text = pickNote(n.pt, n.en);
            if (!text) return null;
            return (
              <li
                key={i}
                className="text-xs leading-relaxed text-stone-500 pl-4 border-l border-stone-200"
              >
                {text}
              </li>
            );
          })}
        </ul>
      )}

      {/* Provenance footer — code/number tokens (no translated words needed) */}
      {scorecard.provenance && (
        <div className="mt-8 pt-4 border-t border-stone-100 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium uppercase tracking-wider text-stone-400 tabular-nums">
          {scorecard.provenance.model_version && (
            <span>{scorecard.provenance.model_version}</span>
          )}
          {scorecard.provenance.code_commit && (
            <span className="font-mono normal-case">
              {scorecard.provenance.code_commit.slice(0, 7)}
            </span>
          )}
          {scorecard.provenance.census_vintage && (
            <span className="normal-case">{scorecard.provenance.census_vintage}</span>
          )}
          {scorecard.provenance.config?.n_constraints != null && (
            <span>{scorecard.provenance.config.n_constraints} INE</span>
          )}
          {scorecard.provenance.n_replicates != null && (
            <span>R={scorecard.provenance.n_replicates}</span>
          )}
          {scorecard.generated_at && (
            <span className="normal-case">
              {t('common.updated')}{' '}
              {new Date(scorecard.generated_at).toLocaleDateString(intlLoc, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
