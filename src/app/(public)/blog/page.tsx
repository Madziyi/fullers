import Link from 'next/link';
import { getPublishedArticles } from '@/lib/articles';
import { pageMetadata } from '@/lib/seo';
export async function generateMetadata() {
  const articles = await getPublishedArticles();
  return {
    ...pageMetadata(
      'Articles and advice',
      'Practical articles from Fullers Aggregate in Bindura.',
      '/blog',
    ),
    ...(articles.length ? {} : { robots: { index: false, follow: true } }),
  };
}
export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const articles = await getPublishedArticles();
  const query = await searchParams;
  const categories = [
    ...new Set(articles.flatMap((article) => (article.categoryName ? [article.categoryName] : []))),
  ];
  const tags = [...new Set(articles.flatMap((article) => article.tagNames))];
  const filtered = articles.filter(
    (article) =>
      (!query.category || article.categoryName === query.category) &&
      (!query.tag || article.tagNames.includes(query.tag)),
  );
  return (
    <main id="main" className="container blog-index">
      <p className="eyebrow">FROM THE FULLERS YARD</p>
      <h1>Ideas for what you’re building.</h1>
      <p className="lead">
        Useful notes on concrete products, planning and working with Fullers Aggregate.
      </p>
      {(categories.length > 0 || tags.length > 0) && (
        <form className="blog-filters" action="/blog" method="get">
          <label>
            Category
            <select name="category" defaultValue={query.category ?? ''}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Topic
            <select name="tag" defaultValue={query.tag ?? ''}>
              <option value="">All topics</option>
              {tags.map((tag) => (
                <option key={tag}>{tag}</option>
              ))}
            </select>
          </label>
          <button className="button button-small">Filter articles</button>
          <Link href="/blog">Clear filters</Link>
        </form>
      )}
      {articles.length === 0 ? (
        <p>New articles will appear here when they are ready.</p>
      ) : (
        <div className="blog-grid">
          {filtered.map((article) => (
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
      {articles.length > 0 && filtered.length === 0 && (
        <p>No published articles match these filters.</p>
      )}
    </main>
  );
}
