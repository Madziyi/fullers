import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPage, isTextSections } from '@/lib/pages-projects';
import { pageMetadata } from '@/lib/seo';
export const dynamic = 'force-dynamic';
const reserved = new Set(['home', 'about', 'services']);
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = reserved.has(slug) ? null : await getPublishedPage(slug);
  if (!page) return { title: 'Page not found', robots: { index: false, follow: false } };
  const seo = (page.seo && typeof page.seo === 'object' ? page.seo : {}) as {
    title?: string;
    description?: string;
  };
  return pageMetadata(seo.title || page.title, seo.description || '', `/pages/${slug}`);
}
export default async function StructuredPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = reserved.has(slug) ? null : await getPublishedPage(slug);
  if (!page || !isTextSections(page.sections)) notFound();
  return (
    <main id="main" className="container blog-index">
      <p className="eyebrow">FULLERS AGGREGATE</p>
      <h1>{page.title}</h1>
      {page.sections.map((section, index) => (
        <section key={`${index}-${section.heading}`}>
          <h2>{section.heading}</h2>
          <p className="lead">{section.body}</p>
        </section>
      ))}
    </main>
  );
}
