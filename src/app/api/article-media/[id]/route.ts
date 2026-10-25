import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { articleBodySchema, getPublishedArticles } from '@/lib/articles';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const url = `/api/article-media/${id}`;
  const media = await db.media.findUnique({
    where: { storageKey: url },
    select: { mimeType: true, deletedAt: true, articlePostId: true },
  });
  if (!media || media.deletedAt) return new Response(null, { status: 404 });
  const published = (await getPublishedArticles()).some(
    (article) =>
      article.coverSrc === url ||
      article.body.blocks.some((block) => block.type === 'image' && block.src === url),
  );
  let privateAllowed = false;
  if (!published) {
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
          (() => {
            const parsed = articleBodySchema.safeParse(post.body);
            return (
              parsed.success &&
              parsed.data.blocks.some((block) => block.type === 'image' && block.src === url)
            );
          })());
    }
  }
  if (!published && !privateAllowed) return new Response(null, { status: 404 });
  try {
    const data = await readFile(resolve(process.cwd(), '.local-media', 'article', `${id}.webp`));
    return new NextResponse(data, {
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
