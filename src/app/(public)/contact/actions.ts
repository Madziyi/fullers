'use server';
import { headers } from 'next/headers';
import { submitEnquiry } from '@/lib/enquiries';
import type { EnquiryResult } from '@/lib/enquiry-validation';
export async function sendEnquiry(_previous: EnquiryResult, form: FormData) {
  return submitEnquiry(form, (await headers()).get('origin'));
}
