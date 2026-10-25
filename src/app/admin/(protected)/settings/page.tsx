import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { SettingsForm } from './form';
export default async function SettingsPage() {
  await requireAdmin();
  const settings = await db.siteSettings.findUniqueOrThrow({ where: { id: 'site' } });
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">YOUR WEBSITE / SITE SETTINGS</p>
        <h1>The details behind Fullers.</h1>
        <p>Keep contact information, approved claims and search appearance up to date.</p>
      </div>
      {process.env.CONTENT_SOURCE === 'seed' && (
        <p className="admin-notice">
          Public preview is using read-only seed content. Set CONTENT_SOURCE=database before saving
          changes.
        </p>
      )}
      <SettingsForm settings={settings} />
    </>
  );
}
