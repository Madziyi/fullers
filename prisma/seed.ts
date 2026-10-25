import { createPrismaClient } from '../src/lib/prisma-client';
import { hash } from 'bcryptjs';
import { stat } from 'node:fs/promises';
import { initialProducts, initialSettings } from '../src/lib/catalogue';
const db = createPrismaClient();
async function main() {
  await db.siteSettings.upsert({ where: { id: 'site' }, update: {}, create: initialSettings });
  for (const [sortOrder, product] of initialProducts.entries()) {
    let imageId: string | undefined;
    if (product.image) {
      const file = await stat(`public${product.image}`);
      // Dimensions measured from bundled original WebP files (see asset QA).
      const dimensions: Record<string, [number, number]> = JSON.parse(
        await (await import('node:fs/promises')).readFile('assets/dimensions.json', 'utf8'),
      );
      const [width, height] = dimensions[product.image.split('/').pop()!];
      const media = await db.media.upsert({
        where: { storageKey: product.image },
        update: {},
        create: {
          storageKey: product.image,
          mimeType: 'image/webp',
          bytes: file.size,
          width,
          height,
          source: 'User-supplied MHT archive; CONTENT_AND_ASSET_INVENTORY.md',
          alt: product.imageAlt,
        },
      });
      imageId = media.id;
    }
    const { image: _image, ...data } = product;
    void _image;
    await db.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...data,
        specifications: [],
        imageId,
        sortOrder,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-10-24T00:00:00Z'),
      },
    });
  }
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (email || password) {
    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length < 16 ||
      Buffer.byteLength(password, 'utf8') > 72
    )
      throw new Error(
        'Set ADMIN_EMAIL and a password of at least 16 characters and no more than 72 UTF-8 bytes.',
      );
    await db.user.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {},
      create: {
        email: email.trim().toLowerCase(),
        name: 'Administrator',
        role: 'ADMIN',
        passwordHash: await hash(password, 12),
      },
    });
  }
  // Intentionally no example posts, projects or testimonials.
}
main()
  .catch(() => {
    console.error('Seed failed. Check database access and administrator input.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
