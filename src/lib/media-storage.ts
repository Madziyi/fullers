import 'server-only';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Variant = 'webp' | 'original';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function key(id: string, variant: Variant) {
  if (!uuid.test(id)) throw new Error('Invalid media identifier.');
  return `${id}.${variant}`;
}

function configuration() {
  const provider = process.env.MEDIA_STORAGE_PROVIDER ?? 'local';
  if (provider === 'local') {
    if (process.env.VERCEL) throw new Error('Durable media storage is required on Vercel.');
    return null;
  }
  if (provider !== 'supabase') throw new Error('Invalid media storage provider.');
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_MEDIA_BUCKET ?? 'fullers-media';
  if (!url || !secret || !secret.startsWith('sb_secret_') || !/^[a-z0-9-]+$/.test(bucket))
    throw new Error('Supabase media storage configuration is incomplete.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/')
    throw new Error('Supabase URL must be an HTTPS origin.');
  return { base: `${parsed.origin}/storage/v1/object`, secret, bucket };
}

async function remoteRequest(path: string, init: RequestInit = {}) {
  const config = configuration();
  if (!config) throw new Error('Supabase storage is not selected.');
  const response = await fetch(`${config.base}/${path.replace('{bucket}', config.bucket)}`, {
    ...init,
    headers: { ...init.headers, apikey: config.secret },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  });
  return response;
}

export async function writeMediaFile(id: string, variant: Variant, data: Buffer) {
  const filename = key(id, variant);
  if (!configuration()) {
    const directory = resolve(process.cwd(), '.local-media', 'article');
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, filename), data, { flag: 'wx' });
    return;
  }
  const response = await remoteRequest(`{bucket}/${filename}`, {
    method: 'POST',
    headers: {
      'Content-Type': variant === 'webp' ? 'image/webp' : 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: new Uint8Array(data),
  });
  if (!response.ok) throw new Error('Media storage write failed.');
}

export async function readMediaFile(id: string, variant: Variant): Promise<Buffer> {
  const filename = key(id, variant);
  if (!configuration())
    return readFile(resolve(process.cwd(), '.local-media', 'article', filename));
  const response = await remoteRequest(`authenticated/{bucket}/${filename}`);
  if (!response.ok) throw new Error('Media storage read failed.');
  return Buffer.from(await response.arrayBuffer());
}

export async function mediaOriginalExists(id: string): Promise<boolean> {
  const filename = key(id, 'original');
  if (!configuration()) {
    try {
      await readFile(resolve(process.cwd(), '.local-media', 'article', filename));
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }
  const response = await remoteRequest(`info/{bucket}/${filename}`);
  if (response.status === 404) return false;
  if (response.status === 400) {
    const error = await response.json().catch(() => null);
    if (error?.code === 'NoSuchKey' && String(error?.statusCode) === '404') return false;
  }
  if (!response.ok) throw new Error('Media storage lookup failed.');
  return true;
}

export async function deleteMediaFiles(id: string) {
  const filenames = [key(id, 'webp'), key(id, 'original')];
  if (!configuration()) {
    await Promise.all(
      filenames.map(async (filename) => {
        try {
          await unlink(resolve(process.cwd(), '.local-media', 'article', filename));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      }),
    );
    return;
  }
  const response = await remoteRequest('{bucket}', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: filenames }),
  });
  if (!response.ok) throw new Error('Media storage cleanup failed.');
}
