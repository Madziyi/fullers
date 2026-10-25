import Link from 'next/link';
import { getProducts, getSettings } from '@/lib/content';
import { ProductCard } from '@/components/product-card';
import { ContactBand } from '@/components/chrome';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata(
  'Our products',
  'Explore seven Fullers Aggregate product categories, from quarry stones and bricks to pavers, culverts and concrete walling. Enquire with our Bindura team.',
  '/products',
);
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ application?: string }>;
}) {
  const [products, settings, query] = await Promise.all([
    getProducts(),
    getSettings(),
    searchParams,
  ]);
  const application = ['Building', 'Landscaping', 'Infrastructure'].includes(
    query.application ?? '',
  )
    ? query.application
    : undefined;
  const visible = products.filter((p) => !application || p.applications.includes(application));
  return (
    <main id="main">
      <section className="page-heading">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Products</span>
          </nav>
          <p className="eyebrow">THE FULLERS RANGE</p>
          <h1>
            Solid materials.
            <br />
            <span className="serif">Real possibilities.</span>
          </h1>
          <p>
            Seven product categories. One commitment to quality.
            <br />
            Explore the range and talk to us about your project’s requirements.
          </p>
        </div>
      </section>
      <section className="section catalogue">
        <div className="container">
          <div className="catalogue-toolbar">
            <nav aria-label="Filter products by application" className="filters">
              {['All products', 'Building', 'Landscaping', 'Infrastructure'].map((label, index) => (
                <Link
                  key={label}
                  href={index ? `/products?application=${label}` : '/products'}
                  aria-current={
                    (!application && !index) || application === label ? 'page' : undefined
                  }
                >
                  {label}
                </Link>
              ))}
            </nav>
            <span>{visible.length} products</span>
          </div>
          <div className="product-grid catalogue-grid">
            {visible.map((p, i) => (
              <ProductCard
                key={p.slug}
                product={p}
                index={products.indexOf(p) >= 0 ? products.indexOf(p) : i}
              />
            ))}
          </div>
          <div className="catalogue-help">
            <h2>A little detail goes a long way.</h2>
            <p>
              Share the product you need, your quantities and your site location. Our team can
              confirm specifications and discuss a quotation.
            </p>
          </div>
        </div>
      </section>
      <ContactBand settings={settings} />
    </main>
  );
}
