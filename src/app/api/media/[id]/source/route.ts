import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { readMediaFile } from '@/lib/media-storage';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasOriginalForStorage, isMediaUuid } from '@/lib/media-originals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const mimeByFormat: Record<string, { mime: string; extension: string }> = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  png: { mime: 'image/png', extension: 'png' },
  webp: { mime: 'image/webp', extension: 'webp' },
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in to download original images.' }, { status: 401 });
  if (user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Administrator access is required.' }, { status: 403 });
  const { id } = await params;
  if (!/^[a-z0-9_-]{1,64}$/i.test(id)) return new Response(null, { status: 404 });
  const media = await db.media.findUnique({
    where: { id },
    select: { id: true, storageKey: true, deletedAt: true },
  });
  if (!media || media.deletedAt || !(await hasOriginalForStorage(media.storageKey)))
    return new Response(null, { status: 404 });
  try {
    const localUpload = /^\/api\/article-media\/([0-9a-f-]{36})$/.exec(media.storageKey);
    const data =
      localUpload && isMediaUuid(localUpload[1])
        ? await readMediaFile(localUpload[1], 'original')
        : await readFile(resolve(process.cwd(), 'public', `.${media.storageKey}`));
    if (data.byteLength < 1 || data.byteLength > 5 * 1024 * 1024)
      return new Response(null, { status: 404 });
    const metadata = await sharp(data, {
      limitInputPixels: 20_000_000,
      failOn: 'error',
    }).metadata();
    const format = mimeByFormat[metadata.format ?? ''];
    if (
      !format ||
      !metadata.width ||
      !metadata.height ||
      metadata.width > 8000 ||
      metadata.height > 8000
    )
      return new Response(null, { status: 404 });
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': format.mime,
        'Content-Disposition': `attachment; filename="fullers-original-${media.id}.${format.extension}"`,
        'Content-Length': String(data.byteLength),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
