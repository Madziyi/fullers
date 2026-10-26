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
  if (user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Administrator access is required.' }, { status: 403 });
  const origin = request.headers.get('origin');
  const configured = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : null;
  if (!origin || !configured || origin !== configured)
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  const length = Number(request.headers.get('content-length'));
  if (!Number.isSafeInteger(length) || length < 1 || length > 6 * 1024 * 1024)
    return NextResponse.json({ error: 'Image upload request is too large.' }, { status: 413 });
  const form = await request.formData();
  const file = form.get('image');
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'Choose an image under 5 MB.' }, { status: 400 });
  const source = String(form.get('source') ?? '')
    .trim()
    .slice(0, 180);
  if (source.length < 2)
    return NextResponse.json({ error: 'Enter the image source or attribution.' }, { status: 400 });
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
        { error: 'Upload a valid JPEG, PNG or WebP within the dimension limit.' },
        { status: 400 },
      );
    const output = await sharp(input, { limitInputPixels: 20_000_000, failOn: 'error' })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const id = randomUUID();
    storedId = id;
    const dir = resolve(process.cwd(), '.local-media', 'article');
    await mkdir(dir, { recursive: true });
    const storedPath = getOptimizedMediaPath(id);
    await writeFile(storedPath, output.data, { flag: 'wx' });
    await preserveMediaOriginal(id, input);
    const media = await db.$transaction(async (tx) => {
      const record = await tx.media.create({
        data: {
          id,
          storageKey: `/api/article-media/${id}`,
          mimeType: 'image/webp',
          bytes: output.data.length,
          width: output.info.width,
          height: output.info.height,
          source,
          alt: '',
          ownerId: user.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'UPLOAD',
          entity: 'Media',
          entityId: id,
          changes: { bytes: record.bytes, width: record.width, height: record.height },
        },
      });
      return record;
    });
    return NextResponse.json(
      { id, url: media.storageKey, width: media.width, height: media.height },
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
