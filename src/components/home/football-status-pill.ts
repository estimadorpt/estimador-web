/**
 * The homepage football panel's status slot (audit CL2-05): the round the
 * forecast follows goes in the kicker's pill, like "Arquivo" and "Em
 * preparação" on the other panels, and the rest of the dated line stays under
 * the heading. forecastStatusLine (src/lib/football-status.ts) writes the
 * round first ("Depois da jornada 7 · atualizado a 25 set. · próxima
 * atualização após a jornada 8 (9–12 out.)"), so both halves come from the
 * one helper and cannot disagree, and the round is not said twice.
 */
export function splitForecastRound(line: string, locale: string): { round: string; rest: string } {
  const [first, ...others] = line.split(' · ');
  // "jornada 7" never breaks across lines (CL2-06).
  const round = first.replace(/ (\d+)$/, ' $1');
  const tail = others.join(' · ');
  const rest = tail ? tail.charAt(0).toLocaleUpperCase(locale === 'en' ? 'en-GB' : 'pt-PT') + tail.slice(1) : '';
  return { round, rest };
}
