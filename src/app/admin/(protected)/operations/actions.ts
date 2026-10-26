'use server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirectWouldCycle, safeLocalPath } from '@/lib/admin-operations';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const userId = z.string().cuid();
const userInput = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  name: z.string().trim().min(1).max(120),
  password: z
    .string()
    .min(12)
    .max(72)
    .refine((v) => Buffer.byteLength(v, 'utf8') <= 72),
  role: z.enum(['ADMIN', 'EDITOR']),
});

export async function createManagedUser(form: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (process.env.CONTENT_SOURCE === 'seed') redirect('/admin/users?result=readonly');
  const parsed = userInput.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) redirect('/admin/users?result=invalid');
  try {
    const passwordHash = await hash(parsed.data.password, 12);
    const userData = { email: parsed.data.email, name: parsed.data.name, role: parsed.data.role };
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { ...userData, passwordHash } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'CREATE',
          entity: 'User',
          entityId: user.id,
          changes: { role: user.role, active: user.active },
        },
      });
    });
    revalidatePath('/admin/users');
    redirect('/admin/users?result=created');
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    redirect('/admin/users?result=error');
  }
}

export async function updateManagedUser(form: FormData) {
  const actor = await requireAdmin();
  if (process.env.CONTENT_SOURCE === 'seed') redirect('/admin/users?result=readonly');
  const id = userId.safeParse(form.get('id'));
  const role = z.enum(['ADMIN', 'EDITOR']).safeParse(form.get('role'));
  const active = z.enum(['true', 'false']).safeParse(form.get('active'));
  if (!id.success || !role.success || !active.success || form.get('confirm') !== 'yes')
    redirect('/admin/users?result=invalid');
  if (id.data === actor.id && (active.data === 'false' || role.data !== 'ADMIN'))
    redirect('/admin/users?result=self');
  let outcome: 'saved' | 'last-admin' | 'missing' = 'missing';
  try {
    await db.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: id.data },
          select: { role: true, active: true },
        });
        if (!target) return;
        const nextActive = active.data === 'true';
        const losesAdmin =
          target.role === 'ADMIN' && target.active && (role.data !== 'ADMIN' || !nextActive);
        if (losesAdmin) {
          const admins = await tx.user.count({ where: { role: 'ADMIN', active: true } });
          if (admins <= 1) {
            outcome = 'last-admin';
            return;
          }
        }
        const result = await tx.user.updateMany({
          where: { id: id.data, role: target.role, active: target.active },
          data: { role: role.data, active: nextActive },
        });
        if (result.count) {
          outcome = 'saved';
          await tx.auditLog.create({
            data: {
              actorId: actor.id,
              action: 'UPDATE_ACCESS',
              entity: 'User',
              entityId: id.data,
              changes: {
                fromRole: target.role,
                toRole: role.data,
                fromActive: target.active,
                toActive: nextActive,
              },
            },
          });
        }
      },
      { isolationLevel: 'Serializable' },
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034')
      redirect('/admin/users?result=last-admin');
    throw error;
  }
  revalidatePath('/admin/users');
  redirect(`/admin/users?result=${outcome}`);
}

const redirectInput = z.object({
  source: z.string().max(500),
  destination: z.string().max(500),
  permanent: z.enum(['true', 'false']),
});
export async function saveManagedRedirect(form: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (process.env.CONTENT_SOURCE === 'seed') redirect('/admin/redirects?result=readonly');
  const idRaw = form.get('id');
  const id = idRaw ? z.string().cuid().safeParse(idRaw) : null;
  const parsed = redirectInput.safeParse(Object.fromEntries(form.entries()));
  if ((id && !id.success) || !parsed.success) redirect('/admin/redirects?result=invalid');
  const source = safeLocalPath(parsed.data.source);
  const destination = safeLocalPath(parsed.data.destination);
  if (
    !source ||
    !destination ||
    source === destination ||
    source.startsWith('/admin') ||
    source.startsWith('/api') ||
    destination.startsWith('/admin') ||
    destination.startsWith('/api')
  )
    redirect('/admin/redirects?result=unsafe');
  const existing = await db.redirect.findMany({
    select: { source: true, destination: true },
    ...(id?.success ? { where: { id: { not: id.data } } } : {}),
  });
  if (redirectWouldCycle(source, destination, existing)) redirect('/admin/redirects?result=cycle');
  try {
    await db.$transaction(
      async (tx) => {
        const data = { source, destination, permanent: parsed.data.permanent === 'true' };
        const transactionExisting = await tx.redirect.findMany({
          select: { source: true, destination: true },
          ...(id?.success ? { where: { id: { not: id.data } } } : {}),
        });
        if (redirectWouldCycle(source, destination, transactionExisting))
          throw new Error('REDIRECT_CYCLE');
        const item = id?.success
          ? await tx.redirect.update({ where: { id: id.data }, data })
          : await tx.redirect.create({ data });
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: id?.success ? 'UPDATE' : 'CREATE',
            entity: 'Redirect',
            entityId: item.id,
            changes: data,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
    revalidatePath('/admin/redirects');
    redirect('/admin/redirects?result=saved');
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    if (error instanceof Error && error.message === 'REDIRECT_CYCLE')
      redirect('/admin/redirects?result=cycle');
    redirect('/admin/redirects?result=error');
  }
}

export async function deleteManagedRedirect(form: FormData) {
  const actor = await requireAdmin();
  if (process.env.CONTENT_SOURCE === 'seed') redirect('/admin/redirects?result=readonly');
  const parsed = z.string().cuid().safeParse(form.get('id'));
  if (!parsed.success || form.get('confirm') !== 'yes') redirect('/admin/redirects?result=confirm');
  await db.$transaction(async (tx) => {
    const row = await tx.redirect.findUnique({
      where: { id: parsed.data },
      select: { source: true, destination: true },
    });
    if (!row) return;
    await tx.redirect.delete({ where: { id: parsed.data } });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'DELETE',
        entity: 'Redirect',
        entityId: parsed.data,
        changes: row,
      },
    });
  });
  revalidatePath('/admin/redirects');
  redirect('/admin/redirects?result=deleted');
}
