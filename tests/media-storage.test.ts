import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deleteMediaFiles,
  mediaOriginalExists,
  readMediaFile,
  writeMediaFile,
} from '@/lib/media-storage';

const id = 'd6d33a51-5450-4e4f-b82e-83fb44be632a';
function configure() {
  vi.stubEnv('MEDIA_STORAGE_PROVIDER', 'supabase');
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test');
  vi.stubEnv('SUPABASE_MEDIA_BUCKET', 'fullers-media');
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('private Supabase media storage', () => {
  it('uploads without overwriting and sends the secret only as an API key', async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetcher);
    await writeMediaFile(id, 'original', Buffer.from('original'));
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(`https://example.supabase.co/storage/v1/object/fullers-media/${id}.original`);
    expect(options.headers).toMatchObject({ apikey: 'sb_secret_test', 'x-upsert': 'false' });
    expect(options.headers.Authorization).toBeUndefined();
    expect(options.redirect).toBe('error');
    expect(options.cache).toBe('no-store');
  });
  it('reads through the authenticated endpoint and preserves original bytes', async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(new Response(new Uint8Array([0, 255, 10])));
    vi.stubGlobal('fetch', fetcher);
    expect(await readMediaFile(id, 'original')).toEqual(Buffer.from([0, 255, 10]));
    expect(fetcher.mock.calls[0][0]).toContain(
      `/object/authenticated/fullers-media/${id}.original`,
    );
  });
  it('does not treat permission or service failures as missing originals', async () => {
    configure();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', fetcher);
    expect(await mediaOriginalExists(id)).toBe(false);
    await expect(mediaOriginalExists(id)).rejects.toThrow('lookup failed');
  });
  it('recognizes Supabase NoSuchKey without swallowing other HTTP 400 failures', async () => {
    configure();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: '404', code: 'NoSuchKey' }), { status: 400 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: '403', code: 'AccessDenied' }), { status: 400 }),
      );
    vi.stubGlobal('fetch', fetcher);
    expect(await mediaOriginalExists(id)).toBe(false);
    await expect(mediaOriginalExists(id)).rejects.toThrow('lookup failed');
  });
  it('cleans up only the two objects for the validated media ID', async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetcher);
    await deleteMediaFiles(id);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      prefixes: [`${id}.webp`, `${id}.original`],
    });
    await expect(deleteMediaFiles('../other')).rejects.toThrow('Invalid media identifier');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('fails closed for absent credentials, storage errors and ephemeral hosted disk', async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(writeMediaFile(id, 'webp', Buffer.from('image'))).rejects.toThrow('write failed');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    await expect(readMediaFile(id, 'webp')).rejects.toThrow('incomplete');
    vi.stubEnv('MEDIA_STORAGE_PROVIDER', 'local');
    vi.stubEnv('VERCEL', '1');
    await expect(readMediaFile(id, 'webp')).rejects.toThrow('Durable media storage');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
