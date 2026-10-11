import { Link } from "@/i18n/routing";
import { Disclosure } from "@/components/viz/Disclosure";
import { formatPercent } from "@/lib/football-format";
import { CONFIDENCE_WEIGHT } from "@/lib/utils/prediction-game";

function listOfRounds(rounds: number[], pt: boolean): string {
  if (rounds.length === 1) return `${rounds[0]}`;
  return `${rounds.slice(0, -1).join(", ")} ${pt ? "e" : "and"} ${rounds[rounds.length - 1]}`;
}

/**
 * The rule of the game, in a few sentences, behind one "Como se conta".
 * Server-rendered and a native <details>, so it reads without JavaScript.
 * The weights are the game's own (CONFIDENCE_WEIGHT), not typed here.
 */
export function HowItCounts({ locale, frozenRounds }: { locale: string; frozenRounds: number[] }) {
  const pt = locale !== "en";
  const { leve, media, alta } = CONFIDENCE_WEIGHT;
  const pct = (p: number) => formatPercent(p, locale);
  const linkClass = "font-semibold text-ink underline underline-offset-4";
  const frozen = frozenRounds.length > 0 ? listOfRounds(frozenRounds, pt) : null;

  return (
    <Disclosure summary={pt ? "Como se conta" : "How it counts"}>
      <div className="max-w-3xl space-y-3 pb-2 pt-1 text-[15px] leading-relaxed text-ink">
        {pt ? (
          <>
            <p>
              Em cada jogo escolhes um resultado: vitória da casa, empate ou vitória de fora. A escolha vale {pct(media)} para esse
              resultado, ou {pct(leve)} e {pct(alta)} se disseres que tens pouca ou muita certeza; o resto divide-se pelos outros dois.
            </p>
            <p>
              O modelo tem as suas percentagens para cada jogo, congeladas quando a jornada abriu. Aqui só aparecem depois de a
              jornada fechar, no primeiro jogo; até lá estão na{" "}
              <Link href="/desporto/liga" locale={locale} className={linkClass}>página da Liga Portugal</Link>.
            </p>
            <p>
              Depois de cada jogo vemos quem ficou mais perto do que aconteceu, com a medida com que{" "}
              <Link href="/desporto/liga/modelo" locale={locale} className={linkClass}>avaliamos o modelo</Link> (o Ranked
              Probability Score). Pesa sobretudo a percentagem dada ao resultado, mas também onde ficou o resto: quando ganha a
              equipa de fora, ter escolhido o empate custa menos do que ter escolhido a vitória da casa.
            </p>
            <p>
              Ganhas a jornada se ficares mais perto em mais jogos do que o modelo. Só contam os jogos que escolheste, e na época
              só contam as jornadas com todos os jogos disputados.
            </p>
            {frozen && (
              <p className="text-[14px] text-graphite">
                As percentagens do modelo {frozenRounds.length > 1 ? "das jornadas" : "da jornada"} {frozen} foram congeladas antes
                do fim da jornada anterior, sem os resultados que faltavam; contam tal como foram congeladas.
              </p>
            )}
          </>
        ) : (
          <>
            <p>
              For each game you pick a result: a home win, a draw or an away win. Your pick gives that result {pct(media)}, or{" "}
              {pct(leve)} and {pct(alta)} if you say you are a little or very sure; the rest is split between the other two.
            </p>
            <p>
              The model has its own percentages for each game, frozen when the matchday opened. They appear here only once the
              matchday closes, at its first game; until then they are on the{" "}
              <Link href="/desporto/liga" locale={locale} className={linkClass}>Liga Portugal page</Link>.
            </p>
            <p>
              After each game we see whose forecast came closer to what happened, with the measure we{" "}
              <Link href="/desporto/liga/modelo" locale={locale} className={linkClass}>grade the model</Link> by (the Ranked
              Probability Score). What weighs most is the percentage given to the result, but where the rest went counts too: when
              the away side wins, having picked the draw costs less than having picked the home win.
            </p>
            <p>
              You win the matchday if you were closer than the model in more games than it was. Only the games you picked count,
              and over the season only matchdays whose games have all been played count.
            </p>
            {frozen && (
              <p className="text-[14px] text-graphite">
                The model&rsquo;s percentages for {frozenRounds.length > 1 ? "matchdays" : "matchday"} {frozen} were frozen before
                the previous matchday ended, without the results still to come; they count as frozen.
              </p>
            )}
          </>
        )}
      </div>
    </Disclosure>
  );
}
