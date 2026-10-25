import { afterEach, describe, expect, it, vi } from 'vitest';

const { runWorker } = vi.hoisted(() => ({ runWorker: vi.fn() }));
vi.mock('@/lib/publication-worker', () => ({ processDuePublications: runWorker }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { POST } from '@/app/api/internal/publish-due/route';

const secret = 'unit-test-only-publishing-worker-secret-32-bytes';

afterEach(() => {
  delete process.env.PUBLISH_WORKER_SECRET;
  vi.clearAllMocks();
});

describe('protected publication worker entry point', () => {
  it('reports disabled configuration without revealing schedule data', async () => {
    const response = await POST(
      new Request('http://localhost/api/internal/publish-due', { method: 'POST' }),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      error: 'Scheduled publishing worker is not configured.',
    });
    expect(runWorker).not.toHaveBeenCalled();
  });

  it('rejects wrong secrets and malformed batch limits', async () => {
    process.env.PUBLISH_WORKER_SECRET = secret;
    const denied = await POST(
      new Request('http://localhost/api/internal/publish-due', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong' },
      }),
    );
    expect(denied.status).toBe(401);
    const invalidLimit = await POST(
      new Request('http://localhost/api/internal/publish-due?limit=999', {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}` },
      }),
    );
    expect(invalidLimit.status).toBe(400);
    expect(runWorker).not.toHaveBeenCalled();
  });

  it('runs a bounded batch only after secret authorization', async () => {
    process.env.PUBLISH_WORKER_SECRET = secret;
    runWorker.mockResolvedValue({
      processed: 2,
      published: 1,
      needsReview: 1,
      failed: 0,
      retried: 0,
    });
    const response = await POST(
      new Request('http://localhost/api/internal/publish-due?limit=2', {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}` },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(runWorker).toHaveBeenCalledWith(expect.any(Date), 2);
    expect(await response.json()).toMatchObject({ published: 1, needsReview: 1 });
  });
});
