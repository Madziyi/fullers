import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { articleBodySchema } from '@/lib/articles';
import { ArticleView } from '@/components/article-view';
import type { ArticleSnapshot } from '@/lib/articles';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Private article preview',
  robots: { index: false, follow: false },
};
export default async function ArticlePreview({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const post = await db.post.findFirst({
    where: { id, deletedAt: null, ...(user.role === 'ADMIN' ? {} : { authorId: user.id }) },
    include: {
      author: true,
      category: true,
      tags: true,
      cover: true,
      products: { select: { slug: true } },
    },
  });
  if (!post) notFound();
  const body = articleBodySchema.safeParse(post.body);
  if (!body.success) notFound();
  const seo = post.seo as {
    authorName?: string;
    coverSrc?: string | null;
    coverAlt?: string;
  } | null;
  const preview: ArticleSnapshot = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    authorName: seo?.authorName || post.author.name,
    categoryName: post.category?.name ?? null,
    tagNames: post.tags.map((tag) => tag.name),
    body: body.data,
    coverSrc: seo?.coverSrc ?? post.cover?.storageKey ?? null,
    coverAlt: seo?.coverAlt ?? post.coverAlt ?? '',
    seoTitle: post.title,
    seoDescription: post.excerpt,
    productSlugs: post.products.map((p) => p.slug),
    publishedAt: post.publishedAt?.toISOString() ?? new Date().toISOString(),
  };
  return <ArticleView article={preview} />;
}
