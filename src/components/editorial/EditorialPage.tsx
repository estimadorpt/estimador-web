import fs from 'fs';
import path from 'path';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/mdx-components';

export function EditorialPage({ locale, section }: { locale: string; section: 'about' | 'methodology' }) {
  const content = fs.readFileSync(path.join(process.cwd(), 'src/content', section, `${locale}.mdx`), 'utf8');
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <article className="article-body max-w-none">
          <MDXRemote source={content} components={getMDXComponents()} />
        </article>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
