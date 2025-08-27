import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-green-pale">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-dark mb-4">Methodology</h1>
          <p className="text-lg text-green-dark/70">
            How our Dynamic Gaussian Process Election Model works
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="max-w-none space-y-6 text-slate-700 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">Overview</h2>
              <p>
                We've developed a statistical forecasting model for Portuguese elections that captures 
                both long-term political trends and district-level dynamics. It represents an evolution 
                of traditional election models, designed specifically to address the challenges of 
                Portugal's multi-party, district-based electoral system.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">The Challenge of Forecasting Portuguese Elections</h2>
              <p>
                Portugal's electoral landscape presents unique forecasting challenges. The country has 
                multiple significant political parties ranging from the traditional center-left (PS) 
                and center-right (AD) to newer entrants like the liberal IL and right-wing Chega. 
                Elections are decided through a proportional representation system across multiple 
                districts, with seats allocated using the D'Hondt method.
              </p>
              <p>Traditional forecasting approaches struggle with several aspects of this system:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>District-level variation in political support that doesn't uniformly follow national trends</li>
                <li>Different parties having varying sensitivity to national sentiment shifts</li>
                <li>Campaign dynamics that can shift rapidly during election season</li>
                <li>The complex interaction between vote share and seat allocation under proportional representation</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">The Dynamic Gaussian Process Model</h2>
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
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">Polling Analysis</h2>
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
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">Seat Simulation Process</h2>
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
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">Uncertainty Quantification</h2>
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
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">Model Validation</h2>
              <p>We validate our approach through:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Backtesting on historical Portuguese elections</li>
                <li>Cross-validation using held-out polling data</li>
                <li>Comparison with actual election results</li>
                <li>Calibration tests to ensure our probabilities are well-calibrated</li>
                <li>Sensitivity analysis to key modeling assumptions</li>
              </ol>
              <p className="mt-4">
                We continuously refine our model based on these validation exercises.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">Limitations and Caveats</h2>
              <p>Our model has several important limitations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Relies on polling data, which can be biased or unrepresentative</li>
                <li>May not capture unprecedented political developments</li>
                <li>Assumes historical patterns continue to hold</li>
                <li>Cannot predict the impact of major campaign events or scandals</li>
                <li>District-level data is limited compared to national polling</li>
              </ul>
              <p className="mt-4">
                We encourage users to interpret our forecasts as probabilistic estimates, not certainties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-green-dark border-b border-green-medium/30 pb-2">Data Sources</h2>
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
            <p>© 2025 estimador.pt • Built with transparency and open methodology</p>
            <p className="mt-2">
              Developed by Bernardo Caldas • 
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