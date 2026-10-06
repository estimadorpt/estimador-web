"use client";

import { teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { TeamStrength } from "@/types/football";
import { useLocale } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { formatSigned } from "@/lib/football-format";

interface TeamStrengthRatingsProps {
  strengths: Record<string, TeamStrength>;
  labels: {
    attack?: string;
    defense?: string;
    worse?: string;
    better?: string;
  };
}

// Consistent color palette — no team colors to avoid the white/red problem
const GOOD_COLOR = '#3a6b50';   // green-800 — strong attack or strong defense
const WEAK_COLOR = '#a3543a';   // red-600  — weak attack or weak defense

function Bar({ value, maxVal }: { value: number; maxVal: number }) {
  // value: positive = better. Bars grow from the centre line (league average).
  const pct = (Math.abs(value) / maxVal) * 50;
  return (
    <div className="relative h-5 flex-1">
      <div className="absolute inset-0 bg-parchment" />
      <div className="absolute top-0 bottom-0 w-px bg-stone-500" style={{ left: "50%" }} />
      <div
        className="absolute top-0 h-full"
        style={value >= 0
          ? { left: "50%", width: `${pct}%`, backgroundColor: GOOD_COLOR, opacity: 0.55 }
          : { left: `${50 - pct}%`, width: `${pct}%`, backgroundColor: WEAK_COLOR, opacity: 0.45 }}
      />
    </div>
  );
}

/**
 * Attack and defence per club, both drawn "worse ← 0 → better" around the
 * league average. On a phone the club's full name sits above its two bars,
 * so no name is cut to "Morei…" (audit UXM2-07, PUB2-10); each track is
 * labelled at both ends and at its zero (UXM2-07). The drawing is hidden
 * from assistive technology, which gets a one-sentence summary and the
 * table twin with every value (A11Y2-15).
 */
export function TeamStrengthRatings({ strengths, labels }: TeamStrengthRatingsProps) {
  const locale = useLocale();
  if (!strengths || Object.keys(strengths).length === 0) return null;
  const pt = locale !== "en";
  const attackLabel = labels.attack ?? (pt ? "Ataque" : "Attack");
  const defenseLabel = labels.defense ?? (pt ? "Defesa" : "Defence");
  const worse = labels.worse ?? (pt ? "pior" : "worse");
  const better = labels.better ?? (pt ? "melhor" : "better");

  const entries = Object.entries(strengths)
    .map(([team, s]) => ({ team, attack: s.attack, defense: s.defense, composite: s.attack - s.defense }))
    .sort((a, b) => b.composite - a.composite);

  // Normalize to the max absolute value across both dimensions
  const maxVal = Math.max(
    ...entries.map(e => Math.abs(e.attack)),
    ...entries.map(e => Math.abs(e.defense)),
    0.01
  );

  const bestAttack = [...entries].sort((a, b) => b.attack - a.attack)[0];
  const bestDefence = [...entries].sort((a, b) => a.defense - b.defense)[0];
  const summary = pt
    ? `${attackLabel} e ${defenseLabel.toLowerCase()} estimados de cada equipa face à média da Liga. Melhor ataque: ${teamDisplayName(bestAttack.team)}; melhor defesa: ${teamDisplayName(bestDefence.team)}. Os valores estão na tabela abaixo.`
    : `Each club's estimated ${attackLabel.toLowerCase()} and ${defenseLabel.toLowerCase()} against the league average. Best attack: ${teamDisplayName(bestAttack.team)}; best defence: ${teamDisplayName(bestDefence.team)}. The values are in the table below.`;

  const trackHead = (label: string) => (
    <div className="flex-1">
      <div className="text-center text-[11px] font-bold uppercase tracking-wider text-stone-600">{label}</div>
      <div className="flex justify-between text-[11px] text-stone-600">
        <span><span aria-hidden="true">← </span>{worse}</span>
        <span>{pt ? "média" : "average"}</span>
        <span>{better}<span aria-hidden="true"> →</span></span>
      </div>
    </div>
  );

  return (
    <div>
      <p className="sr-only">{summary}</p>
      <div aria-hidden="true">
        {/* Column headers: each track says which end is better and where 0 is. */}
        <div className="mb-3 flex items-end gap-2">
          <div className="hidden w-32 flex-shrink-0 sm:block" />
          {trackHead(defenseLabel)}
          {trackHead(attackLabel)}
        </div>

        <div className="space-y-2 sm:space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.team}
              className="sm:flex sm:items-center sm:gap-2"
              title={`${teamDisplayName(entry.team)}: ${attackLabel.toLowerCase()} ${formatSigned(entry.attack, locale, 2)}, ${defenseLabel.toLowerCase()} ${formatSigned(-entry.defense, locale, 2)}`}
            >
              <div className="mb-0.5 flex items-center gap-1.5 sm:mb-0 sm:w-32 sm:flex-shrink-0">
                {teamLogoSrc(entry.team) ? (
                  <img src={teamLogoSrc(entry.team)} alt="" width={16} height={16} loading="lazy" decoding="async" className="w-4 h-4 object-contain flex-shrink-0" />
                ) : (
                  <div className="w-1 h-4 flex-shrink-0 bg-stone-400" />
                )}
                <span className="text-xs font-medium text-stone-700 sm:truncate">{teamDisplayName(entry.team)}</span>
              </div>
              <div className="flex flex-1 items-center gap-2">
                {/* Defence: negative is good in the data, so it is flipped. */}
                <Bar value={-entry.defense} maxVal={maxVal} />
                <Bar value={entry.attack} maxVal={maxVal} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <ChartTable
        caption={pt
          ? "Forças de ataque e de defesa por equipa, em escala logarítmica centrada na média da Liga; positivo é melhor nas duas colunas"
          : "Attack and defence strengths by team, on a log scale centred on the league average; positive is better in both columns"}
        columns={[pt ? "Equipa" : "Team", attackLabel, defenseLabel]}
        rows={entries.map(e => [
          teamDisplayName(e.team),
          formatSigned(e.attack, locale, 2),
          formatSigned(-e.defense, locale, 2),
        ])}
      />
    </div>
  );
}
