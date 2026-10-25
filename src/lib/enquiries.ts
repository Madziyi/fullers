import 'server-only';
import { db } from './db';
import { publicWhere } from './catalogue';
import { enquirySchema, type EnquiryResult } from './enquiry-validation';
import { privateEnquiryKey, verifyEnquiryToken } from './enquiry-token';
const failure = 'We couldn’t save your enquiry. Please try again or call the Fullers team.';
const success: EnquiryResult = {
  ok: true,
  message:
    'Your enquiry has been saved for the Fullers team. This is not a confirmed order. If you need to speak to someone, please call or use WhatsApp.',
};
class RateLimitError extends Error {}
export async function submitEnquiry(form: FormData, origin: string | null): Promise<EnquiryResult> {
  try {
    const allowed = [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_SITE_URL]
      .filter(Boolean)
      .map((url) => new URL(url!).origin);
    if (!origin || !allowed.includes(origin))
      return { ok: false, message: 'Please submit the form from the Fullers website.' };
    if (process.env.CONTENT_SOURCE === 'seed')
      return {
        ok: false,
        message: 'The enquiry form is unavailable in this preview. Please call or use WhatsApp.',
      };
    const token = form.get('formToken');
    if (typeof token !== 'string' || !verifyEnquiryToken(token) || form.get('website'))
      return { ok: false, message: 'Please refresh this page and try your enquiry again.' };
    const parsed = enquirySchema.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success) {
      const errors: EnquiryResult['errors'] = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof NonNullable<EnquiryResult['errors']>;
        if (key && !errors[key]) errors[key] = issue.message;
      }
      return { ok: false, message: 'Please check the highlighted details.', errors };
    }
    const data = parsed.data;
    const id = `enq_${privateEnquiryKey(`submission:${token}`)}`;
    await db.$transaction(async (tx) => {
      // One global row serializes quota/idempotency checks across all app instances.
      const global = await tx.$queryRaw<{ attempts: number }[]>`
        INSERT INTO "LoginThrottle" ("key", "attempts", "windowStart") VALUES ('enquiry:global', 1, NOW())
        ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE WHEN "LoginThrottle"."windowStart" < NOW() - INTERVAL '15 minutes' THEN 1 ELSE "LoginThrottle"."attempts" + 1 END,
        "windowStart" = CASE WHEN "LoginThrottle"."windowStart" < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE "LoginThrottle"."windowStart" END
        RETURNING "attempts"`;
      const existing = await tx.inquiry.findUnique({ where: { id }, select: { id: true } });
      if (existing) {
        await tx.loginThrottle.update({
          where: { key: 'enquiry:global' },
          data: { attempts: { decrement: 1 } },
        });
        return;
      }
      if (!global[0] || global[0].attempts > 50) throw new RateLimitError();
      if (
        data.productSlug &&
        !(await tx.product.findFirst({
          where: { ...publicWhere(), slug: data.productSlug },
          select: { id: true },
        }))
      )
        throw new Error('Unknown product');
      const contacts = [
        data.email ? `email:${data.email}` : '',
        data.phone ? `phone:${data.phone.replace(/\D/g, '')}` : '',
      ]
        .filter(Boolean)
        .sort();
      for (const contact of contacts) {
        const key = `enquiry:contact:${privateEnquiryKey(contact)}`;
        const limits = await tx.$queryRaw<{ attempts: number }[]>`
          INSERT INTO "LoginThrottle" ("key", "attempts", "windowStart") VALUES (${key}, 1, NOW())
          ON CONFLICT ("key") DO UPDATE SET
          "attempts" = CASE WHEN "LoginThrottle"."windowStart" < NOW() - INTERVAL '15 minutes' THEN 1 ELSE "LoginThrottle"."attempts" + 1 END,
          "windowStart" = CASE WHEN "LoginThrottle"."windowStart" < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE "LoginThrottle"."windowStart" END
          RETURNING "attempts"`;
        if (!limits[0] || limits[0].attempts > 3) throw new RateLimitError();
      }
      await tx.inquiry.create({
        data: {
          id,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          message: data.message,
          productSlug: data.productSlug || null,
          consentAt: new Date(),
        },
      });
    });
    return success;
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof RateLimitError
          ? 'You’ve sent several enquiries recently. Please wait 15 minutes, or contact us by phone or WhatsApp.'
          : failure,
    };
  }
}
