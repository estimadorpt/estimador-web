import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Header } from "@/components/Header";
import { Link } from "@/i18n/routing";
import {
  loadFixtureBySlug,
  loadLigaData,
  loadLigaHistorical,
  loadLigaInjuries,
  loadLigaPlayers,
  loadUpcomingFixtures,
  NO_FIXTURES_SLUG,
} from "@/lib/utils/football-data-loader";
import { ligaTeamColors, teamDisplayName, ligaTeamSlugs } from "@/lib/config/football";
import { MatchProbabilityHero } from "@/components/charts/football/MatchProbabilityHero";
import { MatchOutcomeImpact } from "@/components/charts/football/MatchOutcomeImpact";
import { MatchTeamCompare } from "@/components/charts/football/MatchTeamCompare";
import type {
  FormEntry,
  MatchTeamPanel,
} from "@/components/charts/football/MatchTeamCompare";
import { MatchSquadNews } from "@/components/charts/football/MatchSquadNews";
import type { MatchSquadSide } from "@/components/charts/football/MatchSquadNews";
import type { LigaHistorical, LigaPrediction } from "@/types/football";

const SITE = "https://estimador.pt";

/* ------------------------------------------------------------- static params */

export async function generateStaticParams() {
  const fixtures = await loadUpcomingFixtures();
  // Static export rejects a dynamic route with zero params, so a placeholder
  // page stands in whenever the feed publishes no fixtures at all.
  if (fixtures.length === 0) return [{ slug: NO_FIXTURES_SLUG }];
  return fixtures.map(f => ({ slug: f.slug }));
}

/* ------------------------------------------------------------------ metadata */

// Same versioned OG asset the root layout uses; no per-fixture image pipeline.
function ogImageFilename(locale: string): string {
  try {
    const manifestPath = path.join(process.cwd(), "public", "og-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return manifest.files?.[locale] || `og-image-${locale}.png`;
  } catch {
    return `og-image-${locale}.png`;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const fixture = await loadFixtureBySlug(slug);
  if (!fixture) {
    const pt = locale !== "en";
    return {
      title: pt ? "Sem jogos publicados" : "No fixtures published",
      robots: { index: false, follow: true },
    };
  }

  const pt = locale !== "en";
  const home = teamDisplayName(fixture.home);
  const away = teamDisplayName(fixture.away);
  const title = pt
    ? `${home} x ${away}: probabilidades e cenários`
    : `${home} vs ${away}: probabilities and scenarios`;

  const probLine =
    fixture.p_home != null && fixture.p_draw != null && fixture.p_away != null
      ? pt
        ? `${home} ${Math.round(fixture.p_home * 100)}%, empate ${Math.round(
            fixture.p_draw * 100,
          )}%, ${away} ${Math.round(fixture.p_away * 100)}%.`
        : `${home} ${Math.round(fixture.p_home * 100)}%, draw ${Math.round(
            fixture.p_draw * 100,
          )}%, ${away} ${Math.round(fixture.p_away * 100)}%.`
      : "";

  const description = pt
    ? `Previsão do modelo para ${home}-${away}, jornada ${fixture.matchday} da Liga Portugal. ${probLine} O que cada resultado muda no título, na Europa e na descida.`.trim()
    : `Model forecast for ${home}-${away}, matchday ${fixture.matchday} of Liga Portugal. ${probLine} What each result changes for the title, Europe and relegation.`.trim();

  const url = `${SITE}/${locale}/desporto/liga/jogo/${slug}`;
  const image = `${SITE}/${ogImageFilename(locale)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "estimador.pt",
      locale,
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/* --------------------------------------------------------------- form helper */

function formFor(
  team: string,
  historical: LigaHistorical,
  latest: LigaPrediction | null,
  limit = 5,
): FormEntry[] {
  const seen = new Set<number>();
  const sources: LigaPrediction[] = [];
  for (const md of historical ?? []) {
    if (md && !seen.has(md.matchday)) {
      seen.add(md.matchday);
      sources.push(md);
    }
  }
  if (latest && !seen.has(latest.matchday)) sources.push(latest);

  const entries: FormEntry[] = [];
  for (const md of sources) {
    for (const r of md.matchday_results ?? []) {
      if (r.home !== team && r.away !== team) continue;
      const isHome = r.home === team;
      const gf = isHome ? r.home_goals : r.away_goals;
      const ga = isHome ? r.away_goals : r.home_goals;
      if (typeof gf !== "number" || typeof ga !== "number") continue;
      entries.push({
        matchday: md.matchday,
        opponent: isHome ? r.away : r.home,
        venue: isHome ? "H" : "A",
        gf,
        ga,
        result: gf > ga ? "W" : gf === ga ? "D" : "L",
      });
    }
  }
  entries.sort((a, b) => a.matchday - b.matchday);
  return entries.slice(-limit).reverse();
}

/* -------------------------------------------------------------------- page */

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pt = locale !== "en";

  const [fixture, { prediction, scenarios }, historical, injuries, players, fixtures] =
    await Promise.all([
      loadFixtureBySlug(slug),
      loadLigaData(),
      loadLigaHistorical(),
      loadLigaInjuries(),
      loadLigaPlayers(),
      loadUpcomingFixtures(),
    ]);

  if (!fixture) {
    if (slug !== NO_FIXTURES_SLUG) notFound();
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20">
          <p className="text-stone-500 mb-4">
            {pt
              ? "Não há jogos publicados de momento."
              : "There are no published fixtures right now."}
          </p>
          <Link
            href="/desporto/liga"
            locale={locale}
            className="text-sm text-stone-700 hover:text-stone-900 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Liga Portugal
          </Link>
        </div>
      </div>
    );
  }

  const { home, away } = fixture;
  const homeColor = ligaTeamColors[home] ?? "#78716c";
  const awayColor = ligaTeamColors[away] ?? "#57534e";

  const L = {
    back: pt ? "Liga Portugal" : "Liga Portugal",
    live: pt ? "Jornada em curso" : "Matchday in progress",
    otherMatches: pt ? "Outros jogos" : "Other fixtures",
    teamPage: pt ? "Página da equipa" : "Team page",
    noData: pt ? "Dados indisponíveis." : "Data not available.",
    method: pt
      ? "Probabilidades de um modelo bayesiano hierárquico de Poisson, a partir de 50 mil simulações da época."
      : "Probabilities from a hierarchical Bayesian Poisson model, over 50k simulated seasons.",
    methodLink: pt ? "Como funciona o modelo" : "How the model works",
  };

  // Strength ranks across the league (attack high = better, defense low = better)
  const strengths = prediction?.team_strengths;
  const attackRank: Record<string, number> = {};
  const defenseRank: Record<string, number> = {};
  let totalTeams = 0;
  if (strengths) {
    const all = Object.entries(strengths);
    totalTeams = all.length;
    [...all]
      .sort(([, a], [, b]) => b.attack - a.attack)
      .forEach(([t], i) => (attackRank[t] = i + 1));
    [...all]
      .sort(([, a], [, b]) => a.defense - b.defense)
      .forEach(([t], i) => (defenseRank[t] = i + 1));
  }

  const panelFor = (team: string, venue: "H" | "A"): MatchTeamPanel => ({
    team,
    color: venue === "H" ? homeColor : awayColor,
    venue,
    standing: prediction?.actual_standings?.find(s => s.team === team),
    strength: strengths?.[team],
    attackRank: attackRank[team],
    defenseRank: defenseRank[team],
    totalTeams,
    xpts: prediction?.xpts_table?.find(x => x.team === team),
    form: formFor(team, historical, prediction),
  });

  const injuriesFor = (team: string) =>
    (injuries?.players ?? [])
      .filter(p => p.team === team)
      .sort((a, b) => (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0));

  const playersFor = (team: string) =>
    (players?.players ?? [])
      .filter(p => p.team === team)
      .sort((a, b) => b.sar - a.sar)
      .slice(0, 4);

  const squadSide = (team: string, color: string): MatchSquadSide => ({
    team,
    color,
    injuries: injuriesFor(team),
    injurySummary: injuries?.teams?.find(t => t.team === team),
    topPlayers: playersFor(team),
  });

  const unavailable = new Set(
    (injuries?.players ?? [])
      .filter(p => p.team === home || p.team === away)
      .map(p => p.player),
  );

  const otherFixtures = fixtures.filter(f => f.slug !== fixture.slug).slice(0, 8);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
          <div className="flex items-center gap-3 mb-5">
            <Link
              href="/desporto/liga"
              locale={locale}
              className="text-stone-400 hover:text-stone-700 text-xs font-medium uppercase tracking-wider inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {L.back}
            </Link>
            {fixture.inProgressMatchday && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5">
                {L.live}
              </span>
            )}
          </div>

          <MatchProbabilityHero
            home={home}
            away={away}
            homeColor={homeColor}
            awayColor={awayColor}
            pHome={fixture.p_home}
            pDraw={fixture.p_draw}
            pAway={fixture.p_away}
            matchday={fixture.matchday}
            kickoff={fixture.kickoff}
            locale={locale}
            played={fixture.played}
          />
        </div>
      </section>

      {/* What each result would do */}
      <section className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <MatchOutcomeImpact
            home={home}
            away={away}
            homeColor={homeColor}
            awayColor={awayColor}
            locale={locale}
            scenario={fixture.scenario}
            baseline={scenarios?.next_matchday_scenarios?.baseline ?? null}
            homeStanding={prediction?.table?.find(t => t.team === home)}
            awayStanding={prediction?.table?.find(t => t.team === away)}
            decisive={fixture.decisive}
          />
        </div>
      </section>

      {/* Form, strength, xPts */}
      <section className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <MatchTeamCompare
            home={panelFor(home, "H")}
            away={panelFor(away, "A")}
            locale={locale}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {[home, away].map(team =>
              ligaTeamSlugs[team] ? (
                <Link
                  key={team}
                  href={`/desporto/liga/${ligaTeamSlugs[team]}`}
                  locale={locale}
                  className="text-xs font-medium text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                >
                  {L.teamPage}: {teamDisplayName(team)}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : null,
            )}
          </div>
        </div>
      </section>

      {/* Squads */}
      {(injuries || players) && (
        <section className="border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <MatchSquadNews
              home={squadSide(home, homeColor)}
              away={squadSide(away, awayColor)}
              locale={locale}
              unavailable={unavailable}
              snapshotDate={injuries?.snapshot_date ?? null}
              metricLabel={players?.metric_label}
            />
          </div>
        </section>
      )}

      {/* Other fixtures */}
      {otherFixtures.length > 0 && (
        <section className="border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-xl font-bold tracking-tight mb-4">{L.otherMatches}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {otherFixtures.map(f => (
                <Link
                  key={f.slug}
                  href={`/desporto/liga/jogo/${f.slug}`}
                  locale={locale}
                  className="border border-stone-200 px-3 py-2 hover:border-stone-400 transition-colors"
                >
                  <div className="text-sm font-medium text-stone-800 truncate">
                    {teamDisplayName(f.home)} — {teamDisplayName(f.away)}
                  </div>
                  <div className="text-[11px] text-stone-400 tabular-nums">
                    {f.p_home != null && f.p_draw != null && f.p_away != null
                      ? `${Math.round(f.p_home * 100)}% · ${Math.round(
                          f.p_draw * 100,
                        )}% · ${Math.round(f.p_away * 100)}%`
                      : pt
                        ? `Jornada ${f.matchday}`
                        : `Matchday ${f.matchday}`}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Method footnote */}
      <section>
        <div className="max-w-5xl mx-auto px-4 py-8 text-xs text-stone-400">
          {L.method}{" "}
          <Link
            href="/desporto/liga/metodologia"
            locale={locale}
            className="text-stone-600 hover:text-stone-900 underline underline-offset-2"
          >
            {L.methodLink}
          </Link>
          {prediction?.timestamp ? ` · ${prediction.timestamp.slice(0, 10)}` : ""}
        </div>
      </section>
    </div>
  );
}
