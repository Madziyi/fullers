import { z } from 'zod';
const shortText = z
  .string()
  .trim()
  .min(1, 'Please complete this field.')
  .max(80, 'Use 80 characters or fewer.');
export const settingsSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+263(?:[ -]?\d){9}$/, 'Use a Zimbabwe number beginning +263.'),
  location: z.string().trim().min(1).max(250),
  experienceValue: shortText.max(16),
  experienceLabel: shortText,
  jobsValue: shortText.max(16),
  jobsLabel: shortText,
  satisfactionValue: shortText.max(16),
  satisfactionLabel: shortText,
  awardClaim: shortText,
  seoTitle: z.string().trim().min(5).max(100),
  seoDescription: z.string().trim().min(20).max(300),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
