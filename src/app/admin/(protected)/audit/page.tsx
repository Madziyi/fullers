import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== 'ADMIN') notFound();
  const { before } = await searchParams;
  const cursor = before && /^[a-zA-Z0-9_]{1,80}$/.test(before) ? before : undefined;
  const rows = await db.auditLog.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 51,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      createdAt: true,
      actorId: true,
    },
  });
  const logs = rows.slice(0, 50);
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">ADMINISTRATOR ONLY</p>
        <h1>Audit history</h1>
        <p>
          Recent administrative changes, with private enquiry content, account names and change
          payloads omitted.
        </p>
      </div>
      <section className="admin-panel">
        <h2>Recorded activity</h2>
        {logs.length ? (
          <>
            <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Content table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When (UTC)</th>
                    <th>Actor reference</th>
                    <th>Action</th>
                    <th>Record</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td>{row.createdAt.toISOString().replace('T', ' ').slice(0, 16)}</td>
                      <td>{row.actorId ? row.actorId.slice(0, 8) : 'Former account'}</td>
                      <td>{row.action.toLowerCase().replaceAll('_', ' ')}</td>
                      <td>{row.entity}</td>
                      <td>{row.entityId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="inbox-pagination" aria-label="Audit pages">
              {cursor && (
                <Link className="text-link" href="/admin/audit">
                  ← Most recent
                </Link>
              )}
              {rows.length > 50 && (
                <Link className="text-link" href={`/admin/audit?before=${logs.at(-1)!.id}`}>
                  Older activity →
                </Link>
              )}
            </nav>
          </>
        ) : (
          <p>No administrative activity recorded yet.</p>
        )}
      </section>
    </>
  );
}
