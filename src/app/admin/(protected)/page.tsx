import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { publicWhere } from '@/lib/catalogue';
export default async function Dashboard() {
  await requireUser();
  const [products, drafts, missingImages] = await Promise.all([
    db.product.count({ where: publicWhere() }),
    db.post.count({ where: { status: 'DRAFT', deletedAt: null } }),
    db.product.count({ where: { deletedAt: null, imageId: null } }),
  ]);
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">YOUR WEBSITE, AT A GLANCE</p>
        <h1>Let’s build on what’s here.</h1>
        <p>The foundations are in place. Here’s the current state of your content.</p>
      </div>
      <div className="admin-stats">
        {[
          [products, 'Published products'],
          [drafts, 'Draft articles'],
          [missingImages, 'Products need photographs'],
        ].map(([value, label]) => (
          <div className="admin-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="admin-panel">
        <h2>Ready for your attention</h2>
        <p>
          Manhole Rings, Culverts and Durawall need product photographs. Specifications remain empty
          until Fullers supplies confirmed facts.
        </p>
        <Link className="text-link" href="/admin/products">
          Review the product catalogue →
        </Link>
      </section>
      <section className="admin-panel">
        <h2>A clearer publishing experience is next.</h2>
        <p>
          The article writing surface, practical SEO guidance, authenticated previews, scheduling
          and revisions arrive in M3. No sample articles or projects are published.
        </p>
      </section>
    </>
  );
}
