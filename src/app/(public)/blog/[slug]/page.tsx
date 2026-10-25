import { notFound } from 'next/navigation';
import { ArticleView } from '@/components/article-view';
import { getPublishedArticle } from '@/lib/articles';
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
      article.coverSrc ?? undefined,
    ),
    openGraph: {
      title: article.seoTitle,
      description: article.seoDescription,
      url: `/blog/${slug}`,
      siteName: 'Fullers Aggregate',
      locale: 'en_ZW',
      type: 'article',
      publishedTime: article.publishedAt,
      images: article.coverSrc ? [{ url: article.coverSrc, alt: article.coverAlt }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle,
      description: article.seoDescription,
      images: article.coverSrc ? [article.coverSrc] : undefined,
    },
  };
}
export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
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
    </main>
  );
}
