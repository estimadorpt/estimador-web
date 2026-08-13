"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { PlayerRatingList } from "@/components/charts/football/PlayerRatingList";
import {
  ContestedSection,
  GkChannelsSection,
} from "@/components/charts/football/Adr021Sections";
import type {
  ContestedRatings,
  GkChannels,
} from "@/lib/utils/football-data-loader";
import type { PlayerSkillData } from "@/components/charts/football/PlayerSkillRanking";
import { countSeparated } from "@/lib/utils/player-ratings";
import type {
  PositionalRow,
  RatingEntry,
  RatingsBlock,
} from "@/lib/utils/player-ratings";
import { positionCodeEn, positionCodePt } from "@/lib/i18n/football-labels";

/**
 * The player-ratings hub: four metrics side by side, and an explanation of
 * why there have to be four.
 *
 * The editorial spine is ADR-019 in the model repo. The original ranking
 * measured goals only, which made it a forwards metric wearing a league-wide
 * label — every goalkeeper in the fit received an identical value because the
 * model had nothing to say about them. Rather than blend positions into one
 * meaningless number, each position gets its own model, its own scale and its
 * own credible interval.
 *
 * Any of the three new feeds can be missing on any build; a missing feed
 * renders nothing at all rather than a placeholder.
 */

interface PlayerRatingsHubProps {
  finishers: PlayerSkillData | null;
  contrib: RatingsBlock | null;
  gk: RatingsBlock | null;
  def: RatingsBlock | null;
  contested?: ContestedRatings | null;
  gkChannels?: GkChannels | null;
  playerSlugs?: Record<string, string>;
  locale?: string;
}

/** Convert a goals-SAR row into the shared rating shape. */
function finisherEntries(data: PlayerSkillData): RatingEntry[] {
  return data.players.map((p, i) => ({
    key: `${p.player}|${p.team}|${i}`,
    player: p.player,
    team: p.team,
    position: p.position,
    rank: p.rank,
    value: p.sar,
    lo: p.skill_lo ?? null,
    hi: p.skill_hi ?? null,
    raw: null,
    pAbove: p.p_above_replacement ?? null,
    minutes: p.minutes,
    matches: p.matches,
    shots: null,
    goalsConceded: null,
    xgotFaced: null,
    goals: p.goals,
    assists: null,
    goalsRank: p.rank,
    rankChange: null,
  }));
}

export function PlayerRatingsHub({
  finishers,
  contrib,
  gk,
  def,
  contested = null,
  gkChannels = null,
  playerSlugs,
  locale = "pt",
}: PlayerRatingsHubProps) {
  const pt = locale !== "en";
  const nf = (v: number, d = 2) =>
    v.toLocaleString(pt ? "pt-PT" : "en-GB", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  const int = (v: number) => Math.round(v).toLocaleString(pt ? "pt-PT" : "en-GB");

  /**
   * Interval labels are read from the feed, never assumed. Every model
   * publishes 90%; this page printed 94% over the goals ranking until that
   * feed started carrying the real value, which is the lie to avoid.
   */
  const intervalLabel = (pct: number | null) =>
    pct === null
      ? pt
        ? "Intervalo"
        : "Interval"
      : pt
        ? `Intervalo ${nf(pct, 0)}%`
        : `${nf(pct, 0)}% interval`;

  const listLabels = (pct: number | null) => ({
    player: pt ? "Jogador" : "Player",
    interval: intervalLabel(pct),
    noInterval: pt ? "sem intervalo" : "no interval",
    showAll: (n: number) =>
      pt ? `Ver a lista completa (${n})` : `Show the full list (${n})`,
    showLess: pt ? "Mostrar menos" : "Show less",
    movement: pt ? "vs golos" : "vs goals",
    newEntry: pt ? "novo" : "new",
    playerPage: pt ? "Página do jogador" : "Player page",
    openPlayer: (name: string) =>
      pt ? `Abrir a página de ${name}` : `Open ${name}'s page`,
  });

  /* ---------------------------------------- the finishing metric, in numbers */

  const finisherRows = finishers?.players ?? [];
  const posCounts = finisherRows.reduce<Record<string, number>>((acc, p) => {
    acc[p.position] = (acc[p.position] ?? 0) + 1;
    return acc;
  }, {});
  // "37 avançados, 3 médios" — plural only when it changes the word
  // ("guarda-redes" is already invariant in Portuguese).
  const posBreakdown = Object.entries(posCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([code, n]) => {
      const word = ((pt ? positionCodePt[code] : positionCodeEn[code]) ?? code)
        .toLowerCase();
      const plural = n === 1 || word.endsWith("s") ? word : `${word}s`;
      return `${n} ${plural}`;
    })
    .join(", ");

  const goalsRankByPlayer = Object.fromEntries(
    finisherRows.map((p) => [p.player, p.rank]),
  );

  // How many keepers the model actually told apart from the average. Zero is
  // the answer today, and it is the headline of that section.
  const gkSeparated = gk ? countSeparated(gk) : null;

  // Diagnostics split by shape: short numbers tile, long statements (the
  // pre-registered criterion, for one) need a full line to stay readable.
  const tidyValue = (v: string) => {
    if (v === "true") return pt ? "sim" : "yes";
    if (v === "false") return pt ? "não" : "no";
    const n = Number(v);
    // Trailing zeros would read as thousands under pt-PT grouping ("78,600").
    return Number.isFinite(n) && v.trim() !== ""
      ? n.toLocaleString(pt ? "pt-PT" : "en-GB", { maximumFractionDigits: 3 })
      : v;
  };
  const defDiagnostics = (def?.diagnostics ?? []).map((d) => ({
    ...d,
    value: tidyValue(d.value),
  }));
  const defNumbers = defDiagnostics.filter((d) => d.value.length <= 12);
  const defText = defDiagnostics.filter((d) => d.value.length > 12);

  /* ------------------------------------------------------ shared meta block */

  const metaLine = (block: RatingsBlock) => {
    const m = block.meta;
    const bits: string[] = [];
    if (m.seasons.length)
      bits.push(
        pt
          ? `épocas ${m.seasons[0]}–${m.seasons[m.seasons.length - 1]}`
          : `seasons ${m.seasons[0]}–${m.seasons[m.seasons.length - 1]}`,
      );
    if (m.nObservations !== null)
      bits.push(
        pt
          ? `${int(m.nObservations)} observações`
          : `${int(m.nObservations)} observations`,
      );
    if (m.nPlayers !== null)
      bits.push(pt ? `${int(m.nPlayers)} jogadores` : `${int(m.nPlayers)} players`);
    if (m.minMinutes !== null)
      bits.push(
        pt
          ? `mínimo ${int(m.minMinutes)} minutos`
          : `${int(m.minMinutes)}-minute minimum`,
      );
    if (m.maxRhat !== null) bits.push(`r̂ máx ${nf(m.maxRhat, 3)}`);
    if (m.divergences !== null)
      bits.push(
        pt ? `${int(m.divergences)} divergências` : `${int(m.divergences)} divergences`,
      );
    return bits.join(" · ");
  };

  /**
   * The sample caveat, the model's own note and the provenance line. The
   * caveat is ours and always shows: a feed that ships without a note does
   * not get to look better than one that admits its limits.
   */
  const MetaFootnote = ({
    block,
    caveat,
  }: {
    block: RatingsBlock;
    caveat: string;
  }) => {
    const line = metaLine(block);
    return (
      <div className="mt-3 max-w-3xl">
        <p className="text-[10px] text-stone-400 leading-relaxed">
          {caveat}
          {block.meta.note ? ` ${block.meta.note}` : ""}
          {line ? ` ${line}.` : ""}
        </p>
        {/* The model's own caveats, verbatim. They are written by whoever
            fitted it and are more specific than anything this page could
            say on its behalf. */}
        {block.meta.caveats.length > 0 && (
          <details className="mt-2 group">
            <summary className="text-[10px] text-stone-500 cursor-pointer hover:text-stone-800 list-none">
              {pt
                ? `O que esta métrica não mede (${block.meta.caveats.length}, em inglês tal como o modelo os publica)`
                : `What this metric does not measure (${block.meta.caveats.length})`}
            </summary>
            <ul className="mt-2 space-y-1.5 border-l border-stone-200 pl-3">
              {block.meta.caveats.map((c, i) => (
                <li key={i} className="text-[10px] text-stone-400 leading-relaxed">
                  {c}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  };

  /**
   * The by-position distribution, published by the model and rendered as
   * content. It is the acceptance test for this whole exercise: a position
   * whose range is near zero, or that takes only a couple of distinct values,
   * is not being measured at all.
   */
  const PositionalTable = ({ rows }: { rows: PositionalRow[] }) => {
    if (!rows.length) return null;
    const degenerate = (r: PositionalRow) =>
      (r.nDistinct !== null && r.n !== null && r.nDistinct <= Math.max(3, r.n * 0.05)) ||
      (r.range !== null && r.range < 0.02);
    return (
      <div className="mt-6 border-t border-stone-200 pt-4 max-w-3xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          {pt ? "A distribuição por posição" : "The distribution by position"}
        </h3>
        <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">
          {pt
            ? "O teste que esta página existe para passar: se uma posição inteira cai praticamente no mesmo valor, a métrica não a está a medir. Vale para o universo completo do modelo, não só para os jogadores listados acima."
            : "The test this page exists to pass: if a whole position collapses onto practically one value, the metric is not measuring it. This covers the model's full universe, not only the players listed above."}
        </p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-300 text-left">
              <th className="py-1.5 pr-3 font-medium text-[10px] uppercase tracking-wider text-stone-400">
                {pt ? "Posição" : "Position"}
              </th>
              <th className="py-1.5 px-2 text-right font-medium text-[10px] uppercase tracking-wider text-stone-400">
                n
              </th>
              <th className="py-1.5 px-2 text-right font-medium text-[10px] uppercase tracking-wider text-stone-400">
                {pt ? "mediana" : "median"}
              </th>
              <th className="py-1.5 px-2 text-right font-medium text-[10px] uppercase tracking-wider text-stone-400">
                {pt ? "amplitude" : "range"}
              </th>
              <th className="py-1.5 pl-2 text-right font-medium text-[10px] uppercase tracking-wider text-stone-400">
                {pt ? "valores distintos" : "distinct values"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const flat = degenerate(r);
              return (
                <tr key={r.position} className="border-b border-stone-100">
                  <td
                    className={`py-1.5 pr-3 font-medium ${
                      flat ? "text-amber-700" : "text-stone-800"
                    }`}
                  >
                    {(pt ? positionCodePt[r.position] : positionCodeEn[r.position]) ??
                      r.position}
                    {flat && (
                      <span className="ml-2 text-[9px] uppercase tracking-wide bg-amber-50 text-amber-700 px-1 py-px">
                        {pt ? "não medido" : "not measured"}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-stone-600">
                    {r.n === null ? "—" : int(r.n)}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-stone-600">
                    {r.median === null ? "—" : nf(r.median, 3)}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-stone-600">
                    {r.range === null
                      ? r.min === null || r.max === null
                        ? "—"
                        : nf(r.max - r.min, 3)
                      : nf(r.range, 3)}
                  </td>
                  <td
                    className={`py-1.5 pl-2 text-right tabular-nums ${
                      flat ? "font-semibold text-amber-700" : "text-stone-600"
                    }`}
                  >
                    {r.nDistinct === null ? "—" : int(r.nDistinct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /* ------------------------------------------------------------ inventory */

  // Three states, not two: a ranking, a fit that came back inconclusive, and
  // nothing at all. Collapsing the middle one into either of the others would
  // be the dishonesty this page is about.
  const published: string[] = [];
  const inconclusive: string[] = [];
  const missing: string[] = [];
  const bucket = (block: RatingsBlock | null, label: string) => {
    if (block?.players.length) published.push(label);
    else if (block) inconclusive.push(label);
    else missing.push(label);
  };
  if (finishers?.players?.length) published.push(pt ? "finalização" : "finishing");
  else missing.push(pt ? "finalização" : "finishing");
  bucket(contrib, pt ? "contribuição" : "contribution");
  if (contested?.cells.some((c) => c.ships && c.ranking?.length))
    published.push(pt ? "posse disputada" : "contested possession");
  const crossShips = gkChannels?.channels.cross_intervention.ships ?? false;
  if (crossShips)
    published.push(
      pt ? "intervenção em cruzamentos" : "cross intervention",
    );
  if (gkChannels && !gkChannels.channels.shot_stopping.ships)
    inconclusive.push(
      pt ? "defesa de remates (3 épocas)" : "shot-stopping (3 seasons)",
    );
  // The xGOT feed is superseded by the three-axis section when that feed
  // exists; listing an unrendered section as ranked would be a lie.
  if (!gkChannels) bucket(gk, pt ? "guarda-redes (xGOT)" : "goalkeepers (xGOT)");
  bucket(def, pt ? "defesas" : "defenders");

  return (
    <div>
      {/* ------------------------------------------------------- the argument */}
      <section className="mb-12 max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
          {pt ? "Jogadores" : "Players"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 mb-4">
          {pt
            ? "Uma métrica por dimensão, porque um número só não chega"
            : "One metric per dimension, because one number is not enough"}
        </h1>
        <p className="text-base text-stone-600 leading-relaxed mb-4">
          {pt
            ? "Não existe forma honesta de pôr um guarda-redes e um ponta de lança na mesma tabela. São trabalhos diferentes, medidos por dados diferentes, e qualquer número único que os junte está a dizer sobretudo em que posição joga cada um."
            : "There is no honest way to put a goalkeeper and a centre-forward in the same table. They do different jobs, measured by different data, and any single number that merges them is mostly reporting what position each player occupies."}
        </p>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          {pt
            ? "Durante meses este site publicou exatamente esse erro. O ranking de jogadores media golos por 90 minutos acima de um substituto — uma boa métrica, mas de finalização — e apresentava-o como se fosse um ranking da Liga. Ao verificarmos a distribuição por posição, o problema era evidente: todos os guarda-redes do modelo recebiam exatamente o mesmo valor, porque o modelo não tinha nada a dizer sobre eles. Não estava a medi-los mal: não os estava a medir de todo."
            : "For months this site published exactly that mistake. The player ranking measured goals per 90 minutes above a replacement player — a good metric, but a finishing one — and presented it as a league ranking. Checking the distribution by position made the problem obvious: every goalkeeper in the model received an identical value, because the model had nothing to say about them. It was not measuring them badly; it was not measuring them at all."}
        </p>
        <p className="text-sm text-stone-600 leading-relaxed">
          {pt
            ? "A correção não é um número melhor. É admitir que são precisos vários, cada um com a sua escala, o seu intervalo de credibilidade e a sua amostra — e que comparar valores entre eles não faz sentido. Um 0,20 de finalização e um 0,20 de guarda-redes não são a mesma coisa."
            : "The fix is not a better number. It is admitting that several are needed, each with its own scale, its own credible interval and its own sample — and that comparing values across them is meaningless. A 0.20 in finishing and a 0.20 in goalkeeping are not the same thing."}
        </p>

        <div className="mt-6 border-l-2 border-stone-300 pl-4 py-1">
          <p className="text-xs text-stone-500 leading-relaxed">
            <span>
              {pt ? "Com ranking nesta página: " : "Ranked on this page: "}
              <span className="font-semibold text-stone-700">
                {`${
                  published.length ? published.join(", ") : pt ? "nada" : "nothing"
                }.`}
              </span>
            </span>
            {inconclusive.length > 0 && (
              <span>
                {pt
                  ? ` Modelo corrido mas sem ranking possível: ${inconclusive.join(", ")}.`
                  : ` Model run but no ranking possible: ${inconclusive.join(", ")}.`}
              </span>
            )}
            {missing.length > 0 && (
              <span>
                {pt
                  ? ` Ainda sem métrica: ${missing.join(", ")}. Uma métrica que ainda não existe não aparece aqui como espaço vazio nem como estimativa provisória.`
                  : ` No metric yet: ${missing.join(", ")}. A metric that does not exist yet appears here as neither an empty slot nor a provisional estimate.`}
              </span>
            )}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- 1. finishers */}
      {finisherRows.length > 0 && finishers && (
        <section className="mb-12 border-t border-stone-200 pt-8">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            {pt ? "Finalização" : "Finishing"}
          </h2>
          <p className="text-sm text-stone-500 mb-2 max-w-3xl leading-relaxed">
            {pt
              ? "Golos por 90 minutos acima de um jogador de nível de substituição, depois de descontar minutos, adversário e fator casa. Os golos são limitados antes da conta, para que uma tarde de quatro golos não passe por talento permanente."
              : "Goals per 90 minutes above a replacement-level player, after adjusting for minutes, opponent and home advantage. Goals are capped before the estimate, so one four-goal afternoon is not read as permanent skill."}
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border-l-2 border-amber-300 pl-3 py-1.5 mb-5 max-w-3xl leading-relaxed">
            {pt
              ? `O que esta lista não é: um ranking da Liga. Os ${int(
                  finisherRows.length,
                )} nomes publicados são ${posBreakdown} — é uma métrica de avançados, e deve ser lida como tal.`
              : `What this list is not: a league ranking. The ${int(
                  finisherRows.length,
                )} published names are ${posBreakdown} — it is a forwards metric, and should be read as one.`}
          </p>

          <PlayerRatingList
            entries={finisherEntries(finishers).slice(0, 10)}
            locale={locale}
            metricHeader={
              pt ? "Golos/90 acima do substituto" : "Goals/90 above replacement"
            }
            valueHeader="SAR"
            playerSlugs={playerSlugs}
            initialCount={10}
            labels={listLabels(
              finishers?.interval_mass != null
                ? finishers.interval_mass * 100
                : null,
            )}
            detailCells={(e) => [
              ...(e.minutes !== null
                ? [{ label: pt ? "Minutos" : "Minutes", value: int(e.minutes) }]
                : []),
              ...(e.goals !== null
                ? [{ label: pt ? "Golos" : "Goals", value: int(e.goals) }]
                : []),
              ...(e.pAbove !== null
                ? [
                    {
                      label: pt ? "Prob. acima do subst." : "P(above replacement)",
                      value: `${Math.round(e.pAbove * 100)}%`,
                    },
                  ]
                : []),
            ]}
          />

          <p className="text-[10px] text-stone-400 mt-3 leading-relaxed max-w-3xl">
            {pt
              ? `Top 10 de ${int(finisherRows.length)} publicados. Mínimo de ${int(
                  finishers.generated_from.min_minutes,
                )} minutos; ajustado a ${int(
                  finishers.generated_from.n_observations,
                )} atuações individuais desde ${finishers.generated_from.seasons[0]}`
              : `Top 10 of ${int(finisherRows.length)} published. ${int(
                  finishers.generated_from.min_minutes,
                )}-minute minimum; fitted on ${int(
                  finishers.generated_from.n_observations,
                )} individual appearances since ${finishers.generated_from.seasons[0]}`}
            {finishers.generated_from.max_rhat !== undefined
              ? ` · r̂ máx ${nf(finishers.generated_from.max_rhat, 3)}`
              : ""}
            {finishers.generated_from.divergences !== undefined
              ? ` · ${int(finishers.generated_from.divergences)} ${
                  pt ? "divergências" : "divergences"
                }`
              : ""}
            .
          </p>

          <Link
            href="/desporto/liga"
            locale={locale}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
          >
            {pt ? "Ranking completo de finalização" : "Full finishing ranking"}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </section>
      )}

      {/* ----------------------------------------------------- 2. contribution */}
      {contrib && contrib.players.length > 0 && (
        <section className="mb-12 border-t border-stone-200 pt-8">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            {pt ? "Contribuição ofensiva" : "Attacking contribution"}
          </h2>
          <p className="text-sm text-stone-500 mb-2 max-w-3xl leading-relaxed">
            {pt
              ? "A mesma estrutura da métrica de finalização, mas com golos e assistências juntos. Cobre médios e extremos que marcam pouco e criam muito — os jogadores que a métrica de golos, por construção, não conseguia ver."
              : "The same structure as the finishing metric, but with goals and assists together. It covers the midfielders and wingers who score little and create plenty — the players the goals-only metric could not see, by construction."}
          </p>
          <p className="text-xs text-stone-500 mb-5 max-w-3xl leading-relaxed">
            {pt
              ? "A coluna «vs golos» mostra quantas posições cada jogador sobe ou desce face ao ranking só de golos. É aí que está a história: quem o número antigo subestimava."
              : "The “vs goals” column shows how many places each player moves against the goals-only ranking. That is where the story is: who the old number was underrating."}
          </p>

          <PlayerRatingList
            entries={contrib.players}
            locale={locale}
            metricHeader={
              pt
                ? "Contribuição/90 acima do substituto"
                : "Contribution/90 above replacement"
            }
            valueHeader={pt ? "valor" : "value"}
            playerSlugs={playerSlugs}
            goalsRankByPlayer={goalsRankByPlayer}
            showMovement
            initialCount={12}
            labels={listLabels(contrib.meta.intervalPct)}
            detailCells={(e) => [
              ...(e.minutes !== null
                ? [{ label: pt ? "Minutos" : "Minutes", value: int(e.minutes) }]
                : []),
              ...(e.goals !== null && e.assists !== null
                ? [
                    {
                      label: pt ? "Golos / assist." : "Goals / assists",
                      value: `${int(e.goals)} / ${int(e.assists)}`,
                    },
                  ]
                : []),
              ...(e.pAbove !== null
                ? [
                    {
                      label: pt ? "Prob. acima do subst." : "P(above replacement)",
                      value: `${Math.round(e.pAbove * 100)}%`,
                    },
                  ]
                : []),
            ]}
          />

          <MetaFootnote
            block={contrib}
            caveat={
              pt
                ? "Estimativa bayesiana com encolhimento: poucos minutos puxam o valor para o nível de substituição e alargam o intervalo."
                : "Bayesian estimate with shrinkage: few minutes pull the value toward replacement level and widen the interval."
            }
          />

          {/* The acceptance test, published with the metric it tests */}
          <PositionalTable rows={contrib.positional} />
          {contrib.positional.length > 0 && (
            <p className="text-[11px] text-stone-500 mt-3 max-w-3xl leading-relaxed">
              {pt
                ? "Ler a tabela: somar assistências resolve os médios, que passam a espalhar-se por uma amplitude real. Não resolve os defesas, e não resolve de todo os guarda-redes — que continuam praticamente todos no mesmo valor, porque não marcam nem assistem. É por isso que estas posições têm secções próprias em vez de uma linha nesta lista."
                : "How to read it: adding assists fixes midfielders, who now spread across a real range. It does not fix defenders, and it does not fix goalkeepers at all — they still sit on practically one value, because they neither score nor assist. That is why those positions get their own sections instead of a row in this list."}
            </p>
          )}
        </section>
      )}

      {/* ------------------------------------- 3. contested possession (ADR-021) */}
      {contested && contested.cells.some((c) => c.ships && c.ranking?.length) && (
        <ContestedSection
          data={contested}
          playerSlugs={playerSlugs}
          locale={locale}
        />
      )}

      {/* --------------------------------- 4. goalkeeper channels (ADR-021) */}
      {gkChannels && <GkChannelsSection data={gkChannels} locale={locale} />}

      {/* The pre-ADR-021 goalkeeper section (shotmap xGOT, one season).
          Superseded by the three-axis section above when its feed exists —
          rendering both would present two shot-stopping verdicts. */}
      {!gkChannels && gk && gk.players.length > 0 && (
        <section className="mb-12 border-t border-stone-200 pt-8">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            {pt ? "Guarda-redes" : "Goalkeepers"}
          </h2>
          <p className="text-sm text-stone-500 mb-2 max-w-3xl leading-relaxed">
            {pt
              ? "Golos evitados face ao esperado. Para cada remate à baliza sofrido existe um xGOT — a probabilidade de aquele remate acabar em golo, dado o sítio exato onde foi colocado. Somar os xGOT sofridos e subtrair os golos sofridos dá o que o guarda-redes poupou à equipa."
              : "Goals prevented against expectation. Every shot on target faced carries an xGOT — the probability that shot ends in a goal, given exactly where it was placed. Adding up the xGOT faced and subtracting the goals conceded gives what the keeper saved his team."}
          </p>
          <p className="text-xs text-stone-500 mb-4 max-w-3xl leading-relaxed">
            {pt
              ? "O valor não é a soma bruta: uma época de guarda-redes são poucas centenas de remates, e a soma bruta é ruidosa. O modelo puxa cada guarda-redes para o nível médio na proporção da incerteza, e publica o intervalo."
              : "The value is not the raw sum: a keeper's season is a few hundred shots, and the raw sum is noisy. The model pulls each keeper toward the average in proportion to the uncertainty, and publishes the interval."}
          </p>

          {/* The null result, as the headline rather than a footnote: when no
              keeper's interval clears zero, the order below is description,
              not a finding. */}
          {gkSeparated === 0 && (
            <div className="mb-5 max-w-3xl border-l-2 border-amber-300 bg-amber-50 pl-3 py-2">
              <h3 className="text-sm font-bold text-amber-900 mb-1">
                {pt
                  ? "Nenhum guarda-redes se separa da média"
                  : "No goalkeeper separates from the average"}
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                {pt
                  ? `De ${int(
                      gk.players.length,
                    )} guarda-redes analisados, zero têm um intervalo que exclua o zero: em pouco mais de uma época de remates, não há um único caso em que possamos afirmar que o guarda-redes é melhor ou pior do que a média da Liga. A ordem abaixo é a descrição do que aconteceu — quem parou mais do que era esperado —, não uma afirmação sobre quem é melhor.`
                  : `Of ${int(
                      gk.players.length,
                    )} goalkeepers analysed, zero have an interval that excludes zero: over a little more than one season of shots, there is not a single case where we can say the keeper is better or worse than the league average. The order below describes what happened — who stopped more than expected — not who is better.`}
              </p>
            </div>
          )}

          <PlayerRatingList
            entries={gk.players}
            locale={locale}
            metricHeader={pt ? "Golos evitados por 90'" : "Goals prevented per 90"}
            valueHeader={pt ? "por 90" : "per 90"}
            playerSlugs={playerSlugs}
            initialCount={12}
            labels={listLabels(gk.meta.intervalPct)}
            detailCells={(e) => [
              ...(e.shots !== null
                ? [
                    {
                      label: pt ? "Remates enfrentados" : "Shots faced",
                      value: int(e.shots),
                    },
                  ]
                : []),
              ...(e.xgotFaced !== null && e.goalsConceded !== null
                ? [
                    {
                      label: pt ? "xGOT / golos sofridos" : "xGOT / conceded",
                      value: `${nf(e.xgotFaced, 1)} / ${int(e.goalsConceded)}`,
                    },
                  ]
                : []),
              ...(e.raw !== null
                ? [
                    {
                      label: pt ? "Bruto (sem modelo)" : "Raw (unmodelled)",
                      value: nf(e.raw, 1),
                    },
                  ]
                : []),
              ...(e.pAbove !== null
                ? [
                    {
                      label: pt ? "Prob. acima da média" : "P(above average)",
                      value: `${Math.round(e.pAbove * 100)}%`,
                    },
                  ]
                : []),
            ]}
          />

          <MetaFootnote
            block={gk}
            caveat={
              pt
                ? "Os mapas de remates só existem a partir de 2025-26, por isso esta é uma métrica de pouco mais de uma época: os intervalos são largos e vão continuar largos durante algum tempo."
                : "Shotmaps only exist from 2025-26 onward, so this is a metric built on little more than one season: the intervals are wide and will stay wide for a while."
            }
          />
          <PositionalTable rows={gk.positional} />
        </section>
      )}

      {/* -------------------------------------------------------- 4. defenders */}
      {def && (
        <section className="mb-12 border-t border-stone-200 pt-8">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            {pt ? "Defesas" : "Defenders"}
          </h2>

          {def.players.length > 0 ? (
            <>
              <p className="text-sm text-stone-500 mb-2 max-w-3xl leading-relaxed">
                {pt
                  ? "Golos sofridos pela equipa com e sem cada jogador em campo, com encolhimento forte. Mede o contributo para o resultado, não o número de desarmes — um defesa com muitos cortes pode estar sob pressão constante em vez de a defender bem."
                  : "Goals conceded by the team with and without each player on the pitch, heavily shrunk. It measures contribution to outcomes, not tackle counts — a defender making many clearances may be under constant pressure rather than defending well."}
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 border-l-2 border-amber-300 pl-3 py-1.5 mb-5 max-w-3xl leading-relaxed">
                {pt
                  ? "Leia os intervalos antes dos valores. Colegas de equipa que jogam sempre juntos são difíceis de separar, e num campeonato de 34 jornadas os intervalos são largos. Diferenças pequenas entre jogadores desta lista não são diferenças."
                  : "Read the intervals before the values. Team-mates who always play together are hard to tell apart, and in a 34-match league the intervals are wide. Small differences between players on this list are not differences."}
              </p>

              <PlayerRatingList
                entries={def.players}
                locale={locale}
                metricHeader={
                  pt ? "Golos evitados por 90'" : "Goals prevented per 90"
                }
                valueHeader={pt ? "por 90" : "per 90"}
                playerSlugs={playerSlugs}
                initialCount={12}
                labels={listLabels(def.meta.intervalPct)}
                detailCells={(e) => [
                  ...(e.minutes !== null
                    ? [{ label: pt ? "Minutos" : "Minutes", value: int(e.minutes) }]
                    : []),
                  ...(e.matches !== null
                    ? [{ label: pt ? "Jogos" : "Matches", value: int(e.matches) }]
                    : []),
                  ...(e.pAbove !== null
                    ? [
                        {
                          label: pt ? "Prob. acima da média" : "P(above average)",
                          value: `${Math.round(e.pAbove * 100)}%`,
                        },
                      ]
                    : []),
                ]}
              />
              <PositionalTable rows={def.positional} />
            </>
          ) : (
            <>
              <p className="text-sm text-stone-600 mb-3 max-w-3xl leading-relaxed">
                {pt
                  ? "Não há ranking de defesas nesta página, e isso é o resultado — não uma falha de publicação."
                  : "There is no defender ranking on this page, and that is the result — not a publishing failure."}
              </p>
              <p className="text-sm text-stone-500 mb-3 max-w-3xl leading-relaxed">
                {pt
                  ? "O modelo tentou estimar quanto cada defesa reduz os golos sofridos pela sua equipa, comparando o que acontece com e sem ele em campo. O problema é estrutural: os centrais jogam quase sempre com o mesmo parceiro, e a Liga tem 34 jornadas. Os dados não contêm informação suficiente para separar um jogador do seu colega do lado."
                  : "The model tried to estimate how much each defender reduces the goals his team concedes, comparing what happens with and without him on the pitch. The problem is structural: centre-backs almost always play with the same partner, and the league is 34 matches long. The data do not contain enough information to separate a player from the man next to him."}
              </p>
              <p className="text-sm text-stone-500 mb-3 max-w-3xl leading-relaxed">
                {pt
                  ? `O que sai do modelo é sobretudo a defesa do clube, distribuída por quem estava em campo. Dos ${
                      def.meta.nPlayers !== null ? int(def.meta.nPlayers) : "milhares de"
                    } jogadores estimados, nenhum passou o critério definido à partida — e o critério foi fixado antes de se ver o resultado, precisamente para não haver a tentação de o afrouxar depois.`
                  : `What comes out of the model is mostly the club's defence, spread over whoever was on the pitch. Of the ${
                      def.meta.nPlayers !== null ? int(def.meta.nPlayers) : "thousands of"
                    } players estimated, none passed the criterion set in advance — and it was set before anyone saw the result, precisely so there would be no temptation to loosen it afterwards.`}
              </p>
              <p className="text-sm text-stone-500 mb-4 max-w-3xl leading-relaxed">
                {pt
                  ? "Publicar a tabela na mesma seria vender ruído como ordenação. Preferimos dizer que não sabemos."
                  : "Publishing the table anyway would be selling noise as a ranking. We would rather say we do not know."}
              </p>

              {defNumbers.length > 0 && (
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 border-t border-stone-200 pt-4 max-w-3xl">
                  {defNumbers.map((d) => (
                    <div key={d.label}>
                      <dt className="text-[10px] uppercase tracking-wider text-stone-400">
                        {d.label}
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums text-stone-800">
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {defText.length > 0 && (
                <dl className="mt-4 space-y-2 max-w-3xl">
                  {defText.map((d) => (
                    <div key={d.label}>
                      <dt className="text-[10px] uppercase tracking-wider text-stone-400">
                        {d.label}
                      </dt>
                      <dd className="text-xs text-stone-600 leading-relaxed">
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </>
          )}

          <MetaFootnote
            block={def}
            caveat={
              pt
                ? "Mais-valia ajustada sobre golos sofridos, com encolhimento hierárquico."
                : "Adjusted plus-minus on goals conceded, with hierarchical shrinkage."
            }
          />
        </section>
      )}

      {/* ------------------------------------------------------------ closing */}
      <section className="border-t border-stone-200 pt-6 max-w-3xl">
        <p className="text-xs text-stone-500 leading-relaxed">
          {pt
            ? "Cada métrica tem a sua escala. Não some, não compare nem faça médias de valores de secções diferentes: um guarda-redes e um avançado não estão a ser medidos na mesma unidade, e ordená-los juntos era exatamente o erro que esta página existe para corrigir."
            : "Each metric has its own scale. Do not add, compare or average values across sections: a goalkeeper and a forward are not measured in the same unit, and ranking them together was exactly the mistake this page exists to correct."}
        </p>
        <Link
          href="/desporto/liga/metodologia"
          locale={locale}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 underline underline-offset-2"
        >
          {pt ? "Como funciona o modelo" : "How the model works"}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </section>
    </div>
  );
}
