'use server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
const input = z
  .object({
    id: z.string().optional(),
    updatedAt: z.string().optional(),
    title: z.string().trim().min(3).max(160),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    location: z.string().trim().max(160),
    projectDate: z
      .string()
      .max(10)
      .refine((value) => {
        if (!value) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      }),
    challenge: z.string().trim().min(20).max(3000),
    solution: z.string().trim().min(20).max(3000),
    outcome: z.string().trim().max(2000),
    clientName: z.string().trim().max(120),
    clientPermission: z.enum(['yes', 'no']),
    featured: z.enum(['yes', 'no']),
    imageIds: z
      .array(
        z
          .string()
          .refine(
            (value) => z.cuid().safeParse(value).success || z.uuid().safeParse(value).success,
          ),
      )
      .max(20),
    productIds: z.array(z.string().cuid()).max(20),
    seoTitle: z.string().max(180),
    seoDescription: z.string().max(320),
  })
  .refine((v) => !v.id || !!v.updatedAt);
export async function saveProject(form: FormData) {
  const actor = await requireAdmin();
  const parsed = input.safeParse({
    id: form.get('id') || undefined,
    updatedAt: form.get('updatedAt') || undefined,
    title: form.get('title'),
    slug: form.get('slug'),
    location: form.get('location') ?? '',
    projectDate: form.get('projectDate') ?? '',
    challenge: form.get('challenge'),
    solution: form.get('solution'),
    outcome: form.get('outcome') ?? '',
    clientName: form.get('clientName') ?? '',
    clientPermission: form.get('clientPermission') ?? 'no',
    featured: form.get('featured') ?? 'no',
    imageIds: form.getAll('imageIds').map(String),
    productIds: form.getAll('productIds').map(String),
    seoTitle: form.get('seoTitle') ?? '',
    seoDescription: form.get('seoDescription') ?? '',
  });
  if (!parsed.success)
    return { ok: false, message: 'Complete the real project details and check the URL.' };
  const { id, updatedAt, ...v } = parsed.data;
  const clientAllowed = v.clientPermission === 'yes' && !!v.clientName;
  const imageCount = await db.media.count({ where: { id: { in: v.imageIds }, deletedAt: null } });
  const productCount = await db.product.count({
    where: { id: { in: v.productIds }, deletedAt: null },
  });
  if (imageCount !== v.imageIds.length || productCount !== v.productIds.length)
    return { ok: false, message: 'Choose available media and products.' };
  const data = {
    title: v.title,
    slug: v.slug,
    location: v.location || null,
    projectDate: v.projectDate ? new Date(`${v.projectDate}T12:00:00Z`) : null,
    clientName: clientAllowed ? v.clientName : null,
    clientPermissionAt: clientAllowed ? new Date() : null,
    body: { challenge: v.challenge, solution: v.solution, outcome: v.outcome },
    featured: v.featured === 'yes',
    seo: { title: v.seoTitle, description: v.seoDescription },
    status: 'DRAFT' as const,
    approvedAt: null,
    publishedAt: null,
    publishAt: null,
  };
  try {
    const saved = await db.$transaction(async (tx) => {
      let item;
      if (id) {
        const changed = await tx.project.updateMany({
          where: { id, updatedAt: new Date(updatedAt!), deletedAt: null },
          data,
        });
        if (!changed.count) throw new Error('PROJECT_CONFLICT');
        item = await tx.project.update({
          where: { id },
          data: {
            images: { set: v.imageIds.map((id) => ({ id })) },
            products: { set: v.productIds.map((id) => ({ id })) },
          },
        });
      } else
        item = await tx.project.create({
          data: {
            ...data,
            images: { connect: v.imageIds.map((id) => ({ id })) },
            products: { connect: v.productIds.map((id) => ({ id })) },
          },
        });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: id ? 'UPDATE' : 'CREATE',
          entity: 'Project',
          entityId: item.id,
          changes: { title: v.title, slug: v.slug, status: 'DRAFT' },
        },
      });
      return item;
    });
    revalidatePath('/admin/projects');
    revalidatePath('/projects');
    revalidatePath('/sitemap.xml');
    return {
      ok: true,
      id: saved.id,
      message: 'Saved privately. Administrator approval is required before publication.',
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'PROJECT_CONFLICT')
      return {
        ok: false,
        message: 'This project changed in another session. Reload before saving.',
      };
    return { ok: false, message: 'Could not save. Check the URL is unique.' };
  }
}
export async function approveProject(id: string, updatedAtIso: string) {
  const actor = await requireAdmin();
  const project = await db.project.findFirst({
    where: { id, deletedAt: null },
    select: {
      slug: true,
      body: true,
      clientName: true,
      clientPermissionAt: true,
      images: { where: { deletedAt: null }, select: { alt: true } },
    },
  });
  if (!project) return { ok: false, message: 'Project is unavailable.' };
  const body = project.body as { challenge?: unknown; solution?: unknown };
  if (
    typeof body.challenge !== 'string' ||
    !body.challenge.trim() ||
    typeof body.solution !== 'string' ||
    !body.solution.trim()
  )
    return { ok: false, message: 'Complete project challenge and solution before approval.' };
  if (project.clientName && !project.clientPermissionAt)
    return {
      ok: false,
      message: 'Confirm client-name permission or remove the client name before approval.',
    };
  if (project.images.some((image) => image.alt.trim().length < 5))
    return {
      ok: false,
      message: 'Add descriptive alt text to every selected project photo in Media before approval.',
    };
  try {
    await db.$transaction(async (tx) => {
      const changed = await tx.project.updateMany({
        where: { id, updatedAt: new Date(updatedAtIso), deletedAt: null },
        data: { status: 'PUBLISHED', approvedAt: new Date(), publishedAt: new Date() },
      });
      if (!changed.count) throw new Error('PROJECT_CONFLICT');
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'APPROVE_PUBLISH',
          entity: 'Project',
          entityId: id,
          changes: { slug: project.slug },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'PROJECT_CONFLICT')
      return { ok: false, message: 'The draft changed before approval. Reload and review it.' };
    throw error;
  }
  revalidatePath('/projects');
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath('/sitemap.xml');
  return { ok: true, message: 'Project approved and published.' };
}
export async function unpublishProject(id: string) {
  const actor = await requireAdmin();
  const project = await db.project.findFirst({
    where: { id, deletedAt: null },
    select: { slug: true, updatedAt: true },
  });
  if (!project) return { ok: false, message: 'Project is unavailable.' };
  const changed = await db.$transaction(async (tx) => {
    const update = await tx.project.updateMany({
      where: { id, updatedAt: project.updatedAt, deletedAt: null },
      data: { status: 'DRAFT', approvedAt: null, publishedAt: null },
    });
    if (!update.count) return false;
    await tx.auditLog.create({
      data: { actorId: actor.id, action: 'UNPUBLISH', entity: 'Project', entityId: id },
    });
    return true;
  });
  if (!changed)
    return { ok: false, message: 'The project changed before unpublishing. Reload and review it.' };
  revalidatePath('/projects');
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath('/sitemap.xml');
  return { ok: true, message: 'Project is private.' };
}
export async function archiveProject(id: string, updatedAtIso: string) {
  const actor = await requireAdmin();
  const project = await db.project.findFirst({
    where: { id, deletedAt: null },
    select: { slug: true },
  });
  if (!project) return { ok: false, message: 'Project is unavailable.' };
  const changed = await db.$transaction(async (tx) => {
    const update = await tx.project.updateMany({
      where: { id, updatedAt: new Date(updatedAtIso), deletedAt: null },
      data: { status: 'ARCHIVED', approvedAt: null, publishedAt: null, deletedAt: new Date() },
    });
    if (!update.count) return false;
    await tx.auditLog.create({
      data: { actorId: actor.id, action: 'ARCHIVE', entity: 'Project', entityId: id },
    });
    return true;
  });
  if (!changed)
    return { ok: false, message: 'This project changed before archiving. Reload and review it.' };
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath('/sitemap.xml');
  return { ok: true, message: 'Project archived.' };
}
