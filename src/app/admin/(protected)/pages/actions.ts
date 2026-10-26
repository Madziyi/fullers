'use server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const section = z.object({
  heading: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(3000),
});
const input = z
  .object({
    id: z.string().optional(),
    version: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sections: z.array(section).min(1).max(20),
    seoTitle: z.string().max(180),
    seoDescription: z.string().max(320),
  })
  .refine((value) => !value.id || !!value.version);
export async function savePage(form: FormData) {
  const actor = await requireAdmin();
  const count = Math.min(20, Math.max(0, Number(form.get('sectionCount')) || 0));
  const sections = Array.from({ length: count }, (_, i) => ({
    heading: form.get(`sectionHeading${i}`),
    body: form.get(`sectionBody${i}`),
  })).filter((s) => String(s.heading ?? '').trim() || String(s.body ?? '').trim());
  const parsed = input.safeParse({
    id: form.get('id') || undefined,
    version: form.get('version') || undefined,
    title: form.get('title'),
    slug: form.get('slug'),
    sections,
    seoTitle: form.get('seoTitle') ?? '',
    seoDescription: form.get('seoDescription') ?? '',
  });
  if (!parsed.success)
    return { ok: false, message: 'Check the title, URL, search fields and structured sections.' };
  const { id, ...data } = parsed.data;
  const { seoTitle, seoDescription, version: _expectedVersion, ...content } = data;
  void _expectedVersion;
  const payload = {
    ...content,
    status: 'DRAFT' as const,
    publishedAt: null,
    version: { increment: 1 },
    seo: { title: seoTitle, description: seoDescription },
  };
  try {
    const page = await db.$transaction(async (tx) => {
      let saved;
      if (id) {
        const changed = await tx.pageContent.updateMany({
          where: { id, version: parsed.data.version, deletedAt: null },
          data: payload,
        });
        if (!changed.count) throw new Error('PAGE_CONFLICT');
        saved = await tx.pageContent.findUniqueOrThrow({ where: { id } });
      } else
        saved = await tx.pageContent.create({
          data: {
            ...content,
            status: 'DRAFT',
            seo: { title: seoTitle, description: seoDescription },
          },
        });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: id ? 'UPDATE' : 'CREATE',
          entity: 'PageContent',
          entityId: saved.id,
          changes: { title: data.title, slug: data.slug, status: 'DRAFT' },
        },
      });
      return saved;
    });
    revalidatePath('/admin/pages');
    revalidatePath(`/admin/pages/${page.id}`);
    revalidatePath(page.slug === 'home' ? '/' : `/${page.slug}`);
    revalidatePath(`/pages/${page.slug}`);
    revalidatePath('/sitemap.xml');
    return { ok: true, id: page.id, message: 'Saved as a private draft. Publish when ready.' };
  } catch (error) {
    if (error instanceof Error && error.message === 'PAGE_CONFLICT')
      return { ok: false, message: 'This page changed in another session. Reload before saving.' };
    return { ok: false, message: 'Could not save. Check that the URL is unique.' };
  }
}
export async function publishPage(id: string, version: number) {
  const actor = await requireAdmin();
  const page = await db.pageContent.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title: true, slug: true, sections: true },
  });
  if (!page) return { ok: false, message: 'Page is unavailable.' };
  try {
    await db.$transaction(async (tx) => {
      const changed = await tx.pageContent.updateMany({
        where: { id, version, deletedAt: null },
        data: { status: 'PUBLISHED', publishedAt: new Date(), version: { increment: 1 } },
      });
      if (!changed.count) throw new Error('PAGE_CONFLICT');
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'PUBLISH',
          entity: 'PageContent',
          entityId: id,
          changes: { slug: page.slug },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'PAGE_CONFLICT')
      return { ok: false, message: 'This page changed before publication. Reload and review it.' };
    throw error;
  }
  revalidatePath(page.slug === 'home' ? '/' : `/${page.slug}`);
  revalidatePath(`/pages/${page.slug}`);
  revalidatePath('/sitemap.xml');
  return { ok: true, message: 'Page published.' };
}
export async function archivePage(id: string, version: number) {
  const actor = await requireAdmin();
  const page = await db.pageContent.findFirst({
    where: { id, deletedAt: null },
    select: { slug: true },
  });
  if (!page) return { ok: false, message: 'This page is unavailable.' };
  const changed = await db.$transaction(async (tx) => {
    const result = await tx.pageContent.updateMany({
      where: { id, version, deletedAt: null },
      data: {
        status: 'ARCHIVED',
        publishedAt: null,
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (!result.count) return false;
    await tx.auditLog.create({
      data: { actorId: actor.id, action: 'ARCHIVE', entity: 'PageContent', entityId: id },
    });
    return true;
  });
  if (!changed) return { ok: false, message: 'This page changed or is already archived.' };
  revalidatePath('/admin/pages');
  revalidatePath(page.slug === 'home' ? '/' : `/${page.slug}`);
  revalidatePath(`/pages/${page.slug}`);
  revalidatePath('/sitemap.xml');
  return { ok: true, message: 'Page archived.' };
}
export async function unpublishPage(id: string, version: number) {
  const actor = await requireAdmin();
  const page = await db.pageContent.findUnique({ where: { id }, select: { slug: true } });
  if (!page) return { ok: false, message: 'Page is unavailable.' };
  const changed = await db.$transaction(async (tx) => {
    const result = await tx.pageContent.updateMany({
      where: { id, version, deletedAt: null },
      data: { status: 'DRAFT', publishedAt: null, version: { increment: 1 } },
    });
    if (!result.count) return false;
    await tx.auditLog.create({
      data: { actorId: actor.id, action: 'UNPUBLISH', entity: 'PageContent', entityId: id },
    });
    return true;
  });
  if (!changed)
    return { ok: false, message: 'The page changed before unpublishing. Reload and review it.' };
  revalidatePath(page.slug === 'home' ? '/' : `/${page.slug}`);
  revalidatePath(`/pages/${page.slug}`);
  revalidatePath('/sitemap.xml');
  return { ok: true, message: 'Page is private.' };
}
