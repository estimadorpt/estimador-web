import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Article } from "@/lib/articles";
import { ArticleChart } from "@/components/charts/ChartEmbed";
import { ArticleStructuredData } from "@/components/StructuredData";

interface ArticleLayoutProps {
  article: Article;
}

export function ArticleLayout({ article }: ArticleLayoutProps) {
  return (
    <>
      <ArticleStructuredData article={article} />
      <div className="min-h-screen bg-green-pale">
        <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/articles" className="text-green-medium hover:text-green-dark hover:underline">
            ← Back to Articles
          </Link>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-green-dark mb-4 leading-tight">
            {article.title}
          </h1>
          
          <p className="text-xl text-green-dark/70 mb-6 leading-relaxed">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-6">
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

          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none">
          <div 
            className="article-content"
            dangerouslySetInnerHTML={{ __html: formatArticleContent(article.content) }}
          />
        </article>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-green-medium/30">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-green-dark mb-2">
              About the Author
            </h3>
            <p className="text-green-dark/70 mb-4">
              <strong>{article.author}</strong> is the founder of estimador.pt, 
              bringing data-driven analysis to Portuguese electoral politics. 
              With a background in political science and statistical modeling, 
              he provides transparent and rigorous election forecasting.
            </p>
            <p className="text-sm text-slate-500">
              For questions or feedback: 
              <Link href="mailto:info@estimador.pt" className="text-green-medium hover:text-green-dark hover:underline ml-1">
                info@estimador.pt
              </Link>
            </p>
          </Card>
        </footer>

        {/* Related Articles */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-green-dark mb-6">Related Articles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-2">
                <Link href="/articles" className="text-green-dark hover:text-green-medium">
                  Browse All Articles
                </Link>
              </h3>
              <p className="text-sm text-slate-600">
                Explore our complete collection of analysis and commentary on Portuguese politics.
              </p>
            </Card>
            <Card className="p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-2">
                <Link href="/methodology" className="text-green-dark hover:text-green-medium">
                  Our Methodology
                </Link>
              </h3>
              <p className="text-sm text-slate-600">
                Learn more about our forecasting approach and statistical methods.
              </p>
            </Card>
          </div>
        </section>
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
    </>
  );
}

function formatArticleContent(content: string): string {
  // Convert markdown-like content to HTML
  let html = content;
  
  // Headers
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-green-dark mt-8 mb-4 first:mt-0">$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-green-dark mt-6 mb-3">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-green-dark mt-4 mb-2">$1</h3>');
  
  // Bold text
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Italic text  
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li class="mb-1">$1</li>');
  html = html.replace(/(<li class="mb-1">.+<\/li>\s*)+/g, '<ul class="list-disc pl-6 mb-4 space-y-1">$&</ul>');
  
  // Code blocks (simplified)
  html = html.replace(/```([^`]+)```/g, '<pre class="bg-slate-100 p-4 rounded-md text-sm overflow-x-auto mb-4"><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">$1</code>');
  
  // Paragraphs - split on double newlines
  const paragraphs = html.split('\n\n').filter(p => p.trim());
  html = paragraphs.map(p => {
    // Skip if already wrapped in HTML tags
    if (p.startsWith('<')) return p;
    return `<p class="mb-4 text-slate-700 leading-relaxed">${p.replace(/\n/g, ' ')}</p>`;
  }).join('\n\n');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-8 border-green-medium/30">');
  
  // Clean up
  html = html.replace(/<p class="mb-4 text-slate-700 leading-relaxed"><\/p>/g, '');
  
  return html;
}