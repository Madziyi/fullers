'use server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { requireUser, requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { articleBodySchema, safeImageSrc } from '@/lib/articles';
import { buildPublicationSnapshot, publicationInclude } from '@/lib/article-publication';
import { harareLocalToUtc } from '@/lib/scheduling-time';
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
  focusQuery: z.string().max(160).default(''),
  canonical: z
    .union([
      z.literal(''),
      z
        .string()
        .url()
        .refine((value) => /^https?:\/\//.test(value)),
    ])
    .default(''),
  socialTitle: z.string().max(180).default(''),
  socialImage: z
    .string()
    .max(300)
    .refine((value) => !value || safeImageSrc(value))
    .default(''),
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
    select: {
      authorId: true,
      version: true,
      deletedAt: true,
      publishedSlug: true,
      status: true,
    },
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
      ...(input.socialImage.startsWith('/api/article-media/') ? [input.socialImage] : []),
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
  let updated: { version: number; scheduleConflict: boolean } | null;
  try {
    updated = await db.$transaction(async (tx) => {
      // Jobs are locked before the post to keep the same lock order as the worker.
      const invalidatedSchedule = await tx.publicationJob.updateMany({
        where: { postId: input.id, status: { in: ['PENDING', 'RETRY'] } },
        data: {
          status: 'NEEDS_REVIEW',
          lastError: 'The saved draft changed after scheduling. Review and schedule it again.',
          finishedAt: new Date(),
        },
      });
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
          ...(invalidatedSchedule.count
            ? {
                status: post.status === 'SCHEDULED' ? 'DRAFT' : post.status,
                publishAt: null,
              }
            : {}),
          seo: {
            title: input.seoTitle.trim(),
            description: input.seoDescription.trim(),
            focusQuery: input.focusQuery.trim(),
            canonical: input.canonical,
            socialTitle: input.socialTitle.trim(),
            socialImage: input.socialImage || null,
            authorName: input.authorName.trim(),
            coverSrc: input.coverSrc,
            coverAlt: input.coverAlt,
          },
          version: { increment: 1 },
        },
      });
      if (!result.count) {
        if (invalidatedSchedule.count) throw new Error('ARTICLE_SCHEDULE_CONFLICT');
        return null;
      }
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
      const savedPost = await tx.post.findUniqueOrThrow({
        where: { id: input.id },
        select: { version: true },
      });
      return { ...savedPost, scheduleConflict: invalidatedSchedule.count > 0 };
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ARTICLE_SCHEDULE_CONFLICT')
      return { ok: false as const, error: 'conflict' };
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002')
      return {
        ok: false as const,
        error: 'That article URL is already in use. Choose another slug.',
      };
    throw error;
  }
  if (!updated) return { ok: false as const, error: 'conflict' };
  revalidatePath(`/admin/posts/${input.id}`);
  return {
    ok: true as const,
    version: updated.version,
    scheduleConflict: updated.scheduleConflict,
  };
}
export async function publishArticle(id: string, version: number) {
  const user = await requireAdmin();
  const post = await db.post.findUnique({
    where: { id },
    include: publicationInclude,
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
  const publication = buildPublicationSnapshot(post, new Date());
  if (!publication.ok) return publication;
  const { slug, snapshot } = publication;
  const conflict = await db.post.findFirst({ where: { slug, id: { not: id }, deletedAt: null } });
  if (conflict) return { ok: false as const, error: 'That public slug is already in use.' };
  let changed: boolean;
  try {
    changed = await db.$transaction(async (tx) => {
      await tx.publicationJob.updateMany({
        where: { postId: id, status: { in: ['PENDING', 'RETRY'] } },
        data: {
          status: 'CANCELLED',
          lastError: 'The article was published manually before its scheduled time.',
          finishedAt: new Date(),
        },
      });
      // A scheduled worker and this manual action can race on the same saved
      // version. Re-read after locking/cancelling jobs so a worker that already
      // promoted this version makes the manual retry a no-op, not a duplicate
      // immutable revision.
      const latest = await tx.post.findUnique({
        where: { id },
        select: {
          version: true,
          deletedAt: true,
          publishedRevisionId: true,
          publishedRevision: { select: { version: true } },
        },
      });
      if (!latest || latest.deletedAt || latest.version !== version)
        throw new Error('ARTICLE_CONFLICT');
      if (latest.publishedRevision?.version === version) return false;
      const revision = await tx.postRevision.create({
        data: { postId: id, actorId: user.id, version: post.version, snapshot },
      });
      const updated = await tx.post.updateMany({
        where: { id, version, publishedRevisionId: latest.publishedRevisionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(snapshot.publishedAt as string),
          publishAt: null,
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
      return true;
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ARTICLE_CONFLICT')
      return { ok: false as const, error: 'This draft changed. Reload before publishing.' };
    throw error;
  }
  if (!changed) return { ok: true as const, version };
  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
  return { ok: true as const };
}
export async function unpublishArticle(id: string) {
  const user = await requireAdmin();
  const changed = await db.$transaction(async (tx) => {
    await tx.publicationJob.updateMany({
      where: { postId: id, status: { in: ['PENDING', 'RETRY'] } },
      data: {
        status: 'CANCELLED',
        lastError: 'The article was unpublished before its scheduled time.',
        finishedAt: new Date(),
      },
    });
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
        publishAt: null,
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

const scheduleInput = z.object({
  id: z.string().cuid(),
  version: z.number().int().positive(),
  localDateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
});

export async function archiveArticle(id: string, version: number) {
  const actor = await requireAdmin();
  if (!z.string().cuid().safeParse(id).success || !Number.isSafeInteger(version) || version < 1)
    return { ok: false as const, error: 'Reload this article and retry.' };
  try {
    await db.$transaction(async (tx) => {
      await tx.publicationJob.updateMany({
        where: { postId: id, status: { in: ['PENDING', 'RETRY'] } },
        data: { status: 'CANCELLED', finishedAt: new Date(), lastError: 'Article archived.' },
      });
      const updated = await tx.post.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          status: 'ARCHIVED',
          deletedAt: new Date(),
          publishedRevisionId: null,
          publishedAt: null,
          publishAt: null,
          version: { increment: 1 },
        },
      });
      if (!updated.count) throw new Error('CONFLICT');
      await tx.auditLog.create({
        data: { actorId: actor.id, action: 'ARCHIVE', entity: 'Post', entityId: id },
      });
    });
  } catch {
    return {
      ok: false as const,
      error: 'The article changed or could not be archived. Reload and retry.',
    };
  }
  revalidatePath('/', 'layout');
  revalidatePath('/admin/posts');
  revalidatePath('/sitemap.xml');
  return { ok: true as const };
}

export async function scheduleArticle(rawInput: unknown) {
  const actor = await requireAdmin();
  const parsed = scheduleInput.safeParse(rawInput);
  if (!parsed.success)
    return { ok: false as const, error: 'Choose a valid Zimbabwe date and time.' };
  const runAt = harareLocalToUtc(parsed.data.localDateTime);
  const now = new Date();
  if (!runAt || runAt.getTime() <= now.getTime() + 60_000)
    return { ok: false as const, error: 'Choose a future time in Africa/Harare.' };
  const post = await db.post.findUnique({
    where: { id: parsed.data.id },
    include: publicationInclude,
  });
  if (!post || post.deletedAt || post.status === 'ARCHIVED')
    return { ok: false as const, error: 'This article is unavailable to schedule.' };
  if (post.version !== parsed.data.version)
    return { ok: false as const, error: 'This draft changed. Reload before scheduling it.' };
  if (post.publishedRevision?.version === post.version)
    return { ok: false as const, error: 'Publish updates before scheduling another publication.' };
  const publication = buildPublicationSnapshot(post, runAt);
  if (!publication.ok) return publication;
  const jobId = randomUUID();
  try {
    const version = await db.$transaction(async (tx) => {
      await tx.publicationJob.updateMany({
        where: { postId: post.id, status: { in: ['PENDING', 'RETRY'] } },
        data: {
          status: 'CANCELLED',
          lastError: 'Replaced by a newer schedule.',
          finishedAt: now,
        },
      });
      const update = await tx.post.updateMany({
        where: {
          id: post.id,
          version: parsed.data.version,
          publishedRevisionId: post.publishedRevisionId,
          status: post.status,
        },
        data: {
          status: post.status === 'PUBLISHED' ? 'PUBLISHED' : 'SCHEDULED',
          publishAt: runAt,
          version: { increment: 1 },
        },
      });
      if (!update.count) throw new Error('ARTICLE_SCHEDULE_CONFLICT');
      const scheduledVersion = parsed.data.version + 1;
      await tx.publicationJob.create({
        data: {
          id: jobId,
          postId: post.id,
          scheduledById: actor.id,
          scheduledVersion,
          runAt,
          nextAttemptAt: runAt,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'SCHEDULE_PUBLICATION',
          entity: 'Post',
          entityId: post.id,
          changes: { runAt: runAt.toISOString(), version: scheduledVersion },
        },
      });
      return scheduledVersion;
    });
    revalidatePath('/admin/posts');
    revalidatePath(`/admin/posts/${post.id}`);
    return { ok: true as const, version, jobId, runAt: runAt.toISOString() };
  } catch (error) {
    if (error instanceof Error && error.message === 'ARTICLE_SCHEDULE_CONFLICT')
      return { ok: false as const, error: 'This draft changed. Reload before scheduling it.' };
    throw error;
  }
}

export async function cancelArticleSchedule(id: string, version: number) {
  const actor = await requireAdmin();
  let result: { changed: boolean; version: number };
  try {
    result = await db.$transaction(async (tx) => {
      const jobs = await tx.publicationJob.updateMany({
        where: { postId: id, status: { in: ['PENDING', 'RETRY'] }, scheduledVersion: version },
        data: {
          status: 'CANCELLED',
          lastError: 'Cancelled by an administrator.',
          finishedAt: new Date(),
        },
      });
      if (!jobs.count) return { changed: false as const, version };
      const post = await tx.post.findUnique({ where: { id }, select: { status: true } });
      if (!post) return { changed: false as const, version };
      const updated = await tx.post.updateMany({
        where: { id, version },
        data: {
          status: post.status === 'SCHEDULED' ? 'DRAFT' : post.status,
          publishAt: null,
          version: { increment: 1 },
        },
      });
      if (!updated.count) throw new Error('ARTICLE_SCHEDULE_CONFLICT');
      await tx.auditLog.create({
        data: { actorId: actor.id, action: 'CANCEL_PUBLICATION', entity: 'Post', entityId: id },
      });
      return { changed: true as const, version: version + 1 };
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ARTICLE_SCHEDULE_CONFLICT')
      return {
        ok: false as const,
        error: 'This article changed while cancelling. Reload and review its schedule.',
      };
    throw error;
  }
  revalidatePath('/admin/posts');
  revalidatePath(`/admin/posts/${id}`);
  if (!result.changed && result.version === version)
    return { ok: false as const, error: 'This schedule is no longer pending.' };
  return { ok: true as const, ...result };
}
