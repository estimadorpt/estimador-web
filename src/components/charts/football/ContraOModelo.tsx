"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { Swords, Lock, Trash2, SlidersHorizontal, Check, Share2 } from "lucide-react";
import {
  CONFIDENCE_LEVELS,
  clearPicks,
  findOpenRound,
  loadPicks,
  probsFromPick,
  roundLockState,
  savePicks,
  scoreSeason,
  setSliderValue,
  toPercents,
  type Confidence,
  type GameFixture,
  type GameRound,
  type Outcome,
  type PickMap,
  type PredictionGameData,
  type ProbVector,
  type RoundScore,
} from "@/lib/utils/prediction-game";

interface ContraOModeloProps {
  data: PredictionGameData;
  locale?: string;
}

const OUTCOME_ORDER: Outcome[] = ["H", "D", "A"];

/** Emerald for the user, stone for the model — consistent everywhere below. */
const USER_COLOR = "#047857";
const MODEL_COLOR = "#78716c";

export function ContraOModelo({ data, locale = "pt" }: ContraOModeloProps) {
  const pt = locale !== "en";

  // Static export ships HTML with no picks and a build-time clock. Everything
  // that depends on localStorage or the real clock waits for mount.
  const [mounted, setMounted] = useState(false);
  const [picks, setPicks] = useState<PickMap>({});
  const [now, setNow] = useState(0);
  const [openFine, setOpenFine] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPicks(loadPicks(data.season));
    setNow(Date.now());
    setMounted(true);
    // Re-check the clock so a kickoff lock engages without a reload.
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [data.season]);

  const updatePick = useCallback(
    (key: string, next: { p: ProbVector; pick?: Outcome; conf?: Confidence; mode: "quick" | "fine" }) => {
      setPicks(prev => {
        const merged: PickMap = { ...prev, [key]: { ...prev[key], ...next } };
        savePicks(data.season, merged);
        return merged;
      });
    },
    [data.season],
  );

  const reset = useCallback(() => {
    const question = pt
      ? "Apagar todas as tuas previsões e o resultado da época?"
      : "Delete all your predictions and your season score?";
    if (typeof window !== "undefined" && !window.confirm(question)) return;
    clearPicks();
    setPicks({});
  }, [pt]);

  const openRound = useMemo(
    () => (mounted ? findOpenRound(data, now) : null),
    [data, now, mounted],
  );

  const season = useMemo(() => scoreSeason(data, picks), [data, picks]);

  const playedRounds = useMemo(
    () =>
      season.rounds
        .filter(r => r.scored.length > 0 || r.missed > 0)
        .sort((a, b) => b.matchday - a.matchday),
    [season.rounds],
  );

  const t = {
    title: pt ? "Contra o Modelo" : "Beat the Model",
    intro: pt
      ? "Diz o que achas que vai acontecer na próxima jornada. Quando os resultados chegarem, as tuas probabilidades são comparadas com as do modelo pela mesma medida que usamos para avaliar o modelo: o Ranked Probability Score."
      : "Say what you think will happen next matchday. When the results land, your probabilities are scored against the model's using the same measure we grade the model with: the Ranked Probability Score.",
    rpsNote: pt
      ? "No RPS, menos é melhor. Zero é uma previsão perfeita. A regra castiga o excesso de confiança: dar 90% a uma vitória que não acontece custa muito mais do que dar 50%."
      : "In RPS, lower is better. Zero is a perfect forecast. The rule punishes overconfidence: giving 90% to a win that doesn't happen costs far more than giving 50%.",
    hidden: pt
      ? "As probabilidades do modelo ficam escondidas até a jornada fechar — para não influenciarem a tua escolha."
      : "The model's probabilities stay hidden until the matchday locks, so they can't sway your picks.",
    home: pt ? "Casa" : "Home",
    draw: pt ? "Empate" : "Draw",
    away: pt ? "Fora" : "Away",
    confidence: pt ? "Confiança" : "Confidence",
    fine: pt ? "Ajuste fino" : "Fine tune",
    matchday: pt ? "Jornada" : "Matchday",
    locked: pt ? "Jornada fechada" : "Matchday locked",
    lockedKickoff: pt
      ? "Fechou ao primeiro pontapé de saída."
      : "Locked at the first kickoff.",
    lockedResults: pt
      ? "Fechou porque já há resultados desta jornada."
      : "Locked because results for this matchday are in.",
    noOpen: pt
      ? "Não há jornada aberta neste momento. Volta quando publicarmos a próxima previsão."
      : "No matchday is open right now. Come back when the next forecast is published.",
    reset: pt ? "Limpar" : "Reset",
    you: pt ? "Tu" : "You",
    model: pt ? "Modelo" : "Model",
    yourScore: pt ? "O teu RPS médio" : "Your average RPS",
    modelScore: pt ? "RPS médio do modelo" : "Model's average RPS",
    matches: pt ? "jogos avaliados" : "matches scored",
    beatLine: (won: number, total: number) =>
      pt
        ? `Ganhaste ao modelo em ${won} de ${total} ${total === 1 ? "jornada" : "jornadas"}.`
        : `You beat the model in ${won} of ${total} ${total === 1 ? "round" : "rounds"}.`,
    aheadNow: pt ? "Estás à frente do modelo." : "You're ahead of the model.",
    behindNow: pt ? "O modelo está à frente." : "The model is ahead.",
    levelNow: pt ? "Estás empatado com o modelo." : "You're level with the model.",
    noScore: pt
      ? "Ainda não há nada avaliado. Faz as tuas escolhas e volta depois dos jogos."
      : "Nothing scored yet. Make your picks and come back after the games.",
    picked: (n: number, total: number) =>
      pt ? `${n} de ${total} escolhidos` : `${n} of ${total} picked`,
    inProgress: pt ? "Em curso" : "In progress",
    provisional: pt ? "Resultado provisório" : "Provisional score",
    notPlayed: pt ? "Não jogaste esta jornada." : "You didn't play this matchday.",
    result: pt ? "Resultado" : "Result",
    yourRps: pt ? "O teu RPS" : "Your RPS",
    modelRps: pt ? "RPS do modelo" : "Model RPS",
    won: pt ? "Ganhaste" : "You won",
    lost: pt ? "Perdeste" : "You lost",
    share: pt ? "Copiar resultado" : "Copy result",
    shareDone: pt ? "Copiado" : "Copied",
    shareHint: pt
      ? "Tira um screenshot deste cartão ou copia o texto."
      : "Screenshot this card or copy the text.",
    confLabels: {
      leve: pt ? "Ligeiro favorito" : "Slight edge",
      media: pt ? "Favorito" : "Favourite",
      alta: pt ? "Muito confiante" : "Very confident",
    } as Record<Confidence, string>,
  };

  const outcomeLabel = (o: Outcome, fixture: GameFixture) => {
    if (o === "D") return t.draw;
    return teamDisplayName(o === "H" ? fixture.home : fixture.away);
  };

  const shareText = useMemo(() => {
    if (season.matchesScored === 0) return "";
    const u = season.userMean?.toFixed(3) ?? "-";
    const m = season.modelMean?.toFixed(3) ?? "-";
    return pt
      ? `Contra o Modelo — Liga Portugal ${data.season}\nEu ${u} vs Modelo ${m} (RPS médio, ${season.matchesScored} jogos)\n${t.beatLine(season.roundsWon, season.roundsCounted)}\nestimador.pt/pt/desporto/liga/jogo-previsoes`
      : `Beat the Model — Liga Portugal ${data.season}\nMe ${u} vs Model ${m} (mean RPS, ${season.matchesScored} matches)\n${t.beatLine(season.roundsWon, season.roundsCounted)}\nestimador.pt/en/desporto/liga/jogo-previsoes`;
  }, [season, data.season, pt, t]);

  const copyShare = useCallback(() => {
    if (!shareText || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(shareText).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  }, [shareText]);

  /* ------------------------------------------------------------ rendering */

  // Stable pre-hydration shell: no picks, no clock, no lock decisions.
  if (!mounted) {
    return (
      <div className="border border-stone-200 rounded-xl p-4 sm:p-6 bg-stone-50">
        <div className="flex items-center gap-2 mb-1">
          <Swords className="w-5 h-5 text-emerald-700" />
          <h2 className="font-bold text-stone-900">{t.title}</h2>
        </div>
        <p className="text-sm text-stone-500">{t.intro}</p>
        <div className="mt-6 h-40 rounded-lg bg-stone-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------- intro */}
      <div className="border border-stone-200 rounded-xl p-4 sm:p-6 bg-stone-50">
        <div className="flex items-center gap-2 mb-1">
          <Swords className="w-5 h-5 text-emerald-700" />
          <h2 className="font-bold text-stone-900">{t.title}</h2>
        </div>
        <p className="text-sm text-stone-600 mb-3">{t.intro}</p>
        <p className="text-xs text-stone-500">{t.rpsNote}</p>
      </div>

      {/* ------------------------------------------------------ scoreboard */}
      <section>
        {season.matchesScored === 0 ? (
          <p className="text-sm text-stone-500">{t.noScore}</p>
        ) : (
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-stone-200">
              <div className="p-4 sm:p-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  {t.yourScore}
                </div>
                <div
                  className="text-3xl sm:text-4xl font-bold tabular-nums"
                  style={{ color: USER_COLOR }}
                >
                  {season.userMean!.toFixed(3)}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  {t.modelScore}
                </div>
                <div
                  className="text-3xl sm:text-4xl font-bold tabular-nums"
                  style={{ color: MODEL_COLOR }}
                >
                  {season.modelMean!.toFixed(3)}
                </div>
              </div>
            </div>
            <div className="border-t border-stone-200 px-4 sm:px-6 py-3 bg-stone-50 text-sm">
              <span className="font-semibold text-stone-900">
                {season.userMean! < season.modelMean!
                  ? t.aheadNow
                  : season.userMean! > season.modelMean!
                    ? t.behindNow
                    : t.levelNow}
              </span>{" "}
              <span className="text-stone-500">
                {t.beatLine(season.roundsWon, season.roundsCounted)} ·{" "}
                <span className="tabular-nums">{season.matchesScored}</span> {t.matches}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------- active round */}
      {openRound ? (
        <RoundPicker
          round={openRound}
          picks={picks}
          openFine={openFine}
          onToggleFine={key => setOpenFine(prev => ({ ...prev, [key]: !prev[key] }))}
          onPick={updatePick}
          t={t}
          outcomeLabel={outcomeLabel}
        />
      ) : (
        <p className="text-sm text-stone-500 border border-stone-200 rounded-xl p-4 sm:p-6">
          {t.noOpen}
        </p>
      )}

      {/* ------------------------------------------------------- history */}
      {playedRounds.length > 0 && (
        <section className="space-y-4">
          {playedRounds.map(roundScore => {
            const round = data.rounds.find(r => r.matchday === roundScore.matchday)!;
            return (
              <RoundReview
                key={roundScore.matchday}
                round={round}
                score={roundScore}
                t={t}
                pt={pt}
              />
            );
          })}
        </section>
      )}

      {/* ---------------------------------------------------- share + reset */}
      {season.matchesScored > 0 && (
        <section>
          <div
            className="border-2 border-stone-900 rounded-xl p-5 sm:p-6 bg-white"
            aria-label={t.share}
          >
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {t.title} · Liga Portugal {data.season}
              </span>
            </div>

            <div className="flex items-end gap-6 mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {t.you}
                </div>
                <div className="text-4xl font-bold tabular-nums" style={{ color: USER_COLOR }}>
                  {season.userMean!.toFixed(3)}
                </div>
              </div>
              <div className="text-xl font-bold text-stone-300 pb-2">vs</div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {t.model}
                </div>
                <div className="text-4xl font-bold tabular-nums" style={{ color: MODEL_COLOR }}>
                  {season.modelMean!.toFixed(3)}
                </div>
              </div>
            </div>

            <p className="text-sm font-semibold text-stone-900">
              {t.beatLine(season.roundsWon, season.roundsCounted)}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {season.matchesScored} {t.matches} · RPS · estimador.pt
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button
              onClick={copyShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? t.shareDone : t.share}
            </button>
            <span className="text-xs text-stone-400">{t.shareHint}</span>
          </div>
        </section>
      )}

      <section className="pt-2">
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {t.reset}
        </button>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- sub-views */

type Labels = {
  home: string; draw: string; away: string; confidence: string; fine: string;
  matchday: string; locked: string; lockedKickoff: string; lockedResults: string;
  hidden: string; picked: (n: number, total: number) => string;
  inProgress: string; provisional: string; notPlayed: string; result: string;
  yourRps: string; modelRps: string; won: string; lost: string;
  you: string; model: string; confLabels: Record<Confidence, string>;
  [k: string]: unknown;
};

function RoundPicker({
  round,
  picks,
  openFine,
  onToggleFine,
  onPick,
  t,
  outcomeLabel,
}: {
  round: GameRound;
  picks: PickMap;
  openFine: Record<string, boolean>;
  onToggleFine: (key: string) => void;
  onPick: (
    key: string,
    next: { p: ProbVector; pick?: Outcome; conf?: Confidence; mode: "quick" | "fine" },
  ) => void;
  t: Labels;
  outcomeLabel: (o: Outcome, f: GameFixture) => string;
}) {
  const pickedCount = round.fixtures.filter(f => picks[f.key]).length;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-bold text-stone-900">
          {t.matchday} {round.matchday}
        </h3>
        <span className="text-xs text-stone-500 tabular-nums">
          {t.picked(pickedCount, round.fixtures.length)}
        </span>
      </div>
      <p className="text-xs text-stone-400 mb-4">{t.hidden}</p>

      <div className="space-y-3">
        {round.fixtures.map(fixture => {
          const stored = picks[fixture.key];
          const probs = stored?.p ?? null;
          const pct = probs ? toPercents(probs) : null;
          const fineOpen = !!openFine[fixture.key];

          return (
            <div
              key={fixture.key}
              className="border border-stone-200 rounded-xl p-3 sm:p-4 bg-white"
            >
              {/* fixture line */}
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-stone-900">
                {teamLogoSrc(fixture.home) && (
                  <img src={teamLogoSrc(fixture.home)} alt="" className="w-5 h-5 object-contain" />
                )}
                <span className="truncate">{teamDisplayName(fixture.home)}</span>
                <span className="text-stone-300 font-normal">vs</span>
                <span className="truncate">{teamDisplayName(fixture.away)}</span>
                {teamLogoSrc(fixture.away) && (
                  <img src={teamLogoSrc(fixture.away)} alt="" className="w-5 h-5 object-contain" />
                )}
              </div>

              {/* quick pick */}
              <div className="grid grid-cols-3 gap-2">
                {OUTCOME_ORDER.map(o => {
                  const active = stored?.pick === o;
                  return (
                    <button
                      key={o}
                      onClick={() =>
                        onPick(fixture.key, {
                          p: probsFromPick(o, stored?.conf ?? "media"),
                          pick: o,
                          conf: stored?.conf ?? "media",
                          mode: "quick",
                        })
                      }
                      className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors truncate ${
                        active
                          ? "bg-emerald-700 border-emerald-700 text-white"
                          : "bg-white border-stone-300 text-stone-700 hover:border-stone-400"
                      }`}
                    >
                      {outcomeLabel(o, fixture)}
                    </button>
                  );
                })}
              </div>

              {/* confidence */}
              {stored?.pick && (
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    {t.confidence}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CONFIDENCE_LEVELS.map(c => {
                      const active = stored.conf === c && stored.mode === "quick";
                      return (
                        <button
                          key={c}
                          onClick={() =>
                            onPick(fixture.key, {
                              p: probsFromPick(stored.pick!, c),
                              pick: stored.pick,
                              conf: c,
                              mode: "quick",
                            })
                          }
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors truncate ${
                            active
                              ? "bg-stone-900 border-stone-900 text-white"
                              : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                          }`}
                        >
                          {t.confLabels[c]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* current probabilities + fine tune */}
              {probs && pct && (
                <div className="mt-3">
                  <ProbBar pct={pct} />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-3 text-[11px] text-stone-500 tabular-nums">
                      <span>{t.home} {pct[0]}%</span>
                      <span>{t.draw} {pct[1]}%</span>
                      <span>{t.away} {pct[2]}%</span>
                    </div>
                    <button
                      onClick={() => onToggleFine(fixture.key)}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                        fineOpen ? "text-emerald-700" : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      {t.fine}
                    </button>
                  </div>

                  {fineOpen && (
                    <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                      {OUTCOME_ORDER.map((o, i) => (
                        <div key={o} className="flex items-center gap-3">
                          <span className="w-20 sm:w-28 shrink-0 truncate text-[11px] text-stone-600">
                            {outcomeLabel(o, fixture)}
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={Math.round(probs[i] * 100)}
                            onChange={e =>
                              onPick(fixture.key, {
                                p: setSliderValue(probs, i as 0 | 1 | 2, Number(e.target.value) / 100),
                                pick: stored?.pick,
                                conf: stored?.conf,
                                mode: "fine",
                              })
                            }
                            className="flex-1 accent-emerald-700"
                            aria-label={outcomeLabel(o, fixture)}
                          />
                          <span className="w-10 text-right text-[11px] tabular-nums text-stone-700">
                            {pct[i]}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProbBar({ pct }: { pct: [number, number, number] }) {
  const segments = [
    { v: pct[0], color: "#047857" },
    { v: pct[1], color: "#d6d3d1" },
    { v: pct[2], color: "#1c1917" },
  ];
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-stone-100">
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${s.v}%`, backgroundColor: s.color }} />
      ))}
    </div>
  );
}

function RoundReview({
  round,
  score,
  t,
  pt,
}: {
  round: GameRound;
  score: RoundScore;
  t: Labels;
  pt: boolean;
}) {
  const lock = roundLockState(round, Date.now());

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-semibold text-stone-900 text-sm">
            {t.matchday} {round.matchday}
          </span>
          {!score.complete && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              {t.inProgress}
            </span>
          )}
        </div>
        {score.scored.length > 0 && (
          <span
            className={`text-xs font-bold ${
              score.beatModel ? "text-emerald-700" : "text-stone-500"
            }`}
          >
            {score.beatModel ? t.won : t.lost}
          </span>
        )}
      </div>

      {score.scored.length === 0 ? (
        <p className="px-4 py-4 text-sm text-stone-500">{t.notPlayed}</p>
      ) : (
        <>
          <div className="px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm border-b border-stone-100">
            <span className="text-stone-500">
              {t.you}{" "}
              <span className="font-bold tabular-nums" style={{ color: USER_COLOR }}>
                {score.userMean!.toFixed(3)}
              </span>
            </span>
            <span className="text-stone-500">
              {t.model}{" "}
              <span className="font-bold tabular-nums" style={{ color: MODEL_COLOR }}>
                {score.modelMean!.toFixed(3)}
              </span>
            </span>
            {!score.complete && (
              <span className="text-xs text-amber-700">{t.provisional}</span>
            )}
          </div>

          <div className="divide-y divide-stone-100">
            {score.scored.map(s => {
              const fixture = round.fixtures.find(f => f.key === s.key)!;
              const userPct = toPercents(s.user);
              const modelPct = toPercents(s.model);
              const oi = s.outcome === "H" ? 0 : s.outcome === "D" ? 1 : 2;
              return (
                <div key={s.key} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-stone-900 truncate">
                      {teamDisplayName(s.home)} {fixture.result!.homeGoals}
                      <span className="text-stone-300">-</span>
                      {fixture.result!.awayGoals} {teamDisplayName(s.away)}
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums shrink-0 ${
                        s.edge > 0 ? "text-emerald-700" : s.edge < 0 ? "text-red-700" : "text-stone-400"
                      }`}
                    >
                      {s.edge > 0 ? "+" : ""}
                      {s.edge.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-stone-500 tabular-nums">
                    <span>
                      {t.you} {userPct[oi]}% → {t.yourRps} {s.userRps.toFixed(3)}
                    </span>
                    <span>
                      {t.model} {modelPct[oi]}% → {t.modelRps} {s.modelRps.toFixed(3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-400">
        {lock.reason === "kickoff" ? t.lockedKickoff : t.lockedResults}
        {score.missed > 0 && (
          <>
            {" · "}
            {pt
              ? `${score.missed} sem previsão tua`
              : `${score.missed} you didn't predict`}
          </>
        )}
      </div>
    </div>
  );
}
