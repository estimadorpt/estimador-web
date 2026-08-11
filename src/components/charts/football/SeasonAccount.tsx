"use client";

/**
 * The strip that turns a browser tab into a season entry.
 *
 * Deliberately not a sign-up wall: type a name and you are on the leaderboard.
 * Signing in is offered as what it is — insurance against losing the season to
 * a cleared browser or a new phone — and never required to play.
 *
 * Rendered only when the backend is configured; in local-only mode the game
 * looks exactly as it did before this existed.
 */

import { useEffect, useState } from "react";
import { Cloud, CloudOff, Check, LogIn, UserRound, AlertTriangle } from "lucide-react";
import type { ApiPlayer, RejectedPick } from "@/lib/utils/prediction-game-api";
import type { SyncState } from "@/hooks/useSeasonGame";

interface SeasonAccountProps {
  player: ApiPlayer | null;
  authenticated: boolean;
  syncState: SyncState;
  rejected: RejectedPick[];
  deadline: string | null;
  signInUrl: string;
  onName: (name: string) => Promise<void> | void;
  locale?: string;
}

export function SeasonAccount({
  player,
  authenticated,
  syncState,
  rejected,
  deadline,
  signInUrl,
  onName,
  locale = "pt",
}: SeasonAccountProps) {
  const pt = locale !== "en";
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    if (player?.displayName) setDraft(player.displayName);
  }, [player?.displayName]);

  const t = {
    join: pt ? "Joga a época inteira" : "Play the whole season",
    joinBlurb: pt
      ? "Escolhe um nome e as tuas previsões passam a contar para a classificação da época."
      : "Pick a name and your forecasts start counting towards the season standings.",
    placeholder: pt ? "O teu nome" : "Your name",
    save: pt ? "Entrar" : "Join",
    confirm: pt ? "Guardar" : "Save",
    cancel: pt ? "Cancelar" : "Cancel",
    playingAs: pt ? "A jogar como" : "Playing as",
    rename: pt ? "Mudar nome" : "Change name",
    signIn: pt ? "Guardar a época na conta" : "Save this season to an account",
    signInHint: pt
      ? "Sem conta, a época vive só neste navegador. Inicia sessão para a levares para outro dispositivo."
      : "Without an account the season lives only in this browser. Sign in to carry it to another device.",
    signedIn: pt ? "Época guardada na tua conta" : "Season saved to your account",
    saving: pt ? "A guardar…" : "Saving…",
    saved: pt ? "Guardado" : "Saved",
    syncError: pt
      ? "Não foi possível guardar no servidor — as escolhas ficam neste navegador."
      : "Could not save to the server — your picks stay in this browser.",
    deadline: pt ? "Fecha a" : "Closes",
    rejectedTitle: pt ? "Algumas escolhas não foram aceites" : "Some picks were not accepted",
    reasons: {
      locked: pt ? "o jogo já começou" : "the match has kicked off",
      unknown_fixture: pt ? "jogo desconhecido" : "unknown fixture",
      not_priced: pt ? "o modelo ainda não publicou esta jornada" : "the model has not published this round yet",
      invalid_probabilities: pt ? "probabilidades inválidas" : "invalid probabilities",
    } as Record<RejectedPick["reason"], string>,
  };

  const submit = async () => {
    const name = draft.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      await onName(name);
      setRenaming(false);
    } finally {
      setSaving(false);
    }
  };

  const named = !!player?.displayName && !renaming;

  return (
    <div className="border border-stone-200 rounded-xl bg-white overflow-hidden">
      <div className="p-4 sm:p-5">
        {!named ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <UserRound className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-stone-900 text-sm">
                {renaming ? t.rename : t.join}
              </span>
            </div>
            {!renaming && <p className="text-xs text-stone-500 mb-3">{t.joinBlurb}</p>}
            <div className="flex flex-wrap gap-2">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") void submit();
                }}
                maxLength={24}
                placeholder={t.placeholder}
                className="flex-1 min-w-[10rem] px-3 py-1.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-emerald-700"
                aria-label={t.placeholder}
              />
              <button
                onClick={submit}
                disabled={!draft.trim() || saving}
                className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-900 transition-colors"
              >
                {renaming ? t.confirm : t.save}
              </button>
              {renaming && (
                <button
                  onClick={() => setRenaming(false)}
                  className="px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-stone-900 transition-colors"
                >
                  {t.cancel}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <UserRound className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-sm text-stone-500">{t.playingAs}</span>
              <span className="text-sm font-bold text-stone-900 truncate">
                {player!.displayName}
              </span>
              <button
                onClick={() => setRenaming(true)}
                className="text-[11px] text-stone-400 hover:text-stone-700 underline underline-offset-2 shrink-0"
              >
                {t.rename}
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <SyncBadge state={syncState} labels={t} />
              {deadline && (
                <span className="text-stone-400 tabular-nums hidden sm:inline">
                  {t.deadline}{" "}
                  {new Date(deadline).toLocaleString(pt ? "pt-PT" : "en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {rejected.length > 0 && (
        <div className="px-4 sm:px-5 py-2 bg-amber-50 border-t border-amber-100 text-[11px] text-amber-800">
          <span className="inline-flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t.rejectedTitle}
          </span>
          <ul className="mt-1 space-y-0.5">
            {rejected.slice(0, 4).map(r => (
              <li key={r.fixtureId}>
                {r.fixtureId} — {t.reasons[r.reason] ?? r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-4 sm:px-5 py-2.5 bg-stone-50 border-t border-stone-200 text-[11px]">
        {authenticated ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-800">
            <Check className="w-3.5 h-3.5" />
            {t.signedIn}
          </span>
        ) : (
          <span className="text-stone-500">
            <a
              href={signInUrl}
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline"
            >
              <LogIn className="w-3.5 h-3.5" />
              {t.signIn}
            </a>
            {" — "}
            {t.signInHint}
          </span>
        )}
      </div>
    </div>
  );
}

function SyncBadge({
  state,
  labels,
}: {
  state: SyncState;
  labels: { saving: string; saved: string; syncError: string };
}) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-stone-400">
        <Cloud className="w-3.5 h-3.5 animate-pulse" />
        {labels.saving}
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <Check className="w-3.5 h-3.5" />
        {labels.saved}
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-700" title={labels.syncError}>
        <CloudOff className="w-3.5 h-3.5" />
        {labels.syncError}
      </span>
    );
  }
  return null;
}
