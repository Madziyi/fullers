import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { articleBodySchema, getPublishedArticles } from '@/lib/articles';
import { ArticleEditor } from '../editor';
import { publicWhere } from '@/lib/catalogue';
export const dynamic = 'force-dynamic';
export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const post = await db.post.findFirst({
    where: { id, deletedAt: null, ...(user.role === 'ADMIN' ? {} : { authorId: user.id }) },
    include: {
      author: { select: { name: true } },
      products: { where: publicWhere(), select: { id: true, name: true, slug: true } },
      tags: true,
      publicationJobs: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!post) notFound();
  const availableProducts = await db.product.findMany({
    where: publicWhere(),
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  });
  const body = articleBodySchema.safeParse(post.body);
  const seo = post.seo as {
    title?: string;
    description?: string;
    authorName?: string;
    coverSrc?: string | null;
    coverAlt?: string;
    focusQuery?: string;
    canonical?: string;
    socialTitle?: string;
    socialImage?: string;
  } | null;
  return (
    <ArticleEditor
      post={{
        id,
        version: post.version,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: body.success ? body.data : { type: 'doc', blocks: [] },
        seoTitle: seo?.title ?? '',
        seoDescription: seo?.description ?? '',
        focusQuery: seo?.focusQuery ?? '',
        canonical: seo?.canonical ?? '',
        socialTitle: seo?.socialTitle ?? '',
        socialImage: seo?.socialImage ?? '',
        authorName: seo?.authorName ?? post.author.name,
        coverSrc: seo?.coverSrc ?? null,
        coverAlt: seo?.coverAlt ?? '',
        categoryId: post.categoryId,
        tagIds: post.tags.map((tag) => tag.id),
        categories: await db.postCategory.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        tags: await db.tag.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        productIds: post.products.map((product) => product.id),
        products: availableProducts,
        articles: (await getPublishedArticles())
          .filter((article) => article.slug !== post.publishedSlug)
          .map((article) => ({
            title: article.title,
            slug: article.slug,
            category: article.categoryName,
            tags: article.tagNames,
          })),
        published: post.publishedRevisionId !== null,
        slugLocked: post.publishedSlug !== null,
        defaultScheduleLocal: '',
        schedule: post.publicationJobs[0]
          ? {
              id: post.publicationJobs[0].id,
              status: post.publicationJobs[0].status,
              runAt: post.publicationJobs[0].runAt.toISOString(),
              attempts: post.publicationJobs[0].attempts,
              lastError: post.publicationJobs[0].lastError,
              scheduledVersion: post.publicationJobs[0].scheduledVersion,
            }
          : null,
        admin: user.role === 'ADMIN',
      }}
    />
  );
}
