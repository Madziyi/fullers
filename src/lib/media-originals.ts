import 'server-only';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

import { mediaOriginalExists, writeMediaFile } from './media-storage';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isMediaUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export async function preserveMediaOriginal(id: string, input: Buffer): Promise<void> {
  await writeMediaFile(id, 'original', input);
}

export async function hasMediaOriginal(id: string): Promise<boolean> {
  if (!isMediaUuid(id)) return false;
  return mediaOriginalExists(id);
}

export async function hasOriginalForStorage(storageKey: string): Promise<boolean> {
  const match = /^\/api\/article-media\/([0-9a-f-]{36})$/.exec(storageKey);
  if (match) return hasMediaOriginal(match[1]);
  if (!/^\/assets\/[a-z0-9][a-z0-9._-]*\.webp$/i.test(storageKey)) return false;
  try {
    await access(resolve(process.cwd(), 'public', `.${storageKey}`));
    return true;
  } catch {
    return false;
  }
}
