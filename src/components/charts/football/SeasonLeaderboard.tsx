"use client";

/**
 * The season table for "Contra o Modelo".
 *
 * The model is a competitor, not a footnote: it sits in the same ordering as
 * everybody else, and the only question the table answers is whether you are
 * above it or below it.
 *
 * Rendered only when the backend is configured. With no backend the game is
 * local-only and there is nothing to rank.
 */

import { Trophy, Bot, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { LeaderboardResponse, LeaderboardRow } from "@/lib/utils/prediction-game-api";

const USER_COLOR = "#047857";
const MODEL_COLOR = "#78716c";

interface SeasonLeaderboardProps {
  board: LeaderboardResponse | null;
  locale?: string;
  onRefresh?: () => Promise<void> | void;
}

export function SeasonLeaderboard({ board, locale = "pt", onRefresh }: SeasonLeaderboardProps) {
  const pt = locale !== "en";
  const [refreshing, setRefreshing] = useState(false);

  const t = {
    title: pt ? "Classificação da época" : "Season standings",
    empty: pt
      ? "Ainda ninguém foi avaliado esta época. A classificação aparece assim que a primeira jornada com previsões terminar."
      : "Nobody has been scored yet this season. The table appears once the first matchday with entries is complete.",
    rank: "#",
    player: pt ? "Jogador" : "Player",
    mean: pt ? "RPS médio" : "Mean RPS",
    total: pt ? "Total" : "Total",
    rounds: pt ? "Jornadas" : "Rounds",
    beat: pt ? "Bateu o modelo" : "Beat the model",
    model: pt ? "O Modelo" : "The Model",
    you: pt ? "tu" : "you",
    refresh: pt ? "Atualizar" : "Refresh",
    updated: pt ? "Atualizado" : "Updated",
    note: pt
      ? "Ordenado pelo RPS médio — menos é melhor. O total sobe com o número de jogos, por isso é a média que ordena. O modelo é avaliado em todos os jogos da época; cada jogador é comparado com o modelo nos jogos que escolheu."
      : "Sorted by mean RPS — lower is better. The total grows with the number of matches, so the mean is what ranks. The model is scored on every match of the season; each player is compared with the model on the matches they picked.",
  };

  const refresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const rows = board?.rows ?? [];
  const humanCount = rows.filter(r => !r.isModel).length;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-700" />
          {t.title}
        </h3>
        {onRefresh && (
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {t.refresh}
          </button>
        )}
      </div>

      {humanCount === 0 ? (
        <p className="text-sm text-stone-500 border border-stone-200 rounded-xl p-4 sm:p-6">
          {t.empty}
        </p>
      ) : (
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="text-left px-3 py-2 w-10">{t.rank}</th>
                  <th className="text-left px-3 py-2">{t.player}</th>
                  <th className="text-right px-3 py-2">{t.mean}</th>
                  <th className="text-right px-3 py-2 hidden sm:table-cell">{t.total}</th>
                  <th className="text-right px-3 py-2 hidden sm:table-cell">{t.rounds}</th>
                  <th className="text-right px-3 py-2">{t.beat}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map(row => (
                  <Row
                    key={row.playerId}
                    row={row}
                    isYou={board?.you === row.playerId}
                    youLabel={t.you}
                    modelLabel={t.model}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-400">
            {t.note}
            {board?.updatedAt && (
              <>
                {" · "}
                {t.updated} {new Date(board.updatedAt).toLocaleDateString(pt ? "pt-PT" : "en-GB")}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Row({
  row,
  isYou,
  youLabel,
  modelLabel,
}: {
  row: LeaderboardRow;
  isYou: boolean;
  youLabel: string;
  modelLabel: string;
}) {
  const background = row.isModel ? "bg-stone-50" : isYou ? "bg-emerald-50" : "";

  return (
    <tr className={background}>
      <td className="px-3 py-2 tabular-nums text-stone-400 text-xs">
        {row.isModel ? <Bot className="w-3.5 h-3.5" /> : row.rank}
      </td>
      <td className="px-3 py-2">
        <span
          className={`font-semibold truncate ${row.isModel ? "text-stone-600" : "text-stone-900"}`}
        >
          {row.isModel ? modelLabel : row.displayName}
        </span>
        {isYou && !row.isModel && (
          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {youLabel}
          </span>
        )}
      </td>
      <td
        className="px-3 py-2 text-right font-bold tabular-nums"
        style={{ color: row.isModel ? MODEL_COLOR : USER_COLOR }}
      >
        {row.meanRps === null ? "—" : row.meanRps.toFixed(3)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-stone-500 hidden sm:table-cell">
        {row.totalRps.toFixed(2)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-stone-500 hidden sm:table-cell">
        {row.matchdays}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-stone-500">
        {row.isModel ? "—" : `${row.roundsWon}/${row.roundsCounted}`}
      </td>
    </tr>
  );
}
