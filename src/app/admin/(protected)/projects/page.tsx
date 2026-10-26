import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
export default async function ProjectsAdmin() {
  await requireAdmin();
  const projects = await db.project.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, slug: true, status: true, approvedAt: true, updatedAt: true },
  });
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">CONTENT / PROJECTS</p>
          <h1>Projects</h1>
          <p>Use real completed work only. Every public project needs administrator approval.</p>
        </div>
        <Link className="button" href="/admin/projects/new">
          Add project +
        </Link>
      </div>
      <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Content table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>URL</th>
              <th>Approval</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="text-link" href={`/admin/projects/${p.id}`}>
                    {p.title}
                  </Link>
                </td>
                <td>/projects/{p.slug}</td>
                <td>
                  {p.approvedAt && p.status === 'PUBLISHED'
                    ? 'Approved and published'
                    : 'Private draft'}
                </td>
                <td>{p.updatedAt.toLocaleDateString('en-ZW')}</td>
              </tr>
            ))}
            {!projects.length && (
              <tr>
                <td colSpan={4}>No projects yet. Add only verified Fullers work.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
