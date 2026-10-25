import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
export default async function ProductsAdmin() {
  await requireUser();
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
        <p>Review the seven original product entries. Full product editing arrives in M3.</p>
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
                <th scope="row">{p.name}</th>
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
