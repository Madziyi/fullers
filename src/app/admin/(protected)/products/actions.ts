'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

const inputSchema = z.object({
  id: z.string().cuid().optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().max(500),
  paragraphs: z.array(z.string().trim().max(2000)).max(30),
  applications: z.array(z.enum(['Building', 'Landscaping', 'Infrastructure'])).max(3),
  specifications: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(160),
      }),
    )
    .max(30),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(180),
        answer: z.string().trim().min(1).max(1000),
      }),
    )
    .max(20),
  imageId: z.union([z.string().cuid(), z.string().uuid()]).nullable(),
  imageAlt: z.string().trim().max(300),
  relatedIds: z.array(z.string().cuid()).max(20),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
  seoTitle: z.string().trim().max(180),
  seoDescription: z.string().trim().max(320),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

export async function saveProduct(raw: unknown) {
  const user = await requireAdmin();
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: 'Check required fields and try again.' };
  const d = parsed.data;
  if (d.status === 'PUBLISHED' && user.role !== 'ADMIN')
    return { ok: false as const, error: 'An administrator must publish product changes.' };
  if (d.status === 'PUBLISHED' && d.summary.length < 20)
    return { ok: false as const, error: 'Add a useful, source-backed summary before publishing.' };
  if (d.imageId && d.imageAlt.length < 4)
    return { ok: false as const, error: 'Add descriptive alt text for the selected image.' };
  const image = d.imageId
    ? await db.media.findFirst({
        where: {
          id: d.imageId,
          deletedAt: null,
          ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
        },
        select: { id: true },
      })
    : null;
  if (d.imageId && !image)
    return { ok: false as const, error: 'Choose an available library image.' };
  if (d.id && d.relatedIds.includes(d.id))
    return { ok: false as const, error: 'A product cannot be related to itself.' };
  const related = await db.product.findMany({
    where: { id: { in: d.relatedIds }, deletedAt: null },
    select: { id: true },
  });
  if (related.length !== d.relatedIds.length)
    return { ok: false as const, error: 'Choose existing products for related links.' };
  try {
    const product = await db.$transaction(async (tx) => {
      const data = {
        name: d.name,
        slug: d.slug,
        summary: d.summary,
        body: { type: 'product', paragraphs: d.paragraphs.filter(Boolean) },
        applications: d.applications,
        specifications: d.specifications,
        faqs: d.faqs,
        imageId: d.imageId,
        imageAlt: d.imageAlt,
        featured: d.featured,
        sortOrder: d.sortOrder,
        seo: { title: d.seoTitle, description: d.seoDescription },
        status: d.status,
        publishedAt: d.status === 'PUBLISHED' ? new Date() : null,
      };
      let saved;
      if (d.id) {
        if (!d.expectedUpdatedAt) throw new Error('PRODUCT_CONFLICT');
        const changed = await tx.product.updateMany({
          where: { id: d.id, deletedAt: null, updatedAt: new Date(d.expectedUpdatedAt) },
          data,
        });
        if (!changed.count) throw new Error('PRODUCT_CONFLICT');
        saved = await tx.product.findUniqueOrThrow({ where: { id: d.id } });
      } else saved = await tx.product.create({ data });
      await tx.product.update({
        where: { id: saved.id },
        data: { related: { set: related.map((item) => ({ id: item.id })) } },
      });
      saved = await tx.product.findUniqueOrThrow({ where: { id: saved.id } });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: d.id ? 'UPDATE' : 'CREATE',
          entity: 'Product',
          entityId: saved.id,
          changes: { slug: d.slug, status: d.status },
        },
      });
      return saved;
    });
    revalidatePath('/products');
    revalidatePath(`/products/${product.slug}`);
    revalidatePath('/');
    revalidatePath('/admin/products');
    return { ok: true as const, id: product.id, updatedAt: product.updatedAt.toISOString() };
  } catch (error) {
    if (error instanceof Error && error.message === 'PRODUCT_CONFLICT')
      return {
        ok: false as const,
        error: 'This product changed in another session. Reload before saving.',
      };
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002')
      return { ok: false as const, error: 'That product URL is already in use.' };
    return { ok: false as const, error: 'The product could not be saved. Try again.' };
  }
}

export async function createProduct() {
  const user = await requireAdmin();
  const slug = `new-product-${randomUUID()}`;
  const item = await db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: { name: 'New product', slug, summary: '', status: 'DRAFT' },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        changes: { slug, status: 'DRAFT' },
      },
    });
    return product;
  });
  revalidatePath('/admin/products');
  redirect(`/admin/products/${item.id}`);
}
export async function deleteProduct(id: string, expectedUpdatedAt: string) {
  const user = await requireAdmin();
  const item = await db.product.findFirst({
    where: { id, deletedAt: null },
    select: { slug: true, updatedAt: true },
  });
  if (!item || item.updatedAt.toISOString() !== expectedUpdatedAt)
    return { ok: false as const, error: 'This product changed. Reload before archiving it.' };
  const changed = await db.$transaction(async (tx) => {
    const result = await tx.product.updateMany({
      where: { id, deletedAt: null, updatedAt: item.updatedAt },
      data: { deletedAt: new Date(), status: 'ARCHIVED', publishedAt: null },
    });
    if (!result.count) return false;
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'DELETE',
        entity: 'Product',
        entityId: id,
        changes: { slug: item.slug },
      },
    });
    return true;
  });
  if (!changed)
    return { ok: false as const, error: 'This product changed. Reload before archiving it.' };
  revalidatePath('/products');
  revalidatePath(`/products/${item.slug}`);
  revalidatePath('/admin/products');
  return { ok: true as const };
}
