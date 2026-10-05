import { formatClubPercent, type ClubOutlookEntry, type Locale } from './club-outlook';

/**
 * The three-outcome stakes card: one club's relevant season objective, its
 * dated baseline and what each result of its supported fixture would change
 * it to. Shared verbatim between the homepage football module and the club
 * page (diagnosis §4/§5 — "a stronger answer format exists in the product
 * and should be promoted/reused, not rebuilt"). Callers render their own
 * headline ("X: o que muda contra Y?") above this; this component owns only
 * the objective/status line, the four figures and the conditional-vs-match
 * disclaimer.
 */
export function FixtureStakes({ locale, entry }: { locale: Locale; entry: ClubOutlookEntry }) {
  const pt = locale === 'pt';

  if (!entry.objective || entry.baseline == null) {
    return (
      <p className="text-sm leading-relaxed text-stone-600">
        {pt
          ? `Nenhuma das probabilidades de época (título, top 3, despromoção) chega a 1% para ${entry.label} nesta previsão.`
          : `None of the season probabilities (title, top 3, relegation) reach 1% for ${entry.label} in this forecast.`}
      </p>
    );
  }

  const stakesReady = entry.hasFixture && entry.win != null && entry.draw != null && entry.loss != null;

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
        <span>{entry.objectiveLabel}</span>
        {entry.fixtureStatusLabel && (
          <span className="font-medium normal-case tracking-normal text-stone-400">· {entry.fixtureStatusLabel}</span>
        )}
      </p>

      {stakesReady ? (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Agora' : 'Now'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.baseline, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Se ganhar' : 'If it wins'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.win as number, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Se empatar' : 'If it draws'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.draw as number, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">{pt ? 'Se perder' : 'If it loses'}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatClubPercent(entry.loss as number, locale)}</dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-stone-500">
            {pt
              ? 'Hipóteses de fim de época condicionadas ao resultado deste jogo — não é a probabilidade desse resultado.'
              : "End-of-season chances conditional on this match's result — not the chance of that result itself."}
            {entry.matchWinProbability != null && (
              <>
                {' '}
                {pt
                  ? `Probabilidade de ${entry.label} vencer este jogo`
                  : `Probability of ${entry.label} winning this match`}
                : <strong className="font-semibold text-stone-600">{formatClubPercent(entry.matchWinProbability, locale)}</strong>.
              </>
            )}
          </p>
        </>
      ) : entry.hasFixture ? (
        <p className="text-sm leading-relaxed text-stone-600">
          {pt
            ? `Agora ${formatClubPercent(entry.baseline, locale)}. Este conjunto não publica o efeito deste jogo em ${entry.objectiveLabel}.`
            : `Now ${formatClubPercent(entry.baseline, locale)}. This bundle does not publish this match's effect on ${entry.objectiveLabel}.`}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-stone-600">
          {pt
            ? `Agora ${formatClubPercent(entry.baseline, locale)}. O conjunto publicado não inclui um jogo em aberto para ${entry.label}.`
            : `Now ${formatClubPercent(entry.baseline, locale)}. The published bundle includes no outstanding match for ${entry.label}.`}
        </p>
      )}
    </div>
  );
}
