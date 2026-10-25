import Link from 'next/link';
import { jsonLd, siteUrl } from '@/lib/seo';
export function PageIntro({
  name,
  path,
  eyebrow,
  children,
  description,
}: {
  name: string;
  path: string;
  eyebrow: string;
  children: React.ReactNode;
  description: string;
}) {
  return (
    <section className="page-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
              { '@type': 'ListItem', position: 2, name, item: `${siteUrl}${path}` },
            ],
          }),
        }}
      />
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{name}</span>
        </nav>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{children}</h1>
        <p className="intro-description">{description}</p>
      </div>
    </section>
  );
}
