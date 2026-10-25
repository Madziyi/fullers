# M1: establish Fullers website and custom CMS foundation

The supplied folder contained reference content and assets only. This builds a greenfield Next.js application with a complete responsive homepage, shared navigation/footer, a filterable seven-product catalogue and individual product routes. It uses only the six bundled assets, explicit accessible fallbacks for missing photographs and no invented measurements, pricing, projects or testimonials.

The bespoke administrator experience includes real credentials authentication, database-backed account throttling, active-account/role authorization, catalogue readiness and editable SiteSettings. Updating the approved statistics saves an audit entry in the same database transaction and refreshes the public website. The PostgreSQL contract and migration establish future articles, revisions, taxonomy, product links, projects, controlled pages, media, redirects and private enquiries without installing a CMS product.

Public content is server-rendered with unique metadata, canonical/social fields, organization/breadcrumb JSON-LD, sitemap and robots. Auth routes are noindex. The original handoff is preserved on main; this branch does not deploy or modify the old hosting.

## Validation

- ESLint and strict TypeScript pass; 17 unit/security/action tests pass.
- PostgreSQL migration, idempotent seed and database integration pass: private lifecycle visibility, unique slugs, publication constraints, rollback and no seeded projects/posts.
- Production Webpack build passes. The Windows sandbox prevents Turbopack junction creation; Webpack is the supported portable build selected here.
- All 12 desktop/mobile functional and accessibility browser tests pass. Axe reports zero violations for the selected WCAG A/AA rules across four routes at both viewports. Screenshots and detail are in [QA evidence](QA.md).
- Dependency audit reports zero vulnerabilities. CI repeats checks with disposable PostgreSQL 17 and uploads browser evidence.

## Screenshots

![Desktop homepage](https://github.com/Madziyi/fullers/blob/feat/m1-foundation/docs/screenshots/home-desktop-hero.png?raw=true)

![Mobile homepage](https://github.com/Madziyi/fullers/blob/feat/m1-foundation/docs/screenshots/home-mobile-hero.png?raw=true)

Full homepage, catalogue, administrator and sign-in screenshots for both viewports are linked in [QA evidence](QA.md).

## Remaining work / review boundary

- M2: dedicated about/services/contact pages and validated, spam-protected enquiry handling. The catalogue/detail routes are already delivered here.
- M3: full custom CRUD, article writing surface, practical SEO guidance, approved internal product links, autosave, authenticated previews, dependable scheduling, revisions/rollback and media/page/user/redirect management.
- M4: staging and release workflow, verified old URL mapping, MFA/recovery/edge throttling, CSP nonce review, monitoring, backup/restore exercise, field CWV and full accessibility/UAT review.
- Fullers inputs: three missing product photographs, confirmed specifications and delivery regions, imagery rights, award details, privacy text and enquiry recipient. The legacy page was inaccessible; WhatsApp uses the approved supplied number and still needs confirmation against the original link.

See [CMS contract](CMS_SCHEMA.md), [operations/release gates](OPERATIONS.md) and [task board](../TASKS.md). Stop at this review before continuing to the next milestone. No production release is included.
