import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
export default async function Enquiries({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== 'ADMIN') notFound();
  const { before } = await searchParams;
  const cursor = before && /^[a-zA-Z0-9_]{1,80}$/.test(before) ? before : undefined;
  const rows = await db.inquiry.findMany({
    where: { deletedAt: null },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 26,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, name: true, productSlug: true, status: true, createdAt: true },
  });
  const enquiries = rows.slice(0, 25);
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">PRIVATE / ENQUIRIES</p>
        <h1>The next conversation.</h1>
        <p>
          Messages saved through the website. Open an enquiry to see its contact details. Email
          notifications are not configured.
        </p>
      </div>
      <section className="admin-panel">
        <h2>Enquiry inbox</h2>
        {enquiries.length ? (
          <>
            <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Content table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">From</th>
                    <th scope="col">Product</th>
                    <th scope="col">Received (UTC)</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">
                        <Link className="inbox-link" href={`/admin/enquiries/${row.id}`}>
                          {row.name}
                        </Link>
                      </th>
                      <td>{row.productSlug?.replaceAll('-', ' ') || 'General enquiry'}</td>
                      <td>{row.createdAt.toISOString().replace('T', ' ').slice(0, 16)}</td>
                      <td>
                        <span className="badge">
                          {row.status.toLowerCase().replaceAll('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="inbox-pagination" aria-label="Enquiry pages">
              {cursor && (
                <Link className="text-link" href="/admin/enquiries">
                  ← Most recent
                </Link>
              )}
              {rows.length > 25 && (
                <Link
                  className="text-link"
                  href={`/admin/enquiries?before=${enquiries.at(-1)!.id}`}
                >
                  Older enquiries →
                </Link>
              )}
            </nav>
          </>
        ) : (
          <p>No enquiries to show. New website enquiries appear here after they are saved.</p>
        )}
      </section>
    </>
  );
}
