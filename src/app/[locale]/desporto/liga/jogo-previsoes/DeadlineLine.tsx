"use client";

import { useEffect, useState } from "react";
import { formatKickoff } from "@/lib/football-format";

/**
 * The hero's deadline line. The page is built once per forecast, so the
 * static text can only state a deadline; after mount it re-reads the clock
 * and, once the deadline has passed, says the round has closed instead of
 * sitting above "Não há jornada aberta" (audit FR-11).
 */
export function DeadlineLine({
  matchday,
  lockAt,
  confirmed,
  locale,
}: {
  matchday: number;
  /** ISO time the round closes (its earliest lock). */
  lockAt: string;
  /** False while some kickoffs are placeholders. */
  confirmed: boolean;
  locale: string;
}) {
  const pt = locale !== "en";
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const check = () => setClosed(Date.now() >= Date.parse(lockAt));
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [lockAt]);

  const when = formatKickoff(lockAt, locale);
  if (closed) {
    return (
      <span>
        {pt
          ? `A jornada ${matchday} fechou no primeiro jogo (${when}, hora de Lisboa). A próxima abre quando publicarmos a nova previsão, depois dos jogos.`
          : `Matchday ${matchday} closed at its first game (${when}, Lisbon time). The next one opens when we publish the new forecast, after the games.`}
      </span>
    );
  }
  if (!confirmed) {
    return (
      <span>
        {pt
          ? `Jornada ${matchday}: há horários por confirmar; fecha no primeiro jogo.`
          : `Matchday ${matchday}: some kickoffs are still to be confirmed; it closes at the first game.`}
      </span>
    );
  }
  return (
    <span>
      {pt
        ? `Prazo da jornada ${matchday}: ${when} (hora de Lisboa), no primeiro jogo.`
        : `Matchday ${matchday} deadline: ${when} (Lisbon time), at the first game.`}
    </span>
  );
}
