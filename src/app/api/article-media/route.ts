import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  deleteLocalMediaFiles,
  getOptimizedMediaPath,
  preserveMediaOriginal,
} from '@/lib/media-originals';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to upload an image.' }, { status: 401 });
  const origin = request.headers.get('origin');
  const configuredOrigin = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : null;
  if (!origin || !configuredOrigin || origin !== configuredOrigin)
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  const contentLength = Number(request.headers.get('content-length'));
  if (!Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > 6 * 1024 * 1024)
    return NextResponse.json({ error: 'Image upload request is too large.' }, { status: 413 });
  const form = await request.formData();
  const file = form.get('image');
  const source = String(form.get('source') ?? 'User-supplied upload')
    .trim()
    .slice(0, 180);
  const postId = String(form.get('postId') ?? '');
  const post = await db.post.findFirst({
    where: { id: postId, deletedAt: null, ...(user.role === 'ADMIN' ? {} : { authorId: user.id }) },
    select: { id: true },
  });
  if (!post)
    return NextResponse.json(
      { error: 'Choose an article you are allowed to edit.' },
      { status: 403 },
    );
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'Choose an image under 5 MB.' }, { status: 400 });
  let storedId: string | null = null;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(input, {
      limitInputPixels: 20_000_000,
      failOn: 'error',
    }).metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > 8000 ||
      metadata.height > 8000 ||
      !['jpeg', 'png', 'webp'].includes(metadata.format ?? '')
    )
      return NextResponse.json(
        { error: 'Upload a valid JPEG, PNG or WebP image within the dimension limit.' },
        { status: 400 },
      );
    const output = await sharp(input, { limitInputPixels: 20_000_000, failOn: 'error' })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const id = randomUUID();
    storedId = id;
    const directory = resolve(process.cwd(), '.local-media', 'article');
    await mkdir(directory, { recursive: true });
    const filepath = getOptimizedMediaPath(id);
    await writeFile(filepath, output.data, { flag: 'wx' });
    await preserveMediaOriginal(id, input);
    const url = `/api/article-media/${id}`;
    await db.media.create({
      data: {
        id,
        storageKey: url,
        mimeType: 'image/webp',
        bytes: output.data.length,
        width: output.info.width,
        height: output.info.height,
        source,
        alt: '',
        ownerId: user.id,
        articlePostId: post.id,
      },
    });
    return NextResponse.json(
      { url, width: output.info.width, height: output.info.height, bytes: output.data.length },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    if (storedId) await deleteLocalMediaFiles(storedId);
    return NextResponse.json(
      { error: 'The image could not be decoded or stored.' },
      { status: 400 },
    );
  }
}
