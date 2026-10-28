import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_INDEXING_ENABLED === 'false')
    return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/preview'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
