// Presentational cross-tab table. Renders a TabResult (live or pre-baked) with
// the editorial design system: no rounded cards, stone dividers, tabular-nums,
// terracotta accent only where it carries meaning. Counts are single-replicate
// point estimates, formatted via adaptivePrecision (confidence 'point'); shares
// are row-normalised percentages; min_cell cells render suppressed. Builder A3.

import type { TabResult } from '@/lib/populacao/tabulate-engine';
import type { LabelBook, Loc } from './labels';
import { adaptivePrecision } from '@/lib/populacao/uncertainty';

function fmtCount(n: number, locale: Loc): string {
  return adaptivePrecision({ value: n }, locale).display;
}

function fmtShare(share: number, locale: Loc): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(share * 100) + '%';
}

export function ResultTable({
  result,
  labels,
  locale,
  emptyText,
  totalText,
  suppressedText,
  unitLabel,
  mixedNote,
}: {
  result: TabResult;
  labels: LabelBook;
  locale: Loc;
  emptyText: string;
  totalText: string;
  suppressedText: string;
  unitLabel: string; // "pessoas" / "agregados" — the counting unit for this tab
  mixedNote?: string | null; // person-weighted caption for mixed person×household tabs
}) {
  const { rowDim, colDims, rowKeys, colKeys, matrix, rowTotals, colTotals, grandTotal, measure } =
    result;

  if (!rowKeys.length) {
    return <p className="text-sm text-stone-500 py-6">{emptyText}</p>;
  }

  const colLabel = (ck: string[]): string =>
    ck.length ? ck.map((val, i) => labels.catLabel(colDims[i], val)).join(' · ') : '';

  const hasCols = colDims.length > 0;

  return (
    <div className="space-y-2">
    <div className="overflow-x-auto border-y border-stone-200">
      <table className="w-full text-sm border-collapse tabular-nums">
        <thead>
          <tr className="border-b border-stone-300">
            <th
              scope="col"
              className="text-left font-semibold text-stone-700 py-2 pr-4 align-bottom text-[11px] uppercase tracking-wide"
            >
              {labels.varLabel(rowDim)}
            </th>
            {hasCols ? (
              colKeys.map((ck, ci) => (
                <th
                  key={ci}
                  scope="col"
                  className="text-right font-semibold text-stone-700 py-2 px-3 align-bottom whitespace-nowrap"
                >
                  {colLabel(ck)}
                </th>
              ))
            ) : (
              <th
                scope="col"
                className="text-right font-semibold text-stone-700 py-2 px-3 align-bottom whitespace-nowrap"
              >
                {measure === 'share' ? '%' : `n ${unitLabel}`}
              </th>
            )}
            {hasCols && (
              <th
                scope="col"
                className="text-right font-semibold text-stone-500 py-2 pl-3 align-bottom whitespace-nowrap"
                title={`n ${unitLabel}`}
              >
                {totalText}
                <span className="text-stone-400 font-normal"> (n {unitLabel})</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((rk, ri) => (
            <tr key={rk} className="border-b border-stone-100 hover:bg-stone-50/60">
              <th
                scope="row"
                className="text-left font-medium text-stone-800 py-1.5 pr-4 whitespace-nowrap"
              >
                {labels.catLabel(rowDim, rk)}
              </th>
              {matrix[ri].map((cell, ci) => (
                <td key={ci} className="text-right py-1.5 px-3 text-stone-700">
                  {cell.suppressed ? (
                    <span className="text-stone-400" title={suppressedText}>
                      &lt;{result.minCell}
                    </span>
                  ) : measure === 'share' ? (
                    fmtShare(cell.share ?? 0, locale)
                  ) : (
                    fmtCount(cell.count ?? 0, locale)
                  )}
                </td>
              ))}
              {hasCols && (
                <td className="text-right py-1.5 pl-3 text-stone-500 border-l border-stone-100">
                  {fmtCount(rowTotals[ri], locale)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-stone-300">
            <th scope="row" className="text-left font-semibold text-stone-700 py-2 pr-4">
              {totalText}
            </th>
            {hasCols ? (
              <>
                {colTotals.map((ct, ci) => (
                  <td key={ci} className="text-right py-2 px-3 font-semibold text-stone-700">
                    {fmtCount(ct, locale)}
                  </td>
                ))}
                <td className="text-right py-2 pl-3 font-semibold text-stone-700 border-l border-stone-100">
                  {fmtCount(grandTotal, locale)}
                </td>
              </>
            ) : (
              <td className="text-right py-2 px-3 font-semibold text-stone-700">
                {measure === 'share' ? fmtShare(1, locale) : fmtCount(grandTotal, locale)}
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
      {mixedNote && <p className="text-xs text-stone-500">{mixedNote}</p>}
    </div>
  );
}
