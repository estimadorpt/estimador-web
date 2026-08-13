import { Header } from "@/components/Header";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { loadPublishedFootballData } from "@/lib/utils/football-data-loader";
import type { PublishedFile, PublishedSeason } from "@/lib/utils/football-data-loader";
import type { Metadata } from "next";

const SITE = "https://estimador.pt";

/* ------------------------------------------------------------------- copy */

const copy = {
  pt: {
    title: "Dados abertos — Liga Portugal",
    description:
      "Todas as previsões da Liga Portugal publicadas em estimador.pt estão disponíveis como JSON estático, sem chave nem registo. Esta página documenta cada ficheiro e os seus campos principais.",
    back: "Liga Portugal",
    kicker: "Dados abertos",
    standfirstA:
      "Tudo o que aparece nas páginas da Liga Portugal vem de ficheiros JSON estáticos servidos deste site. Não há API a proteger, chave a pedir nem limite de pedidos: são ficheiros, e estão aqui.",
    standfirstB:
      "Se construir alguma coisa com eles, use-os à vontade — só pedimos atribuição a estimador.pt e uma ligação para a página de origem. E se publicar, diga-nos: gostamos de ver.",
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
      "Resultados e estatísticas de jogo (incluindo xG) da SofaScore; cotações de fecho da Pinnacle via football-data.co.uk; lesões e valores de mercado do Transfermarkt. As probabilidades vêm de um modelo hierárquico bayesiano de Poisson ajustado com PyMC e de 50 mil simulações de Monte Carlo por publicação.",
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
    title: "Open data — Liga Portugal",
    description:
      "Every Liga Portugal forecast published on estimador.pt is available as static JSON, with no key and no sign-up. This page documents each file and its main fields.",
    back: "Liga Portugal",
    kicker: "Open data",
    standfirstA:
      "Everything on the Liga Portugal pages comes from static JSON files served from this site. There is no API to protect, no key to request and no rate limit: they are files, and they are here.",
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
      "Results and match statistics (xG included) from SofaScore; Pinnacle closing odds via football-data.co.uk; injuries and market values from Transfermarkt. The probabilities come from a hierarchical Bayesian Poisson model fitted with PyMC and 50,000 Monte Carlo season simulations per publication.",
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
      pt: "A previsão de uma jornada: classificação simulada com probabilidades de título, top 3 e descida, forças de ataque e defesa, xPts e a classificação real nessa altura.",
      en: "One matchday's forecast: simulated standings with title, top-three and relegation probabilities, attack and defence strengths, xPts, and the real table at that moment.",
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
      pt: "Ranking de jogadores pelo Soccer Factor Model: golos acima do nível de substituto por 90 minutos, com intervalo de credibilidade e a variação face à época anterior.",
      en: "Player ranking from the Soccer Factor Model: goals above replacement per 90 minutes, with a credible interval and the change from last season.",
    },
  },
  {
    match: /^contrib_ratings\.json$/,
    label: "contrib_ratings.json",
    doc: {
      pt: "Contribuição ofensiva: golos mais assistências por 90 acima do substituto, com intervalo, a variação face ao ranking só de golos e a distribuição da métrica por posição.",
      en: "Attacking contribution: goals plus assists per 90 above replacement, with interval, the move against the goals-only ranking, and the metric's distribution by position.",
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
      pt: "A avaliação do modelo contra a linha de fecho da Pinnacle em 504 jogos e oito épocas, com erro padrão emparelhado em cada bloco.",
      en: "The model evaluated against Pinnacle's closing line over 504 matches and eight seasons, with the paired standard error on every block.",
    },
  },
  {
    match: /^cards\.json$/,
    label: "cards.json",
    doc: {
      pt: "Manifesto dos cartões de partilha da jornada: que imagens existem, para que jornada e como se chamam.",
      en: "Manifest for the matchday share cards: which images exist, for which matchday, and what they are called.",
    },
  },
  {
    match: /^review\.json$/,
    label: "review.json",
    doc: {
      pt: "A revisão de uma época terminada: classificação final, xPts por equipa, índice de sorte e a evolução das probabilidades que o modelo publicou durante o ano.",
      en: "The review of a finished season: final table, per-team xPts, luck index, and how the probabilities the model published moved through the year.",
    },
  },
];

const MD_FIELDS: { name: string; doc: Doc }[] = [
  {
    name: "table[]",
    doc: {
      pt: "Uma entrada por equipa: mean_pts, std_pts, mean_gd e as probabilidades p_champion, p_top3, p_relegation, cada uma com intervalo _lo/_hi (erro de Monte Carlo).",
      en: "One entry per team: mean_pts, std_pts, mean_gd and the probabilities p_champion, p_top3, p_relegation, each with a _lo/_hi interval (Monte Carlo error).",
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
      pt: "A jornada seguinte com p_home, p_draw e p_away por jogo.",
      en: "The next matchday with p_home, p_draw and p_away for each fixture.",
    },
  },
  {
    name: "matchday_results[] / matches_remaining[]",
    doc: {
      pt: "Jogos já disputados da jornada em curso, e os que ainda faltam (com kickoff quando conhecido).",
      en: "Matches already played in the current matchday, and those still to come (with kickoff where known).",
    },
  },
  {
    name: "season, matchday, model, n_sims, timestamp",
    doc: {
      pt: "Metadados: que época, que jornada, que modelo, quantas simulações e quando foi gerado (UTC, ISO 8601).",
      en: "Metadata: which season, which matchday, which model, how many simulations, and when it was generated (UTC, ISO 8601).",
    },
  },
];

/* ---------------------------------------------------------------- helpers */

function docFor(name: string) {
  return FILE_DOCS.find(d => d.match.test(name));
}

function formatBytes(bytes: number, pt: boolean) {
  const loc = pt ? "pt-PT" : "en-GB";
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toLocaleString(loc, { maximumFractionDigits: 1 })} MB`;
  return `${Math.round(bytes / 1024).toLocaleString(loc)} KB`;
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
  const c = locale === "en" ? copy.en : copy.pt;
  return {
    title: `${c.title} | Estimador`,
    description: c.description,
    openGraph: { title: c.title, description: c.description, type: "article" },
    alternates: { canonical: `${SITE}/${locale}/desporto/liga/dados` },
  };
}

export default async function LigaDataPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pt = locale !== "en";
  const c = pt ? copy.pt : copy.en;
  const seasons: PublishedSeason[] = await loadPublishedFootballData();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href="/desporto/liga"
          locale={locale}
          className="text-sm text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {c.back}
        </Link>

        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
          {c.kicker}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{c.title}</h1>
        <div className="max-w-3xl space-y-4 mb-10">
          <p className="text-lg text-stone-600 leading-relaxed">{c.standfirstA}</p>
          <p className="text-lg text-stone-800 leading-relaxed font-medium">
            {c.standfirstB}
          </p>
        </div>

        {/* Published files */}
        <section className="mb-14">
          <h2 className="text-xl font-bold tracking-tight mb-1">{c.filesTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.filesIntro}</p>

          {seasons.length === 0 ? (
            <p className="text-sm text-stone-500">{c.unavailable}</p>
          ) : (
            seasons.map(season => {
              const groups = groupFiles(season.files);
              return (
                <div key={season.season} className="mb-10">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="text-base font-bold text-stone-900">
                      {pt ? "Época" : "Season"} {season.season}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
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
                            className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left w-52"
                          >
                            {c.file}
                          </th>
                          <th
                            scope="col"
                            className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left"
                          >
                            {c.meaning}
                          </th>
                          <th
                            scope="col"
                            className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2 text-right w-20"
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
                                  className="font-mono text-xs text-blue-700 hover:text-blue-800 break-all"
                                >
                                  {g.label}
                                </a>
                                {g.names.length > 1 && (
                                  <div className="text-[10px] text-stone-400 mt-0.5">
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
          <h2 className="text-xl font-bold tracking-tight mb-1">{c.schemaTitle}</h2>
          <p className="text-sm text-stone-500 mb-6 max-w-3xl">{c.schemaIntro}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-300">
                  <th
                    scope="col"
                    className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left w-64"
                  >
                    {c.field}
                  </th>
                  <th
                    scope="col"
                    className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left"
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

        {/* Usage */}
        <section className="mb-14">
          <h2 className="text-xl font-bold tracking-tight mb-1">{c.usageTitle}</h2>
          <p className="text-sm text-stone-500 mb-4 max-w-3xl">{c.usageIntro}</p>
          <pre className="bg-stone-900 text-stone-100 text-xs overflow-x-auto p-4 leading-relaxed">
            <code>{pt
              ? `# um ficheiro de jornada (o mais recente é o NN mais alto)
curl -s ${SITE}/data/football/liga-2026-27/md01.json | jq '.table[0]'

# a classificação final e o índice de sorte de 2025-26
curl -s ${SITE}/data/football/liga-2025-26/review.json | jq '.luck[:3]'`
              : `# one matchday file (the latest is the highest NN)
curl -s ${SITE}/data/football/liga-2026-27/md01.json | jq '.table[0]'

# the 2025-26 final table and luck index
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
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {c.methodology}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/desporto/liga/2025-26"
              locale={locale}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
            >
              {c.review}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
