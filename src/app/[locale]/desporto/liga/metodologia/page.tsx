import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { loadLigaData } from "@/lib/utils/football-data-loader";
import { formatInteger } from "@/lib/football-format";
import type { Metadata } from "next";
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return createPageMetadata({
    locale,
    path: `/desporto/liga/metodologia`,
    title: t("football.methodologyTitle"),
    description: t("football.methodologyDescription"),
  });
}

// Describes the production model, x_bivcross (estimador-football
// docs/MODEL-REVIEW-2026-09.md, "The production model in one paragraph").
// When the model changes, this page, the match-page footnote and /dados
// change with it.
export default async function LigaMethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const isPt = locale === "pt";
  const { prediction } = await loadLigaData();
  const sims = formatInteger(prediction?.n_sims ?? 50000, locale);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <PageHero
          width="3xl"
          back={{ href: "/desporto/liga", label: t("football.title"), locale }}
          eyebrow={isPt ? "Metodologia" : "Methodology"}
          title={t("football.methodologyTitle")}
          lede={t("football.methodologySubtitle")}
        />

        <div className="max-w-3xl mx-auto px-4 py-10">
          <article className="article-body max-w-none">
            <h2>{isPt ? "Como funciona o modelo?" : "How does the model work?"}</h2>
            <p>
              {isPt
                ? "O modelo estima, para cada clube, uma força de ataque e uma força de defesa. Ajusta-as a dois sinais de cada jogo: os golos marcados e sofridos, modelados em conjunto (um Poisson bivariado, que permite que os golos das duas equipas no mesmo jogo não sejam independentes), e os remates à baliza, que dizem mais sobre o domínio de um jogo do que um resultado de 1-0."
                : "The model estimates an attacking and a defensive strength for each club. It fits them to two signals from every match: goals scored and conceded, modelled jointly (a bivariate Poisson, which lets the two teams' goals in the same match be related), and shots on target, which say more about who dominated a match than a 1-0 scoreline does."}
            </p>
            <p>
              {isPt
                ? "Os dados são as últimas quatro épocas da Primeira Liga e da Liga 2, juntas, para que os clubes promovidos cheguem com historial. Cada jogo pesa menos quanto mais antigo é: um jogo de há cerca de 23 meses vale metade de um de hoje. O ponto de partida de cada clube é o valor do seu plantel (Transfermarkt), medido época a época, para que os resultados antigos sejam lidos contra o plantel que o clube tinha nessa altura."
                : "The data is the last four seasons of the Primeira Liga and Liga 2, together, so promoted clubs arrive with a record. Each match counts for less the older it is: a match from about 23 months ago is worth half of one played today. Each club's starting point is its squad value (Transfermarkt), measured season by season, so old results are read against the squad the club had at the time."}
            </p>
            <p>
              {isPt
                ? "O modelo é reajustado de raiz em cada atualização, com todos os jogos disputados até essa altura."
                : "The model is refitted from scratch at every update, with every match played so far."}
            </p>

            <h2>{isPt ? "Que modelo publica as previsões?" : "Which model publishes the forecasts?"}</h2>
            <p>
              {isPt
                ? "Desde a jornada 1 de 2026-27 (agosto de 2026), as previsões vêm do modelo bivcross descrito acima. A previsão de pré-época (md00) foi publicada pelo modelo anterior, joint_sot. Cada ficheiro de previsão diz no campo model qual foi o modelo que o produziu, e a avaliação contra o mercado diz qual avaliou."
                : "Since matchday 1 of 2026-27 (August 2026), the forecasts come from the bivcross model described above. The pre-season forecast (md00) was published by the previous model, joint_sot. Every forecast file says in its model field which model produced it, and the evaluation against the market says which one it evaluated."}
            </p>

            <h2>{isPt ? "As simulações" : "The simulations"}</h2>
            <p>
              {isPt
                ? `Com as forças estimadas, simulamos todos os jogos que faltam, ${sims} vezes. Cada simulação começa por sortear forças plausíveis para cada clube, dentro da incerteza do modelo, e depois os golos de cada jogo, com a vantagem de jogar em casa. Cada simulação produz uma classificação final completa.`
                : `With the strengths estimated, we simulate every remaining match ${sims} times. Each simulation first draws plausible strengths for every club, within the model's uncertainty, and then the goals of each match, with home advantage. Each simulation produces a complete final table.`}
            </p>
            <p>
              {isPt
                ? "As probabilidades que apresentamos vêm diretamente destas simulações. Se o Porto termina em primeiro lugar em 51% das simulações, dizemos que tem 51% de probabilidade de ser campeão: é a contagem de quantas vezes cada resultado acontece."
                : "The probabilities we show come directly from these simulations. If Porto finishes first in 51% of simulations, we say they have a 51% chance of winning the title: it is a count of how often each outcome happens."}
            </p>

            <h2>{isPt ? "Jogos decisivos" : "Decisive matches"}</h2>
            <p>
              {isPt
                ? "Para medir o peso de cada jogo, fixamos o resultado (vitória da casa, empate ou vitória de fora) e simulamos o resto da época. Comparamos a probabilidade de título em cada cenário. Os jogos em que a diferença entre o melhor e o pior cenário é maior são os mais decisivos."
                : "To measure the weight of each match, we fix the result (home win, draw or away win) and simulate the rest of the season. We compare the title probability in each scenario. The matches where the gap between the best and worst case is largest are the most decisive."}
            </p>

            <h2>{isPt ? "Jogos-chave por equipa" : "Key matches per team"}</h2>
            <p>
              {isPt
                ? "Para cada equipa com aspirações ao título ou em risco de descida, comparamos duas coisas em cada jogo que lhe falta: com que frequência o vence em todas as simulações, e com que frequência o vence nas simulações em que atinge o objetivo. Quanto maior a diferença, mais essencial é vencer esse jogo."
                : "For each team chasing the title or at risk of relegation, we compare two things for each match it has left: how often it wins that match across all simulations, and how often it wins it in the simulations where it reaches its goal. The bigger the gap, the more essential that win is."}
            </p>

            <h2>{isPt ? "O que fica de fora?" : "What is left out?"}</h2>
            <p>
              {isPt
                ? "O modelo dá a cada clube uma força fixa para o resto da época e não usa:"
                : "The model gives each club one fixed strength for the rest of the season and does not use:"}
            </p>
            <ul>
              <li>{isPt ? "transferências de janeiro e outras mudanças no plantel a meio da época;" : "January transfers and other mid-season squad changes;"}</li>
              <li>{isPt ? "lesões, castigos e onzes iniciais;" : "injuries, suspensions and starting line-ups;"}</li>
              <li>{isPt ? "fadiga de calendário e motivação;" : "fixture congestion and motivation;"}</li>
              <li>{isPt ? "mudanças de treinador." : "managerial changes."}</li>
            </ul>
            <p>
              {isPt
                ? "As previsões são atualizadas depois de cada jornada. Como o modelo se compara com o mercado de apostas está em "
                : "Forecasts are updated after every matchday. How the model compares with the betting market is on "}
              <Link href="/desporto/liga/modelo" locale={locale} className="text-ink underline underline-offset-4">
                {isPt ? "modelo vs mercado" : "model vs market"}
              </Link>
              {isPt ? ", e os ficheiros estão em " : ", and the files are on "}
              <Link href="/desporto/liga/dados" locale={locale} className="text-ink underline underline-offset-4">
                {isPt ? "dados abertos" : "open data"}
              </Link>
              .
            </p>
          </article>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
