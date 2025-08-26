import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700">
                estimador.pt
              </Link>
              <p className="text-sm text-slate-600">Portuguese Election Forecasting</p>
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="text-slate-700 hover:text-slate-900 font-medium">
                Home
              </Link>
              <Link href="/forecast" className="text-slate-700 hover:text-slate-900 font-medium">
                Forecast
              </Link>
              <Link href="/articles" className="text-slate-700 hover:text-slate-900 font-medium">
                Analysis
              </Link>
              <span className="text-slate-900 font-medium">About</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">About estimador.pt</h1>
          <p className="text-lg text-slate-600">
            Independent, data-driven election forecasting for Portugal
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                estimador.pt provides transparent, data-driven forecasts for Portuguese elections. 
                We believe that high-quality election analysis should be accessible to everyone, 
                not just political insiders.
              </p>
              <p>
                Our goal is to help Portuguese citizens better understand electoral dynamics 
                and make informed decisions by providing clear, accurate, and unbiased analysis 
                of polling data and electoral trends.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What We Do</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <ul>
                <li><strong>Election Forecasting:</strong> Statistical models that combine polling data with historical patterns</li>
                <li><strong>Seat Projections:</strong> Detailed analysis of how votes translate to parliamentary seats</li>
                <li><strong>Trend Analysis:</strong> Long-term tracking of party support and electoral dynamics</li>
                <li><strong>Polling Analysis:</strong> Examination of house effects and bias patterns in Portuguese polling</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our Approach</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                We use rigorous statistical methods combined with transparency about our assumptions 
                and limitations. Our models are inspired by leading international forecasting efforts 
                but are specifically designed for Portugal's multi-party, proportional representation system.
              </p>
              <p>
                Key principles:
              </p>
              <ul>
                <li><strong>Transparency:</strong> Open methodology and clear communication of uncertainty</li>
                <li><strong>Independence:</strong> No political affiliations or funding from partisan sources</li>
                <li><strong>Accuracy:</strong> Continuous improvement based on electoral outcomes</li>
                <li><strong>Accessibility:</strong> Making complex analysis understandable to general audiences</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About the Team</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                estimador.pt was founded by <strong>Bernardo Caldas</strong>, combining expertise 
                in data science, statistics, and Portuguese politics.
              </p>
              <p>
                For questions, suggestions, or media inquiries, please contact us at{' '}
                <a href="mailto:info@estimador.pt" className="text-blue-600 hover:underline">
                  info@estimador.pt
                </a>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitations & Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                Election forecasting is inherently uncertain. Our models represent probabilities, 
                not certainties. Factors we consider include:
              </p>
              <ul>
                <li>Polling error and bias</li>
                <li>Late campaign dynamics</li>
                <li>Turnout variations</li>
                <li>Regional voting patterns</li>
              </ul>
              <p>
                Our forecasts should be understood as one piece of information among many when 
                analyzing Portuguese elections.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-600">
            <p>© 2025 estimador.pt • Built with transparency and open methodology</p>
            <p className="mt-2">
              Developed by Bernardo Caldas • 
              <Link href="mailto:info@estimador.pt" className="text-blue-600 hover:underline ml-1">
                info@estimador.pt
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}