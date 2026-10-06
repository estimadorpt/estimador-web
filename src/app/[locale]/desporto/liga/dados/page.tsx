import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createPageMetadata, siteTitle } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { loadPublishedFootballData } from "@/lib/utils/football-data-loader";
import type { PublishedFile, PublishedSeason } from "@/lib/utils/football-data-loader";
import type { Metadata } from "next";
import { teamDisplayName } from "@/lib/config/football";
import { formatKickoff, formatLongDate } from "@/lib/football-format";
import {
  earlyLocks,
  latePublications,
  type ManifestRoundLike,
} from "@/lib/utils/prediction-game-record";
import { setRequestLocale } from '@/i18n/request-locale';

const SITE = "https://estimador.pt";

/* ------------------------------------------------------------------- copy */

const copy = {
  pt: {
    title: "Dados abertos da Liga Portugal",
    description:
      "Todas as previsões da Liga Portugal publicadas em estimador.pt estão disponíveis como JSON estático, sem chave nem registo. Esta página documenta cada ficheiro e os seus campos principais.",
    back: "Liga Portugal",
    kicker: "Dados abertos",
    standfirstA:
      "As previsões das páginas da Liga Portugal vêm de ficheiros JSON estáticos servidos deste site, sem chave a pedir nem limite de pedidos. Só o jogo Contra o Modelo usa uma API própria, para guardar as previsões de quem joga; os dados do modelo estão todos aqui.",
    standfirstB:
      "Se construíres alguma coisa com eles, usa-os à vontade: só pedimos atribuição a estimador.pt e uma ligação para a página de origem. E se publicares, diz-nos: gostamos de ver.",
    filesTitle: "Ficheiros publicados",
    filesIntro:
      "A lista abaixo é gerada a partir do que está realmente no servidor no momento em que a página foi construída.",
    currentSeason: "época atual",
    archived: "época arquivada",
    schemaTitle: "Os campos principais",
    schemaIntro:
      "Os ficheiros de jornada (mdNN.json) são o ponto de partida para quase tudo. Os campos abaixo são os que interessam.",
    usageTitle: "Como usar",
    usageIntro:
      "Não há índice: os ficheiros de jornada seguem o padrão mdNN.json com dois dígitos, e o mais recente é o do número mais alto. A jornada em curso está sempre no ficheiro com o NN mais elevado da época atual.",
    licenceTitle: "Licença e atribuição",
    licence:
      "Livres de usar, redistribuir e transformar, incluindo para fins comerciais, desde que a fonte seja atribuída: «estimador.pt» com ligação para a página correspondente. Os dados são fornecidos como estão, sem garantias — são previsões probabilísticas de um modelo estatístico, e por definição vão estar erradas parte do tempo.",
    provenanceTitle: "Proveniência",
    provenance:
      "Resultados e estatísticas de jogo (incluindo xG e remates à baliza) da SofaScore; cotações de fecho (Pinnacle e Bet365) via football-data.co.uk; lesões e valores de mercado do Transfermarkt. As probabilidades vêm de um modelo bayesiano de Poisson bivariado (bivcross), ajustado aos golos e aos remates à baliza das últimas quatro épocas da Primeira Liga e da Liga 2, com os jogos mais antigos a pesar menos e o valor de cada plantel como ponto de partida, e de 50 000 simulações de Monte Carlo por publicação. A pré-época (md00) foi publicada pelo modelo anterior, joint_sot.",
    unavailable: "Não foi possível listar os ficheiros publicados.",
    methodology: "Como funciona o modelo",
    review: "A época 2025-26 em revista",
    files: "ficheiros",
    field: "Campo",
    meaning: "O que é",
    file: "Ficheiro",
    size: "Tamanho",
  },
  en: {
    title: "Liga Portugal open data",
    description:
      "Every Liga Portugal forecast published on estimador.pt is available as static JSON, with no key and no sign-up. This page documents each file and its main fields.",
    back: "Liga Portugal",
    kicker: "Open data",
    standfirstA:
      "The forecasts on the Liga Portugal pages come from static JSON files served from this site, with no key to request and no rate limit. Only the Beat the Model game uses an API of its own, to store players' picks; the model's data is all here.",
    standfirstB:
      "If you build something with them, go ahead — all we ask is attribution to estimador.pt and a link back to the source page. And if you publish, tell us: we like seeing it.",
    filesTitle: "Published files",
    filesIntro:
      "The list below is generated from what is actually on the server at the moment this page was built.",
    currentSeason: "current season",
    archived: "archived season",
    schemaTitle: "The main fields",
    schemaIntro:
      "The matchday files (mdNN.json) are the starting point for almost everything. These are the fields that matter.",
    usageTitle: "How to use it",
    usageIntro:
      "There is no index: matchday files follow the mdNN.json pattern with two digits, and the most recent is the highest number. The current matchday is always the highest NN in the current season's directory.",
    licenceTitle: "Licence and attribution",
    licence:
      "Free to use, redistribute and transform, commercial use included, as long as the source is credited: “estimador.pt”, with a link to the corresponding page. The data is provided as is, with no warranty — these are probabilistic forecasts from a statistical model, and by definition they will be wrong some of the time.",
    provenanceTitle: "Provenance",
    provenance:
      "Results and match statistics (xG and shots on target included) from SofaScore; closing odds (Pinnacle and Bet365) via football-data.co.uk; injuries and market values from Transfermarkt. The probabilities come from a bivariate Poisson Bayesian model (bivcross), fitted to goals and shots on target from the last four seasons of the Primeira Liga and Liga 2, with older games counting for less and each squad's value as the starting point, and from 50,000 Monte Carlo season simulations per publication. The pre-season file (md00) was published by the previous model, joint_sot.",
    unavailable: "Could not list the published files.",
    methodology: "How the model works",
    review: "The 2025-26 season reviewed",
    files: "files",
    field: "Field",
    meaning: "What it is",
    file: "File",
    size: "Size",
  },
} as const;

/* ------------------------------------------------ per-file documentation */

type Doc = { pt: string; en: string };

const FILE_DOCS: { match: RegExp; label: string; doc: Doc }[] = [
  {
    match: /^md\d+\.json$/,
    label: "mdNN.json",
    doc: {
      pt: "A previsão publicada depois de uma jornada: classificação simulada com probabilidades de título, top 3 e despromoção (17.º ou 18.º lugar), forças de ataque e defesa, xPts e a classificação real nessa altura.",
      en: "The forecast published after a matchday: simulated standings with title, top-three and relegation (17th or 18th place) probabilities, attack and defence strengths, xPts, and the real table at that moment.",
    },
  },
  {
    match: /^md\d+_scenarios\.json$/,
    label: "mdNN_scenarios.json",
    doc: {
      pt: "Análise condicional da mesma jornada: jogos decisivos, caminhos para o título e para a manutenção, e probabilidades condicionadas a cada resultado. São ficheiros grandes.",
      en: "Conditional analysis for the same matchday: decisive fixtures, paths to the title and to survival, and probabilities conditioned on each result. These files are large.",
    },
  },
  {
    match: /^samples\.json$/,
    label: "samples.json",
    doc: {
      pt: "Épocas completas tiradas à sorte da simulação de Monte Carlo — posição, pontos e diferença de golos de cada equipa em cada época sorteada, mais os quantis de pontos.",
      en: "Complete seasons drawn from the Monte Carlo simulation — position, points and goal difference for every team in each drawn season, plus points quantiles.",
    },
  },
  {
    match: /^players\.json$/,
    label: "players.json",
    doc: {
      pt: "A lista de finalização: golos por 90 minutos acima do nível de substituição (SAR), com intervalo de credibilidade de 90% e a variação face à época anterior. generated_from.seasons diz as épocas usadas.",
      en: "The finishing list: goals per 90 minutes above replacement level (SAR), with a 90% credible interval and the change from last season. generated_from.seasons names the seasons used.",
    },
  },
  {
    match: /^contrib_ratings\.json$/,
    label: "contrib_ratings.json",
    doc: {
      pt: "Contribuição ofensiva: golos mais assistências por 90 acima do substituto, com intervalo e a distribuição da métrica por posição. rank_goals_only e rank_change_vs_goals_only contam posições entre todos os jogadores do modelo, não na lista de finalização publicada; /jogadores compara com essa lista.",
      en: "Attacking contribution: goals plus assists per 90 above replacement, with interval and the metric's distribution by position. rank_goals_only and rank_change_vs_goals_only count places among every player in the model, not in the published finishing list; /jogadores compares against that list.",
    },
  },
  {
    match: /^gk_ratings\.json$/,
    label: "gk_ratings.json",
    doc: {
      pt: "Guarda-redes: golos evitados face ao xGOT dos remates enfrentados, em bruto e modelado, por 90 minutos e com intervalo. Traz também a validação fora da amostra e as regras de exclusão de remates.",
      en: "Goalkeepers: goals prevented against the xGOT of the shots faced, raw and modelled, per 90 minutes and with an interval. Also carries the out-of-sample validation and the shot-exclusion rules.",
    },
  },
  {
    match: /^def_ratings\.json$/,
    label: "def_ratings.json",
    doc: {
      pt: "Defesas: mais-valia ajustada sobre golos sofridos. Pode trazer apenas diagnósticos, se o modelo concluir que os jogadores não são separáveis dos colegas de equipa.",
      en: "Defenders: adjusted plus-minus on goals conceded. May carry diagnostics only, if the model finds the players are not separable from their team-mates.",
    },
  },
  {
    match: /^contested_ratings\.json$/,
    label: "contested_ratings.json",
    doc: {
      pt: "Posse disputada: probabilidade de ganhar duelos aéreos e no chão, defesas e médios, agregada sobre três épocas de carreira. Células que falharam uma porta pré-registada trazem ranking: null.",
      en: "Contested possession: probability of winning aerial and ground duels, defenders and midfielders, pooled over a three-season career. Cells that failed a pre-registered gate carry ranking: null.",
    },
  },
  {
    match: /^gk_channels\.json$/,
    label: "gk_channels.json",
    doc: {
      pt: "Os três eixos de guarda-redes, publicados separados e nunca combinados: intervenção em cruzamentos (separável), saídas da área (estilo) e defesa de remates (nulo com potência adequada em três épocas).",
      en: "The three goalkeeper axes, published separately and never combined: cross intervention (separable), sweeping (a style), and shot-stopping (a properly-powered null over three seasons).",
    },
  },
  {
    match: /^injuries\.json$/,
    label: "injuries.json",
    doc: {
      pt: "Lesionados e suspensos por clube, com motivo, regresso previsto quando conhecido e valor de mercado. Instantâneo com data.",
      en: "Injuries and suspensions by club, with reason, expected return where known, and market value. A dated snapshot.",
    },
  },
  {
    match: /^market_scorecard\.json$/,
    label: "market_scorecard.json",
    doc: {
      pt: "Uma avaliação do modelo contra a linha de fecho do mercado, com o número de jogos e de épocas, o erro padrão emparelhado em cada bloco, as casas de apostas cujas cotações foram usadas (market_sources), a verificação dos intervalos de pontos finais (calibration) e, no campo model, o modelo avaliado (que pode não ser o que publica as previsões).",
      en: "An evaluation of the model against the market's closing line, with the number of matches and seasons, the paired standard error on every block, the bookmakers whose prices were used (market_sources), the final-points interval check (calibration) and, in the model field, the model evaluated (which may not be the one publishing the forecasts).",
    },
  },
  {
    match: /^game_fixtures\.json$/,
    label: "game_fixtures.json",
    doc: {
      pt: "O calendário da época para o jogo Contra o Modelo: cada jogo com hora de início (UTC; kickoff_confirmed diz se já é a oficial), a sua hora de fecho (locks_at), as probabilidades do modelo e quando foram publicadas (published_at; probs_source diz de que ficheiro vieram) e o resultado. No jogo, uma jornada fecha inteira no locks_at mais cedo dos seus jogos. As notas abaixo dizem onde estas regras se afastam do calendário.",
      en: "The season calendar for the Beat the Model game: every fixture with its kickoff (UTC; kickoff_confirmed says whether it is official yet), its lock time (locks_at), the model's probabilities and when they were published (published_at; probs_source names the file they came from) and the result. In the game, a round closes as a whole at the earliest locks_at of its games. The notes below say where these rules part from the calendar.",
    },
  },
  {
    match: /^players_detail\.json$/,
    label: "players_detail.json",
    doc: {
      pt: "O detalhe por jogador por trás das páginas de jogador: histórico época a época e jogos recentes. appearances_through é a data do último jogo incluído. As páginas mostram só os jogadores da lista de players.json, com a posição e os números dessa lista; team é o plantel atual.",
      en: "The per-player detail behind the player pages: season-by-season history and recent matches. appearances_through is the date of the last match included. The pages show only the players in players.json's list, with that list's position and numbers; team is the current squad.",
    },
  },
  {
    match: /^ask\.json$/,
    label: "ask.json",
    doc: {
      pt: "Para perguntas condicionais sobre a época («e se o Porto perder em Braga?»): as probabilidades de cada equipa (título, top 3, Europa, despromoção) e os jogos em aberto cobertos. Ainda sem página própria no site.",
      en: "For conditional questions about the season (“what if Porto lose at Braga?”): each team's probabilities (title, top three, Europe, relegation) and the open fixtures covered. No page of its own on the site yet.",
    },
  },
  {
    match: /^ask_samples\.json$/,
    label: "ask_samples.json",
    doc: {
      pt: "Uma amostra das épocas simuladas, compactada, para responder a essas perguntas: em cada uma, o resultado de cada jogo em aberto e a posição final de cada equipa (a codificação está descrita no próprio ficheiro).",
      en: "A compact sample of the simulated seasons, for answering those questions: in each, the result of every open fixture and every team's final position (the encoding is described in the file itself).",
    },
  },
  {
    match: /^review\.json$/,
    label: "review.json",
    doc: {
      pt: "A revisão de uma época terminada: classificação final, xPts por equipa, a diferença entre pontos e xPts (luck; não é uma separação limpa entre sorte e talento) e a evolução das probabilidades de título e de despromoção ao longo do ano. Em 2025-26, as previsões das jornadas 4 a 22 foram reconstituídas depois, a 4 de março de 2026; o timestamp de cada mdNN.json mostra-o.",
      en: "The review of a finished season: final table, per-team xPts, the gap between points and xPts (luck; not a clean split between luck and skill) and how the title and relegation probabilities moved through the year. In 2025-26, the matchday 4 to 22 forecasts were reconstructed afterwards, on 4 March 2026; each mdNN.json's timestamp shows it.",
    },
  },
];

const MD_FIELDS: { name: string; doc: Doc }[] = [
  {
    name: "table[]",
    doc: {
      pt: "Uma entrada por equipa: mean_pts, std_pts, mean_gd e as probabilidades p_champion, p_top3 e p_relegation (despromoção = terminar em 17.º ou 18.º; o 16.º, que vai ao play-off, não conta). p_champion e p_relegation trazem ainda _lo/_hi: os percentis 3 e 97 da mesma probabilidade calculada em 100 blocos de 500 simulações. É a dispersão de uma estimativa com 500 simulações, cerca de dez vezes a margem de erro de Monte Carlo do número publicado (±0,4 pontos percentuais com 50 000 simulações), e não é a incerteza do modelo. O site não os mostra. p_top3 não tem _lo/_hi.",
      en: "One entry per team: mean_pts, std_pts, mean_gd and the probabilities p_champion, p_top3 and p_relegation (relegation = finishing 17th or 18th; 16th, which goes to the play-off, does not count). p_champion and p_relegation also carry _lo/_hi: the 3rd and 97th percentiles of the same probability computed over 100 blocks of 500 simulations. That is the spread of a 500-simulation estimate, about ten times the Monte Carlo error of the published number (±0.4 percentage points with 50,000 simulations), and it is not the model's uncertainty. The site does not show them. p_top3 has no _lo/_hi.",
    },
  },
  {
    name: "actual_standings[]",
    doc: {
      pt: "A classificação real no momento da previsão: played, points, gf, ga, gd.",
      en: "The real table at forecast time: played, points, gf, ga, gd.",
    },
  },
  {
    name: "xpts_table[]",
    doc: {
      pt: "Pontos esperados a partir do xG de cada jogo: xpts, xgf, xga, played. Não usa os parâmetros do modelo — é uma leitura independente.",
      en: "Expected points from each match's xG: xpts, xgf, xga, played. It does not use the model's parameters — an independent read.",
    },
  },
  {
    name: "team_strengths{}",
    doc: {
      pt: "Ataque e defesa por equipa, em escala logarítmica e centrados em zero. Valores positivos de defense significam pior defesa.",
      en: "Attack and defence per team, on a log scale centred at zero. Positive defence values mean a worse defence.",
    },
  },
  {
    name: "position_probs{}",
    doc: {
      pt: "Por equipa, a probabilidade de terminar em cada posição, do 1.º ao último. Soma 1.",
      en: "Per team, the probability of finishing in each position, first to last. Sums to 1.",
    },
  },
  {
    name: "next_matchday{}",
    doc: {
      pt: "A jornada seguinte com p_home, p_draw e p_away por jogo. Pode incluir jogos adiados de jornadas anteriores.",
      en: "The next matchday with p_home, p_draw and p_away for each fixture. It can include postponed games from earlier matchdays.",
    },
  },
  {
    name: "matchday_results[] / matches_remaining[]",
    doc: {
      pt: "matchday_results: os resultados que entraram desde a publicação anterior, que podem ser de mais do que uma jornada (jogos adiados ou antecipados). matches_remaining: jogos da jornada em curso ainda por disputar quando o ficheiro foi gerado (com kickoff quando conhecido); fica vazio quando a jornada acabou, mesmo que haja jogos adiados. Um mdNN.json não é cortado exatamente na jornada NN: actual_standings diz quantos jogos cada equipa já tinha.",
      en: "matchday_results: the results that came in since the previous publication, which can span more than one matchday (postponed or brought-forward games). matches_remaining: games of the current matchday still to play when the file was generated (with kickoff where known); empty once the matchday is over, even with postponed games outstanding. An mdNN.json is not cut exactly at matchday NN: actual_standings says how many games each team had played.",
    },
  },
  {
    name: "season, matchday, model, n_sims, timestamp",
    doc: {
      pt: "Metadados: que época, que jornada, que modelo, quantas simulações e quando foi gerado (UTC, ISO 8601). Em 2026-27, model é joint_sot (o modelo anterior) na pré-época (md00) e bivcross (o modelo atual, Poisson bivariado com remates à baliza) da jornada 1 em diante; toda a época 2025-26 é joint_sot.",
      en: "Metadata: which season, which matchday, which model, how many simulations, and when it was generated (UTC, ISO 8601). In 2026-27, model is joint_sot (the previous model) for the pre-season file (md00) and bivcross (the current model, bivariate Poisson with shots on target) from matchday 1 on; all of 2025-26 is joint_sot.",
    },
  },
];

/* ---------------------------------------------------------------- helpers */

/** The current season's game manifest, raw (null when absent). */
async function loadGameManifest(): Promise<{ season?: string; matchdays?: ManifestRoundLike[] } | null> {
  try {
    const file = path.join(process.cwd(), "public", "data", "football", "liga-2026-27", "game_fixtures.json");
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Where the game's lock and scoring rules part from the calendar, from the
 * manifest itself (audit M2, F18): a round published after its games began,
 * and a postponed game scored on its original round's forecast.
 */
function gameNotes(rounds: ManifestRoundLike[], locale: string): string[] {
  const pt = locale !== "en";
  const notes: string[] = [];
  for (const l of latePublications(rounds)) {
    notes.push(pt
      ? `Jornada ${l.matchday}: as probabilidades do modelo foram publicadas a ${formatLongDate(l.publishedAt, locale)}, depois de ${l.startedBefore} dos ${l.total} jogos terem começado. Ninguém podia jogar essa jornada, mas ela conta no registo do modelo na classificação da época. A partir da jornada ${l.matchday + 1}, as probabilidades são publicadas antes do primeiro jogo.`
      : `Matchday ${l.matchday}: the model's probabilities were published on ${formatLongDate(l.publishedAt, locale)}, after ${l.startedBefore} of its ${l.total} games had started. Nobody could play that round, but it counts in the model's record in the season table. From matchday ${l.matchday + 1} on, the probabilities are published before the first game.`);
  }
  for (const e of earlyLocks(rounds)) {
    notes.push(pt
      ? `${teamDisplayName(e.home)}–${teamDisplayName(e.away)} (jornada ${e.matchday}) foi adiado para ${formatKickoff(e.kickoff, locale)}, mas fechou com a sua jornada, a ${formatLongDate(e.locksAt, locale)}: é avaliado com as probabilidades que o modelo publicou para essa jornada.`
      : `${teamDisplayName(e.home)}–${teamDisplayName(e.away)} (matchday ${e.matchday}) was postponed to ${formatKickoff(e.kickoff, locale)}, but it closed with its round, on ${formatLongDate(e.locksAt, locale)}: it is scored on the probabilities the model published for that round.`);
  }
  return notes;
}

function docFor(name: string) {
  return FILE_DOCS.find(d => d.match.test(name));
}

function formatBytes(bytes: number, pt: boolean) {
  const loc = pt ? "pt-PT" : "en-GB";
  if (bytes >= 1024 * 1024)
    return `${new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
  return `${new Intl.NumberFormat(loc).format(Math.round(bytes / 1024))} KB`;
}

/** Collapse repeated patterns (28 matchday files) into one documented row. */
function groupFiles(files: PublishedFile[]) {
  const groups = new Map<
    string,
    { label: string; doc: Doc | null; names: string[]; bytes: number }
  >();

  for (const f of files) {
    const d = docFor(f.name);
    const key = d?.label ?? f.name;
    const existing = groups.get(key);
    if (existing) {
      existing.names.push(f.name);
      existing.bytes += f.bytes;
    } else {
      groups.set(key, {
        label: key,
        doc: d?.doc ?? null,
        names: [f.name],
        bytes: f.bytes,
      });
    }
  }
  return [...groups.values()];
}

/* ------------------------------------------------------------------- page */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = locale === "en" ? copy.en : copy.pt;
  return createPageMetadata({
    locale,
    path: `/desporto/liga/dados`,
    title: siteTitle(c.title),
    description: c.description,
  });
}

export default async function LigaDataPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== "en";
  const c = pt ? copy.pt : copy.en;
  const [seasons, manifest]: [PublishedSeason[], Awaited<ReturnType<typeof loadGameManifest>>] = await Promise.all([
    loadPublishedFootballData(),
    loadGameManifest(),
  ]);
  const notes = gameNotes(manifest?.matchdays ?? [], locale);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        width="5xl"
        compact
        back={{ href: "/desporto/liga", label: c.back, locale }}
        eyebrow={c.kicker}
        title={c.title}
        lede={c.standfirstA}
      />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <p className="max-w-3xl mb-10 text-base text-stone-700 leading-relaxed">
          {c.standfirstB}
        </p>

        {/* Published files */}
        <section className="mb-14">
          <h2 className="text-2xl tracking-tight mb-1">{c.filesTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.filesIntro}</p>

          {seasons.length === 0 ? (
            <p className="text-sm text-stone-500">{c.unavailable}</p>
          ) : (
            seasons.map(season => {
              const groups = groupFiles(season.files);
              return (
                <div key={season.season} className="mb-10">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="text-base text-stone-900">
                      {pt ? "Época" : "Season"} {season.season}
                    </h3>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      {season.current ? c.currentSeason : c.archived}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mb-4 font-mono break-all">
                    {SITE}
                    {season.basePath}/
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-300">
                          <th
                            scope="col"
                            className="text-[11px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left w-52"
                          >
                            {c.file}
                          </th>
                          <th
                            scope="col"
                            className="text-[11px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left"
                          >
                            {c.meaning}
                          </th>
                          <th
                            scope="col"
                            className="text-[11px] font-bold uppercase tracking-wider text-stone-400 py-2 text-right w-20"
                          >
                            {c.size}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map(g => {
                          const sample = g.names[g.names.length - 1];
                          return (
                            <tr key={g.label} className="border-b border-stone-100 align-top">
                              <td className="py-3 pr-3">
                                <a
                                  href={`${season.basePath}/${sample}`}
                                  className="font-mono text-xs text-ink underline underline-offset-4 break-all"
                                >
                                  {g.label}
                                </a>
                                {g.names.length > 1 && (
                                  <div className="text-[11px] text-stone-400 mt-0.5">
                                    {g.names.length} {c.files} ({g.names[0]} …{" "}
                                    {g.names[g.names.length - 1]})
                                  </div>
                                )}
                              </td>
                              <td className="py-3 pr-3 text-stone-600 leading-relaxed">
                                {g.doc ? (pt ? g.doc.pt : g.doc.en) : "—"}
                              </td>
                              <td className="py-3 text-right tabular-nums text-stone-400 text-xs whitespace-nowrap">
                                {formatBytes(g.bytes, pt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Schema */}
        <section className="mb-14">
          <h2 className="text-2xl tracking-tight mb-1">{c.schemaTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.schemaIntro}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-300">
                  <th
                    scope="col"
                    className="text-[11px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left w-64"
                  >
                    {c.field}
                  </th>
                  <th
                    scope="col"
                    className="text-[11px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left"
                  >
                    {c.meaning}
                  </th>
                </tr>
              </thead>
              <tbody>
                {MD_FIELDS.map(f => (
                  <tr key={f.name} className="border-b border-stone-100 align-top">
                    <td className="py-3 pr-3 font-mono text-xs text-stone-800 break-all">
                      {f.name}
                    </td>
                    <td className="py-3 text-stone-600 leading-relaxed">
                      {pt ? f.doc.pt : f.doc.en}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Game manifest notes */}
        {notes.length > 0 && (
          <section className="mb-14" aria-labelledby="notas-jogo">
            <h2 id="notas-jogo" className="text-2xl tracking-tight mb-1">
              {pt ? "Notas sobre o jogo Contra o Modelo" : "Notes on the Beat the Model game"}
            </h2>
            <p className="text-sm text-stone-500 mb-4 max-w-3xl">
              {pt
                ? "Lidas do próprio game_fixtures.json: onde as regras de fecho e de avaliação se afastam do calendário."
                : "Read from game_fixtures.json itself: where the lock and scoring rules part from the calendar."}
            </p>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
              {notes.map((n) => <li key={n.slice(0, 40)}>{n}</li>)}
            </ul>
          </section>
        )}

        {/* Usage */}
        <section className="mb-14">
          <h2 className="text-2xl tracking-tight mb-1">{c.usageTitle}</h2>
          <p className="text-sm text-stone-500 mb-4 max-w-3xl">{c.usageIntro}</p>
          <pre className="bg-stone-900 text-stone-100 text-xs overflow-x-auto p-4 leading-relaxed">
            <code>{pt
              ? `# um ficheiro de jornada (o mais recente é o NN mais alto)
curl -s ${SITE}/data/football/liga-2026-27/md01.json | jq '.table[0]'

# a classificação final e a diferença pontos − xPts de 2025-26
curl -s ${SITE}/data/football/liga-2025-26/review.json | jq '.luck[:3]'`
              : `# one matchday file (the latest is the highest NN)
curl -s ${SITE}/data/football/liga-2026-27/md01.json | jq '.table[0]'

# the 2025-26 final table and the points − xPts gap
curl -s ${SITE}/data/football/liga-2025-26/review.json | jq '.luck[:3]'`}</code>
          </pre>
        </section>

        {/* Licence + provenance */}
        <section className="pt-8 border-t border-stone-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
            {c.licenceTitle}
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed max-w-3xl">{c.licence}</p>

          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3 mt-8">
            {c.provenanceTitle}
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed max-w-3xl">
            {c.provenance}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/desporto/liga/metodologia"
              locale={locale}
              className="text-sm font-medium text-ink underline underline-offset-4 inline-flex items-center gap-1 group"
            >
              {c.methodology}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/desporto/liga/2025-26"
              locale={locale}
              className="text-sm font-medium text-ink underline underline-offset-4 inline-flex items-center gap-1 group"
            >
              {c.review}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
