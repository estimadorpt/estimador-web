import { Header } from "@/components/Header";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight, Trophy, Vote, BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import { loadLigaSummary } from "@/lib/utils/football-data-loader";
import { ligaTeamColors } from "@/lib/config/football";
import { getActiveSections, getArchiveSections } from "@/lib/config/sections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("meta.homepageTitle"),
    description: t("meta.defaultDescription"),
    openGraph: {
      title: t("meta.homepageTitle"),
      description: t("meta.defaultDescription"),
      url: `https://estimador.pt/${locale}`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}`,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const ligaSummary = await loadLigaSummary();
  const activeSections = getActiveSections();
  const archiveSections = getArchiveSections();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              estimador.pt
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">
            {t("meta.defaultTitle").replace(" — ", "\n").split("\n")[0]}
          </h1>
          <p className="text-lg text-stone-400 max-w-2xl">
            {t("meta.defaultDescription")}
          </p>
        </div>
      </section>

      {/* Active Sections */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Liga Portugal card */}
          {ligaSummary && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-stone-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {t("football.title")} — {t("football.season")}{" "}
                  {ligaSummary.season}
                </span>
                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5">
                  {t("sections.activeSection")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-200 border border-stone-200">
                {ligaSummary.top3.map((team, i) => {
                  const color = ligaTeamColors[team.team] || "#78716c";
                  return (
                    <div key={team.team} className="bg-white p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-1.5 h-5"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium text-stone-600">
                          {i + 1}. {team.team}
                        </span>
                      </div>
                      <div className="text-3xl font-black tabular-nums text-stone-900">
                        {Math.round(team.p_champion * 100)}%
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-1">
                        {t("football.championship")}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  {t("football.matchday")} {ligaSummary.matchday} ·{" "}
                  {ligaSummary.nextMatchday.matches.length}{" "}
                  {locale === "pt" ? "jogos na próxima jornada" : "matches next matchday"}
                </span>
                <Link
                  href="/desporto/liga"
                  locale={locale}
                  className="text-sm font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group"
                >
                  {t("common.viewFull")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* Elections card */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Vote className="w-5 h-5 text-stone-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {t("nav.elections")}
              </span>
              <span className="text-[10px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5">
                {t("sections.archiveSection")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stone-200 border border-stone-200">
              {/* Presidential */}
              <Link
                href="/eleicoes/presidenciais"
                locale={locale}
                className="bg-white p-5 hover:bg-stone-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-900 group-hover:text-blue-700">
                      {t("sections.presidential2026")}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {t("sections.presidential2026Description")}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              {/* Parliamentary */}
              <Link
                href="/eleicoes/legislativas"
                locale={locale}
                className="bg-white p-5 hover:bg-stone-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-900 group-hover:text-blue-700">
                      {t("sections.parliamentary2025")}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {t("sections.parliamentary2025Description")}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <section className="bg-stone-800 text-stone-300 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-white mb-3">
                {t("about.title")}
              </h2>
              <p className="text-sm leading-relaxed mb-5">
                {t("about.missionDescription1")}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  href="/sobre"
                  locale={locale}
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  {t("nav.about")}
                </Link>
                <Link
                  href="/metodologia"
                  locale={locale}
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  {t("nav.methodology")}
                </Link>
                <Link
                  href="/artigos"
                  locale={locale}
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  {t("articles.title")}
                </Link>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-light.svg"
              alt="estimador.pt"
              className="h-10 w-auto opacity-80 hidden md:block"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
