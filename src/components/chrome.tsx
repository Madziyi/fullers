import Image from 'next/image';
import Link from 'next/link';
import { Arrow } from './icons';
import { MobileMenu } from './mobile-menu';
import { type Settings, whatsappUrl } from '@/lib/catalogue';
const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Products', href: '/products' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];
export function Header({ settings }: { settings: Settings }) {
  return (
    <>
      <div className="utility">
        <div className="container utility-inner">
          <span>BUILT IN BINDURA. BUILDING ZIMBABWE.</span>
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>
            Let’s talk <span className="utility-phone">{settings.phone}</span> <Arrow diagonal />
          </a>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" aria-label="Fullers Aggregate home" className="brand">
            <Image
              src="/assets/fullers-logo.webp"
              alt="Fullers Aggregate"
              width={150}
              height={54}
              priority
            />
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav.map((item) => (
              <Link href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link className="button button-small header-quote" href="/contact">
            Request a quote <Arrow diagonal />
          </Link>
          <MobileMenu items={nav} />
        </div>
      </header>
    </>
  );
}
export function ContactBand({ settings }: { settings: Settings }) {
  return (
    <section className="contact-band" id="contact">
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">LET’S BUILD SOMETHING SOLID</p>
          <h2>
            Your next project
            <br />
            starts with a conversation.
          </h2>
          <p>
            Tell us what you’re building. We’ll help you discuss products,
            <br className="desktop-break" /> quantities and delivery for your site.
          </p>
        </div>
        <div className="contact-actions">
          <a className="button button-white" href={whatsappUrl(settings.phone)}>
            Request a quote on WhatsApp <Arrow diagonal />
          </a>
          <a className="contact-phone" href={`tel:${settings.phone.replace(/\s/g, '')}`}>
            {settings.phone}
          </a>
          <span>Or give our team a call</span>
        </div>
      </div>
    </section>
  );
}
export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="Fullers Aggregate home">
            <Image
              src="/assets/fullers-logo.webp"
              alt="Fullers Aggregate"
              width={150}
              height={54}
            />
          </Link>
          <p>
            Quality products.
            <br />
            On-time deliveries.
            <br />
            <strong>A stronger foundation.</strong>
          </p>
        </div>
        <div>
          <h2>Explore Fullers</h2>
          <Link href="/about">Our company</Link>
          <Link href="/products">Our products</Link>
          <Link href="/services">Our capabilities</Link>
          <Link href="/contact">Get in touch</Link>
          <Link href="/contact/enquiry-notice">Enquiry form information</Link>
        </div>
        <div>
          <h2>Find us</h2>
          <p>{settings.location}</p>
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Sandazi+Farm+Bindura+Zimbabwe"
            target="_blank"
            rel="noopener noreferrer"
          >
            Find Bindura on the map ↗
          </a>
        </div>
        <div className="footer-note">
          <span className="eyebrow">FROM OUR YARD TO YOUR SITE</span>
          <p>
            Concrete products and quarry stones for residential, commercial and municipal projects.
          </p>
          <Link href="/products" className="text-link">
            Find your materials <Arrow />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.companyName}
        </span>
        <span>Made for solid beginnings.</span>
      </div>
    </footer>
  );
}
