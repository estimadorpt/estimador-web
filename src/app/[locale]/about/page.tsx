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
    title: t('meta.aboutTitle'),
    description: t('about.subtitle'),
    openGraph: {
      title: t('meta.aboutTitle'),
      description: t('about.subtitle'),
      url: `https://estimador.pt/${locale}/about`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/about`,
    },
  };
}

export default async function AboutPage({
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
          <h1 className="text-3xl font-bold text-green-dark mb-4">{t('about.title')}</h1>
          <p className="text-lg text-green-dark/70">
            {t('about.subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('about.mission')}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                {t('about.missionDescription1')}
              </p>
              <p>
                {t('about.missionDescription2')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('about.whatWeDo')}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <ul>
                <li><strong>{t('about.whatWeDoLabels.forecasting')}:</strong> {t('about.whatWeDoList.forecasting')}</li>
                <li><strong>{t('about.whatWeDoLabels.seatProjections')}:</strong> {t('about.whatWeDoList.seatProjections')}</li>
                <li><strong>{t('about.whatWeDoLabels.trendAnalysis')}:</strong> {t('about.whatWeDoList.trendAnalysis')}</li>
                <li><strong>{t('about.whatWeDoLabels.pollingAnalysis')}:</strong> {t('about.whatWeDoList.pollingAnalysis')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('about.approach')}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                {t('about.approachDescription1')}
              </p>
              <p>
                {t('about.approachDescription2')}
              </p>
              <ul>
                <li><strong>{t('about.approachPrincipleLabels.transparency')}:</strong> {t('about.approachPrinciples.transparency')}</li>
                <li><strong>{t('about.approachPrincipleLabels.independence')}:</strong> {t('about.approachPrinciples.independence')}</li>
                <li><strong>{t('about.approachPrincipleLabels.accuracy')}:</strong> {t('about.approachPrinciples.accuracy')}</li>
                <li><strong>{t('about.approachPrincipleLabels.accessibility')}:</strong> {t('about.approachPrinciples.accessibility')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('about.team')}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                {t('about.founder')} <strong>Bernardo Caldas</strong>, {t('about.combiningExpertise')}
              </p>
              <p>
                {t('about.contact')}{' '}
                <a href="mailto:info@estimador.pt" className="text-green-medium hover:text-green-dark hover:underline">
                  info@estimador.pt
                </a>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('about.limitations')}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                {t('about.limitationsDescription1')}
              </p>
              <ul>
                <li>{t('about.limitationsList.pollingError')}</li>
                <li>{t('about.limitationsList.campaignDynamics')}</li>
                <li>{t('about.limitationsList.turnout')}</li>
                <li>{t('about.limitationsList.regional')}</li>
              </ul>
              <p>
                {t('about.limitationsDescription2')}
              </p>
            </CardContent>
          </Card>
        </div>
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