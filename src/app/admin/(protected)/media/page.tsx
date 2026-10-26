import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasOriginalForStorage } from '@/lib/media-originals';
import { MediaLibrary } from './library';
export const dynamic = 'force-dynamic';
export default async function MediaPage() {
  await requireAdmin();
  const media = await db.media.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      storageKey: true,
      alt: true,
      source: true,
      width: true,
      height: true,
      bytes: true,
      focalX: true,
      focalY: true,
      createdAt: true,
      _count: { select: { products: true, posts: true, projects: true } },
    },
  });
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">CONTENT / MEDIA</p>
        <h1>Media library</h1>
        <p>Upload relevant Fullers images, record their source and add descriptive alt text.</p>
      </div>
      <MediaLibrary
        initial={await Promise.all(
          media.map(async (item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
            hasOriginal: await hasOriginalForStorage(item.storageKey),
          })),
        )}
      />
    </>
  );
}
