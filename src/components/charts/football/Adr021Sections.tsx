"use client";

import { PlayerRatingList } from "@/components/charts/football/PlayerRatingList";
import type { RatingEntry } from "@/lib/utils/player-ratings";
import type {
  ContestedCell,
  ContestedRatings,
  GkChannels,
  GkChannelRow,
} from "@/lib/utils/football-data-loader";

/**
 * The two sections added by the ADR-021 survey: contested-possession ability
 * for defenders and midfielders, and the three separately-published
 * goalkeeper axes.
 *
 * Labelling here is mandated by the ADR, not editorial choice: the duel
 * metric is "contested-possession ability" and never "defensive rating";
 * cross intervention is a rate, not "command of the area"; sweeping is a
 * style axis whose persistence is partly the defensive line; and no
 * composite of the goalkeeper axes may exist anywhere, this page included.
 */

interface Labels {
  player: string;
  interval: string;
  noInterval: string;
  showAll: (n: number) => string;
  showLess: string;
  movement: string;
  newEntry: string;
  playerPage: string;
  openPlayer: (name: string) => string;
}

function makeLabels(pt: boolean, intervalPct: number): Labels {
  return {
    player: pt ? "Jogador" : "Player",
    interval: pt ? `Intervalo ${intervalPct}%` : `${intervalPct}% interval`,
    noInterval: pt ? "sem intervalo" : "no interval",
    showAll: (n: number) =>
      pt ? `Ver a lista completa (${n})` : `Show the full list (${n})`,
    showLess: pt ? "Mostrar menos" : "Show less",
    movement: pt ? "vs golos" : "vs goals",
    newEntry: pt ? "novo" : "new",
    playerPage: pt ? "Página do jogador" : "Player page",
    openPlayer: (name: string) =>
      pt ? `Abrir a página de ${name}` : `Open ${name}'s page`,
  };
}

/* ------------------------------------------------------ contested possession */

/**
 * The rating list draws a diverging bar anchored at zero, so the value it
 * receives must be a DELTA against the reference level — an absolute
 * probability of 0.71 rendered there would read as "+0.71 above average",
 * which is a lie by chart. Percentage points against the positional mean;
 * the absolute rate lives in the expanded detail rows.
 */
function contestedEntries(cell: ContestedCell): RatingEntry[] {
  const mean = cell.positional_mean;
  return (cell.ranking ?? []).map((r) => ({
    key: `${cell.channel}|${cell.position}|${r.player_id}`,
    player: r.player,
    team: r.team,
    position: cell.position,
    rank: r.rank,
    value: (r.theta - mean) * 100,
    lo: (r.theta_lo - mean) * 100,
    hi: (r.theta_hi - mean) * 100,
    raw: (r.rate_raw - mean) * 100,
    pAbove: null,
    minutes: null,
    matches: r.matches,
    shots: null,
    goalsConceded: null,
    xgotFaced: null,
    goals: null,
    assists: null,
    goalsRank: null,
    rankChange: null,
  }));
}

export function ContestedSection({
  data,
  playerSlugs,
  locale = "pt",
}: {
  data: ContestedRatings;
  playerSlugs?: Record<string, string>;
  locale?: string;
}) {
  const pt = locale !== "en";
  const labels = makeLabels(pt, Math.round(data.interval_mass * 100));
  const int = (v: number) =>
    Math.round(v).toLocaleString(pt ? "pt-PT" : "en-GB");

  const cellTitle = (c: ContestedCell) => {
    const ch = c.channel === "aerial"
      ? pt ? "Duelos aéreos" : "Aerial duels"
      : pt ? "Duelos no chão" : "Ground duels";
    const pos = c.position === "D"
      ? pt ? "defesas" : "defenders"
      : pt ? "médios" : "midfielders";
    return `${ch} — ${pos}`;
  };

  const shipped = data.cells.filter((c) => c.ships && c.ranking?.length);

  return (
    <section className="mb-12 border-t border-stone-200 pt-8">
      <h2 className="text-xl font-bold tracking-tight mb-1">
        {pt ? "Posse disputada" : "Contested possession"}
      </h2>
      <p className="text-sm text-stone-500 mb-2 max-w-3xl leading-relaxed">
        {pt
          ? "A probabilidade de ganhar um duelo — aéreo ou no chão — estimada sobre a carreira de três épocas de cada jogador. É a primeira métrica desta página em que defesas e médios se separam de facto uns dos outros, porque o resultado é atribuído ao jogador que disputou o lance, não à equipa inteira."
          : "The probability of winning a duel — aerial or on the ground — estimated over each player's three-season career. It is the first metric on this page where defenders and midfielders genuinely separate from one another, because the outcome is attributed to the player who contested it, not to the whole team."}
      </p>
      <p className="text-xs text-amber-700 bg-amber-50 border-l-2 border-amber-300 pl-3 py-1.5 mb-2 max-w-3xl leading-relaxed">
        {pt
          ? "O que isto não é: uma classificação defensiva. Mede posse disputada — uma dimensão estreita e honesta — e nada mais. O contributo defensivo individual para os golos sofridos continua a não ser mensurável nesta liga, e nenhuma métrica desta página finge o contrário."
          : "What this is not: a defensive rating. It measures contested possession — one narrow, honest dimension — and nothing else. Individual defensive contribution to goals conceded remains unmeasurable in this league, and no metric on this page pretends otherwise."}
      </p>
      <p className="text-xs text-stone-500 mb-5 max-w-3xl leading-relaxed">
        {pt
          ? "Os valores são agregados de carreira por necessidade: uma época sozinha não chega para separar jogadores. Um reforço acabado de chegar não pode ser avaliado durante cerca de duas épocas. Nos duelos aéreos dos defesas, a etiqueta de perfil (mais ou menos solicitação aérea) distingue centrais de laterais — compare dentro do mesmo perfil."
          : "Values are career-pooled by necessity: a single season is not enough to separate players. A newly arrived signing cannot be rated for roughly two seasons. In defenders' aerial duels, the profile tag (higher or lower aerial involvement) distinguishes centre-backs from full-backs — compare within the same profile."}
      </p>

      {shipped.map((cell) => (
        <div key={`${cell.channel}-${cell.position}`} className="mb-8">
          <h3 className="text-sm font-bold text-stone-800 mb-1">
            {cellTitle(cell)}
          </h3>
          <p className="text-[11px] text-stone-400 mb-3">
            {pt
              ? `${cell.separable} de ${int(cell.n_players)} jogadores ajustados separam-se da média da posição (${cell.permutation_null} esperados por acaso). A lista mostra só quem está na Liga esta época.`
              : `${cell.separable} of ${int(cell.n_players)} fitted players separate from the positional average (${cell.permutation_null} expected by chance). The list shows only players in the league this season.`}
          </p>
          <PlayerRatingList
            entries={contestedEntries(cell).slice(0, 8)}
            locale={locale}
            digits={1}
            metricHeader={
              pt
                ? "P(ganhar) vs média da posição"
                : "P(win) vs positional average"
            }
            valueHeader="p.p."
            playerSlugs={playerSlugs}
            initialCount={8}
            labels={labels}
            detailCells={(e) => [
              ...(() => {
                const row = cell.ranking?.find((r) => r.player === e.player);
                return row
                  ? [{
                      label: pt ? "P(ganhar o duelo)" : "P(win the duel)",
                      value: `${(row.theta * 100).toFixed(1)}%`,
                    }, {
                      label: pt ? "Taxa bruta" : "Raw rate",
                      value: `${(row.rate_raw * 100).toFixed(1)}%`,
                    }]
                  : [];
              })(),
              ...(e.matches !== null
                ? [{ label: pt ? "Jogos" : "Matches", value: int(e.matches) }]
                : []),
              ...(() => {
                const row = cell.ranking?.find((r) => r.player === e.player);
                return row?.role_cluster
                  ? [{
                      label: pt ? "Perfil" : "Profile",
                      value: row.role_cluster === "high_aerial"
                        ? pt ? "muita solicitação aérea (central)" : "high aerial involvement (CB-like)"
                        : pt ? "pouca solicitação aérea (lateral)" : "low aerial involvement (FB-like)",
                    }]
                  : [];
              })(),
              ...(() => {
                const row = cell.ranking?.find((r) => r.player === e.player);
                return row
                  ? [{
                      label: pt ? "Duelos (ganhos)" : "Duels (won)",
                      value: `${int(row.duels)} (${int(row.won)})`,
                    }]
                  : [];
              })(),
            ]}
          />
        </div>
      ))}

      <p className="text-[10px] text-stone-400 mt-2 leading-relaxed max-w-3xl">
        {pt
          ? `Épocas ${data.seasons[0]}–${data.seasons[data.seasons.length - 1]}. Cada célula passou três portas pré-registadas: separabilidade acima de 3× o acaso, correlação com a qualidade do clube abaixo de 0,3 e estabilidade em jogadores que mudaram de clube. A taxa média da liga é exatamente 50% por construção — cada duelo ganho é o duelo perdido de outro jogador.`
          : `Seasons ${data.seasons[0]}–${data.seasons[data.seasons.length - 1]}. Every cell passed three pre-registered gates: separability above 3× chance, club-quality correlation under 0.3, and stability across players who changed clubs. The league-average rate is exactly 50% by construction — every duel won is another player's duel lost.`}
      </p>
    </section>
  );
}

/* ------------------------------------------------------- goalkeeper channels */

/**
 * Same delta rule as the contested list: the league-average rate is the
 * anchor, computed from the published rows themselves so no number is
 * assumed in the presentation layer.
 */
function gkEntries(rows: GkChannelRow[], scale: number, league: number): RatingEntry[] {
  return rows.map((r) => {
    const has = typeof (r as { implied?: number }).implied === "number";
    const implied = (r as { implied?: number; implied_lo?: number; implied_hi?: number });
    return {
      key: `gkch|${r.keeper_id}`,
      player: r.keeper,
      team: r.team,
      position: "G",
      rank: r.rank,
      value: has ? (implied.implied! - league) * scale : r.theta,
      lo: has ? (implied.implied_lo! - league) * scale : r.theta_lo,
      hi: has ? (implied.implied_hi! - league) * scale : r.theta_hi,
      raw: r.n > 0 ? (r.y / r.n - league) * scale : null,
      pAbove: r.p_above_average,
      minutes: r.minutes,
      matches: null,
      shots: null,
      goalsConceded: null,
      xgotFaced: null,
      goals: null,
      assists: null,
      goalsRank: null,
      rankChange: null,
    };
  });
}

/** League rate from the rows: total successes over total exposure. */
function leagueRate(rows: GkChannelRow[], perMinutes = false): number {
  const y = rows.reduce((s, r) => s + r.y, 0);
  const n = perMinutes
    ? rows.reduce((s, r) => s + r.minutes / 90, 0)
    : rows.reduce((s, r) => s + r.n, 0);
  return n > 0 ? y / n : 0;
}

export function GkChannelsSection({
  data,
  locale = "pt",
}: {
  data: GkChannels;
  locale?: string;
}) {
  const pt = locale !== "en";
  const labels = makeLabels(pt, Math.round(data.interval_mass * 100));
  const int = (v: number) =>
    Math.round(v).toLocaleString(pt ? "pt-PT" : "en-GB");
  const cross = data.channels.cross_intervention;
  const sweep = data.channels.sweeping;
  const stop = data.channels.shot_stopping;

  return (
    <section className="mb-12 border-t border-stone-200 pt-8">
      <h2 className="text-xl font-bold tracking-tight mb-1">
        {pt
          ? "Guarda-redes: três eixos, publicados separados"
          : "Goalkeepers: three axes, published separately"}
      </h2>
      <p className="text-sm text-stone-500 mb-2 max-w-3xl leading-relaxed">
        {pt
          ? "Não há aqui uma nota única de guarda-redes, e isso é deliberado: os três eixos têm fiabilidades época-a-época entre 0,72 e abaixo de zero, e qualquer média entre eles fabricaria precisão. Cada eixo diz uma coisa, com a sua incerteza."
          : "There is no single goalkeeper score here, and that is deliberate: the three axes have season-to-season reliabilities ranging from 0.72 to below zero, and any average across them would manufacture precision. Each axis says one thing, with its own uncertainty."}
      </p>

      {/* Axis 1: cross intervention — the separable one */}
      {cross.ships && cross.ranking && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-stone-800 mb-1">
            {pt ? "Intervenção em cruzamentos" : "Cross intervention"}
          </h3>
          <p className="text-xs text-stone-500 mb-1 max-w-3xl leading-relaxed">
            {pt
              ? `A percentagem de cruzamentos sofridos em que o guarda-redes sai — alívio de punhos ou bola agarrada. É o primeiro eixo de guarda-redes deste site em que os jogadores realmente se separam: ${cross.separable} de ${int(cross.n_fitted ?? cross.ranking.length)} no painel ajustado, para além do acaso (~5 esperados). E é do guarda-redes, não do clube: dois guarda-redes da mesma equipa não se parecem um com o outro (correlação ${cross.teammate_r.toFixed(2).replace(".", pt ? "," : ".")}). A lista mostra só quem está na Liga esta época.`
              : `The share of crosses faced where the keeper comes for the ball — a punch or a claim. It is the first goalkeeper axis on this site where players genuinely separate: ${cross.separable} of ${int(cross.n_fitted ?? cross.ranking.length)} in the fitted panel, beyond chance (~5 expected). And it belongs to the keeper, not the club: two keepers at the same club do not resemble each other (correlation ${cross.teammate_r.toFixed(2)}). The list shows only keepers in the league this season.`}
          </p>
          <p className="text-[11px] text-stone-400 mb-3 max-w-3xl">
            {pt
              ? "Não lhe chamamos “domínio da área”: a métrica não distingue um guarda-redes que agarra de um que soca tudo."
              : "We do not call this “command of the area”: the metric cannot tell a commanding catcher from a punch-happy keeper."}
          </p>
          <PlayerRatingList
            entries={gkEntries(
              cross.ranking, 100, leagueRate(cross.ranking),
            ).slice(0, 8)}
            locale={locale}
            digits={1}
            metricHeader={
              pt
                ? "Intervenção vs média da liga"
                : "Intervention vs league average"
            }
            valueHeader="p.p."
            initialCount={8}
            labels={labels}
            detailCells={(e) => [
              ...(() => {
                const row = cross.ranking?.find((r) => r.keeper === e.player) as
                  | (GkChannelRow & { implied?: number })
                  | undefined;
                return row?.implied !== undefined
                  ? [{
                      label: pt ? "Taxa de intervenção" : "Intervention rate",
                      value: `${(row.implied * 100).toFixed(1)}%`,
                    }]
                  : [];
              })(),
              ...(e.minutes !== null
                ? [{ label: pt ? "Minutos" : "Minutes", value: int(e.minutes) }]
                : []),
              ...(e.pAbove !== null
                ? [{
                    label: pt ? "Prob. acima da média" : "P(above average)",
                    value: `${Math.round(e.pAbove * 100)}%`,
                  }]
                : []),
            ]}
          />
          <p className="text-[10px] text-stone-400 mt-2 max-w-3xl leading-relaxed">
            {pt
              ? "Nenhum guarda-redes mudou de clube entre épocas consecutivas com jogos suficientes, por isso ainda não sabemos se esta característica viaja com o jogador."
              : "No keeper changed clubs between consecutive seasons with enough matches, so whether this trait travels with the player is still untested."}
          </p>
        </div>
      )}

      {/* Axis 2: sweeping — a style, not a quality */}
      {sweep.ranking && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-stone-800 mb-1">
            {pt ? "Saídas da área (estilo)" : "Sweeping (a style)"}
          </h3>
          <p className="text-xs text-stone-500 mb-3 max-w-3xl leading-relaxed">
            {pt
              ? "Quantas vezes por 90 minutos o guarda-redes sai da área para cortar bolas nas costas da defesa. Isto é um eixo de estilo, não de qualidade: cerca de um terço da persistência vem da altura da linha defensiva do clube, não do guarda-redes. Um valor alto descreve como joga, não se joga bem."
              : "How often per 90 minutes the keeper leaves the box to cut out balls behind the defence. This is a style axis, not a quality one: about a third of its persistence comes from the club's defensive line height, not the keeper. A high value describes how they play, not how well."}
          </p>
          <PlayerRatingList
            entries={gkEntries(
              sweep.ranking, 1, leagueRate(sweep.ranking, true),
            ).slice(0, 8)}
            locale={locale}
            metricHeader={
              pt ? "Saídas por 90' vs média da liga" : "Sweeps per 90 vs league average"
            }
            valueHeader={pt ? "por 90" : "per 90"}
            initialCount={8}
            labels={labels}
            detailCells={(e) => [
              ...(() => {
                const row = sweep.ranking?.find((r) => r.keeper === e.player) as
                  | (GkChannelRow & { implied?: number })
                  | undefined;
                return row?.implied !== undefined
                  ? [{
                      label: pt ? "Saídas por 90'" : "Sweeps per 90",
                      value: row.implied.toFixed(2),
                    }]
                  : [];
              })(),
              ...(e.minutes !== null
                ? [{ label: pt ? "Minutos" : "Minutes", value: int(e.minutes) }]
                : []),
            ]}
          />
        </div>
      )}

      {/* Axis 3: shot-stopping — the properly-powered null */}
      <div className="mb-2">
        <h3 className="text-sm font-bold text-stone-800 mb-1">
          {pt ? "Defesa de remates" : "Shot-stopping"}
        </h3>
        {stop.ships && stop.ranking ? (
          <PlayerRatingList
            entries={gkEntries(stop.ranking, 1, 0)}
            locale={locale}
            metricHeader={pt ? "Golos evitados" : "Goals prevented"}
            valueHeader="θ"
            initialCount={8}
            labels={labels}
          />
        ) : (
          <div className="max-w-3xl border-l-2 border-amber-300 bg-amber-50 pl-3 py-2">
            <p className="text-xs text-amber-800 leading-relaxed">
              {/* Counts come from the feed — the fitted panel grows as
                  seasons accumulate, and a hardcoded 47 would silently rot. */}
              {pt
                ? `${int(stop.separable)} de ${int(stop.n_fitted ?? 0)} guarda-redes se separam da média em ${data.seasons.length} épocas de remates (~${int(stop.mean_sot_faced ?? 0)} por guarda-redes). Já não é falta de dados: a resposta continua a ser que as diferenças entre guarda-redes da Liga a parar remates são reais mas demasiado pequenas para ordenar com confiança. Publicamos o nulo em vez de uma lista que fingiria sabê-lo.`
                : `${int(stop.separable)} of ${int(stop.n_fitted ?? 0)} keepers separate from the average over ${data.seasons.length} seasons of shots (~${int(stop.mean_sot_faced ?? 0)} per keeper). This is no longer a data shortage: the answer is still that Liga keepers' shot-stopping differences are real but too small to rank confidently. We publish the null rather than a list that would pretend to know.`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
