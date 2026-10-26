import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { isTextSections } from '@/lib/pages-projects';
import { PageEditorForm } from '../page-editor-form';
import { PageEditorControls } from '../page-editor-controls';
import Link from 'next/link';

export async function PageEditor({ id }: { id: string }) {
  await requireAdmin();
  const page =
    id === 'new' ? null : await db.pageContent.findFirst({ where: { id, deletedAt: null } });
  if (id !== 'new' && !page) notFound();
  const sections =
    page && isTextSections(page.sections) ? page.sections : [{ heading: '', body: '' }];
  const seo = (page?.seo && typeof page.seo === 'object' ? page.seo : {}) as {
    title?: string;
    description?: string;
  };
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">CONTENT / PAGES</p>
          <h1>{page?.title ?? 'New page'}</h1>
          <p>
            Use “about”, “services” or “home” to add controlled sections to those pages. Custom
            slugs publish at /pages/your-slug.
          </p>
        </div>
      </div>
      <PageEditorForm
        id={page?.id}
        version={page?.version}
        title={page?.title ?? ''}
        slug={page?.slug ?? ''}
        sections={sections}
        seoTitle={seo.title ?? ''}
        seoDescription={seo.description ?? ''}
      />
      {page && (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '.75rem' }}>
          <PageEditorControls id={page.id} version={page.version} status={page.status} />
          <Link className="text-link" href={`/admin/pages/${page.id}/preview`}>
            Open private preview →
          </Link>
        </div>
      )}
    </>
  );
}
export default async function PageEditorRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return PageEditor({ id });
}
