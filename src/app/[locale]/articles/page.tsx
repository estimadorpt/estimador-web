import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function ArticlesPage() {
  // Sample articles - in a real app these would come from a CMS or database
  const articles = [
    {
      id: 1,
      title: "Understanding Portugal's Electoral System",
      excerpt: "A comprehensive guide to how Portugal's proportional representation system works and why it matters for forecasting.",
      date: "2025-01-20",
      author: "Bernardo Caldas",
      tags: ["Electoral System", "Analysis"],
      readTime: "8 min"
    },
    {
      id: 2,
      title: "The Rise of Chega: Analyzing the Right-Wing Surge",
      excerpt: "Examining the factors behind Chega's rapid growth and what it means for Portuguese politics.",
      date: "2025-01-15",
      author: "Bernardo Caldas", 
      tags: ["Party Analysis", "Chega"],
      readTime: "12 min"
    },
    {
      id: 3,
      title: "Polling Accuracy in Portuguese Elections: A Historical Analysis",
      excerpt: "How accurate have Portuguese polls been historically, and what can we learn for future forecasting?",
      date: "2025-01-10",
      author: "Bernardo Caldas",
      tags: ["Polling", "Methodology"],
      readTime: "10 min"
    }
  ];

  return (
    <div className="min-h-screen bg-green-pale">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-dark mb-4">Analysis & Articles</h1>
          <p className="text-lg text-green-dark/70">
            In-depth analysis of Portuguese politics and election trends
          </p>
        </div>

        <div className="grid gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">
                      <Link href={`/articles/${article.id}`} className="hover:text-green-medium transition-colors">
                        {article.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-base">
                      {article.excerpt}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>By {article.author}</span>
                    <span>•</span>
                    <span>{new Date(article.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    <span>•</span>
                    <span>{article.readTime} read</span>
                  </div>
                  <div className="flex gap-2">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-green-dark mb-2">
                More Analysis Coming Soon
              </h3>
              <p className="text-green-dark/70 mb-4">
                We're working on more in-depth analysis pieces covering Portuguese electoral dynamics, 
                polling trends, and forecast methodology.
              </p>
              <p className="text-sm text-slate-500">
                Subscribe to our newsletter to be notified when new articles are published.
              </p>
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