import type { Metadata } from 'next';
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image = '/assets/delivery-equipment.webp',
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Fullers Aggregate`,
      description,
      url: path,
      siteName: 'Fullers Aggregate',
      locale: 'en_ZW',
      type: 'website',
      images: [{ url: image, alt: 'Fullers Aggregate, Bindura' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
