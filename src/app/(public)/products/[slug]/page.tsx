import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducts, getSettings } from '@/lib/content';
import { pageMetadata, jsonLd, siteUrl } from '@/lib/seo';
import { ProductImage, ProductCard } from '@/components/product-card';
import { Arrow } from '@/components/icons';
import { whatsappUrl } from '@/lib/catalogue';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = (await getProducts()).find((p) => p.slug === slug);
  if (!product) return { title: 'Product not found', robots: { index: false } };
  return pageMetadata(
    `${product.name} in Bindura`,
    product.summary,
    `/products/${product.slug}`,
    product.image ?? undefined,
  );
}
export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  const specs = Array.isArray(product.specifications)
    ? product.specifications.filter(
        (s): s is { label: string; value: string } =>
          typeof s === 'object' &&
          s !== null &&
          typeof s.label === 'string' &&
          typeof s.value === 'string',
      )
    : [];
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products` },
              {
                '@type': 'ListItem',
                position: 3,
                name: product.name,
                item: `${siteUrl}/products/${slug}`,
              },
            ],
          }),
        }}
      />
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Products</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
        <section className="product-detail">
          <div className="detail-image">
            <ProductImage product={product} priority />
          </div>
          <div className="detail-copy">
            <p className="eyebrow">THE FULLERS RANGE / {product.applications.join(', ')}</p>
            <h1>{product.name}</h1>
            <p className="lead">{product.summary}</p>
            <div className="spec-note">
              <h2>Let’s find the right fit.</h2>
              {specs.length ? (
                <dl>
                  {specs.map((s) => (
                    <div key={s.label}>
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p>
                  Contact our team to confirm available specifications, quantities and suitability
                  for your project.
                </p>
              )}
              <p>
                For a quotation, share your site location and requirements. Product pricing and
                delivery arrangements are confirmed directly with our team.
              </p>
            </div>
            <a className="button" href={whatsappUrl(settings.phone, product.name)}>
              Enquire about {product.name} <Arrow diagonal />
            </a>
            <a className="detail-call" href={`tel:${settings.phone.replace(/\s/g, '')}`}>
              Prefer a call? {settings.phone}
            </a>
          </div>
        </section>
        <section className="section">
          <div className="section-heading">
            <h2>Keep building your list.</h2>
            <Link href="/products" className="text-link">
              All products <Arrow />
            </Link>
          </div>
          <div className="product-grid related-grid">
            {products
              .filter((p) => p.slug !== slug)
              .slice(0, 3)
              .map((p, i) => (
                <ProductCard product={p} index={i} key={p.slug} />
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
