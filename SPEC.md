# Fullers Aggregate — Custom Website & CMS Product Specification
Version: 1.0 — initial technical handoff, October 24, 2026

## 0. Nonnegotiable scope
- Build a new website and bespoke admin content management system **from scratch**. Do not use WordPress, Elementor, or a prebuilt CMS admin interface (e.g., Payload/Strapi).
- The original WordPress page at `http://fullersaggregate.co.zw/elementor-257/` and the supplied MHT archive are *content/brand/photo references only*; do not reuse its template code, Elementor widgets, structure verbatim, or unrelated placeholder portfolio/testimonial content.
- Implement a distinctive, mobile-first industrial visual design. Optimize for customer enquiries, user accessibility, fast page load, and crawlable content.
- Preserve brand-approved statistics/claims as supplied: `30+ Years of Experience`, `700+ Jobs Done`, `100% Client Satisfaction`, and `Award-Winning Manufacturer`. CMS should permit editing these numbers/phrases. Specific awards, certifications, client names and testimonial identities must not be invented.
- The old Past Projects examples are from an electrical services template and MUST NOT be imported. Build a fresh Projects module and listing/detail pages that remain hidden or in tasteful empty state until actual projects are published.
- SEO improvements are about good content, site architecture, indexing and usability, not a guarantee of Google ranking.

## 1. Source-validated business content
**Company:** Fullers Aggregate (PVT) LTD  
**Primary message:** 'Quality Products! On Time Deliveries!' (can rewrite to compelling natural copy without inventing guarantees)  
**Location:** Sandazi Farm in Bindura off Matepatepa Road, Zimbabwe  
**Phone / WhatsApp enquiry:** +263 78 747 8592 (validate WhatsApp number format from original link when wiring)  
**Company type:** concrete products manufacturer / supplier  
**Customer segments:** Residential, Commercial, Municipal  
**Strengths mentioned:** Concrete Products, Large Quantities, Delivery Trucks, On-Time Production, Quality Workmanship, Fair Estimates, Customer Service  
**Operations manager statement:** 'At Fullers, our clients are family and we are here to serve them as best as we can.' — attributed on old site to Mr. Williams, Operations Manager. Treat as pending publication approval.

Seven existing categories: Quarry Stones; Bricks; Half Moons; Interlocking Pavers; Manhole Rings; Culverts; Durawall. Do not invent sizes, specifications, prices, certifications or stock availability. The seven product records may initially have general, carefully bounded summaries and placeholders for specifications; provide the admin ability to complete each. Source imagery is available for the first four, plus equipment image.

## 2. Public site information architecture
- `/` — Home: hero with quarry/material imagery, value proposition, proof/statistics, featured products, customer segments, delivery/capability highlight, preview of published projects (only when there are real published projects), recent educational articles, quote contact CTA.
- `/about` — company overview, story, operating approach, proof points, optional leadership statement, location.
- `/products` — indexed overview of seven products with filtering by application if useful.
- `/products/[slug]` — individual product page: unique descriptive title/H1, purpose/use, product imagery, admin-provided sizes/specifications, related products, associated articles, inquiry action. Never fabricate technical specs.
- `/services` — product manufacturing/supply, bulk enquiries, delivery logistics as verified; avoid asserting unsupported delivery locations or time guarantees.
- `/projects` and `/projects/[slug]` — fresh portfolio driven by admin-created records. Do not publish sample/fake projects.
- `/blog` and `/blog/[slug]` — topical blog hub, accessible category/tag navigation, articles, related products/articles.
- `/contact` — business phone, WhatsApp, quote/contact form, original location/map link, clear response expectations without unsupported promises.
- Utility: custom 404, error, privacy policy and contact form notice, sitemap.xml, robots.txt, redirects for old URLs.
- Nav: Home, About, Products, Services, Projects (once ready), Blog, Contact + prominent Request Quote CTA. Good keyboard and mobile behavior.

## 3. Custom CMS routes and UX
`/admin` requires authentication. Build custom layouts/components and workflows; DO NOT expose an off-the-shelf CMS UI. Suggested sidebar:
- Dashboard (draft/published/scheduled counts, recent inquiries, SEO action queue)
- Blog Posts
- Products
- Projects
- Pages (editable structured content sections, no dangerous arbitrary HTML)
- Media Library
- Enquiries
- Redirects
- Site Settings (contact, social links, location, sitewide SEO, statistics, header/footer)
- Users & Roles / Audit (administrator only)

Design goals: clear writing surface with minimal distractions, full desktop/tablet usability, workable mobile admin layouts, autosave status, obvious Draft/Preview/Publish, consistent actionable error messages, undo/history, meaningful confirmations for destructive actions, keyboard access, WCAG 2.2 AA-minded component patterns.

## 4. Blog editor publishing flow — core differentiator
1. Create a post: title, automatically suggested editable slug, excerpt, author, category, tags, cover image.
2. Use a clean rich-text editor (Tiptap recommended) with headings H2/H3, lists, quotes, tables, links, inline media/captions, code where appropriate, and optional FAQ blocks. Store structured rich-text JSON rather than unsanitized HTML.
3. SEO sidebar with optional focus search query, editable SEO title and description, canonical (default self), Open Graph image and title, search appearance preview for mobile/desktop (illustrative only).
4. Live checks with explanations: missing/duplicate title, empty or generic description, multi-H1 mistakes, content with no useful introduction, missing descriptive alt for informative images, broken internal link targets, relevant product links, readability/heading structure. Distinguish hard failures from recommendations; avoid arbitrary keyword-density scores and claims of Google ranking certainty.
5. One-click internal link suggestions from existing posts/product pages based on taxonomy/title matching; editor approves each link. No automated link stuffing.
6. Draft, autosave, preview behind authentication/noindex, publish now, schedule publish, unpublish, edit published post, revisions and rollback. Publishing updates sitemap and cache/invalidation. Scheduled publishing must use dependable jobs/cron, not client browser time.
7. On publish: Article/BlogPosting JSON-LD using actual title, dates, image and author; breadcrumb schema where applicable; canonical, Open Graph and twitter/social meta; accessible semantic HTML.
8. Optional later: Search Console reporting and topic gap/low-click/low-CTR insights after verified integration; should not block MVP.

## 5. Product & project editors
**Product**: name, slug, summary, body, images, image alt, applications, sizes/specifications (only facts supplied by Fullers), status, featured flag, related products, SEO fields and optional FAQs, ordering.
**Project**: title, slug, real location at permissible granularity, date (optional), product/service types, client name only with permission, challenge, solution, delivery/photos, outcome, feature flag, publishing status, SEO fields. A project entry should never be public before approval.
**Page**: component/section-oriented blocks with controlled schemas for safety and brand consistency, not page-builder spaghetti.
**Media**: original asset, optimized variants, attribution/source, alt text per usage, dimensions, focal point, replace, crop preview, WebP/AVIF where supported, upload size limits.

## 6. SEO foundations (not optional)
- Next.js App Router with public content rendered server-side or pre-rendered into crawlable HTML. Do not render key product/article content solely in client JS.
- Unique metadata per page; clean canonical URLs, proper 301 redirects, noindex for drafts, auth routes and unready stubs.
- XML sitemap for indexable published canonical pages, robots.txt, page-specific Open Graph.
- Appropriate JSON-LD: Organization / LocalBusiness only with accurate business facts, BreadcrumbList, Article / BlogPosting; Product only when actual supported product data exists. Never use fabricated ratings/reviews/price/availability.
- Good semantic heading hierarchy, descriptive links, alt text, compressed images, responsive sizing, lazy-loading below the fold, priority image for hero, limited font requests, accessible navigation/forms.
- Distinct intent-matched pages targeting genuine service/product queries in Zimbabwe, especially Bindura and actual delivery regions. Verify service areas before locality pages; avoid doorway pages.
- Optimize Core Web Vitals; test real LCP/CLS/INP and not just Lighthouse. Maintain true content usefulness over mechanical SEO scores.
- Integrate GA4 optionally after privacy review, and enable Search Console setup/verification instructions; not required for initial site operation.
- Redirect former indexed WordPress URL paths to best-fitting new URL rather than blindly all to homepage; keep a redirect map admin UI.

## 7. Backend, security and ops
Recommended stack: Next.js + TypeScript; Tailwind; custom React components; Tiptap; PostgreSQL + Prisma; secure auth library such as Auth.js/Better Auth; S3-compatible image storage; server-side action/route handlers. No requirement for separate backend unless justified.

Data entities: User, Role, Post, PostRevision, PostCategory, Tag, Product, Project, Media, PageContent, SiteSettings, Redirect, Inquiry, AuditLog. Include unique stable slugs, UTC timestamps, status enums (draft/scheduled/published/archived), publishAt and updatedAt, soft delete as appropriate, appropriate relational constraints/indexes.

- Auth: password hashing, protected sessions, CSRF/session defenses, role-based authorization for every mutation, login rate limiting, MFA for admin if feasible, secure password reset.
- Content: sanitize rendered rich text, restrict embeds and upload MIME types, avoid stored XSS, validate schema on server, prevent unauthorized file access.
- Forms: server-side validation, bot/spam and rate limits, careful handling/storage of contact personal info, spam honeypot/captcha if required; do not publicly expose enquiries.
- Reliability: staging environment, automated backups and tested restore steps, environment variable management, health checks, database migrations, error logging, deployment playbook.
- Performance: cache invalidation on publish/update, avoid stale article previews, test all links/structured data and build.

## 8. Design system direction
Industrial but refined, not an Elementor clone. Start with supplied blue/charcoal Fullers logo; strong typography, white/off-white negative space, stone/slate accents, image-forward sections; visible quote/WhatsApp actions. Build reusable responsive page blocks, accessible states, intentional whitespace and coherent product cards.

## 9. Asset provenance and usage
See `CONTENT_AND_ASSET_INVENTORY.md`; only include actual relevant company/product images in the initial build. Source images are from the user-supplied WordPress MHT archive; confirm reuse rights, photographer attribution as needed. Do not import placeholder electrician photos, dummy logos, generic testimonies or copyrighted third-party stock.

## 10. Acceptance tests and milestones
**M1 Foundation:** repo bootstrap, standards, DB models/migrations, authentication, app shells, public site design tokens, CI/lint/type checks, example seed data with draft-only examples; all tests pass.
**M2 Public pages:** polished responsive home/about/products/services/contact, seven product routes, real original images, enquiry flow; accessibility + responsive QA.
**M3 Custom CMS:** admin dashboard, CRUD products/blog/projects/pages/media/settings, editor autosave/preview/scheduled publish/rollback, RBAC + audit; CMS e2e tests.
**M4 SEO + release:** metadata, schema, sitemap, redirects, CWV improvements, Search Console setup, backups, staged release and UAT.

QA minimum: no placeholder electrical projects exposed; no generic fake testimonials; mobile nav and WhatsApp work; all published content crawlable in raw HTML; drafts non-indexable; valid sitemap/robots and canonical; unique slugs; metadata correct; image alt and optimization; publish invalidates cache; unauthenticated mutation rejected; contact spam guard works; old URLs redirected appropriately.

## 11. Collaboration and decisions
- Keep `AGENTS.md` (agent rules), `NOW.md` (current state), `TASKS.md` (milestone board) and `LOG.md` (decisions/completed work). Make one small vertical slice per PR and report test/QA evidence in PR description.
- Codex must not deploy to production, claim unverified business specifications, or overwrite old live WordPress hosting without explicit approval.
- Open questions to record rather than block development: final hosting, logo refresh vs retain, exact award details, product specs and service regions, privacy policy text, email receiving enquiries, chosen deployment workflow.
