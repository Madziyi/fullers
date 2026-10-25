import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enquirySchema } from '../src/lib/enquiry-validation';
import { createEnquiryToken, verifyEnquiryToken } from '../src/lib/enquiry-token';
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  raw: vi.fn(),
  existing: vi.fn(),
  product: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock('../src/lib/db', () => ({ db: { $transaction: mocks.transaction } }));
import { submitEnquiry } from '../src/lib/enquiries';
const valid = {
  name: 'QA Visitor',
  email: 'visitor@example.test',
  phone: '',
  message: 'Please discuss the materials for our next building project.',
  productSlug: 'bricks',
  consent: 'yes',
};
function form() {
  const data = new FormData();
  Object.entries(valid).forEach(([key, value]) => data.set(key, value));
  data.set('formToken', createEnquiryToken());
  return data;
}
describe('enquiry intake', () => {
  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_SECRET', 'test-only-signing-secret-at-least-32-characters');
    vi.stubEnv('NEXTAUTH_URL', 'http://127.0.0.1:3107');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://127.0.0.1:3107');
    vi.stubEnv('CONTENT_SOURCE', 'database');
    mocks.raw.mockResolvedValue([{ attempts: 1 }]);
    mocks.existing.mockResolvedValue(null);
    mocks.product.mockResolvedValue({ id: 'bricks' });
    mocks.create.mockResolvedValue({ id: 'private' });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: mocks.raw,
        inquiry: { findUnique: mocks.existing, create: mocks.create },
        product: { findFirst: mocks.product },
        loginThrottle: { update: mocks.update },
      }),
    );
  });
  it('requires consent, bounded fields and a valid contact method', () => {
    expect(enquirySchema.safeParse(valid).success).toBe(true);
    expect(
      enquirySchema.safeParse({ ...valid, email: '', phone: '+263 78 747 8592' }).success,
    ).toBe(true);
    for (const data of [
      { email: '', phone: '' },
      { consent: '' },
      { message: 'short' },
      { phone: 'invalid' },
      { email: 'invalid' },
      { name: 'x'.repeat(101) },
    ])
      expect(enquirySchema.safeParse({ ...valid, ...data }).success).toBe(false);
  });
  it('rejects expired, future, malformed and tampered tokens', () => {
    const now = Date.now();
    const token = createEnquiryToken(now);
    expect(verifyEnquiryToken(token, now)).toBe(true);
    expect(verifyEnquiryToken(token, now + 2 * 60 * 60 * 1000 + 1)).toBe(false);
    expect(verifyEnquiryToken(token, now - 1)).toBe(false);
    expect(verifyEnquiryToken(`${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`, now)).toBe(
      false,
    );
    expect(verifyEnquiryToken('invalid', now)).toBe(false);
  });
  it('fails closed with no signing secret', async () => {
    const data = form();
    vi.stubEnv('NEXTAUTH_SECRET', '');
    expect((await submitEnquiry(data, 'http://127.0.0.1:3107')).ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects foreign origins, honeypots and seed-only mode before writes', async () => {
    const data = form();
    expect((await submitEnquiry(data, 'https://other.example')).ok).toBe(false);
    expect((await submitEnquiry(data, null)).ok).toBe(false);
    data.set('website', 'spam');
    expect((await submitEnquiry(data, 'http://127.0.0.1:3107')).ok).toBe(false);
    data.delete('website');
    vi.stubEnv('CONTENT_SOURCE', 'seed');
    expect((await submitEnquiry(data, 'http://127.0.0.1:3107')).ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('returns field errors before opening a transaction', async () => {
    const data = form();
    data.delete('consent');
    const result = await submitEnquiry(data, 'http://127.0.0.1:3107');
    expect(result.errors?.consent).toBeTruthy();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('stores minimal validated data and permission only after quotas pass', async () => {
    expect((await submitEnquiry(form(), 'http://127.0.0.1:3107')).ok).toBe(true);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: valid.name,
        email: valid.email,
        phone: null,
        message: valid.message,
        productSlug: 'bricks',
        consentAt: expect.any(Date),
      }),
    });
    expect(mocks.raw).toHaveBeenCalledTimes(2);
  });
  it('treats retries as success without duplicate writes or quota consumption', async () => {
    mocks.existing.mockResolvedValue({ id: 'exists' });
    expect((await submitEnquiry(form(), 'http://127.0.0.1:3107')).ok).toBe(true);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: { decrement: 1 } } }),
    );
  });
  it('rejects unknown/unpublished products and exhausted quotas', async () => {
    mocks.product.mockResolvedValue(null);
    expect((await submitEnquiry(form(), 'http://127.0.0.1:3107')).ok).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
    mocks.product.mockResolvedValue({ id: 'bricks' });
    mocks.raw.mockResolvedValue([{ attempts: 51 }]);
    expect((await submitEnquiry(form(), 'http://127.0.0.1:3107')).message).toContain('15 minutes');
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('does not acknowledge failed writes or expose database error text', async () => {
    mocks.create.mockRejectedValue(new Error('sensitive db diagnostic'));
    const result = await submitEnquiry(form(), 'http://127.0.0.1:3107');
    expect(result.ok).toBe(false);
    expect(result.message).not.toContain('sensitive');
  });
});
