'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
const schema = z.object({
  id: z.union([z.string().cuid(), z.string().uuid()]),
  alt: z.string().trim().max(300),
  source: z.string().trim().min(2).max(180),
  focalX: z.number().min(0).max(1),
  focalY: z.number().min(0).max(1),
});
export async function updateMedia(raw: unknown) {
  const user = await requireAdmin();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: 'Check the source and alt text.' };
  const result = await db.$transaction(async (tx) => {
    const changed = await tx.media.updateMany({
      where: { id: parsed.data.id, deletedAt: null },
      data: {
        alt: parsed.data.alt,
        source: parsed.data.source,
        focalX: parsed.data.focalX,
        focalY: parsed.data.focalY,
      },
    });
    if (!changed.count) return false;
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'UPDATE',
        entity: 'Media',
        entityId: parsed.data.id,
        changes: {
          alt: parsed.data.alt,
          source: parsed.data.source,
          focalX: parsed.data.focalX,
          focalY: parsed.data.focalY,
        },
      },
    });
    return true;
  });
  if (!result) return { ok: false as const, error: 'This image is unavailable.' };
  revalidatePath('/admin/media');
  revalidatePath('/admin/products');
  revalidatePath('/products');
  return { ok: true as const };
}
export async function removeMedia(id: string) {
  const user = await requireAdmin();
  const result = await db.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT "id" FROM "Media" WHERE "id" = ${id} AND "deletedAt" IS NULL FOR UPDATE`;
      if (!rows.length) return false;
      const media = await tx.media.findFirst({
        where: { id, deletedAt: null },
        include: { _count: { select: { products: true, posts: true, projects: true } } },
      });
      if (
        !media ||
        media._count.products ||
        media._count.posts ||
        media._count.projects ||
        media.articlePostId
      )
        return false;
      const changed = await tx.media.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (!changed.count) return false;
      await tx.auditLog.create({
        data: { actorId: user.id, action: 'DELETE', entity: 'Media', entityId: id },
      });
      return true;
    },
    { isolationLevel: 'Serializable' },
  );
  if (!result)
    return { ok: false as const, error: 'Remove this image from its content before archiving it.' };
  revalidatePath('/admin/media');
  return { ok: true as const };
}
