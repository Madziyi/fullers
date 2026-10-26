import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProjectEditorForm } from '../project-editor-form';
export async function ProjectEditor({ id }: { id: string }) {
  await requireAdmin();
  const p =
    id === 'new'
      ? null
      : await db.project.findFirst({
          where: { id, deletedAt: null },
          include: {
            images: { where: { deletedAt: null }, select: { id: true } },
            products: { select: { id: true } },
          },
        });
  if (id !== 'new' && !p) notFound();
  const [media, products] = await Promise.all([
    db.media.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, storageKey: true, alt: true, source: true },
    }),
    db.product.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, status: true },
    }),
  ]);
  const body = (p?.body && typeof p.body === 'object' && !Array.isArray(p.body) ? p.body : {}) as {
    challenge?: string;
    solution?: string;
    outcome?: string;
  };
  const seo = (p?.seo && typeof p.seo === 'object' ? p.seo : {}) as {
    title?: string;
    description?: string;
  };
  const initial = p
    ? {
        id: p.id,
        updatedAt: p.updatedAt.toISOString(),
        title: p.title,
        slug: p.slug,
        location: p.location ?? '',
        projectDate: p.projectDate?.toISOString().slice(0, 10) ?? '',
        challenge: body.challenge ?? '',
        solution: body.solution ?? '',
        outcome: body.outcome ?? '',
        clientName: p.clientName ?? '',
        clientPermission: !!p.clientPermissionAt,
        featured: p.featured,
        imageIds: p.images.map((x) => x.id),
        productIds: p.products.map((x) => x.id),
        seoTitle: seo.title ?? '',
        seoDescription: seo.description ?? '',
        status: p.status,
      }
    : null;
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">CONTENT / PROJECTS</p>
          <h1>{p?.title ?? 'Add a real project'}</h1>
          <p>
            Use verified work only. Saving makes the project private until an administrator approves
            it.
          </p>
        </div>
      </div>
      <ProjectEditorForm initial={initial} media={media} products={products} />
    </>
  );
}
export default async function ProjectEditorRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return ProjectEditor({ id });
}
