import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProductEditor } from '../editor';
export const dynamic = 'force-dynamic';
export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [product, relatedOptions, images] = await Promise.all([
    db.product.findFirst({
      where: { id, deletedAt: null },
      include: { related: { select: { id: true } } },
    }),
    db.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    db.media.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, storageKey: true, alt: true, source: true, width: true, height: true },
    }),
  ]);
  if (!product) notFound();
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">CONTENT / PRODUCTS</p>
        <h1>Edit {product.name}</h1>
        <p>Drafts stay private until you publish this product.</p>
        <Link className="text-link" href="/admin/products">
          ← All products
        </Link>
      </div>
      <ProductEditor
        product={{ ...product, updatedAt: product.updatedAt.toISOString() }}
        relatedOptions={relatedOptions}
        images={images.map((i) => ({ ...i, url: i.storageKey }))}
      />
    </>
  );
}
