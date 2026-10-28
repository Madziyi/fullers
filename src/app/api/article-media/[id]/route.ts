import { readMediaFile } from '@/lib/media-storage';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { articleBodySchema, getPublishedArticles } from '@/lib/articles';
import { publicWhere } from '@/lib/catalogue';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const url = `/api/article-media/${id}`;
  const media = await db.media.findUnique({
    where: { storageKey: url },
    select: { mimeType: true, deletedAt: true, articlePostId: true, ownerId: true },
  });
  if (!media || media.deletedAt) return new Response(null, { status: 404 });
  const published = (await getPublishedArticles()).some(
    (article) =>
      article.coverSrc === url ||
      article.socialImage === url ||
      article.body.blocks.some((block) => block.type === 'image' && block.src === url),
  );
  const publicProduct = await db.product.findFirst({
    where: { ...publicWhere(), image: { storageKey: url } },
    select: { id: true },
  });
  const publicProject = await db.project.findFirst({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      approvedAt: { not: null },
      deletedAt: null,
      images: { some: { storageKey: url, deletedAt: null } },
    },
    select: { id: true },
  });
  let privateAllowed = false;
  if (!published && !publicProduct && !publicProject) {
    const user = await currentUser();
    if (user && media.articlePostId) {
      const post = await db.post.findFirst({
        where: {
          id: media.articlePostId,
          deletedAt: null,
          ...(user.role === 'ADMIN' ? {} : { authorId: user.id }),
        },
        select: { body: true, seo: true, cover: { select: { storageKey: true } } },
      });
      privateAllowed =
        !!post &&
        (post.cover?.storageKey === url ||
          (typeof post.seo === 'object' &&
            post.seo !== null &&
            'coverSrc' in post.seo &&
            post.seo.coverSrc === url) ||
          (typeof post.seo === 'object' &&
            post.seo !== null &&
            'socialImage' in post.seo &&
            post.seo.socialImage === url) ||
          (() => {
            const parsed = articleBodySchema.safeParse(post.body);
            return (
              parsed.success &&
              parsed.data.blocks.some((block) => block.type === 'image' && block.src === url)
            );
          })());
    }
    if (user && !media.articlePostId && (user.role === 'ADMIN' || media.ownerId === user.id))
      privateAllowed = true;
    if (user?.role === 'ADMIN' && !media.articlePostId) {
      const productReference = await db.product.findFirst({
        where: { imageId: id, deletedAt: null },
        select: { id: true },
      });
      if (productReference) privateAllowed = true;
    }
  }
  if (!published && !publicProduct && !publicProject && !privateAllowed)
    return new Response(null, { status: 404 });
  try {
    const data = await readMediaFile(id, 'webp');
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
