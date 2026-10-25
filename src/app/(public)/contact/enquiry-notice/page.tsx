import Link from 'next/link';
import { getSettings } from '@/lib/content';
export const metadata = {
  title: 'Enquiry form information',
  robots: { index: false, follow: true },
};
export default async function EnquiryNotice() {
  const settings = await getSettings();
  return (
    <main id="main" className="container notice-page">
      <p className="eyebrow">YOUR ENQUIRY / YOUR INFORMATION</p>
      <h1>
        How this form uses
        <br />
        your information.
      </h1>
      <p>
        The enquiry form collects your name, the phone number or email address you choose to
        provide, your message, an optional product selection and the time you give permission for us
        to respond.
      </p>
      <h2>Why we ask</h2>
      <p>
        We use these details to review your enquiry and discuss products, quantities and supply
        arrangements with you. Please share only the details needed for that conversation.
      </p>
      <h2>Who can see your enquiry</h2>
      <p>
        Enquiries are stored privately and are available to authorized Fullers administrators. They
        are not published on this website. This form does not subscribe you to a marketing list or
        send an automated email notification.
      </p>
      <h2>Other contact options</h2>
      <p>
        You can call <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>{' '}
        instead. If you choose WhatsApp or a map link, you will leave this website and use that
        service.
      </p>
      <h2>Questions about your details</h2>
      <p>
        Call our team if you want to ask about the information you submitted or request a correction
        or removal. Avoid sending payment information or sensitive personal details in your message.
      </p>
      <Link className="text-link" href="/contact">
        ← Return to your enquiry
      </Link>
    </main>
  );
}
