import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
function secret() {
  const key = process.env.NEXTAUTH_SECRET;
  if (!key || key.length < 24) throw new Error('Enquiry signing is not configured.');
  return key;
}
function sign(value: string) {
  return createHmac('sha256', secret()).update(`fullers:enquiry:v1:${value}`).digest('hex');
}
export function createEnquiryToken(now = Date.now()) {
  const body = `${now}.${randomBytes(16).toString('hex')}`;
  return `${body}.${sign(body)}`;
}
export function verifyEnquiryToken(token: string, now = Date.now()) {
  if (!/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)) return false;
  const [time, nonce, signature] = token.split('.');
  const age = now - Number(time);
  if (age < 0 || age > 2 * 60 * 60 * 1000) return false;
  return timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(sign(`${time}.${nonce}`), 'hex'),
  );
}
export function privateEnquiryKey(value: string) {
  return sign(value);
}
