import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { getPublishedProjects } from '@/lib/pages-projects';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const projects = await getPublishedProjects();
  return projects.length
    ? pageMetadata('Projects', 'Approved Fullers Aggregate project work in Zimbabwe.', '/projects')
    : {
        ...pageMetadata(
          'Projects',
          'Approved Fullers Aggregate project work in Zimbabwe.',
          '/projects',
        ),
        robots: { index: false, follow: true },
      };
}
export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  return (
    <main id="main" className="container blog-index">
      <p className="eyebrow">SELECTED WORK</p>
      <h1>Projects</h1>
      <p className="lead">A look at work completed by Fullers Aggregate.</p>
      {projects.length === 0 ? (
        <p>
          Project stories will appear here once Fullers has approved real completed work for
          publication.
        </p>
      ) : (
        <div className="blog-grid">
          {projects.map((p) => (
            <article key={p.id}>
              <p className="eyebrow">{p.location || 'FULLERS AGGREGATE'}</p>
              <h2>
                <Link href={`/projects/${p.slug}`}>{p.title}</Link>
              </h2>
              <Link className="text-link" href={`/projects/${p.slug}`}>
                View project →
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
