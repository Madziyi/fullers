import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { publicWhere } from '@/lib/catalogue';
export default async function Dashboard() {
  const user = await requireUser();
  const isAdmin = user.role === 'ADMIN';
  const owner = isAdmin ? {} : { authorId: user.id };
  const [products, drafts, published, scheduled, missingImages, recent, enquiries] =
    await Promise.all([
      db.product.count({ where: publicWhere() }),
      db.post.count({ where: { deletedAt: null, publishedRevisionId: null, ...owner } }),
      db.post.count({ where: { deletedAt: null, publishedRevisionId: { not: null }, ...owner } }),
      db.publicationJob.count({
        where: {
          status: { in: ['PENDING', 'RETRY', 'NEEDS_REVIEW', 'FAILED'] },
          post: { deletedAt: null, ...owner },
        },
      }),
      db.product.count({ where: { deletedAt: null, imageId: null } }),
      db.post.findMany({
        where: { deletedAt: null, ...owner },
        select: { id: true, title: true, updatedAt: true, publishedRevisionId: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      isAdmin
        ? db.inquiry.count({ where: { deletedAt: null, status: 'NEW' } })
        : Promise.resolve(null),
    ]);
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">CONTENT STUDIO</p>
        <h1>Your publishing workspace.</h1>
        <p>Manage Fullers content and keep track of what needs attention.</p>
      </div>
      <div className="admin-stats">
        {[
          [products, 'Published products'],
          [published, 'Live articles'],
          [drafts, 'Unpublished articles'],
          [scheduled, 'Publication jobs'],
        ].map(([value, label]) => (
          <div className="admin-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>Continue writing</h2>
            <Link className="text-link" href="/admin/posts">
              All articles →
            </Link>
          </div>
          {recent.length ? (
            <ul className="dashboard-list">
              {recent.map((post) => (
                <li key={post.id}>
                  <Link href={`/admin/posts/${post.id}`}>
                    <strong>{post.title}</strong>
                    <span>
                      {post.publishedRevisionId ? 'Live · working draft available' : 'Draft'} ·{' '}
                      {post.updatedAt.toLocaleDateString('en-ZW', { timeZone: 'Africa/Harare' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-empty">
              <p>No articles yet. Start with useful guidance for your customers.</p>
              <Link className="button button-small" href="/admin/posts">
                Write an article →
              </Link>
            </div>
          )}
        </section>
        <section className="admin-panel">
          <h2>Needs attention</h2>
          <ul className="dashboard-list">
            {isAdmin && (
              <li>
                <Link href="/admin/products">
                  <strong>{missingImages} products need photographs</strong>
                  <span>Add original product images and descriptive alt text.</span>
                </Link>
              </li>
            )}
            <li>
              <Link href="/admin/posts">
                <strong>{scheduled} publication jobs to monitor</strong>
                <span>Review queued jobs and any publication conflicts.</span>
              </Link>
            </li>
            {enquiries !== null && (
              <li>
                <Link href="/admin/enquiries">
                  <strong>{enquiries} new enquiries</strong>
                  <span>Review private customer messages.</span>
                </Link>
              </li>
            )}
          </ul>
        </section>
      </div>
      <section className="admin-panel">
        <h2>Publish with confidence</h2>
        <p>
          Save and preview before publishing. Add only verified specifications and approved project
          information. Article draft edits stay private until an administrator publishes them.
        </p>
        {isAdmin && (
          <div className="admin-quick-links">
            <Link href="/admin/products">Product catalogue →</Link>
            <Link href="/admin/pages">Website pages →</Link>
            <Link href="/admin/media">Media library →</Link>
          </div>
        )}
      </section>
    </>
  );
}
