'use server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { settingsSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
export type SettingsResult = { ok: boolean; message: string };
export async function saveSettings(
  _previous: SettingsResult,
  form: FormData,
): Promise<SettingsResult> {
  const user = await requireAdmin();
  if (process.env.CONTENT_SOURCE === 'seed')
    return {
      ok: false,
      message:
        'This preview uses read-only seed content. Switch to database content to save settings.',
    };
  let socialLinks: unknown;
  try {
    socialLinks = form.has('socialLinks') ? JSON.parse(String(form.get('socialLinks'))) : undefined;
  } catch {
    return { ok: false, message: 'Check the social links and retry.' };
  }
  const parsed = settingsSchema.safeParse({ ...Object.fromEntries(form.entries()), socialLinks });
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' '),
    };
  try {
    await db.$transaction(async (tx) => {
      await tx.siteSettings.update({ where: { id: 'site' }, data: parsed.data });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'UPDATE',
          entity: 'SiteSettings',
          entityId: 'site',
          changes: parsed.data,
        },
      });
    });
    revalidatePath('/', 'layout');
    return {
      ok: true,
      message: 'Settings saved. The public website now uses your updated content.',
    };
  } catch {
    return { ok: false, message: 'Settings could not be saved. Please try again.' };
  }
}
