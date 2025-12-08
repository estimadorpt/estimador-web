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
                <li>{t('methodology.challengeList1')}</li>
                <li>{t('methodology.challengeList2')}</li>
                <li>{t('methodology.challengeList3')}</li>
                <li>{t('methodology.challengeList4')}</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.dynamicModel')}</h2>
              <p>
                {t('methodology.modelDescription')}
              </p>
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-slate-800">{t('methodology.keyComponents')}</h4>
                <ol className="list-decimal pl-6 space-y-2">
                  <li><span className="font-medium">{t('methodology.component1Title')}</span> {t('methodology.component1Desc')}</li>
                  <li><span className="font-medium">{t('methodology.component2Title')}</span> {t('methodology.component2Desc')}</li>
                  <li><span className="font-medium">{t('methodology.component3Title')}</span> {t('methodology.component3Desc')}</li>
                  <li><span className="font-medium">{t('methodology.component4Title')}</span> {t('methodology.component4Desc')}</li>
                </ol>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.pollingAnalysis')}</h2>
              <p>
                {t('methodology.pollingCollect')}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-medium">{t('methodology.pollingHouseEffects')}</span> {t('methodology.pollingHouseEffectsDesc')}</li>
                <li><span className="font-medium">{t('methodology.pollingSampleSize')}</span> {t('methodology.pollingSampleSizeDesc')}</li>
                <li><span className="font-medium">{t('methodology.pollingRecency')}</span> {t('methodology.pollingRecencyDesc')}</li>
                <li><span className="font-medium">{t('methodology.pollingMode')}</span> {t('methodology.pollingModeDesc')}</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.seatSimulation')}</h2>
              <div className="space-y-4">
                <p>{t('methodology.simulationDesc')}</p>
                <ol className="list-decimal pl-6 space-y-1 mt-2">
                  <li>{t('methodology.simulationStep1')}</li>
                  <li>{t('methodology.simulationStep2')}</li>
                  <li>{t('methodology.simulationStep3')}</li>
                </ol>
                <p className="mt-3">
                  {t('methodology.simulationConclusion')}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.uncertainty')}</h2>
              <p>{t('methodology.uncertaintyDesc')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-medium">{t('methodology.uncertaintyPolling')}</span> {t('methodology.uncertaintyPollingDesc')}</li>
                <li><span className="font-medium">{t('methodology.uncertaintyCampaign')}</span> {t('methodology.uncertaintyCampaignDesc')}</li>
                <li><span className="font-medium">{t('methodology.uncertaintyUndecided')}</span> {t('methodology.uncertaintyUndecidedDesc')}</li>
                <li><span className="font-medium">{t('methodology.uncertaintyModel')}</span> {t('methodology.uncertaintyModelDesc')}</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.validation')}</h2>
              <p>{t('methodology.validationDesc')}</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>{t('methodology.validationStep1')}</li>
                <li>{t('methodology.validationStep2')}</li>
                <li>{t('methodology.validationStep3')}</li>
                <li>{t('methodology.validationStep4')}</li>
              </ol>
              <p className="mt-4">
                {t('methodology.validationDescription')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.limitations')}</h2>
              <p>{t('methodology.limitationsDescription1')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('methodology.limitationsList1')}</li>
                <li>{t('methodology.limitationsList2')}</li>
                <li>{t('methodology.limitationsList3')}</li>
                <li>{t('methodology.limitationsList4')}</li>
                <li>{t('methodology.limitationsList5')}</li>
              </ul>
              <p className="mt-4">
                {t('methodology.limitationsDescription2')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">{t('methodology.dataSources')}</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t('methodology.dataSourcesList1')}</li>
                <li>{t('methodology.dataSourcesList2')}</li>
                <li>{t('methodology.dataSourcesList3')}</li>
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