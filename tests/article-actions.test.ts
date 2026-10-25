import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb, mockRequireUser, mockRequireAdmin } = vi.hoisted(() => ({
  mockDb: {
    post: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    postCategory: { findUnique: vi.fn() },
    tag: { findMany: vi.fn() },
    media: { count: vi.fn() },
    $transaction: vi.fn(),
  },
  mockRequireUser: vi.fn(),
  mockRequireAdmin: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth', () => ({ requireUser: mockRequireUser, requireAdmin: mockRequireAdmin }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import {
  publishArticle,
  saveArticle,
  unpublishArticle,
} from '@/app/admin/(protected)/posts/actions';

const validDraft = (overrides: Record<string, unknown> = {}) => ({
  id: 'c123456789012345678901234',
  version: 4,
  title: 'A practical article about aggregates',
  slug: 'practical-aggregates',
  excerpt: 'Guidance for choosing materials for a building project.',
  body: { type: 'doc', blocks: [{ type: 'paragraph', text: 'A useful article paragraph.' }] },
  seoTitle: 'Choosing aggregates',
  seoDescription: 'Practical information for people planning a building project.',
  authorName: 'Fullers Aggregate',
  coverSrc: null,
  coverAlt: '',
  categoryId: null,
  tagIds: [],
  productIds: [],
  ...overrides,
});

describe('article action authorization and conflict boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: 'editor-1', role: 'EDITOR' });
    mockRequireAdmin.mockRejectedValue(new Error('Administrator access required.'));
  });

  it('denies editor calls to publish and unpublish even when directly invoked', async () => {
    await expect(publishArticle('c123456789012345678901234', 4)).rejects.toThrow('Administrator');
    await expect(unpublishArticle('c123456789012345678901234')).rejects.toThrow('Administrator');
    expect(mockDb.post.findUnique).not.toHaveBeenCalled();
  });

  it('refuses saving another author’s article', async () => {
    mockDb.post.findUnique.mockResolvedValue({
      authorId: 'someone-else',
      version: 4,
      deletedAt: null,
      publishedSlug: null,
    });
    const result = await saveArticle(validDraft());
    expect(result).toEqual({ ok: false, error: 'This article is unavailable.' });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it('rejects an obsolete save version through the atomic compare-and-swap', async () => {
    mockDb.post.findUnique.mockResolvedValue({
      authorId: 'editor-1',
      version: 4,
      deletedAt: null,
      publishedSlug: null,
    });
    mockDb.product.findMany.mockResolvedValue([]);
    mockDb.postCategory.findUnique.mockResolvedValue(null);
    mockDb.tag.findMany.mockResolvedValue([]);
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    mockDb.$transaction.mockImplementation(async (work: (tx: unknown) => unknown) =>
      work({ post: { updateMany } }),
    );
    const result = await saveArticle(validDraft({ version: 3 }));
    expect(result).toEqual({ ok: false, error: 'conflict' });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'c123456789012345678901234',
          version: 3,
          authorId: 'editor-1',
        }),
      }),
    );
  });

  it('refuses uploaded media owned by another article', async () => {
    mockDb.post.findUnique.mockResolvedValue({
      authorId: 'editor-1',
      version: 4,
      deletedAt: null,
      publishedSlug: null,
    });
    mockDb.product.findMany.mockResolvedValue([]);
    mockDb.postCategory.findUnique.mockResolvedValue(null);
    mockDb.tag.findMany.mockResolvedValue([]);
    mockDb.media.count.mockResolvedValue(0);
    const result = await saveArticle(
      validDraft({
        body: {
          type: 'doc',
          blocks: [
            {
              type: 'image',
              src: '/api/article-media/123e4567-e89b-12d3-a456-426614174000',
              alt: '',
              caption: '',
            },
          ],
        },
      }),
    );
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining('not attached to this article'),
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });
});
