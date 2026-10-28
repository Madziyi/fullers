import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/content';
import { siteUrl } from '@/lib/seo';
import { getPublishedArticles } from '@/lib/articles';
import { getPublishedPages, getPublishedProjects } from '@/lib/pages-projects';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.SITE_INDEXING_ENABLED === 'false') return [];
  const products = await getProducts();
  const articles = await getPublishedArticles();
  const pages = await getPublishedPages();
  const projects = await getPublishedProjects();
  return [
    '/',
    '/about',
    '/products',
    '/services',
    '/contact',
    ...products.map((p) => `/products/${p.slug}`),
    ...(articles.length ? ['/blog', ...articles.map((article) => `/blog/${article.slug}`)] : []),
    ...(projects.length
      ? ['/projects', ...projects.map((project) => `/projects/${project.slug}`)]
      : []),
    ...pages
      .filter((page) => !['home', 'about', 'services'].includes(page.slug))
      .map((page) => `/pages/${page.slug}`),
  ].map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}
