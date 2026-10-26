import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedProject } from '@/lib/pages-projects';
import { pageMetadata } from '@/lib/seo';
import Image from 'next/image';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedProject(slug);
  if (!p) return { title: 'Project not found', robots: { index: false, follow: false } };
  const seo = (p.seo && typeof p.seo === 'object' ? p.seo : {}) as {
    title?: string;
    description?: string;
  };
  return pageMetadata(
    seo.title || p.title,
    seo.description ||
      `${p.location ? `${p.location}. ` : ''}Project completed by Fullers Aggregate.`,
    `/projects/${slug}`,
  );
}
export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedProject(slug);
  if (!p) notFound();
  const body = (p.body && typeof p.body === 'object' ? p.body : {}) as {
    challenge?: string;
    solution?: string;
    outcome?: string;
  };
  return (
    <main id="main" className="container blog-index">
      <p className="eyebrow">
        <Link href="/projects">PROJECTS</Link>
        {p.location ? ` / ${p.location}` : ''}
      </p>
      <h1>{p.title}</h1>
      {p.images.length > 0 && (
        <div className="blog-grid">
          {p.images.map((image) => (
            <figure key={image.storageKey}>
              <div style={{ position: 'relative', aspectRatio: '4/3' }}>
                <Image
                  src={image.storageKey}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 700px) 100vw, 700px"
                />
              </div>
              {image.alt && <figcaption>{image.alt}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {body.challenge && (
        <section>
          <h2>The challenge</h2>
          <p className="lead">{body.challenge}</p>
        </section>
      )}
      {body.solution && (
        <section>
          <h2>Fullers’ solution</h2>
          <p className="lead">{body.solution}</p>
        </section>
      )}
      {body.outcome && (
        <section>
          <h2>Outcome</h2>
          <p className="lead">{body.outcome}</p>
        </section>
      )}
      {p.products.length > 0 && (
        <section>
          <h2>Products involved</h2>
          <ul>
            {p.products.map((x) => (
              <li key={x.slug}>
                <Link href={`/products/${x.slug}`}>{x.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
