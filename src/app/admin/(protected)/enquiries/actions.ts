'use server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateEnquiryStatus(form: FormData) {
  const actor = await requireAdmin();
  const id = form.get('id');
  const status = form.get('status');
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_]{1,80}$/.test(id)) return;
  if (typeof status !== 'string' || !['NEW', 'IN_PROGRESS', 'CLOSED', 'SPAM'].includes(status))
    return;
  const nextStatus = status as 'NEW' | 'IN_PROGRESS' | 'CLOSED' | 'SPAM';
  await db.$transaction(async (tx) => {
    const current = await tx.inquiry.findFirst({
      where: { id, deletedAt: null },
      select: { status: true },
    });
    if (!current || current.status === nextStatus) return;
    await tx.inquiry.update({ where: { id }, data: { status: nextStatus } });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'UPDATE_STATUS',
        entity: 'Inquiry',
        entityId: id,
        changes: { from: current.status, to: nextStatus },
      },
    });
  });
  revalidatePath('/admin/enquiries');
  revalidatePath(`/admin/enquiries/${id}`);
}
