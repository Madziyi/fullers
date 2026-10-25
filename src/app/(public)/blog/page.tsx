import Link from 'next/link';
import { getPublishedArticles } from '@/lib/articles';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata(
  'Articles and advice',
  'Practical articles from Fullers Aggregate in Bindura.',
  '/blog',
);
export default async function Blog() {
  const articles = await getPublishedArticles();
  return (
    <main id="main" className="container blog-index">
      <p className="eyebrow">FROM THE FULLERS YARD</p>
      <h1>Ideas for what you’re building.</h1>
      <p className="lead">
        Useful notes on concrete products, planning and working with Fullers Aggregate.
      </p>
      {articles.length === 0 ? (
        <p>New articles will appear here when they are ready.</p>
      ) : (
        <div className="blog-grid">
          {articles.map((article) => (
            <article key={article.slug}>
              <p className="eyebrow">{article.categoryName ?? 'FULLERS AGGREGATE'}</p>
              <h2>
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h2>
              <p>{article.excerpt}</p>
              <Link className="text-link" href={`/blog/${article.slug}`}>
                Read article →
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
