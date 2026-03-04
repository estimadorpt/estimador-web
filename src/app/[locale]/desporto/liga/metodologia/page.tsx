import { Header } from "@/components/Header";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("football.methodologyTitle"),
    description: t("football.methodologyDescription"),
    alternates: {
      canonical: `https://estimador.pt/${locale}/desporto/liga/metodologia`,
    },
  };
}

export default async function LigaMethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const isPt = locale === "pt";

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/desporto/liga"
          locale={locale}
          className="text-sm text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("football.title")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {t("football.methodologyTitle")}
        </h1>
        <p className="text-stone-500 mb-8">
          {t("football.methodologySubtitle")}
        </p>

        <div className="prose prose-stone max-w-none prose-headings:tracking-tight prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-p:text-stone-600 prose-p:leading-relaxed prose-li:text-stone-600">
          <h2>{isPt ? "Como funciona" : "How it works"}</h2>
          <p>
            {isPt
              ? "O nosso modelo estima a força ofensiva e defensiva de cada equipa da Liga Portugal. Para isso, combina os resultados observados ao longo da época com uma estimativa inicial baseada no valor do plantel (dados TransferMarkt). Equipas com plantéis mais valiosos têm um ponto de partida mais forte, mas os resultados em campo rapidamente ajustam estas estimativas."
              : "Our model estimates the offensive and defensive strength of every Liga Portugal team. It does this by combining match results from the current season with an initial estimate based on squad value (TransferMarkt data). Teams with more valuable squads start with a stronger baseline, but on-pitch results quickly adjust these estimates."}
          </p>

          <h2>{isPt ? "As simulações" : "The simulations"}</h2>
          <p>
            {isPt
              ? "Depois de estimar a força de cada equipa, simulamos todos os jogos restantes da época — milhares de vezes. Em cada simulação, os golos de cada equipa são gerados aleatoriamente com base na sua força ofensiva, na capacidade defensiva do adversário e na vantagem de jogar em casa. Cada simulação produz uma classificação final completa."
              : "After estimating each team's strength, we simulate every remaining match of the season — thousands of times. In each simulation, goals are randomly generated based on the team's offensive strength, the opponent's defensive ability, and home advantage. Each simulation produces a complete final table."}
          </p>
          <p>
            {isPt
              ? "As probabilidades que apresentamos vêm diretamente destas simulações. Se o Porto termina em primeiro lugar em 66% das simulações, dizemos que tem 66% de probabilidade de ser campeão. Não há fórmulas mágicas — apenas a contagem de quantas vezes cada resultado ocorre."
              : "The probabilities we show come directly from these simulations. If Porto finishes first in 66% of simulations, we say they have a 66% chance of winning the title. There are no magic formulas — just counting how often each outcome occurs."}
          </p>

          <h2>{isPt ? "Jogos decisivos" : "Decisive matches"}</h2>
          <p>
            {isPt
              ? "Para calcular o impacto de cada jogo, fixamos o resultado (vitória casa, empate ou vitória fora) e simulamos o resto da época. Comparamos a probabilidade de título em cada cenário. Os jogos onde a diferença entre o melhor e o pior cenário é maior são os mais decisivos — são aqueles cujo resultado mais altera a corrida pelo título."
              : "To calculate the impact of each match, we fix the result (home win, draw, or away win) and simulate the rest of the season. We compare the championship probability in each scenario. The matches where the gap between best and worst case is largest are the most decisive — their result most changes the title race."}
          </p>

          <h2>{isPt ? "Jogos-chave por equipa" : "Key matches per team"}</h2>
          <p>
            {isPt
              ? "Para cada equipa com aspirações ao título ou em risco de despromoção, analisamos os seus jogos restantes e comparamos duas coisas: com que frequência vencem cada jogo em todas as simulações, e com que frequência vencem esse mesmo jogo nos cenários em que atingem o seu objetivo. Quanto maior a diferença, mais essencial é vencer esse jogo."
              : "For each team with title aspirations or at risk of relegation, we look at their remaining matches and compare two things: how often they win each match across all simulations, and how often they win that same match in the simulations where they reach their goal. The bigger the gap, the more essential it is to win that match."}
          </p>
          <p>
            {isPt
              ? "Por exemplo, se o Benfica vence o Sporting em 23% de todas as simulações, mas em 72% das simulações em que acaba campeão — isso significa que vencer o Sporting é quase uma condição obrigatória para o título."
              : "For example, if Benfica beats Sporting in 23% of all simulations, but in 72% of simulations where they win the league — that means beating Sporting is nearly a prerequisite for the title."}
          </p>

          <h2>{isPt ? "Limitações" : "Limitations"}</h2>
          <p>
            {isPt
              ? "Nenhum modelo é perfeito. O nosso assume que a força das equipas se mantém relativamente constante ao longo da época e não tem em conta fatores como:"
              : "No model is perfect. Ours assumes team strength stays relatively constant throughout the season and doesn't account for factors like:"}
          </p>
          <ul className="list-disc pl-5">
            <li>
              {isPt
                ? "Transferências de janeiro e alterações no plantel"
                : "January transfers and squad changes"}
            </li>
            <li>
              {isPt
                ? "Lesões e suspensões de jogadores importantes"
                : "Injuries and suspensions of key players"}
            </li>
            <li>
              {isPt
                ? "Fadiga de calendário e motivação competitiva"
                : "Schedule fatigue and competitive motivation"}
            </li>
            <li>
              {isPt
                ? "Mudanças de treinador durante a época"
                : "Managerial changes during the season"}
            </li>
          </ul>
          <p>
            {isPt
              ? "As previsões são atualizadas após cada jornada, incorporando os novos resultados. Quanto mais jogos disputados, mais precisas tendem a ser as estimativas."
              : "Forecasts are updated after each matchday, incorporating new results. The more matches played, the more accurate the estimates tend to become."}
          </p>
        </div>
      </div>
    </div>
  );
}
