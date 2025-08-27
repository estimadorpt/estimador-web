import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('meta.methodologyTitle'),
    description: t('methodology.subtitle'),
    openGraph: {
      title: t('meta.methodologyTitle'),
      description: t('methodology.subtitle'),
      url: `https://estimador.pt/${locale}/methodology`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/methodology`,
    },
  };
}

export default async function MethodologyPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <div className="min-h-screen bg-green-pale">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-dark mb-4">{t('methodology.title')}</h1>
          <p className="text-lg text-green-dark/70">
            {t('methodology.subtitle')}
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="max-w-none space-y-6 text-slate-700 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.overview')}</h2>
              <p>
                {t('methodology.overviewDescription')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.challenge')}</h2>
              <p>
                {t('methodology.challengeDescription1')}
              </p>
              <p>{t('methodology.challengeDescription2')}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>District-level variation in political support that doesn't uniformly follow national trends</li>
                <li>Different parties having varying sensitivity to national sentiment shifts</li>
                <li>Campaign dynamics that can shift rapidly during election season</li>
                <li>The complex interaction between vote share and seat allocation under proportional representation</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.dynamicModel')}</h2>
              <p>
                Our approach uses Gaussian processes to model the evolution of party support over time. 
                This allows us to capture both smooth trends and sudden shifts while accounting for uncertainty.
              </p>
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-slate-800">Key Components:</h4>
                <ol className="list-decimal pl-6 space-y-2">
                  <li><span className="font-medium">National Trend Estimation:</span> We model the underlying "true" support for each party using polling data</li>
                  <li><span className="font-medium">Pollster House Effects:</span> We account for systematic biases in different polling organizations</li>
                  <li><span className="font-medium">District-Level Modeling:</span> We model how national trends translate to each electoral district</li>
                  <li><span className="font-medium">Seat Simulation:</span> We run thousands of simulations to convert vote shares to seat counts</li>
                </ol>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.pollingAnalysis')}</h2>
              <p>
                We collect polling data from major Portuguese polling organizations and apply several corrections:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-medium">House Effects:</span> Each pollster has systematic tendencies to over- or under-estimate certain parties</li>
                <li><span className="font-medium">Sample Size Adjustments:</span> Larger polls receive more weight</li>
                <li><span className="font-medium">Recency Weighting:</span> More recent polls have greater influence</li>
                <li><span className="font-medium">Mode Effects:</span> We account for differences between online, telephone, and in-person polling</li>
                <li><span className="font-medium">Population Adjustments:</span> We adjust for likely voter models vs. registered voter polls</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.seatSimulation')}</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-slate-800 mb-2">National to District Translation</h4>
                  <p>We model how national polling translates to district-level vote shares using:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Historical district-level results</li>
                    <li>Demographic and economic indicators</li>
                    <li>Regional political patterns</li>
                    <li>Previous election swing patterns</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-slate-800 mb-2">Seat Allocation</h4>
                  <p>For each simulation, we:</p>
                  <ol className="list-decimal pl-6 space-y-1 mt-2">
                    <li>Generate vote shares for each party in each district</li>
                    <li>Apply the D'Hondt method to allocate seats</li>
                    <li>Sum up seats across all districts</li>
                    <li>Record the outcome</li>
                  </ol>
                  <p className="mt-3">
                    We run thousands of these simulations to build probability distributions for seat counts.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.uncertainty')}</h2>
              <p>Our model incorporates several sources of uncertainty:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-medium">Polling Error:</span> Historical polling accuracy in Portuguese elections</li>
                <li><span className="font-medium">Campaign Effects:</span> Potential for late shifts in voter preference</li>
                <li><span className="font-medium">Turnout Variation:</span> Different turnout patterns across demographics and regions</li>
                <li><span className="font-medium">Model Uncertainty:</span> Parameter estimation uncertainty</li>
                <li><span className="font-medium">Systematic Shocks:</span> Unexpected events that could shift the race</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.validation')}</h2>
              <p>We validate our approach through:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Backtesting on historical Portuguese elections</li>
                <li>Cross-validation using held-out polling data</li>
                <li>Comparison with actual election results</li>
                <li>Calibration tests to ensure our probabilities are well-calibrated</li>
                <li>Sensitivity analysis to key modeling assumptions</li>
              </ol>
              <p className="mt-4">
                {t('methodology.validationDescription')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.limitations')}</h2>
              <p>{t('methodology.limitationsDescription1')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Relies on polling data, which can be biased or unrepresentative</li>
                <li>May not capture unprecedented political developments</li>
                <li>Assumes historical patterns continue to hold</li>
                <li>Cannot predict the impact of major campaign events or scandals</li>
                <li>District-level data is limited compared to national polling</li>
              </ul>
              <p className="mt-4">
                {t('methodology.limitationsDescription2')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.dataSources')}</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Portuguese polling organizations (CESOP, Aximage, Pitagórica, etc.)</li>
                <li>Historical election results from CNE (Comissão Nacional de Eleições)</li>
                <li>Demographic data from INE (Instituto Nacional de Estatística)</li>
              </ul>
            </section>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-green-medium/30 bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-600">
            <p>{t('about.footerCopyright')}</p>
            <p className="mt-2">
              {t('about.footerDeveloper')} • 
              <Link href="mailto:info@estimador.pt" className="text-green-medium hover:text-green-dark hover:underline ml-1">
                info@estimador.pt
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}