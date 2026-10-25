import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  user: vi.fn(),
  raw: vi.fn(),
  compare: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('next-auth', () => ({ getServerSession: mocks.session }));
vi.mock('bcryptjs', () => ({ hashSync: () => 'dummy-hash', compare: mocks.compare }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('../src/lib/db', () => ({
  db: { user: { findUnique: mocks.user }, $queryRaw: mocks.raw },
}));
import { authOptions, currentUser, requireAdmin } from '../src/lib/auth';
const provider = authOptions.providers[0];
// CredentialsProvider stores its supplied implementation in options.
const authorize = (
  provider as typeof provider & {
    options: { authorize: (credentials: Record<string, string>) => Promise<unknown> };
  }
).options.authorize;
describe('authentication boundaries', () => {
  beforeEach(() => {
    mocks.raw.mockResolvedValue([{ attempts: 1 }]);
    mocks.compare.mockResolvedValue(true);
    mocks.user.mockResolvedValue({
      id: 'u1',
      active: true,
      role: 'ADMIN',
      email: 'admin@example.test',
      name: 'Admin',
      passwordHash: 'hash',
    });
    mocks.session.mockResolvedValue(null);
  });
  it('rejects malformed credentials before database access', async () => {
    expect(await authorize({ email: 'bad', password: '' })).toBeNull();
    expect(mocks.raw).not.toHaveBeenCalled();
  });
  it('authenticates an active account with valid password', async () => {
    expect(await authorize({ email: 'admin@example.test', password: 'valid' })).toEqual({
      id: 'u1',
      email: 'admin@example.test',
      name: 'Admin',
    });
  });
  it('rejects inactive accounts and wrong passwords', async () => {
    mocks.compare.mockResolvedValue(false);
    expect(await authorize({ email: 'admin@example.test', password: 'wrong' })).toBeNull();
    mocks.compare.mockResolvedValue(true);
    mocks.user.mockResolvedValue({ active: false, passwordHash: 'hash' });
    expect(await authorize({ email: 'admin@example.test', password: 'valid' })).toBeNull();
  });
  it('rate limits before user lookup', async () => {
    mocks.raw.mockResolvedValue([{ attempts: 6 }]);
    expect(await authorize({ email: 'admin@example.test', password: 'valid' })).toBeNull();
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it('fails closed on database failure', async () => {
    mocks.raw.mockRejectedValue(new Error('connection refused'));
    expect(await authorize({ email: 'admin@example.test', password: 'valid' })).toBeNull();
  });
  it('does not accept client identity or role without a valid session', async () => {
    expect(await currentUser()).toBeNull();
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it('rechecks active status and role in database on protected requests', async () => {
    mocks.session.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } });
    mocks.user.mockResolvedValue({ id: 'u1', active: true, role: 'EDITOR' });
    await expect(requireAdmin()).rejects.toThrow('Administrator access');
    mocks.user.mockResolvedValue({ id: 'u1', active: false });
    expect(await currentUser()).toBeNull();
  });
});
