import Image from 'next/image';
import Link from 'next/link';
import { type CatalogueProduct } from '@/lib/catalogue';
import { Arrow, Symbol } from './icons';
export function ProductImage({
  product,
  priority = false,
}: {
  product: CatalogueProduct;
  priority?: boolean;
}) {
  return product.image ? (
    <Image
      src={product.image}
      alt={product.imageAlt}
      fill
      sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
      className="product-photo"
      priority={priority}
      style={{
        objectPosition: `${(product.focalX ?? 0.5) * 100}% ${(product.focalY ?? 0.5) * 100}%`,
      }}
    />
  ) : (
    <div
      className="photo-fallback"
      role="img"
      aria-label={`${product.name}: product photograph not yet available`}
    >
      <Symbol type="stone" />
      <span>PRODUCT PHOTOGRAPH</span>
      <span>Coming into view.</span>
    </div>
  );
}
export function ProductCard({ product, index }: { product: CatalogueProduct; index: number }) {
  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-image-link">
        <ProductImage product={product} />
        <span className="product-number" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      </Link>
      <div className="product-card-body">
        <div className="product-card-title">
          <h3>
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <Arrow diagonal />
        </div>
        <p>{product.summary}</p>
        <Link className="text-link" href={`/products/${product.slug}`}>
          Explore product <Arrow />
        </Link>
      </div>
    </article>
  );
}
