import Image from 'next/image';
import Link from 'next/link';
import { getSettings } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
import { PageIntro } from '@/components/page-intro';
import { ContactBand } from '@/components/chrome';
import { Arrow, Symbol } from '@/components/icons';
export const metadata = pageMetadata(
  'Concrete manufacturing, supply & delivery enquiries',
  'Discuss concrete product manufacturing, quarry material supply, bulk quantities and delivery arrangements with Fullers Aggregate in Bindura, Zimbabwe.',
  '/services',
);
export default async function Services() {
  const settings = await getSettings();
  return (
    <main id="main">
      <PageIntro
        name="Services"
        path="/services"
        eyebrow="FROM OUR YARD TO YOUR NEXT PROJECT"
        description="Practical support for the products, quantities and supply arrangements behind your build."
      >
        More than materials.
        <br />
        <span className="serif">A supply conversation.</span>
      </PageIntro>
      <section className="section">
        <div className="container service-rows">
          {[
            {
              n: '01',
              icon: 'quality' as const,
              title: 'Concrete products & quarry materials',
              copy: 'Explore our range of concrete products and quarry stones. Our team can help you discuss the options and confirm the details needed for your project.',
              detail:
                'Quarry Stones · Bricks · Half Moons · Interlocking Pavers · Manhole Rings · Culverts · Durawall',
              link: '/products',
              cta: 'Explore the range',
            },
            {
              n: '02',
              icon: 'stone' as const,
              title: 'Large-quantity enquiries',
              copy: 'Planning a bigger job? Share your product list and quantities with us. We’ll discuss your requirements, production arrangements and a quotation with you.',
              detail:
                'Bring your quantities, intended use and required dates to the conversation. Availability and timing are confirmed directly.',
              link: '/contact',
              cta: 'Discuss a bulk enquiry',
            },
            {
              n: '03',
              icon: 'truck' as const,
              title: 'Delivery arrangements',
              copy: 'Fullers has delivery trucks to support product supply. Talk to us about your site location, access and quantities so delivery arrangements can be discussed for your project.',
              detail:
                'Coverage, vehicle suitability, costs and timing need confirmation for each enquiry. Please check arrangements with our team before planning your delivery.',
              link: '/contact',
              cta: 'Talk through your delivery',
            },
          ].map((service) => (
            <article className="service-row" key={service.n}>
              <div className="service-index">
                <span>{service.n}</span>
                <Symbol type={service.icon} />
              </div>
              <div>
                <h2>{service.title}</h2>
                <p>{service.copy}</p>
                <p className="service-detail">{service.detail}</p>
              </div>
              <Link className="text-link" href={service.link}>
                {service.cta}
                <Arrow diagonal />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="supply-feature">
        <div className="supply-feature-image">
          <Image
            src="/assets/delivery-equipment.webp"
            alt="Fullers Aggregate loader and delivery truck"
            fill
            sizes="(max-width: 800px) 100vw, 55vw"
          />
        </div>
        <div>
          <p className="eyebrow">A LITTLE PLANNING GOES A LONG WAY</p>
          <h2>
            Help us understand
            <br />
            <span className="serif">the work ahead.</span>
          </h2>
          <ol className="planning-list">
            <li>
              <strong>Your materials</strong>
              <span>Products, intended use and any confirmed specifications.</span>
            </li>
            <li>
              <strong>Your quantities</strong>
              <span>Tell us what you need, or ask what information to prepare.</span>
            </li>
            <li>
              <strong>Your site</strong>
              <span>Location, access details and whether delivery is needed.</span>
            </li>
            <li>
              <strong>Your timing</strong>
              <span>Share your planned dates so arrangements can be discussed.</span>
            </li>
          </ol>
          <Link className="button" href="/contact">
            Start your enquiry <Arrow diagonal />
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="container service-questions">
          <div>
            <p className="eyebrow">BEFORE YOU GET STARTED</p>
            <h2>A few useful details.</h2>
            <p>We keep the conversation specific to your project.</p>
          </div>
          <div>
            <details>
              <summary>Can you confirm sizes and specifications?</summary>
              <p>
                Our team can discuss the product details Fullers supplies. Share your requirements
                and confirm suitability with the professional responsible for your project.
              </p>
            </details>
            <details>
              <summary>Can I arrange delivery to my site?</summary>
              <p>
                Send your site location and access details with your enquiry. Our team will discuss
                whether and how delivery can be arranged. No delivery coverage or timing is assumed.
              </p>
            </details>
            <details>
              <summary>How do I request a quotation?</summary>
              <p>
                Use our <Link href="/contact">enquiry form</Link>, WhatsApp or phone. Include your
                product, quantities and site location where possible. A submitted enquiry is a
                request for discussion, not a confirmed order.
              </p>
            </details>
          </div>
        </div>
      </section>
      <ContactBand settings={settings} />
    </main>
  );
}
