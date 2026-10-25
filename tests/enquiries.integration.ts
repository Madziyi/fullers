import { afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db } from '../src/lib/db';
import { submitEnquiry } from '../src/lib/enquiries';
import { createEnquiryToken, privateEnquiryKey } from '../src/lib/enquiry-token';
const email = `integration-${randomUUID()}@example.test`;
const keys = [`enquiry:contact:${privateEnquiryKey(`email:${email}`)}`];
const origin = new URL(process.env.NEXTAUTH_URL!).origin;
function form() {
  const data = new FormData();
  Object.entries({
    name: 'Disposable integration fixture',
    email,
    phone: '',
    message: '<script>Not executable</script> Please discuss bricks for our building project.',
    productSlug: 'bricks',
    consent: 'yes',
    formToken: createEnquiryToken(),
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
afterAll(async () => {
  await db.inquiry.deleteMany({ where: { email } });
  await db.loginThrottle.deleteMany({ where: { key: { in: keys } } });
  await db.$disconnect();
});
describe('real PostgreSQL enquiry persistence', () => {
  it('stores only once under concurrent retries, then enforces a contact quota atomically', async () => {
    const first = form();
    const retries = await Promise.all([submitEnquiry(first, origin), submitEnquiry(first, origin)]);
    expect(retries.every((result) => result.ok)).toBe(true);
    expect(await db.inquiry.count({ where: { email } })).toBe(1);
    const stored = await db.inquiry.findFirstOrThrow({ where: { email } });
    expect(stored.consentAt).toBeInstanceOf(Date);
    expect(stored.message).toContain('<script>');
    expect(stored.status).toBe('NEW');
    const quota = await Promise.all([
      submitEnquiry(form(), origin),
      submitEnquiry(form(), origin),
      submitEnquiry(form(), origin),
    ]);
    expect(quota.filter((result) => result.ok)).toHaveLength(2);
    expect(quota.filter((result) => !result.ok)).toHaveLength(1);
    expect(await db.inquiry.count({ where: { email } })).toBe(3);
    const previous = await db.inquiry.count({ where: { email } });
    const bad = form();
    bad.set('website', 'bot');
    expect((await submitEnquiry(bad, origin)).ok).toBe(false);
    expect((await submitEnquiry(form(), 'https://foreign.example')).ok).toBe(false);
    expect(await db.inquiry.count({ where: { email } })).toBe(previous);
  });
});
