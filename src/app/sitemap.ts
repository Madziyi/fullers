import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/content';
import { siteUrl } from '@/lib/seo';
import { getPublishedArticles } from '@/lib/articles';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const articles = await getPublishedArticles();
  return [
    '/',
    '/about',
    '/products',
    '/services',
    '/contact',
    ...products.map((p) => `/products/${p.slug}`),
    ...(articles.length ? ['/blog', ...articles.map((article) => `/blog/${article.slug}`)] : []),
  ].map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}
