import { Link } from '@/i18n/routing';
import { ChannelHead, IntervalBand, PosHist, ProbBar, ReadingRule, Ruler } from '@/components/instrument';
import { ligaTeamSlugs, teamColorOnPaper, teamDisplayName, teamPhoneName } from '@/lib/config/football';
import { formatInteger, formatKickoffShort, formatPercent, formatPp, formatReadingTime, matchLabel } from '@/lib/football-format';
import { titleFinding, titleSeasons } from '@/lib/football-finding';
import { clubStake, stakeSentence } from '@/lib/football-stakes';
import { byKickoff } from '@/lib/football-fixtures';
import type { LigaPrediction, ScenarioData, TeamDelta } from '@/types/football';
import type { UpcomingFixture } from '@/lib/utils/football-data-loader';

export interface PointsQuantiles {
  q05: number;
  q50: number;
  q95: number;
}

/** Final-points quantiles per club from samples.json, when it carries them. */
export function pointsQuantiles(samples: { teams?: string[]; points_q05?: number[]; points_q50?: number[]; points_q95?: number[] } | null | undefined): Record<string, PointsQuantiles> {
  const out: Record<string, PointsQuantiles> = {};
  samples?.teams?.forEach((team, i) => {
    const q05 = samples.points_q05?.[i];
    const q50 = samples.points_q50?.[i];
    const q95 = samples.points_q95?.[i];
    if (q05 != null && q50 != null && q95 != null) out[team] = { q05, q50, q95 };
  });
  return out;
}

/**
 * The Liga as an instrument on the homepage: the finding, the four clubs
 * with a title chance (title share, points today as an ink square and the
 * final-points band), the three likeliest to go down, and the next games
 * with their stakes from each club's own side. Every figure is read from
 * the latest mdNN, samples.json and game_fixtures.json.
 */
export function LigaInstrument({ locale, prediction, scenarios, deltas, quantiles, fixtures }: {
  locale: string;
  prediction: LigaPrediction;
  scenarios: ScenarioData | null;
  deltas: Record<string, TeamDelta>;
  quantiles: Record<string, PointsQuantiles>;
  fixtures: UpcomingFixture[];
}) {
  const pt = locale !== 'en';
  const md = prediction.matchday;
  const byTitle = [...prediction.table].sort((a, b) => b.p_champion - a.p_champion);
  const favourite = byTitle[0];
  const contenders = byTitle.filter(r => r.p_champion >= 0.0005).slice(0, 4);
  const relegation = [...prediction.table].sort((a, b) => b.p_relegation - a.p_relegation).slice(0, 4);
  const points = new Map((prediction.actual_standings ?? []).map(s => [s.team, s.points]));
  const position = prediction.position_probs ?? {};
  const seasons = titleSeasons(favourite.team, favourite.p_champion, prediction.n_sims, scenarios?.victory_paths);

  // The round the forecast was made in: how many of its games were played.
  const remaining = prediction.matches_remaining?.length ?? 0;
  const played = (prediction.matchday_results ?? []).filter(r => r.matchday === md).length;
  const when = formatReadingTime(prediction.timestamp, locale);
  const roundNote = remaining > 0
    ? (pt ? `numa previsão feita com ${played} dos ${played + remaining} jogos da jornada ${md} disputados` : `in a forecast made with ${played} of matchday ${md}’s ${played + remaining} games played`)
    : (pt ? `numa previsão feita depois da jornada ${md}` : `in a forecast made after matchday ${md}`);
  // The biggest move in the title race since the previous forecast.
  const mover = md > 1
    ? contenders
        .map(r => ({ team: r.team, delta: deltas[r.team]?.p_champion_delta ?? 0 }))
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
    : null;
  const moverSentence = mover && Math.abs(mover.delta) >= 1
    ? pt
      ? ` ${teamDisplayName(mover.team)}: ${formatPp(mover.delta / 100, locale)} no título desde a previsão anterior.`
      : ` ${teamDisplayName(mover.team)}: ${formatPp(mover.delta / 100, locale)} on the title since the previous forecast.`
    : '';

  const games = byKickoff(fixtures.filter(f => f.p_home != null && f.p_draw != null && f.p_away != null)).slice(0, 5);
  const POINTS_MAX = 100;

  return (
    <section aria-labelledby="home-liga" className="min-w-0">
      <ChannelHead
        id="home-liga"
        title="Liga Portugal"
        href="/desporto/liga"
        locale={locale}
        serial={pt ? `J${md}` : `MD${md}`}
        aside={<>{pt ? 'previsão de ' : 'forecast of '}<b className="font-semibold text-ink">{when}</b></>}
      />
      <p className="disp mt-4 text-balance text-[34px] leading-[0.98] md:text-[46px]">{titleFinding(favourite.team, favourite.p_champion, locale)}</p>
      <p className="mt-3 max-w-[64ch] text-[15.5px] leading-[22px]">
        {pt
          ? <>Em <b>{formatInteger(seasons, locale)}</b> de {formatInteger(prediction.n_sims, locale)} épocas simuladas, {roundNote}.</>
          : <>In <b>{formatInteger(seasons, locale)}</b> of {formatInteger(prediction.n_sims, locale)} simulated seasons, {roundNote}.</>}
        {moverSentence}
      </p>

      <div className="mt-5 grid gap-x-8 gap-y-8 min-[1560px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <table className="w-full border-collapse text-[14px]">
            <caption className="sr-only">
              {pt ? 'Probabilidade de ser campeão, pontos agora e pontos no fim da época (mediana e intervalo de 90%), e onde cada clube pode acabar.' : 'Chance of the title, points now and at the end of the season (median and 90% interval), and where each club can finish.'}
            </caption>
            <thead>
              <tr className="border-b border-ink text-left align-bottom text-[12.5px] leading-4 text-graphite">
                <th scope="col" className="pb-1.5 pr-2 font-medium">{pt ? 'Clube' : 'Club'}</th>
                <th scope="col" className="pb-1.5 pr-2 text-right font-medium">{pt ? 'Título' : 'Title'}</th>
                <th scope="col" className="hidden pb-1.5 pr-2 text-right font-medium sm:table-cell">{pt ? `vs J${md - 1}` : `vs MD${md - 1}`}</th>
                <th scope="col" className="w-[40%] min-w-[150px] pb-1.5 pr-3 font-medium">
                  <span className="sr-only">{pt ? 'Pontos agora e no fim' : 'Points now and at the end'}</span>
                  <span aria-hidden="true">{pt ? 'Pontos, agora e no fim' : 'Points, now and at the end'}</span>
                  <Ruler min={0} max={POINTS_MAX} minor={5} major={25} labels={[0, 25, 50, 75, 100]} />
                </th>
                <th scope="col" className="hidden pb-1.5 pr-2 font-medium md:table-cell">{pt ? 'Agora → no fim' : 'Now → end'}</th>
                <th scope="col" className="hidden pb-1.5 font-medium lg:table-cell">{pt ? 'Posição final' : 'Final place'}<span className="sr-only">{pt ? ', do 1.º ao 18.º' : ', 1st to 18th'}</span></th>
              </tr>
            </thead>
            <tbody>
              {contenders.map(r => {
                const q = quantiles[r.team];
                const now = points.get(r.team) ?? null;
                const delta = deltas[r.team]?.p_champion_delta;
                const slug = ligaTeamSlugs[r.team];
                return (
                  <tr key={r.team} className="border-b border-grid">
                    <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                      <span className="name-cut inline-flex items-center gap-[7px] whitespace-nowrap text-[15.5px]">
                        <i aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: teamColorOnPaper(r.team) }} />
                        {slug ? <Link href={`/desporto/liga/${slug}`} locale={locale} className="no-underline hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center">{teamPhoneName(r.team)}</Link> : teamPhoneName(r.team)}
                      </span>
                    </th>
                    <td className="py-1.5 pr-2 text-right">
                      <span className="disp text-[23px] leading-6">{formatPercent(r.p_champion, locale).replace('%', '')}<small className="ml-px text-[13px] font-bold">%</small></span>
                      {delta != null && <span className="block text-[12px] leading-4 text-graphite sm:hidden">{formatPp(delta / 100, locale)}</span>}
                    </td>
                    <td className="hidden whitespace-nowrap py-1.5 pr-2 text-right text-[13px] text-graphite sm:table-cell">{delta != null ? formatPp(delta / 100, locale) : '—'}</td>
                    <td className="py-1.5 pr-3">
                      {q ? (
                        <IntervalBand lo={q.q05} md={q.q50} hi={q.q95} min={0} max={POINTS_MAX} now={now} />
                      ) : <span className="text-graphite">—</span>}
                      {q && <span className="mt-0.5 block whitespace-nowrap text-[12.5px] text-graphite md:hidden">{now != null ? (pt ? `${now} agora, ` : `${now} now, `) : ''}<b className="font-semibold text-ink">{q.q50}</b> {q.q05}–{q.q95}</span>}
                    </td>
                    <td className="hidden whitespace-nowrap py-1.5 pr-2 text-[13.5px] font-semibold md:table-cell">
                      {q ? <>{now != null && <span className="font-normal text-graphite">{now} → </span>}{q.q50} <span className="font-normal text-graphite">{q.q05}–{q.q95}</span></> : '—'}
                    </td>
                    <td className="hidden py-1.5 lg:table-cell">{position[r.team] ? <PosHist probs={position[r.team]} /> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[12.5px] leading-[17px] text-graphite">
            <ReadingRule locale={locale} variant="short" marks={['now', 'band']} />
          </p>
          <p className="mt-2 max-w-[84ch] text-[12.5px] leading-[17px] text-graphite">
            {pt
              ? `Percentagem das ${formatInteger(prediction.n_sims, locale)} épocas simuladas em que cada clube é campeão; pontos no fim: mediana e intervalo de 90%.`
              : `Share of the ${formatInteger(prediction.n_sims, locale)} simulated seasons in which each club wins the title; final points: median and 90% interval.`}{' '}
            <Link href="/desporto/liga/metodologia" locale={locale} className="text-graphite underline underline-offset-4">{pt ? 'Como funciona o modelo' : 'How the model works'}</Link>
          </p>
        </div>

        <div className="grid min-w-0 gap-x-8 gap-y-7 md:grid-cols-2 min-[1560px]:grid-cols-1">
          <div>
            <h3 className="flex items-baseline gap-2 text-[19px] leading-[22px]">
              {pt ? 'Despromoção' : 'Relegation'}
              <span className="font-sans tracking-normal text-[13px] font-medium text-graphite">{pt ? '17.º ou 18.º' : '17th or 18th'}</span>
            </h3>
            <table className="mt-1.5 w-full border-collapse text-[14px]">
              <caption className="sr-only">{pt ? 'Os quatro clubes com mais probabilidade de descer' : 'The four clubs most likely to go down'}</caption>
              <tbody>
                {relegation.map(r => (
                  <tr key={r.team} className="border-b border-grid">
                    <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                      <span className="name-cut inline-flex items-center gap-[7px] whitespace-nowrap">
                        <i aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: teamColorOnPaper(r.team) }} />
                        {teamPhoneName(r.team)}
                      </span>
                    </th>
                    <td className="w-[110px] py-1.5 pr-2"><ProbBar p={r.p_relegation} width={100} /></td>
                    <td className="py-1.5 pr-1 text-right"><span className="disp text-[19px]">{formatPercent(r.p_relegation, locale)}</span></td>
                    <td className="py-1.5 text-right text-[12.5px] text-graphite">{deltas[r.team] ? formatPp(deltas[r.team].p_relegation_delta / 100, locale) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {games.length > 0 && (
            <div>
              <h3 className="text-[19px] leading-[22px]">{pt ? 'Próximos jogos' : 'Next games'}</h3>
              <table className="mt-1.5 w-full border-collapse text-[14px]">
                <caption className="sr-only">{pt ? 'Probabilidades de vitória da casa, empate e vitória de fora, e o que cada jogo põe em jogo' : 'Chances of a home win, a draw and an away win, and what each game puts at stake'}</caption>
                <thead>
                  <tr className="border-b border-ink text-[12.5px] text-graphite">
                    <th scope="col" className="pb-1 text-left font-medium">{pt ? 'Jogo, hora de Lisboa' : 'Game, Lisbon time'}</th>
                    <th scope="col" className="pb-1 text-right font-medium">{pt ? 'Casa' : 'Home'}</th>
                    <th scope="col" className="pb-1 text-right font-medium">{pt ? 'Empate' : 'Draw'}</th>
                    <th scope="col" className="pb-1 text-right font-medium">{pt ? 'Fora' : 'Away'}</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(g => {
                    const p = [g.p_home as number, g.p_draw as number, g.p_away as number];
                    const top = p.indexOf(Math.max(...p));
                    return [
                      <tr key={`${g.slug}-1x2`}>
                        <th scope="row" className="pt-2 pr-2 text-left font-normal">
                          <span className="block text-[12px] leading-4 text-graphite">
                            {formatKickoffShort(g.kickoff, locale, { confirmed: g.kickoffConfirmed })}
                            {g.postponed ? (pt ? ' · jogo em atraso' : ' · postponed game') : ''}
                          </span>
                          <Link href={`/desporto/liga/jogo/${g.slug}`} locale={locale} className="name-cut no-underline hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center">
                            {matchLabel(teamPhoneName(g.home), teamPhoneName(g.away))}
                          </Link>
                        </th>
                        {p.map((v, i) => (
                          <td key={i} className={`pt-2 text-right align-bottom ${i === top ? 'disp text-[18px]' : 'text-[14.5px]'}`}>{Math.round(v * 100)}</td>
                        ))}
                      </tr>,
                      <tr key={`${g.slug}-stake`} className="border-b border-grid">
                        <td colSpan={4} className="pb-2 pt-0.5 text-[12.5px] leading-[17px] text-graphite">{stakeSentence(clubStake(g.scenario), locale)}</td>
                      </tr>,
                    ];
                  })}
                </tbody>
              </table>
              <p className="mt-2">
                <Link href="/desporto/liga" locale={locale} className="inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-4">
                  {pt ? 'A Liga inteira: tabela, jogos e clubes' : 'The whole league: table, games and clubs'}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
