import Image from 'next/image';
import Link from 'next/link';
import { getSettings } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
import { PageIntro } from '@/components/page-intro';
import { ContactBand } from '@/components/chrome';
import { Arrow, Symbol } from '@/components/icons';
export const metadata = pageMetadata(
  'About Fullers Aggregate',
  'Meet Fullers Aggregate, an award-winning concrete products manufacturer rooted in Bindura, Zimbabwe. Quality workmanship, personal service and practical supply conversations.',
  '/about',
);
export default async function About() {
  const settings = await getSettings();
  return (
    <main id="main">
      <PageIntro
        name="About"
        path="/about"
        eyebrow="THE PEOPLE BEHIND THE PRODUCTS"
        description="Concrete products. Personal service. A commitment to the work you’re building."
      >
        Rooted in Bindura.
        <br />
        <span className="serif">Built around you.</span>
      </PageIntro>
      <section className="section">
        <div className="container story-grid">
          <div className="story-photo">
            <Image
              src="/assets/delivery-equipment.webp"
              alt="Fullers Aggregate delivery truck and loader at the yard"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 50vw"
            />
            <span className="image-label">FULLERS AGGREGATE / BINDURA</span>
          </div>
          <div className="story-copy">
            <p className="eyebrow">QUALITY BEGINS WITH CARE</p>
            <h2>
              Solid products.
              <br />A personal approach.
            </h2>
            <p className="lead">
              We’re Fullers Aggregate (PVT) LTD, an award-winning manufacturer of concrete products
              in Zimbabwe.
            </p>
            <p>
              Our base is Sandazi Farm in Bindura, off Matepatepa Road. From here, we supply
              concrete products and quarry materials for residential, commercial and municipal
              projects.
            </p>
            <p>
              We believe a good supply conversation starts with your requirements. Whether you’re
              planning a home, an outdoor space or an infrastructure project, our team is here to
              discuss the materials and quantities you need.
            </p>
            <Link className="text-link" href="/products">
              Explore our product range <Arrow diagonal />
            </Link>
          </div>
        </div>
      </section>
      <section className="about-proof">
        <div className="container">
          <p className="eyebrow">THE EXPERIENCE WE BRING</p>
          <div className="about-proof-grid">
            {[
              [settings.experienceValue, settings.experienceLabel],
              [settings.jobsValue, settings.jobsLabel],
              [settings.satisfactionValue, settings.satisfactionLabel],
            ].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="award-line">
            <Symbol type="quality" />
            {settings.awardClaim}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HOW WE APPROACH THE WORK</p>
              <h2>
                Care in the making.
                <br />
                Clarity in the conversation.
              </h2>
            </div>
            <p className="section-heading-aside">
              Good materials matter.
              <br />
              So does the way we work with you.
            </p>
          </div>
          <div className="sector-grid">
            {[
              {
                icon: 'quality' as const,
                title: 'Quality workmanship',
                copy: 'Concrete products made with care, with your project requirements at the centre of the conversation.',
              },
              {
                icon: 'building' as const,
                title: 'Fair estimates',
                copy: 'Tell us your quantities and site requirements so we can discuss a quotation that reflects the work ahead.',
              },
              {
                icon: 'truck' as const,
                title: 'Planning together',
                copy: 'Talk through production and delivery arrangements with our team before you finalise your supply plans.',
              },
            ].map((item) => (
              <article className="sector" key={item.title}>
                <Symbol type={item.icon} />
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="location-strip">
        <div className="container">
          <div>
            <p className="eyebrow">COME BACK TO THE SOURCE</p>
            <h2>Find us in Bindura.</h2>
            <p>{settings.location}</p>
          </div>
          <Link className="text-link" href="/contact">
            Plan a conversation with our team <Arrow diagonal />
          </Link>
        </div>
      </section>
      <ContactBand settings={settings} />
    </main>
  );
}
