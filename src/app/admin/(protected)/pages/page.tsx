import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
export default async function PagesAdmin() {
  await requireAdmin();
  const pages = await db.pageContent.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, slug: true, status: true, updatedAt: true },
  });
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">CONTENT / PAGES</p>
          <h1>Structured pages</h1>
          <p>
            Build pages from safe text sections. Edits return published pages to draft until
            reviewed.
          </p>
        </div>
        <Link className="button" href="/admin/pages/new">
          New page +
        </Link>
      </div>
      <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Content table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>URL</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="text-link" href={`/admin/pages/${p.id}`}>
                    {p.title}
                  </Link>
                </td>
                <td>/pages/{p.slug}</td>
                <td>{p.status.toLowerCase()}</td>
                <td>{p.updatedAt.toLocaleDateString('en-ZW')}</td>
              </tr>
            ))}
            {!pages.length && (
              <tr>
                <td colSpan={4}>No custom pages yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
