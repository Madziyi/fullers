import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { isTextSections } from '@/lib/pages-projects';
import { StructuredPageBody } from '@/components/structured-page';
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function PagePreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const page = await db.pageContent.findFirst({ where: { id, deletedAt: null } });
  if (!page || !isTextSections(page.sections)) notFound();
  return (
    <>
      <p className="eyebrow">PRIVATE PAGE PREVIEW · {page.status}</p>
      <StructuredPageBody title={page.title} sections={page.sections} />
    </>
  );
}
