import { getSettings, getProducts } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
import { whatsappUrl } from '@/lib/catalogue';
import { createEnquiryToken } from '@/lib/enquiry-token';
import { PageIntro } from '@/components/page-intro';
import { Arrow } from '@/components/icons';
import { EnquiryForm } from './form';
export const metadata = pageMetadata(
  'Contact Fullers Aggregate & request a quote',
  'Contact Fullers Aggregate in Bindura. Enquire about concrete products, quarry stones, quantities and delivery arrangements by phone, WhatsApp or our enquiry form.',
  '/contact',
);
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const [settings, products, query] = await Promise.all([
    getSettings(),
    getProducts(),
    searchParams,
  ]);
  let token: string | null = null;
  if (process.env.CONTENT_SOURCE !== 'seed') {
    try {
      token = createEnquiryToken();
    } catch {
      /* Fail closed; phone and WhatsApp remain available. */
    }
  }
  return (
    <main id="main">
      <PageIntro
        name="Contact"
        path="/contact"
        eyebrow="LET’S BUILD SOMETHING SOLID"
        description="Share the work ahead. Our team is here to discuss your materials, quantities and delivery requirements."
      >
        Every project starts
        <br />
        <span className="serif">with a conversation.</span>
      </PageIntro>
      <section className="section">
        <div className="container contact-page-grid">
          <aside className="contact-details">
            <p className="eyebrow">TALK TO FULLERS</p>
            <h2>
              Good questions.
              <br />
              Practical next steps.
            </h2>
            <p>
              Tell us what you need and how to reach you. Our team can discuss the details before
              you make your supply plans.
            </p>
            <div className="contact-detail-block">
              <h3>Call our team</h3>
              <a className="contact-page-phone" href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                {settings.phone}
              </a>
            </div>
            <div className="contact-detail-block">
              <h3>Prefer a message?</h3>
              <a className="text-link" href={whatsappUrl(settings.phone)}>
                Enquire on WhatsApp <Arrow diagonal />
              </a>
            </div>
            <div className="contact-detail-block">
              <h3>Find us</h3>
              <p>{settings.location}</p>
              <a
                className="text-link"
                href="https://www.google.com/maps/search/?api=1&query=Sandazi+Farm+Bindura+Zimbabwe"
                target="_blank"
                rel="noopener noreferrer"
              >
                Find Bindura on the map <Arrow diagonal />
              </a>
              <p className="form-hint">Contact our team to confirm directions before travelling.</p>
            </div>
            <div className="enquiry-expectations">
              <p className="eyebrow">WHAT HAPPENS NEXT?</p>
              <p>
                Your enquiry is saved for our administrator to review. We’ll use the details you
                provide to discuss your requirements. If you need to speak to someone, phone or
                WhatsApp the team.
              </p>
            </div>
          </aside>
          <div className="enquiry-panel">
            <p className="eyebrow">YOUR NEXT PROJECT</p>
            <h2>Tell us what you’re building.</h2>
            <p>No exact quantities yet? Start with what you know.</p>
            {token ? (
              <EnquiryForm
                token={token}
                products={products.map(({ slug, name }) => ({ slug, name }))}
                selectedProduct={
                  products.some((p) => p.slug === query.product) ? query.product! : ''
                }
              />
            ) : (
              <div className="admin-notice">
                <p>
                  The enquiry form is currently unavailable. You can still call or message our team
                  using the contact details on this page.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
