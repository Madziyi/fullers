import { notFound } from 'next/navigation';
import { ArticleView } from '@/components/article-view';
import { getPublishedArticle, getPublishedArticles } from '@/lib/articles';
import Link from 'next/link';
import { pageMetadata, jsonLd, siteUrl } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: 'Article not found', robots: { index: false } };
  return {
    ...pageMetadata(
      article.seoTitle,
      article.seoDescription,
      `/blog/${slug}`,
      article.socialImage ?? article.coverSrc ?? undefined,
    ),
    openGraph: {
      title: article.socialTitle || article.seoTitle,
      description: article.seoDescription,
      url: `/blog/${slug}`,
      siteName: 'Fullers Aggregate',
      locale: 'en_ZW',
      type: 'article',
      publishedTime: article.publishedAt,
      images:
        article.socialImage || article.coverSrc
          ? [{ url: (article.socialImage || article.coverSrc)!, alt: article.coverAlt }]
          : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.socialTitle || article.seoTitle,
      description: article.seoDescription,
      images:
        article.socialImage || article.coverSrc
          ? [(article.socialImage || article.coverSrc)!]
          : undefined,
    },
    alternates: { canonical: article.canonical || `/blog/${slug}` },
  };
}
export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
  const related = (await getPublishedArticles())
    .filter(
      (item) =>
        item.slug !== article.slug &&
        ((item.categoryName && item.categoryName === article.categoryName) ||
          item.tagNames.some((tag) => article.tagNames.includes(tag))),
    )
    .slice(0, 3);
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.excerpt,
            datePublished: article.publishedAt,
            author: { '@type': 'Person', name: article.authorName },
            image: article.coverSrc ? `${siteUrl}${article.coverSrc}` : undefined,
            mainEntityOfPage: `${siteUrl}/blog/${slug}`,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
              {
                '@type': 'ListItem',
                position: 3,
                name: article.title,
                item: `${siteUrl}/blog/${slug}`,
              },
            ],
          }),
        }}
      />
      <ArticleView article={article} />
      {related.length > 0 && (
        <section className="container related-reading">
          <h2>Related reading</h2>
          <div className="blog-grid">
            {related.map((item) => (
              <article key={item.slug}>
                <h3>
                  <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                </h3>
                <p>{item.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
