import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { createProduct } from './actions';
export default async function ProductsAdmin() {
  await requireAdmin();
  const products = await db.product.findMany({
    where: { deletedAt: null },
    include: { image: true },
    orderBy: { sortOrder: 'asc' },
  });
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">CONTENT / PRODUCTS</p>
        <h1>Your product catalogue.</h1>
        <p>Edit structured product content and choose what appears publicly.</p>
        <form action={createProduct}>
          <button className="button">New product +</button>
        </form>
      </div>
      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <caption className="eyebrow">PRODUCT READINESS</caption>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Status</th>
              <th scope="col">Photograph</th>
              <th scope="col">Specifications</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <th scope="row">
                  <Link className="text-link" href={`/admin/products/${p.id}`}>
                    {p.name}
                  </Link>
                </th>
                <td>
                  <span className="badge">{p.status.toLowerCase()}</span>
                </td>
                <td>
                  {p.image && !p.image.deletedAt ? (
                    'Original supplied'
                  ) : (
                    <span className="badge badge-warning">Photograph needed</span>
                  )}
                </td>
                <td>
                  {Array.isArray(p.specifications) && p.specifications.length
                    ? 'Supplied'
                    : 'Awaiting Fullers details'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
