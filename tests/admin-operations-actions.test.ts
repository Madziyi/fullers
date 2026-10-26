import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  transaction: vi.fn(),
  userCreate: vi.fn(),
  userFind: vi.fn(),
  userCount: vi.fn(),
  userUpdate: vi.fn(),
  redirectFind: vi.fn(),
  redirectCreate: vi.fn(),
  redirectUpdate: vi.fn(),
  redirectDelete: vi.fn(),
  auditCreate: vi.fn(),
  hash: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('../src/lib/db', () => ({
  db: {
    $transaction: mocks.transaction,
    user: {
      create: mocks.userCreate,
      findUnique: mocks.userFind,
      count: mocks.userCount,
      updateMany: mocks.userUpdate,
    },
    redirect: {
      findMany: mocks.redirectFind,
      findUnique: vi.fn(),
      create: mocks.redirectCreate,
      update: mocks.redirectUpdate,
      delete: mocks.redirectDelete,
    },
    auditLog: { create: mocks.auditCreate },
  },
}));
vi.mock('bcryptjs', () => ({ hash: mocks.hash }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import {
  createManagedUser,
  updateManagedUser,
  saveManagedRedirect,
} from '../src/app/admin/(protected)/operations/actions';

const actor = { id: 'c1234567890123456789012345', role: 'ADMIN' };
function actionRedirect(url: string): never {
  const error = new Error('redirect') as Error & { digest: string };
  error.digest = `NEXT_REDIRECT;${url}`;
  throw error;
}
function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

describe('administrator operations actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CONTENT_SOURCE', 'database');
    mocks.requireAdmin.mockResolvedValue(actor);
    mocks.hash.mockResolvedValue('bcrypt-hash');
    mocks.userCreate.mockResolvedValue({
      id: 'user-2',
      email: 'editor@example.test',
      role: 'EDITOR',
      active: true,
    });
    mocks.userFind.mockResolvedValue({ role: 'ADMIN', active: true });
    mocks.userCount.mockResolvedValue(1);
    mocks.userUpdate.mockResolvedValue({ count: 1 });
    mocks.redirectFind.mockResolvedValue([]);
    mocks.redirectCreate.mockResolvedValue({ id: 'redirect-1' });
    mocks.auditCreate.mockResolvedValue({});
    mocks.redirect.mockImplementation((url: string) => actionRedirect(url));
    mocks.transaction.mockImplementation(
      async (callback: (tx: Record<string, unknown>) => unknown) =>
        callback({
          user: {
            create: mocks.userCreate,
            findUnique: mocks.userFind,
            count: mocks.userCount,
            updateMany: mocks.userUpdate,
          },
          redirect: {
            findMany: mocks.redirectFind,
            create: mocks.redirectCreate,
            update: mocks.redirectUpdate,
            delete: mocks.redirectDelete,
          },
          auditLog: { create: mocks.auditCreate },
        }),
    );
  });

  it('stores only the hash for a new account and omits email/password from its audit', async () => {
    await expect(
      createManagedUser(
        form({
          email: 'editor@example.test',
          name: 'Editor',
          password: 'a-secure-password',
          role: 'EDITOR',
        }),
      ),
    ).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;/admin/users?result=created' });
    expect(mocks.hash).toHaveBeenCalledWith('a-secure-password', 12);
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        email: 'editor@example.test',
        name: 'Editor',
        role: 'EDITOR',
        passwordHash: 'bcrypt-hash',
      },
    });
    expect(JSON.stringify(mocks.auditCreate.mock.calls)).not.toContain('editor@example.test');
    expect(JSON.stringify(mocks.auditCreate.mock.calls)).not.toContain('a-secure-password');
  });

  it('rejects an editor before touching admin data', async () => {
    mocks.requireAdmin.mockRejectedValue(new Error('Administrator access required.'));
    await expect(
      createManagedUser(
        form({
          email: 'editor@example.test',
          name: 'Editor',
          password: 'a-secure-password',
          role: 'EDITOR',
        }),
      ),
    ).rejects.toThrow('Administrator access required');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('prevents self-demotion and self-disable before a database mutation', async () => {
    await expect(
      updateManagedUser(form({ id: actor.id, role: 'EDITOR', active: 'true', confirm: 'yes' })),
    ).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;/admin/users?result=self' });
    await expect(
      updateManagedUser(form({ id: actor.id, role: 'ADMIN', active: 'false', confirm: 'yes' })),
    ).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;/admin/users?result=self' });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('prevents last active admin removal inside a serializable transaction', async () => {
    await expect(
      updateManagedUser(
        form({ id: 'c1234567890123456789012346', role: 'EDITOR', active: 'true', confirm: 'yes' }),
      ),
    ).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;/admin/users?result=last-admin' });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(mocks.userCount).toHaveBeenCalledWith({ where: { role: 'ADMIN', active: true } });
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it('checks redirect cycles inside the serializable write transaction before creating or auditing', async () => {
    mocks.redirectFind
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ source: '/older', destination: '/old' }]);
    await expect(
      saveManagedRedirect(form({ source: '/old', destination: '/older', permanent: 'true' })),
    ).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;/admin/redirects?result=cycle' });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(mocks.redirectCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
