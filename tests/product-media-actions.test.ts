import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb, mockRequireAdmin, mockTx } = vi.hoisted(() => {
  const tx = {
    product: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
    media: { findFirst: vi.fn(), updateMany: vi.fn() },
    $queryRaw: vi.fn(),
    auditLog: { create: vi.fn() },
  };
  return {
    mockTx: tx,
    mockDb: {
      product: { findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
      media: { findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
      auditLog: { create: vi.fn() },
      $transaction: vi.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)),
    },
    mockRequireAdmin: vi.fn(),
  };
});
vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth', () => ({ requireAdmin: mockRequireAdmin }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
import { deleteProduct, saveProduct } from '@/app/admin/(protected)/products/actions';
import { removeMedia, updateMedia } from '@/app/admin/(protected)/media/actions';

const id = 'c123456789012345678901234';
const mediaUuid = '550e8400-e29b-41d4-a716-446655440000';
const validProduct = (overrides: Record<string, unknown> = {}) => ({
  id,
  expectedUpdatedAt: '2026-10-25T12:00:00.000Z',
  name: 'Quarry Stones',
  slug: 'quarry-stones',
  summary: 'Quarry stone for building and construction enquiries.',
  paragraphs: [],
  applications: ['Building'],
  specifications: [],
  faqs: [],
  imageId: null,
  imageAlt: '',
  relatedIds: [],
  featured: false,
  sortOrder: 0,
  seoTitle: '',
  seoDescription: '',
  status: 'DRAFT',
  ...overrides,
});

describe('product and media administrator boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockRejectedValue(new Error('Administrator access required.'));
  });

  it('rejects direct product save and archive calls without administrator authorization', async () => {
    await expect(saveProduct(validProduct())).rejects.toThrow('Administrator');
    await expect(deleteProduct(id, '2026-10-25T12:00:00.000Z')).rejects.toThrow('Administrator');
    await expect(
      updateMedia({ id: mediaUuid, alt: 'Alt', source: 'Source', focalX: 0.5, focalY: 0.5 }),
    ).rejects.toThrow('Administrator');
    expect(mockDb.product.updateMany).not.toHaveBeenCalled();
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it('refuses a save when the product version changed after the editor loaded', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockDb.product.findMany.mockResolvedValue([]);
    mockTx.product.updateMany.mockResolvedValue({ count: 0 });
    const result = await saveProduct(validProduct());
    expect(result).toEqual({
      ok: false,
      error: 'This product changed in another session. Reload before saving.',
    });
  });

  it('rejects incomplete specification rows before any database mutation', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    const result = await saveProduct(
      validProduct({ specifications: [{ label: 'Size', value: '' }] }),
    );
    expect(result).toEqual({ ok: false, error: 'Check required fields and try again.' });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it('accepts UUID media IDs from the upload route and saves the new reference without replacing media bytes', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockDb.media.findFirst.mockResolvedValue({ id: mediaUuid });
    mockDb.product.findMany.mockResolvedValue([]);
    mockTx.product.updateMany.mockResolvedValue({ count: 1 });
    mockTx.product.findUniqueOrThrow.mockResolvedValue({
      id,
      slug: 'quarry-stones',
      updatedAt: new Date('2026-10-25T12:01:00.000Z'),
    });
    const result = await saveProduct(
      validProduct({ imageId: mediaUuid, imageAlt: 'Quarry stone at Fullers' }),
    );
    expect(result).toMatchObject({ ok: true });
    expect(mockDb.media.findFirst).toHaveBeenCalledWith({
      where: { id: mediaUuid, deletedAt: null },
      select: { id: true },
    });
    expect(mockTx.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ imageId: mediaUuid }) }),
    );
  });

  it('accepts UUID media IDs when saving source, alt and focal point metadata', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockTx.media.updateMany.mockResolvedValue({ count: 1 });
    const result = await updateMedia({
      id: mediaUuid,
      alt: 'Stone detail',
      source: 'Fullers image',
      focalX: 0.4,
      focalY: 0.6,
    });
    expect(result).toEqual({ ok: true });
    expect(mockTx.media.updateMany).toHaveBeenCalledWith({
      where: { id: mediaUuid, deletedAt: null },
      data: { alt: 'Stone detail', source: 'Fullers image', focalX: 0.4, focalY: 0.6 },
    });
  });

  it('keeps media in place while any product still references it', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockTx.$queryRaw.mockResolvedValue([{ id }]);
    mockTx.media.findFirst.mockResolvedValue({
      id,
      articlePostId: null,
      _count: { products: 1, posts: 0, projects: 0 },
    });
    const result = await removeMedia(id);
    expect(result).toEqual({
      ok: false,
      error: 'Remove this image from its content before archiving it.',
    });
    expect(mockDb.media.update).not.toHaveBeenCalled();
  });

  it('keeps article-upload media in place even without a product, post-cover, or project reference', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockTx.$queryRaw.mockResolvedValue([{ id }]);
    mockTx.media.findFirst.mockResolvedValue({
      id,
      articlePostId: 'post-1',
      _count: { products: 0, posts: 0, projects: 0 },
    });
    const result = await removeMedia(id);
    expect(result).toEqual({
      ok: false,
      error: 'Remove this image from its content before archiving it.',
    });
    expect(mockDb.media.update).not.toHaveBeenCalled();
  });

  it('refuses to archive a product when its expected version is stale', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockDb.product.findFirst.mockResolvedValue({
      slug: 'quarry-stones',
      updatedAt: new Date('2026-10-25T13:00:00.000Z'),
    });
    const result = await deleteProduct(id, '2026-10-25T12:00:00.000Z');
    expect(result).toEqual({
      ok: false,
      error: 'This product changed. Reload before archiving it.',
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });
});
