import { loadPresidentialData } from "@/lib/utils/data-loader";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { PresidentialCandidateCards, SecondRoundIndicator } from "@/components/charts/PresidentialCandidateCards";
import { PresidentialTrendChart } from "@/components/charts/PresidentialTrendChart";
import { PresidentialForecastBars } from "@/components/charts/PresidentialForecastBars";
import { PresidentialHeadToHead } from "@/components/charts/PresidentialHeadToHead";
import { PresidentialRunoffPairs } from "@/components/charts/PresidentialRunoffPairs";
import { Header } from "@/components/Header";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { PRESIDENTIAL_2026 } from "@/lib/config/elections";
import { PresidentialTrendsData, PresidentialWinProbabilitiesData } from "@/types";

// Simple seeded random for reproducibility
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Box-Muller transform for normal distribution
function normalRandom(mean: number, std: number, seed: number): number {
  const u1 = seededRandom(seed);
  const u2 = seededRandom(seed + 1);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

// Compute approximate win probabilities at cutoff using Monte Carlo simulation
function computeLeadingProbabilitiesAtCutoff(
  trends: PresidentialTrendsData,
  winProbabilities: PresidentialWinProbabilitiesData,
  cutoffDate: string | null,
  numSimulations: number = 5000
): { name: string; probability: number; color: string }[] {
  if (!cutoffDate) {
    // Return election day probabilities
    return winProbabilities.candidates.map(c => ({
      name: c.name,
      probability: c.leading_probability,
      color: c.color,
    }));
  }
  
  // Find cutoff index
  const cutoff = new Date(cutoffDate);
  const idx = trends.dates.findIndex(d => new Date(d) > cutoff);
  const cutoffIndex = idx === -1 ? trends.dates.length - 1 : idx - 1;
  
  // Build candidate data for simulation
  const candidates = Object.entries(trends.candidates)
    .filter(([name]) => name !== 'Others')
    .map(([name, data]) => {
      const mean = data.mean[cutoffIndex];
      const std = (data.ci_95[cutoffIndex] - data.ci_05[cutoffIndex]) / 3.92;
      const wpData = winProbabilities.candidates.find(c => c.name === name);
      return {
        name,
        mean,
        std: Math.max(std, 0.001),
        color: wpData?.color || '#888888',
      };
    });
  
  // Monte Carlo simulation
  const wins: Record<string, number> = {};
  candidates.forEach(c => { wins[c.name] = 0; });
  
  for (let sim = 0; sim < numSimulations; sim++) {
    let maxValue = -Infinity;
    let winner = '';
    
    candidates.forEach((c, i) => {
      const value = normalRandom(c.mean, c.std, sim * candidates.length + i);
      if (value > maxValue) {
        maxValue = value;
        winner = c.name;
      }
    });
    
    if (winner) wins[winner]++;
  }
  
  // Convert to sorted array
  return candidates
    .map(c => ({
      name: c.name,
      probability: wins[c.name] / numSimulations,
      color: c.color,
    }))
    .sort((a, b) => b.probability - a.probability);
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('meta.presidentialTitle'),
    description: t('meta.presidentialDescription'),
    openGraph: {
      title: t('meta.presidentialTitle'),
      description: t('meta.presidentialDescription'),
      url: `https://estimador.pt/${locale}`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}`,
    },
  };
}

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  // Load presidential forecast data
  const { forecast, winProbabilities, trends, trajectories, polls, headToHead, runoffPairs, lastPollDate } = await loadPresidentialData();
  
  // Compute leading probabilities at cutoff date
  const cutoffProbabilities = computeLeadingProbabilitiesAtCutoff(trends, winProbabilities, lastPollDate);
  
  // Get the leading candidate at cutoff
  const leadingCandidate = cutoffProbabilities[0];
  const secondRoundProbability = winProbabilities.second_round_probability;
  
  // Calculate days until election
  const electionDate = new Date(PRESIDENTIAL_2026.date);
  const today = new Date();
  const daysUntilElection = Math.ceil((electionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Get the last update date
  const lastUpdate = forecast.updated_at 
    ? new Date(forecast.updated_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    : null;

  // Format probability as percentage
  const formatProbability = (value: number) => {
    const pct = value * 100;
    if (pct >= 99.5) return '>99%';
    if (pct < 1) return '<1%';
    return `${Math.round(pct)}%`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      {/* Presidential Election Banner */}
      <div className="bg-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">{t('presidential.electionName')}</span>
            <span className="text-stone-500">·</span>
            <span className="text-stone-300">{t('presidential.electionDate', { date: 'January 18, 2026' })}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-300 bg-stone-700/50 px-3 py-1 rounded-full text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">{daysUntilElection} days</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4 leading-tight">
              {leadingCandidate ? (
                t('presidential.leadingHeadline', {
                  candidate: leadingCandidate.name,
                  probability: formatProbability(leadingCandidate.probability)
                })
              ) : (
                t('presidential.forecastTitle')
              )}
            </h1>
            <p className="text-lg text-stone-600 mb-5 leading-relaxed">
              {t('presidential.forecastDescription', {
                secondRoundProbability: formatProbability(secondRoundProbability)
              })}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-stone-500">{t('presidential.basedOnPolls')}</span>
              <span className="text-stone-300">·</span>
              <Link href="/methodology" className="text-blue-600 hover:text-blue-800 font-medium">
                {t('common.methodology')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Second Round Indicator */}
      <section className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <SecondRoundIndicator 
            probability={secondRoundProbability}
            translations={{
              secondRoundNeeded: t('presidential.secondRoundNeeded'),
              probabilityLabel: t('presidential.probability'),
            }}
          />
        </div>
      </section>

      {/* Win Probability Cards */}
      <section className="py-8 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-stone-900">
              {t('presidential.winProbabilities')}
            </h2>
            {lastUpdate && (
              <div className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                {t('common.updated')} {lastUpdate}
              </div>
            )}
          </div>
          <ErrorBoundary componentName="Candidate Cards">
            <PresidentialCandidateCards
              winProbabilities={winProbabilities}
              forecast={forecast}
              trends={trends}
              cutoffDate={lastPollDate}
              maxCandidates={5}
              translations={{
                chanceOfLeading: t('presidential.chanceOfLeading'),
                voteShare: t('presidential.voteShare'),
                partyLabel: t('presidential.partyAffiliation'),
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      {/* Support Trends Chart */}
      <section className="py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-bold text-stone-900 mb-1 tracking-tight">
            {t('presidential.supportTrajectory')}
          </h2>
          <p className="text-sm text-stone-500 mb-8 max-w-xl">
            {t('presidential.trendDescription')}
          </p>
          <ErrorBoundary componentName="Support Trends">
            <PresidentialTrendChart
              trends={trends}
              polls={polls}
              electionDate={PRESIDENTIAL_2026.date}
              cutoffDate={lastPollDate}
              height={420}
              showPolls={true}
              maxCandidates={5}
            />
          </ErrorBoundary>
        </div>
      </section>

      {/* Head-to-Head Probability */}
      {headToHead.dates.length > 0 && (
        <section className="py-10 bg-white border-b border-stone-300">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl font-bold text-stone-900 mb-1 tracking-tight">
              {t('presidential.headToHeadTitle')}
            </h2>
            <p className="text-sm text-stone-500 mb-8 max-w-xl">
              {t('presidential.headToHeadDescription', {
                candidateA: headToHead.candidate_a,
                candidateB: headToHead.candidate_b
              })}
            </p>
            <ErrorBoundary componentName="Head-to-Head">
              <PresidentialHeadToHead
                data={headToHead}
                cutoffDate={lastPollDate}
                height={280}
                translations={{
                  title: t('presidential.headToHeadTitle'),
                  description: t('presidential.headToHeadDescription', {
                    candidateA: headToHead.candidate_a,
                    candidateB: headToHead.candidate_b
                  }),
                  probability: t('presidential.leads'),
                }}
              />
            </ErrorBoundary>
          </div>
        </section>
      )}

      {/* Runoff Scenarios */}
      {runoffPairs.pairs.length > 0 && (
        <section className="py-10 border-b border-stone-300">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl font-bold text-stone-900 mb-1 tracking-tight">
              {t('presidential.runoffScenariosTitle')}
            </h2>
            <p className="text-sm text-stone-500 mb-8 max-w-xl">
              {t('presidential.runoffScenariosDescription')}
            </p>
            
            <div>
              <ErrorBoundary componentName="Runoff Pairs">
                <PresidentialRunoffPairs
                  data={runoffPairs}
                  maxPairs={6}
                  translations={{
                    title: t('presidential.mostLikelyMatchups'),
                    vs: t('presidential.vs'),
                    probability: t('presidential.probability'),
                  }}
                />
              </ErrorBoundary>
            </div>
          </div>
        </section>
      )}

      {/* Vote Share Forecast */}
      <section className="py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Forecast Bars - takes 3 columns */}
            <div className="lg:col-span-3">
              <h3 className="text-xl font-bold text-stone-900 mb-6 tracking-tight">
                {t('presidential.projectedVoteShare')}
              </h3>
              <ErrorBoundary componentName="Forecast Bars">
                <PresidentialForecastBars
                  forecast={forecast}
                  showUncertainty={true}
                  maxCandidates={8}
                  translations={{
                    projectedVoteShare: t('presidential.projectedVoteShare'),
                    confidenceInterval: t('presidential.confidenceInterval'),
                  }}
                />
              </ErrorBoundary>
            </div>

            {/* About the Model - takes 2 columns */}
            <div className="lg:col-span-2 lg:border-l lg:border-stone-200 lg:pl-12">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">
                {t('presidential.aboutModel')}
              </h3>
              <div className="space-y-4 text-sm text-stone-600">
                <p className="leading-relaxed">
                  {t('presidential.modelDescription')}
                </p>
                <div className="border-l-2 border-amber-500 pl-4 py-2 bg-amber-50/50">
                  <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> {t('presidential.undecidedWarning')}
                  </p>
                </div>
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                    {t('presidential.keyFactors')}
                  </h4>
                  <ul className="space-y-1 text-stone-600 text-sm">
                    <li>→ {t('presidential.factor1')}</li>
                    <li>→ {t('presidential.factor2')}</li>
                    <li>→ {t('presidential.factor3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation to Other Pages */}
      <section className="py-8 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
            More from estimador.pt
          </div>
          <div className="flex flex-wrap gap-6">
            <Link 
              href="/forecast" 
              className="group inline-flex items-center gap-2 text-stone-700 hover:text-blue-700 transition-colors"
            >
              <span className="font-semibold">{t('nav.parliamentaryForecast')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/map" 
              className="group inline-flex items-center gap-2 text-stone-700 hover:text-blue-700 transition-colors"
            >
              <span className="font-semibold">{t('map.title')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/methodology" 
              className="group inline-flex items-center gap-2 text-stone-700 hover:text-blue-700 transition-colors"
            >
              <span className="font-semibold">{t('common.methodology')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="bg-stone-800 text-stone-300 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-white mb-3">
              {t('presidential.aboutForecast')}
            </h2>
            <p className="text-sm leading-relaxed mb-5">
              {t('presidential.aboutDescription')}
            </p>
            <div className="flex items-center gap-4 text-sm text-stone-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{forecast.candidates.length} {t('presidential.candidatesModeled')}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{t('presidential.electionDate', { date: 'Jan 18, 2026' })}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
