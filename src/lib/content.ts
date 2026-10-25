import 'server-only';
import { cache } from 'react';
import { db } from './db';
import {
  initialProducts,
  initialSettings,
  publicWhere,
  type CatalogueProduct,
  type Settings,
} from './catalogue';
export const getSettings = cache(async (): Promise<Settings> => {
  if (process.env.CONTENT_SOURCE === 'seed') return initialSettings;
  const settings = await db.siteSettings.findUnique({ where: { id: 'site' } });
  if (!settings) throw new Error('Site settings have not been seeded.');
  return settings;
});
export const getProducts = cache(async (): Promise<CatalogueProduct[]> => {
  if (process.env.CONTENT_SOURCE === 'seed') return initialProducts;
  const products = await db.product.findMany({
    where: publicWhere(),
    include: { image: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return products.map((product) => ({
    ...product,
    image: product.image && !product.image.deletedAt ? product.image.storageKey : null,
    imageAlt: product.imageAlt ?? product.image?.alt ?? '',
  }));
});
