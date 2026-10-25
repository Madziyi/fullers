import 'server-only';
import { Prisma } from '@/generated/prisma-client';
import { articleBodySchema, articleSnapshotSchema } from './articles';
import { publicWhere } from './catalogue';

export const publicationInclude = {
  author: true,
  category: true,
  tags: true,
  cover: true,
  publishedRevision: { select: { version: true } },
  products: { where: publicWhere(), select: { slug: true } },
} satisfies Prisma.PostInclude;

export type PublicationPost = Prisma.PostGetPayload<{ include: typeof publicationInclude }>;

type SnapshotResult =
  { ok: true; slug: string; snapshot: Prisma.JsonObject } | { ok: false; error: string };

export function buildPublicationSnapshot(post: PublicationPost, publishedAt: Date): SnapshotResult {
  if (post.deletedAt || post.status === 'ARCHIVED')
    return { ok: false, error: 'This article is no longer available to publish.' };
  if (post.title.trim().length < 5 || post.excerpt.trim().length < 20 || !post.body)
    return {
      ok: false,
      error: 'Add a title, useful excerpt and article content before publishing.',
    };
  const slug = post.publishedSlug ?? post.slug;
  const parsedBody = articleBodySchema.safeParse(post.body);
  if (!parsedBody.success) return { ok: false, error: 'Article structure is invalid.' };
  if (parsedBody.data.blocks.length === 0)
    return { ok: false, error: 'Add useful article content before publishing.' };
  const productTargets = parsedBody.data.blocks.flatMap((block) =>
    block.type === 'link' && block.href.startsWith('/products/')
      ? [block.href.slice('/products/'.length)]
      : [],
  );
  if (productTargets.some((target) => !post.products.some((product) => product.slug === target)))
    return {
      ok: false,
      error: 'Connect each linked product in Related products before publishing.',
    };
  const seo = post.seo as {
    title?: string;
    description?: string;
    authorName?: string;
    coverSrc?: string | null;
    coverAlt?: string;
  } | null;
  const result = articleSnapshotSchema.safeParse({
    title: post.title,
    slug,
    excerpt: post.excerpt,
    authorName: seo?.authorName || post.author.name,
    categoryName: post.category?.name ?? null,
    tagNames: post.tags.map((tag) => tag.name),
    body: parsedBody.data,
    coverSrc: seo?.coverSrc ?? post.cover?.storageKey ?? null,
    coverAlt: seo?.coverAlt ?? post.coverAlt ?? '',
    seoTitle: seo?.title || post.title,
    seoDescription: seo?.description || post.excerpt,
    productSlugs: post.products.map((product) => product.slug),
    publishedAt: publishedAt.toISOString(),
  });
  if (!result.success)
    return {
      ok: false,
      error:
        'Complete the article title, excerpt, image text and search description before publishing.',
    };
  return { ok: true, slug, snapshot: result.data as Prisma.JsonObject };
}
