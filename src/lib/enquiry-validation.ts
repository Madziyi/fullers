import { z } from 'zod';
export const enquirySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Please enter your name.')
      .max(100, 'Use 100 characters or fewer.'),
    email: z
      .union([z.literal(''), z.email('Enter a valid email address.').max(254)])
      .transform((value) => value.toLowerCase()),
    phone: z.union([
      z.literal(''),
      z
        .string()
        .trim()
        .regex(/^\+?[\d ()-]{7,30}$/, 'Enter a phone number with 7–15 digits.')
        .refine((value) => {
          const digits = value.replace(/\D/g, '');
          return digits.length >= 7 && digits.length <= 15;
        }, 'Enter a phone number with 7–15 digits.'),
    ]),
    message: z
      .string()
      .trim()
      .min(20, 'Please tell us a little more (at least 20 characters).')
      .max(4000, 'Use 4,000 characters or fewer.'),
    productSlug: z
      .string()
      .max(100)
      .regex(/^[a-z0-9-]*$/),
    consent: z.literal('yes', { error: 'Please confirm we may use these details to respond.' }),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone)
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Add an email address or phone number so we can respond.',
      });
  });
export type EnquiryValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
  productSlug: string;
  consent: string;
};
export type EnquiryResult = {
  ok: boolean;
  message: string;
  errors?: Partial<Record<keyof EnquiryValues, string>>;
};
