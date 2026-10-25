'use server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { requireUser, requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { articleBodySchema, articleSnapshotSchema, safeImageSrc } from '@/lib/articles';
import { publicWhere } from '@/lib/catalogue';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
export async function createArticle() {
  const user = await requireUser();
  const post = await db.post.create({
    data: {
      title: 'Untitled article',
      slug: `article-${randomUUID()}`,
      excerpt: '',
      body: { type: 'doc', blocks: [] },
      authorId: user.id,
    },
  });
  revalidatePath('/admin/posts');
  return post.id;
}
export async function createArticleTaxonomy(kind: 'category' | 'tag', name: string) {
  await requireAdmin();
  const label = name.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (label.length < 2) return { ok: false as const, error: 'Enter at least two characters.' };
  const slug = slugify(label);
  if (!slug) return { ok: false as const, error: 'Enter a usable name.' };
  if (kind === 'category') {
    const item = await db.postCategory.upsert({
      where: { slug },
      update: { name: label },
      create: { name: label, slug },
      select: { id: true, name: true },
    });
    return { ok: true as const, item };
  }
  const item = await db.tag.upsert({
    where: { slug },
    update: { name: label },
    create: { name: label, slug },
    select: { id: true, name: true },
  });
  return { ok: true as const, item };
}
const saveInput = z.object({
  id: z.string().cuid(),
  version: z.number().int().positive(),
  title: z.string().max(160),
  slug: z.string().max(100),
  excerpt: z.string().max(500),
  body: articleBodySchema,
  seoTitle: z.string().max(180),
  seoDescription: z.string().max(320),
  authorName: z.string().max(120),
  coverSrc: z
    .string()
    .max(300)
    .nullable()
    .refine((value) => value === null || safeImageSrc(value)),
  coverAlt: z.string().max(300),
  categoryId: z.string().cuid().nullable(),
  tagIds: z.array(z.string().cuid()).max(30),
  productIds: z.array(z.string().cuid()).max(20),
});
export async function saveArticle(rawInput: unknown) {
  const user = await requireUser();
  const inputResult = saveInput.safeParse(rawInput);
  if (!inputResult.success)
    return {
      ok: false as const,
      error: 'Some edits are still on this device. Correct the fields and retry.',
    };
  const input = inputResult.data;
  const slug = input.slug.trim() ? slugify(input.slug) : `draft-${input.id}`;
  const post = await db.post.findUnique({
    where: { id: input.id },
    select: { authorId: true, version: true, deletedAt: true, publishedSlug: true },
  });
  if (!post || post.deletedAt || (user.role !== 'ADMIN' && post.authorId !== user.id))
    return { ok: false as const, error: 'This article is unavailable.' };
  const products = await db.product.findMany({
    where: { id: { in: input.productIds }, ...publicWhere() },
    select: { id: true },
  });
  if (products.length !== input.productIds.length)
    return { ok: false as const, error: 'Choose currently published products.' };
  const [category, tags] = await Promise.all([
    input.categoryId
      ? db.postCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } })
      : Promise.resolve(null),
    db.tag.findMany({ where: { id: { in: input.tagIds } }, select: { id: true } }),
  ]);
  if ((input.categoryId && !category) || tags.length !== input.tagIds.length)
    return { ok: false as const, error: 'Choose existing article categories and tags.' };
  const imageUrls = [
    ...new Set([
      ...input.body.blocks.flatMap((block) =>
        block.type === 'image' && block.src.startsWith('/api/article-media/') ? [block.src] : [],
      ),
      ...(input.coverSrc?.startsWith('/api/article-media/') ? [input.coverSrc] : []),
    ]),
  ];
  if (imageUrls.length) {
    const ownedMedia = await db.media.count({
      where: { storageKey: { in: imageUrls }, articlePostId: input.id, deletedAt: null },
    });
    if (ownedMedia !== imageUrls.length)
      return {
        ok: false as const,
        error:
          'An uploaded image is not attached to this article. Upload it again from this draft.',
      };
  }
  const draftSlug = post.publishedSlug ?? slug;
  let updated: { version: number } | null;
  try {
    updated = await db.$transaction(async (tx) => {
      const result = await tx.post.updateMany({
        where: {
          id: input.id,
          version: input.version,
          authorId: user.role === 'ADMIN' ? undefined : user.id,
        },
        data: {
          title: input.title.trim(),
          slug: draftSlug,
          excerpt: input.excerpt.trim(),
          body: input.body,
          seo: {
            title: input.seoTitle.trim(),
            description: input.seoDescription.trim(),
            authorName: input.authorName.trim(),
            coverSrc: input.coverSrc,
            coverAlt: input.coverAlt,
          },
          version: { increment: 1 },
        },
      });
      if (!result.count) return null;
      await tx.post.update({
        where: { id: input.id },
        data: {
          products: { set: products.map((product) => ({ id: product.id })) },
          category: {
            ...(input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true }),
          },
          tags: { set: tags.map((tag) => ({ id: tag.id })) },
        },
      });
      return tx.post.findUniqueOrThrow({ where: { id: input.id }, select: { version: true } });
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002')
      return {
        ok: false as const,
        error: 'That article URL is already in use. Choose another slug.',
      };
    throw error;
  }
  if (!updated) return { ok: false as const, error: 'conflict' };
  revalidatePath(`/admin/posts/${input.id}`);
  return { ok: true as const, version: updated.version };
}
export async function publishArticle(id: string, version: number) {
  const user = await requireAdmin();
  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: true,
      category: true,
      tags: true,
      cover: true,
      publishedRevision: { select: { version: true } },
      products: { where: publicWhere(), select: { slug: true } },
    },
  });
  if (!post || post.version !== version || post.deletedAt)
    return { ok: false as const, error: 'This draft changed. Reload before publishing.' };
  // A retry of the exact published working version is idempotent. A newer
  // working version must create a new immutable snapshot even while live.
  if (
    post.status === 'PUBLISHED' &&
    post.publishedRevisionId &&
    post.publishedRevision?.version === version
  )
    return { ok: true as const, version };
  if (post.title.trim().length < 5 || post.excerpt.trim().length < 20 || !post.body)
    return {
      ok: false as const,
      error: 'Add a title, useful excerpt and article content before publishing.',
    };
  const slug = post.publishedSlug ?? post.slug;
  const conflict = await db.post.findFirst({ where: { slug, id: { not: id }, deletedAt: null } });
  if (conflict) return { ok: false as const, error: 'That public slug is already in use.' };
  const parsedBody = articleBodySchema.safeParse(post.body);
  if (!parsedBody.success) return { ok: false as const, error: 'Article structure is invalid.' };
  if (parsedBody.data.blocks.length === 0)
    return { ok: false as const, error: 'Add useful article content before publishing.' };
  const productTargets = parsedBody.data.blocks.flatMap((block) =>
    block.type === 'link' && block.href.startsWith('/products/')
      ? [block.href.slice('/products/'.length)]
      : [],
  );
  if (productTargets.some((slug) => !post.products.some((product) => product.slug === slug)))
    return {
      ok: false as const,
      error: 'Connect each linked product in Related products before publishing.',
    };
  const seo = post.seo as {
    title?: string;
    description?: string;
    authorName?: string;
    coverSrc?: string | null;
    coverAlt?: string;
  } | null;
  const snapshot = articleSnapshotSchema.safeParse({
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
    publishedAt: new Date().toISOString(),
  });
  if (!snapshot.success)
    return {
      ok: false as const,
      error:
        'Complete the article title, excerpt, image text and search description before publishing.',
    };
  try {
    await db.$transaction(async (tx) => {
      const revision = await tx.postRevision.create({
        data: { postId: id, actorId: user.id, version: post.version, snapshot: snapshot.data },
      });
      const updated = await tx.post.updateMany({
        where: { id, version, publishedRevisionId: post.publishedRevisionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(snapshot.data.publishedAt),
          publishedSlug: slug,
          publishedRevisionId: revision.id,
        },
      });
      if (!updated.count) throw new Error('ARTICLE_CONFLICT');
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'PUBLISH',
          entity: 'Post',
          entityId: id,
          changes: { version: post.version, slug },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ARTICLE_CONFLICT')
      return { ok: false as const, error: 'This draft changed. Reload before publishing.' };
    throw error;
  }
  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
  return { ok: true as const };
}
export async function unpublishArticle(id: string) {
  const user = await requireAdmin();
  const changed = await db.$transaction(async (tx) => {
    const post = await tx.post.findUnique({
      where: { id },
      select: { publishedRevisionId: true, status: true },
    });
    if (!post) throw new Error('Article not found.');
    if (!post.publishedRevisionId || post.status !== 'PUBLISHED') return false;
    const result = await tx.post.updateMany({
      where: { id, status: 'PUBLISHED', publishedRevisionId: post.publishedRevisionId },
      data: {
        status: 'DRAFT',
        publishedAt: null,
        publishedRevisionId: null,
        version: { increment: 1 },
      },
    });
    if (!result.count) return false;
    await tx.auditLog.create({
      data: { actorId: user.id, action: 'UNPUBLISH', entity: 'Post', entityId: id },
    });
    return true;
  });
  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
  return { ok: true as const, changed };
}
