import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function ProjectPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const p = await db.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      images: { where: { deletedAt: null }, select: { storageKey: true, alt: true } },
      products: { select: { name: true } },
    },
  });
  if (!p) notFound();
  const body = (p.body && typeof p.body === 'object' ? p.body : {}) as {
    challenge?: string;
    solution?: string;
    outcome?: string;
  };
  return (
    <main className="container blog-index">
      <p className="eyebrow">PRIVATE PROJECT PREVIEW · {p.status}</p>
      <h1>{p.title}</h1>
      <p>{p.location}</p>
      {body.challenge && (
        <section>
          <h2>The challenge</h2>
          <p>{body.challenge}</p>
        </section>
      )}
      {body.solution && (
        <section>
          <h2>Fullers’ solution</h2>
          <p>{body.solution}</p>
        </section>
      )}
      {body.outcome && (
        <section>
          <h2>Outcome</h2>
          <p>{body.outcome}</p>
        </section>
      )}
      <p>{p.products.map((x) => x.name).join(' · ')}</p>
    </main>
  );
}
