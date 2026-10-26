import 'server-only';
import { access, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const localDirectory = () => resolve(process.cwd(), '.local-media', 'article');

export function isMediaUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export function getOptimizedMediaPath(id: string): string {
  if (!isMediaUuid(id)) throw new Error('Invalid media identifier.');
  return join(localDirectory(), `${id}.webp`);
}

export function getOriginalMediaPath(id: string): string {
  if (!isMediaUuid(id)) throw new Error('Invalid media identifier.');
  return join(localDirectory(), `${id}.original`);
}

export async function preserveMediaOriginal(id: string, input: Buffer): Promise<void> {
  await writeFile(getOriginalMediaPath(id), input, { flag: 'wx' });
}

export async function deleteLocalMediaFiles(id: string): Promise<void> {
  if (!isMediaUuid(id)) throw new Error('Invalid media identifier.');
  await Promise.all([
    unlink(getOptimizedMediaPath(id)).catch(() => undefined),
    unlink(getOriginalMediaPath(id)).catch(() => undefined),
  ]);
}

export async function hasLocalMediaOriginal(id: string): Promise<boolean> {
  if (!isMediaUuid(id)) return false;
  try {
    await access(getOriginalMediaPath(id));
    return true;
  } catch {
    return false;
  }
}

export async function hasOriginalForStorage(storageKey: string): Promise<boolean> {
  const match = /^\/api\/article-media\/([0-9a-f-]{36})$/.exec(storageKey);
  if (match) return hasLocalMediaOriginal(match[1]);
  if (!/^\/assets\/[a-z0-9][a-z0-9._-]*\.webp$/i.test(storageKey)) return false;
  try {
    await access(resolve(process.cwd(), 'public', `.${storageKey}`));
    return true;
  } catch {
    return false;
  }
}
