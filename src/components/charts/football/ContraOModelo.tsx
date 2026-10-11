"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Action } from "@/components/brand/Action";
import { CHOICE_GROUP_CLASS, ChoiceCheck, choiceClass } from "@/components/brand/Choice";
import { EmptyStateMark } from "@/components/brand/EmptyStateMark";
import { ChannelHead } from "@/components/instrument/ChannelHead";
import { NowGlyph } from "@/components/instrument/glyphs";
import { Disclosure } from "@/components/viz/Disclosure";
import { BRAND } from "@/lib/brand";
import { teamDisplayName, teamWithArticle } from "@/lib/config/football";
import { formatDateSpan, formatKickoffShort, formatPercent, intlLocale, matchLabel } from "@/lib/football-format";
import {
  CONFIDENCE_LEVELS,
  DEFAULT_CONFIDENCE,
  OUTCOMES,
  awaitingResults,
  clearPicks,
  findOpenRound,
  forgetRetiredKeys,
  loadPicks,
  normalizeProbs,
  outcomeIndex,
  pickedOutcome,
  playedByClock,
  probsFromPick,
  roundLockState,
  savePicks,
  tallySeason,
  toPercents,
  withPublishedResults,
  type Confidence,
  type GameFixture,
  type GameVerdict,
  type Outcome,
  type PickMap,
  type PredictionGameData,
  type RoundTally,
  type SeasonTally,
  type StoredPick,
} from "@/lib/utils/prediction-game";

/**
 * Contra o Modelo: the reader picks the result of each game of the open
 * round, and once the games are played the page says, game by game, whether
 * their forecast or the model's was closer to what happened, and in how many
 * games of the round they were closer.
 *
 * No account and no server: the picks live in this browser only
 * (STORAGE_KEY), and the results come from the site's own published
 * game_fixtures.json, baked into the page at build time and re-read from the
 * same published file when a game the reader picked has been played since
 * the build (a tab left open, a page restored from the cache).
 *
 * The server HTML is the round open when the page was built, unpicked, so
 * the page does not grow on hydration (audit SEO3-01); the reader's picks,
 * their results and the clock fill in after mount.
 */

type Locale = "pt" | "en";

interface ContraOModeloProps {
  data: PredictionGameData;
  locale: Locale;
  /** The build's clock (ms): what the server HTML shows. */
  builtAt: number;
  /** The published game_fixtures.json, re-read only for results played since the build. */
  manifestUrl: string;
}

/** At most one re-read of the published results per this long. */
const REFETCH_MS = 10 * 60 * 1000;

const PLURAL = (n: number, one: string, many: string) => (n === 1 ? one : many);

const COPY = {
  pt: {
    matchday: (md: number) => `Jornada ${md}`,
    picked: (n: number, total: number) => `${n} de ${total} ${PLURAL(n, "escolhido", "escolhidos")}`,
    wins: " ganha",
    draw: "Empate",
    certainty: "Certeza",
    confidence: { leve: "Pouca", media: "Bastante", alta: "Muita" } as Record<Confidence, string>,
    readout: (parts: string[]) => `A tua previsão: ${parts.join(", ")}.`,
    drawWord: "empate",
    allPicked: (n: number, when: string | null) =>
      `As tuas ${n} escolhas estão guardadas neste navegador. Podes mudá-las até ao primeiro jogo${when ? ` (${when})` : ""}; os resultados aparecem aqui depois dos jogos.`,
    noOpenTitle: "Próxima jornada",
    noOpen: "Não há jornada aberta neste momento. A próxima abre quando publicarmos a nova previsão, depois dos jogos.",
    storage: "As tuas escolhas ficam só neste navegador: não as recebemos nem as guardamos noutro lado. Noutro dispositivo, ou depois de limpares os dados do navegador, começas do zero.",
    notStored: "Este navegador não deixa guardar as escolhas: ficam só enquanto a página estiver aberta.",
    reset: "Limpar as minhas escolhas",
    resetConfirm: "Apagar todas as tuas escolhas desta época neste navegador?",
    closerIn: (c: number, n: number) => `mais perto do que o modelo em ${c} de ${n} ${PLURAL(n, "jogo", "jogos")}`,
    levelIn: (l: number) => `, igual em ${l}`,
    soFar: "até agora, ",
    waiting: (p: number, total: number) => `escolheste ${p} de ${total} ${PLURAL(total, "jogo", "jogos")}.`,
    toPlay: (list: string) => `Por jogar: ${list}.`,
    toPlayMany: (n: number, last: string) => `Por jogar: ${n} jogos, o último ${last}.`,
    toCome: (list: string) => `À espera do resultado: ${list}.`,
    toComeMany: (n: number) => `À espera do resultado: ${n} jogos.`,
    season: (won: number, done: number, level: number) =>
      `Ganhaste ao modelo em ${won} de ${done} ${PLURAL(done, "jornada completa", "jornadas completas")}${level ? `; empataste ${level}` : ""}.`,
    gameByGame: "Ver jogo a jogo",
    earlier: "As tuas jornadas anteriores",
    keyResult: "o que aconteceu",
    keyPick: "a tua escolha",
    picked1: (pick: string, pct: number) => `Escolheste ${pick}, ${pct}%.`,
    pickName: (o: Outcome, f: GameFixture) => (o === "D" ? "o empate" : teamWithArticle(o === "H" ? f.home : f.away, "o")),
    result: (o: Outcome, f: GameFixture) => (o === "D" ? "Empate" : `Ganhou ${teamWithArticle(o === "H" ? f.home : f.away, "o")}`),
    onResult: (user: number, model: string) => `davas-lhe ${user}%, o modelo ${model}.`,
    modelOnResult: (model: string) => `o modelo dava-lhe ${model}.`,
    modelOnPick: (model: string) => `O modelo dava-lhe ${model}.`,
    notPicked: "Não escolheste este jogo.",
    verdict: {
      closer: "Ficaste mais perto",
      model: "O modelo ficou mais perto",
      level: "Igual ao modelo",
      unpicked: "Não conta",
      played: "Jogado · resultado por publicar",
      toPlay: (when: string) => (when ? `Por jogar · ${when}` : "Por jogar"),
    },
    share: (md: number, c: number, n: number) => `Contra o Modelo, jornada ${md}: mais perto do que o modelo em ${c} de ${n} ${PLURAL(n, "jogo", "jogos")}.`,
    copy: "Copiar",
    copyWhat: " o resultado e o link",
    copied: "Copiado.",
    copyFailed: "Não foi possível copiar: seleciona o texto acima.",
  },
  en: {
    matchday: (md: number) => `Matchday ${md}`,
    picked: (n: number, total: number) => `${n} of ${total} picked`,
    wins: " to win",
    draw: "Draw",
    certainty: "How sure",
    confidence: { leve: "A little", media: "Fairly", alta: "Very" } as Record<Confidence, string>,
    readout: (parts: string[]) => `Your forecast: ${parts.join(", ")}.`,
    drawWord: "draw",
    allPicked: (n: number, when: string | null) =>
      `Your ${n} picks are saved in this browser. You can change them until the first game${when ? ` (${when})` : ""}; the results appear here after the games.`,
    noOpenTitle: "Next matchday",
    noOpen: "No matchday is open right now. The next one opens when we publish the new forecast, after the games.",
    storage: "Your picks stay in this browser only: we never receive them or keep them anywhere else. On another device, or once you clear your browser data, you start from scratch.",
    notStored: "This browser does not let the page save your picks: they last only while the page is open.",
    reset: "Clear my picks",
    resetConfirm: "Delete all your picks for this season from this browser?",
    closerIn: (c: number, n: number) => `closer than the model in ${c} of ${n} ${PLURAL(n, "game", "games")}`,
    levelIn: (l: number) => `, level in ${l}`,
    soFar: "so far, ",
    waiting: (p: number, total: number) => `you picked ${p} of ${total} ${PLURAL(total, "game", "games")}.`,
    toPlay: (list: string) => `Still to play: ${list}.`,
    toPlayMany: (n: number, last: string) => `Still to play: ${n} games, the last ${last}.`,
    toCome: (list: string) => `Result to come: ${list}.`,
    toComeMany: (n: number) => `Result to come: ${n} games.`,
    season: (won: number, done: number, level: number) =>
      `You beat the model in ${won} of ${done} completed ${PLURAL(done, "matchday", "matchdays")}${level ? `; ${level} level` : ""}.`,
    gameByGame: "See game by game",
    earlier: "Your earlier matchdays",
    keyResult: "what happened",
    keyPick: "your pick",
    picked1: (pick: string, pct: number) => `You picked ${pick}, ${pct}%.`,
    pickName: (o: Outcome, f: GameFixture) => (o === "D" ? "the draw" : teamDisplayName(o === "H" ? f.home : f.away)),
    result: (o: Outcome, f: GameFixture) => (o === "D" ? "Draw" : `${teamDisplayName(o === "H" ? f.home : f.away)} won`),
    onResult: (user: number, model: string) => `you gave it ${user}%, the model ${model}.`,
    modelOnResult: (model: string) => `the model gave it ${model}.`,
    modelOnPick: (model: string) => `The model gave it ${model}.`,
    notPicked: "You did not pick this game.",
    verdict: {
      closer: "You were closer",
      model: "The model was closer",
      level: "Level with the model",
      unpicked: "Not counted",
      played: "Played · result to come",
      toPlay: (when: string) => (when ? `To play · ${when}` : "To play"),
    },
    share: (md: number, c: number, n: number) => `Beat the Model, matchday ${md}: closer than the model in ${c} of ${n} ${PLURAL(n, "game", "games")}.`,
    copy: "Copy",
    copyWhat: " the result and the link",
    copied: "Copied.",
    copyFailed: "That did not work: select the text above.",
  },
};

type Copy = (typeof COPY)[Locale];

/** The reader's own pick: drawn hollow, as every guess on the site is. */
function GuessGlyph() {
  return (
    <svg className="inline-block shrink-0 align-[-3px]" width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" focusable="false">
      <rect x="1.5" y="3.5" width="7" height="7" fill="none" stroke={BRAND.ink} strokeWidth="1.25" />
    </svg>
  );
}

const shortName = (team: string) => teamDisplayName(team);

function listOf(items: string[], locale: Locale): string {
  return new Intl.ListFormat(intlLocale(locale), { type: "conjunction" }).format(items);
}

/**
 * "Mais perto do que o modelo em 5 de 9 jogos." and its in-progress and
 * waiting forms; lower case to follow "Jornada 7: ", capitalised to stand alone.
 */
function roundFinding(tally: RoundTally, total: number, t: Copy, { capital = false } = {}): string {
  const body =
    tally.scored === 0
      ? t.waiting(tally.picked, total)
      : `${tally.complete ? "" : t.soFar}${t.closerIn(tally.closer, tally.scored)}${tally.level ? t.levelIn(tally.level) : ""}.`;
  return capital ? body.charAt(0).toUpperCase() + body.slice(1) : body;
}

export function ContraOModelo({ data, locale, builtAt, manifestUrl }: ContraOModeloProps) {
  const t = COPY[locale];

  // Static export: the HTML has no picks and the build's clock. Everything
  // that reads localStorage or the real clock waits for mount.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(builtAt);
  const [picks, setPicks] = useState<PickMap>({});
  // The page's rounds, plus any result published since the build.
  const [game, setGame] = useState(data);
  const [stored, setStored] = useState(true);
  const dirty = useRef(false);
  const lastFetch = useRef(0);

  useEffect(() => {
    forgetRetiredKeys();
    setPicks(loadPicks(data.season));
    setNow(Date.now());
    setMounted(true);
    const tick = () => setNow(Date.now());
    // Re-read the clock so a lock, or a game's end, turns without a reload.
    const id = window.setInterval(tick, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [data.season]);

  // Save after the reader changes something (never on the first read).
  useEffect(() => {
    if (!dirty.current) return;
    setStored(savePicks(data.season, picks));
  }, [picks, data.season]);

  // A game the reader picked has been played since this page was built:
  // re-read the published game_fixtures.json (same origin, revalidated) for
  // its result. Nothing else is taken from it.
  useEffect(() => {
    if (!mounted || !awaitingResults(game, picks, now)) return;
    if (lastFetch.current && now - lastFetch.current < REFETCH_MS) return;
    lastFetch.current = now;
    fetch(manifestUrl, { cache: "no-cache" })
      .then(response => (response.ok ? response.json() : null))
      .then(manifest => setGame(current => withPublishedResults(current, manifest)))
      .catch(() => undefined);
  }, [mounted, game, picks, now, manifestUrl]);

  const choose = useCallback((fixture: GameFixture, outcome: Outcome) => {
    dirty.current = true;
    setPicks(prev => {
      const conf = prev[fixture.key]?.conf ?? DEFAULT_CONFIDENCE;
      return { ...prev, [fixture.key]: { p: probsFromPick(outcome, conf), pick: outcome, conf } };
    });
  }, []);

  const setCertainty = useCallback((fixture: GameFixture, conf: Confidence) => {
    dirty.current = true;
    setPicks(prev => {
      const current = prev[fixture.key];
      if (!current) return prev;
      const outcome = pickedOutcome(current);
      return { ...prev, [fixture.key]: { p: probsFromPick(outcome, conf), pick: outcome, conf } };
    });
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== "undefined" && !window.confirm(t.resetConfirm)) return;
    dirty.current = false;
    clearPicks();
    setPicks({});
  }, [t]);

  const clock = mounted ? now : builtAt;
  const openRound = useMemo(() => findOpenRound(game, clock), [game, clock]);
  const season = useMemo(() => tallySeason(game, picks), [game, picks]);

  // Rounds the reader picked in that have closed, newest first: the latest
  // leads the page, the others wait below the open round.
  const closed = useMemo(
    () =>
      season.rounds
        .filter(r => {
          const round = game.rounds.find(x => x.matchday === r.matchday);
          return round !== undefined && roundLockState(round, clock).locked;
        })
        .sort((a, b) => b.matchday - a.matchday),
    [season.rounds, game.rounds, clock],
  );
  const [latest, ...earlier] = closed;
  const hasPicks = Object.keys(picks).length > 0;

  return (
    <div className="space-y-12">
      {latest && (
        <LatestRound tally={latest} season={season} game={game} clock={clock} locale={locale} t={t} />
      )}

      {openRound ? (
        <OpenRound
          round={openRound.fixtures}
          matchday={openRound.matchday}
          lockAt={roundLockState(openRound, clock).lockAt}
          picks={picks}
          onChoose={choose}
          onCertainty={setCertainty}
          locale={locale}
          t={t}
        />
      ) : (
        <section aria-labelledby="cm-aberta" className="max-w-3xl">
          <ChannelHead id="cm-aberta" title={t.noOpenTitle} />
          <div className="mt-4 flex items-start gap-4">
            <EmptyStateMark className="mt-1" />
            <p className="text-[15px] leading-relaxed text-ink">{t.noOpen}</p>
          </div>
        </section>
      )}

      {earlier.length > 0 && (
        <section aria-labelledby="cm-anteriores" className="max-w-3xl">
          <ChannelHead id="cm-anteriores" title={t.earlier} />
          <ul>
            {earlier.map(tally => {
              const fixtures = game.rounds.find(r => r.matchday === tally.matchday)?.fixtures ?? [];
              return (
                <li key={tally.matchday} className="border-b border-rule py-1">
                  <Disclosure summary={`${t.matchday(tally.matchday)}: ${roundFinding(tally, fixtures.length, t)}`}>
                    <div className="space-y-4 pb-4 pt-1 text-[15px] leading-relaxed">
                      <Remaining tally={tally} clock={clock} locale={locale} t={t} />
                      <GameList games={tally.games} clock={clock} locale={locale} t={t} />
                      {tally.complete && tally.scored > 0 && <ShareRound tally={tally} locale={locale} t={t} />}
                    </div>
                  </Disclosure>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="max-w-3xl space-y-2 border-t border-rule pt-4 noscript:hidden">
        <p className="text-[13px] leading-relaxed text-graphite">{t.storage}</p>
        {!stored && <p className="text-[13px] font-semibold text-ink">{t.notStored}</p>}
        {hasPicks && (
          <Action variant="text" onClick={reset}>
            {t.reset}
          </Action>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ open round */

function OpenRound({
  round,
  matchday,
  lockAt,
  picks,
  onChoose,
  onCertainty,
  locale,
  t,
}: {
  round: GameFixture[];
  matchday: number;
  lockAt: number | null;
  picks: PickMap;
  onChoose: (fixture: GameFixture, outcome: Outcome) => void;
  onCertainty: (fixture: GameFixture, conf: Confidence) => void;
  locale: Locale;
  t: Copy;
}) {
  const pickedCount = round.filter(f => picks[f.key]).length;
  const allPicked = round.length > 0 && pickedCount === round.length;
  const when = lockAt !== null ? formatKickoffShort(new Date(lockAt).toISOString(), locale) : null;

  return (
    <section aria-labelledby="cm-aberta">
      <ChannelHead
        id="cm-aberta"
        title={t.matchday(matchday)}
        className="max-w-5xl"
        aside={
          <span role="status" className="tabular-nums noscript:hidden">
            {t.picked(pickedCount, round.length)}
          </span>
        }
      />
      {/* Two games to a row from lg: nine games in one column left half the
          screen empty and the page twice as tall (UXD3-10). */}
      <ul className="grid max-w-5xl gap-x-10 lg:grid-cols-2">
        {round.map(fixture => (
          <li key={fixture.key} className="border-b border-rule pb-4 pt-3">
            <GamePicker
              fixture={fixture}
              stored={picks[fixture.key] ?? null}
              onChoose={onChoose}
              onCertainty={onCertainty}
              locale={locale}
              t={t}
            />
          </li>
        ))}
      </ul>
      {allPicked && (
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink">{t.allPicked(pickedCount, when)}</p>
      )}
    </section>
  );
}

function GamePicker({
  fixture,
  stored,
  onChoose,
  onCertainty,
  locale,
  t,
}: {
  fixture: GameFixture;
  stored: StoredPick | null;
  onChoose: (fixture: GameFixture, outcome: Outcome) => void;
  onCertainty: (fixture: GameFixture, conf: Confidence) => void;
  locale: Locale;
  t: Copy;
}) {
  const id = `cm-${fixture.key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  const name = matchLabel(shortName(fixture.home), shortName(fixture.away));
  const picked = stored ? pickedOutcome(stored) : null;
  const pct = stored ? toPercents(normalizeProbs(stored.p)) : null;
  const confirmed = fixture.kickoffConfirmed !== false;
  const when = formatKickoffShort(fixture.kickoff, locale, { confirmed });
  const label = (o: Outcome) => (o === "D" ? t.draw : shortName(o === "H" ? fixture.home : fixture.away));
  const readoutWord = (o: Outcome) => (o === "D" ? t.drawWord : shortName(o === "H" ? fixture.home : fixture.away));

  return (
    <div role="group" aria-labelledby={`${id}-name`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 id={`${id}-name`} className="name-cut text-[16px] leading-6">{name}</h3>
        {when && (
          <p className="text-[12.5px] text-graphite">
            {when}
            {!confirmed && (locale === "pt" ? " · horário por confirmar" : " · kickoff to be confirmed")}
          </p>
        )}
      </div>

      <div className={`mt-2 ${CHOICE_GROUP_CLASS} noscript:hidden`}>
        {OUTCOMES.map(o => (
          <button
            key={o}
            type="button"
            aria-pressed={picked === o}
            onClick={() => onChoose(fixture, o)}
            className={choiceClass(picked === o, "min-w-0 flex-1 basis-0 text-center")}
          >
            {picked === o && <ChoiceCheck />}
            <span className="min-w-0">{label(o)}</span>
            {o !== "D" && <span className="sr-only">{t.wins}</span>}
          </button>
        ))}
      </div>

      {/* How sure: optional, already set to the middle step, so it sits
          beside its label at its own width, under the pick it qualifies. */}
      {stored && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 noscript:hidden" role="group" aria-label={`${t.certainty}: ${name}`}>
          <span aria-hidden="true" className="text-[12.5px] text-graphite">{t.certainty}</span>
          <div className={CHOICE_GROUP_CLASS}>
            {CONFIDENCE_LEVELS.map(c => {
              const on = (stored.conf ?? null) === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onCertainty(fixture, c)}
                  className={choiceClass(on)}
                >
                  {on && <ChoiceCheck />}
                  {t.confidence[c]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* The readout, beside the control that sets it; on the page from load. */}
      <p aria-live="polite" className="mt-2 text-[13px] leading-5 text-graphite noscript:hidden">
        {picked && pct ? t.readout(OUTCOMES.map((o, i) => `${readoutWord(o)} ${pct[i]}%`)) : ""}
      </p>
    </div>
  );
}

/* --------------------------------------------------------- closed rounds */

function LatestRound({
  tally,
  season,
  game,
  clock,
  locale,
  t,
}: {
  tally: RoundTally;
  season: SeasonTally;
  game: PredictionGameData;
  clock: number;
  locale: Locale;
  t: Copy;
}) {
  const fixtures = game.rounds.find(r => r.matchday === tally.matchday)?.fixtures ?? [];
  const span = formatDateSpan(fixtures.map(f => f.kickoff), locale);
  const headingId = `cm-jornada-${tally.matchday}`;

  return (
    <section aria-labelledby={headingId} className="max-w-3xl">
      <ChannelHead id={headingId} title={t.matchday(tally.matchday)} aside={span || undefined} />
      <p className="disp mt-3 text-[24px] leading-tight text-ink md:text-[28px]">{roundFinding(tally, fixtures.length, t, { capital: true })}</p>
      <div className="mt-2 space-y-1 text-[15px] leading-relaxed text-ink">
        <Remaining tally={tally} clock={clock} locale={locale} t={t} />
        {season.completed > 0 && <p>{t.season(season.won, season.completed, season.level)}</p>}
      </div>
      {tally.complete && tally.scored > 0 && (
        <div className="mt-4">
          <ShareRound tally={tally} locale={locale} t={t} />
        </div>
      )}
      <Disclosure summary={t.gameByGame} className="mt-3">
        <div className="pb-2 pt-1">
          <GameList games={tally.games} clock={clock} locale={locale} t={t} />
        </div>
      </Disclosure>
    </section>
  );
}

/** Up to this many games are named; more are counted ("8 jogos, o último …"). */
const NAMED_GAMES = 3;

/** Which of the round's games have no result yet: still to play, or played and waiting. */
function Remaining({ tally, clock, locale, t }: { tally: RoundTally; clock: number; locale: Locale; t: Copy }) {
  if (tally.remaining.length === 0) return null;
  const name = (f: GameFixture) => matchLabel(shortName(f.home), shortName(f.away));
  const when = (f: GameFixture) => formatKickoffShort(f.kickoff, locale, { confirmed: f.kickoffConfirmed !== false });
  const toPlay = tally.remaining.filter(f => !playedByClock(f, clock));
  const toCome = tally.remaining.filter(f => playedByClock(f, clock));
  const last = [...toPlay].sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? "")).at(-1);
  const playLine =
    toPlay.length > NAMED_GAMES && last
      ? t.toPlayMany(toPlay.length, when(last))
      : t.toPlay(listOf(toPlay.map(f => (when(f) ? `${name(f)} (${when(f)})` : name(f))), locale));
  const comeLine = toCome.length > NAMED_GAMES ? t.toComeMany(toCome.length) : t.toCome(listOf(toCome.map(name), locale));
  return (
    <p>
      {toPlay.length > 0 && playLine}
      {toPlay.length > 0 && toCome.length > 0 && " "}
      {toCome.length > 0 && comeLine}
    </p>
  );
}

function GameList({ games, clock, locale, t }: { games: GameVerdict[]; clock: number; locale: Locale; t: Copy }) {
  return (
    <div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 pb-2 text-[12.5px] text-graphite">
        <span className="inline-flex items-center gap-1.5"><NowGlyph />{t.keyResult}</span>
        <span className="inline-flex items-center gap-1.5"><GuessGlyph />{t.keyPick}</span>
      </p>
      <ul>
        {games.map(g => (
          <li key={g.fixture.key} className="border-t border-grid py-2.5">
            <GameLine verdict={g} clock={clock} locale={locale} t={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function GameLine({ verdict, clock, locale, t }: { verdict: GameVerdict; clock: number; locale: Locale; t: Copy }) {
  const f = verdict.fixture;
  const home = shortName(f.home);
  const away = shortName(f.away);
  const title = f.result ? `${home} ${f.result.homeGoals}–${f.result.awayGoals} ${away}` : matchLabel(home, away);
  const userPct = verdict.user ? toPercents(verdict.user) : null;
  const pick = verdict.pick;

  let word: string;
  switch (verdict.status) {
    case "closer": word = t.verdict.closer; break;
    case "model": word = t.verdict.model; break;
    case "level": word = t.verdict.level; break;
    case "unpicked": word = t.verdict.unpicked; break;
    default:
      word = playedByClock(f, clock)
        ? t.verdict.played
        : t.verdict.toPlay(formatKickoffShort(f.kickoff, locale, { confirmed: f.kickoffConfirmed !== false }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="name-cut text-[15px] leading-6">{title}</p>
        <p className={`text-[13px] text-ink ${verdict.status === "closer" ? "font-semibold" : ""}`}>{word}</p>
      </div>
      <p className="text-[13px] leading-5 text-graphite">
        {pick && userPct && (
          <span className="mr-2 inline">
            <GuessGlyph /> {t.picked1(t.pickName(pick, f), userPct[outcomeIndex(pick)])}
            {!f.result && <> {t.modelOnPick(formatPercent(f.model[outcomeIndex(pick)], locale))}</>}
          </span>
        )}
        {f.result && (
          <span className="mr-2 inline">
            <NowGlyph /> {t.result(f.result.outcome, f)}:{" "}
            {userPct
              ? t.onResult(userPct[outcomeIndex(f.result.outcome)], formatPercent(f.model[outcomeIndex(f.result.outcome)], locale))
              : t.modelOnResult(formatPercent(f.model[outcomeIndex(f.result.outcome)], locale))}
          </span>
        )}
        {!verdict.user && <span className="inline">{t.notPicked}</span>}
      </p>
    </div>
  );
}

function ShareRound({ tally, locale, t }: { tally: RoundTally; locale: Locale; t: Copy }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://estimador.pt";
  const text = `${t.share(tally.matchday, tally.closer, tally.scored)} ${origin}/${locale}/desporto/liga/jogo-previsoes/`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2400);
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="space-y-2">
      <p className="select-all break-words border-l-2 border-rule pl-3 text-[13px] leading-5 text-graphite">{text}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Action variant="secondary" onClick={() => void copy()}>
          {t.copy}
          <span className="sr-only">{t.copyWhat}</span>
        </Action>
        <span role="status" className="text-[13px] text-graphite">
          {state === "copied" ? t.copied : state === "failed" ? t.copyFailed : ""}
        </span>
      </div>
    </div>
  );
}
