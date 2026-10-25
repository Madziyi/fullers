import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/content';
import { siteUrl } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return ['/', '/products', ...products.map((p) => `/products/${p.slug}`)].map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}
