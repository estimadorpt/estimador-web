"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatElectionNumber, formatElectionSigned, pollsterDisplayName, sortByPartyOrder } from "@/lib/election-display";
import { partyColors } from "@/lib/config/colors";
import { BRAND } from "@/lib/brand";
import { getHeatmapColor, HOUSE_EFFECT_BLANK_BELOW } from "@/lib/election-heatmap";
import { ChartTable } from "@/components/viz/ChartTable";

import type { HouseEffect } from '@/types';

interface HouseEffectsProps {
  data: HouseEffect[];
  /** Overrides for the text below; by default it follows the page locale. */
  labels?: {
    /** Says that a blank cell is a deviation under the display threshold. */
    blankCells?: string;
    /** Caption of the table twin (every value to three decimals). */
    tableCaption?: string;
    /** Name of the matrix's scroll area, read by assistive technology. */
    regionLabel?: string;
  };
}

export function HouseEffects({ data, labels }: HouseEffectsProps) {
  const t = useTranslations("forecast");
  const locale = useLocale();
  const pt = locale !== 'en';
  const threshold = formatElectionNumber(HOUSE_EFFECT_BLANK_BELOW, locale, 2);
  const blankCells = labels?.blankCells ?? (pt
    ? `Células vazias: desvio inferior a ${threshold} em valor absoluto. A tabela abaixo tem todos os valores, com três casas decimais.`
    : `Blank cells: a deviation smaller than ${threshold} in absolute value. The table below has every value, to three decimal places.`);
  const tableCaption = labels?.tableCaption ?? (pt
    ? 'Efeito de cada empresa de sondagens em cada partido, em logit'
    : 'Each polling firm’s effect on each party, in logit');
  const regionLabel = labels?.regionLabel ?? (pt ? 'Efeitos das empresas de sondagens' : 'Polling house effects');
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500">
        <p>{t("houseEffectsLoading")}</p>
      </div>
    );
  }

  const transformedData = data.map(d => ({
    // One firm, one spelling across both archives ("Pitagorica" → "Pitagórica").
    pollster: pollsterDisplayName(d.pollster),
    party: d.party,
    effect: d.house_effect ?? d.effect ?? 0
  }));

  const pollsters = Array.from(new Set(transformedData.map(d => d.pollster))).sort((a, b) => a.localeCompare(b, locale === 'en' ? 'en' : 'pt'));
  // Columns in the archive's one party order, as in the trend chips and twins (AEE3-06).
  const parties = sortByPartyOrder(Object.keys(partyColors).filter(party =>
    transformedData.some(d => d.party === party)
  ));

  const matrix: Record<string, Record<string, number>> = {};
  transformedData.forEach(d => {
    if (!matrix[d.pollster]) matrix[d.pollster] = {};
    matrix[d.pollster][d.party] = d.effect;
  });

  return (
    <div className="w-full">
      {/* A scroll area: focusable, so a keyboard can scroll it, and named
          (A11Y2-06); the edge shadow says there is more to the side. */}
      <div tabIndex={0} role="region" aria-label={regionLabel} className="scroll-cue overflow-x-auto rounded-2xl border border-line">
        <table className="min-w-full">
          <thead className="bg-parchment">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-stone-700 w-40">
                {t("pollsterHeader")}
              </th>
              {parties.map(party => (
                <th key={party} scope="col" className="px-3 py-3 text-center text-sm font-semibold text-ink w-20">
                  <span className="mr-1 inline-block size-2 rounded-full" aria-hidden="true" style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }} />
                  {party}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pollsters.map(pollster => (
              <tr key={pollster}>
                <th scope="row" className="px-4 py-3 text-left text-sm font-medium text-ink bg-parchment">
                  {pollster}
                </th>
                {parties.map(party => {
                  const effect = matrix[pollster]?.[party] ?? 0;
                  const showValue = Math.abs(effect) > HOUSE_EFFECT_BLANK_BELOW;
                  // The exact value is the cell's title for a mouse and the
                  // table twin below for everyone else: no hover tooltip.
                  return (
                    <td
                      key={`${pollster}-${party}`}
                      className="px-3 py-3 text-center text-xs font-semibold tabular-nums"
                      style={{ backgroundColor: getHeatmapColor(effect), color: BRAND.forest }}
                      title={`${pollster} → ${party}: ${formatElectionSigned(effect, locale, 3)} logit`}
                    >
                      {showValue ? formatElectionSigned(effect, locale, 2) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-stone-600 space-y-2">
        <p>
          <strong>{t("houseEffectsTerm")}</strong> {t("houseEffectsExplainer")}
        </p>
        <p className="text-xs">{blankCells}</p>
        <p className="text-xs">{t("houseEffectsValuesNote")}</p>
      </div>
      <ChartTable
        caption={tableCaption}
        columns={[t("pollsterHeader"), ...parties]}
        rows={pollsters.map(pollster => [pollster, ...parties.map(party => matrix[pollster]?.[party] != null ? formatElectionSigned(matrix[pollster][party], locale, 3) : '—')])}
      />
    </div>
  );
}
