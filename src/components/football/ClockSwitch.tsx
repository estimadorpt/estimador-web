"use client";

import { useEffect, useState, type ReactNode } from "react";
import { clockValue, type ClockStep } from "@/lib/football-status";

/**
 * What a Liga line says at the reader's own time (audit FRESH-01). The page
 * is exported once per forecast; the server render, and the first client
 * render, show `initial` (the forecast as published). After mount the clock
 * is read and re-read every minute, and the content of the latest step whose
 * instant has passed replaces it: "Jogo começou · previsão de 25 set." after
 * a kickoff, "Jornada 8 · jogada, nova previsão em preparação" once a round
 * is over. Server components pass the strings in; nothing here reads
 * messages.
 */
export function ClockSwitch({
  initial,
  steps,
}: {
  initial: ReactNode;
  steps: Array<ClockStep<ReactNode>>;
}) {
  const [index, setIndex] = useState(-1);
  const key = steps.map(s => s.at ?? "").join("|");

  useEffect(() => {
    const indexed = steps.map((s, i) => ({ at: s.at, value: i }));
    const check = () => setIndex(clockValue(-1, indexed, Date.now()));
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
    // `key` stands for the steps' instants; their content may be new
    // elements on every render without the schedule changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <>{index >= 0 ? steps[index].value : initial}</>;
}

/**
 * True once `at` has passed on the reader's clock; always false in the
 * server render and the first client render, so hydration matches.
 */
export function useClockReached(at: string | null | undefined): boolean {
  const [reached, setReached] = useState(false);
  useEffect(() => {
    if (!at) return;
    const ms = Date.parse(at);
    if (Number.isNaN(ms)) return;
    const check = () => setReached(Date.now() >= ms);
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [at]);
  return reached;
}
