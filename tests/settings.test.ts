import { beforeEach, describe, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  update: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({ requireAdmin: mocks.admin }));
vi.mock('../src/lib/db', () => ({ db: { $transaction: mocks.transaction } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
import { saveSettings } from '../src/app/admin/(protected)/settings/actions';
import { initialSettings } from '../src/lib/catalogue';
function data() {
  const form = new FormData();
  Object.entries(initialSettings).forEach(([k, v]) => form.set(k, v));
  return form;
}
describe('settings write boundary', () => {
  beforeEach(() => {
    vi.stubEnv('CONTENT_SOURCE', 'database');
    mocks.admin.mockResolvedValue({ id: 'admin-1' });
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({ siteSettings: { update: mocks.update }, auditLog: { create: mocks.audit } }),
    );
  });
  it('rejects unauthorized mutations before writes', async () => {
    mocks.admin.mockRejectedValue(new Error('Unauthorized'));
    await expect(saveSettings({ ok: false, message: '' }, data())).rejects.toThrow('Unauthorized');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('validates settings server-side', async () => {
    const form = data();
    form.set('jobsValue', '');
    const result = await saveSettings({ ok: false, message: '' }, form);
    expect(result.ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects unsafe social profile URLs before writing', async () => {
    const form = data();
    form.set('socialLinks', JSON.stringify([{ label: 'Profile', url: 'javascript:alert(1)' }]));
    expect((await saveSettings({ ok: false, message: '' }, form)).ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('writes settings and audit together and invalidates the public layout', async () => {
    const form = data();
    form.set('jobsValue', '701+');
    const result = await saveSettings({ ok: false, message: '' }, form);
    expect(result.ok).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ jobsValue: '701+' }) }),
    );
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ actorId: 'admin-1' }) }),
    );
    expect(mocks.revalidate).toHaveBeenCalledWith('/', 'layout');
  });
  it('does not pretend seed preview can save', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'seed');
    expect((await saveSettings({ ok: false, message: '' }, data())).ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
