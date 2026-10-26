import Image from 'next/image';
import Link from 'next/link';
import { getProducts, getSettings } from '@/lib/content';
import { pageMetadata, jsonLd, siteUrl } from '@/lib/seo';
import { whatsappUrl } from '@/lib/catalogue';
import { Arrow, Symbol } from '@/components/icons';
import { ProductCard } from '@/components/product-card';
import { ContactBand } from '@/components/chrome';
import { getPublishedArticles } from '@/lib/articles';
import { getPublishedPage, getPublishedProjects, isTextSections } from '@/lib/pages-projects';
import { StructuredPageSection } from '@/components/structured-page';
export async function generateMetadata() {
  const editable = await getPublishedPage('home');
  if (editable) {
    const seo = (editable.seo && typeof editable.seo === 'object' ? editable.seo : {}) as {
      title?: string;
      description?: string;
    };
    return pageMetadata(seo.title || editable.title, seo.description || '', '/');
  }
  const s = await getSettings();
  return pageMetadata(s.seoTitle, s.seoDescription, '/');
}
export default async function Home() {
  const editable = await getPublishedPage('home');
  const [settings, products, articles, projects] = await Promise.all([
    getSettings(),
    getProducts(),
    getPublishedArticles(),
    getPublishedProjects(),
  ]);
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: settings.companyName,
            url: siteUrl,
            telephone: settings.phone,
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Sandazi Farm, off Matepatepa Road',
              addressLocality: 'Bindura',
              addressCountry: 'ZW',
            },
          }),
        }}
      />
      <section className="hero">
        <div className="hero-photo">
          <Image
            src="/assets/quarry-stones.webp"
            alt="Quarry stones at Fullers Aggregate in Bindura"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="hero-shade" />
        <div className="container hero-content">
          <p className="eyebrow">
            <span className="tiny-square" /> THE FOUNDATION OF SOMETHING GREAT
          </p>
          <h1>
            Built on quality.
            <br />
            Delivered with
            <br />
            <span>commitment.</span>
          </h1>
          <p className="hero-description">
            From the first stone to the finishing touch. Concrete products
            <br className="desktop-break" /> and quarry materials for the places you’re building.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/products">
              Explore our products <Arrow diagonal />
            </Link>
            <a className="hero-secondary" href={whatsappUrl(settings.phone)}>
              Let’s talk about your project <Arrow />
            </a>
          </div>
          <div className="hero-location">
            <span className="location-mark" aria-hidden="true">
              ⌖
            </span>{' '}
            ROOTED IN BINDURA, ZIMBABWE
          </div>
        </div>
        <div className="hero-caption">
          <span>01 / THE MATERIALS THAT MATTER</span>
          <span>FULLERS AGGREGATE</span>
        </div>
      </section>
      <section className="proof-strip" aria-label="Fullers in numbers">
        <div className="container proof-grid">
          {[
            [settings.experienceValue, settings.experienceLabel],
            [settings.jobsValue, settings.jobsLabel],
            [settings.satisfactionValue, settings.satisfactionLabel],
          ].map(([value, label]) => (
            <div className="stat" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
          <div className="award">
            <Symbol type="quality" />
            <span>{settings.awardClaim}</span>
          </div>
        </div>
      </section>
      <section className="section intro-section" id="about">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow">SOLID MATERIALS. STRONGER POSSIBILITIES.</p>
            <h2>
              Good things start
              <br />
              with a <span className="serif">solid foundation.</span>
            </h2>
          </div>
          <div className="intro-copy">
            <p>
              We’re Fullers Aggregate. An award-winning manufacturer of concrete products, with our
              roots firmly planted in Bindura, Zimbabwe.
            </p>
            <p>
              From homes and commercial spaces to municipal infrastructure, we bring quality
              workmanship and personal service to the materials behind your project.
            </p>
            <Link className="text-link" href="/about">
              Get to know Fullers <Arrow diagonal />
            </Link>
          </div>
        </div>
      </section>
      <section className="section products-section" id="products">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MADE FOR THE WORK AHEAD</p>
              <h2>
                The building blocks
                <br />
                of your next project.
              </h2>
            </div>
            <div className="section-heading-aside">
              <p>
                From groundwork to the final detail,
                <br />
                find the right place to start.
              </p>
              <Link className="text-link" href="/products">
                View all products <Arrow diagonal />
              </Link>
            </div>
          </div>
          <div className="product-grid featured-grid">
            {products
              .filter((p) => p.featured)
              .slice(0, 4)
              .map((product, index) => (
                <ProductCard key={product.slug} product={product} index={index} />
              ))}
          </div>
          <div className="range-note">
            <span>MORE FROM THE FULLERS RANGE</span>
            <Link href="/products/manhole-rings">Manhole Rings ↗</Link>
            <Link href="/products/culverts">Culverts ↗</Link>
            <Link href="/products/durawall">Durawall ↗</Link>
          </div>
        </div>
      </section>
      <section className="capabilities" id="capabilities">
        <div className="capability-image">
          <Image
            src="/assets/delivery-equipment.webp"
            alt="Loader and Fullers Aggregate delivery truck at the yard"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
          />
          <div className="image-label">OUR YARD. YOUR NEXT CHAPTER.</div>
        </div>
        <div className="capability-copy">
          <p className="eyebrow">MORE THAN MATERIALS</p>
          <h2>
            The right products.
            <br />
            The people to
            <br />
            <span className="serif">keep you moving.</span>
          </h2>
          <p>
            Quality products are only part of the story. We work with you on quantities, production
            and delivery arrangements, so you can plan the work ahead.
          </p>
          <div className="capability-points">
            <div>
              <Symbol type="stone" />
              <span>
                <strong>Thinking big?</strong>Talk to us about large quantities.
              </span>
            </div>
            <div>
              <Symbol type="truck" />
              <span>
                <strong>From yard to site.</strong>Discuss delivery with our team.
              </span>
            </div>
            <div>
              <Symbol type="quality" />
              <span>
                <strong>Care in every conversation.</strong>Fair estimates. Personal service.
              </span>
            </div>
          </div>
          <a className="text-link" href={whatsappUrl(settings.phone)}>
            Plan your supply with us <Arrow diagonal />
          </a>
        </div>
      </section>
      <section className="section sectors">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DIFFERENT PROJECTS. THE SAME COMMITMENT.</p>
              <h2>
                For the spaces we live,
                <br />
                work and grow in.
              </h2>
            </div>
            <p className="section-heading-aside">
              Whatever you’re building,
              <br />
              let’s start on solid ground.
            </p>
          </div>
          <div className="sector-grid">
            {[
              {
                n: '01',
                title: 'Residential',
                copy: 'From a new home to an outdoor space. Materials for your next personal project.',
              },
              {
                n: '02',
                title: 'Commercial',
                copy: 'Concrete products and quarry materials for the places where business happens.',
              },
              {
                n: '03',
                title: 'Municipal',
                copy: 'Talk to us about the materials behind your infrastructure and community projects.',
              },
            ].map((sector) => (
              <div className="sector" key={sector.n}>
                <span className="sector-number">{sector.n}</span>
                <Symbol type="building" />
                <h3>{sector.title}</h3>
                <p>{sector.copy}</p>
                <a
                  href={whatsappUrl(settings.phone, `${sector.title.toLowerCase()} projects`)}
                  aria-label={`Discuss ${sector.title.toLowerCase()} projects`}
                >
                  <Arrow diagonal />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      {projects.length > 0 && (
        <section className="section home-blog">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">FULLERS AT WORK</p>
                <h2>Built with Fullers.</h2>
              </div>
              <Link className="text-link" href="/projects">
                All projects <Arrow diagonal />
              </Link>
            </div>
            <div className="blog-grid">
              {projects.slice(0, 3).map((project) => (
                <article key={project.id}>
                  <p className="eyebrow">{project.location || 'FULLERS AGGREGATE'}</p>
                  <h3>
                    <Link href={`/projects/${project.slug}`}>{project.title}</Link>
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      {articles.length > 0 && (
        <section className="section home-blog">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">FROM THE FULLERS YARD</p>
                <h2>Ideas for what you’re building.</h2>
              </div>
              <Link className="text-link" href="/blog">
                All articles <Arrow diagonal />
              </Link>
            </div>
            <div className="blog-grid">
              {articles.slice(0, 3).map((article) => (
                <article key={article.slug}>
                  <p className="eyebrow">{article.categoryName ?? 'FULLERS AGGREGATE'}</p>
                  <h3>
                    <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <p>{article.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      {editable && isTextSections(editable.sections) && (
        <StructuredPageSection title={editable.title} sections={editable.sections} />
      )}
      <ContactBand settings={settings} />
    </main>
  );
}
